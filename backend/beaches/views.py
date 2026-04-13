from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import NotFound
from django.db.models import Q
from bson.objectid import ObjectId

from .models import Beach, Review, BeachImage
from .serializers import (
    BeachSerializer,
    ReviewSerializer,
    BeachImageSerializer
)


class BeachViewSet(viewsets.ModelViewSet):
    serializer_class = BeachSerializer
    queryset = Beach.objects.all()

    # Use MongoDB ObjectId for lookup
    lookup_field = "_id"
    lookup_value_regex = "[0-9a-f]{24}"

    @action(detail=True, methods=["get"])
    def live_info(self, request, _id=None):
        """
        Returns live weather and Wikipedia info for a beach.
        """
        import requests
        beach = self.get_object()
        # Fetch live weather from Open-Meteo
        weather_url = (
            f"https://api.open-meteo.com/v1/forecast?latitude={beach.latitude}&longitude={beach.longitude}&current_weather=true"
        )
        weather_data = {}
        try:
            resp = requests.get(weather_url, timeout=5)
            if resp.status_code == 200:
                weather_data = resp.json().get("current_weather", {})
        except Exception:
            weather_data = {"error": "Could not fetch weather"}

        # Fetch Wikipedia summary
        wiki_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{beach.name.replace(' ', '_')}"
        wiki_data = {}
        try:
            resp = requests.get(wiki_url, timeout=5)
            if resp.status_code == 200:
                wiki_data = resp.json()
        except Exception:
            wiki_data = {"error": "Could not fetch Wikipedia info"}

        return Response({
            "beach": BeachSerializer(beach).data,
            "weather": weather_data,
            "wikipedia": wiki_data,
        })

    def get_queryset(self):
        queryset = Beach.objects.all()
        state = self.request.query_params.get("state")
        search = self.request.query_params.get("search")

        if state:
            queryset = queryset.filter(state__icontains=state)

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search)
            )

        return queryset

    def get_object(self):
        lookup_value = self.kwargs.get(self.lookup_field)

        if not lookup_value:
            raise NotFound("Beach ID not provided.")

        try:
            # Try direct string lookup
            return Beach.objects.get(**{self.lookup_field: lookup_value})
        except Beach.DoesNotExist:
            try:
                # Try converting to ObjectId
                oid = ObjectId(lookup_value)
                return Beach.objects.get(**{self.lookup_field: oid})
            except Exception:
                raise NotFound("Beach not found.")

    # ------------------------
    # Custom Actions
    # ------------------------

    @action(detail=True, methods=["get"])
    def reviews(self, request, _id=None):
        beach = self.get_object()
        reviews = Review.objects.filter(beach_id=str(beach._id))
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def images(self, request, _id=None):
        beach = self.get_object()
        images = BeachImage.objects.filter(
            beach_id=str(beach._id),
            verification_status="verified"
        )
        serializer = BeachImageSerializer(images, many=True)
        return Response(serializer.data)


# ==========================================
# Review ViewSet
# ==========================================

class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    queryset = Review.objects.all()

    def get_queryset(self):
        queryset = Review.objects.all()
        beach_id = self.request.query_params.get("beach_id")

        if beach_id:
            queryset = queryset.filter(beach_id=beach_id)

        return queryset


# ==========================================
# Beach Image ViewSet
# ==========================================

class BeachImageViewSet(viewsets.ModelViewSet):
    serializer_class = BeachImageSerializer
    queryset = BeachImage.objects.all()

    def get_queryset(self):
        queryset = BeachImage.objects.all()
        beach_id = self.request.query_params.get("beach_id")
        status = self.request.query_params.get("verification_status")

        if beach_id:
            queryset = queryset.filter(beach_id=beach_id)

        if status:
            queryset = queryset.filter(verification_status=status)

        return queryset