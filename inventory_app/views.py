from django.shortcuts import render
from django.db.models import Sum
from django.db import transaction
from django.utils.timezone import now

from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Branch, Item, Inventory, Sale
from .serializers import BranchSerializer, ItemSerializer, InventorySerializer, SaleSerializer


# ==========================
#   Branch & Item ViewSets
# ==========================
class BranchViewSet(viewsets.ModelViewSet):
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer


class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer


# ==========================
#   Inventory ViewSet
# ==========================
class InventoryViewSet(viewsets.ModelViewSet):
    queryset = Inventory.objects.all()
    serializer_class = InventorySerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['item__name']  # can extend with 'item__barcode', 'item__category'

    def get_queryset(self):
        user = self.request.user
        branch_id = self.request.query_params.get('branch_id')
        qs = super().get_queryset()

        if user.is_authenticated and not user.is_admin:
            qs = qs.filter(branch=user.branch)
        elif branch_id:
            qs = qs.filter(branch_id=branch_id)

        return qs


# ==========================
#   Sale ViewSet
# ==========================
class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.all()
    serializer_class = SaleSerializer

    def get_queryset(self):
        user = self.request.user
        branch_id = self.request.query_params.get('branch_id')

        if user.is_authenticated and not user.is_admin:
            return Sale.objects.filter(branch=user.branch)
        if branch_id:
            return Sale.objects.filter(branch_id=branch_id)

        return Sale.objects.all()

    def perform_create(self, serializer):
        # ✅ Serializer handles stock deduction & total calculation
        serializer.save()


# ==========================
#   Dashboard Summary
# ==========================
@api_view(['GET'])
def dashboard_summary(request):
    user = request.user
    branch_id = request.query_params.get('branch_id')
    today = now().date()

    sales_qs = Sale.objects.filter(timestamp__date=today)
    inventory_qs = Inventory.objects.all()

    if user.is_authenticated and not user.is_admin:
        sales_qs = sales_qs.filter(branch=user.branch)
        inventory_qs = inventory_qs.filter(branch=user.branch)
    elif branch_id:
        sales_qs = sales_qs.filter(branch_id=branch_id)
        inventory_qs = inventory_qs.filter(branch_id=branch_id)

    total_stock = inventory_qs.aggregate(total=Sum('quantity'))['total'] or 0
    total_sales = sales_qs.aggregate(total=Sum('total_amount'))['total'] or 0
    low_stock_count = inventory_qs.filter(quantity__lt=10).count()

    return Response({
        "total_stock": total_stock,
        "total_sales": total_sales,
        "low_stock_alerts": low_stock_count,
    })


# ==========================
#   JWT Customization
# ==========================
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user

        data['is_admin'] = user.is_admin
        data['is_branch'] = user.branch is not None
        data['branch_id'] = user.branch.id if user.branch else None

        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


# ==========================
#   Stock In
# ==========================
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def stock_in(request):
    user = request.user
    if not user.is_admin:
        return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

    branch_id = request.data.get('branch_id')
    item_id = request.data.get('item_id')
    quantity = int(request.data.get('quantity', 0))

    if quantity <= 0:
        return Response({"detail": "Quantity must be positive"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        branch = Branch.objects.get(id=branch_id)
        item = Item.objects.get(id=item_id)
    except (Branch.DoesNotExist, Item.DoesNotExist):
        return Response({"detail": "Branch or Item not found"}, status=status.HTTP_404_NOT_FOUND)

    main_branch = Branch.objects.filter(name__icontains='main').first()
    if not main_branch:
        return Response({"detail": "Main branch not configured"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        with transaction.atomic():
            main_inventory = Inventory.objects.select_for_update().get(branch=main_branch, item=item)
            if main_inventory.quantity < quantity:
                return Response({"detail": "Not enough stock in main branch"}, status=status.HTTP_400_BAD_REQUEST)

            # Subtract from main
            main_inventory.quantity -= quantity
            main_inventory.save()

            # Add to target branch
            target_inventory, _ = Inventory.objects.get_or_create(branch=branch, item=item)
            target_inventory.quantity += quantity
            target_inventory.save()

        return Response({"detail": "Stock in successful"})
    except Inventory.DoesNotExist:
        return Response({"detail": "Item not found in main branch inventory"}, status=status.HTTP_404_NOT_FOUND)


# ==========================
#   Stock Out
# ==========================
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def stock_out(request):
    user = request.user

    # ✅ Allow admins OR users with `can_stock` permission
    if not (user.is_admin or getattr(user, 'can_stock', False)):
        return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

    from_branch_id = request.data.get('from_branch_id')
    to_branch_id = request.data.get('to_branch_id')
    item_id = request.data.get('item_id')
    quantity = int(request.data.get('quantity', 0))

    if quantity <= 0:
        return Response({"detail": "Quantity must be positive"}, status=status.HTTP_400_BAD_REQUEST)

    if not (from_branch_id and to_branch_id and item_id):
        return Response({"detail": "Missing parameters"}, status=status.HTTP_400_BAD_REQUEST)

    # Non-admins can only stock out from their own branch
    if not user.is_admin and str(user.branch.id) != str(from_branch_id):
        return Response({"detail": "Permission denied for this branch"}, status=status.HTTP_403_FORBIDDEN)

    try:
        from_branch = Branch.objects.get(id=from_branch_id)
        to_branch = Branch.objects.get(id=to_branch_id)
        item = Item.objects.get(id=item_id)
    except (Branch.DoesNotExist, Item.DoesNotExist):
        return Response({"detail": "Branch or Item not found"}, status=status.HTTP_404_NOT_FOUND)

    try:
        with transaction.atomic():
            from_inventory = Inventory.objects.select_for_update().get(branch=from_branch, item=item)
            if from_inventory.quantity < quantity:
                return Response({"detail": "Not enough stock in source branch"}, status=status.HTTP_400_BAD_REQUEST)

            # Deduct from source
            from_inventory.quantity -= quantity
            from_inventory.save()

            # Add to target
            to_inventory, _ = Inventory.objects.get_or_create(
                branch=to_branch,
                item=item,
                defaults={'quantity': 0}
            )
            to_inventory.quantity += quantity
            to_inventory.save()

        return Response({"detail": "Stock out successful"})
    except Inventory.DoesNotExist:
        return Response({"detail": "Item not found in source branch inventory"}, status=status.HTTP_404_NOT_FOUND)
