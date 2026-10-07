import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { combinedSearch, getFoods, createFood } from '../api/client';
import type { Food, FoodCategory, MealType } from '../types';

interface Props {
  onSelect: (food: Food, mealType: MealType) => void;
  category: FoodCategory;
}

interface ExtendedFood extends Omit<Food, 'barcode' | 'created_at'> {
  is_external?: boolean;
  barcode?: string | null;
  created_at?: string;
}

const MEAL_TYPES: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

export default function FoodAutocomplete({ onSelect, category }: Props) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFood, setSelectedFood] = useState<ExtendedFood | null>(null);
  const [savingExternal, setSavingExternal] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Combined search (local + external)
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['combinedSearch', debouncedQuery, category],
    queryFn: () => combinedSearch(debouncedQuery, category, 25, true),
    enabled: debouncedQuery.length >= 2,
  });

  // All foods (for browsing when no query)
  const { data: allFoods, isLoading: isLoadingAll } = useQuery({
    queryKey: ['allFoods', category],
    queryFn: () => getFoods('', category),
    staleTime: 5 * 60 * 1000,
  });

  // Mutation to save external food to database
  const saveExternalMutation = useMutation({
    mutationFn: (food: ExtendedFood) =>
      createFood({
        name: food.name,
        category: food.category,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        unit: food.unit,
        barcode: food.barcode || null,
      }),
    onSuccess: (savedFood) => {
      queryClient.invalidateQueries({ queryKey: ['allFoods'] });
      queryClient.invalidateQueries({ queryKey: ['combinedSearch'] });
      return savedFood;
    },
  });

  const displayFoods: ExtendedFood[] = debouncedQuery.length >= 2
    ? (searchResults as ExtendedFood[] || [])
    : (allFoods as ExtendedFood[] || []);
  const isLoading = debouncedQuery.length >= 2 ? isSearching : isLoadingAll;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setSelectedFood(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFoodClick = (food: ExtendedFood) => {
    if (selectedFood?.id === food.id && selectedFood?.name === food.name) {
      setSelectedFood(null);
    } else {
      setSelectedFood(food);
    }
  };

  const handleMealSelect = async (mealType: MealType) => {
    if (!selectedFood) return;

    setSavingExternal(true);
    try {
      let foodToLog = selectedFood;

      // If external food, save to database first
      if (selectedFood.is_external || selectedFood.id === -1) {
        const savedFood = await saveExternalMutation.mutateAsync(selectedFood);
        foodToLog = savedFood;
      }

      onSelect(foodToLog, mealType);
      setQuery('');
      setSelectedFood(null);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to log food:', error);
    } finally {
      setSavingExternal(false);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder="Search foods or tap to browse all..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedFood(null);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:border-amber-400 text-slate-100 placeholder-slate-500"
        />
        <div className="absolute right-3 top-3 text-slate-500">
          {isLoading ? (
            <span className="animate-spin inline-block">⟳</span>
          ) : (
            <span>🔍</span>
          )}
        </div>
      </div>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-40 w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-h-[70vh] overflow-y-auto"
        >
          {isLoading ? (
            <div className="p-4 text-center text-slate-400 text-sm">
              Searching local & external databases...
            </div>
          ) : !displayFoods || displayFoods.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-sm">
              {debouncedQuery ? 'No foods found. Try a different search.' : 'No foods available'}
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {displayFoods.map((food, idx) => (
                <div key={`${food.id}-${food.name}-${idx}`} className="relative">
                  <div
                    onClick={() => handleFoodClick(food)}
                    className={`p-3 cursor-pointer transition ${
                      selectedFood?.id === food.id && selectedFood?.name === food.name
                        ? 'bg-slate-700'
                        : 'hover:bg-slate-700/60'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-100 text-sm truncate">
                            {food.name}
                          </span>
                          {(food.is_external || food.id === -1) && (
                            <span className="text-[10px] bg-sky-500/20 text-sky-400 px-1.5 py-0.5 rounded">
                              External
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400">
                          {food.category} • {food.unit}
                        </div>
                      </div>
                      <div className="text-right ml-3 flex-shrink-0">
                        <div className="text-amber-400 font-bold text-sm">
                          {food.calories} kcal
                        </div>
                        <div className="text-[10px] text-slate-400">
                          P:{food.protein}g C:{food.carbs}g F:{food.fat}g
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedFood?.id === food.id && selectedFood?.name === food.name && (
                    <div className="px-3 pb-3 flex gap-2 bg-slate-700">
                      {MEAL_TYPES.map((meal) => (
                        <button
                          key={meal}
                          onClick={() => handleMealSelect(meal)}
                          disabled={savingExternal}
                          className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-900 py-1.5 rounded-lg text-xs font-bold transition disabled:opacity-50"
                        >
                          {savingExternal ? '...' : meal}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {debouncedQuery.length >= 2 && (
                <div className="p-2 text-center text-[10px] text-slate-500 bg-slate-900/50">
                  Results from local database + Open Food Facts
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
