import os
from pymongo import MongoClient
import certifi
from dotenv import load_dotenv

load_dotenv()

uri = os.getenv('MONGODB_HOST')
db_name = os.getenv('MONGODB_NAME')

print(f"Testing connection to: {uri.split('@')[-1]}") # Print host only for security
print(f"Database: {db_name}")

try:
    client = MongoClient(
        uri, 
        tlsCAFile=certifi.where(),
        serverSelectionTimeoutMS=5000,
        tlsAllowInvalidCertificates=True
    )
    # The ismaster command is cheap and does not require auth.
    # But admin.command('ping') requires auth.
    client.admin.command('ping')
    print("Ping successful! Auth is working.")
    
    db = client[db_name]
    print(f"Collections in {db_name}: {db.list_collection_names()}")
    
except Exception as e:
    print(f"Connection failed: {e}")
