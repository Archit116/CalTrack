# CalTrack 🇭🇰

A full-stack calorie tracking application with smart food recommendations.

## Features

- Smart food search with fuzzy matching
- Calorie & macro tracking
- Weight & water logging
- Meal templates
- Auto-loads food data from Kaggle & USDA APIs

## Tech Stack

- **Backend**: FastAPI + SQLAlchemy + SQLiteCloud
- **Frontend**: React + TypeScript + TailwindCSS
- **Database**: SQLiteCloud

## Quick Start

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

Create `backend/.env`:
```
DATABASE_URL=sqlitecloud://host:8860/database?apikey=YOUR_KEY
SECRET_KEY=your-secret-key
```

## Deployment

Configured for Vercel. Add environment variables in Vercel dashboard.
