from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import User
from .serializers import UserSerializer, UserPublicSerializer, LoginSerializer
import hashlib


@api_view(['POST', 'OPTIONS'])
def register(request):
    """User registration with comprehensive validation"""
    if request.method == 'OPTIONS':
        return Response(status=status.HTTP_200_OK)
    
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        try:
            user = serializer.save()
            
            # Generate avatar URL
            name = user.name
            email = user.email
            avatar_hash = hashlib.md5(email.encode()).hexdigest()
            user.avatar_url = f'https://ui-avatars.com/api/?name={name}&size=200&background=0288D1&color=fff'
            user.save()
            
            user_data = UserPublicSerializer(user).data
            return Response({
                'message': 'Registration successful',
                'user': user_data
            }, status=status.HTTP_201_CREATED)
        
        except Exception as exc:
            # This handles any unexpected database or system errors
            return Response(
                {'error': 'An error occurred during registration. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    # Return validation errors
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST', 'OPTIONS'])
def login(request):
    """User login with comprehensive validation"""
    if request.method == 'OPTIONS':
        return Response(status=status.HTTP_200_OK)
    
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    email = serializer.validated_data.get('email')
    password = serializer.validated_data.get('password')
    
    try:
        user = User.objects.get(email=email)
        if user.check_password(password):
            user_data = UserPublicSerializer(user).data
            return Response({
                'message': 'Login successful',
                'user': user_data
            })
        else:
            return Response(
                {'error': 'Invalid email or password'},
                status=status.HTTP_401_UNAUTHORIZED
            )
    except User.DoesNotExist:
        return Response(
            {'error': 'Invalid email or password'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    except Exception as exc:
        return Response(
            {'error': 'An error occurred during login. Please try again.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def get_user(request, user_id):
    """Get user by ID"""
    try:
        user = User.objects.get(_id=user_id)
        serializer = UserPublicSerializer(user)
        return Response(serializer.data)
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['PUT'])
def update_user(request, user_id):
    """Update user profile"""
    try:
        user = User.objects.get(_id=user_id)
        serializer = UserPublicSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )
