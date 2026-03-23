import re
from typing import Optional, Dict, Any


def parse_user_query(query: str) -> Dict[str, Any]:
    text = query.lower().strip()

    parsed: Dict[str, Any] = {
        "keyword": query.strip(),
        "radius": 3218,   # default = 2 miles in meters
        "open_now": False,
    }

    mile_match = re.search(r"(\d+)\s*(mile|miles)\b", text)
    if mile_match:
        miles = int(mile_match.group(1))
        parsed["radius"] = int(miles * 1609)

    if "open now" in text or "open" in text:
        parsed["open_now"] = True

    noise_words = [
        "near me",
        "open now",
        "open",
        "restaurant",
        "restaurants",
        "food",
        "within",
    ]

    cleaned = text
    cleaned = re.sub(r"\d+\s*(mile|miles)\b", "", cleaned)

    for word in noise_words:
        cleaned = cleaned.replace(word, "")

    cleaned = " ".join(cleaned.split()).strip()

    if cleaned:
        parsed["keyword"] = cleaned

    return parsed