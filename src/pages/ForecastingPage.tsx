import React, { useState } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { generateBuildingForecast } from '../engine/forecastingEngine';
import {
  TrendingUp,
  Clock,
  Zap,
  Activity,
  Layers,
  Sparkles,
  Info,
  CheckCircle,
  BarChart2,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';

export const ForecastingPage: React.FC = () => {
  const { rooms, aggregates, simTimeMinutes } = useSimulation();

  const [activeHorizonTab, setActiveHorizonTab] = useState<'all' | '1h' | '6h' | '24h'>('all');

  const baseHours = Math.floor((simTimeMinutes / 60) % 24);
  const baseMinutes = Math.floor(simTimeMinutes % 60);

  const forecast = generateBuildingForecast(rooms, aggregates.currentBuildingDemandKW, baseHours, baseMinutes);

  // Filter points based on selected view
  const displayPoints = forecast.points.filter((p) => {
    if (activeHorizonTab === '1h') return p.horizonMinutes <= 60;
    if (activeHorizonTab === '6h') return p.horizonMinutes <= 360;
    return true; // 24h
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2.5">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span>AI Energy Demand Forecasting Engine</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Short-term autoregressive predictive modeling across 15m, 30m, 1h, 6h, and 24h operational horizons
          </p>
        </div>

        {/* Algorithm Badge */}
        <div className="flex items-center space-x-2 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl text-xs font-mono text-blue-800 font-semibold shadow-2xs">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>ALGORITHM: HYBRID XGBOOST + THERMODYNAMIC INERTIA</span>
        </div>
      </div>

      {/* Multi-Horizon KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-xs">
        <div className="p-3 bg-white border border-border-soft rounded-xl shadow-xs">
          <div className="text-[10px] text-slate-500 font-semibold uppercase">NEXT 15 MIN</div>
          <div className="text-lg font-bold text-blue-700 mt-1">{forecast.horizons.next15mKW.toFixed(2)} kW</div>
          <div className="text-[10px] text-slate-400">Short-term ramp</div>
        </div>

        <div className="p-3 bg-white border border-border-soft rounded-xl shadow-xs">
          <div className="text-[10px] text-slate-500 font-semibold uppercase">NEXT 30 MIN</div>
          <div className="text-lg font-bold text-blue-700 mt-1">{forecast.horizons.next30mKW.toFixed(2)} kW</div>
          <div className="text-[10px] text-slate-400">Class transition</div>
        </div>

        <div className="p-3 bg-white border border-border-soft rounded-xl shadow-xs">
          <div className="text-[10px] text-slate-500 font-semibold uppercase">NEXT 1 HOUR</div>
          <div className="text-lg font-bold text-blue-700 mt-1">{forecast.horizons.next1hKW.toFixed(2)} kW</div>
          <div className="text-[10px] text-slate-400">Lab schedule sync</div>
        </div>

        <div className="p-3 bg-white border border-border-soft rounded-xl shadow-xs">
          <div className="text-[10px] text-amber-700 font-semibold uppercase">NEXT 6 HOURS</div>
          <div className="text-lg font-bold text-amber-700 mt-1">{forecast.horizons.next6hKW.toFixed(2)} kW</div>
          <div className="text-[10px] text-slate-400">Afternoon peak span</div>
        </div>

        <div className="p-3 bg-white border border-border-soft rounded-xl shadow-xs">
          <div className="text-[10px] text-indigo-700 font-semibold uppercase">NEXT 24 HOURS</div>
          <div className="text-lg font-bold text-indigo-700 mt-1">{forecast.horizons.next24hKW.toFixed(2)} kW</div>
          <div className="text-[10px] text-slate-400">Diurnal cycle</div>
        </div>
      </div>

      {/* Main Forecast Chart: Actual vs Physics vs ML vs Hybrid */}
      <div className="bg-white border border-border-soft rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-y-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <span>Multi-Model Comparative Demand Forecast</span>
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Evaluating: (1) Pure Physics Baseline, (2) ML Statistical Regression, (3) Hybrid Physics-Informed Predictor
            </p>
          </div>

          {/* Horizon Zoom Selector */}
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl border border-border-soft text-xs font-mono">
            <button
              onClick={() => setActiveHorizonTab('1h')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeHorizonTab === '1h' ? 'bg-white text-blue-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1-Hour
            </button>
            <button
              onClick={() => setActiveHorizonTab('6h')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeHorizonTab === '6h' ? 'bg-white text-blue-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              6-Hours
            </button>
            <button
              onClick={() => setActiveHorizonTab('24h')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeHorizonTab === '24h' || activeHorizonTab === 'all'
                  ? 'bg-white text-blue-700 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              24-Hours
            </button>
          </div>
        </div>

        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={displayPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorHybrid" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="timeLabel" stroke="#64748b" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11, fontFamily: 'monospace' }} unit=" kW" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '8px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: '11px', paddingTop: '10px' }} />
              <Area
                type="monotone"
                dataKey="hybridKW"
                stroke="#1d4ed8"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorHybrid)"
                name="3. Hybrid Physics-Informed (kW)"
              />
              <Line
                type="monotone"
                dataKey="mlKW"
                stroke="#9333ea"
                strokeWidth={1.8}
                strokeDasharray="4 4"
                dot={false}
                name="2. ML Regression Only (kW)"
              />
              <Line
                type="monotone"
                dataKey="physicsKW"
                stroke="#64748b"
                strokeWidth={1.8}
                strokeDasharray="2 2"
                dot={false}
                name="1. Physics Only (kW)"
              />
              <Line
                type="monotone"
                dataKey="actualKW"
                stroke="#16a34a"
                strokeWidth={2}
                dot={{ r: 3, fill: '#16a34a' }}
                name="Ground Truth Actual (kW)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Accuracy & Validation Metrics Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono text-xs">
        <div className="p-4 bg-white border border-border-soft rounded-xl shadow-xs space-y-1">
          <span className="text-slate-500 text-[10px] font-semibold uppercase">MEAN ABSOLUTE ERROR (MAE)</span>
          <div className="text-xl font-bold text-emerald-700">{forecast.metrics.mae} kW</div>
          <div className="text-[10px] text-slate-400">Test dataset residual avg</div>
        </div>

        <div className="p-4 bg-white border border-border-soft rounded-xl shadow-xs space-y-1">
          <span className="text-slate-500 text-[10px] font-semibold uppercase">ROOT MEAN SQUARE ERROR (RMSE)</span>
          <div className="text-xl font-bold text-blue-700">{forecast.metrics.rmse} kW</div>
          <div className="text-[10px] text-slate-400">Penalizes large outlier swings</div>
        </div>

        <div className="p-4 bg-white border border-border-soft rounded-xl shadow-xs space-y-1">
          <span className="text-slate-500 text-[10px] font-semibold uppercase">COEFFICIENT OF DETERMINATION (R²)</span>
          <div className="text-xl font-bold text-indigo-700">{forecast.metrics.r2Score}</div>
          <div className="text-[10px] text-slate-400">94.1% variance explained</div>
        </div>

        <div className="p-4 bg-white border border-border-soft rounded-xl shadow-xs space-y-1">
          <span className="text-slate-500 text-[10px] font-semibold uppercase">HYBRID ERROR REDUCTION</span>
          <div className="text-xl font-bold text-amber-700">+{forecast.metrics.hybridImprovementPct}%</div>
          <div className="text-[10px] text-slate-400">Improvement over physics-only</div>
        </div>
      </div>
    </div>
  );
};
