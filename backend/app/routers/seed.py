from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Food

router = APIRouter(prefix="/api/seed", tags=["seed"])

# Hong Kong classic foods
HK_FOODS = [
    {"name": "Char Siu Rice", "category": "HK Classic", "calories": 650, "protein": 30, "carbs": 75, "fat": 22, "unit": "1 plate"},
    {"name": "Roast Goose Rice", "category": "HK Classic", "calories": 720, "protein": 35, "carbs": 70, "fat": 30, "unit": "1 plate"},
    {"name": "Wonton Noodle Soup", "category": "HK Classic", "calories": 380, "protein": 18, "carbs": 45, "fat": 12, "unit": "1 bowl"},
    {"name": "Beef Brisket Noodles", "category": "HK Classic", "calories": 520, "protein": 28, "carbs": 55, "fat": 20, "unit": "1 bowl"},
    {"name": "Pineapple Bun", "category": "HK Classic", "calories": 320, "protein": 6, "carbs": 48, "fat": 12, "unit": "1 piece"},
    {"name": "Egg Tart", "category": "HK Classic", "calories": 180, "protein": 4, "carbs": 20, "fat": 10, "unit": "1 piece"},
    {"name": "Fried Rice with Egg", "category": "HK Classic", "calories": 550, "protein": 15, "carbs": 70, "fat": 22, "unit": "1 plate"},
    {"name": "Congee with Pork", "category": "HK Classic", "calories": 280, "protein": 12, "carbs": 40, "fat": 8, "unit": "1 bowl"},
    {"name": "Dim Sum - Har Gow", "category": "HK Classic", "calories": 150, "protein": 8, "carbs": 15, "fat": 6, "unit": "3 pieces"},
    {"name": "Dim Sum - Siu Mai", "category": "HK Classic", "calories": 180, "protein": 10, "carbs": 12, "fat": 10, "unit": "3 pieces"},
    {"name": "Dim Sum - Char Siu Bao", "category": "HK Classic", "calories": 280, "protein": 10, "carbs": 35, "fat": 10, "unit": "1 piece"},
    {"name": "Dim Sum - Cheung Fun", "category": "HK Classic", "calories": 220, "protein": 8, "carbs": 28, "fat": 8, "unit": "1 roll"},
    {"name": "Roast Duck Rice", "category": "HK Classic", "calories": 680, "protein": 32, "carbs": 68, "fat": 28, "unit": "1 plate"},
    {"name": "Clay Pot Rice", "category": "HK Classic", "calories": 620, "protein": 25, "carbs": 72, "fat": 24, "unit": "1 pot"},
    {"name": "Milk Tea (Hot)", "category": "Beverage", "calories": 150, "protein": 3, "carbs": 22, "fat": 6, "unit": "1 cup"},
    {"name": "Milk Tea (Iced)", "category": "Beverage", "calories": 180, "protein": 3, "carbs": 28, "fat": 6, "unit": "1 cup"},
    {"name": "Yuenyeung (Coffee Milk Tea)", "category": "Beverage", "calories": 170, "protein": 4, "carbs": 24, "fat": 6, "unit": "1 cup"},
    {"name": "Lemon Tea (Iced)", "category": "Beverage", "calories": 120, "protein": 0, "carbs": 30, "fat": 0, "unit": "1 cup"},
    {"name": "Soy Milk", "category": "Beverage", "calories": 80, "protein": 7, "carbs": 4, "fat": 4, "unit": "1 cup"},
    {"name": "Sweet Tofu Pudding", "category": "HK Classic", "calories": 150, "protein": 5, "carbs": 25, "fat": 3, "unit": "1 bowl"},
    {"name": "Macaroni Soup with Ham", "category": "HK Classic", "calories": 380, "protein": 15, "carbs": 45, "fat": 14, "unit": "1 bowl"},
    {"name": "Instant Noodles with Luncheon Meat", "category": "HK Classic", "calories": 520, "protein": 18, "carbs": 55, "fat": 25, "unit": "1 bowl"},
    {"name": "French Toast (HK Style)", "category": "HK Classic", "calories": 450, "protein": 12, "carbs": 42, "fat": 26, "unit": "1 serving"},
    {"name": "Scrambled Eggs on Toast", "category": "HK Classic", "calories": 380, "protein": 18, "carbs": 30, "fat": 20, "unit": "1 serving"},
    {"name": "Curry Fish Balls", "category": "HK Classic", "calories": 180, "protein": 12, "carbs": 8, "fat": 12, "unit": "6 pieces"},
    {"name": "Siu Yuk Rice", "category": "HK Classic", "calories": 750, "protein": 30, "carbs": 70, "fat": 38, "unit": "1 plate"},
    {"name": "Hainanese Chicken Rice", "category": "HK Classic", "calories": 580, "protein": 35, "carbs": 60, "fat": 20, "unit": "1 plate"},
    {"name": "Sweet & Sour Pork Rice", "category": "HK Classic", "calories": 620, "protein": 22, "carbs": 75, "fat": 24, "unit": "1 plate"},
]

