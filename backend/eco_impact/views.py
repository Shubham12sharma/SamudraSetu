from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .impact_calculator import calculator
from beaches.models import Beach


@api_view(['POST'])
def calculate_impact(request):
    """
    Calculate environmental impact of a beach visit
    """
    origin_lat = request.data.get('origin_lat')
    origin_lon = request.data.get('origin_lon')
    beach_id = request.data.get('beach_id')
    
    transport_mode = request.data.get('transport_mode', 'car')
    passengers = request.data.get('passengers', 1)
    duration_days = request.data.get('duration_days', 1)
    number_of_people = request.data.get('number_of_people', 1)
    
    if not all([origin_lat, origin_lon, beach_id]):
        return Response(
            {'error': 'origin_lat, origin_lon, and beach_id are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        beach = Beach.objects.get(_id=beach_id)
    except Beach.DoesNotExist:
        return Response(
            {'error': 'Beach not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Calculate impact
    impact_data = calculator.calculate_impact(
        origin_coords=(float(origin_lat), float(origin_lon)),
        destination_coords=(beach.latitude, beach.longitude),
        transport_mode=transport_mode,
        passengers=int(passengers),
        duration_days=float(duration_days),
        number_of_people=int(number_of_people)
    )
    
    # Get eco suggestions
    suggestions = calculator.get_eco_suggestions(impact_data)
    
    return Response({
        'beach_id': str(beach._id),
        'beach_name': beach.name,
        'impact': impact_data,
        'eco_suggestions': suggestions
    })


@api_view(['POST'])
def compare_transport_modes(request):
    """
    Compare environmental impact of different transport modes
    """
    origin_lat = request.data.get('origin_lat')
    origin_lon = request.data.get('origin_lon')
    beach_id = request.data.get('beach_id')
    passengers = request.data.get('passengers', 1)
    
    if not all([origin_lat, origin_lon, beach_id]):
        return Response(
            {'error': 'origin_lat, origin_lon, and beach_id are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        beach = Beach.objects.get(_id=beach_id)
    except Beach.DoesNotExist:
        return Response(
            {'error': 'Beach not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Calculate distance
    distance = calculator.calculate_distance(
        float(origin_lat), float(origin_lon),
        beach.latitude, beach.longitude
    )
    
    # Compare transport modes
    comparisons = calculator.compare_transport_modes(distance, int(passengers))
    
    return Response({
        'beach_id': str(beach._id),
        'beach_name': beach.name,
        'distance_km': distance,
        'transport_comparisons': comparisons
    })


@api_view(['POST'])
def calculate_itinerary_impact(request):
    """
    Calculate total environmental impact for a multi-beach itinerary
    """
    origin_lat = request.data.get('origin_lat')
    origin_lon = request.data.get('origin_lon')
    beach_ids = request.data.get('beach_ids', [])
    
    transport_mode = request.data.get('transport_mode', 'car')
    passengers = request.data.get('passengers', 1)
    duration_per_beach_days = request.data.get('duration_per_beach_days', 1)
    number_of_people = request.data.get('number_of_people', 1)
    
    if not all([origin_lat, origin_lon]) or not beach_ids:
        return Response(
            {'error': 'origin_lat, origin_lon, and beach_ids are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        beaches = [Beach.objects.get(_id=bid) for bid in beach_ids]
    except Beach.DoesNotExist:
        return Response(
            {'error': 'One or more beaches not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    total_distance = 0
    total_emissions = 0
    total_waste = 0
    total_plastic_waste = 0
    
    current_coords = (float(origin_lat), float(origin_lon))
    
    for beach in beaches:
        # Distance from current location to beach
        distance = calculator.calculate_distance(
            current_coords[0], current_coords[1],
            beach.latitude, beach.longitude
        )
        total_distance += distance
        
        # Emissions for this leg
        emissions = calculator.calculate_carbon_emissions(
            distance, transport_mode, passengers
        )
        total_emissions += emissions
        
        # Waste at this beach
        waste_data = calculator.calculate_waste_generation(
            duration_per_beach_days, number_of_people
        )
        total_waste += waste_data['total_waste_kg']
        total_plastic_waste += waste_data['plastic_waste_kg']
        
        # Update current location
        current_coords = (beach.latitude, beach.longitude)
    
    # Return journey emissions
    return_emissions = calculator.calculate_carbon_emissions(
        calculator.calculate_distance(
            current_coords[0], current_coords[1],
            float(origin_lat), float(origin_lon)
        ),
        transport_mode, passengers
    )
    total_emissions += return_emissions
    
    # Calculate trees needed
    total_days = len(beaches) * duration_per_beach_days
    trees_needed = round(total_emissions / (0.058 * total_days), 1) if total_days > 0 else 0
    
    total_impact = {
        'total_distance_km': round(total_distance, 2),
        'total_carbon_emissions_kg': round(total_emissions, 2),
        'total_waste_kg': round(total_waste, 2),
        'total_plastic_waste_kg': round(total_plastic_waste, 2),
        'trees_needed_to_offset': trees_needed,
        'number_of_beaches': len(beaches),
        'total_duration_days': total_days
    }
    
    # Get suggestions
    suggestions = calculator.get_eco_suggestions(total_impact)
    
    return Response({
        'itinerary_impact': total_impact,
        'eco_suggestions': suggestions
    })
