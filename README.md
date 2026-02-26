# SamudraSetu - Beach Recreational Suitability Mobile Application

A comprehensive mobile application for providing recreational suitability information of beach locations across India. Built as a B.Tech final year project using React Native, Django, and MongoDB.

## Features

### 1. Custom ML-Based Recreational Suitability Prediction Model
- Predicts beach suitability scores using scikit-learn (Random Forest)
- Considers weather patterns, tide conditions, pollution indicators, and seasonal factors
- Provides scores for swimming, family outings, and adventure activities

### 2. Crowdsourced Beach Condition Verification using Computer Vision
- Users can upload beach condition images
- OpenCV-based image processing for crowd level and cleanliness assessment
- Consensus mechanism ensures reliability before updating beach conditions

### 3. Personalized Itinerary Builder using Graph Algorithms
- Uses Dijkstra's algorithm and TSP approximations for optimal route planning
- Considers user preferences, time constraints, and suitability scores
- Calculates distances using geographical formulas (no paid APIs)

### 4. Sentiment Analysis of User Reviews for Beach Vibe Detection
- NLTK and TextBlob for sentiment analysis
- Detects beach vibes: relaxing, adventurous, crowded, romantic, etc.
- Visualizes data with charts and keyword extraction

### 5. Offline Data Sync with Conflict Resolution Mechanism
- Local caching of beach data and user interactions
- Syncs with backend when connectivity is restored
- Timestamp-based and majority consensus conflict resolution

### 6. Eco-Impact Simulation and Sustainability Awareness Module
- Calculates carbon emissions based on travel distance and transport mode
- Estimates waste generation and provides eco-friendly suggestions
- Visualizes environmental impact and suggests sustainable alternatives

## Tech Stack

### Frontend (React Native)
- React Native with Expo
- React Navigation
- AsyncStorage for offline support
- Axios for API calls

### Backend (Django)
- Django REST Framework
- MongoDB with Djongo
- scikit-learn for ML models
- OpenCV for computer vision
- NLTK/TextBlob for sentiment analysis
- NetworkX for graph algorithms
- Geopy for distance calculations

## Project Structure

```
SamudraSetu-1/
├── backend/                 # Django backend API
│   ├── beaches/            # Beach data models
│   ├── ml_models/          # ML suitability prediction
│   ├── cv_processing/      # Computer vision processing
│   ├── itinerary/          # Graph-based itinerary builder
│   ├── sentiment/          # Sentiment analysis
│   ├── sync/               # Offline sync & conflict resolution
│   └── eco_impact/         # Environmental impact calculation
├── screens/                # React Native screens
├── components/             # Reusable components
├── services/               # API services
└── navigation/             # Navigation configuration
```

## Setup Instructions

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Run setup script (Linux/Mac):
```bash
./setup.sh
```

Or manually:
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -c "import nltk; nltk.download('vader_lexicon'); nltk.download('punkt'); nltk.download('stopwords')"
```

3. Configure MongoDB connection in `.env`:
```env
MONGODB_NAME=samudrasetu
MONGODB_HOST=mongodb://localhost:27017/
MONGODB_PORT=27017
SECRET_KEY=your-secret-key-here
```

4. Run migrations:
```bash
python manage.py migrate
```

5. Start the server:
```bash
python manage.py runserver
```

Backend API will be available at `http://localhost:8000`

### Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. Update API base URL in `services/api.js` if needed

3. Start Expo:
```bash
npm start
```

4. Run on device/emulator:
```bash
npm run android  # Android
npm run ios      # iOS
```

## API Documentation

See `backend/README.md` for detailed API documentation.

## Key Endpoints

- `GET /api/beaches/` - List all beaches
- `POST /api/ml/predict/` - Predict suitability scores
- `POST /api/cv/upload/` - Upload beach condition image
- `POST /api/itinerary/build/` - Build optimal itinerary
- `POST /api/sentiment/analyze/` - Analyze review sentiment
- `POST /api/sync/sync/` - Sync offline operations
- `POST /api/eco/calculate/` - Calculate environmental impact

## Development Notes

- All features use free and open-source tools
- No paid APIs or cloud services required
- Suitable for academic evaluation and demonstration
- Comprehensive implementation of ML, CV, NLP, and algorithms

## License

This project is developed as part of a B.Tech final year project.

## Contributors

Developed for academic purposes as a final year project.
