from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .suitability_model import predictor
from beaches.models import Beach
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
        beach = Beach.objects.get(_id=beach_id)
    except Beach.DoesNotExist:
        return Response(
            {'error': 'Beach not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Get current month
    current_month = datetime.now().month
    features['month'] = features.get('month', current_month)
    
    # Predict scores
    scores = predictor.predict_suitability(features)
    
    # Update beach scores
    beach.suitability_score = scores['overall']
    beach.swimming_score = scores['swimming']
    beach.family_score = scores['family']
    beach.adventure_score = scores['adventure']
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
        beach = Beach.objects.get(_id=beach_id)
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
    except Beach.DoesNotExist:
        return Response(
            {'error': 'Beach not found'},
            status=status.HTTP_404_NOT_FOUND
        )
