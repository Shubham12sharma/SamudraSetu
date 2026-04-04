from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User
import re


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, min_length=6)

    class Meta:
        model = User
        fields = (
            '_id',
            'email',
            'name',
            'password',
            'phone',
            'location',
            'bio',
            'avatar_url',
            'created_at',
        )
        read_only_fields = ('_id', 'created_at')

    def validate_email(self, value):
        """Validate email format and uniqueness"""
        # Check if email is already in use
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError('User with this email already exists.')
        
        # Basic email validation
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, value):
            raise serializers.ValidationError('Invalid email format.')
        
        return value.lower()

    def validate_name(self, value):
        """Validate name"""
        if not value or not value.strip():
            raise serializers.ValidationError('Name cannot be empty.')
        
        if len(value) < 2:
            raise serializers.ValidationError('Name must be at least 2 characters long.')
        
        if len(value) > 150:
            raise serializers.ValidationError('Name must not exceed 150 characters.')
        
        # Check if name contains only valid characters
        if not re.match(r"^[a-zA-Z\s'-]+$", value):
            raise serializers.ValidationError('Name can only contain letters, spaces, hyphens, and apostrophes.')
        
        return value.strip()

    def validate_password(self, value):
        """Validate password strength"""
        if len(value) < 6:
            raise serializers.ValidationError('Password must be at least 6 characters long.')
        
        if len(value) > 128:
            raise serializers.ValidationError('Password must not exceed 128 characters.')
        
        # Check for at least one number or special character
        if not re.search(r'[0-9!@#$%^&*()_+\-=\[\]{};:\'",.<>?/\\|`~]', value):
            raise serializers.ValidationError('Password must contain at least one number or special character.')
        
        return value

    def validate_phone(self, value):
        """Validate phone number"""
        if value and value.strip():
            # Remove common separators and spaces
            phone_digits = re.sub(r'[\s\-().]', '', value)
            
            # Check if it contains only digits and valid characters
            if not re.match(r'^[+]?[0-9]{7,15}$', phone_digits):
                raise serializers.ValidationError('Invalid phone number format.')
        
        return value

    def validate_location(self, value):
        """Validate location"""
        if value and len(value) > 200:
            raise serializers.ValidationError('Location must not exceed 200 characters.')
        
        return value

    def validate_bio(self, value):
        """Validate bio"""
        if value and len(value) > 500:
            raise serializers.ValidationError('Bio must not exceed 500 characters.')
        
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            '_id',
            'email',
            'name',
            'phone',
            'location',
            'bio',
            'avatar_url',
        )


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True, min_length=6)

    def validate_email(self, value):
        """Validate email format"""
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, value):
            raise serializers.ValidationError('Invalid email format.')
        
        return value.lower()

    def validate_password(self, value):
        """Validate password not empty"""
        if not value or not value.strip():
            raise serializers.ValidationError('Password cannot be empty.')
        
        if len(value) < 6:
            raise serializers.ValidationError('Password must be at least 6 characters long.')
        
        return value
