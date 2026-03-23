from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.schemas import NearbySearchRequest, NearbySearchResponse
from app.services.google_places import search_nearby_restaurants
from app.services.parser import parse_user_query

app = FastAPI(title="Food Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/restaurants/nearby", response_model=NearbySearchResponse)
def nearby_restaurants(payload: NearbySearchRequest):
    parsed = parse_user_query(payload.keyword or "")

    radius = payload.radius if payload.radius is not None else parsed["radius"]
    keyword = parsed["keyword"]
    open_only = parsed["open_now"]

    results = search_nearby_restaurants(
        lat=payload.lat,
        lng=payload.lng,
        radius=radius,
        keyword=keyword,
    )

    if open_only:
        results = [r for r in results if r.get("open_now")]

    return {"results": results}