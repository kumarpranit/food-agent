def score_restaurant(r):
    score = 0
    reasons = []

    # Open now
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

    # Distance
    dist = r.get("distance_miles") or 10
    if dist <= 1:
        score += 3
        reasons.append("Very close")
    elif dist <= 2:
        score += 2
        reasons.append("Nearby")

    return score, reasons


def rank_restaurants(restaurants):
    scored = []

    for r in restaurants:
        score, reasons = score_restaurant(r)
        r["score"] = score
        r["match_reasons"] = reasons
        scored.append(r)

    scored.sort(key=lambda x: x["score"], reverse=True)

    return {
        "top_pick": scored[0] if scored else None,
        "alternatives": scored[1:10],
        "all": scored
    }