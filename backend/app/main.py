from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os

from .schemas import NearbySearchRequest, NearbySearchResponse
from .services.google_places import search_nearby_restaurants
from .services.parser import parse_user_query
from .services.recommendation import rank_restaurants
from .services.place_details import get_place_details
from .services.bot import bot_reply

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


class BotChatRequest(BaseModel):
    message: str
    lat: float
    lng: float
    last_keyword: str | None = None


@app.post("/bot/chat")
def bot_chat(payload: BotChatRequest, x_api_key: str = Header(default="")):
    verify_api_key(x_api_key)
    return bot_reply(
        message=payload.message,
        lat=payload.lat,
        lng=payload.lng,
        last_keyword=payload.last_keyword,
    )


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
    open_only = parsed["open_now"]

    # Cuisine filter merges with keyword
    base_keyword = parsed["keyword"]
    if payload.cuisine:
        base_keyword = f"{payload.cuisine} {base_keyword}".strip()
    keyword = base_keyword

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

    if open_only:
        results = [r for r in results if r.get("open_now")]

    # Apply rating filter
    if payload.min_rating is not None:
        results = [r for r in results if (r.get("rating") or 0) >= payload.min_rating]

    ranked = rank_restaurants(results)

    return {
        "summary": "Best match based on rating, distance, and availability",
        "top_pick": ranked["top_pick"],
        "alternatives": ranked["alternatives"],
        "results": ranked["all"],
    }
