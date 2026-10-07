from datetime import datetime, date
from pydantic import BaseModel, EmailStr
from typing import Optional


# Auth schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    daily_calorie_goal: int
    daily_protein_goal: float
    daily_carbs_goal: float
    daily_fat_goal: float
    daily_water_goal_ml: int
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    name: Optional[str] = None
    daily_calorie_goal: Optional[int] = None
    daily_protein_goal: Optional[float] = None
    daily_carbs_goal: Optional[float] = None
    daily_fat_goal: Optional[float] = None
    daily_water_goal_ml: Optional[int] = None


class Token(BaseModel):
    access_token: str
    token_type: str


# Food schemas
class FoodBase(BaseModel):
    name: str
    category: str
    calories: int
    protein: float = 0
    carbs: float = 0
    fat: float = 0
    unit: str = "1 serving"
    barcode: Optional[str] = None


class FoodCreate(FoodBase):
    pass


class FoodResponse(FoodBase):
    id: int
    is_preset: bool
    created_by: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


# Meal log schemas
class MealLogCreate(BaseModel):
    food_id: int
    meal_type: str
    servings: float = 1.0
    logged_at: Optional[date] = None


class MealLogResponse(BaseModel):
    id: int
    food: FoodResponse
    meal_type: str
    servings: float
    logged_at: date
    created_at: datetime

    class Config:
        from_attributes = True


# Weight schemas
class WeightLogCreate(BaseModel):
    weight: float
    logged_at: Optional[date] = None


class WeightLogResponse(BaseModel):
    id: int
    weight: float
    logged_at: date
    created_at: datetime

    class Config:
        from_attributes = True


# Water schemas
class WaterLogCreate(BaseModel):
    amount_ml: int
    logged_at: Optional[date] = None


class WaterLogResponse(BaseModel):
    id: int
    amount_ml: int
    logged_at: date
    created_at: datetime

    class Config:
        from_attributes = True


# Template schemas
class MealTemplateItemCreate(BaseModel):
    food_id: int
    servings: float = 1.0


class MealTemplateItemResponse(BaseModel):
    id: int
    food: FoodResponse
    servings: float

    class Config:
        from_attributes = True


class MealTemplateCreate(BaseModel):
    name: str
    meal_type: str
    items: list[MealTemplateItemCreate]


class MealTemplateResponse(BaseModel):
    id: int
    name: str
    meal_type: str
    items: list[MealTemplateItemResponse]
    created_at: datetime

    class Config:
        from_attributes = True


# Stats schemas
class DailySummary(BaseModel):
    date: date
    total_calories: int
    total_protein: float
    total_carbs: float
    total_fat: float
    total_water_ml: int
    meals_by_type: dict[str, list[MealLogResponse]]
