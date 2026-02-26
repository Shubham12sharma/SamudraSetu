from djongo import models as mongo_models


class SyncQueue(mongo_models.Model):
    """Queue for offline operations to sync"""
    _id = mongo_models.ObjectIdField()
    user_id = mongo_models.CharField(max_length=100)
    operation_type = mongo_models.CharField(max_length=50)  # create_review, update_beach, etc.
    entity_type = mongo_models.CharField(max_length=50)  # review, beach, etc.
    entity_id = mongo_models.CharField(max_length=100)
    data = mongo_models.JSONField()  # Operation data
    client_timestamp = mongo_models.DateTimeField()  # When operation was created on client
    server_timestamp = mongo_models.DateTimeField(auto_now_add=True)  # When received on server
    status = mongo_models.CharField(max_length=20, default='pending')  # pending, synced, conflicted
    conflict_resolution = mongo_models.JSONField(null=True, blank=True)
    
    class Meta:
        db_table = 'sync_queue'
        indexes = [
            mongo_models.Index(fields=['user_id', 'status']),
            mongo_models.Index(fields=['entity_type', 'entity_id']),
        ]


class ConflictLog(mongo_models.Model):
    """Log of resolved conflicts"""
    _id = mongo_models.ObjectIdField()
    entity_type = mongo_models.CharField(max_length=50)
    entity_id = mongo_models.CharField(max_length=100)
    user_id = mongo_models.CharField(max_length=100)
    conflict_type = mongo_models.CharField(max_length=50)  # timestamp, value, etc.
    resolution_method = mongo_models.CharField(max_length=50)  # latest_wins, merge, user_choice
    client_data = mongo_models.JSONField()
    server_data = mongo_models.JSONField()
    resolved_data = mongo_models.JSONField()
    created_at = mongo_models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'conflict_logs'
