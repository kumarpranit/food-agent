"""
Bot service — handles conversational food recommendations.
No external LLM needed: uses the existing parser + recommendation engine
with a simple intent state machine and friendly response templates.
"""

import random
from .parser import parse_user_query
from .google_places import search_nearby_restaurants
from .recommendation import rank_restaurants

# ── Greeting detection ──────────────────────────────────────────────────────

GREETINGS = {"hi", "hello", "hey", "yo", "sup", "hiya", "howdy", "good morning", "good evening", "good afternoon"}

HELP_PHRASES = {"help", "what can you do", "how does this work", "what do you do", "options"}

FOLLOW_UPS = {"more", "show more", "more options", "other options", "anything else", "what else"}

THANKS = {"thanks", "thank you", "thx", "ty", "great", "perfect", "awesome", "nice"}

# ── Response templates ──────────────────────────────────────────────────────

BOT_GREETINGS = [
    "Hey! 👋 What are you in the mood for today?",
    "Hi there! 🍽️ Tell me what you're craving and I'll find the best spots near you.",
    "Hello! 😊 What would you like to eat today?",
    "Hey! Hungry? Tell me what you're after — cuisine, vibe, budget — anything works!",
]

BOT_HELP = """I can help you find great places to eat nearby! Just tell me things like:

🍕 *"cheap pizza"*
☕ *"coffee shops open now"*
🍣 *"sushi under $30"*
🥗 *"healthy lunch spots"*
🍺 *"pubs with good reviews"*
🌮 *"Mexican food for a group"*

What are you in the mood for?"""

BOT_NO_RESULTS = [
    "Hmm, I couldn't find anything matching that near you. Try broadening your search — maybe a different cuisine or removing the price filter?",
    "No luck finding that nearby! Want to try something similar? I can suggest alternatives.",
    "I didn't find any matches for that. Try something like 'restaurants nearby' and I'll show you what's around!",
]

BOT_FOUND_ONE = [
    "Found something great for you! 🎯",
    "Here's your top pick! ⭐",
    "I've got a great match! Check this out 👇",
]

BOT_FOUND_MANY = [
    "Found some great options near you! 🍽️",
    "Here are the best picks I found! ⭐",
    "Great news — here's what's nearby! 👇",
    "These look good! Here are the top picks 🎯",
]

BOT_THANKS = [
    "Enjoy your meal! 😋",
    "Hope you find something delicious! 🍽️",
    "Happy eating! 🎉",
    "Bon appétit! 🍷",
]

BOT_FOLLOW_UP = "Want me to search for something else? Just tell me what you're craving!"


# ── Main bot function ────────────────────────────────────────────────────────

def bot_reply(
    message: str,
    lat: float,
    lng: float,
    last_keyword: str | None = None,
) -> dict:
    """
    Process a user message and return a bot reply + optional restaurant results.

    Returns:
        {
            "reply": str,
            "results": list[dict] | None,
            "top_pick": dict | None,
            "alternatives": list[dict],
            "keyword_used": str | None,
        }
    """
    text = message.strip().lower()

    # ── Greetings ──
    if text in GREETINGS or any(text.startswith(g) for g in GREETINGS):
        return _no_results(random.choice(BOT_GREETINGS))

    # ── Help ──
    if any(h in text for h in HELP_PHRASES):
        return _no_results(BOT_HELP)

    # ── Thanks ──
    if text in THANKS or any(t in text for t in THANKS):
        return _no_results(random.choice(BOT_THANKS) + "\n\n" + BOT_FOLLOW_UP)

    # ── Follow-up "more" / "show more" ──
    if any(f in text for f in FOLLOW_UPS):
        if last_keyword:
            message = last_keyword  # re-run last search
        else:
            return _no_results("What would you like more of? Tell me what you're looking for! 😊")

    # ── Parse intent and search ──
    parsed = parse_user_query(message)
    keyword = parsed["keyword"]
    place_type = parsed.get("place_type", "restaurant")
    min_price = parsed.get("min_price")
    max_price = parsed.get("max_price")
    open_now = parsed.get("open_now", False)

    results = search_nearby_restaurants(
        lat=lat,
        lng=lng,
        radius=8047,  # 5 miles
        keyword=keyword,
        min_price=min_price,
        max_price=max_price,
        place_type=place_type,
    )

    if open_now:
        results = [r for r in results if r.get("open_now")]

    if not results:
        return _no_results(random.choice(BOT_NO_RESULTS), keyword_used=keyword)

    ranked = rank_restaurants(results)
    top = ranked["top_pick"]
    alts = ranked["alternatives"][:4]  # show max 4 alternatives in chat

    count = 1 + len(alts)
    if count == 1:
        reply = random.choice(BOT_FOUND_ONE)
    else:
        reply = random.choice(BOT_FOUND_MANY)

    # Add a friendly context line
    if open_now:
        reply += f" All open right now 🟢"
    elif min_price and min_price >= 3:
        reply += f" These are upscale picks — perfect for a special occasion ✨"
    elif max_price and max_price <= 1:
        reply += f" All budget-friendly options 💰"

    return {
        "reply": reply,
        "top_pick": top,
        "alternatives": alts,
        "results": ranked["all"],
        "keyword_used": keyword,
    }


def _no_results(reply: str, keyword_used: str | None = None) -> dict:
    return {
        "reply": reply,
        "top_pick": None,
        "alternatives": [],
        "results": [],
        "keyword_used": keyword_used,
    }
