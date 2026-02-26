"""
Sentiment Analysis for Beach Vibe Detection
Uses NLTK and TextBlob for sentiment analysis and keyword extraction
"""
import nltk
from textblob import TextBlob
from nltk.sentiment import SentimentIntensityAnalyzer
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
import re
from collections import Counter


class BeachSentimentAnalyzer:
    """
    Analyzes user reviews to determine beach vibe and sentiment
    """
    
    def __init__(self):
        try:
            self.sia = SentimentIntensityAnalyzer()
            self.stop_words = set(stopwords.words('english'))
        except:
            # Fallback if NLTK data not available
            self.sia = None
            self.stop_words = set()
        
        # Beach vibe keywords
        self.vibe_keywords = {
            'relaxing': ['relax', 'peaceful', 'calm', 'serene', 'quiet', 'tranquil', 'zen'],
            'adventurous': ['adventure', 'exciting', 'thrilling', 'water sports', 'surfing', 'diving', 'snorkeling'],
            'crowded': ['crowded', 'busy', 'packed', 'people', 'tourist', 'crowd'],
            'romantic': ['romantic', 'couples', 'sunset', 'beautiful', 'scenic', 'picturesque'],
            'family-friendly': ['family', 'kids', 'children', 'safe', 'clean', 'suitable'],
            'party': ['party', 'nightlife', 'bar', 'music', 'fun', 'lively'],
            'pristine': ['clean', 'pristine', 'crystal', 'clear', 'pure', 'untouched'],
            'wild': ['wild', 'natural', 'untamed', 'remote', 'isolated']
        }
    
    def analyze_sentiment(self, text):
        """
        Analyze sentiment of review text
        
        Returns: sentiment score (-1 to 1, where 1 is positive)
        """
        if not text:
            return 0.0
        
        # Use TextBlob
        blob = TextBlob(text)
        polarity = blob.sentiment.polarity
        
        # Use VADER if available
        if self.sia:
            vader_scores = self.sia.polarity_scores(text)
            # Combine TextBlob and VADER (weighted average)
            combined_score = (polarity * 0.5) + (vader_scores['compound'] * 0.5)
            return round(combined_score, 3)
        
        return round(polarity, 3)
    
    def extract_keywords(self, text):
        """
        Extract relevant keywords from review text
        
        Returns: list of keywords
        """
        if not text:
            return []
        
        # Convert to lowercase
        text_lower = text.lower()
        
        # Remove special characters
        text_clean = re.sub(r'[^a-zA-Z\s]', '', text_lower)
        
        # Tokenize
        try:
            tokens = word_tokenize(text_clean)
        except:
            tokens = text_clean.split()
        
        # Remove stopwords and short words
        keywords = [
            word for word in tokens
            if word not in self.stop_words and len(word) > 2
        ]
        
        return keywords
    
    def detect_vibe_tags(self, text):
        """
        Detect beach vibe tags based on keywords
        
        Returns: list of vibe tags
        """
        if not text:
            return []
        
        text_lower = text.lower()
        detected_tags = []
        
        for vibe, keywords in self.vibe_keywords.items():
            # Count keyword matches
            matches = sum(1 for keyword in keywords if keyword in text_lower)
            if matches > 0:
                detected_tags.append(vibe)
        
        return detected_tags
    
    def analyze_review(self, review_text):
        """
        Complete analysis of a review
        
        Returns: dict with sentiment_score, keywords, and vibe_tags
        """
        sentiment_score = self.analyze_sentiment(review_text)
        keywords = self.extract_keywords(review_text)
        vibe_tags = self.detect_vibe_tags(review_text)
        
        # Get top keywords (most frequent)
        keyword_counter = Counter(keywords)
        top_keywords = [word for word, count in keyword_counter.most_common(10)]
        
        return {
            'sentiment_score': sentiment_score,
            'keywords': top_keywords,
            'vibe_tags': vibe_tags
        }
    
    def aggregate_beach_sentiment(self, reviews):
        """
        Aggregate sentiment analysis results from multiple reviews
        
        Args:
            reviews: List of Review objects or dicts with 'review_text' and 'sentiment_score'
        
        Returns: aggregated sentiment and vibe analysis
        """
        if not reviews:
            return {
                'average_sentiment': 0.0,
                'vibe_tags': [],
                'dominant_vibes': [],
                'review_count': 0
            }
        
        sentiment_scores = []
        all_vibe_tags = []
        all_keywords = []
        
        for review in reviews:
            if hasattr(review, 'review_text'):
                text = review.review_text
                analysis = self.analyze_review(text)
                sentiment_scores.append(analysis['sentiment_score'])
                all_vibe_tags.extend(analysis['vibe_tags'])
                all_keywords.extend(analysis['keywords'])
            elif isinstance(review, dict):
                if 'sentiment_score' in review:
                    sentiment_scores.append(review['sentiment_score'])
                if 'vibe_tags' in review:
                    all_vibe_tags.extend(review['vibe_tags'])
                if 'keywords' in review:
                    all_keywords.extend(review['keywords'])
        
        # Calculate average sentiment
        avg_sentiment = sum(sentiment_scores) / len(sentiment_scores) if sentiment_scores else 0.0
        
        # Get dominant vibe tags (most frequent)
        vibe_counter = Counter(all_vibe_tags)
        dominant_vibes = [vibe for vibe, count in vibe_counter.most_common(5)]
        
        # Get top keywords
        keyword_counter = Counter(all_keywords)
        top_keywords = [word for word, count in keyword_counter.most_common(10)]
        
        return {
            'average_sentiment': round(avg_sentiment, 3),
            'vibe_tags': list(set(all_vibe_tags)),
            'dominant_vibes': dominant_vibes,
            'top_keywords': top_keywords,
            'review_count': len(reviews)
        }


# Global instance
analyzer = BeachSentimentAnalyzer()
