from django.core.management.base import BaseCommand
from django.utils import timezone

from beaches.models import Beach, Review, BeachImage
from auth.models import User

# For creating small sample images for CV processing
from PIL import Image
import os

# Import ML predictor to generate suitability scores
try:
    from ml_models.suitability_model import predictor
except Exception:
    predictor = None


class Command(BaseCommand):
    help = 'Seed dummy data for development (users, beaches, reviews, images)'

    def handle(self, *args, **options):
        self.stdout.write('Starting dummy data seeding...')

        # --- Users ---
        users_data = [
            {'email': 'alice@example.com', 'name': 'Alice', 'password': 'password123'},
            {'email': 'bob@example.com', 'name': 'Bob', 'password': 'password123'},
        ]

        created_users = []
        for u in users_data:
            user, created = User.objects.get_or_create(email=u['email'])
            if created or not getattr(user, 'name', None):
                user.name = u['name']
                # Model provides set_password helper
                try:
                    user.set_password(u['password'])
                except Exception:
                    # fallback if set_password not available
                    user.password = u['password']
                user.save()
                self.stdout.write(f"Created user: {user.email}")
            else:
                self.stdout.write(f"User already exists: {user.email}")
            created_users.append(user)

        # --- Beaches ---
        beaches_data = [
            {
                'name': 'Sunrise Cove',
                'state': 'Goa',
                'latitude': 15.4909,
                'longitude': 73.8278,
                'description': 'A calm beach perfect for families and sunset walks.',
                'image_url': 'https://example.com/images/sunrise_cove.jpg',
                'suitability_score': 85.0,
                'swimming_score': 80.0,
                'family_score': 90.0,
                'adventure_score': 60.0,
                'crowd_level': 'moderate',
                'cleanliness_score': 88.0,
                'vibe_tags': ['calm', 'sunset', 'family'],
                'sentiment_score': 0.75,
            },
            {
                'name': 'Coral Point',
                'state': 'Kerala',
                'latitude': 9.9312,
                'longitude': 76.2673,
                'description': 'Rocky shore with good snorkeling spots.',
                'image_url': 'https://example.com/images/coral_point.jpg',
                'suitability_score': 72.0,
                'swimming_score': 65.0,
                'family_score': 55.0,
                'adventure_score': 85.0,
                'crowd_level': 'low',
                'cleanliness_score': 70.0,
                'vibe_tags': ['adventure', 'snorkeling'],
                'sentiment_score': 0.5,
            },
            {
                'name': 'Golden Sands',
                'state': 'Maharashtra',
                'latitude': 18.9067,
                'longitude': 72.8200,
                'description': 'Long golden stretch, popular for morning walks.',
                'image_url': 'https://example.com/images/golden_sands.jpg',
                'suitability_score': 78.0,
                'swimming_score': 70.0,
                'family_score': 80.0,
                'adventure_score': 55.0,
                'crowd_level': 'high',
                'cleanliness_score': 65.0,
                'vibe_tags': ['busy', 'walks'],
                'sentiment_score': 0.45,
            },
            {
                'name': 'Palm Bay',
                'state': 'Karnataka',
                'latitude': 13.3419,
                'longitude': 74.7421,
                'description': 'Fringed by palms, quiet and scenic.',
                'image_url': 'https://example.com/images/palm_bay.jpg',
                'suitability_score': 82.0,
                'swimming_score': 78.0,
                'family_score': 85.0,
                'adventure_score': 60.0,
                'crowd_level': 'moderate',
                'cleanliness_score': 80.0,
                'vibe_tags': ['scenic', 'quiet'],
                'sentiment_score': 0.6,
            },
            {
                'name': 'Turtle Beach',
                'state': 'Odisha',
                'latitude': 19.8200,
                'longitude': 85.8333,
                'description': 'Nesting site for turtles (seasonal).',
                'image_url': 'https://example.com/images/turtle_beach.jpg',
                'suitability_score': 68.0,
                'swimming_score': 50.0,
                'family_score': 60.0,
                'adventure_score': 70.0,
                'crowd_level': 'low',
                'cleanliness_score': 75.0,
                'vibe_tags': ['wildlife', 'nature'],
                'sentiment_score': 0.55,
            },
            {
                'name': 'Lagoon Point',
                'state': 'Andhra Pradesh',
                'latitude': 15.9129,
                'longitude': 79.7400,
                'description': 'Protected lagoon with calm waters.',
                'image_url': 'https://example.com/images/lagoon_point.jpg',
                'suitability_score': 80.0,
                'swimming_score': 82.0,
                'family_score': 88.0,
                'adventure_score': 50.0,
                'crowd_level': 'low',
                'cleanliness_score': 90.0,
                'vibe_tags': ['calm', 'family'],
                'sentiment_score': 0.8,
            },
            {
                'name': 'Rocky Headland',
                'state': 'Tamil Nadu',
                'latitude': 11.9416,
                'longitude': 79.8083,
                'description': 'Rocky cliffs and tide pools; good for exploration.',
                'image_url': 'https://example.com/images/rocky_headland.jpg',
                'suitability_score': 60.0,
                'swimming_score': 40.0,
                'family_score': 45.0,
                'adventure_score': 88.0,
                'crowd_level': 'low',
                'cleanliness_score': 60.0,
                'vibe_tags': ['rocky', 'explore', 'tidepools'],
                'sentiment_score': 0.3,
            },
            {
                'name': 'Azure Bay',
                'state': 'Kerala',
                'latitude': 9.5170,
                'longitude': 76.7746,
                'description': 'Clear blue waters and a protected bay.',
                'image_url': 'https://example.com/images/azure_bay.jpg',
                'suitability_score': 90.0,
                'swimming_score': 92.0,
                'family_score': 92.0,
                'adventure_score': 70.0,
                'crowd_level': 'moderate',
                'cleanliness_score': 95.0,
                'vibe_tags': ['clear', 'swimming', 'family'],
                'sentiment_score': 0.92,
            },
            {
                'name': 'Whale Watch Point',
                'state': 'West Bengal',
                'latitude': 21.5723,
                'longitude': 88.3639,
                'description': 'Coastal cliffs popular for birding and whale sightings offshore.',
                'image_url': 'https://example.com/images/whale_watch.jpg',
                'suitability_score': 58.0,
                'swimming_score': 30.0,
                'family_score': 50.0,
                'adventure_score': 65.0,
                'crowd_level': 'low',
                'cleanliness_score': 50.0,
                'vibe_tags': ['wildlife', 'cliffs'],
                'sentiment_score': 0.2,
            },
            {
                'name': 'Seaglass Beach',
                'state': 'Gujarat',
                'latitude': 22.3072,
                'longitude': 70.8022,
                'description': 'Known for small colorful sea glass pieces on the sand.',
                'image_url': 'https://example.com/images/seaglass_beach.jpg',
                'suitability_score': 70.0,
                'swimming_score': 60.0,
                'family_score': 75.0,
                'adventure_score': 55.0,
                'crowd_level': 'moderate',
                'cleanliness_score': 78.0,
                'vibe_tags': ['collecting', 'unique'],
                'sentiment_score': 0.5,
            },
            {
                'name': 'Laguna Sands',
                'state': 'Pondicherry',
                'latitude': 11.9416,
                'longitude': 79.8083,
                'description': 'Chill spot close to town with cafes nearby.',
                'image_url': 'https://example.com/images/laguna_sands.jpg',
                'suitability_score': 77.0,
                'swimming_score': 75.0,
                'family_score': 80.0,
                'adventure_score': 50.0,
                'crowd_level': 'moderate',
                'cleanliness_score': 72.0,
                'vibe_tags': ['cafes', 'urban'],
                'sentiment_score': 0.6,
            },
            {
                'name': 'Dolphin Bay',
                'state': 'Andaman and Nicobar',
                'latitude': 11.7401,
                'longitude': 92.6586,
                'description': 'Remote island waters, great for spotting dolphins.',
                'image_url': 'https://example.com/images/dolphin_bay.jpg',
                'suitability_score': 88.0,
                'swimming_score': 85.0,
                'family_score': 85.0,
                'adventure_score': 80.0,
                'crowd_level': 'low',
                'cleanliness_score': 94.0,
                'vibe_tags': ['wildlife', 'island'],
                'sentiment_score': 0.9,
            },
            {
                'name': 'Lagoon Retreat',
                'state': 'Lakshadweep',
                'latitude': 10.5667,
                'longitude': 72.6417,
                'description': 'Tiny coral islands with turquoise lagoons.',
                'image_url': 'https://example.com/images/lagoon_retreat.jpg',
                'suitability_score': 95.0,
                'swimming_score': 95.0,
                'family_score': 95.0,
                'adventure_score': 90.0,
                'crowd_level': 'low',
                'cleanliness_score': 98.0,
                'vibe_tags': ['paradise', 'snorkeling'],
                'sentiment_score': 0.98,
            },
            {
                'name': 'Sunset Point',
                'state': 'Goa',
                'latitude': 15.4824,
                'longitude': 73.8276,
                'description': 'Small cliff that overlooks the bay; great sunsets.',
                'image_url': 'https://example.com/images/sunset_point.jpg',
                'suitability_score': 84.0,
                'swimming_score': 70.0,
                'family_score': 80.0,
                'adventure_score': 65.0,
                'crowd_level': 'high',
                'cleanliness_score': 82.0,
                'vibe_tags': ['sunset', 'photography'],
                'sentiment_score': 0.78,
            },
            {
                'name': 'Hidden Cove',
                'state': 'Kerala',
                'latitude': 9.6000,
                'longitude': 76.4000,
                'description': 'Tucked away cove only accessible by a short boat ride.',
                'image_url': 'https://example.com/images/hidden_cove.jpg',
                'suitability_score': 73.0,
                'swimming_score': 68.0,
                'family_score': 70.0,
                'adventure_score': 75.0,
                'crowd_level': 'low',
                'cleanliness_score': 85.0,
                'vibe_tags': ['hidden', 'boat'],
                'sentiment_score': 0.65,
            },
        ]

        created_beaches = []
        for b in beaches_data:
            beach, created = Beach.objects.get_or_create(
                name=b['name'], state=b['state'],
                defaults={
                    'latitude': b['latitude'],
                    'longitude': b['longitude'],
                    'description': b['description'],
                    'image_url': b['image_url'],
                    'suitability_score': b['suitability_score'],
                    'swimming_score': b['swimming_score'],
                    'family_score': b['family_score'],
                    'adventure_score': b['adventure_score'],
                    'crowd_level': b['crowd_level'],
                    'cleanliness_score': b['cleanliness_score'],
                    'vibe_tags': b['vibe_tags'],
                    'sentiment_score': b['sentiment_score'],
                }
            )
            if created:
                self.stdout.write(f"Created beach: {beach}")
            else:
                self.stdout.write(f"Beach already exists: {beach}")
            created_beaches.append(beach)

        # --- Reviews ---
        if created_beaches and created_users:
            for beach in created_beaches:
                rev, created = Review.objects.get_or_create(
                    beach_id=str(beach._id),
                    user_id=created_users[0].email,
                    defaults={
                        'rating': 5,
                        'review_text': 'Lovely beach with clean sand and calm waters.',
                        'sentiment_score': 0.9,
                        'extracted_tags': ['clean', 'calm']
                    }
                )
                if created:
                    self.stdout.write(f"Added review for {beach.name}")
                else:
                    self.stdout.write(f"Review already exists for {beach.name}")

                # Add a sample image record
                # ensure a small demo image exists so CV processors can read it
                demo_dir = '/tmp'
                os.makedirs(demo_dir, exist_ok=True)
                demo_image_path = os.path.join(demo_dir, f"{beach.name.replace(' ', '_').lower()}_demo.jpg")

                # Create a tiny placeholder JPEG if missing
                if not os.path.exists(demo_image_path):
                    try:
                        img_obj = Image.new('RGB', (800, 600), color=(200, 220, 255))
                        img_obj.save(demo_image_path, format='JPEG')
                        self.stdout.write(f"Created demo image at {demo_image_path}")
                    except Exception as e:
                        self.stdout.write(f"Could not create demo image for {beach.name}: {e}")

                img, img_created = BeachImage.objects.get_or_create(
                    beach_id=str(beach._id),
                    user_id=created_users[0].email,
                    defaults={
                        'image_path': demo_image_path,
                        'crowd_count': 5,
                        'cleanliness_score': 85.0,
                        'verification_status': 'verified'
                    }
                )
                if img_created:
                    self.stdout.write(f"Added image sample for {beach.name}")
                else:
                    self.stdout.write(f"Image sample already exists for {beach.name}")

            # If an ML predictor is available, compute and save suitability scores
            if predictor is not None:
                for beach in created_beaches:
                    try:
                        features = {
                            'temperature': getattr(beach, 'temperature', 28) or 28,
                            'humidity': 65,
                            'precipitation': 0,
                            'wind_speed': 10,
                            'tide_height': 1.5,
                            'water_temp': getattr(beach, 'temperature', 26) or 26,
                            'air_quality_index': 50,
                            'month': 1
                        }
                        scores = predictor.predict_suitability(features)
                        # Update beach with ML-predicted scores
                        beach.suitability_score = scores.get('overall', beach.suitability_score)
                        beach.swimming_score = scores.get('swimming', beach.swimming_score)
                        beach.family_score = scores.get('family', beach.family_score)
                        beach.adventure_score = scores.get('adventure', beach.adventure_score)
                        beach.save()
                        self.stdout.write(f"Updated ML suitability for {beach.name}")
                    except Exception as e:
                        self.stdout.write(f"Failed to compute ML suitability for {beach.name}: {e}")

        self.stdout.write('Dummy data seeding complete.')
