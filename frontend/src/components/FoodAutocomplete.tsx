import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchFoods, getFoods } from '../api/client';
import type { Food, FoodCategory, MealType } from '../types';

interface Props {
  onSelect: (food: Food, mealType: MealType) => void;
  category: FoodCategory;
}

const MEAL_TYPES: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

export default function FoodAutocomplete({ onSelect, category }: Props) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Search results
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['foodSearch', debouncedQuery, category],
    queryFn: () => searchFoods(debouncedQuery, category, 20),
    enabled: debouncedQuery.length >= 1,
  });

  // All foods (for browsing when no query)
  const { data: allFoods, isLoading: isLoadingAll } = useQuery({
    queryKey: ['allFoods', category],
    queryFn: () => getFoods('', category),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const displayFoods = debouncedQuery.length >= 1 ? searchResults : allFoods;
  const isLoading = debouncedQuery.length >= 1 ? isSearching : isLoadingAll;

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

  const handleFoodClick = (food: Food) => {
    if (selectedFood?.id === food.id) {
      setSelectedFood(null);
    } else {
      setSelectedFood(food);
    }
  };

  const handleMealSelect = (mealType: MealType) => {
    if (selectedFood) {
      onSelect(selectedFood, mealType);
      setQuery('');
      setSelectedFood(null);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder="Search foods or tap to browse..."
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
          className="absolute z-40 w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-h-96 overflow-y-auto"
        >
          {isLoading ? (
            <div className="p-4 text-center text-slate-400 text-sm">Loading...</div>
          ) : !displayFoods || displayFoods.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-sm">
              {debouncedQuery ? 'No foods found' : 'No foods available'}
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {displayFoods.map((food) => (
                <div key={food.id} className="relative">
                  <div
                    onClick={() => handleFoodClick(food)}
                    className={`p-3 cursor-pointer transition ${
                      selectedFood?.id === food.id
                        ? 'bg-slate-700'
                        : 'hover:bg-slate-700/60'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-100 text-sm truncate">
                          {food.name}
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

                  {selectedFood?.id === food.id && (
                    <div className="px-3 pb-3 flex gap-2 bg-slate-700">
                      {MEAL_TYPES.map((meal) => (
                        <button
                          key={meal}
                          onClick={() => handleMealSelect(meal)}
                          className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-900 py-1.5 rounded-lg text-xs font-bold transition"
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
        </div>
      )}
    </div>
  );
}
