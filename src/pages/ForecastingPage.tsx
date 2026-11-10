import React, { useState } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { generateBuildingForecast } from '../engine/forecastingEngine';
import { generateMultiScaleForecast } from '../engine/multiScaleForecastingEngine';
import { ForecastTimeScale } from '../types';
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
  Compass,
  ArrowUpRight,
  ShieldAlert,
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
  BarChart,
  Bar,
} from 'recharts';

export const ForecastingPage: React.FC = () => {
  const { rooms, aggregates, simTimeMinutes, timetable, calendar, tariffs } = useSimulation();

  const [activeMainTab, setActiveMainTab] = useState<'hybrid_horizons' | 'multi_timescale'>('hybrid_horizons');
  const [activeHorizonTab, setActiveHorizonTab] = useState<'all' | '1h' | '6h' | '24h'>('all');
  const [activeTimeScale, setActiveTimeScale] = useState<ForecastTimeScale>('hourly');

  const baseHours = Math.floor((simTimeMinutes / 60) % 24);
  const baseMinutes = Math.floor(simTimeMinutes % 60);

  // Short-term hybrid forecast
  const shortTermForecast = generateBuildingForecast(
    rooms,
    aggregates.currentBuildingDemandKW,
    baseHours,
    baseMinutes
  );

  // Filter points based on selected view
  const displayPoints = shortTermForecast.points.filter((p) => {
    if (activeHorizonTab === '1h') return p.horizonMinutes <= 60;
    if (activeHorizonTab === '6h') return p.horizonMinutes <= 360;
    return true; // 24h
  });

  // Multi-Time-Scale forecast
  const multiScaleResult = generateMultiScaleForecast(
    activeTimeScale,
    rooms,
    aggregates.currentBuildingDemandKW,
    timetable,
    calendar,
    tariffs.energyTariffINRPerKWh,
    simTimeMinutes
  );

  return (
    <div className="space-y-6">
      {/* Mandatory Simulation Mode Banner */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl shadow-xs">
        <div className="flex items-center space-x-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="text-xs text-amber-900 font-semibold tracking-wide">
            SIMULATION MODE – ALL DATA IS MANUALLY ENTERED OR SOFTWARE-GENERATED. NO PHYSICAL SENSORS OR HARDWARE ARE CONNECTED.
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2.5">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span>AI Energy Demand Forecasting Engine</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Short-term autoregressive predictive modeling and multi-time-scale planning across hours, days, weeks, months, and years
          </p>
        </div>

        {/* Algorithm Badge */}
        <div className="flex items-center space-x-2 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl text-xs font-mono text-blue-800 font-semibold shadow-2xs">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>ALGORITHM: HYBRID XGBOOST + THERMODYNAMIC INERTIA</span>
        </div>
      </div>

      {/* Main View Mode Selector */}
      <div className="flex items-center space-x-2 border-b border-border-soft pb-2 text-xs font-mono">
        <button
          onClick={() => setActiveMainTab('hybrid_horizons')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            activeMainTab === 'hybrid_horizons'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Operational Horizons (15m – 24h Hybrid Model)
        </button>
        <button
          onClick={() => setActiveMainTab('multi_timescale')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            activeMainTab === 'multi_timescale'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Multi-Time-Scale AI Forecasts (24h / 7d / 4w / 12m / 5y)
        </button>
      </div>

      {/* VIEW 1: HYBRID HORIZONS (ORIGINAL ENHANCED) */}
      {activeMainTab === 'hybrid_horizons' && (
        <div className="space-y-6">
          {/* Multi-Horizon KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-xs">
            <div className="p-3 bg-white border border-border-soft rounded-xl shadow-xs">
              <div className="text-[10px] text-slate-500 font-semibold uppercase">NEXT 15 MIN</div>
              <div className="text-lg font-bold text-blue-700 mt-1">{shortTermForecast.horizons.next15mKW.toFixed(2)} kW</div>
              <div className="text-[10px] text-slate-400">Short-term ramp</div>
            </div>

            <div className="p-3 bg-white border border-border-soft rounded-xl shadow-xs">
              <div className="text-[10px] text-slate-500 font-semibold uppercase">NEXT 30 MIN</div>
              <div className="text-lg font-bold text-blue-700 mt-1">{shortTermForecast.horizons.next30mKW.toFixed(2)} kW</div>
              <div className="text-[10px] text-slate-400">Class transition</div>
            </div>

            <div className="p-3 bg-white border border-border-soft rounded-xl shadow-xs">
              <div className="text-[10px] text-slate-500 font-semibold uppercase">NEXT 1 HOUR</div>
              <div className="text-lg font-bold text-blue-700 mt-1">{shortTermForecast.horizons.next1hKW.toFixed(2)} kW</div>
              <div className="text-[10px] text-slate-400">Lab schedule sync</div>
            </div>

            <div className="p-3 bg-white border border-border-soft rounded-xl shadow-xs">
              <div className="text-[10px] text-amber-700 font-semibold uppercase">NEXT 6 HOURS</div>
              <div className="text-lg font-bold text-amber-700 mt-1">{shortTermForecast.horizons.next6hKW.toFixed(2)} kW</div>
              <div className="text-[10px] text-slate-400">Afternoon peak span</div>
            </div>

            <div className="p-3 bg-white border border-border-soft rounded-xl shadow-xs">
              <div className="text-[10px] text-indigo-700 font-semibold uppercase">NEXT 24 HOURS</div>
              <div className="text-lg font-bold text-indigo-700 mt-1">{shortTermForecast.horizons.next24hKW.toFixed(2)} kW</div>
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
              <div className="text-xl font-bold text-emerald-700">{shortTermForecast.metrics.mae} kW</div>
              <div className="text-[10px] text-slate-400">Test dataset residual avg</div>
            </div>

            <div className="p-4 bg-white border border-border-soft rounded-xl shadow-xs space-y-1">
              <span className="text-slate-500 text-[10px] font-semibold uppercase">ROOT MEAN SQUARE ERROR (RMSE)</span>
              <div className="text-xl font-bold text-blue-700">{shortTermForecast.metrics.rmse} kW</div>
              <div className="text-[10px] text-slate-400">Penalizes large outlier swings</div>
            </div>

            <div className="p-4 bg-white border border-border-soft rounded-xl shadow-xs space-y-1">
              <span className="text-slate-500 text-[10px] font-semibold uppercase">COEFFICIENT OF DETERMINATION (R²)</span>
              <div className="text-xl font-bold text-indigo-700">{shortTermForecast.metrics.r2Score}</div>
              <div className="text-[10px] text-slate-400">94.1% variance explained</div>
            </div>

            <div className="p-4 bg-white border border-border-soft rounded-xl shadow-xs space-y-1">
              <span className="text-slate-500 text-[10px] font-semibold uppercase">HYBRID ERROR REDUCTION</span>
              <div className="text-xl font-bold text-amber-700">+{shortTermForecast.metrics.hybridImprovementPct}%</div>
              <div className="text-[10px] text-slate-400">Improvement over physics-only</div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: MULTI-TIME-SCALE AI FORECASTS */}
      {activeMainTab === 'multi_timescale' && (
        <div className="space-y-6">
          {/* Time-Scale Switcher Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-border-soft shadow-xs">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold text-slate-700 uppercase">Select Time Horizon:</span>
            </div>

            <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl text-xs font-mono">
              {(
                [
                  { id: 'hourly', label: 'Hourly (24 Hours)' },
                  { id: 'daily', label: 'Daily (7 Days)' },
                  { id: 'weekly', label: 'Weekly (4 Weeks)' },
                  { id: 'monthly', label: 'Monthly (12 Months)' },
                  { id: 'yearly', label: 'Yearly (5 Years)' },
                ] as { id: ForecastTimeScale; label: string }[]
              ).map((scale) => (
                <button
                  key={scale.id}
                  onClick={() => setActiveTimeScale(scale.id)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    activeTimeScale === scale.id
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {scale.label}
                </button>
              ))}
            </div>
          </div>

          {/* Multi-Scale Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
            <div className="p-3.5 bg-white border border-border-soft rounded-xl shadow-xs space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">TOTAL FORECASTED ENERGY</span>
              <div className="text-xl font-bold text-indigo-700">
                {multiScaleResult.totalEnergyKWh.toLocaleString()} kWh
              </div>
              <div className="text-[10px] text-slate-400">Across {multiScaleResult.slots.length} time slots</div>
            </div>

            <div className="p-3.5 bg-white border border-border-soft rounded-xl shadow-xs space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">ESTIMATED ELECTRICITY COST</span>
              <div className="text-xl font-bold text-emerald-700">₹ {multiScaleResult.totalCostINR.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400">At ₹{tariffs.energyTariffINRPerKWh.toFixed(2)}/kWh</div>
            </div>

            <div className="p-3.5 bg-white border border-border-soft rounded-xl shadow-xs space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">PREDICTED PEAK DEMAND</span>
              <div className="text-xl font-bold text-amber-700">{multiScaleResult.overallPeakKW.toFixed(2)} kW</div>
              <div className="text-[10px] text-slate-400">Occurs at: {multiScaleResult.overallPeakTime}</div>
            </div>

            <div className="p-3.5 bg-white border border-border-soft rounded-xl shadow-xs space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">CONFIDENCE ENVELOPE</span>
              <div className="text-xl font-bold text-blue-700">95% Interval</div>
              <div className="text-[10px] text-slate-400">Autoregressive error bounds</div>
            </div>
          </div>

          {/* Multi-Scale Forecast Chart with Upper/Lower Confidence Envelopes */}
          <div className="bg-white border border-border-soft rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base capitalize flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span>
                    {activeTimeScale} Horizon Demand Profile & Peak Bounds
                  </span>
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Expected demand curve (kW) bounded by 95% statistical upper and lower confidence intervals
                </p>
              </div>
            </div>

            <div className="h-80 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={multiScaleResult.slots} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11, fontFamily: 'monospace' }} unit=" kW" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '8px',
                      fontFamily: 'monospace',
                      fontSize: '12px',
                    }}
                    formatter={(val: any, name: string) => [`${val} kW`, name]}
                  />
                  <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: '11px', paddingTop: '10px' }} />
                  <Area
                    type="monotone"
                    dataKey="upperBoundKW"
                    stroke="#94a3b8"
                    strokeDasharray="3 3"
                    fill="url(#colorConfidence)"
                    name="Upper Bound (95% CI)"
                  />
                  <Area
                    type="monotone"
                    dataKey="expectedDemandKW"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    fillOpacity={0}
                    name="Expected Demand (kW)"
                  />
                  <Line
                    type="monotone"
                    dataKey="lowerBoundKW"
                    stroke="#94a3b8"
                    strokeDasharray="3 3"
                    dot={false}
                    name="Lower Bound (95% CI)"
                  />
                  <Line
                    type="monotone"
                    dataKey="peakDemandKW"
                    stroke="#f59e0b"
                    strokeWidth={1.8}
                    dot={{ r: 3, fill: '#f59e0b' }}
                    name="Peak Demand Slot (kW)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Forecast Schedule Table */}
          <div className="bg-white border border-border-soft rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-border-soft flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Forecasted Slots Breakdown</h4>
                <p className="text-[11px] text-slate-500 font-mono">
                  Detailed load, energy, cost, and occupancy estimates across horizon intervals
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500 bg-white px-2.5 py-1 rounded border border-border-soft">
                {multiScaleResult.slots.length} Intervals
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] tracking-wider border-b border-border-soft">
                  <tr>
                    <th className="py-2.5 px-3">Slot / Label</th>
                    <th className="py-2.5 px-3">Description / Timestamp</th>
                    <th className="py-2.5 px-3 text-right">Expected (kW)</th>
                    <th className="py-2.5 px-3 text-right">Peak (kW)</th>
                    <th className="py-2.5 px-3 text-right">Energy (kWh)</th>
                    <th className="py-2.5 px-3 text-right">Estimated Cost (₹)</th>
                    <th className="py-2.5 px-3 text-center">Occupants</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-soft">
                  {multiScaleResult.slots.map((slot, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-slate-50 transition-colors ${
                        slot.isPeakSlot ? 'bg-amber-50/40 font-semibold' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-bold text-slate-800">{slot.label}</td>
                      <td className="py-2.5 px-3 text-slate-600">{slot.timestamp}</td>
                      <td className="py-2.5 px-3 text-right text-blue-700 font-bold">{slot.expectedDemandKW}</td>
                      <td className="py-2.5 px-3 text-right text-amber-700">{slot.peakDemandKW}</td>
                      <td className="py-2.5 px-3 text-right text-slate-800">{slot.energyKWh.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right text-emerald-700">₹ {slot.costINR.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-center text-slate-600">
                        {slot.occupancyCount !== undefined ? slot.occupancyCount : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {slot.isPeakSlot ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            PEAK SLOT
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                            Normal
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Model Assumptions & Notes */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-border-soft space-y-2 font-mono text-xs text-slate-700">
            <div className="flex items-center space-x-2 font-bold text-slate-900">
              <Info className="w-4 h-4 text-blue-600" />
              <span>Predictive Methodology & Horizon Assumptions:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600">
              {multiScaleResult.modelNotes.map((note, idx) => (
                <li key={idx}>{note}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
