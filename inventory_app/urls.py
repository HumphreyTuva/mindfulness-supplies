from django.urls import path, include
from .views import stock_in, stock_out
from rest_framework.routers import DefaultRouter
from .views import (
    BranchViewSet,
    ItemViewSet,
    InventoryViewSet,
    SaleViewSet,
    dashboard_summary,
    CustomTokenObtainPairView,
)

router = DefaultRouter()
router.register('branches', BranchViewSet)
router.register('items', ItemViewSet)
router.register('inventory', InventoryViewSet)
router.register('sales', SaleViewSet)

urlpatterns = [
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('dashboard-summary/', dashboard_summary),

    path('inventory/stock-in/', stock_in, name='stock-in'),
    path('inventory/stockout/', stock_out, name='stock-out'),

    path('', include(router.urls)),
]


