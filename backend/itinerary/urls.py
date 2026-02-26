from django.urls import path
from . import views

urlpatterns = [
    path('build/', views.build_itinerary, name='build_itinerary'),
    path('optimize/', views.optimize_existing_route, name='optimize_route'),
    path('shortest-path/', views.get_shortest_path, name='shortest_path'),
]
