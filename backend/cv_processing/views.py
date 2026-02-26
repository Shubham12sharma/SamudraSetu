from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from .image_processor import processor
from beaches.models import Beach, BeachImage
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import os
from django.conf import settings
from datetime import datetime


@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def upload_and_verify_image(request):
    """
    Upload beach image and process it for condition verification
    Uses consensus mechanism: requires multiple verifications before updating beach condition
    """
    beach_id = request.data.get('beach_id')
    user_id = request.data.get('user_id', 'anonymous')
    image_file = request.FILES.get('image')
    
    if not beach_id or not image_file:
        return Response(
            {'error': 'beach_id and image are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        beach = Beach.objects.get(_id=beach_id)
    except Beach.DoesNotExist:
        return Response(
            {'error': 'Beach not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Save uploaded image
    os.makedirs(settings.MEDIA_ROOT, exist_ok=True)
    filename = f'beach_{beach_id}_{datetime.now().timestamp()}.jpg'
    file_path = os.path.join(settings.MEDIA_ROOT, filename)
    
    with open(file_path, 'wb+') as destination:
        for chunk in image_file.chunks():
            destination.write(chunk)
    
    # Process image
    try:
        results = processor.process_image(file_path)
        
        # Create BeachImage record
        beach_image = BeachImage.objects.create(
            beach_id=beach._id,
            user_id=user_id,
            image_path=file_path,
            crowd_count=results['crowd_score'],
            cleanliness_score=results['cleanliness_score'],
            verification_status='pending'
        )
        
        # Check consensus mechanism
        # Get recent pending/verified images for this beach (last 24 hours)
        from django.utils import timezone
        from datetime import timedelta
        recent_images = BeachImage.objects.filter(
            beach_id=beach._id,
            verification_status__in=['pending', 'verified'],
            created_at__gte=timezone.now() - timedelta(days=1)
        )
        
        # Count verified images with similar conditions
        consensus_threshold = 3  # Need at least 3 similar verifications
        similar_images = recent_images.filter(
            crowd_count__gte=results['crowd_score'] - 20,
            crowd_count__lte=results['crowd_score'] + 20
        )
        
        if similar_images.count() >= consensus_threshold:
            # Update beach condition based on consensus
            avg_crowd = sum(img.crowd_count for img in similar_images) / similar_images.count()
            avg_cleanliness = sum(img.cleanliness_score for img in similar_images) / similar_images.count()
            
            # Determine crowd level
            if avg_crowd < 30:
                beach.crowd_level = 'low'
            elif avg_crowd < 70:
                beach.crowd_level = 'moderate'
            else:
                beach.crowd_level = 'high'
            
            beach.cleanliness_score = avg_cleanliness
            beach.condition_verifications = similar_images.count()
            beach.save()
            
            # Mark images as verified
            for img in similar_images:
                img.verification_status = 'verified'
                img.save()
        
        return Response({
            'image_id': str(beach_image._id),
            'processing_results': results,
            'consensus_reached': similar_images.count() >= consensus_threshold,
            'verifications_needed': max(0, consensus_threshold - similar_images.count()),
            'verification_status': beach_image.verification_status
        })
    
    except Exception as e:
        # Clean up file on error
        if os.path.exists(file_path):
            os.remove(file_path)
        return Response(
            {'error': f'Image processing failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def get_condition_status(request, beach_id):
    """
    Get current condition status for a beach
    """
    try:
        beach = Beach.objects.get(_id=beach_id)
        return Response({
            'beach_id': str(beach._id),
            'beach_name': beach.name,
            'crowd_level': beach.crowd_level,
            'cleanliness_score': beach.cleanliness_score,
            'verification_count': beach.condition_verifications
        })
    except Beach.DoesNotExist:
        return Response(
            {'error': 'Beach not found'},
            status=status.HTTP_404_NOT_FOUND
        )
