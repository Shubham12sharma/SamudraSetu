from djongo import models as mongo_models


FLAIR_CHOICES = [
    ('general', 'General'),
    ('recruitment', 'Recruitment Drive'),
    ('beach_event', 'Beach Event'),
    ('cleanup', 'Cleanup Drive'),
    ('alert', 'Alert/Warning'),
    ('question', 'Question'),
]


class Post(mongo_models.Model):
    """Community post stored in MongoDB"""
    _id = mongo_models.ObjectIdField()
    author_id = mongo_models.CharField(max_length=100)
    author_name = mongo_models.CharField(max_length=200)
    author_avatar = mongo_models.URLField(blank=True, default='')
    content = mongo_models.TextField()
    flair = mongo_models.CharField(max_length=30, choices=FLAIR_CHOICES, default='general')
    images = mongo_models.JSONField(default=list, blank=True)  # List of image URIs
    likes = mongo_models.JSONField(default=list, blank=True)  # List of user IDs
    comments_count = mongo_models.IntegerField(default=0)
    created_at = mongo_models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'community_posts'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.author_name}: {self.content[:50]}"


class Comment(mongo_models.Model):
    """Comment on a community post, supports threaded replies"""
    _id = mongo_models.ObjectIdField()
    post_id = mongo_models.CharField(max_length=100)  # Reference to Post._id
    author_id = mongo_models.CharField(max_length=100)
    author_name = mongo_models.CharField(max_length=200)
    author_avatar = mongo_models.URLField(blank=True, default='')
    content = mongo_models.TextField()
    parent_comment_id = mongo_models.CharField(max_length=100, blank=True, default='')  # For replies
    likes = mongo_models.JSONField(default=list, blank=True)
    created_at = mongo_models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'community_comments'
        ordering = ['created_at']

    def __str__(self):
        return f"Comment by {self.author_name} on {self.post_id}"
