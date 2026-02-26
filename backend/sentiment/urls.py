from django.urls import path
from . import views

urlpatterns = [
    path('analyze/', views.analyze_review, name='analyze_review'),
    path('beach/<str:beach_id>/analyze/', views.analyze_beach_reviews, name='analyze_beach_reviews'),
    path('beach/<str:beach_id>/vibe/', views.get_beach_vibe, name='get_beach_vibe'),
]
