from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
import requests


@api_view(['GET'])
def get_weather(request):
    """
    Get weather data for a location using OpenWeatherMap API (free tier)
    Falls back to mock data if API key not available
    """
    lat = request.query_params.get('lat')
    lon = request.query_params.get('lon')
    
    if not lat or not lon:
        return Response(
            {'error': 'lat and lon parameters are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # OpenWeatherMap API (free tier - no key required for basic calls)
    # Using a free API endpoint that doesn't require authentication
    try:
        # Using open-meteo (free, no API key required)
        url = f'https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&hourly=temperature_2m&timezone=auto'
        response = requests.get(url, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            current = data.get('current', {})
            
            return Response({
                'temperature': current.get('temperature_2m', 28),
                'humidity': current.get('relative_humidity_2m', 65),
                'precipitation': current.get('precipitation', 0),
                'wind_speed': current.get('wind_speed_10m', 12),
                'condition': get_weather_condition(current.get('temperature_2m', 28), current.get('precipitation', 0)),
                'source': 'open-meteo'
            })
    except Exception as e:
        print(f"Weather API error: {e}")
    
    # Fallback to mock data
    return Response({
        'temperature': 28,
        'humidity': 65,
        'precipitation': 0,
        'wind_speed': 12,
        'condition': 'Sunny',
        'source': 'mock'
    })


def get_weather_condition(temp, precipitation):
    """Determine weather condition based on temperature and precipitation"""
    if precipitation > 5:
        return 'Rainy'
    elif precipitation > 0:
        return 'Light Rain'
    elif temp > 30:
        return 'Hot'
    elif temp > 25:
        return 'Sunny'
    elif temp > 20:
        return 'Pleasant'
    else:
        return 'Cool'
