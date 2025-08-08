from django.shortcuts import render
from rest_framework import viewsets, generics
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Sum
from django.utils.timezone import now
from rest_framework import filters

from .models import Branch, Item, Inventory, Sale
from .serializers import BranchSerializer, ItemSerializer, InventorySerializer, SaleSerializer

from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import status

# Branch ViewSet
class BranchViewSet(viewsets.ModelViewSet):
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer

# Item ViewSet
class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer

# Inventory ViewSet with branch-level access
class InventoryViewSet(viewsets.ModelViewSet):
    queryset = Inventory.objects.all()
    serializer_class = InventorySerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['item__name']  # you can add 'item__barcode', 'item__category' if needed

    def get_queryset(self):
        user = self.request.user
        branch_id = self.request.query_params.get('branch_id')

        qs = super().get_queryset()

        if user.is_authenticated and not user.is_admin:
            qs = qs.filter(branch=user.branch)
        elif branch_id:
            qs = qs.filter(branch_id=branch_id)

        return qs


# Sale ViewSet with branch-level access
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

# Dashboard Summary View
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

# Custom Token Serializer
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user

        data['is_admin'] = user.is_admin
        data['is_branch'] = user.branch is not None
        data['branch_id'] = user.branch.id if user.branch else None

        return data

# Custom Token View
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


