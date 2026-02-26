from djongo import models as mongo_models
from django.contrib.auth.hashers import make_password, check_password


class User(mongo_models.Model):
    """User model stored in MongoDB"""
    _id = mongo_models.ObjectIdField()
    email = mongo_models.EmailField(unique=True)
    name = mongo_models.CharField(max_length=200)
    password = mongo_models.CharField(max_length=200)  # Hashed password
    phone = mongo_models.CharField(max_length=20, blank=True)
    location = mongo_models.CharField(max_length=200, blank=True)
    bio = mongo_models.CharField(max_length=500, blank=True)
    avatar_url = mongo_models.URLField(blank=True)
    created_at = mongo_models.DateTimeField(auto_now_add=True)
    updated_at = mongo_models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'users'
    
    def set_password(self, raw_password):
        self.password = make_password(raw_password)
    
    def check_password(self, raw_password):
        return check_password(raw_password, self.password)
    
    def __str__(self):
        return self.email
