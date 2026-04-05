# FundVision Pro — AI-Powered Mutual Fund Advisor
### Version 2.0 | FastAPI · MySQL · React · Tailwind · Claude AI

---

## ✨ Features

| Module | Description |
|---|---|
| 🔐 Auth | JWT login/register · bcrypt hashing · refresh tokens · email validation |
| 👤 Profile | Income, deductions, horizon, risk, goal — stored in MySQL |
| 📊 Fund Screener | 20+ funds · filter by category/risk · sortable columns · live AMFI NAV |
| 🧮 Calculator | SIP & Lumpsum · step-up SIP · inflation-adjusted · Recharts visualisation |
| 🤖 AI Advisor | Claude-powered recommendations · hybrid rule+LLM engine · AI chatbot |
| 💬 News Sentiment | AI analysis of market headlines (positive/negative/neutral scores) |
| 🏥 Health Score | 0–100 score · 4 dimensions · rebalancing advice with priority levels |
| 📈 Forecasting | EMA + linear regression NAV projection · year-by-year corpus projection |
| 🚀 Easter Egg | Press **Ctrl+Shift+F** for the flying rockets / moon animation |

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Python 3.12+
- Node.js 20+
- MySQL 8.0+ (or Docker)

### 1. Clone & configure
```bash
git clone <your-repo>
cd fundvision-pro
cp .env.example .env
# Edit .env — fill in DB credentials and API keys
```

### 2. Backend setup
```bash
pip install -r requirements.txt

# Apply DB schema
mysql -u root -p < schema.sql

# Start FastAPI dev server
uvicorn backend.main:app --reload --port 8000
```

### 3. Frontend setup
```bash
cd frontend
npm install
npm run dev          # starts on http://localhost:5173
```

### 4. Open browser
- **Frontend**: http://localhost:5173
- **API Docs**: http://localhost:8000/api/docs

---

## 🐳 Docker (Recommended)

```bash
cp .env.example .env
# Fill in: ANTHROPIC_API_KEY, DB passwords, SECRET_KEY

docker-compose up --build
```

Services start at:
- App: http://localhost:8000
- MySQL: localhost:3306

---

## 🔑 Environment Variables

```env
# Required for AI features
ANTHROPIC_API_KEY=sk-ant-...

# Database (Docker uses service name "db")
DB_HOST=localhost
DB_USER=fundvision_user
DB_PASSWORD=your_password
DB_NAME=fundvision

# JWT — generate with: python -c "import secrets; print(secrets.token_hex(32))"
SECRET_KEY=your_64_char_secret

# Optional — for live NAV refresh from AMFI
# No API key needed — free public endpoint
```

---

## 📁 Project Structure

```
fundvision-pro/
├── backend/
│   ├── main.py              # FastAPI app entry point
│   ├── config.py            # Settings (pydantic-settings)
│   ├── database.py          # Async SQLAlchemy engine
│   ├── models.py            # ORM models
│   ├── routers/
│   │   ├── auth.py          # JWT register/login/refresh/logout
│   │   ├── funds.py         # Fund screener + AMFI NAV refresh
│   │   ├── portfolio.py     # Holdings CRUD + health score
│   │   ├── calculator.py    # SIP / Lumpsum calculators
│   │   ├── ai_advisor.py    # Claude recommendations + chat + sentiment
│   │   └── market.py        # Nifty/Sensex via yfinance
│   └── utils/
│       ├── scoring.py       # Portfolio health scoring engine (0-100)
│       └── forecasting.py   # EMA + regression NAV forecaster
├── frontend/
│   └── src/
│       ├── api/client.ts    # Typed API client for all endpoints
│       ├── context/         # React auth context
│       ├── components/      # Header, Footer, HealthGauge
│       └── pages/           # Home, Login, Register, Dashboard, Screener, Calculator, AIAdvisor
├── schema.sql               # Complete MySQL CREATE TABLE statements
├── requirements.txt         # Python dependencies
├── docker-compose.yml       # Docker orchestration
└── .env.example             # Environment variable template
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Create account |
| POST | `/api/v1/auth/login` | Get JWT tokens |
| POST | `/api/v1/auth/refresh` | Rotate refresh token |
| GET  | `/api/v1/auth/me` | Current user |
| GET  | `/api/v1/funds` | List/filter/sort funds |
| GET  | `/api/v1/portfolio` | Holdings + health score |
| POST | `/api/v1/portfolio/add` | Add fund to portfolio |
| POST | `/api/v1/calculator/sip` | SIP calculation |
| POST | `/api/v1/calculator/lumpsum` | Lumpsum calculation |
| POST | `/api/v1/ai/recommend` | AI fund recommendations |
| POST | `/api/v1/ai/chat` | AI chatbot |
| GET  | `/api/v1/ai/news-sentiment` | Market news sentiment |
| GET  | `/api/v1/market/indices` | Live Nifty / Sensex |
| POST | `/api/v1/funds/refresh-nav` | Pull live NAV from AMFI |

Full interactive docs: `http://localhost:8000/api/docs`

---

## 🏥 Portfolio Health Score Algorithm

```
Overall Score = Diversification×35% + ReturnQuality×30% + RiskBalance×20% + CostEfficiency×15%

Diversification:   HHI concentration index + category count + asset type mix
Return Quality:    Weighted 5Y CAGR vs benchmark + Sharpe ratio bonus
Risk Balance:      Weighted risk level deviation from "Moderate" (2.0)
Cost Efficiency:   Weighted expense ratio (<0.5% = 100, >1.5% = 0–30)
```

---

## 🎯 AI Recommendation Engine

```
Step 1 (Rules): Filter funds by risk appetite → map to allowed categories
Step 2 (Rules): Score each fund: 35% CAGR + 25% Sharpe + 20% Cost + 10% AUM + 10% Rating
Step 3 (Rules): Apply goal/horizon modifiers (ELSS bonus for tax goal, etc.)
Step 4 (AI):    Claude generates personalised explanation for the chosen portfolio
```

---

## 🚀 Easter Egg

Press **`Ctrl + Shift + F`** on any page to trigger the rocket shower animation.  
Press again to dismiss.

---

## ⚠️ Disclaimer

This application is for educational purposes only. Mutual fund investments are subject to market risks. Please read all scheme-related documents carefully before investing.
