from django.urls import path
from . import views

urlpatterns = [
    path('sync/', views.sync_operations, name='sync_operations'),
    path('status/<str:user_id>/', views.get_sync_status, name='get_sync_status'),
    path('conflicts/<str:user_id>/', views.get_conflicts, name='get_conflicts'),
]
