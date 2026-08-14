from django.db import models
from django.contrib.auth.models import AbstractUser

class Branch(models.Model):
    name = models.CharField(max_length=100)
    location = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class User(AbstractUser):
    is_admin = models.BooleanField(default=False)
    can_stock = models.BooleanField(default=False)  # ✅ stocking permission
    branch = models.ForeignKey(Branch, null=True, blank=True, on_delete=models.SET_NULL)

    def save(self, *args, **kwargs):
        if self.is_superuser:
            self.is_admin = True
        super().save(*args, **kwargs)

    def __str__(self):
        return self.username


class Item(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class Inventory(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE)
    item = models.ForeignKey(Item, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()

    # ✅ branch-specific price
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )

    class Meta:
        unique_together = ('branch', 'item')

    def __str__(self):
        return f"{self.item.name} @ {self.branch.name}"

    def save(self, *args, **kwargs):
        # Ensure price is never left null
        if self.price is None:
            self.price = 0  # default to 0 until set
        super().save(*args, **kwargs)


class Sale(models.Model):
    PAYMENT_METHOD_CHOICES = [
        ('PayBill', 'PayBill'),
        ('Cash', 'Cash'),
    ]

    branch = models.ForeignKey(Branch, on_delete=models.CASCADE)
    item = models.ForeignKey(Item, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()

    # ✅ NEW: store unit price at time of sale (allows bargains)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    # ✅ total_amount always reflects quantity * price
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)

    payment_method = models.CharField(
        max_length=10,
        choices=PAYMENT_METHOD_CHOICES,
        default='Cash'
    )
    timestamp = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Ensure total_amount always matches price * quantity
        if self.price is not None and self.quantity is not None:
            self.total_amount = self.price * self.quantity
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.quantity}x {self.item.name} - {self.branch.name} ({self.total_amount})"
