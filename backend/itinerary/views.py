from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .graph_builder import itinerary_builder
from beaches.models import Beach


@api_view(['POST'])
def build_itinerary(request):
    """
    Build personalized itinerary based on preferences
    """
    start_beach_id = request.data.get('start_beach_id')
    preferences = request.data.get('preferences', {})
    time_constraint_hours = request.data.get('time_constraint_hours', 8)
    max_beaches = request.data.get('max_beaches', 5)
    
    if not start_beach_id:
        return Response(
            {'error': 'start_beach_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        start_beach = Beach.objects.get(_id=start_beach_id)
    except Beach.DoesNotExist:
        return Response(
            {'error': 'Start beach not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Build graph with all beaches
    all_beaches = Beach.objects.all()
    itinerary_builder.build_graph(all_beaches)
    
    # Build optimal itinerary
    itinerary_node_ids = itinerary_builder.build_optimal_itinerary(
        start_beach_id,
        preferences,
        time_constraint_hours,
        max_beaches
    )
    
    # Optimize route order
    optimized_route = itinerary_builder.optimize_route_order(itinerary_node_ids)
    
    # Get beach details
    itinerary_beaches = []
    total_distance = 0
    prev_node = None
    
    for i, node_id in enumerate(optimized_route):
        try:
            beach = Beach.objects.get(_id=node_id)
            beach_data = {
                'beach_id': str(beach._id),
                'name': beach.name,
                'state': beach.state,
                'latitude': beach.latitude,
                'longitude': beach.longitude,
                'suitability_score': beach.suitability_score,
                'swimming_score': beach.swimming_score,
                'family_score': beach.family_score,
                'adventure_score': beach.adventure_score,
                'order': i + 1
            }
            
            # Calculate distance from previous beach
            if prev_node and node_id in itinerary_builder.graph:
                try:
                    distance = itinerary_builder.graph.get_edge_data(
                        prev_node, node_id, {}
                    ).get('weight', 0)
                    beach_data['distance_from_previous_km'] = round(distance, 2)
                    total_distance += distance
                except:
                    beach_data['distance_from_previous_km'] = 0
            
            itinerary_beaches.append(beach_data)
            prev_node = node_id
        except Beach.DoesNotExist:
            continue
    
    # Estimate total time
    avg_speed = 50  # km/h
    travel_time = total_distance / avg_speed
    visit_time = len(itinerary_beaches) * 2  # 2 hours per beach
    total_time = travel_time + visit_time
    
    return Response({
        'itinerary': itinerary_beaches,
        'total_distance_km': round(total_distance, 2),
        'estimated_travel_time_hours': round(travel_time, 2),
        'estimated_total_time_hours': round(total_time, 2),
        'number_of_beaches': len(itinerary_beaches)
    })


@api_view(['POST'])
def optimize_existing_route(request):
    """
    Optimize an existing list of beaches using graph algorithms
    """
    beach_ids = request.data.get('beach_ids', [])
    
    if not beach_ids or len(beach_ids) < 2:
        return Response(
            {'error': 'At least 2 beach_ids are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Build graph
    all_beaches = Beach.objects.all()
    itinerary_builder.build_graph(all_beaches)
    
    # Optimize route
    optimized_route = itinerary_builder.optimize_route_order(beach_ids)
    
    # Get beach details
    itinerary_beaches = []
    total_distance = 0
    prev_node = None
    
    for i, node_id in enumerate(optimized_route):
        try:
            beach = Beach.objects.get(_id=node_id)
            beach_data = {
                'beach_id': str(beach._id),
                'name': beach.name,
                'state': beach.state,
                'latitude': beach.latitude,
                'longitude': beach.longitude,
                'order': i + 1
            }
            
            if prev_node and node_id in itinerary_builder.graph:
                try:
                    distance = itinerary_builder.graph.get_edge_data(
                        prev_node, node_id, {}
                    ).get('weight', 0)
                    beach_data['distance_from_previous_km'] = round(distance, 2)
                    total_distance += distance
                except:
                    beach_data['distance_from_previous_km'] = 0
            
            itinerary_beaches.append(beach_data)
            prev_node = node_id
        except Beach.DoesNotExist:
            continue
    
    return Response({
        'optimized_route': itinerary_beaches,
        'total_distance_km': round(total_distance, 2)
    })


@api_view(['GET'])
def get_shortest_path(request):
    """
    Get shortest path between two beaches
    """
    start_beach_id = request.query_params.get('start_beach_id')
    end_beach_id = request.query_params.get('end_beach_id')
    
    if not start_beach_id or not end_beach_id:
        return Response(
            {'error': 'start_beach_id and end_beach_id are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Build graph
    all_beaches = Beach.objects.all()
    itinerary_builder.build_graph(all_beaches)
    
    # Find shortest path
    path = itinerary_builder.dijkstra_shortest_path(start_beach_id, end_beach_id)
    
    if not path:
        return Response(
            {'error': 'No path found between the beaches'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Get beach details
    path_beaches = []
    total_distance = 0
    prev_node = None
    
    for i, node_id in enumerate(path):
        try:
            beach = Beach.objects.get(_id=node_id)
            beach_data = {
                'beach_id': str(beach._id),
                'name': beach.name,
                'state': beach.state,
                'latitude': beach.latitude,
                'longitude': beach.longitude,
                'order': i + 1
            }
            
            if prev_node and node_id in itinerary_builder.graph:
                try:
                    distance = itinerary_builder.graph.get_edge_data(
                        prev_node, node_id, {}
                    ).get('weight', 0)
                    beach_data['distance_from_previous_km'] = round(distance, 2)
                    total_distance += distance
                except:
                    beach_data['distance_from_previous_km'] = 0
            
            path_beaches.append(beach_data)
            prev_node = node_id
        except Beach.DoesNotExist:
            continue
    
    return Response({
        'path': path_beaches,
        'total_distance_km': round(total_distance, 2),
        'number_of_stops': len(path_beaches)
    })
