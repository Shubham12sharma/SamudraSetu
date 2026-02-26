"""
ML-Based Recreational Suitability Prediction Model
Uses scikit-learn to predict beach suitability scores
"""
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import joblib
import os
from django.conf import settings


class SuitabilityPredictor:
    """
    Predicts recreational suitability scores for beaches based on:
    - Weather patterns (temperature, humidity, precipitation)
    - Tide conditions
    - Pollution indicators
    - Seasonal factors (monsoon season)
    - Historical data
    """
    
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.model_path = os.path.join(settings.BASE_DIR, 'ml_models', 'saved_models', 'suitability_model.pkl')
        self.scaler_path = os.path.join(settings.BASE_DIR, 'ml_models', 'saved_models', 'scaler.pkl')
        self._load_or_create_model()
    
    def _load_or_create_model(self):
        """Load existing model or create a new one"""
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        
        if os.path.exists(self.model_path):
            try:
                self.model = joblib.load(self.model_path)
                self.scaler = joblib.load(self.scaler_path)
            except:
                self._train_initial_model()
        else:
            self._train_initial_model()
    
    def _generate_synthetic_training_data(self, n_samples=500):
        """
        Generate synthetic training data based on realistic patterns
        In production, this would be replaced with real historical data
        """
        np.random.seed(42)
        
        # Feature columns:
        # 0: temperature (20-35°C)
        # 1: humidity (40-90%)
        # 2: precipitation (0-200mm)
        # 3: wind_speed (0-30 km/h)
        # 4: tide_height (0-3m)
        # 5: water_temp (22-30°C)
        # 6: air_quality_index (0-300)
        # 7: month (1-12)
        # 8: is_monsoon (0 or 1)
        # 9: day_of_year (1-365)
        
        X = np.zeros((n_samples, 10))
        
        # Temperature (warmer is better, but not too hot)
        X[:, 0] = np.random.normal(28, 3, n_samples)
        X[:, 0] = np.clip(X[:, 0], 20, 35)
        
        # Humidity (moderate is best)
        X[:, 1] = np.random.normal(65, 15, n_samples)
        X[:, 1] = np.clip(X[:, 1], 40, 90)
        
        # Precipitation (less is better)
        X[:, 2] = np.random.exponential(10, n_samples)
        X[:, 2] = np.clip(X[:, 2], 0, 200)
        
        # Wind speed (moderate is best for activities)
        X[:, 3] = np.random.normal(12, 5, n_samples)
        X[:, 3] = np.clip(X[:, 3], 0, 30)
        
        # Tide height
        X[:, 4] = np.random.uniform(0.5, 2.5, n_samples)
        
        # Water temperature
        X[:, 5] = X[:, 0] - 2 + np.random.normal(0, 1, n_samples)
        X[:, 5] = np.clip(X[:, 5], 22, 30)
        
        # Air quality (lower is better)
        X[:, 6] = np.random.gamma(2, 30, n_samples)
        X[:, 6] = np.clip(X[:, 6], 0, 300)
        
        # Month (seasonal factor)
        X[:, 7] = np.random.randint(1, 13, n_samples)
        
        # Monsoon season (June-September for most of India)
        X[:, 8] = ((X[:, 7] >= 6) & (X[:, 7] <= 9)).astype(int)
        
        # Day of year
        X[:, 9] = np.random.randint(1, 366, n_samples)
        
        # Generate target scores (0-100)
        # Swimming score: based on water temp, tide, weather, pollution
        swimming_scores = (
            30 * (1 - abs(X[:, 5] - 26) / 8) +  # Optimal water temp around 26°C
            20 * (1 - X[:, 2] / 100) +  # Less rain is better
            20 * (1 - X[:, 6] / 300) +  # Better air quality
            15 * (1 - X[:, 8]) +  # Non-monsoon is better
            15 * np.clip(1 - X[:, 3] / 25, 0, 1)  # Moderate wind
        )
        swimming_scores = np.clip(swimming_scores, 0, 100)
        
        # Family score: based on safety, cleanliness, weather
        family_scores = (
            25 * (1 - X[:, 2] / 100) +  # Less rain
            25 * (1 - X[:, 6] / 300) +  # Better air quality
            20 * (1 - X[:, 8]) +  # Non-monsoon
            15 * (1 - abs(X[:, 0] - 28) / 10) +  # Comfortable temperature
            15 * (1 - X[:, 3] / 30)  # Lower wind
        )
        family_scores = np.clip(family_scores, 0, 100)
        
        # Adventure score: based on wind, waves, weather
        adventure_scores = (
            30 * np.clip(X[:, 3] / 20, 0, 1) +  # Wind for water sports
            25 * (1 - X[:, 2] / 150) +  # Less rain
            20 * (1 - X[:, 8] * 0.5) +  # Slightly better in non-monsoon
            15 * (1 - abs(X[:, 0] - 28) / 12) +  # Comfortable temp
            10 * (1 - X[:, 6] / 300)  # Air quality
        )
        adventure_scores = np.clip(adventure_scores, 0, 100)
        
        # Overall suitability (weighted average)
        overall_scores = 0.4 * swimming_scores + 0.35 * family_scores + 0.25 * adventure_scores
        
        return X, {
            'overall': overall_scores,
            'swimming': swimming_scores,
            'family': family_scores,
            'adventure': adventure_scores
        }
    
    def _train_initial_model(self):
        """Train initial model with synthetic data"""
        X, y = self._generate_synthetic_training_data()
        y_overall = y['overall']
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Train model
        self.model = RandomForestRegressor(
            n_estimators=100,
            max_depth=15,
            random_state=42,
            n_jobs=-1
        )
        self.model.fit(X_scaled, y_overall)
        
        # Save model
        joblib.dump(self.model, self.model_path)
        joblib.dump(self.scaler, self.scaler_path)
    
    def predict_suitability(self, features_dict):
        """
        Predict suitability scores for given features
        
        Args:
            features_dict: Dictionary with keys:
                - temperature: float (20-35°C)
                - humidity: float (40-90%)
                - precipitation: float (0-200mm)
                - wind_speed: float (0-30 km/h)
                - tide_height: float (0-3m)
                - water_temp: float (22-30°C)
                - air_quality_index: float (0-300)
                - month: int (1-12)
        
        Returns:
            dict with 'overall', 'swimming', 'family', 'adventure' scores
        """
        # Extract features in correct order
        month = features_dict.get('month', 1)
        is_monsoon = 1 if month >= 6 and month <= 9 else 0
        day_of_year = ((month - 1) * 30) + 15  # Approximate
        
        X = np.array([[
            features_dict.get('temperature', 28),
            features_dict.get('humidity', 65),
            features_dict.get('precipitation', 0),
            features_dict.get('wind_speed', 12),
            features_dict.get('tide_height', 1.5),
            features_dict.get('water_temp', 26),
            features_dict.get('air_quality_index', 50),
            month,
            is_monsoon,
            day_of_year
        ]])
        
        # Scale and predict
        X_scaled = self.scaler.transform(X)
        overall_score = float(self.model.predict(X_scaled)[0])
        overall_score = np.clip(overall_score, 0, 100)
        
        # Calculate individual scores using rule-based approach
        temp = features_dict.get('temperature', 28)
        water_temp = features_dict.get('water_temp', 26)
        precip = features_dict.get('precipitation', 0)
        aqi = features_dict.get('air_quality_index', 50)
        wind = features_dict.get('wind_speed', 12)
        
        swimming_score = float(np.clip(
            30 * (1 - abs(water_temp - 26) / 8) +
            20 * (1 - precip / 100) +
            20 * (1 - aqi / 300) +
            15 * (1 - is_monsoon) +
            15 * np.clip(1 - wind / 25, 0, 1),
            0, 100
        ))
        
        family_score = float(np.clip(
            25 * (1 - precip / 100) +
            25 * (1 - aqi / 300) +
            20 * (1 - is_monsoon) +
            15 * (1 - abs(temp - 28) / 10) +
            15 * (1 - wind / 30),
            0, 100
        ))
        
        adventure_score = float(np.clip(
            30 * np.clip(wind / 20, 0, 1) +
            25 * (1 - precip / 150) +
            20 * (1 - is_monsoon * 0.5) +
            15 * (1 - abs(temp - 28) / 12) +
            10 * (1 - aqi / 300),
            0, 100
        ))
        
        return {
            'overall': round(overall_score, 2),
            'swimming': round(swimming_score, 2),
            'family': round(family_score, 2),
            'adventure': round(adventure_score, 2)
        }
    
    def retrain_model(self, X, y):
        """Retrain model with new data"""
        X_scaled = self.scaler.fit_transform(X)
        self.model.fit(X_scaled, y)
        joblib.dump(self.model, self.model_path)
        joblib.dump(self.scaler, self.scaler_path)


# Global instance
predictor = SuitabilityPredictor()
