from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Branch, Item, Inventory, Sale

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    model = User
    list_display = ('username', 'email', 'is_admin', 'branch', 'is_superuser', 'is_staff')
    list_filter = ('is_admin', 'branch', 'is_superuser', 'is_staff', 'is_active')
    fieldsets = BaseUserAdmin.fieldsets + (
        (None, {'fields': ('is_admin', 'branch')}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        (None, {'fields': ('is_admin', 'branch')}),
    )

# Register other models if not already
admin.site.register(Branch)
admin.site.register(Item)
admin.site.register(Inventory)
admin.site.register(Sale)
