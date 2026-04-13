import os
import json
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

MONGODB_HOST = os.getenv('MONGODB_HOST')
MONGODB_NAME = os.getenv('MONGODB_NAME')

# Connect to MongoDB
client = MongoClient(MONGODB_HOST)
db = client[MONGODB_NAME]
collection = db['beaches']

# Load beaches data from JSON file
with open(os.path.join(os.path.dirname(__file__), 'beaches/beaches.json'), 'r', encoding='utf-8') as f:
    data = json.load(f)

beaches = data.get('beaches', [])

if beaches:
    # Insert data into the collection
    result = collection.insert_many(beaches)
    print(f"Inserted {len(result.inserted_ids)} beaches into the collection.")
else:
    print("No beaches data found in beaches.json.")
