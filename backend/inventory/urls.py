from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', lambda request: JsonResponse({"message": "Welcome to the Inventory API"})),  # Optional welcome message
    path('api/', include('inventory_app.urls')),  # All your inventory API endpoints
]
