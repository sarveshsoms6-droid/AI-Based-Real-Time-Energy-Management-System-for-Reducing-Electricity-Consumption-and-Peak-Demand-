import React, { useState } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { computePeakDemandOptimization } from '../engine/optimizationEngine';
import {
  Sparkles,
  Zap,
  TrendingDown,
  DollarSign,
  Leaf,
  ShieldCheck,
  CheckCircle,
  Clock,
  ArrowRight,
  Info,
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

export const PeakOptimizationPage: React.FC = () => {
  const { rooms, aggregates, tariffs } = useSimulation();

  const [peakStartHour, setPeakStartHour] = useState<number>(11);
  const [peakEndHour, setPeakEndHour] = useState<number>(15);

  const optimization = computePeakDemandOptimization(
    rooms,
    aggregates.currentBuildingDemandKW,
    tariffs,
    peakStartHour,
    peakEndHour
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2.5">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <span>Peak Demand Optimization & Load Scheduling</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Linear Programming load shifting algorithm minimizing daily tariff expense and peak maximum demand billing
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl text-xs font-mono text-blue-800 font-semibold shadow-2xs">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>NON-FLEXIBLE PEDAGOGICAL LOADS PRESERVED</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 font-mono text-xs">
        <div className="p-3.5 bg-white border border-border-soft rounded-xl shadow-xs space-y-1">
          <span className="text-[10px] text-slate-500 font-semibold uppercase">ORIGINAL PEAK</span>
          <div className="text-lg font-bold text-rose-700">{optimization.originalPeakKW} kW</div>
          <div className="text-[10px] text-slate-400">Uncontrolled Max</div>
        </div>

        <div className="p-3.5 bg-white border border-blue-200 rounded-xl shadow-xs space-y-1">
          <span className="text-[10px] text-blue-700 font-semibold uppercase">OPTIMIZED PEAK</span>
          <div className="text-lg font-bold text-blue-800">{optimization.optimizedPeakKW} kW</div>
          <div className="text-[10px] text-slate-400">Shaved Target</div>
        </div>

        <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-xl shadow-xs space-y-1">
          <span className="text-[10px] text-emerald-800 font-semibold uppercase">PEAK REDUCTION</span>
          <div className="text-lg font-bold text-emerald-700">
            {optimization.peakReductionKW} kW{' '}
            <span className="text-xs font-normal">(-{optimization.peakReductionPct}%)</span>
          </div>
          <div className="text-[10px] text-slate-500">Capacity shaved</div>
        </div>

        <div className="p-3.5 bg-white border border-border-soft rounded-xl shadow-xs space-y-1">
          <span className="text-[10px] text-slate-500 font-semibold uppercase">ORIGINAL COST</span>
          <div className="text-lg font-bold text-slate-800">₹{optimization.originalCostINR.toLocaleString()}</div>
          <div className="text-[10px] text-slate-400">Daily baseline</div>
        </div>

        <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-xl shadow-xs space-y-1">
          <span className="text-[10px] text-emerald-800 font-semibold uppercase">EST. SAVINGS</span>
          <div className="text-lg font-bold text-emerald-700">₹{optimization.costSavingINR.toLocaleString()} / day</div>
          <div className="text-[10px] text-slate-500">Energy + Demand Charge</div>
        </div>

        <div className="p-3.5 bg-white border border-border-soft rounded-xl shadow-xs space-y-1">
          <span className="text-[10px] text-emerald-800 font-semibold uppercase">CARBON SHAVED</span>
          <div className="text-lg font-bold text-emerald-700">{optimization.carbonSavedKg} kg</div>
          <div className="text-[10px] text-slate-400">Daily CO₂ Avoided</div>
        </div>
      </div>

      {/* Main Load Shifting Curve (Original vs Optimized) */}
      <div className="bg-white border border-border-soft rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-y-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
              <Zap className="w-4 h-4 text-blue-600" />
              <span>Original vs Optimized Building Load Curve (24-Hour Diurnal Schedule)</span>
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Highlighting pre-cooling charge (08:30-10:00) and peak demand shaving window (11:00-15:00)
            </p>
          </div>

          <div className="flex items-center space-x-4 text-xs font-mono">
            <span className="flex items-center space-x-1.5 text-rose-600 font-semibold">
              <span className="w-3 h-0.5 bg-rose-500 inline-block" />
              <span>Original Curve</span>
            </span>
            <span className="flex items-center space-x-1.5 text-blue-700 font-bold">
              <span className="w-3 h-1 bg-blue-600 inline-block" />
              <span>Optimized Curve</span>
            </span>
          </div>
        </div>

        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={optimization.schedule} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorOpt" x1="0" y1="0" x2="0" y2="1">
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
              <Area
                type="monotone"
                dataKey="optimizedDemandKW"
                stroke="#1d4ed8"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorOpt)"
                name="Optimized Demand (kW)"
              />
              <Line
                type="monotone"
                dataKey="originalDemandKW"
                stroke="#e11d48"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
                name="Original Demand (kW)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Applied Recommendations List */}
      <div className="bg-white border border-border-soft rounded-2xl p-6 shadow-xs space-y-4 font-mono text-xs">
        <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>Active Peak Load Scheduling Recommendations</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {optimization.appliedRecommendations.map((rec, idx) => (
            <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-border-soft flex items-start space-x-3">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center flex-shrink-0 text-[11px] mt-0.5">
                {idx + 1}
              </span>
              <p className="text-slate-700 leading-relaxed">{rec}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Advisory Notice */}
      <div className="p-4 bg-slate-50 border border-border-soft rounded-xl text-xs font-mono text-slate-600 flex items-start space-x-3">
        <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <b>SIMULATED SCHEDULING NOTICE:</b> Recommendations and schedules are provided for simulation and decision-support
          demonstration. No actual physical electrical interlocks or physical relays are triggered in this stage.
        </p>
      </div>
    </div>
  );
};
