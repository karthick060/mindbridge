# 🧠 MindBridge
### AI-Based Anonymous Chat Platform for Peer Mental Health Support

---

## 📁 FOLDER STRUCTURE

```
mindbridge/
│
├── frontend/                          ← React.js app (UI)
│   ├── public/
│   │   └── index.html                 ← HTML shell with Google Fonts
│   ├── src/
│   │   ├── App.js                     ← Root app with React Router
│   │   ├── index.js                   ← React entry point
│   │   ├── api/
│   │   │   └── client.js              ← All API + WebSocket calls
│   │   ├── hooks/
│   │   │   └── useAnonUser.js         ← Anonymous session management
│   │   ├── utils/
│   │   │   └── constants.js           ← Rooms, colours, NLP simulation
│   │   ├── components/
│   │   │   └── Navbar.jsx             ← Top navigation bar
│   │   └── pages/
│   │       ├── HomePage.jsx           ← Landing page
│   │       ├── ChatPage.jsx           ← Real-time chat interface
│   │       ├── ResourcesPage.jsx      ← Helplines + self-help tools
│   │       └── DashboardPage.jsx      ← Admin analytics dashboard
│   └── package.json                   ← Node dependencies
│
├── backend/                           ← Django REST API + Channels
│   ├── manage.py                      ← Django CLI
│   ├── requirements.txt               ← Python dependencies
│   ├── mindbridge/                    ← Django project config
│   │   ├── settings.py                ← All settings (SQLite, CORS, etc.)
│   │   ├── urls.py                    ← Root URL router
│   │   └── asgi.py                    ← HTTP + WebSocket entry point
│   ├── ai_models/
│   │   └── nlp_engine.py              ← 4-layer AI moderation engine
│   └── apps/
│       ├── users/                     ← Anonymous user ID generation
│       ├── chat/                      ← Rooms, messages, WebSocket consumer
│       │   └── management/commands/
│       │       └── seed_rooms.py      ← Seeds rooms + sample data
│       ├── moderation/                ← REST moderation endpoint
│       └── dashboard/                 ← Admin analytics API
│
├── scripts/
│   ├── setup_and_run.sh               ← ONE COMMAND (Mac/Linux)
│   └── setup_and_run.bat              ← ONE COMMAND (Windows)
│
├── config/
│   └── .env.example                   ← Environment variables template
│
└── README.md                          ← This file
```

---

## ⚡ QUICK START — ONE COMMAND

### Mac / Linux
```bash
# Step 1: Extract the ZIP
unzip mindbridge.zip
cd mindbridge

# Step 2: Make the script executable and run it
chmod +x scripts/setup_and_run.sh
./scripts/setup_and_run.sh
```

### Windows
```
1. Extract the ZIP file
2. Double-click: scripts\setup_and_run.bat
   (or open VS Code terminal → cd mindbridge → scripts\setup_and_run.bat)
```

The script will:
1. ✅ Check Python and Node are installed
2. ✅ Create Python virtual environment
3. ✅ Install all dependencies
4. ✅ Run database migrations (SQLite — no setup needed)
5. ✅ Seed 5 chat rooms with sample messages
6. ✅ Start Django backend on port 8000
7. ✅ Start React frontend on port 3000
8. ✅ Open your browser automatically

---

## 🌐 WEBSITE PAGES

| Page            | URL                              | Description                      |
|-----------------|----------------------------------|----------------------------------|
| 🏠 Home         | http://localhost:3000            | Landing page with room previews  |
| 💬 Chat         | http://localhost:3000/chat       | Real-time anonymous chat         |
| 📞 Resources    | http://localhost:3000/resources  | Helplines + self-help techniques |
| 📊 Dashboard    | http://localhost:3000/dashboard  | Admin analytics dashboard        |

---

## 🔧 MANUAL SETUP (if the script doesn't work)

### Terminal 1 — Backend

