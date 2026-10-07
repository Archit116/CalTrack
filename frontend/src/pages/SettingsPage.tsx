import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { updateMe, logWeight, getWeightHistory, getTemplates, deleteTemplate, applyTemplate } from '../api/client';
import { useAuthStore } from '../stores/authStore';
import type { MealTemplate } from '../types';

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();

  const [name, setName] = useState(user?.name || '');
  const [calorieGoal, setCalorieGoal] = useState(user?.daily_calorie_goal || 2000);
  const [proteinGoal, setProteinGoal] = useState(user?.daily_protein_goal || 50);
  const [carbsGoal, setCarbsGoal] = useState(user?.daily_carbs_goal || 250);
  const [fatGoal, setFatGoal] = useState(user?.daily_fat_goal || 65);
  const [waterGoal, setWaterGoal] = useState(user?.daily_water_goal_ml || 2000);
  const [weight, setWeight] = useState('');

  const { data: templates } = useQuery({
    queryKey: ['templates'],
    queryFn: getTemplates,
  });

  const { data: recentWeight } = useQuery({
    queryKey: ['weightHistory'],
    queryFn: () => getWeightHistory(7),
  });

  useEffect(() => {
    if (recentWeight && recentWeight.length > 0) {
      setWeight(recentWeight[recentWeight.length - 1].weight.toString());
    }
  }, [recentWeight]);

  const updateMutation = useMutation({
    mutationFn: () =>
      updateMe({
        name,
        daily_calorie_goal: calorieGoal,
        daily_protein_goal: proteinGoal,
        daily_carbs_goal: carbsGoal,
        daily_fat_goal: fatGoal,
        daily_water_goal_ml: waterGoal,
      }),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ['dailySummary'] });
    },
  });

  const weightMutation = useMutation({
    mutationFn: () => logWeight(parseFloat(weight)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weightHistory'] });
    },
  });

  const deleteTmplMutation = useMutation({
    mutationFn: (id: number) => deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });

  const applyTmplMutation = useMutation({
    mutationFn: (id: number) => applyTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailySummary'] });
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
    if (weight) {
      weightMutation.mutate();
    }
  };

  return (
    <div className="space-y-6">
      <section className="bg-slate-800 rounded-xl p-5 border border-slate-700">
        <h2 className="text-lg font-bold text-amber-400 mb-4">Profile & Goals</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-slate-400 text-sm mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 text-sm mb-1">Calorie Goal (kcal)</label>
              <input
                type="number"
                value={calorieGoal}
                onChange={(e) => setCalorieGoal(parseInt(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-sm mb-1">Water Goal (ml)</label>
              <input
                type="number"
                value={waterGoal}
                onChange={(e) => setWaterGoal(parseInt(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="border-t border-slate-700 pt-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Macro Goals</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 text-xs mb-1">Protein (g)</label>
                <input
                  type="number"
                  value={proteinGoal}
                  onChange={(e) => setProteinGoal(parseFloat(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs mb-1">Carbs (g)</label>
                <input
                  type="number"
                  value={carbsGoal}
                  onChange={(e) => setCarbsGoal(parseFloat(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs mb-1">Fat (g)</label>
                <input
                  type="number"
                  value={fatGoal}
                  onChange={(e) => setFatGoal(parseFloat(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-700 pt-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Log Weight</h3>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Weight in kg"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-400"
              />
              <span className="flex items-center text-slate-400 text-sm">kg</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3 rounded-xl transition disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>

          {updateMutation.isSuccess && (
            <p className="text-emerald-400 text-sm text-center">Saved!</p>
          )}
        </form>
      </section>

      {/* Meal Templates */}
      <section className="bg-slate-800 rounded-xl p-5 border border-slate-700">
        <h2 className="text-lg font-bold text-amber-400 mb-4">Meal Templates</h2>
        {templates && templates.length > 0 ? (
          <div className="space-y-3">
            {templates.map((template: MealTemplate) => (
              <div
                key={template.id}
                className="bg-slate-900/60 rounded-lg p-3 border border-slate-700/50"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-slate-200">{template.name}</h4>
                    <p className="text-xs text-slate-400">
                      {template.meal_type} • {template.items.length} items
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {template.items.map((i) => i.food.name).join(', ')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => applyTmplMutation.mutate(template.id)}
                      disabled={applyTmplMutation.isPending}
                      className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded hover:bg-amber-500/30"
                    >
                      Apply
                    </button>
                    <button
                      onClick={() => deleteTmplMutation.mutate(template.id)}
                      className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm italic">
            No templates yet. Create one from the dashboard by saving a meal combination.
          </p>
        )}
      </section>

      {/* Account Info */}
      <section className="bg-slate-800 rounded-xl p-5 border border-slate-700">
        <h2 className="text-lg font-bold text-amber-400 mb-4">Account</h2>
        <div className="space-y-2 text-sm">
          <p className="text-slate-400">
            Email: <span className="text-slate-200">{user?.email}</span>
          </p>
          <p className="text-slate-400">
            Member since:{' '}
            <span className="text-slate-200">
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString()
                : 'Unknown'}
            </span>
          </p>
        </div>
      </section>
    </div>
  );
}
