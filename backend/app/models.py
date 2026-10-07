from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Date
from sqlalchemy.orm import relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    daily_calorie_goal = Column(Integer, default=2000)
    daily_protein_goal = Column(Float, default=50.0)
    daily_carbs_goal = Column(Float, default=250.0)
    daily_fat_goal = Column(Float, default=65.0)
    daily_water_goal_ml = Column(Integer, default=2000)
    created_at = Column(DateTime, default=datetime.utcnow)

    meal_logs = relationship("MealLog", back_populates="user")
    custom_foods = relationship("Food", back_populates="created_by_user")
    weight_logs = relationship("WeightLog", back_populates="user")
    water_logs = relationship("WaterLog", back_populates="user")
    meal_templates = relationship("MealTemplate", back_populates="user")


class Food(Base):
    __tablename__ = "foods"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    category = Column(String, nullable=False)
    calories = Column(Integer, nullable=False)
    protein = Column(Float, default=0)
    carbs = Column(Float, default=0)
    fat = Column(Float, default=0)
    unit = Column(String, default="1 serving")
    barcode = Column(String, nullable=True, index=True)
    is_preset = Column(Boolean, default=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    created_by_user = relationship("User", back_populates="custom_foods")
    meal_logs = relationship("MealLog", back_populates="food")
    template_items = relationship("MealTemplateItem", back_populates="food")


class MealLog(Base):
    __tablename__ = "meal_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    food_id = Column(Integer, ForeignKey("foods.id"), nullable=False)
    meal_type = Column(String, nullable=False)  # Breakfast, Lunch, Dinner, Snacks
    servings = Column(Float, default=1.0)
    logged_at = Column(Date, default=date.today)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="meal_logs")
    food = relationship("Food", back_populates="meal_logs")


class WeightLog(Base):
    __tablename__ = "weight_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    weight = Column(Float, nullable=False)  # in kg
    logged_at = Column(Date, default=date.today)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="weight_logs")


class WaterLog(Base):
    __tablename__ = "water_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount_ml = Column(Integer, nullable=False)
    logged_at = Column(Date, default=date.today)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="water_logs")


class MealTemplate(Base):
    __tablename__ = "meal_templates"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    meal_type = Column(String, nullable=False)  # Breakfast, Lunch, Dinner, Snacks
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="meal_templates")
    items = relationship("MealTemplateItem", back_populates="template", cascade="all, delete-orphan")


class MealTemplateItem(Base):
    __tablename__ = "meal_template_items"

    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("meal_templates.id"), nullable=False)
    food_id = Column(Integer, ForeignKey("foods.id"), nullable=False)
    servings = Column(Float, default=1.0)

    template = relationship("MealTemplate", back_populates="items")
    food = relationship("Food", back_populates="template_items")
