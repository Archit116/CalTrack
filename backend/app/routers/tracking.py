from datetime import date, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import WeightLog, WaterLog, User
from ..schemas import WeightLogCreate, WeightLogResponse, WaterLogCreate, WaterLogResponse
from ..auth import get_current_user

router = APIRouter(prefix="/api", tags=["tracking"])


# Weight endpoints
@router.get("/weight", response_model=list[WeightLogResponse])
def get_weight_history(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    start_date = date.today() - timedelta(days=days)
    return db.query(WeightLog).filter(
        WeightLog.user_id == current_user.id,
        WeightLog.logged_at >= start_date
    ).order_by(WeightLog.logged_at).all()


@router.post("/weight", response_model=WeightLogResponse, status_code=status.HTTP_201_CREATED)
def log_weight(
    weight_data: WeightLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    log_date = weight_data.logged_at or date.today()

    # Check if there's already a weight log for this date
    existing = db.query(WeightLog).filter(
        WeightLog.user_id == current_user.id,
        WeightLog.logged_at == log_date
    ).first()

    if existing:
        # Update existing
        existing.weight = weight_data.weight
        db.commit()
        db.refresh(existing)
        return existing

    # Create new
    weight_log = WeightLog(
        user_id=current_user.id,
        weight=weight_data.weight,
        logged_at=log_date
    )
    db.add(weight_log)
    db.commit()
    db.refresh(weight_log)
    return weight_log


@router.delete("/weight/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_weight_log(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    log = db.query(WeightLog).filter(
        WeightLog.id == log_id,
        WeightLog.user_id == current_user.id
    ).first()

    if not log:
        raise HTTPException(status_code=404, detail="Weight log not found")

    db.delete(log)
    db.commit()


# Water endpoints
@router.get("/water", response_model=list[WaterLogResponse])
def get_water_logs(
    logged_at: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    target_date = logged_at or date.today()
    return db.query(WaterLog).filter(
        WaterLog.user_id == current_user.id,
        WaterLog.logged_at == target_date
    ).order_by(WaterLog.created_at).all()


@router.get("/water/total")
def get_water_total(
    logged_at: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    target_date = logged_at or date.today()
    total = db.query(func.sum(WaterLog.amount_ml)).filter(
        WaterLog.user_id == current_user.id,
        WaterLog.logged_at == target_date
    ).scalar() or 0

    return {
        "date": target_date,
        "total_ml": total,
        "goal_ml": current_user.daily_water_goal_ml
    }


@router.post("/water", response_model=WaterLogResponse, status_code=status.HTTP_201_CREATED)
def log_water(
    water_data: WaterLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    water_log = WaterLog(
        user_id=current_user.id,
        amount_ml=water_data.amount_ml,
        logged_at=water_data.logged_at or date.today()
    )
    db.add(water_log)
    db.commit()
    db.refresh(water_log)
    return water_log


@router.delete("/water/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_water_log(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    log = db.query(WaterLog).filter(
        WaterLog.id == log_id,
        WaterLog.user_id == current_user.id
    ).first()

    if not log:
        raise HTTPException(status_code=404, detail="Water log not found")

    db.delete(log)
    db.commit()
