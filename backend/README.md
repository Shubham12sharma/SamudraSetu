# SamudraSetu Backend API

Django REST API backend for the SamudraSetu beach recreational suitability mobile application.

## Features

1. **ML-Based Recreational Suitability Prediction** - Predicts beach suitability scores using scikit-learn
2. **Crowdsourced Beach Condition Verification** - OpenCV-based image processing for crowd and cleanliness detection
3. **Personalized Itinerary Builder** - Graph algorithms (Dijkstra) for optimal route planning
4. **Sentiment Analysis** - NLTK/TextBlob for beach vibe detection from reviews
5. **Offline Data Sync** - Conflict resolution mechanism for offline operations
6. **Eco-Impact Simulation** - Environmental impact calculation and sustainability suggestions

## Setup Instructions

### Prerequisites

- Python 3.8+
- MongoDB (running locally or remote)
- pip (Python package manager)

### Installation

1. **Create a virtual environment (recommended):**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your MongoDB connection details
```

4. **Download NLTK data (for sentiment analysis):**
```bash
python -c "import nltk; nltk.download('vader_lexicon'); nltk.download('punkt'); nltk.download('stopwords')"
```

5. **Run migrations:**
```bash
python manage.py makemigrations
python manage.py migrate
```

6. **Create a superuser (optional, for admin panel):**
```bash
python manage.py createsuperuser
```

7. **Run the development server:**
```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Beaches
- `GET /api/beaches/` - List all beaches
- `GET /api/beaches/{id}/` - Get beach details
- `GET /api/beaches/{id}/reviews/` - Get beach reviews
- `GET /api/beaches/{id}/images/` - Get beach images

### ML Suitability Prediction
- `POST /api/ml/predict/` - Predict suitability scores
- `GET /api/ml/beach/{beach_id}/` - Get suitability scores

### Computer Vision Processing
- `POST /api/cv/upload/` - Upload and verify beach image
- `GET /api/cv/beach/{beach_id}/status/` - Get condition status

### Itinerary Builder
- `POST /api/itinerary/build/` - Build optimal itinerary
- `POST /api/itinerary/optimize/` - Optimize existing route
- `GET /api/itinerary/shortest-path/` - Get shortest path between beaches

### Sentiment Analysis
- `POST /api/sentiment/analyze/` - Analyze review sentiment
- `POST /api/sentiment/beach/{beach_id}/analyze/` - Analyze all beach reviews
- `GET /api/sentiment/beach/{beach_id}/vibe/` - Get beach vibe

### Offline Sync
- `POST /api/sync/sync/` - Sync offline operations
- `GET /api/sync/status/{user_id}/` - Get sync status
- `GET /api/sync/conflicts/{user_id}/` - Get conflict history

### Eco Impact
- `POST /api/eco/calculate/` - Calculate environmental impact
- `POST /api/eco/compare-transport/` - Compare transport modes
- `POST /api/eco/itinerary-impact/` - Calculate itinerary impact

## Database

The application uses MongoDB. Make sure MongoDB is running before starting the server.

```bash
# Start MongoDB (example for Linux/Mac)
mongod

# Or if installed as a service
sudo systemctl start mongod
```

## Project Structure

```
backend/
├── samudrasetu_backend/    # Django project settings
├── beaches/                # Beach data models and views
├── ml_models/             # ML suitability prediction
├── cv_processing/         # Computer vision image processing
├── itinerary/             # Graph-based itinerary builder
├── sentiment/             # Sentiment analysis
├── sync/                  # Offline sync and conflict resolution
├── eco_impact/            # Environmental impact calculation
└── manage.py
```

## Testing

Run tests (when implemented):
```bash
python manage.py test
```

## Production Deployment

For production deployment:

1. Set `DEBUG = False` in settings.py
2. Set proper `SECRET_KEY`
3. Configure proper `ALLOWED_HOSTS`
4. Use a production WSGI server (e.g., Gunicorn)
5. Set up proper MongoDB connection with authentication
6. Configure static file serving
7. Set up SSL/HTTPS

## License

This project is part of a B.Tech final year project.
