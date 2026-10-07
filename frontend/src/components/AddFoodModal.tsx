import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFood } from '../api/client';
import type { FoodCategory } from '../types';

interface Props {
  onClose: () => void;
}

const CATEGORIES: Exclude<FoodCategory, 'All'>[] = ['HK Classic', 'Indian', 'Beverage', 'Packaged'];

export default function AddFoodModal({ onClose }: Props) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('HK Classic');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('0');
  const [carbs, setCarbs] = useState('0');
  const [fat, setFat] = useState('0');
  const [unit, setUnit] = useState('1 serving');
  const [barcode, setBarcode] = useState('');

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      createFood({
        name,
        category,
        calories: parseInt(calories),
        protein: parseFloat(protein),
        carbs: parseFloat(carbs),
        fat: parseFloat(fat),
        unit,
        barcode: barcode || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foods'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-amber-400">Add Custom Food Item</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3 text-sm">
          <div>
            <label className="block text-slate-400 mb-1">Item Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Home Cooked Beef Curry"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-400"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Barcode (Optional)</label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="e.g. 489123456789"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Calories (kcal)</label>
              <input
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                required
                placeholder="350"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Serving Unit</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="1 bowl / 1 box"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-slate-400 mb-1">Protein (g)</label>
              <input
                type="number"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Carbs (g)</label>
              <input
                type="number"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Fat (g)</label>
              <input
                type="number"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none"
              />
            </div>
          </div>

          {mutation.isError && (
            <p className="text-rose-400 text-sm">Failed to create food item</p>
          )}

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full bg-amber-500 text-slate-950 font-bold py-3 rounded-xl hover:bg-amber-400 transition mt-2 disabled:opacity-50"
          >
            {mutation.isPending ? 'Saving...' : 'Save & Add to Database'}
          </button>
        </form>
      </div>
    </div>
  );
}
