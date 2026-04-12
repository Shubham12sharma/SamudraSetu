from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    path('user/<str:user_id>/', views.get_user, name='get_user'),
    path('user/<str:user_id>/update/', views.update_user, name='update_user'),
    path('user/<str:user_id>/avatar/', views.upload_avatar, name='upload_avatar'),
]