# Indian foods (simplified Kaggle-like data)
INDIAN_FOODS = [
    {"name": "Butter Chicken", "category": "Indian", "calories": 490, "protein": 28, "carbs": 12, "fat": 38, "unit": "1 serving"},
    {"name": "Chicken Biryani", "category": "Indian", "calories": 550, "protein": 25, "carbs": 65, "fat": 18, "unit": "1 plate"},
    {"name": "Dal Makhani", "category": "Indian", "calories": 320, "protein": 12, "carbs": 35, "fat": 15, "unit": "1 bowl"},
    {"name": "Palak Paneer", "category": "Indian", "calories": 350, "protein": 15, "carbs": 12, "fat": 28, "unit": "1 serving"},
    {"name": "Tandoori Chicken", "category": "Indian", "calories": 260, "protein": 35, "carbs": 5, "fat": 12, "unit": "2 pieces"},
    {"name": "Naan Bread", "category": "Indian", "calories": 260, "protein": 8, "carbs": 45, "fat": 5, "unit": "1 piece"},
    {"name": "Roti/Chapati", "category": "Indian", "calories": 120, "protein": 4, "carbs": 25, "fat": 1, "unit": "1 piece"},
    {"name": "Samosa", "category": "Indian", "calories": 260, "protein": 5, "carbs": 30, "fat": 14, "unit": "1 piece"},
    {"name": "Aloo Gobi", "category": "Indian", "calories": 180, "protein": 4, "carbs": 22, "fat": 9, "unit": "1 serving"},
    {"name": "Chana Masala", "category": "Indian", "calories": 280, "protein": 11, "carbs": 38, "fat": 10, "unit": "1 serving"},
    {"name": "Paneer Tikka", "category": "Indian", "calories": 320, "protein": 18, "carbs": 8, "fat": 25, "unit": "6 pieces"},
    {"name": "Masala Dosa", "category": "Indian", "calories": 350, "protein": 8, "carbs": 50, "fat": 14, "unit": "1 piece"},
    {"name": "Idli", "category": "Indian", "calories": 80, "protein": 3, "carbs": 15, "fat": 0.5, "unit": "2 pieces"},
    {"name": "Vada", "category": "Indian", "calories": 180, "protein": 6, "carbs": 20, "fat": 9, "unit": "2 pieces"},
    {"name": "Upma", "category": "Indian", "calories": 230, "protein": 6, "carbs": 35, "fat": 8, "unit": "1 bowl"},
    {"name": "Poha", "category": "Indian", "calories": 250, "protein": 5, "carbs": 40, "fat": 8, "unit": "1 bowl"},
    {"name": "Raita", "category": "Indian", "calories": 60, "protein": 3, "carbs": 5, "fat": 3, "unit": "1 serving"},
    {"name": "Gulab Jamun", "category": "Indian", "calories": 150, "protein": 2, "carbs": 25, "fat": 5, "unit": "2 pieces"},
    {"name": "Kheer", "category": "Indian", "calories": 180, "protein": 5, "carbs": 30, "fat": 5, "unit": "1 bowl"},
    {"name": "Lassi (Sweet)", "category": "Beverage", "calories": 180, "protein": 6, "carbs": 28, "fat": 5, "unit": "1 glass"},
    {"name": "Mango Lassi", "category": "Beverage", "calories": 220, "protein": 6, "carbs": 38, "fat": 5, "unit": "1 glass"},
    {"name": "Chai Tea", "category": "Beverage", "calories": 100, "protein": 3, "carbs": 15, "fat": 3, "unit": "1 cup"},
    {"name": "Korma (Chicken)", "category": "Indian", "calories": 420, "protein": 25, "carbs": 15, "fat": 30, "unit": "1 serving"},
    {"name": "Vindaloo (Lamb)", "category": "Indian", "calories": 380, "protein": 28, "carbs": 10, "fat": 26, "unit": "1 serving"},
    {"name": "Keema", "category": "Indian", "calories": 320, "protein": 22, "carbs": 8, "fat": 24, "unit": "1 serving"},
    {"name": "Fish Curry", "category": "Indian", "calories": 280, "protein": 25, "carbs": 12, "fat": 16, "unit": "1 serving"},
    {"name": "Prawn Masala", "category": "Indian", "calories": 260, "protein": 22, "carbs": 10, "fat": 15, "unit": "1 serving"},
    {"name": "Vegetable Pulao", "category": "Indian", "calories": 320, "protein": 7, "carbs": 55, "fat": 8, "unit": "1 plate"},
    {"name": "Puri", "category": "Indian", "calories": 150, "protein": 3, "carbs": 18, "fat": 8, "unit": "2 pieces"},
    {"name": "Paratha (Plain)", "category": "Indian", "calories": 200, "protein": 5, "carbs": 30, "fat": 8, "unit": "1 piece"},
    {"name": "Aloo Paratha", "category": "Indian", "calories": 280, "protein": 6, "carbs": 38, "fat": 12, "unit": "1 piece"},
]

