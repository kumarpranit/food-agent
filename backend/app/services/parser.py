import re
from typing import Optional, Dict, Any


def parse_user_query(query: str) -> Dict[str, Any]:
    text = query.lower().strip()

    parsed: Dict[str, Any] = {
        "keyword": query.strip(),
        "radius": 3218,   # default = 2 miles in meters
        "open_now": False,
        "min_price": None,
        "max_price": None,
        "place_type": "restaurant",  # default
    }

    mile_match = re.search(r"(\d+)\s*(mile|miles)\b", text)
    if mile_match:
        miles = int(mile_match.group(1))
        parsed["radius"] = int(miles * 1609)

    if "open now" in text or "open" in text:
        parsed["open_now"] = True

    # Price level detection from natural language
    if re.search(r"\bcheap\b|\bbudget\b|\binexpensive\b|\baffordable\b", text):
        parsed["max_price"] = 1
    elif re.search(r"\bmoderate\b|\bmid.range\b|\breasonable\b", text):
        parsed["min_price"] = 1
        parsed["max_price"] = 2
    elif re.search(r"\bfancy\b|\bexpensive\b|\bupscale\b|\bfine dining\b|\bluxury\b|\bpremium\b", text):
        parsed["min_price"] = 3

    # Place type detection
    if re.search(r"\bcafe\b|\bcafes\b|\bcoffee\b|\bstarbucks\b|\blatte\b|\bespresso\b|\bcappuccino\b|\bworking cafe\b|\bcoffee shop\b|\bcoffee shops\b", text):
        parsed["place_type"] = "cafe"
    elif re.search(r"\bpub\b|\bpubs\b|\bbar\b|\bbars\b|\btavern\b|\btaverns\b|\bnightlife\b|\bdrinks\b|\bcocktail\b|\bcocktails\b|\bbeer\b|\bdraft\b|\bale\b|\bbrewery\b|\bbreweries\b", text):
        parsed["place_type"] = "bar"
    elif re.search(r"\bbrunch\b", text):
        parsed["place_type"] = "restaurant"
        # Broaden keyword so Google finds brunch spots faster
        if parsed["keyword"].strip() in ("brunch",):
            parsed["keyword"] = "brunch breakfast"

    noise_words = [
        "near me",
        "open now",
        "open",
        "restaurant",
        "restaurants",
        "food",
        "within",
        # bar/pub words (already parsed)
        "pub",
        "pubs",
        "tavern",
        "taverns",
        "nightlife",
        "drinks",
        "cocktails",
        "cocktail",
        # price-related words (already parsed above)
        "cheap",
        "budget",
        "inexpensive",
        "affordable",
        "moderate",
        "mid-range",
        "fancy",
        "expensive",
        "upscale",
        "fine dining",
        "luxury",
        "premium",
    ]

    cleaned = text
    cleaned = re.sub(r"\d+\s*(mile|miles)\b", "", cleaned)

    for word in noise_words:
        cleaned = cleaned.replace(word, "")

    cleaned = " ".join(cleaned.split()).strip()

    if cleaned:
        parsed["keyword"] = cleaned

    return parsed