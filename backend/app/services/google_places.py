import math
import requests
from ..config import GOOGLE_MAPS_API_KEY, PLACES_NEARBY_URL


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


def search_nearby_restaurants(lat: float, lng: float, radius: int = 2000, keyword: str | None = None):
    params = {
        "location": f"{lat},{lng}",
        "radius": radius,
        "type": "restaurant",
        "key": GOOGLE_MAPS_API_KEY,
    }

    if keyword:
        params["keyword"] = keyword

    print("KEY PRESENT:", bool(GOOGLE_MAPS_API_KEY))
    print("PLACES URL:", PLACES_NEARBY_URL)
    print("PARAMS:", {k: v for k, v in params.items() if k != "key"})

    response = requests.get(PLACES_NEARBY_URL, params=params, timeout=30)
    response.raise_for_status()
    data = response.json()

    print("GOOGLE STATUS:", data.get("status"))
    print("GOOGLE ERROR:", data.get("error_message"))
    print("RAW RESULT COUNT:", len(data.get("results", [])))

    cleaned = []
    for place in data.get("results", []):
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
            "maps_url": f"https://www.google.com/maps/place/?q=place_id:{place.get('place_id')}",
        })

    cleaned.sort(
        key=lambda x: (
            0 if x["open_now"] else 1,
            x["distance_miles"],
            -(x["rating"] or 0),
        )
    )

    return cleaned