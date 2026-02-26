from django.urls import path
from . import views

urlpatterns = [
    path('upload/', views.upload_and_verify_image, name='upload_image'),
    path('beach/<str:beach_id>/status/', views.get_condition_status, name='get_condition_status'),
]
