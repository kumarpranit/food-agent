import requests
from ..config import GOOGLE_MAPS_API_KEY, PLACES_DETAILS_URL


def get_place_details(place_id: str) -> dict:
    """
    Fetch Place Details for a single place_id.
    Returns website, phone, and a best-guess menu_url.
    Only requests the fields we actually need to minimize API cost.
    """
    params = {
        "place_id": place_id,
        "fields": "website,formatted_phone_number,url",
        "key": GOOGLE_MAPS_API_KEY,
    }

    response = requests.get(PLACES_DETAILS_URL, params=params, timeout=10)
    response.raise_for_status()
    data = response.json()

    result = data.get("result", {})
    website = result.get("website")

    # Best-effort menu URL: some restaurant websites have /menu paths.
    # We surface the main website and let the user navigate — this is more
    # reliable than guessing /menu since many sites use different paths.
    menu_url = None
    if website:
        lower = website.lower()
        # If the website itself already looks like a menu page, use it directly
        if any(kw in lower for kw in ["/menu", "menu.", "menus"]):
            menu_url = website
        else:
            menu_url = website  # still useful — user can find the menu from the homepage

    return {
        "website": website,
        "menu_url": menu_url,
        "phone": result.get("formatted_phone_number"),
        "google_maps_url": result.get("url"),
    }
