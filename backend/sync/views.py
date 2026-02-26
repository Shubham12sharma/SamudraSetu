from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from datetime import datetime
from .models import SyncQueue, ConflictLog
from .conflict_resolver import resolver
from beaches.models import Review, Beach
import json


@api_view(['POST'])
def sync_operations(request):
    """
    Sync offline operations from client
    Implements conflict resolution
    """
    user_id = request.data.get('user_id', 'anonymous')
    operations = request.data.get('operations', [])
    
    if not operations:
        return Response(
            {'error': 'operations array is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    results = {
        'synced': [],
        'conflicts': [],
        'errors': []
    }
    
    for operation in operations:
        try:
            operation_type = operation.get('operation_type')
            entity_type = operation.get('entity_type')
            entity_id = operation.get('entity_id')
            data = operation.get('data', {})
            client_timestamp = operation.get('timestamp')
            
            if not all([operation_type, entity_type, entity_id, data]):
                results['errors'].append({
                    'operation': operation,
                    'error': 'Missing required fields'
                })
                continue
            
            # Parse client timestamp
            if isinstance(client_timestamp, str):
                client_timestamp = datetime.fromisoformat(client_timestamp.replace('Z', '+00:00'))
            else:
                client_timestamp = timezone.now()
            
            # Create sync queue item
            sync_item = SyncQueue.objects.create(
                user_id=user_id,
                operation_type=operation_type,
                entity_type=entity_type,
                entity_id=str(entity_id),
                data=data,
                client_timestamp=client_timestamp,
                status='pending'
            )
            
            # Process based on operation type
            if operation_type == 'create_review':
                result = process_create_review(sync_item, data)
            elif operation_type == 'update_beach':
                result = process_update_beach(sync_item, data)
            elif operation_type == 'create_beach':
                result = process_create_beach(sync_item, data)
            else:
                result = {'status': 'unsupported', 'error': f'Unknown operation type: {operation_type}'}
            
            if result.get('status') == 'synced':
                sync_item.status = 'synced'
                sync_item.save()
                results['synced'].append({
                    'operation_id': str(sync_item._id),
                    'entity_type': entity_type,
                    'entity_id': entity_id
                })
            elif result.get('status') == 'conflict':
                sync_item.status = 'conflicted'
                sync_item.conflict_resolution = result.get('resolution')
                sync_item.save()
                results['conflicts'].append({
                    'operation_id': str(sync_item._id),
                    'entity_type': entity_type,
                    'entity_id': entity_id,
                    'resolution_method': result.get('resolution_method'),
                    'resolved_data': result.get('resolved_data')
                })
            else:
                sync_item.status = 'error'
                sync_item.save()
                results['errors'].append({
                    'operation_id': str(sync_item._id),
                    'error': result.get('error', 'Unknown error')
                })
        
        except Exception as e:
            results['errors'].append({
                'operation': operation,
                'error': str(e)
            })
    
    return Response({
        'results': results,
        'summary': {
            'total': len(operations),
            'synced': len(results['synced']),
            'conflicts': len(results['conflicts']),
            'errors': len(results['errors'])
        }
    })


def process_create_review(sync_item, data):
    """Process create review operation"""
    try:
        beach_id = data.get('beach_id')
        beach = Beach.objects.get(_id=beach_id)
        
        # Check if review already exists (conflict)
        existing_review = Review.objects.filter(
            beach_id=beach_id,
            user_id=sync_item.user_id,
            review_text=data.get('review_text', '')
        ).first()
        
        if existing_review:
            # Conflict - resolve it
            client_data = data
            server_data = {
                '_id': str(existing_review._id),
                'beach_id': str(existing_review.beach_id),
                'user_id': existing_review.user_id,
                'rating': existing_review.rating,
                'review_text': existing_review.review_text,
                'created_at': existing_review.created_at.isoformat()
            }
            
            resolved_data, resolution_method, conflict = resolver.resolve_review_conflict(
                client_data, server_data
            )
            
            if conflict:
                return {
                    'status': 'conflict',
                    'resolution_method': resolution_method,
                    'resolved_data': resolved_data
                }
        
        # Create new review
        review = Review.objects.create(
            beach_id=beach._id,
            user_id=sync_item.user_id,
            rating=data.get('rating', 3),
            review_text=data.get('review_text', '')
        )
        
        return {'status': 'synced', 'entity_id': str(review._id)}
    
    except Beach.DoesNotExist:
        return {'status': 'error', 'error': 'Beach not found'}
    except Exception as e:
        return {'status': 'error', 'error': str(e)}


def process_update_beach(sync_item, data):
    """Process update beach operation"""
    try:
        beach_id = data.get('_id') or data.get('beach_id')
        beach = Beach.objects.get(_id=beach_id)
        
        # Check for conflicts (compare timestamps)
        client_updated = data.get('updated_at')
        if client_updated:
            if isinstance(client_updated, str):
                client_updated = datetime.fromisoformat(client_updated.replace('Z', '+00:00'))
            
            if beach.updated_at and client_updated < beach.updated_at:
                # Conflict - resolve it
                client_data = data
                server_data = {
                    '_id': str(beach._id),
                    'name': beach.name,
                    'crowd_level': beach.crowd_level,
                    'cleanliness_score': beach.cleanliness_score,
                    'updated_at': beach.updated_at.isoformat()
                }
                
                resolved_data, resolution_method, conflict = resolver.resolve_beach_conflict(
                    client_data, server_data
                )
                
                if conflict:
                    # Apply resolved data
                    if 'crowd_level' in resolved_data:
                        beach.crowd_level = resolved_data['crowd_level']
                    if 'cleanliness_score' in resolved_data:
                        beach.cleanliness_score = resolved_data['cleanliness_score']
                    beach.save()
                    
                    return {
                        'status': 'conflict',
                        'resolution_method': resolution_method,
                        'resolved_data': resolved_data
                    }
        
        # Apply updates
        if 'crowd_level' in data:
            beach.crowd_level = data['crowd_level']
        if 'cleanliness_score' in data:
            beach.cleanliness_score = data['cleanliness_score']
        beach.save()
        
        return {'status': 'synced', 'entity_id': str(beach._id)}
    
    except Beach.DoesNotExist:
        return {'status': 'error', 'error': 'Beach not found'}
    except Exception as e:
        return {'status': 'error', 'error': str(e)}


def process_create_beach(sync_item, data):
    """Process create beach operation"""
    # For now, return error (beaches are typically admin-created)
    return {'status': 'error', 'error': 'Beach creation not supported via sync'}


@api_view(['GET'])
def get_sync_status(request, user_id):
    """Get sync status for a user"""
    pending = SyncQueue.objects.filter(user_id=user_id, status='pending').count()
    conflicted = SyncQueue.objects.filter(user_id=user_id, status='conflicted').count()
    synced = SyncQueue.objects.filter(user_id=user_id, status='synced').count()
    
    return Response({
        'user_id': user_id,
        'pending': pending,
        'conflicted': conflicted,
        'synced': synced,
        'total': pending + conflicted + synced
    })


@api_view(['GET'])
def get_conflicts(request, user_id):
    """Get conflict resolution history for a user"""
    conflicts = ConflictLog.objects.filter(user_id=user_id).order_by('-created_at')[:50]
    
    conflict_list = []
    for conflict in conflicts:
        conflict_list.append({
            'entity_type': conflict.entity_type,
            'entity_id': conflict.entity_id,
            'conflict_type': conflict.conflict_type,
            'resolution_method': conflict.resolution_method,
            'created_at': conflict.created_at.isoformat()
        })
    
    return Response({
        'user_id': user_id,
        'conflicts': conflict_list
    })
