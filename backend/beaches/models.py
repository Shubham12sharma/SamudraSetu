from django.db import models
from djongo import models as mongo_models
import json


class Beach(mongo_models.Model):
    """Beach model stored in MongoDB"""
    # Primary key ObjectId
    _id = mongo_models.ObjectIdField(primary_key=True)
    name = mongo_models.CharField(max_length=200)
    state = mongo_models.CharField(max_length=100)
    latitude = mongo_models.FloatField()
    longitude = mongo_models.FloatField()
    description = mongo_models.TextField(blank=True)
    image_url = mongo_models.URLField(blank=True)
    
    # Suitability scores (updated by ML model)
    suitability_score = mongo_models.FloatField(default=0.0)  # Overall score 0-100
    swimming_score = mongo_models.FloatField(default=0.0)
    family_score = mongo_models.FloatField(default=0.0)
    adventure_score = mongo_models.FloatField(default=0.0)
    
    # Condition data (updated by CV verification)
    crowd_level = mongo_models.CharField(max_length=20, default='unknown')  # low, moderate, high
    cleanliness_score = mongo_models.FloatField(default=0.0)  # 0-100
    condition_verifications = mongo_models.IntegerField(default=0)
    
    # Weather and environmental data
    weather_condition = mongo_models.CharField(max_length=50, blank=True)
    temperature = mongo_models.FloatField(null=True, blank=True)
    water_quality = mongo_models.CharField(max_length=50, default='unknown')
    pollution_level = mongo_models.CharField(max_length=50, default='unknown')
    
    # Sentiment analysis results (stored as JSON list of strings)
    vibe_tags = mongo_models.JSONField(default=list)
    sentiment_score = mongo_models.FloatField(default=0.0)  # -1 to 1
    
    # Metadata
    created_at = mongo_models.DateTimeField(auto_now_add=True)
    updated_at = mongo_models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'beaches'
    
    def __str__(self):
        return f"{self.name}, {self.state}"


class Review(mongo_models.Model):
    """User reviews for beaches"""
    # Primary key ObjectId
    _id = mongo_models.ObjectIdField(primary_key=True)
    # Store referenced beach ObjectId as a string to avoid multiple auto fields
    beach_id = mongo_models.CharField(max_length=24)
    user_id = mongo_models.CharField(max_length=100)
    rating = mongo_models.IntegerField()  # 1-5
    review_text = mongo_models.TextField()
    
    # Sentiment analysis results
    sentiment_score = mongo_models.FloatField(null=True, blank=True)
    extracted_tags = mongo_models.JSONField(default=list)
    
    created_at = mongo_models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'reviews'


class BeachImage(mongo_models.Model):
    """User-uploaded images for beach condition verification"""
    _id = mongo_models.ObjectIdField(primary_key=True)
    # Store referenced beach ObjectId as a string
    beach_id = mongo_models.CharField(max_length=24)
    user_id = mongo_models.CharField(max_length=100)
    image_path = mongo_models.CharField(max_length=500)
    
    # CV analysis results
    crowd_count = mongo_models.IntegerField(null=True, blank=True)
    cleanliness_score = mongo_models.FloatField(null=True, blank=True)
    verification_status = mongo_models.CharField(max_length=20, default='pending')  # pending, verified, rejected
    
    created_at = mongo_models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'beach_images'
