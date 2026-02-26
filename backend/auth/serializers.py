from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)

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
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
