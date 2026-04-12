import math
import time
import requests
from urllib.parse import quote_plus
from ..config import GOOGLE_MAPS_API_KEY, PLACES_NEARBY_URL

# Simple in-memory cache: key → (timestamp, results)
# Entries expire after CACHE_TTL seconds
_cache: dict = {}
CACHE_TTL = 300  # 5 minutes


def _cache_key(lat, lng, radius, keyword, min_price, max_price, place_type) -> str:
    # Round lat/lng to 3 decimals (~110m precision) so nearby searches share cache
    return f"{round(lat,3)},{round(lng,3)}|{radius}|{keyword}|{min_price}|{max_price}|{place_type}"


def _cache_get(key: str):
    entry = _cache.get(key)
    if entry and (time.time() - entry[0]) < CACHE_TTL:
        return entry[1]
    return None


def _cache_set(key: str, value) -> None:
    _cache[key] = (time.time(), value)
    # Evict old entries to prevent unbounded growth (keep last 200)
    if len(_cache) > 200:
        oldest = sorted(_cache.items(), key=lambda x: x[1][0])[:50]
        for k, _ in oldest:
            del _cache[k]

# Types that should never appear in restaurant results
EXCLUDED_TYPES = {
    "doctor", "hospital", "health", "dentist", "pharmacy",
    "physiotherapist", "beauty_salon", "hair_care", "spa",
    "gym", "lodging", "school", "church", "mosque",
    "hindu_temple", "synagogue", "cemetery", "funeral_home",
    "lawyer", "accounting", "insurance_agency", "real_estate_agency",
    "car_dealer", "car_repair", "gas_station", "meal_catering","parking",
}


def haversine_miles(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 3958.8
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.asin(math.sqrt(a))
    return round(r * c, 2)


def is_real_restaurant(place: dict) -> bool:
    """Return True only if the place is actually a food/drink establishment."""
    types = set(place.get("types", []))

    # Must have at least one food-related type
    FOOD_TYPES = {
        "restaurant", "food", "cafe", "bakery", "bar",
        "meal_takeaway", "meal_delivery", "night_club",
    }
    has_food_type = bool(types & FOOD_TYPES)

    # Must not have any excluded types
    has_excluded = bool(types & EXCLUDED_TYPES)

    return has_food_type and not has_excluded


def search_nearby_restaurants(
    lat: float,
    lng: float,
    radius: int = 2000,
    keyword: str | None = None,
    min_price: int | None = None,
    max_price: int | None = None,
    place_type: str = "restaurant",
):
    params = {
        "location": f"{lat},{lng}",
        "radius": radius,
        "type": place_type,
        "key": GOOGLE_MAPS_API_KEY,
    }

    if keyword:
        params["keyword"] = keyword
    if min_price is not None:
        params["minprice"] = min_price
    if max_price is not None:
        params["maxprice"] = max_price

    # Check cache first
    ck = _cache_key(lat, lng, radius, keyword, min_price, max_price, place_type)
    cached = _cache_get(ck)
    if cached is not None:
        print("CACHE HIT — skipping Google API call")
        return cached

    print("KEY PRESENT:", bool(GOOGLE_MAPS_API_KEY))
    print("PLACES URL:", PLACES_NEARBY_URL)
    print("PARAMS:", {k: v for k, v in params.items() if k != "key"})

    response = requests.get(PLACES_NEARBY_URL, params=params, timeout=8)
    response.raise_for_status()
    data = response.json()

    print("GOOGLE STATUS:", data.get("status"))
    print("GOOGLE ERROR:", data.get("error_message"))
    print("RAW RESULT COUNT:", len(data.get("results", [])))

    cleaned = []
    for place in data.get("results", []):
        # ✅ Skip anything that isn't actually a food place
        if not is_real_restaurant(place):
            print(f"FILTERED OUT: {place.get('name')} — types: {place.get('types')}")
            continue

        place_lat = place["geometry"]["location"]["lat"]
        place_lng = place["geometry"]["location"]["lng"]

        cleaned.append({
            "name": place.get("name"),
            "address": place.get("vicinity"),
            "rating": place.get("rating"),
            "user_ratings_total": place.get("user_ratings_total"),
            "price_level": place.get("price_level"),
            "open_now": place.get("opening_hours", {}).get("open_now"),
            "lat": place_lat,
            "lng": place_lng,
            "distance_miles": haversine_miles(lat, lng, place_lat, place_lng),
            "place_id": place.get("place_id"),
            "maps_url": (
                f"https://www.google.com/maps/search/?api=1"
                f"&query={quote_plus(place.get('name', ''))}"
                f"&query_place_id={place.get('place_id')}"
            ),
            "types": place.get("types", []),
        })

    print(f"CLEANED RESULT COUNT (after filter): {len(cleaned)}")

    cleaned.sort(
        key=lambda x: (
            0 if x["open_now"] else 1,
            x["distance_miles"],
            -(x["rating"] or 0),
        )
    )

    _cache_set(ck, cleaned)
    return cleaned