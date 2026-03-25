import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parents[2]
ENV_PATH = BASE_DIR / ".env"

load_dotenv(dotenv_path=ENV_PATH)

GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
PLACES_NEARBY_URL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"

print("ENV PATH:", ENV_PATH)
print("ENV FILE EXISTS:", ENV_PATH.exists())
print("KEY PRESENT IN CONFIG:", bool(GOOGLE_MAPS_API_KEY))