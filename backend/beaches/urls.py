from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BeachViewSet, ReviewViewSet, BeachImageViewSet

router = DefaultRouter()
router.register(r'', BeachViewSet, basename='beach')
router.register(r'reviews', ReviewViewSet, basename='review')
router.register(r'images', BeachImageViewSet, basename='beachimage')

urlpatterns = [
    path('', include(router.urls)),
]
