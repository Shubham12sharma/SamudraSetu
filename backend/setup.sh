#!/bin/bash

# Setup script for SamudraSetu Backend

echo "Setting up SamudraSetu Backend..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Download NLTK data
echo "Downloading NLTK data..."
python -c "import nltk; nltk.download('vader_lexicon', quiet=True); nltk.download('punkt', quiet=True); nltk.download('stopwords', quiet=True)"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo "Please edit .env file with your MongoDB connection details"
fi

# Create media directory
mkdir -p media
mkdir -p ml_models/saved_models

echo "Setup complete!"
echo "Next steps:"
echo "1. Edit .env file with your MongoDB connection details"
echo "2. Run: python manage.py migrate"
echo "3. Run: python manage.py runserver"