# Common packaged/fast foods
PACKAGED_FOODS = [
    {"name": "Coca-Cola", "category": "Beverage", "calories": 140, "protein": 0, "carbs": 39, "fat": 0, "unit": "330ml can"},
    {"name": "Sprite", "category": "Beverage", "calories": 140, "protein": 0, "carbs": 38, "fat": 0, "unit": "330ml can"},
    {"name": "Red Bull", "category": "Beverage", "calories": 110, "protein": 0, "carbs": 27, "fat": 0, "unit": "250ml can"},
    {"name": "Orange Juice", "category": "Beverage", "calories": 110, "protein": 2, "carbs": 26, "fat": 0, "unit": "250ml"},
    {"name": "McDonald's Big Mac", "category": "Packaged", "calories": 550, "protein": 25, "carbs": 45, "fat": 30, "unit": "1 burger"},
    {"name": "McDonald's McChicken", "category": "Packaged", "calories": 400, "protein": 14, "carbs": 40, "fat": 21, "unit": "1 burger"},
    {"name": "McDonald's Fries (Medium)", "category": "Packaged", "calories": 320, "protein": 4, "carbs": 42, "fat": 15, "unit": "1 serving"},
    {"name": "KFC Original Recipe", "category": "Packaged", "calories": 320, "protein": 22, "carbs": 12, "fat": 21, "unit": "2 pieces"},
    {"name": "Subway 6-inch Turkey", "category": "Packaged", "calories": 280, "protein": 18, "carbs": 46, "fat": 3, "unit": "1 sub"},
    {"name": "Starbucks Latte (Grande)", "category": "Beverage", "calories": 190, "protein": 13, "carbs": 18, "fat": 7, "unit": "1 cup"},
    {"name": "Starbucks Frappuccino", "category": "Beverage", "calories": 380, "protein": 5, "carbs": 60, "fat": 14, "unit": "1 cup"},
    {"name": "Instant Ramen", "category": "Packaged", "calories": 380, "protein": 9, "carbs": 52, "fat": 14, "unit": "1 pack"},
    {"name": "Cup Noodles", "category": "Packaged", "calories": 290, "protein": 7, "carbs": 38, "fat": 12, "unit": "1 cup"},
    {"name": "White Rice", "category": "HK Classic", "calories": 200, "protein": 4, "carbs": 45, "fat": 0.5, "unit": "1 bowl"},
    {"name": "Brown Rice", "category": "HK Classic", "calories": 220, "protein": 5, "carbs": 45, "fat": 2, "unit": "1 bowl"},
    {"name": "Steamed Vegetables", "category": "HK Classic", "calories": 50, "protein": 2, "carbs": 10, "fat": 0, "unit": "1 serving"},
    {"name": "Grilled Chicken Breast", "category": "HK Classic", "calories": 165, "protein": 31, "carbs": 0, "fat": 4, "unit": "100g"},
    {"name": "Boiled Egg", "category": "HK Classic", "calories": 78, "protein": 6, "carbs": 0.5, "fat": 5, "unit": "1 egg"},
    {"name": "Banana", "category": "HK Classic", "calories": 105, "protein": 1, "carbs": 27, "fat": 0.4, "unit": "1 medium"},
    {"name": "Apple", "category": "HK Classic", "calories": 95, "protein": 0.5, "carbs": 25, "fat": 0.3, "unit": "1 medium"},
]


@router.post("/foods")
def seed_foods(db: Session = Depends(get_db)):
    """Seed the database with preset foods. Skips duplicates."""
    added = 0
    skipped = 0

    all_foods = HK_FOODS + INDIAN_FOODS + PACKAGED_FOODS

    for food_data in all_foods:
        existing = db.query(Food).filter(
            Food.name == food_data["name"],
            Food.is_preset == True
        ).first()

        if existing:
            skipped += 1
            continue

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
        added += 1

    db.commit()

    return {
        "message": f"Seeding complete. Added: {added}, Skipped: {skipped}",
        "total_foods": added + skipped
    }
