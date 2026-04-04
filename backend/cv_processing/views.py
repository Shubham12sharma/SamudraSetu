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
try:
    from bson.objectid import ObjectId
except Exception:
    ObjectId = None


def _get_beach_by_id(beach_id):
    """Get beach by ID, supports both string and ObjectId formats"""
    try:
        return Beach.objects.get(_id=beach_id)
    except Beach.DoesNotExist:
        if ObjectId is not None:
            try:
                return Beach.objects.get(_id=ObjectId(beach_id))
            except Exception:
                raise Beach.DoesNotExist()
        raise


def _validate_image_file(image_file):
    """Validate uploaded image file"""
    if not image_file:
        return False, 'Image file is required'
    
    # Check file size (max 10MB)
    if image_file.size > 10 * 1024 * 1024:
        return False, 'Image file must be less than 10MB'
    
    # Check file type
    allowed_types = ['image/jpeg', 'image/png', 'image/jpg']
    if image_file.content_type not in allowed_types:
        return False, f'Invalid file type. Allowed: JPEG, PNG. Got: {image_file.content_type}'
    
    return True, None


@api_view(['POST', 'OPTIONS'])
@parser_classes([MultiPartParser, FormParser])
def upload_and_verify_image(request):
    """
    Upload beach image and process it for condition verification
    Uses consensus mechanism: requires multiple verifications before updating beach condition
    """
    if request.method == 'OPTIONS':
        return Response(status=status.HTTP_200_OK)
    
    # Validate input parameters
    beach_id = request.data.get('beach_id', '').strip()
    user_id = request.data.get('user_id', 'anonymous').strip()
    image_file = request.FILES.get('image')
    
    # Validate required fields
    if not beach_id:
        return Response(
            {'error': 'beach_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if not image_file:
        return Response(
            {'error': 'image file is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate image file
    is_valid, error_msg = _validate_image_file(image_file)
    if not is_valid:
        return Response(
            {'error': error_msg},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get beach
    try:
        beach = _get_beach_by_id(beach_id)
    except Beach.DoesNotExist:
        return Response(
            {'error': f'Beach with ID {beach_id} not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Save uploaded image
    try:
        os.makedirs(settings.MEDIA_ROOT, exist_ok=True)
        timestamp = datetime.now().timestamp()
        filename = f'beach_{beach_id}_{timestamp}.jpg'
        file_path = os.path.join(settings.MEDIA_ROOT, filename)
        
        with open(file_path, 'wb+') as destination:
            for chunk in image_file.chunks():
                destination.write(chunk)
    except Exception as e:
        return Response(
            {'error': f'Failed to save image: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    # Process image
    try:
        results = processor.process_image(file_path)
        
        # Validate processing results
        if not results or 'crowd_score' not in results or 'cleanliness_score' not in results:
            raise ValueError('Invalid processing results from image processor')
        
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
        from django.utils import timezone
        from datetime import timedelta
        
        # Get recent pending/verified images for this beach (last 24 hours)
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
        
        response_data = {
            'image_id': str(beach_image._id),
            'processing_results': {
                'crowd_score': results['crowd_score'],
                'cleanliness_score': results['cleanliness_score'],
            },
            'consensus_reached': False,
            'verifications_count': similar_images.count(),
            'verifications_needed': max(0, consensus_threshold - similar_images.count()),
            'verification_status': beach_image.verification_status
        }
        
        if similar_images.count() >= consensus_threshold:
            # Calculate averages
            avg_crowd = sum(img.crowd_count for img in similar_images) / similar_images.count()
            avg_cleanliness = sum(img.cleanliness_score for img in similar_images) / similar_images.count()
            
            # Update beach condition based on consensus
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
            
            response_data['consensus_reached'] = True
            response_data['verification_status'] = 'verified'
        
        return Response(response_data, status=status.HTTP_201_CREATED)
    
    except Exception as e:
        # Clean up file on error
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except:
                pass
        
        print(f'Image processing error: {str(e)}')
        return Response(
            {'error': f'Image processing failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET', 'OPTIONS'])
def get_condition_status(request, beach_id):
    """
    Get current condition status for a beach
    """
    if request.method == 'OPTIONS':
        return Response(status=status.HTTP_200_OK)
    
    # Validate beach_id
    if not beach_id or not beach_id.strip():
        return Response(
            {'error': 'beach_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        beach = _get_beach_by_id(beach_id)
        return Response({
            'beach_id': str(beach._id),
            'beach_name': beach.name,
            'state': beach.state,
            'crowd_level': beach.crowd_level or 'unknown',
            'cleanliness_score': beach.cleanliness_score or 0,
            'verification_count': beach.condition_verifications or 0,
            'suitability_score': beach.suitability_score or 0
        })
    except Beach.DoesNotExist:
        return Response(
            {'error': f'Beach with ID {beach_id} not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Error retrieving beach status: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
