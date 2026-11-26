from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    OfferingCategoryViewSet,
    OfferingViewSet,
)


router = DefaultRouter()

router.register(
    r'offering-categories',
    OfferingCategoryViewSet,
    basename='offering-category'
)

router.register(
    r'offerings',
    OfferingViewSet,
    basename='offering'
)


urlpatterns = [
    path('', include(router.urls)),
]
