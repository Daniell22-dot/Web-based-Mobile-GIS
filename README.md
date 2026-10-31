# MumiasGIS

A web-based Mobile GIS application focused on routing, weather, and traffic for the Mumias, Kenya region.

## Architecture

**Frontend:** Next.js 16 with React 19, TypeScript, and Tailwind CSS
**Backend:** Python (FastAPI) - API layer for routing, weather, and traffic data
**Database:** Neon PostgreSQL (serverless Postgres)

## Tech Stack

- **Next.js** — React framework with App Router, optimized images, and API routes
- **Leaflet** — Interactive map library with custom markers and routes
- **Tailwind CSS** — Utility-first styling
- **Python FastAPI** — Modern backend API with automatic docs
- **Neon Postgres** — Scalless PostgreSQL with instant branching

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- Neon PostgreSQL account

### 1. Environment Setup

Copy `.env` and configure your Neon database connection:

```bash
cp .env.example .env
```

Edit `.env` with your Neon connection string:

```
DATABASE_URL="postgresql://user:password@pg-your-project.neon.tech:5455/neondb?sslmode=require"
NEXT_PUBLIC_API_URL="http://localhost:8000/api"
```

### 2. Install Dependencies

```bash
# Frontend
npm install

# Backend
cd backend && pip install -r requirements.txt
```

### 3. Run the Application

```bash
# Start frontend (Next.js)
npm run dev

# Start backend (FastAPI)
cd backend && uvicorn app.main:app --reload
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Type-check with TSC |

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Health check |
| `GET /api/routes` | Calculate routes between points |
| `GET /api/weather` | Get current weather for Mumias |
| `GET /api/traffic` | Get live traffic data |
| `GET /api/map/basemaps` | Available map basemaps |

## Database Schema

Key tables:

- `routes` — stored routing paths with distance/duration
- `weather_overlays` — weather data snapshots
- `traffic_incidents` — reported traffic incidents
- `map_markers` — user-placed markers and waypoints

## Deployment

### Vercel (Frontend)

```bash
npm run build
vercel deploy
```

### Railway/Fly.io (Backend)

```bash
cd backend
# Set DATABASE_URL env var to your Neon connection string
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

## License

Proprietary — MumiasGIS Project