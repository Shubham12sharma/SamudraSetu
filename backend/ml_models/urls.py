from django.urls import path
from . import views

urlpatterns = [
    path('predict/', views.predict_suitability, name='predict_suitability'),
    path('beach/<str:beach_id>/', views.get_suitability, name='get_suitability'),
]
