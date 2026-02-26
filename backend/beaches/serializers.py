from rest_framework import serializers
from .models import Beach, Review, BeachImage


class BeachSerializer(serializers.ModelSerializer):
    class Meta:
        model = Beach
        fields = '__all__'
        read_only_fields = ('_id', 'created_at', 'updated_at')


class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = '__all__'
        read_only_fields = ('_id', 'created_at')


class BeachImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = BeachImage
        fields = '__all__'
        read_only_fields = ('_id', 'created_at')
