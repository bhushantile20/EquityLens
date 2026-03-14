import json
import os
import time

# Get the base directory of the backend
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE_DIR = os.path.join(BASE_DIR, "cache")

def load_cache(filename, ttl):
    """
    Loads data from a cache file if it exists and is not older than ttl (in seconds).
    """
    file_path = os.path.join(CACHE_DIR, filename)
    if os.path.exists(file_path):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            
            if time.time() - data.get("timestamp", 0) < ttl:
                return data.get("data")
        except Exception as e:
            print(f"Error loading cache {filename}: {e}")
    return None

def save_cache(filename, data):
    """
    Saves data to a cache file with the current timestamp.
    """
    if not os.path.exists(CACHE_DIR):
        os.makedirs(CACHE_DIR)
        
    file_path = os.path.join(CACHE_DIR, filename)
    try:
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump({
                "timestamp": time.time(),
                "data": data
            }, f, indent=2)
    except Exception as e:
        print(f"Error saving cache {filename}: {e}")
