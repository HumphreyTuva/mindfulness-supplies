from django.db import models
from django.contrib.auth.models import AbstractUser

class Branch(models.Model):
    name = models.CharField(max_length=100)
    location = models.CharField(max_length=100)

    def __str__(self):
        return self.name

class User(AbstractUser):
    is_admin = models.BooleanField(default=False)
    branch = models.ForeignKey(Branch, null=True, blank=True, on_delete=models.SET_NULL)

    def save(self, *args, **kwargs):
        if self.is_superuser:
            self.is_admin = True  # ✅ Force superusers to also be admins
        super().save(*args, **kwargs)

    def __str__(self):
        return self.username


class Item(models.Model):
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return self.name


class Inventory(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE)
    item = models.ForeignKey(Item, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()

    class Meta:
        unique_together = ('branch', 'item')

    def __str__(self):
        return f"{self.item.name} @ {self.branch.name}"


class Sale(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE)
    item = models.ForeignKey(Item, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.quantity}x {self.item.name} - {self.branch.name} ({self.total_amount})"
