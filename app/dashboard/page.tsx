'use client';

import { useState, useEffect } from 'react';
import {
  Activity, Heart, Brain, Utensils, Sun, Moon, 
  Droplet, Scale, TrendingUp, Calendar, AlertCircle,
  Zap, Apple, ActivitySquare, Coffee, Wind
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import SOSButton from '@/components/SOSButton';

interface HealthMetric {
  value: number;
  trend: 'up' | 'down' | 'stable';
  status: 'optimal' | 'warning' | 'alert';
  change?: number;
}

interface DailyRoutine {
  time: string;
  activity: string;
  duration: number;
  intensity: 'low' | 'medium' | 'high';
  category: 'exercise' | 'rest' | 'meal' | 'work';
}

interface NutritionLog {
  meal: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  time: string;
}

// Sample data - Replace with actual data from your backend
const healthMetrics = {
  biometrics: {
    heartRate: { current: 72, resting: 65, max: 165, variability: 45 },
    bloodPressure: { systolic: 120, diastolic: 80, map: 93.3 },
    respiratoryRate: { current: 16, rest: 14, exercise: 28 },
    oxygenSaturation: { current: 98, trend: 'stable' },
    temperature: { current: 98.6, trend: 'stable' },
  },
  sleep: {
    duration: 7.5,
    efficiency: 92,
    deepSleep: 1.8,
    remSleep: 2.1,
    lightSleep: 3.6,
    awakeTime: 0.2,
    cycles: 5,
  },
  stress: {
    current: 35,
    morning: 28,
    afternoon: 42,
    evening: 31,
    recovery: 85,
  },
  nutrition: {
    calories: { consumed: 2100, target: 2400, burned: 2650 },
    macros: { protein: 25, carbs: 55, fats: 20 },
    hydration: { current: 2100, target: 2800 },
    minerals: { sodium: 92, potassium: 88, magnesium: 75 },
  },
  activity: {
    steps: 8500,
    activeMinutes: 85,
    standingHours: 10,
    caloriesBurned: 550,
    exerciseSessions: 2,
  },
  biomarkers: {
    glucose: { fasting: 85, postPrandial: 110, average: 95 },
    cholesterol: { total: 180, hdl: 55, ldl: 110, triglycerides: 150 },
    cortisol: { morning: 15, evening: 5 },
    inflammation: { crp: 1.2, esr: 10 },
  }
};

const weeklyTrends = [
  { day: 'Mon', sleep: 7.2, stress: 42, activity: 75, nutrition: 85 },
  { day: 'Tue', sleep: 6.8, stress: 38, activity: 82, nutrition: 78 },
  { day: 'Wed', sleep: 7.5, stress: 35, activity: 68, nutrition: 90 },
  { day: 'Thu', sleep: 8.1, stress: 28, activity: 90, nutrition: 88 },
  { day: 'Fri', sleep: 7.8, stress: 45, activity: 65, nutrition: 82 },
  { day: 'Sat', sleep: 8.5, stress: 25, activity: 70, nutrition: 75 },
  { day: 'Sun', sleep: 7.9, stress: 30, activity: 85, nutrition: 85 },
];

const recommendedRoutine: DailyRoutine[] = [
  { time: '06:30', activity: 'Wake up & Hydration', duration: 15, intensity: 'low', category: 'rest' },
  { time: '07:00', activity: 'Morning Exercise', duration: 45, intensity: 'high', category: 'exercise' },
  { time: '08:00', activity: 'Breakfast', duration: 30, intensity: 'low', category: 'meal' },
  { time: '13:00', activity: 'Lunch & Short Walk', duration: 45, intensity: 'medium', category: 'meal' },
  { time: '16:00', activity: 'Meditation', duration: 20, intensity: 'low', category: 'rest' },
  { time: '19:00', activity: 'Light Dinner', duration: 30, intensity: 'low', category: 'meal' },
  { time: '22:00', activity: 'Sleep Preparation', duration: 30, intensity: 'low', category: 'rest' },
];

const weeklyMealPlan = {
  Monday: {
    breakfast: { meal: 'Oatmeal with berries and nuts', calories: 350, protein: 12, carbs: 45, fats: 15 },
    lunch: { meal: 'Quinoa bowl with grilled chicken', calories: 450, protein: 35, carbs: 40, fats: 15 },
    dinner: { meal: 'Baked salmon with vegetables', calories: 400, protein: 30, carbs: 25, fats: 20 },
    snacks: [
      { meal: 'Greek yogurt with honey', calories: 150, protein: 12, carbs: 15, fats: 5 },
      { meal: 'Mixed nuts', calories: 160, protein: 6, carbs: 8, fats: 14 }
    ]
  }
  // Add other days...
};

export default function Dashboard() {
  const [activeMetric, setActiveMetric] = useState('overview');
  const [timeRange, setTimeRange] = useState('day');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimal':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'alert':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const calculateHealthScore = () => {
    // Complex health score calculation based on multiple factors
    const sleepScore = (healthMetrics.sleep.efficiency / 100) * 25;
    const stressScore = ((100 - healthMetrics.stress.current) / 100) * 25;
    const nutritionScore = (healthMetrics.nutrition.calories.consumed / healthMetrics.nutrition.calories.target) * 25;
    const activityScore = (healthMetrics.activity.activeMinutes / 150) * 25;
    
    return (sleepScore + stressScore + nutritionScore + activityScore).toFixed(1);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header with Health Score */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Health Analytics Dashboard</h1>
          <p className="text-gray-500">Comprehensive health insights and recommendations</p>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 rounded-lg text-white">
          <div className="text-sm">Overall Health Score</div>
          <div className="text-3xl font-bold">{calculateHealthScore()}%</div>
        </div>
        <button
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 shadow-lg"
          onClick={() => {
            const sosButton = document.querySelector('[data-sos-button]');
            if (sosButton instanceof HTMLElement) {
              sosButton.click();
            }
          }}
        >
          <Activity className="h-5 w-5" />
          Emergency SOS
        </button>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(healthMetrics.biometrics).map(([key, data]: [string, any]) => (
          <div key={key} className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
              {key === 'heartRate' && <Heart className="h-5 w-5 text-red-500" />}
              {key === 'bloodPressure' && <Activity className="h-5 w-5 text-blue-500" />}
              {key === 'respiratoryRate' && <Wind className="h-5 w-5 text-green-500" />}
              {key === 'oxygenSaturation' && <Droplet className="h-5 w-5 text-blue-500" />}
            </div>
            <div className="flex items-baseline">
              <span className="text-2xl font-bold mr-2">
                {typeof data.current === 'number' ? data.current : `${data.systolic}/${data.diastolic}`}
              </span>
              <span className="text-sm text-gray-500">
                {key === 'heartRate' && 'bpm'}
                {key === 'bloodPressure' && 'mmHg'}
                {key === 'respiratoryRate' && 'br/min'}
                {key === 'oxygenSaturation' && '%'}
              </span>
            </div>
            {data.trend && (
              <span className={`text-sm ${data.trend === 'up' ? 'text-green-500' : data.trend === 'down' ? 'text-red-500' : 'text-gray-500'}`}>
                {data.trend === 'stable' ? 'Stable' : data.trend === 'up' ? '↑ Increasing' : '↓ Decreasing'}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Detailed Analysis Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sleep Analysis */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Sleep Analysis</h2>
            <Moon className="h-5 w-5 text-blue-500" />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold">{healthMetrics.sleep.duration}h</p>
                <p className="text-sm text-gray-500">Total Sleep</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{healthMetrics.sleep.efficiency}%</p>
                <p className="text-sm text-gray-500">Sleep Quality</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{healthMetrics.sleep.cycles}</p>
                <p className="text-sm text-gray-500">Sleep Cycles</p>
              </div>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Deep Sleep', value: healthMetrics.sleep.deepSleep },
                      { name: 'REM Sleep', value: healthMetrics.sleep.remSleep },
                      { name: 'Light Sleep', value: healthMetrics.sleep.lightSleep },
                      { name: 'Awake', value: healthMetrics.sleep.awakeTime },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                  >
                    <Cell fill="#4C51BF" />
                    <Cell fill="#6B46C1" />
                    <Cell fill="#9F7AEA" />
                    <Cell fill="#D6BCFA" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Stress & Recovery */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Stress & Recovery</h2>
            <Brain className="h-5 w-5 text-purple-500" />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold">{healthMetrics.stress.current}</p>
                <p className="text-sm text-gray-500">Current Stress</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{healthMetrics.stress.recovery}%</p>
                <p className="text-sm text-gray-500">Recovery Score</p>
              </div>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[
                  { time: 'Morning', stress: healthMetrics.stress.morning },
                  { time: 'Afternoon', stress: healthMetrics.stress.afternoon },
                  { time: 'Evening', stress: healthMetrics.stress.evening },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="stress" stroke="#9F7AEA" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Nutrition & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Nutrition Analysis</h2>
            <Utensils className="h-5 w-5 text-green-500" />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold">{healthMetrics.nutrition.calories.consumed}</p>
                <p className="text-sm text-gray-500">Calories Consumed</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{healthMetrics.nutrition.calories.burned}</p>
                <p className="text-sm text-gray-500">Calories Burned</p>
              </div>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Protein', value: healthMetrics.nutrition.macros.protein },
                  { name: 'Carbs', value: healthMetrics.nutrition.macros.carbs },
                  { name: 'Fats', value: healthMetrics.nutrition.macros.fats },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#48BB78" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Weekly Plan */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Personalized Recommendations</h2>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">Today's Focus Areas</h3>
              <ul className="space-y-2">
                <li className="flex items-center text-blue-700">
                  <Zap className="h-4 w-4 mr-2" />
                  Increase water intake by 500ml
                </li>
                <li className="flex items-center text-blue-700">
                  <ActivitySquare className="h-4 w-4 mr-2" />
                  Complete 30min cardio session
                </li>
                <li className="flex items-center text-blue-700">
                  <Apple className="h-4 w-4 mr-2" />
                  Add more protein to lunch
                </li>
                <li className="flex items-center text-blue-700">
                  <Coffee className="h-4 w-4 mr-2" />
                  Limit caffeine after 2 PM
                </li>
              </ul>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-800 mb-2">Weekly Goals Progress</h3>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-sm text-green-700">
                    <span>Exercise Goals</span>
                    <span>3/5 completed</span>
                  </div>
                  <div className="h-2 bg-green-200 rounded-full mt-1">
                    <div className="h-2 bg-green-500 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm text-green-700">
                    <span>Nutrition Goals</span>
                    <span>85% achieved</span>
                  </div>
                  <div className="h-2 bg-green-200 rounded-full mt-1">
                    <div className="h-2 bg-green-500 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI-Powered Insights */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">AI Health Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg">
            <h3 className="font-medium text-purple-800 mb-2">Pattern Analysis</h3>
            <p className="text-sm text-gray-600">
              Your stress levels tend to peak between 2-4 PM. Consider scheduling breaks or meditation sessions during this time.
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-2">Health Correlations</h3>
            <p className="text-sm text-gray-600">
              Your sleep quality improves by 23% on days with morning exercise sessions.
            </p>
          </div>
        </div>
      </div>
      <SOSButton />
    </div>
  );
}
