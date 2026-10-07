export interface User {
  id: number;
  email: string;
  name: string;
  daily_calorie_goal: number;
  daily_protein_goal: number;
  daily_carbs_goal: number;
  daily_fat_goal: number;
  daily_water_goal_ml: number;
  created_at: string;
}

export interface Food {
  id: number;
  name: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  unit: string;
  barcode: string | null;
  is_preset: boolean;
  created_by: number | null;
  created_at: string;
}

export interface MealLog {
  id: number;
  food: Food;
  meal_type: MealType;
  servings: number;
  logged_at: string;
  created_at: string;
}

export interface WeightLog {
  id: number;
  weight: number;
  logged_at: string;
  created_at: string;
}

export interface WaterLog {
  id: number;
  amount_ml: number;
  logged_at: string;
  created_at: string;
}

export interface MealTemplateItem {
  id: number;
  food: Food;
  servings: number;
}

export interface MealTemplate {
  id: number;
  name: string;
  meal_type: MealType;
  items: MealTemplateItem[];
  created_at: string;
}

export interface DailySummary {
  date: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  total_water_ml: number;
  meals_by_type: Record<MealType, MealLog[]>;
}

export interface WeeklySummary {
  days: Array<{
    date: string;
    calories: number;
    water_ml: number;
  }>;
  calorie_goal: number;
}

export type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';

export type FoodCategory = 'All' | 'HK Classic' | 'Indian' | 'Beverage' | 'Packaged' | 'Custom';
