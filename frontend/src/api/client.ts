import { useAuthStore } from '../stores/authStore';
import type {
  User,
  Food,
  MealLog,
  WeightLog,
  WaterLog,
  MealTemplate,
  DailySummary,
  WeeklySummary,
  MealType,
} from '../types';

const BASE_URL = '/api';

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = useAuthStore.getState().token;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      useAuthStore.getState().logout();
    }
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || 'Request failed');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// Auth
export async function login(email: string, password: string): Promise<{ access_token: string; token_type: string }> {
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password);

  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Login failed' }));
    throw new Error(error.detail || 'Login failed');
  }

  return response.json();
}

export async function register(email: string, password: string, name: string): Promise<User> {
  return fetchApi<User>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });
}

export async function getMe(): Promise<User> {
  return fetchApi<User>('/auth/me');
}

export async function updateMe(data: Partial<User>): Promise<User> {
  return fetchApi<User>('/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// Foods
export async function getFoods(search?: string, category?: string): Promise<Food[]> {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (category && category !== 'All') params.append('category', category);
  return fetchApi<Food[]>(`/foods?${params}`);
}

export async function searchFoods(q: string, category?: string, limit = 10): Promise<Food[]> {
  const params = new URLSearchParams();
  params.append('q', q);
  if (category && category !== 'All') params.append('category', category);
  params.append('limit', limit.toString());
  return fetchApi<Food[]>(`/search/foods?${params}`);
}

export async function combinedSearch(q: string, category?: string, limit = 20, includeExternal = true): Promise<Food[]> {
  const params = new URLSearchParams();
  params.append('q', q);
  if (category && category !== 'All') params.append('category', category);
  params.append('limit', limit.toString());
  params.append('include_external', includeExternal.toString());
  return fetchApi<Food[]>(`/search/combined?${params}`);
}

export async function getRecommendations(q: string, category?: string, limit = 5): Promise<Food[]> {
  const params = new URLSearchParams();
  params.append('q', q);
  if (category && category !== 'All') params.append('category', category);
  params.append('limit', limit.toString());
  return fetchApi<Food[]>(`/search/recommendations?${params}`);
}

export async function getSimilarFoods(foodId: number, limit = 5): Promise<Food[]> {
  return fetchApi<Food[]>(`/search/similar?food_id=${foodId}&limit=${limit}`);
}

export async function createFood(food: Omit<Food, 'id' | 'is_preset' | 'created_by' | 'created_at'>): Promise<Food> {
  return fetchApi<Food>('/foods', {
    method: 'POST',
    body: JSON.stringify(food),
  });
}

export async function lookupBarcode(barcode: string): Promise<Food> {
  return fetchApi<Food>(`/foods/barcode/${barcode}`);
}

// Meals
export async function getMeals(date?: string): Promise<MealLog[]> {
  const params = date ? `?logged_at=${date}` : '';
  return fetchApi<MealLog[]>(`/meals${params}`);
}

export async function logMeal(foodId: number, mealType: MealType, servings = 1, date?: string): Promise<MealLog> {
  return fetchApi<MealLog>('/meals', {
    method: 'POST',
    body: JSON.stringify({
      food_id: foodId,
      meal_type: mealType,
      servings,
      logged_at: date,
    }),
  });
}

export async function deleteMeal(mealId: number): Promise<void> {
  return fetchApi<void>(`/meals/${mealId}`, { method: 'DELETE' });
}

// Stats
export async function getDailySummary(date?: string): Promise<DailySummary> {
  const params = date ? `?target_date=${date}` : '';
  return fetchApi<DailySummary>(`/stats/daily${params}`);
}

export async function getWeeklySummary(): Promise<WeeklySummary> {
  return fetchApi<WeeklySummary>('/stats/weekly');
}

// Weight
export async function getWeightHistory(days = 30): Promise<WeightLog[]> {
  return fetchApi<WeightLog[]>(`/weight?days=${days}`);
}

export async function logWeight(weight: number, date?: string): Promise<WeightLog> {
  return fetchApi<WeightLog>('/weight', {
    method: 'POST',
    body: JSON.stringify({ weight, logged_at: date }),
  });
}

export async function deleteWeight(logId: number): Promise<void> {
  return fetchApi<void>(`/weight/${logId}`, { method: 'DELETE' });
}

// Water
export async function getWaterLogs(date?: string): Promise<WaterLog[]> {
  const params = date ? `?logged_at=${date}` : '';
  return fetchApi<WaterLog[]>(`/water${params}`);
}

export async function getWaterTotal(date?: string): Promise<{ date: string; total_ml: number; goal_ml: number }> {
  const params = date ? `?logged_at=${date}` : '';
  return fetchApi<{ date: string; total_ml: number; goal_ml: number }>(`/water/total${params}`);
}

export async function logWater(amountMl: number, date?: string): Promise<WaterLog> {
  return fetchApi<WaterLog>('/water', {
    method: 'POST',
    body: JSON.stringify({ amount_ml: amountMl, logged_at: date }),
  });
}

export async function deleteWater(logId: number): Promise<void> {
  return fetchApi<void>(`/water/${logId}`, { method: 'DELETE' });
}

// Templates
export async function getTemplates(): Promise<MealTemplate[]> {
  return fetchApi<MealTemplate[]>('/templates');
}

export async function createTemplate(
  name: string,
  mealType: MealType,
  items: Array<{ food_id: number; servings: number }>
): Promise<MealTemplate> {
  return fetchApi<MealTemplate>('/templates', {
    method: 'POST',
    body: JSON.stringify({ name, meal_type: mealType, items }),
  });
}

export async function applyTemplate(templateId: number): Promise<MealLog[]> {
  return fetchApi<MealLog[]>(`/templates/${templateId}/apply`, { method: 'POST' });
}

export async function deleteTemplate(templateId: number): Promise<void> {
  return fetchApi<void>(`/templates/${templateId}`, { method: 'DELETE' });
}
