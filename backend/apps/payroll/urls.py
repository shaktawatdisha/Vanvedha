from rest_framework.routers import DefaultRouter
from .views import StaffSalaryViewSet, SalaryPaymentViewSet

router = DefaultRouter()
router.register('salaries', StaffSalaryViewSet, basename='staff-salary')
router.register('payments', SalaryPaymentViewSet, basename='salary-payment')

urlpatterns = router.urls
