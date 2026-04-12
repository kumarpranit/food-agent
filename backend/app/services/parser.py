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

    # ── Step 1: Detect explicit price constraints first (highest priority) ──
    explicit_price = False

    # "under $X" / "below $X" / "less than $X"
    dollar_match = re.search(r"(?:under|below|less than|max|around|about)\s*\$?(\d+)", text)
    if dollar_match:
        amount = int(dollar_match.group(1))
        explicit_price = True
        if amount <= 15:
            parsed["max_price"] = 0
        elif amount <= 30:
            parsed["max_price"] = 1
        elif amount <= 60:
            parsed["max_price"] = 2
        elif amount <= 120:
            parsed["max_price"] = 3
        else:
            parsed["max_price"] = 4
    elif re.search(r"\bcheap\b|\bbudget\b|\binexpensive\b|\baffordable\b", text):
        parsed["max_price"] = 1
        explicit_price = True
    elif re.search(r"\bmoderate\b|\bmid.range\b|\breasonable\b", text):
        parsed["min_price"] = 1
        parsed["max_price"] = 2
        explicit_price = True

    # ── Step 2: Intent-based price (only if no explicit price given) ──
    if not explicit_price:
        if re.search(r"\bfancy\b|\bexpensive\b|\bupscale\b|\bfine dining\b|\bluxury\b|\bpremium\b|\bdate night\b|\bromantic\b|\banniversary\b|\bspecial occasion\b|\bproposal\b", text):
            parsed["min_price"] = 3

    # ── Step 3: Place type detection ──
    if re.search(r"\bcafe\b|\bcafes\b|\bcoffee\b|\bstarbucks\b|\blatte\b|\bespresso\b|\bcappuccino\b|\bworking cafe\b|\bcoffee shop\b|\bcoffee shops\b", text):
        parsed["place_type"] = "cafe"
    elif re.search(r"\bpub\b|\bpubs\b|\bbar\b|\bbars\b|\btavern\b|\btaverns\b|\bnightlife\b|\bdrinks\b|\bcocktail\b|\bcocktails\b|\bbeer\b|\bdraft\b|\bale\b|\bbrewery\b|\bbreweries\b", text):
        parsed["place_type"] = "bar"
    elif re.search(r"\bbrunch\b", text):
        parsed["place_type"] = "restaurant"
        if parsed["keyword"].strip() in ("brunch",):
            parsed["keyword"] = "brunch breakfast"

    # ── Step 4: Intent keyword mapping (gives Google a better search term) ──
    INTENT_MAP = {
        r"\bdate night\b": "romantic dinner",
        r"\bromantic\b": "romantic dinner",
        r"\banniversary\b": "fine dining",
        r"\bspecial occasion\b": "fine dining",
        r"\bproposal\b": "fine dining",
        r"\bgroup\b|\bgroup dinner\b|\blarge group\b": "restaurant group dining",
        r"\bkids\b|\bfamily\b|\bfamily friendly\b": "family restaurant",
        r"\blate night\b|\bmidnight\b|\b2am\b": "late night food",
        r"\bquick\b|\bfast\b|\bquick bite\b": "fast food",
        r"\bwork lunch\b|\bworking lunch\b|\bbusiness lunch\b": "restaurant",
    }
    for pattern, replacement in INTENT_MAP.items():
        if re.search(pattern, text):
            parsed["keyword"] = replacement
            break

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