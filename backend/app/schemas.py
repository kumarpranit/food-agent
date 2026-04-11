from pydantic import BaseModel
from typing import Optional, List


class NearbySearchRequest(BaseModel):
    lat: float
    lng: float
    radius: Optional[int] = None
    keyword: Optional[str] = None
    min_price: Optional[int] = None  # 0–4 (Google Places price scale)
    max_price: Optional[int] = None  # 0–4
    place_type: Optional[str] = None  # e.g. "restaurant", "cafe"


class RestaurantResult(BaseModel):
    name: str
    address: Optional[str] = None
    rating: Optional[float] = None
    user_ratings_total: Optional[int] = None
    price_level: Optional[int] = None
    open_now: Optional[bool] = None
    lat: float
    lng: float
    distance_miles: float
    place_id: str
    maps_url: str


class NearbySearchResponse(BaseModel):
    results: List[RestaurantResult]