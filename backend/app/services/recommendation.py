from datetime import datetime


def estimate_wait_minutes(r: dict) -> int | None:
    """Return an estimated wait time (minutes) for fine dining only (price_level 3-4)."""
    price_level = r.get("price_level")
    if price_level not in (3, 4):
        return None

    # Base wait: longer for $$$$ than $$$
    base = 20 if price_level == 4 else 15

    # Higher rating → more desirable → longer wait
    rating = r.get("rating") or 0
    if rating >= 4.5:
        base += 15
    elif rating >= 4.0:
        base += 10
    elif rating >= 3.5:
        base += 5

    # More reviews → more popular → longer wait
    reviews = r.get("user_ratings_total") or 0
    if reviews >= 1000:
        base += 10
    elif reviews >= 500:
        base += 7
    elif reviews >= 200:
        base += 5
    elif reviews >= 100:
        base += 3

    # Time-of-day factor (dinner rush, lunch rush, off-peak)
    hour = datetime.now().hour
    if 18 <= hour <= 21:       # dinner rush
        base = int(base * 1.4)
    elif 12 <= hour <= 14:     # lunch rush
        base = int(base * 1.2)
    elif hour < 10 or hour > 22:  # off-peak
        base = int(base * 0.5)

    # Round to nearest 5 minutes, minimum 5
    return max(5, round(base / 5) * 5)


def score_restaurant(r):
    score = 0
    reasons = []

    # Open now bonus
    if r.get("open_now"):
        score += 3
        reasons.append("Open now")

    # Rating
    rating = r.get("rating") or 0
    if rating >= 4.5:
        score += 3
        reasons.append("Highly rated")
    elif rating >= 4.0:
        score += 2
        reasons.append("Good rating")
    elif rating >= 3.5:
        score += 1

    # Review volume — more reviews = more trustworthy
    reviews = r.get("user_ratings_total") or 0
    if reviews >= 500:
        score += 2
        reasons.append("Very popular")
    elif reviews >= 100:
        score += 1
        reasons.append("Popular spot")

    # Distance — weighted higher so closer places beat slightly better-rated far ones
    dist = r.get("distance_miles") or 10
    if dist <= 0.5:
        score += 6
        reasons.append("Very close")
    elif dist <= 1:
        score += 5
        reasons.append("Close by")
    elif dist <= 2:
        score += 3
        reasons.append("Nearby")
    elif dist <= 3:
        score += 1

    return score, reasons


def rank_restaurants(restaurants):
    if not restaurants:
        return {"top_pick": None, "alternatives": [], "all": []}

    scored = []
    for r in restaurants:
        score, reasons = score_restaurant(r)
        r["score"] = score
        r["match_reasons"] = reasons
        r["estimated_wait_minutes"] = estimate_wait_minutes(r)
        scored.append(r)

    scored.sort(key=lambda x: x["score"], reverse=True)

    return {
        "top_pick": scored[0],
        "alternatives": scored[1:10],
        "all": scored,
    }
