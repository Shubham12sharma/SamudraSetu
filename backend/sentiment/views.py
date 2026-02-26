from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .sentiment_analyzer import analyzer
from beaches.models import Beach, Review
from django.utils import timezone


@api_view(['POST'])
def analyze_review(request):
    """
    Analyze sentiment and vibe of a single review
    """
    review_text = request.data.get('review_text')
    beach_id = request.data.get('beach_id')
    
    if not review_text:
        return Response(
            {'error': 'review_text is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Analyze review
    analysis = analyzer.analyze_review(review_text)
    
    # If beach_id provided, save/update review
    if beach_id:
        try:
            beach = Beach.objects.get(_id=beach_id)
            
            # Create or update review (in real app, you'd have user authentication)
            user_id = request.data.get('user_id', 'anonymous')
            rating = request.data.get('rating', 3)
            
            review = Review.objects.create(
                beach_id=beach._id,
                user_id=user_id,
                rating=rating,
                review_text=review_text,
                sentiment_score=analysis['sentiment_score'],
                extracted_tags=analysis['vibe_tags']
            )
            
            # Update beach sentiment (aggregate all reviews)
            update_beach_sentiment(beach)
            
            return Response({
                'review_id': str(review._id),
                'analysis': analysis,
                'beach_updated': True
            })
        except Beach.DoesNotExist:
            return Response(
                {'error': 'Beach not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    return Response({
        'analysis': analysis
    })


@api_view(['POST'])
def analyze_beach_reviews(request, beach_id):
    """
    Re-analyze all reviews for a beach and update beach sentiment
    """
    try:
        beach = Beach.objects.get(_id=beach_id)
    except Beach.DoesNotExist:
        return Response(
            {'error': 'Beach not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Get all reviews for this beach
    reviews = Review.objects.filter(beach_id=beach._id)
    
    # Analyze each review
    analyzed_reviews = []
    for review in reviews:
        analysis = analyzer.analyze_review(review.review_text)
        review.sentiment_score = analysis['sentiment_score']
        review.extracted_tags = analysis['vibe_tags']
        review.save()
        analyzed_reviews.append(analysis)
    
    # Aggregate results
    aggregated = analyzer.aggregate_beach_sentiment(analyzed_reviews)
    
    # Update beach
    beach.sentiment_score = aggregated['average_sentiment']
    beach.vibe_tags = aggregated['dominant_vibes']
    beach.save()
    
    return Response({
        'beach_id': str(beach._id),
        'beach_name': beach.name,
        'aggregated_sentiment': aggregated,
        'reviews_analyzed': len(analyzed_reviews)
    })


@api_view(['GET'])
def get_beach_vibe(request, beach_id):
    """
    Get current vibe analysis for a beach
    """
    try:
        beach = Beach.objects.get(_id=beach_id)
        
        # Get recent reviews for more detailed analysis
        reviews = Review.objects.filter(beach_id=beach._id)[:50]
        analyzed_reviews = []
        
        for review in reviews:
            analyzed_reviews.append({
                'sentiment_score': review.sentiment_score,
                'vibe_tags': review.extracted_tags or []
            })
        
        aggregated = analyzer.aggregate_beach_sentiment(analyzed_reviews)
        
        return Response({
            'beach_id': str(beach._id),
            'beach_name': beach.name,
            'current_sentiment_score': beach.sentiment_score,
            'current_vibe_tags': beach.vibe_tags or [],
            'detailed_analysis': aggregated
        })
    except Beach.DoesNotExist:
        return Response(
            {'error': 'Beach not found'},
            status=status.HTTP_404_NOT_FOUND
        )


def update_beach_sentiment(beach):
    """
    Helper function to update beach sentiment based on all reviews
    """
    reviews = Review.objects.filter(beach_id=beach._id)
    
    if reviews.count() == 0:
        return
    
    # Aggregate sentiment
    analyzed_reviews = []
    for review in reviews:
        if review.sentiment_score is not None:
            analyzed_reviews.append({
                'sentiment_score': review.sentiment_score,
                'vibe_tags': review.extracted_tags or []
            })
    
    if analyzed_reviews:
        aggregated = analyzer.aggregate_beach_sentiment(analyzed_reviews)
        beach.sentiment_score = aggregated['average_sentiment']
        beach.vibe_tags = aggregated['dominant_vibes']
        beach.save()