```bash
cd mindbridge/backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate          # Mac/Linux
# venv\Scripts\activate           # Windows

# Install dependencies
pip install Django==4.2.9 djangorestframework==3.14.0 django-cors-headers==4.3.1 channels==4.0.0 daphne==4.0.0 whitenoise==6.6.0

# Set up database
python manage.py makemigrations users chat moderation dashboard
python manage.py migrate

# Add rooms and sample data
python manage.py seed_rooms

# Start backend
python manage.py runserver
# ✅ Backend running at http://localhost:8000
```

### Terminal 2 — Frontend

```bash
cd mindbridge/frontend
npm install
npm start
# ✅ Frontend running at http://localhost:3000
# Browser opens automatically
```

---

## 🔗 API ENDPOINTS

| Method | URL                                  | Description              |
|--------|--------------------------------------|--------------------------|
| GET    | /api/users/generate/                 | Generate anonymous ID    |
| GET    | /api/chat/rooms/                     | List all chat rooms      |
| GET    | /api/chat/rooms/{slug}/messages/     | Room message history     |
| POST   | /api/moderation/analyze/             | Analyze message with AI  |
| GET    | /api/dashboard/stats/                | Overview statistics      |
| GET    | /api/dashboard/flags/                | Flagged messages         |
| PATCH  | /api/dashboard/alerts/{id}/resolve/  | Resolve a crisis alert   |

### WebSocket
```
ws://localhost:8000/ws/chat/{room_slug}/
```
Valid slugs: `anxiety` | `depression` | `stress` | `loneliness` | `general`

---

## 🤖 AI MODERATION PIPELINE

```
User message
    ↓
Layer 1: Crisis keyword detection  → Blocks: "kill myself", "suicide", etc.
    ↓
Layer 2: Detoxify ML model         → Detects: hate speech, toxic content
    ↓
Layer 3: RoBERTa sentiment model   → Classifies: happy/sad/depressed/angry
    ↓
Layer 4: Risk scoring algorithm    → Scores: low / medium / high / critical
    ↓
Block or allow + tag message with sentiment & risk
```

**Demo Mode** (no ML models installed): The app uses keyword-based fallback
and still works perfectly for demonstration.

**To enable real AI** (optional, requires ~2GB download):
```bash
pip install transformers torch detoxify
# Then uncomment these lines in backend/ai_models/nlp_engine.py
```

---

## 🎓 KEY FACTS FOR VIVA

1. **Why WebSocket?** — HTTP is request/response only. WebSocket keeps a persistent connection so messages arrive instantly without polling.

2. **Why Django Channels?** — Extends Django to handle WebSocket connections. Uses `InMemoryChannelLayer` for development (no Redis needed), `RedisChannelLayer` for production.

3. **Privacy by Design** — No authentication system. IDs stored in `sessionStorage` (not `localStorage`) — deleted when browser tab closes.

4. **Multi-layer NLP** — Rule-based + ML combination gives both speed (keywords) and accuracy (transformers) with graceful degradation.

5. **Sentiment Model** — `cardiffnlp/twitter-roberta-base-sentiment-latest`, a 125M parameter RoBERTa model fine-tuned on 58M tweets.

6. **Risk Scoring** — Weighted combination of: keyword counts, toxicity score, sentiment class, and specific crisis-related vocabulary.

7. **Database** — Uses SQLite (zero configuration) locally; easily switched to PostgreSQL for production.

---

## ❓ TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| `ModuleNotFoundError` | Make sure venv is activated: `source venv/bin/activate` |
| Port 8000 already in use | Run backend on 8001: `python manage.py runserver 8001` |
| Port 3000 already in use | React will ask to use 3001 — press Y |
| Chat shows "Demo Mode" | Normal — WebSocket is connected but no other real users online |
| `npm install` fails | Ensure Node.js ≥ 16: `node --version` |
| Database errors | Delete `backend/db.sqlite3` and re-run migrations |
