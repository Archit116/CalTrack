from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import MealTemplate, MealTemplateItem, MealLog, Food, User
from ..schemas import MealTemplateCreate, MealTemplateResponse, MealLogResponse
from ..auth import get_current_user

router = APIRouter(prefix="/api/templates", tags=["templates"])


@router.get("", response_model=list[MealTemplateResponse])
def list_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(MealTemplate).options(
        joinedload(MealTemplate.items).joinedload(MealTemplateItem.food)
    ).filter(
        MealTemplate.user_id == current_user.id
    ).order_by(MealTemplate.name).all()


@router.get("/{template_id}", response_model=MealTemplateResponse)
def get_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    template = db.query(MealTemplate).options(
        joinedload(MealTemplate.items).joinedload(MealTemplateItem.food)
    ).filter(
        MealTemplate.id == template_id,
        MealTemplate.user_id == current_user.id
    ).first()

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template


@router.post("", response_model=MealTemplateResponse, status_code=status.HTTP_201_CREATED)
def create_template(
    template_data: MealTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if template_data.meal_type not in ["Breakfast", "Lunch", "Dinner", "Snacks"]:
        raise HTTPException(status_code=400, detail="Invalid meal type")

    # Verify all foods exist and user has access
    for item in template_data.items:
        food = db.query(Food).filter(Food.id == item.food_id).first()
        if not food:
            raise HTTPException(status_code=404, detail=f"Food {item.food_id} not found")
        if not food.is_preset and food.created_by != current_user.id:
            raise HTTPException(status_code=403, detail=f"Access denied to food {item.food_id}")

    template = MealTemplate(
        user_id=current_user.id,
        name=template_data.name,
        meal_type=template_data.meal_type
    )
    db.add(template)
    db.flush()

    for item in template_data.items:
        template_item = MealTemplateItem(
            template_id=template.id,
            food_id=item.food_id,
            servings=item.servings
        )
        db.add(template_item)

    db.commit()
    db.refresh(template)

    # Reload with relationships
    return db.query(MealTemplate).options(
        joinedload(MealTemplate.items).joinedload(MealTemplateItem.food)
    ).filter(MealTemplate.id == template.id).first()


@router.post("/{template_id}/apply", response_model=list[MealLogResponse])
def apply_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    template = db.query(MealTemplate).options(
        joinedload(MealTemplate.items)
    ).filter(
        MealTemplate.id == template_id,
        MealTemplate.user_id == current_user.id
    ).first()

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    created_logs = []
    for item in template.items:
        meal_log = MealLog(
            user_id=current_user.id,
            food_id=item.food_id,
            meal_type=template.meal_type,
            servings=item.servings,
            logged_at=date.today()
        )
        db.add(meal_log)
        db.flush()
        db.refresh(meal_log, ["food"])
        created_logs.append(meal_log)

    db.commit()
    return created_logs


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    template = db.query(MealTemplate).filter(
        MealTemplate.id == template_id,
        MealTemplate.user_id == current_user.id
    ).first()

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    db.delete(template)
    db.commit()
