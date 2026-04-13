from django.urls import path
from . import views

urlpatterns = [
    path('posts/', views.posts_list, name='community-posts'),
    path('posts/<str:post_id>/', views.post_detail, name='community-post-detail'),
    path('posts/<str:post_id>/like/', views.like_post, name='community-like-post'),
    path('posts/<str:post_id>/comments/', views.add_comment, name='community-add-comment'),
    path('comments/<str:comment_id>/like/', views.like_comment, name='community-like-comment'),
]
