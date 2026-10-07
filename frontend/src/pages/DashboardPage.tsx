import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDailySummary, getWaterTotal, logWater, deleteMeal, logMeal, getRecommendations } from '../api/client';
import { useAuthStore } from '../stores/authStore';
import type { MealType, FoodCategory, Food, MealLog } from '../types';
import AddFoodModal from '../components/AddFoodModal';

const MEAL_TYPES: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
const CATEGORIES: FoodCategory[] = ['All', 'HK Classic', 'Indian', 'Beverage', 'Packaged'];

export default function DashboardPage() {
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<MealType | null>(null);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);

  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  const { data: summary, isLoading } = useQuery({
    queryKey: ['dailySummary'],
    queryFn: () => getDailySummary(),
  });

  const { data: waterData } = useQuery({
    queryKey: ['waterTotal'],
    queryFn: () => getWaterTotal(),
  });

  const { data: foods } = useQuery({
    queryKey: ['recommendations', searchQuery, selectedCategory],
    queryFn: () => getRecommendations(searchQuery, selectedCategory, 15),
    enabled: searchQuery.length > 1,
  });

  const logWaterMutation = useMutation({
    mutationFn: (amount: number) => logWater(amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waterTotal'] });
      queryClient.invalidateQueries({ queryKey: ['dailySummary'] });
    },
  });

  const deleteMealMutation = useMutation({
    mutationFn: (mealId: number) => deleteMeal(mealId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailySummary'] });
    },
  });

  const logMealMutation = useMutation({
    mutationFn: ({ foodId, mealType }: { foodId: number; mealType: MealType }) =>
      logMeal(foodId, mealType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailySummary'] });
      setSearchQuery('');
      setSelectedFood(null);
      setSelectedMeal(null);
    },
  });

  const calorieGoal = user?.daily_calorie_goal || 2000;
  const totalCalories = summary?.total_calories || 0;
  const caloriePercent = Math.min(Math.round((totalCalories / calorieGoal) * 100), 100);

  const waterGoal = user?.daily_water_goal_ml || 2000;
  const totalWater = waterData?.total_ml || 0;
  const waterPercent = Math.min(Math.round((totalWater / waterGoal) * 100), 100);

  const selectFood = (food: Food) => {
    setSelectedFood(food);
    if (selectedMeal) {
      logMealMutation.mutate({ foodId: food.id, mealType: selectedMeal });
    }
  };

  const handleMealSelect = (meal: MealType) => {
    setSelectedMeal(meal);
    if (selectedFood) {
      logMealMutation.mutate({ foodId: selectedFood.id, mealType: meal });
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-slate-400">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Summary */}
      <section className="bg-slate-800 rounded-2xl p-5 border border-slate-700 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
              Daily Goal
            </h2>
            <p className="text-2xl font-black text-slate-100">
              {totalCalories} / {calorieGoal} kcal
            </p>
          </div>
          <div className="w-16 h-16 relative flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-700"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-amber-400 stroke-current transition-all duration-500"
                strokeDasharray={`${caloriePercent}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-xs font-bold text-slate-300">{caloriePercent}%</span>
          </div>
        </div>

        {/* Macros Grid */}
        <div className="grid grid-cols-3 gap-3 text-center pt-3 border-t border-slate-700">
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/50">
            <span className="text-xs text-slate-400 font-medium block">Protein</span>
            <span className="text-base font-bold text-emerald-400">
              {summary?.total_protein || 0}g
            </span>
          </div>
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/50">
            <span className="text-xs text-slate-400 font-medium block">Carbs</span>
            <span className="text-base font-bold text-sky-400">
              {summary?.total_carbs || 0}g
            </span>
          </div>
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/50">
            <span className="text-xs text-slate-400 font-medium block">Fats</span>
            <span className="text-base font-bold text-rose-400">
              {summary?.total_fat || 0}g
            </span>
          </div>
        </div>
      </section>

      {/* Water Tracking */}
      <section className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">💧</span>
            <span className="font-semibold text-slate-200">Water</span>
          </div>
          <span className="text-sm text-slate-400">
            {totalWater}ml / {waterGoal}ml ({waterPercent}%)
          </span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-sky-400 transition-all duration-300"
            style={{ width: `${waterPercent}%` }}
          />
        </div>
        <div className="flex gap-2">
          {[250, 500].map((amount) => (
            <button
              key={amount}
              onClick={() => logWaterMutation.mutate(amount)}
              disabled={logWaterMutation.isPending}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 py-2 rounded-lg text-sm font-medium transition"
            >
              +{amount}ml
            </button>
          ))}
        </div>
      </section>

      {/* Search & Add Food */}
      <section className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search foods..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 text-slate-100 placeholder-slate-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            )}
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 rounded-xl text-sm transition"
          >
            + Custom
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full font-medium whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-amber-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Results */}
        {searchQuery && foods && foods.length > 0 && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-h-80 overflow-y-auto divide-y divide-slate-700/50">
            {foods.map((food) => (
              <div
                key={food.id}
                className="p-3 hover:bg-slate-700/60 transition cursor-pointer"
                onClick={() => selectFood(food)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-slate-100 text-sm">{food.name}</div>
                    <div className="text-xs text-slate-400">
                      {food.category} • {food.unit}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-amber-400 font-bold text-sm">{food.calories} kcal</div>
                    <div className="text-[10px] text-slate-400">
                      P:{food.protein}g C:{food.carbs}g F:{food.fat}g
                    </div>
                  </div>
                </div>
                {selectedFood?.id === food.id && !selectedMeal && (
                  <div className="mt-2 flex gap-2">
                    {MEAL_TYPES.map((meal) => (
                      <button
                        key={meal}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMealSelect(meal);
                        }}
                        className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-900 py-1 rounded text-xs font-medium"
                      >
                        {meal}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Meal Sections */}
      <section className="space-y-3">
        <h3 className="font-bold text-lg text-slate-200">Today's Meals</h3>
        {MEAL_TYPES.map((mealType) => {
          const meals = summary?.meals_by_type[mealType] || [];
          const mealCalories = meals.reduce(
            (acc: number, m: MealLog) => acc + m.food.calories * m.servings,
            0
          );

          return (
            <div
              key={mealType}
              className="bg-slate-800 rounded-xl border border-slate-700 p-4"
            >
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-slate-200">{mealType}</h4>
                <span className="text-xs font-semibold text-amber-400">{mealCalories} kcal</span>
              </div>
              {meals.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No food logged yet.</p>
              ) : (
                <div className="divide-y divide-slate-700/40 space-y-1">
                  {meals.map((meal: MealLog) => (
                    <div key={meal.id} className="flex justify-between items-center pt-2 text-sm">
                      <div>
                        <span className="text-slate-200 font-medium">{meal.food.name}</span>
                        <span className="text-[10px] text-slate-400 block">
                          {meal.food.calories * meal.servings} kcal | P:
                          {Math.round(meal.food.protein * meal.servings)}g C:
                          {Math.round(meal.food.carbs * meal.servings)}g F:
                          {Math.round(meal.food.fat * meal.servings)}g
                        </span>
                      </div>
                      <button
                        onClick={() => deleteMealMutation.mutate(meal.id)}
                        className="text-rose-400 hover:text-rose-300 text-xs px-2 py-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </section>

      {showAddModal && <AddFoodModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
}
