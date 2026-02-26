from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Beach, Review, BeachImage
from .serializers import BeachSerializer, ReviewSerializer, BeachImageSerializer
from django.db.models import Q
import pymongo
from django.conf import settings


class BeachViewSet(viewsets.ModelViewSet):
    serializer_class = BeachSerializer
    queryset = Beach.objects.all()
    
    def get_queryset(self):
        queryset = Beach.objects.all()
        state = self.request.query_params.get('state', None)
        search = self.request.query_params.get('search', None)
        
        if state:
            queryset = queryset.filter(state__icontains=state)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )
        return queryset
    
    @action(detail=True, methods=['get'])
    def reviews(self, request, pk=None):
        beach = self.get_object()
        reviews = Review.objects.filter(beach_id=beach._id)
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def images(self, request, pk=None):
        beach = self.get_object()
        images = BeachImage.objects.filter(beach_id=beach._id, verification_status='verified')
        serializer = BeachImageSerializer(images, many=True)
        return Response(serializer.data)


class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    queryset = Review.objects.all()
    
    def get_queryset(self):
        queryset = Review.objects.all()
        beach_id = self.request.query_params.get('beach_id', None)
        if beach_id:
            queryset = queryset.filter(beach_id=beach_id)
        return queryset


class BeachImageViewSet(viewsets.ModelViewSet):
    serializer_class = BeachImageSerializer
    queryset = BeachImage.objects.all()
