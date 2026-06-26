from rest_framework import serializers
from .models import Branch, User, Item, Inventory, Sale

# -----------------------
# BRANCH
# -----------------------
class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ['id', 'name', 'location']


# -----------------------
# USER
# -----------------------
class UserSerializer(serializers.ModelSerializer):
    branch = BranchSerializer(read_only=True)
    branch_id = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.all(), source='branch', write_only=True, allow_null=True
    )

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'is_admin', 'can_stock',
            'branch', 'branch_id'
        ]


# -----------------------
# ITEM
# -----------------------
class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = ['id', 'name']  # Item has no price anymore


# -----------------------
# INVENTORY
# -----------------------
class InventorySerializer(serializers.ModelSerializer):
    branch = BranchSerializer(read_only=True)
    branch_id = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.all(), source='branch', write_only=True, required=False
    )
    item = ItemSerializer(read_only=True)
    item_id = serializers.PrimaryKeyRelatedField(
        queryset=Item.objects.all(), source='item', write_only=True, required=False
    )

    class Meta:
        model = Inventory
        fields = [
            'id', 'branch', 'branch_id', 'item', 'item_id',
            'quantity', 'price'
        ]
        extra_kwargs = {
            'price': {'required': False, 'allow_null': True}
        }

    def update(self, instance, validated_data):
        if 'price' in validated_data and validated_data['price'] is None:
            validated_data['price'] = 0
        return super().update(instance, validated_data)


# -----------------------
# SALE
# -----------------------
class SaleSerializer(serializers.ModelSerializer):
    branch = BranchSerializer(read_only=True)
    branch_id = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.all(), source='branch', write_only=True
    )
    item = ItemSerializer(read_only=True)
    item_id = serializers.PrimaryKeyRelatedField(
        queryset=Item.objects.all(), source='item', write_only=True
    )

    price = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False, allow_null=True
    )

    class Meta:
        model = Sale
        fields = [
            'id',
            'branch', 'branch_id',
            'item', 'item_id',
            'quantity',
            'price',
            'total_amount',
            'payment_method',
            'timestamp'
        ]
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

        # Use given price or default to inventory price
        price_to_use = data.get('price') or inventory.price
        if not price_to_use:
            raise serializers.ValidationError("Price is not set for this item.")

        data['final_price'] = price_to_use  # stash for create()
        return data

    def create(self, validated_data):
        item = validated_data['item']
        branch = validated_data['branch']
        quantity = validated_data['quantity']

        inventory = Inventory.objects.get(item=item, branch=branch)

        # Deduct stock
        inventory.quantity -= quantity
        inventory.save()

        # Save price + total
        price_to_use = validated_data.pop('final_price')
        validated_data['price'] = price_to_use
        validated_data['total_amount'] = price_to_use * quantity

        return super().create(validated_data)
