"""
Conflict Resolution Mechanism for Offline Data Sync
Implements timestamp comparison and majority consensus strategies
"""
from datetime import datetime, timedelta
from django.utils import timezone
from beaches.models import Review, Beach
from .models import ConflictLog, SyncQueue
import json


class ConflictResolver:
    """
    Resolves conflicts when syncing offline data
    """
    
    def resolve_timestamp_conflict(self, client_data, server_data, entity_type, entity_id):
        """
        Resolve conflict using timestamp comparison (latest wins)
        
        Args:
            client_data: Data from client
            server_data: Data from server
            entity_type: Type of entity (review, beach, etc.)
            entity_id: ID of entity
        
        Returns: resolved data and resolution method
        """
        client_timestamp = client_data.get('updated_at') or client_data.get('created_at')
        server_timestamp = server_data.get('updated_at') or server_data.get('created_at')
        
        if isinstance(client_timestamp, str):
            client_timestamp = datetime.fromisoformat(client_timestamp.replace('Z', '+00:00'))
        if isinstance(server_timestamp, str):
            server_timestamp = datetime.fromisoformat(server_timestamp.replace('Z', '+00:00'))
        
        if client_timestamp > server_timestamp:
            return client_data, 'latest_wins_client'
        else:
            return server_data, 'latest_wins_server'
    
    def resolve_value_conflict(self, client_data, server_data, entity_type):
        """
        Resolve conflict by merging values (preferring non-null values)
        
        Args:
            client_data: Data from client
            server_data: Data from server
            entity_type: Type of entity
        
        Returns: merged data
        """
        merged = server_data.copy()
        
        # Merge fields, preferring client values for user-generated content
        for key, value in client_data.items():
            if key not in ['_id', 'created_at', 'updated_at']:
                if value is not None and value != '':
                    merged[key] = value
        
        return merged, 'merge'
    
    def resolve_majority_consensus(self, entity_type, entity_id, field_name, conflicting_values):
        """
        Resolve conflict using majority consensus
        
        Args:
            entity_type: Type of entity
            entity_id: ID of entity
            field_name: Name of conflicting field
            conflicting_values: List of (value, count) tuples
        
        Returns: most common value
        """
        if not conflicting_values:
            return None
        
        # Sort by count (descending)
        conflicting_values.sort(key=lambda x: x[1], reverse=True)
        
        # Return most common value
        return conflicting_values[0][0], 'majority_consensus'
    
    def resolve_review_conflict(self, client_review, server_review):
        """
        Resolve conflict for review entities
        
        Args:
            client_review: Review data from client
            server_review: Review data from server
        
        Returns: resolved review data and method
        """
        # For reviews, use timestamp (latest edit wins)
        # But also merge if they're different reviews
        
        if client_review.get('_id') != server_review.get('_id'):
            # Different reviews - keep both (this shouldn't happen in sync)
            return server_review, 'keep_server'
        
        # Same review - use timestamp
        return self.resolve_timestamp_conflict(
            client_review, server_review, 'review', client_review.get('_id')
        )
    
    def resolve_beach_conflict(self, client_beach, server_beach):
        """
        Resolve conflict for beach entities (crowd level, cleanliness, etc.)
        
        Args:
            client_beach: Beach data from client
            server_beach: Beach data from server
        
        Returns: resolved beach data and method
        """
        beach_id = server_beach.get('_id')
        
        # For condition updates (crowd_level, cleanliness_score), use consensus
        # For other fields, use timestamp
        
        # Check if it's a condition update
        condition_fields = ['crowd_level', 'cleanliness_score', 'condition_verifications']
        is_condition_update = any(
            field in client_beach and client_beach[field] != server_beach.get(field, None)
            for field in condition_fields
        )
        
        if is_condition_update:
            # For condition updates, prefer server (which has consensus mechanism)
            return server_beach, 'consensus_preferred'
        else:
            # For other updates, use timestamp
            return self.resolve_timestamp_conflict(
                client_beach, server_beach, 'beach', beach_id
            )
    
    def log_conflict(self, entity_type, entity_id, user_id, conflict_type,
                     resolution_method, client_data, server_data, resolved_data):
        """Log conflict resolution for audit"""
        ConflictLog.objects.create(
            entity_type=entity_type,
            entity_id=str(entity_id),
            user_id=user_id,
            conflict_type=conflict_type,
            resolution_method=resolution_method,
            client_data=client_data,
            server_data=server_data,
            resolved_data=resolved_data
        )
    
    def resolve(self, sync_item, server_entity):
        """
        Main conflict resolution method
        
        Args:
            sync_item: SyncQueue item with client data
            server_entity: Entity from server database
        
        Returns: resolved data, resolution method, and whether conflict occurred
        """
        entity_type = sync_item.entity_type
        entity_id = sync_item.entity_id
        client_data = sync_item.data
        
        # Convert server entity to dict
        if hasattr(server_entity, '__dict__'):
            server_data = {k: v for k, v in server_entity.__dict__.items() if not k.startswith('_')}
        else:
            server_data = server_entity
        
        conflict_occurred = False
        resolved_data = None
        resolution_method = None
        
        # Determine resolution strategy based on entity type
        if entity_type == 'review':
            resolved_data, resolution_method = self.resolve_review_conflict(
                client_data, server_data
            )
        elif entity_type == 'beach':
            resolved_data, resolution_method = self.resolve_beach_conflict(
                client_data, server_data
            )
        else:
            # Default: timestamp-based resolution
            resolved_data, resolution_method = self.resolve_timestamp_conflict(
                client_data, server_data, entity_type, entity_id
            )
        
        # Check if conflict actually occurred
        if resolved_data != server_data:
            conflict_occurred = True
            
            # Log conflict
            self.log_conflict(
                entity_type=entity_type,
                entity_id=entity_id,
                user_id=sync_item.user_id,
                conflict_type='data_conflict',
                resolution_method=resolution_method,
                client_data=client_data,
                server_data=server_data,
                resolved_data=resolved_data
            )
        
        return resolved_data, resolution_method, conflict_occurred


# Global instance
resolver = ConflictResolver()
