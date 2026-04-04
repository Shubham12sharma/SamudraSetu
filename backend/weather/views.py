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
        # Using Open-Meteo (free, no API key required)
        # Request current weather; hourly values are available separately if needed
        url = f'https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true&timezone=auto'
        response = requests.get(url, timeout=6)

        if response.status_code == 200:
            data = response.json()
            # Open-Meteo returns current weather under 'current_weather'
            current = data.get('current_weather') or {}

            # temperature and wind speed available directly; precipitation/humidity may not be present in current_weather
            temperature = current.get('temperature')
            wind_speed = current.get('windspeed')

            # Try to pull hourly precipitation/humidity if present (best-effort)
            humidity = None
            precipitation = None
            hourly = data.get('hourly') or {}
            if hourly:
                # hourly keys in open-meteo typically like 'relativehumidity_2m' and 'precipitation'
                rh = hourly.get('relativehumidity_2m')
                precip = hourly.get('precipitation')
                time_idx = 0
                try:
                    # match by current time index if times array exists
                    times = hourly.get('time')
                    if times and current.get('time') and current['time'] in times:
                        time_idx = times.index(current['time'])
                except Exception:
                    time_idx = 0

                try:
                    if rh and isinstance(rh, list):
                        humidity = rh[time_idx]
                except Exception:
                    humidity = None

                try:
                    if precip and isinstance(precip, list):
                        precipitation = precip[time_idx]
                except Exception:
                    precipitation = None

            # Fallback defaults
            temperature = temperature if temperature is not None else 28
            humidity = humidity if humidity is not None else 65
            precipitation = precipitation if precipitation is not None else 0
            wind_speed = wind_speed if wind_speed is not None else 12

            return Response({
                'temperature': temperature,
                'humidity': humidity,
                'precipitation': precipitation,
                'wind_speed': wind_speed,
                'condition': get_weather_condition(temperature, precipitation),
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
