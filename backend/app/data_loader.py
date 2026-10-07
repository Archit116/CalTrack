"""Automatic data loading on app startup"""

import os
import sys
from sqlalchemy.orm import Session
from sqlalchemy import func
import pandas as pd

from .database import SessionLocal
from .models import Food


def should_load_data(db: Session) -> bool:
    """Check if we need to load data (no preset foods exist)"""
    count = db.query(func.count(Food.id)).filter(Food.is_preset == True).scalar()
    return count == 0


def load_indian_foods(db: Session) -> int:
    """Load Indian food data from Kaggle"""
    try:
        import kagglehub
        from kagglehub import KaggleDatasetAdapter

        print("[CalTrack] Loading Indian food data from Kaggle...")

        df = kagglehub.load(
            KaggleDatasetAdapter.PANDAS,
            "batthulavinay/indian-food-nutrition",
            kagglehub_load_dataset_kwargs={},
        )

        count = 0
        for _, row in df.iterrows():
            try:
                food = Food(
                    name=str(row.get("name", "Unknown Indian Food"))[:100],
                    category="Indian",
                    calories=int(float(row.get("calories", 0))),
                    protein=float(row.get("protein", 0)),
                    carbs=float(row.get("carbs", 0)),
                    fat=float(row.get("fat", 0)),
                    unit="1 serving",
                    is_preset=True,
                )
                db.add(food)
                count += 1
            except Exception:
                continue

        db.commit()
        print(f"[CalTrack] ✓ Loaded {count} Indian foods")
        return count
    except ImportError:
        print("[CalTrack] Warning: kagglehub not installed, skipping Indian foods")
        return 0
    except Exception as e:
        print(f"[CalTrack] Warning: Could not load Indian foods: {e}")
        return 0


def load_hk_foods_from_usda(db: Session) -> int:
    """Load HK food data from USDA API"""
    try:
        import requests

        api_key = os.getenv("USDA_API_KEY")
        if not api_key:
            print("[CalTrack] USDA_API_KEY not set, skipping USDA HK foods")
            return 0

        print("[CalTrack] Loading HK food data from USDA API...")

        search_queries = [
            "Hong Kong dim sum",
            "Hong Kong noodles",
            "Hong Kong rice",
        ]

        count = 0
        for query in search_queries:
            try:
                response = requests.get(
                    "https://api.nal.usda.gov/fdc/v1/foods/search",
                    params={"query": query, "pageSize": 15, "api_key": api_key},
                    timeout=10,
                )
                data = response.json()

                for item in data.get("foods", []):
                    try:
                        nutrients = {}
                        for nutrient in item.get("foodNutrients", []):
                            n_name = nutrient.get("nutrientName", "").lower()
                            value = nutrient.get("value", 0)

                            if "energy" in n_name and "kcal" in n_name:
                                nutrients["calories"] = int(value)
                            elif "protein" in n_name:
                                nutrients["protein"] = float(value)
                            elif "carbohydrate" in n_name:
                                nutrients["carbs"] = float(value)
                            elif "fat" in n_name and "total" in n_name:
                                nutrients["fat"] = float(value)

                        if nutrients.get("calories", 0) > 0:
                            food = Food(
                                name=str(item.get("description", "Unknown"))[:100],
                                category="HK Classic",
                                calories=nutrients.get("calories", 0),
                                protein=nutrients.get("protein", 0),
                                carbs=nutrients.get("carbs", 0),
                                fat=nutrients.get("fat", 0),
                                unit="100g",
                                is_preset=True,
                            )
                            db.add(food)
                            count += 1
                    except Exception:
                        continue
            except Exception:
                continue

        db.commit()
        print(f"[CalTrack] ✓ Loaded {count} HK foods from USDA")
        return count
    except ImportError:
        print("[CalTrack] Warning: requests library not installed")
        return 0
    except Exception as e:
        print(f"[CalTrack] Warning: Could not load HK foods: {e}")
        return 0


def load_default_hk_foods(db: Session) -> int:
    """Load hardcoded fallback HK foods if API fails"""
    print("[CalTrack] Loading fallback HK food data...")

    fallback_foods = [
        ("Pineapple Bun with Butter", 360, 6, 45, 18),
        ("HK-Style Milk Tea (Iced)", 180, 3, 22, 8),
        ("HK French Toast with Syrup", 520, 10, 58, 28),
        ("Baked Pork Chop Rice", 780, 32, 85, 34),
        ("Satay Beef Instant Noodles", 620, 22, 68, 28),
        ("Char Siu Rice (BBQ Pork Rice)", 680, 30, 82, 24),
        ("Siu Mai (Pork & Shrimp Dim Sum)", 240, 14, 16, 12),
        ("Har Gow (Shrimp Dumplings)", 180, 10, 22, 5),
        ("Curry Fish Balls", 160, 8, 12, 9),
        ("Egg Tart", 220, 4, 24, 12),
        ("Vita Lemon Tea (250ml)", 135, 0, 34, 0),
        ("Vitasoy Soymilk (250ml)", 120, 6, 16, 3.5),
    ]

    count = 0
    for name, cal, protein, carbs, fat in fallback_foods:
        food = Food(
            name=name,
            category="HK Classic",
            calories=cal,
            protein=protein,
            carbs=carbs,
            fat=fat,
            unit="1 serving",
            is_preset=True,
        )
        db.add(food)
        count += 1

    db.commit()
    print(f"[CalTrack] ✓ Loaded {count} fallback HK foods")
    return count


def auto_load_data():
    """Automatically load data on startup if needed"""
    db = SessionLocal()
    try:
        if not should_load_data(db):
            print("[CalTrack] Data already loaded, skipping")
            return

        print("[CalTrack] Starting automatic data load...")

        total = 0

        # Try to load from APIs
        total += load_indian_foods(db)
        total += load_hk_foods_from_usda(db)

        # If no HK foods loaded, use fallback
        hk_count = db.query(func.count(Food.id)).filter(
            Food.is_preset == True, Food.category == "HK Classic"
        ).scalar()
        if hk_count == 0:
            total += load_default_hk_foods(db)

        print(f"[CalTrack] ✓ Data load complete: {total} foods loaded")
    except Exception as e:
        print(f"[CalTrack] Error during data load: {e}")
    finally:
        db.close()
