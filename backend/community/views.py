from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Post, Comment
from .serializers import PostSerializer, PostDetailSerializer, CommentSerializer


@api_view(['GET', 'POST'])
def posts_list(request):
    """
    GET: List all posts (newest first), with pagination.
    POST: Create a new post.
    """
    if request.method == 'GET':
        page = int(request.GET.get('page', 1))
        page_size = 20
        offset = (page - 1) * page_size

        all_posts = Post.objects.all().order_by('-created_at')
        total = all_posts.count()
        posts = all_posts[offset:offset + page_size]

        serializer = PostSerializer(posts, many=True)
        return Response({
            'results': serializer.data,
            'total': total,
            'page': page,
            'has_next': (offset + page_size) < total,
        })

    elif request.method == 'POST':
        data = request.data
        required_fields = ['author_id', 'author_name', 'content']
        for field in required_fields:
            if not data.get(field):
                return Response(
                    {'error': f'{field} is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        post = Post(
            author_id=data['author_id'],
            author_name=data['author_name'],
            author_avatar=data.get('author_avatar', ''),
            content=data['content'],
            flair=data.get('flair', 'general'),
            images=data.get('images', []),
            likes=[],
            comments_count=0,
        )
        post.save()
        serializer = PostSerializer(post)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
def post_detail(request, post_id):
    """Get a single post with all its comments (threaded)."""
    try:
        post = Post.objects.get(pk=post_id)
    except Post.DoesNotExist:
        return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception:
        # Djongo sometimes needs ObjectId
        from bson import ObjectId
        try:
            post = Post.objects.get(_id=ObjectId(post_id))
        except Exception:
            return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)

    serializer = PostDetailSerializer(post)
    return Response(serializer.data)


@api_view(['POST'])
def like_post(request, post_id):
    """Toggle like on a post. Body: { user_id: "..." }"""
    user_id = request.data.get('user_id')
    if not user_id:
        return Response({'error': 'user_id required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        post = Post.objects.get(pk=post_id)
    except Exception:
        from bson import ObjectId
        try:
            post = Post.objects.get(_id=ObjectId(post_id))
        except Exception:
            return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)

    likes = post.likes or []
    if user_id in likes:
        likes.remove(user_id)
        action = 'unliked'
    else:
        likes.append(user_id)
        action = 'liked'

    post.likes = likes
    post.save()
    return Response({'action': action, 'likes_count': len(likes)})


@api_view(['POST'])
def add_comment(request, post_id):
    """Add a comment to a post. Supports replies via parent_comment_id."""
    data = request.data
    required_fields = ['author_id', 'author_name', 'content']
    for field in required_fields:
        if not data.get(field):
            return Response(
                {'error': f'{field} is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

    # Verify post exists
    try:
        post = Post.objects.get(pk=post_id)
    except Exception:
        from bson import ObjectId
        try:
            post = Post.objects.get(_id=ObjectId(post_id))
        except Exception:
            return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)

    comment = Comment(
        post_id=str(post.pk),
        author_id=str(data['author_id']),
        author_name=data['author_name'],
        author_avatar=data.get('author_avatar', ''),
        content=data['content'],
        parent_comment_id=data.get('parent_comment_id', ''),
        likes=[],
    )
    comment.save()

    # Update comment count on post
    post.comments_count = (post.comments_count or 0) + 1
    post.save()

    serializer = CommentSerializer(comment)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
def like_comment(request, comment_id):
    """Toggle like on a comment. Body: { user_id: "..." }"""
    user_id = request.data.get('user_id')
    if not user_id:
        return Response({'error': 'user_id required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        comment = Comment.objects.get(_id=comment_id)
    except Exception:
        from bson import ObjectId
        try:
            comment = Comment.objects.get(_id=ObjectId(comment_id))
        except Exception:
            return Response({'error': 'Comment not found'}, status=status.HTTP_404_NOT_FOUND)

    likes = comment.likes or []
    if user_id in likes:
        likes.remove(user_id)
        action = 'unliked'
    else:
        likes.append(user_id)
        action = 'liked'

    comment.likes = likes
    comment.save()
    return Response({'action': action, 'likes_count': len(likes)})
