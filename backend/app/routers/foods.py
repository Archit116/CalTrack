from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
import httpx

from ..database import get_db
from ..models import Food, User
from ..schemas import FoodCreate, FoodResponse
from ..auth import get_current_user

router = APIRouter(prefix="/api/foods", tags=["foods"])


@router.get("", response_model=list[FoodResponse])
def list_foods(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Food).filter(
        or_(Food.is_preset == True, Food.created_by == current_user.id)
    )

    if search:
        query = query.filter(Food.name.ilike(f"%{search}%"))
    if category and category != "All":
        query = query.filter(Food.category == category)

    return query.order_by(Food.name).all()


@router.get("/{food_id}", response_model=FoodResponse)
def get_food(
    food_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    food = db.query(Food).filter(Food.id == food_id).first()
    if not food:
        raise HTTPException(status_code=404, detail="Food not found")
    if not food.is_preset and food.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return food


@router.post("", response_model=FoodResponse, status_code=status.HTTP_201_CREATED)
def create_food(
    food_data: FoodCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    food = Food(
        **food_data.model_dump(),
        is_preset=False,
        created_by=current_user.id
    )
    db.add(food)
    db.commit()
    db.refresh(food)
    return food


@router.get("/barcode/{barcode}", response_model=FoodResponse)
async def lookup_barcode(
    barcode: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check local database first
    food = db.query(Food).filter(Food.barcode == barcode).first()
    if food:
        if food.is_preset or food.created_by == current_user.id:
            return food

    # Fallback to Open Food Facts API
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"https://world.openfoodfacts.org/api/v2/product/{barcode}.json",
                timeout=10.0
            )
            data = response.json()

            if data.get("status") == 1 and data.get("product"):
                prod = data["product"]
                nut = prod.get("nutriments", {})

                # Create and save the food
                new_food = Food(
                    name=prod.get("product_name", "Scanned Item"),
                    category="Packaged",
                    calories=int(nut.get("energy-kcal_100g", nut.get("energy-kcal", 0))),
                    protein=round(nut.get("proteins_100g", 0), 1),
                    carbs=round(nut.get("carbohydrates_100g", 0), 1),
                    fat=round(nut.get("fat_100g", 0), 1),
                    unit="per 100g",
                    barcode=barcode,
                    is_preset=False,
                    created_by=current_user.id
                )
                db.add(new_food)
                db.commit()
                db.refresh(new_food)
                return new_food

        except Exception:
            pass

    raise HTTPException(status_code=404, detail="Barcode not found")


@router.delete("/{food_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_food(
    food_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    food = db.query(Food).filter(Food.id == food_id).first()
    if not food:
        raise HTTPException(status_code=404, detail="Food not found")
    if food.is_preset:
        raise HTTPException(status_code=403, detail="Cannot delete preset foods")
    if food.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    db.delete(food)
    db.commit()
