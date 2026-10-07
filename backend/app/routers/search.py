from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from ..database import get_db
from ..models import Food, User
from ..schemas import FoodResponse
from ..auth import get_current_user

router = APIRouter(prefix="/api/search", tags=["search"])


def levenshtein_similarity(s1: str, s2: str) -> float:
    """Calculate Levenshtein distance ratio for fuzzy matching"""
    if not s1 or not s2:
        return 0.0

    s1 = s1.lower()
    s2 = s2.lower()

    if s1 == s2:
        return 1.0

    len1, len2 = len(s1), len(s2)
    if len1 == 0 or len2 == 0:
        return 0.0

    # Create distance matrix
    d = [[0] * (len2 + 1) for _ in range(len1 + 1)]

    for i in range(len1 + 1):
        d[i][0] = i
    for j in range(len2 + 1):
        d[0][j] = j

    for i in range(1, len1 + 1):
        for j in range(1, len2 + 1):
            cost = 0 if s1[i - 1] == s2[j - 1] else 1
            d[i][j] = min(
                d[i - 1][j] + 1,  # deletion
                d[i][j - 1] + 1,  # insertion
                d[i - 1][j - 1] + cost,  # substitution
            )

    max_len = max(len1, len2)
    return 1.0 - (d[len1][len2] / max_len)


@router.get("/foods", response_model=list[FoodResponse])
def search_foods_with_recommendations(
    q: str = Query(..., min_length=1, max_length=100),
    category: Optional[str] = Query(None),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Smart food search with fuzzy matching and recommendations.
    Returns foods that match the query, sorted by relevance.
    """

    # Get all available foods
    query = db.query(Food).filter(
        or_(Food.is_preset == True, Food.created_by == current_user.id)
    )

    if category and category != "All":
        query = query.filter(Food.category == category)

    all_foods = query.all()

    if not all_foods:
        return []

    # Score foods by relevance
    scored_foods = []

    for food in all_foods:
        name_lower = food.name.lower()
        q_lower = q.lower()

        # Scoring logic
        score = 0.0

        # Exact match (highest priority)
        if name_lower == q_lower:
            score = 100.0
        # Starts with query
        elif name_lower.startswith(q_lower):
            score = 80.0 + (len(q) / len(food.name)) * 10
        # Contains query as whole word
        elif f" {q_lower} " in f" {name_lower} ":
            score = 70.0
        # Contains query
        elif q_lower in name_lower:
            score = 60.0 + (len(q) / len(food.name)) * 10
        # Fuzzy match
        else:
            fuzzy_score = levenshtein_similarity(q, food.name)
            if fuzzy_score > 0.6:
                score = fuzzy_score * 50

        if score > 0:
            scored_foods.append((food, score))

    # Sort by score (highest first)
    scored_foods.sort(key=lambda x: x[1], reverse=True)

    # Return top results
    return [food for food, score in scored_foods[:limit]]


@router.get("/recommendations", response_model=list[FoodResponse])
def get_food_recommendations(
    q: str = Query(..., min_length=1, max_length=100),
    category: Optional[str] = Query(None),
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get real-time food recommendations as user types.
    Optimized for quick response and relevance.
    """

    # Fast query with LIKE first
    foods = db.query(Food).filter(
        or_(Food.is_preset == True, Food.created_by == current_user.id),
        Food.name.ilike(f"%{q}%"),
    )

    if category and category != "All":
        foods = foods.filter(Food.category == category)

    results = foods.limit(limit).all()

    if len(results) < limit:
        # Add fuzzy matches if needed
        all_foods = db.query(Food).filter(
            or_(Food.is_preset == True, Food.created_by == current_user.id)
        )
        if category and category != "All":
            all_foods = all_foods.filter(Food.category == category)

        all_foods = all_foods.all()
        fuzzy_matches = []

        for food in all_foods:
            if not any(r.id == food.id for r in results):
                similarity = levenshtein_similarity(q, food.name)
                if similarity > 0.65:
                    fuzzy_matches.append((food, similarity))

        fuzzy_matches.sort(key=lambda x: x[1], reverse=True)
        results.extend([food for food, _ in fuzzy_matches[: limit - len(results)]])

    return results[:limit]


@router.get("/similar", response_model=list[FoodResponse])
def get_similar_foods(
    food_id: int = Query(...),
    limit: int = Query(5, ge=1, le=10),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get foods similar to a given food based on:
    - Same category
    - Similar nutrition profile
    """

    food = db.query(Food).filter(Food.id == food_id).first()
    if not food:
        return []

    # Get foods in same category with similar nutrition
    similar = db.query(Food).filter(
        Food.category == food.category,
        Food.id != food.id,
        or_(Food.is_preset == True, Food.created_by == current_user.id),
    ).all()

    # Score by nutrition similarity
    scored = []
    for f in similar:
        # Calculate nutrition profile distance
        cal_diff = abs(food.calories - f.calories)
        protein_diff = abs(food.protein - f.protein)
        carbs_diff = abs(food.carbs - f.carbs)
        fat_diff = abs(food.fat - f.fat)

        # Normalize and weight
        distance = (cal_diff * 0.01) + protein_diff + carbs_diff + fat_diff
        similarity_score = 100.0 / (1.0 + distance)

        scored.append((f, similarity_score))

    # Sort by similarity
    scored.sort(key=lambda x: x[1], reverse=True)

    return [food for food, _ in scored[:limit]]
