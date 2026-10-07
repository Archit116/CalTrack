from datetime import date, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from ..database import get_db
from ..models import MealLog, Food, WaterLog, User
from ..schemas import DailySummary, MealLogResponse
from ..auth import get_current_user

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("/daily", response_model=DailySummary)
def get_daily_summary(
    target_date: date = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if target_date is None:
        target_date = date.today()

    # Get meal logs for the day
    meal_logs = db.query(MealLog).options(joinedload(MealLog.food)).filter(
        MealLog.user_id == current_user.id,
        MealLog.logged_at == target_date
    ).all()

    # Calculate totals
    total_calories = 0
    total_protein = 0.0
    total_carbs = 0.0
    total_fat = 0.0

    meals_by_type: dict = {
        "Breakfast": [],
        "Lunch": [],
        "Dinner": [],
        "Snacks": []
    }

    for log in meal_logs:
        food = log.food
        servings = log.servings

        total_calories += int(food.calories * servings)
        total_protein += food.protein * servings
        total_carbs += food.carbs * servings
        total_fat += food.fat * servings

        meals_by_type[log.meal_type].append(log)

    # Get water intake
    water_total = db.query(func.sum(WaterLog.amount_ml)).filter(
        WaterLog.user_id == current_user.id,
        WaterLog.logged_at == target_date
    ).scalar() or 0

    return DailySummary(
        date=target_date,
        total_calories=total_calories,
        total_protein=round(total_protein, 1),
        total_carbs=round(total_carbs, 1),
        total_fat=round(total_fat, 1),
        total_water_ml=water_total,
        meals_by_type=meals_by_type
    )


@router.get("/weekly")
def get_weekly_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = date.today()
    week_start = today - timedelta(days=6)

    days = []
    for i in range(7):
        day = week_start + timedelta(days=i)

        # Get meals for this day
        meal_logs = db.query(MealLog).options(joinedload(MealLog.food)).filter(
            MealLog.user_id == current_user.id,
            MealLog.logged_at == day
        ).all()

        calories = sum(log.food.calories * log.servings for log in meal_logs)

        # Get water
        water = db.query(func.sum(WaterLog.amount_ml)).filter(
            WaterLog.user_id == current_user.id,
            WaterLog.logged_at == day
        ).scalar() or 0

        days.append({
            "date": day,
            "calories": int(calories),
            "water_ml": water
        })

    return {"days": days, "calorie_goal": current_user.daily_calorie_goal}
