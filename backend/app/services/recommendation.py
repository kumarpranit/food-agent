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

    # Distance
    dist = r.get("distance_miles") or 10
    if dist <= 0.5:
        score += 4
        reasons.append("Very close")
    elif dist <= 1:
        score += 3
        reasons.append("Close by")
    elif dist <= 2:
        score += 2
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
        scored.append(r)

    scored.sort(key=lambda x: x["score"], reverse=True)

    return {
        "top_pick": scored[0],
        "alternatives": scored[1:10],
        "all": scored,
    }
