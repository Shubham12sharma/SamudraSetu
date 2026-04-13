from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .suitability_model import predictor
from beaches.models import Beach
from bson import ObjectId
from datetime import datetime


@api_view(['POST'])
def predict_suitability(request):
    """
    Predict suitability scores for a beach based on current conditions
    """
    beach_id = request.data.get('beach_id')
    features = request.data.get('features', {})
    
    if not beach_id:
        return Response(
            {'error': 'beach_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Try to convert to ObjectId if needed
        if not isinstance(beach_id, ObjectId):
            beach_id_obj = ObjectId(beach_id)
        else:
            beach_id_obj = beach_id
        beach = Beach.objects.get(_id=beach_id_obj)
    except Exception:
        return Response(
            {'error': 'Beach not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Set defaults for all required features
    current_month = datetime.now().month
    feature_defaults = {
        'temperature': 28,
        'humidity': 65,
        'precipitation': 0,
        'wind_speed': 12,
        'tide_height': 1.5,
        'water_temp': 26,
        'air_quality_index': 50,
        'month': current_month
    }
    for key, default in feature_defaults.items():
        features[key] = features.get(key, default)

    # Predict scores
    scores = predictor.predict_suitability(features)
    
    # Update beach scores
    beach.suitability_score = scores['overall']
    beach.swimming_score = scores['swimming']
    beach.family_score = scores['family']
    beach.adventure_score = scores['adventure']
    # Ensure vibe_tags is always a list (never None)
    if getattr(beach, 'vibe_tags', None) is None:
        beach.vibe_tags = []
    beach.save()
    
    return Response({
        'beach_id': str(beach._id),
        'beach_name': beach.name,
        'suitability_scores': scores,
        'timestamp': datetime.now().isoformat()
    })


@api_view(['GET'])
def get_suitability(request, beach_id):
    """
    Get current suitability scores for a beach
    """
    try:
        # Try to convert to ObjectId if needed
        if not isinstance(beach_id, ObjectId):
            beach_id_obj = ObjectId(beach_id)
        else:
            beach_id_obj = beach_id
        beach = Beach.objects.get(_id=beach_id_obj)
        return Response({
            'beach_id': str(beach._id),
            'beach_name': beach.name,
            'suitability_scores': {
                'overall': beach.suitability_score,
                'swimming': beach.swimming_score,
                'family': beach.family_score,
                'adventure': beach.adventure_score
            }
        })
    except Exception:
        return Response(
            {'error': 'Beach not found'},
            status=status.HTTP_404_NOT_FOUND
        )
