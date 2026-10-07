from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base, SessionLocal
from .routers import auth, foods, meals, stats, tracking, templates, search
from .models import Food
from .data.preset_foods import PRESET_FOODS

# Create tables
Base.metadata.create_all(bind=engine)


def seed_preset_foods():
    """Auto-seed preset foods on startup if database is empty"""
    db = SessionLocal()
    try:
        # Check if we have any preset foods
        existing_count = db.query(Food).filter(Food.is_preset == True).count()
        if existing_count > 0:
            return  # Already seeded

        # Seed all preset foods
        for food_data in PRESET_FOODS:
            food = Food(
                name=food_data["name"],
                category=food_data["category"],
                calories=food_data["calories"],
                protein=food_data["protein"],
                carbs=food_data["carbs"],
                fat=food_data["fat"],
                unit=food_data["unit"],
                is_preset=True,
                created_by=None
            )
            db.add(food)

        db.commit()
        print(f"Seeded {len(PRESET_FOODS)} preset foods")
    except Exception as e:
        print(f"Error seeding foods: {e}")
        db.rollback()
    finally:
        db.close()


# Auto-seed on startup
seed_preset_foods()

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
