from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os

from .schemas import NearbySearchRequest, NearbySearchResponse
from .services.google_places import search_nearby_restaurants
from .services.parser import parse_user_query
from .services.recommendation import rank_restaurants
from .services.place_details import get_place_details

app = FastAPI(title="Food Agent API")
BACKEND_API_KEY = os.getenv("BACKEND_API_KEY")


def verify_api_key(x_api_key: str = Header(default="")):
    if BACKEND_API_KEY and x_api_key != BACKEND_API_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://food-agent-zeta.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/restaurant/{place_id}/details")
def restaurant_details(
    place_id: str,
    x_api_key: str = Header(default=""),
):
    """
    Fetch website and menu URL for a single restaurant.
    Called on demand (top pick only) to avoid excess API usage.
    """
    verify_api_key(x_api_key)
    return get_place_details(place_id)


@app.post("/restaurants/nearby", response_model=NearbySearchResponse)
def nearby_restaurants(
    payload: NearbySearchRequest,
    x_api_key: str = Header(default=""),
):
    verify_api_key(x_api_key)

    parsed = parse_user_query(payload.keyword or "")

    radius = payload.radius if payload.radius is not None else parsed["radius"]
    keyword = parsed["keyword"]
    open_only = parsed["open_now"]

    # Price level: explicit payload takes priority over NLP-parsed value
    min_price = payload.min_price if payload.min_price is not None else parsed.get("min_price")
    max_price = payload.max_price if payload.max_price is not None else parsed.get("max_price")

    # Place type: explicit payload takes priority over NLP-parsed value
    place_type = payload.place_type if payload.place_type is not None else parsed.get("place_type", "restaurant")

    results = search_nearby_restaurants(
        lat=payload.lat,
        lng=payload.lng,
        radius=radius,
        keyword=keyword,
        min_price=min_price,
        max_price=max_price,
        place_type=place_type,
    )

    # ✅ FIX: this filter was outside the function before — now it's in the right place
    if open_only:
        results = [r for r in results if r.get("open_now")]

    ranked = rank_restaurants(results)

    return {
        "summary": "Best match based on rating, distance, and availability",
        "top_pick": ranked["top_pick"],
        "alternatives": ranked["alternatives"],
        "results": ranked["all"],
    }
