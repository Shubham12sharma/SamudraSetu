"""
Django management command to seed initial beach data
Run with: python manage.py seed_beaches
"""
from django.core.management.base import BaseCommand
from beaches.models import Beach
from bson import ObjectId


class Command(BaseCommand):
    help = 'Seed initial beach data'

    def handle(self, *args, **options):
        beaches_data = [
            {
                'name': 'Goa Beach',
                'state': 'Goa',
                'latitude': 15.2993,
                'longitude': 73.9073,
                'description': 'Popular tourist destination with water sports',
                'suitability_score': 75.0,
                'swimming_score': 80.0,
                'family_score': 70.0,
                'adventure_score': 85.0,
                'crowd_level': 'moderate',
                'cleanliness_score': 65.0,
                'water_quality': 'Good',
                'pollution_level': 'Moderate',
            },
            {
                'name': 'Mararikulam Beach',
                'state': 'Kerala',
                'latitude': 9.6386,
                'longitude': 76.3153,
                'description': 'Serene backwater beach with houseboat rides',
                'suitability_score': 85.0,
                'swimming_score': 90.0,
                'family_score': 88.0,
                'adventure_score': 75.0,
                'crowd_level': 'low',
                'cleanliness_score': 90.0,
                'water_quality': 'Excellent',
                'pollution_level': 'Low',
            },
            {
                'name': 'Marina Beach',
                'state': 'Tamil Nadu',
                'latitude': 13.0475,
                'longitude': 80.2826,
                'description': 'Longest beach in India with vibrant atmosphere',
                'suitability_score': 70.0,
                'swimming_score': 65.0,
                'family_score': 75.0,
                'adventure_score': 70.0,
                'crowd_level': 'high',
                'cleanliness_score': 60.0,
                'water_quality': 'Fair',
                'pollution_level': 'Moderate to High',
            },
            {
                'name': 'Radhanagar Beach',
                'state': 'Andaman',
                'latitude': 11.9794,
                'longitude': 92.9668,
                'description': 'Pristine white sand beach with crystal clear waters',
                'suitability_score': 95.0,
                'swimming_score': 98.0,
                'family_score': 92.0,
                'adventure_score': 95.0,
                'crowd_level': 'low',
                'cleanliness_score': 98.0,
                'water_quality': 'Pristine',
                'pollution_level': 'Very Low',
            },
            {
                'name': 'Ashvem Beach',
                'state': 'Goa',
                'latitude': 15.7483,
                'longitude': 73.7389,
                'description': 'Quiet northern beach perfect for relaxation',
                'suitability_score': 78.0,
                'swimming_score': 75.0,
                'family_score': 80.0,
                'adventure_score': 70.0,
                'crowd_level': 'low',
                'cleanliness_score': 85.0,
                'water_quality': 'Good',
                'pollution_level': 'Low',
            },
            {
                'name': 'Varkala Beach',
                'state': 'Kerala',
                'latitude': 8.7379,
                'longitude': 76.7167,
                'description': 'Scenic cliffside beach with ayurvedic treatments',
                'suitability_score': 82.0,
                'swimming_score': 85.0,
                'family_score': 78.0,
                'adventure_score': 85.0,
                'crowd_level': 'moderate',
                'cleanliness_score': 88.0,
                'water_quality': 'Excellent',
                'pollution_level': 'Low',
            },
        ]

        created_count = 0
        for beach_data in beaches_data:
            # Check if beach already exists
            existing = Beach.objects.filter(name=beach_data['name'], state=beach_data['state']).first()
            if not existing:
                beach = Beach(**beach_data)
                beach.save()
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created beach: {beach.name}, {beach.state}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Beach already exists: {beach_data["name"]}, {beach_data["state"]}')
                )

        self.stdout.write(
            self.style.SUCCESS(f'\nSuccessfully created {created_count} beaches')
        )
