"""
URL configuration for samudrasetu_backend project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('auth.urls')),
    path('api/beaches/', include('beaches.urls')),
    path('api/ml/', include('ml_models.urls')),
    path('api/cv/', include('cv_processing.urls')),
    path('api/itinerary/', include('itinerary.urls')),
    path('api/sentiment/', include('sentiment.urls')),
    path('api/sync/', include('sync.urls')),
    path('api/eco/', include('eco_impact.urls')),
    path('api/weather/', include('weather.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
