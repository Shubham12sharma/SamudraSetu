from django.urls import path
from . import views

urlpatterns = [
    path('calculate/', views.calculate_impact, name='calculate_impact'),
    path('compare-transport/', views.compare_transport_modes, name='compare_transport'),
    path('itinerary-impact/', views.calculate_itinerary_impact, name='itinerary_impact'),
]
