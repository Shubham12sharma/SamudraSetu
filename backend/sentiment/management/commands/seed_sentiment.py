"""
Seed sample reviews and sentiment data for beaches.

Run:
    python manage.py seed_sentiment

This will:
- Create a few example reviews for each beach (if it has none yet)
- Analyze sentiment & vibe tags using the BeachSentimentAnalyzer
- Update each Beach.sentiment_score and Beach.vibe_tags for UI display
"""
from django.core.management.base import BaseCommand

from beaches.models import Beach, Review
from sentiment.sentiment_analyzer import analyzer


class Command(BaseCommand):
    help = "Seed sample beach reviews and aggregate sentiment/vibe data"

    def handle(self, *args, **options):
        beaches = Beach.objects.all()
        if not beaches.exists():
            self.stdout.write(
                self.style.WARNING(
                    "No beaches found. Run `python manage.py seed_beaches` first."
                )
            )
            return

        total_reviews_created = 0
        beaches_updated = 0

        for beach in beaches:
            # Skip if beach already has reviews – avoid duplicating seed data
            if Review.objects.filter(beach_id=beach._id).exists():
                self.stdout.write(
                    self.style.WARNING(
                        f"Skipping {beach.name}, {beach.state} (already has reviews)"
                    )
                )
                continue

            reviews_payload = self._build_reviews_for_beach(beach)

            created_here = 0
            for payload in reviews_payload:
                text = payload["text"]
                rating = payload["rating"]

                analysis = analyzer.analyze_review(text)

                Review.objects.create(
                    beach_id=beach._id,
                    user_id="seed_user",
                    rating=rating,
                    review_text=text,
                    sentiment_score=analysis["sentiment_score"],
                    extracted_tags=analysis["vibe_tags"],
                )
                created_here += 1

            total_reviews_created += created_here

            if created_here:
                self._update_beach_aggregate_sentiment(beach)
                beaches_updated += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Created {created_here} reviews and updated sentiment for {beach.name}, {beach.state}"
                    )
                )

        self.stdout.write(
            self.style.SUCCESS(
                f"\nSeeded {total_reviews_created} reviews across {beaches_updated} beaches."
            )
        )

    def _build_reviews_for_beach(self, beach):
        """
        Build a small set of example reviews based on existing beach properties.
        """
        name = beach.name
        state = beach.state
        crowd = (beach.crowd_level or "").lower()
        clean = float(getattr(beach, "cleanliness_score", 0.0) or 0.0)

        reviews = []

        # Very clean & low crowd – relaxing / pristine
        if clean >= 90 and crowd in ("low", "unknown", ""):
            reviews.append(
                {
                    "rating": 5,
                    "text": f"{name} in {state} is absolutely pristine and relaxing. "
                    f"The water is crystal clear, the sand is clean, and it feels very peaceful and family-friendly.",
                }
            )
            reviews.append(
                {
                    "rating": 5,
                    "text": f"Beautiful and calm beach with a serene vibe. Perfect for a quiet sunset with family.",
                }
            )
        # High crowd – lively / party / crowded
        elif crowd == "high":
            reviews.append(
                {
                    "rating": 4,
                    "text": f"{name} is very crowded and busy but the atmosphere is lively. "
                    f"Great nightlife, music and food stalls, though not the cleanest beach.",
                }
            )
            reviews.append(
                {
                    "rating": 3,
                    "text": "Fun place with lots of people and activities, but can feel a bit too noisy and packed during weekends.",
                }
            )
        # Moderate crowd / cleanliness – balanced
        else:
            reviews.append(
                {
                    "rating": 4,
                    "text": f"Nice beach at {name} with moderate crowd and decent cleanliness. "
                    f"Good for a relaxing walk and some water sports.",
                }
            )
            reviews.append(
                {
                    "rating": 4,
                    "text": "Good family-friendly spot with a mix of adventure and relaxation. "
                    "Could be a bit cleaner but overall a pleasant experience.",
                }
            )

        # Add one explicitly adventurous review to highlight that vibe
        reviews.append(
            {
                "rating": 5,
                "text": "Loved the water sports here – jet skiing, parasailing and surfing made it a very adventurous trip!",
            }
        )

        return reviews

    def _update_beach_aggregate_sentiment(self, beach):
        """
        Aggregate sentiment and vibe tags for a beach and update the Beach document.
        """
        reviews = Review.objects.filter(beach_id=beach._id)
        analyzed = []

        for review in reviews:
            if review.sentiment_score is not None:
                analyzed.append(
                    {
                        "sentiment_score": review.sentiment_score,
                        "vibe_tags": review.extracted_tags or [],
                    }
                )

        if not analyzed:
            return

        aggregated = analyzer.aggregate_beach_sentiment(analyzed)
        beach.sentiment_score = aggregated["average_sentiment"]
        beach.vibe_tags = aggregated["dominant_vibes"]
        beach.save()

