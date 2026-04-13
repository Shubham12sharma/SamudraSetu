from rest_framework import serializers
from .models import Post, Comment, FLAIR_CHOICES


class CommentSerializer(serializers.Serializer):
    id = serializers.CharField(source='_id', read_only=True)
    post_id = serializers.CharField()
    author_id = serializers.CharField()
    author_name = serializers.CharField()
    author_avatar = serializers.URLField(required=False, allow_blank=True, default='')
    content = serializers.CharField()
    parent_comment_id = serializers.CharField(required=False, allow_blank=True, default='')
    likes = serializers.ListField(child=serializers.CharField(), required=False, default=[])
    likes_count = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(read_only=True)
    replies = serializers.SerializerMethodField()

    def get_likes_count(self, obj):
        likes = obj.likes if hasattr(obj, 'likes') and obj.likes else []
        return len(likes)

    def get_replies(self, obj):
        """Get nested replies for this comment"""
        obj_id = str(obj._id)
        replies = Comment.objects.filter(parent_comment_id=obj_id).order_by('created_at')
        return CommentSerializer(replies, many=True).data


class PostSerializer(serializers.Serializer):
    id = serializers.CharField(source='_id', read_only=True)
    author_id = serializers.CharField()
    author_name = serializers.CharField()
    author_avatar = serializers.URLField(required=False, allow_blank=True, default='')
    content = serializers.CharField()
    flair = serializers.ChoiceField(choices=FLAIR_CHOICES, default='general')
    images = serializers.ListField(child=serializers.CharField(), required=False, default=[])
    likes = serializers.ListField(child=serializers.CharField(), required=False, default=[])
    likes_count = serializers.SerializerMethodField()
    comments_count = serializers.IntegerField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)

    def get_likes_count(self, obj):
        likes = obj.likes if hasattr(obj, 'likes') and obj.likes else []
        return len(likes)


class PostDetailSerializer(PostSerializer):
    """Post with all comments included"""
    comments = serializers.SerializerMethodField()

    def get_comments(self, obj):
        """Get only top-level comments (no parent), replies are nested inside each"""
        post_id = str(obj._id)
        top_level = Comment.objects.filter(post_id=post_id, parent_comment_id='').order_by('created_at')
        return CommentSerializer(top_level, many=True).data
