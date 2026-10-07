from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base
from .routers import auth, foods, meals, stats, tracking, templates, search

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CalTrack API",
    description="HK Food & Calorie Tracker Backend",
    version="1.0.0"
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(foods.router)
app.include_router(meals.router)
app.include_router(stats.router)
app.include_router(tracking.router)
app.include_router(templates.router)
app.include_router(search.router)


@app.get("/")
def root():
    return {"message": "CalTrack API", "docs": "/docs"}


