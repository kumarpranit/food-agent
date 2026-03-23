🍽️ Food Agent

Geo-aware, AI-powered restaurant recommendation system

🚀 Overview

Food Agent is a full-stack web application that helps users discover nearby restaurants based on their preferences using location awareness, natural language input, and real-time data retrieval.

Users can search for food like:

“cheap breakfast open now within 2 miles”

and receive:

📍 Nearby restaurant options
⭐ Ratings and reviews
📏 Distance from current location
🟢 Open/closed status
🔗 Direct Google Maps links
✨ Key Features
🌍 Real-time geolocation
🧠 Natural language query parsing
📏 Distance-based ranking (Haversine)
🎯 Dynamic filters
Radius (miles)
Open now
⚡ Live restaurant data via Google Places API
🎨 Modern UI with responsive design
🔗 Direct navigation to Google Maps
🧠 Example Queries
breakfast near me
sushi open now within 2 miles
cheap pizza nearby
indian food within 5 miles
🏗️ Architecture
Frontend (Next.js)
    ↓
Backend API (FastAPI)
    ↓
Parser (Natural Language → Structured Query)
    ↓
Google Places API
    ↓
Ranking Engine (distance + rating + open status)
🧰 Tech Stack
Frontend
Next.js (React)
TypeScript
Tailwind CSS
Backend
FastAPI (Python)
Requests
Pydantic
APIs & Services
Google Places API
Browser Geolocation API
📂 Project Structure
food-agent/
├── backend/
│   └── app/
│       ├── main.py
│       ├── schemas.py
│       └── services/
│           ├── google_places.py
│           └── parser.py
│
├── web/
│   └── app/
│       └── chat/page.tsx
⚙️ Setup Instructions
1. Clone the repo
git clone https://github.com/kumarpranit/food-agent.git
cd food-agent
2. Backend setup
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

Create .env file:

GOOGLE_MAPS_API_KEY=your_api_key_here

Run backend:

python -m uvicorn app.main:app --reload
3. Frontend setup
cd ../web
npm install
npm run dev

Open:

http://localhost:3000/chat
📊 How It Works
User enters a natural language query
Backend parses:
keyword (food/cuisine)
radius (miles → meters)
open-now intent
Google Places API retrieves nearby restaurants
Backend computes:
distance (Haversine formula)
ranking (open + distance + rating)
Frontend displays results in a clean UI
🧪 Future Enhancements
🤖 LLM-powered agent (true conversational AI)
🗺️ Map visualization (Google Maps integration)
💰 Price-level filtering ($ / $$ / $$$)
📊 Personalized recommendations
⭐ Review sentiment analysis
📦 Deployment (Vercel + cloud backend)
🎯 Why This Project

This project demonstrates:

Full-stack development
API integration
Geospatial computation
Natural language processing
Product design thinking
👤 Author

Pranit Kumar
MS Business Analytics — UCLA
