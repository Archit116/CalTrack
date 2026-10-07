import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDailySummary, getWaterTotal, logWater, deleteMeal, logMeal, lookupBarcode } from '../api/client';
import { useAuthStore } from '../stores/authStore';
import type { MealType, FoodCategory, Food, MealLog } from '../types';
import AddFoodModal from '../components/AddFoodModal';
import FoodAutocomplete from '../components/FoodAutocomplete';
import BarcodeScanner from '../components/BarcodeScanner';

const MEAL_TYPES: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
const CATEGORIES: FoodCategory[] = ['All', 'HK Classic', 'Indian', 'Beverage', 'Packaged'];

export default function DashboardPage() {
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedFood, setScannedFood] = useState<Food | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

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
      setScannedFood(null);
    },
  });

  const handleFoodSelect = (food: Food, mealType: MealType) => {
    logMealMutation.mutate({ foodId: food.id, mealType });
  };

  const handleBarcodeScan = useCallback(async (barcode: string) => {
    setShowScanner(false);
    setScanError(null);
    try {
      const food = await lookupBarcode(barcode);
      setScannedFood(food);
    } catch {
      setScanError(`No food found for barcode: ${barcode}`);
      setTimeout(() => setScanError(null), 3000);
    }
  }, []);

  const calorieGoal = user?.daily_calorie_goal || 2000;
  const totalCalories = summary?.total_calories || 0;
  const caloriePercent = Math.min(Math.round((totalCalories / calorieGoal) * 100), 100);

  const waterGoal = user?.daily_water_goal_ml || 2000;
  const totalWater = waterData?.total_ml || 0;
  const waterPercent = Math.min(Math.round((totalWater / waterGoal) * 100), 100);

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
          <div className="flex-1">
            <FoodAutocomplete onSelect={handleFoodSelect} category={selectedCategory} />
          </div>
          <button
            onClick={() => setShowScanner(true)}
            className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 rounded-xl text-lg transition"
            title="Scan Barcode"
          >
            📷
          </button>
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

        {/* Scan Error Toast */}
        {scanError && (
          <div className="bg-rose-500/20 border border-rose-500 text-rose-300 px-4 py-2 rounded-lg text-sm">
            {scanError}
          </div>
        )}

        {/* Scanned Food Result */}
        {scannedFood && (
          <div className="bg-slate-800 border border-amber-400 rounded-xl p-4">
            <div className="flex justify-between items-center mb-3">
              <div>
                <div className="font-semibold text-slate-100">{scannedFood.name}</div>
                <div className="text-xs text-slate-400">
                  {scannedFood.category} • {scannedFood.unit}
                </div>
              </div>
              <div className="text-right">
                <div className="text-amber-400 font-bold">{scannedFood.calories} kcal</div>
                <div className="text-[10px] text-slate-400">
                  P:{scannedFood.protein}g C:{scannedFood.carbs}g F:{scannedFood.fat}g
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {MEAL_TYPES.map((meal) => (
                <button
                  key={meal}
                  onClick={() => handleFoodSelect(scannedFood, meal)}
                  disabled={logMealMutation.isPending}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-900 py-2 rounded-lg text-xs font-bold transition"
                >
                  {meal}
                </button>
              ))}
            </div>
            <button
              onClick={() => setScannedFood(null)}
              className="w-full mt-2 text-slate-400 hover:text-slate-200 text-xs"
            >
              Cancel
            </button>
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
      {showScanner && (
        <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setShowScanner(false)} />
      )}
    </div>
  );
}
