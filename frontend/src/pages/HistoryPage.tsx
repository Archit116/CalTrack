import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, addDays } from 'date-fns';
import { getDailySummary, getWeeklySummary, getWeightHistory } from '../api/client';
import { useAuthStore } from '../stores/authStore';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { MealLog } from '../types';

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'] as const;

export default function HistoryPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const user = useAuthStore((state) => state.user);

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const { data: summary } = useQuery({
    queryKey: ['dailySummary', dateStr],
    queryFn: () => getDailySummary(dateStr),
  });

  const { data: weekly } = useQuery({
    queryKey: ['weeklySummary'],
    queryFn: () => getWeeklySummary(),
  });

  const { data: weightHistory } = useQuery({
    queryKey: ['weightHistory'],
    queryFn: () => getWeightHistory(30),
  });

  const goToPrevDay = () => setSelectedDate(subDays(selectedDate, 1));
  const goToNextDay = () => setSelectedDate(addDays(selectedDate, 1));

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="space-y-6">
      {/* Date Navigator */}
      <section className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <div className="flex items-center justify-between">
          <button
            onClick={goToPrevDay}
            className="text-slate-400 hover:text-white p-2"
          >
            ←
          </button>
          <div className="text-center">
            <p className="text-lg font-bold text-slate-100">
              {isToday ? 'Today' : format(selectedDate, 'EEEE')}
            </p>
            <p className="text-sm text-slate-400">{format(selectedDate, 'MMMM d, yyyy')}</p>
          </div>
          <button
            onClick={goToNextDay}
            disabled={isToday}
            className="text-slate-400 hover:text-white p-2 disabled:opacity-30"
          >
            →
          </button>
        </div>
      </section>

      {/* Daily Summary */}
      {summary && (
        <section className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <h3 className="font-bold text-slate-200 mb-3">Daily Summary</h3>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-slate-900/60 p-2 rounded-lg">
              <span className="text-xs text-slate-400 block">Calories</span>
              <span className="text-sm font-bold text-amber-400">{summary.total_calories}</span>
            </div>
            <div className="bg-slate-900/60 p-2 rounded-lg">
              <span className="text-xs text-slate-400 block">Protein</span>
              <span className="text-sm font-bold text-emerald-400">{summary.total_protein}g</span>
            </div>
            <div className="bg-slate-900/60 p-2 rounded-lg">
              <span className="text-xs text-slate-400 block">Carbs</span>
              <span className="text-sm font-bold text-sky-400">{summary.total_carbs}g</span>
            </div>
            <div className="bg-slate-900/60 p-2 rounded-lg">
              <span className="text-xs text-slate-400 block">Fat</span>
              <span className="text-sm font-bold text-rose-400">{summary.total_fat}g</span>
            </div>
          </div>

          {/* Meals for this day */}
          <div className="mt-4 space-y-2">
            {MEAL_TYPES.map((mealType) => {
              const meals = summary.meals_by_type[mealType] || [];
              if (meals.length === 0) return null;

              return (
                <div key={mealType} className="text-sm">
                  <span className="text-slate-400 font-medium">{mealType}:</span>
                  <span className="text-slate-300 ml-2">
                    {meals.map((m: MealLog) => m.food.name).join(', ')}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Weekly Chart */}
      {weekly && (
        <section className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <h3 className="font-bold text-slate-200 mb-3">Last 7 Days</h3>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={weekly.days}>
              <XAxis
                dataKey="date"
                tickFormatter={(d) => format(new Date(d), 'EEE')}
                stroke="#64748b"
                fontSize={12}
              />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155' }}
                labelFormatter={(d) => format(new Date(String(d)), 'MMM d')}
              />
              <Line
                type="monotone"
                dataKey="calories"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ fill: '#f59e0b' }}
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-slate-400 text-center mt-2">
            Goal: {user?.daily_calorie_goal || 2000} kcal/day
          </p>
        </section>
      )}

      {/* Weight Chart */}
      {weightHistory && weightHistory.length > 0 && (
        <section className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <h3 className="font-bold text-slate-200 mb-3">Weight Trend (30 days)</h3>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={weightHistory}>
              <XAxis
                dataKey="logged_at"
                tickFormatter={(d) => format(new Date(d), 'M/d')}
                stroke="#64748b"
                fontSize={12}
              />
              <YAxis stroke="#64748b" fontSize={12} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155' }}
                labelFormatter={(d) => format(new Date(String(d)), 'MMM d')}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ fill: '#22c55e' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </section>
      )}
    </div>
  );
}
