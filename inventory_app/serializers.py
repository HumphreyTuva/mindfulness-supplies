from rest_framework import serializers
from .models import Branch, Item, Inventory, Sale, User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

# Branch
class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = '__all__'

# Item
class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = '__all__'

# Inventory
class InventorySerializer(serializers.ModelSerializer):
    item = ItemSerializer(read_only=True)
    item_id = serializers.PrimaryKeyRelatedField(
        queryset=Item.objects.all(), source='item', write_only=True
    )
    branch = BranchSerializer(read_only=True)
    branch_id = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.all(), source='branch', write_only=True
    )

    class Meta:
        model = Inventory
        fields = ['id', 'branch', 'branch_id', 'item', 'item_id', 'quantity']

# Sale
class SaleSerializer(serializers.ModelSerializer):
    item = ItemSerializer(read_only=True)
    item_id = serializers.PrimaryKeyRelatedField(
        queryset=Item.objects.all(), source='item', write_only=True
    )
    branch = BranchSerializer(read_only=True)
    branch_id = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.all(), source='branch', write_only=True
    )

    class Meta:
        model = Sale
        fields = ['id', 'branch', 'branch_id', 'item', 'item_id', 'quantity', 'total_amount', 'timestamp']
        read_only_fields = ['total_amount', 'timestamp']

    def validate(self, data):
        item = data['item']
        branch = data['branch']
        quantity = data['quantity']

        try:
            inventory = Inventory.objects.get(item=item, branch=branch)
        except Inventory.DoesNotExist:
            raise serializers.ValidationError("Item is not stocked in this branch.")

        if inventory.quantity < quantity:
            raise serializers.ValidationError("Not enough stock available for this item.")

        return data

    def create(self, validated_data):
        item = validated_data['item']
        branch = validated_data['branch']
        quantity = validated_data['quantity']

        # Reduce inventory
        inventory = Inventory.objects.get(item=item, branch=branch)
        inventory.quantity -= quantity
        inventory.save()

        # Calculate total
        validated_data['total_amount'] = item.price * quantity
        return super().create(validated_data)

# Custom Login Token
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['is_admin'] = user.is_admin or user.is_superuser  # ✅ include superusers
        token['branch_id'] = user.branch.id if user.branch else None
        return token


    def validate(self, attrs):
        data = super().validate(attrs)
        data['is_admin'] = self.user.is_admin or self.user.is_superuser  # ✅ include superusers
        data['branch_id'] = self.user.branch.id if self.user.branch else None
        return data

