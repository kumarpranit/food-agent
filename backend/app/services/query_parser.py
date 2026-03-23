import re
from typing import Any, Dict


def parse_user_query(query: str) -> Dict[str, Any]:
    q = query.lower().strip()

    parsed = {
        "keyword": query.strip(),
        "radius": 3218,   # default: 2 miles in meters
        "open_now": False,
        "price_level": None,
        "sort_by": "best",
    }

    # open now
    if "open now" in q or "currently open" in q:
        parsed["open_now"] = True

    # radius in miles
    mile_match = re.search(r"(\d+)\s*(mile|miles)", q)
    if mile_match:
        miles = int(mile_match.group(1))
        parsed["radius"] = int(miles * 1609)

    # price cues
    if "cheap" in q or "budget" in q or "affordable" in q:
        parsed["price_level"] = 1
    elif "moderate" in q or "casual" in q:
        parsed["price_level"] = 2
    elif "fine dining" in q or "fancy" in q or "expensive" in q or "premium" in q:
        parsed["price_level"] = 3

    # sorting cues
    if "closest" in q or "nearest" in q:
        parsed["sort_by"] = "distance"
    elif "top rated" in q or "best" in q or "highest rated" in q:
        parsed["sort_by"] = "rating"

    # remove known filter phrases from keyword
    cleaned = q
    cleaned = re.sub(r"\bopen now\b", "", cleaned)
    cleaned = re.sub(r"\bcurrently open\b", "", cleaned)
    cleaned = re.sub(r"\bcheap\b|\bbudget\b|\baffordable\b", "", cleaned)
    cleaned = re.sub(r"\bmoderate\b|\bcasual\b", "", cleaned)
    cleaned = re.sub(r"\bfancy\b|\bexpensive\b|\bpremium\b", "", cleaned)
    cleaned = re.sub(r"\bclosest\b|\bnearest\b|\bbest\b|\btop rated\b|\bhighest rated\b", "", cleaned)
    cleaned = re.sub(r"\bwithin\s+\d+\s*(mile|miles)\b", "", cleaned)
    cleaned = re.sub(r"\d+\s*(mile|miles)\b", "", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()

    if cleaned:
        parsed["keyword"] = cleaned

    return parsed