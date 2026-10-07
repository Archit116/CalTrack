from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import MealLog, Food, User
from ..schemas import MealLogCreate, MealLogResponse
from ..auth import get_current_user

router = APIRouter(prefix="/api/meals", tags=["meals"])


@router.get("", response_model=list[MealLogResponse])
def list_meals(
    logged_at: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(MealLog).options(joinedload(MealLog.food)).filter(
        MealLog.user_id == current_user.id
    )

    if logged_at:
        query = query.filter(MealLog.logged_at == logged_at)
    else:
        query = query.filter(MealLog.logged_at == date.today())

    return query.order_by(MealLog.created_at).all()


@router.post("", response_model=MealLogResponse, status_code=status.HTTP_201_CREATED)
def create_meal_log(
    meal_data: MealLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify food exists and user has access
    food = db.query(Food).filter(Food.id == meal_data.food_id).first()
    if not food:
        raise HTTPException(status_code=404, detail="Food not found")
    if not food.is_preset and food.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied to this food")

    if meal_data.meal_type not in ["Breakfast", "Lunch", "Dinner", "Snacks"]:
        raise HTTPException(status_code=400, detail="Invalid meal type")

    meal_log = MealLog(
        user_id=current_user.id,
        food_id=meal_data.food_id,
        meal_type=meal_data.meal_type,
        servings=meal_data.servings,
        logged_at=meal_data.logged_at or date.today()
    )
    db.add(meal_log)
    db.commit()
    db.refresh(meal_log)

    # Load the food relationship
    db.refresh(meal_log, ["food"])
    return meal_log


@router.delete("/{meal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meal_log(
    meal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    meal_log = db.query(MealLog).filter(
        MealLog.id == meal_id,
        MealLog.user_id == current_user.id
    ).first()

    if not meal_log:
        raise HTTPException(status_code=404, detail="Meal log not found")

    db.delete(meal_log)
    db.commit()
