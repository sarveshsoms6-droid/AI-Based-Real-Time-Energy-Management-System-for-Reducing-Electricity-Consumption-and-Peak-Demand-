import React, { useState } from 'react';
import { useSimulation } from '../context/SimulationContext';
import {
  CircuitLabPIRState,
  ACIntelligentRecommendation,
  EnergyManagementRecommendation,
  ManagementCategory,
} from '../types';
import {
  Sliders,
  ShieldAlert,
  Zap,
  TrendingDown,
  Thermometer,
  Users,
  CheckCircle,
  XCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Layers,
  AlertTriangle,
  Lightbulb,
  Fan,
  Monitor,
  Activity,
  Cpu,
  Clock,
  Compass,
  Check,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export const EnergyManagementPage: React.FC = () => {
  const {
    rooms,
    aggregates,
    tariffs,
    circuitLabPIRStates,
    updateCircuitLabPIR,
    acRecommendations,
    acceptACRecommendation,
    rejectACRecommendation,
    managementRecommendations,
    acceptedManagementActionIds,
    acceptManagementAction,
    rejectManagementAction,
    resetManagementActions,
    beforeAfterComparison,
    simTimeString,
  } = useSimulation();

  const [selectedLabId, setSelectedLabId] = useState<'ca_lab1' | 'ca_lab2'>('ca_lab1');
  const [manualCountInput, setManualCountInput] = useState<number>(() => circuitLabPIRStates['ca_lab1'].occupantCount);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const activePIR = circuitLabPIRStates[selectedLabId];
  const activeRec = acRecommendations[selectedLabId];
  const targetRoom = rooms.find((r) => r.id === selectedLabId);

  const handleLabChange = (labId: 'ca_lab1' | 'ca_lab2') => {
    setSelectedLabId(labId);
    setManualCountInput(circuitLabPIRStates[labId].occupantCount);
  };

  const handleApplyPIR = () => {
    updateCircuitLabPIR(selectedLabId, manualCountInput);
    setFeedbackMsg(`Updated ${activePIR.roomName} simulated PIR count to ${manualCountInput} occupants.`);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleAcceptAC = () => {
    acceptACRecommendation(selectedLabId);
    setFeedbackMsg(`Applied recommended ${activeRec.recommendedSetpoint}°C setpoint to ${activePIR.roomName}.`);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const filteredManagementRecs = managementRecommendations.filter((r) => {
    if (selectedCategoryFilter === 'all') return true;
    return r.category === selectedCategoryFilter;
  });

  const CATEGORY_ICONS: Record<ManagementCategory, React.ElementType> = {
    lighting: Lightbulb,
    fan: Fan,
    ac: Thermometer,
    computers: Monitor,
    peak: Activity,
    planning: Compass,
  };

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
            <Sliders className="w-5 h-5 text-blue-600" />
            <span>AI Energy Management & Action Centre</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Dynamic load supervision, simulated PIR occupancy coupling, thermal comfort optimization, and real-time supervisory control
          </p>
        </div>

        {/* Global Action Reset */}
        <div className="flex items-center space-x-3">
          {feedbackMsg && (
            <span className="text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 font-mono font-medium animate-pulse">
              ✓ {feedbackMsg}
            </span>
          )}
          <button
            onClick={resetManagementActions}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono font-medium rounded-lg border border-border-soft transition-all"
            title="Reset all active management actions to baseline state"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Actions</span>
          </button>
        </div>
      </div>

      {/* Action Centre Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
        <div className="p-3.5 bg-white border border-border-soft rounded-xl shadow-xs space-y-1">
          <div className="text-[10px] text-slate-500 font-semibold uppercase flex items-center justify-between">
            <span>CURRENT DEMAND</span>
            <Zap className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">{aggregates.currentBuildingDemandKW.toFixed(2)} kW</div>
          <div className="text-[10px] text-slate-400">Operating building load</div>
        </div>

        <div className="p-3.5 bg-white border border-border-soft rounded-xl shadow-xs space-y-1">
          <div className="text-[10px] text-slate-500 font-semibold uppercase flex items-center justify-between">
            <span>FORECASTED PEAK</span>
            <Activity className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-amber-700">{aggregates.predictedPeakDemandKW.toFixed(2)} kW</div>
          <div className="text-[10px] text-slate-400">Peak window ~{aggregates.predictedPeakTime}</div>
        </div>

        <div className="p-3.5 bg-white border border-border-soft rounded-xl shadow-xs space-y-1">
          <div className="text-[10px] text-slate-500 font-semibold uppercase flex items-center justify-between">
            <span>ACTIVE ACTIONS APPLIED</span>
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-700">
            {acceptedManagementActionIds.length} / {managementRecommendations.length}
          </div>
          <div className="text-[10px] text-slate-400">Management interventions</div>
        </div>

        <div className="p-3.5 bg-white border border-savings/30 bg-savings-light rounded-xl shadow-xs space-y-1">
          <div className="text-[10px] text-savings font-semibold uppercase flex items-center justify-between">
            <span>DEMAND REDUCTION</span>
            <TrendingDown className="w-3.5 h-3.5 text-savings" />
          </div>
          <div className="text-xl font-bold text-savings">
            -{beforeAfterComparison.demandReductionKW.toFixed(2)} kW ({beforeAfterComparison.percentageReduction}%)
          </div>
          <div className="text-[10px] text-savings font-medium">
            Saving ₹ {beforeAfterComparison.annualCostSavingsINR.toLocaleString()} / yr
          </div>
        </div>
      </div>

      {/* SECTION 1: SIMULATED PIR OCCUPANCY & INTELLIGENT AC MANAGEMENT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Simulated PIR Controls for Circuit Analysis Labs */}
        <div className="lg:col-span-6 bg-white border border-border-soft rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-soft pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Simulated PIR Occupancy Sensor Console</span>
              </h3>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                Targeted laboratory occupancy tracking for Circuit Analysis Labs
              </p>
            </div>

            {/* Lab Switcher Tabs */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-mono">
              <button
                onClick={() => handleLabChange('ca_lab1')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  selectedLabId === 'ca_lab1' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                CA Lab F1
              </button>
              <button
                onClick={() => handleLabChange('ca_lab2')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  selectedLabId === 'ca_lab2' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                CA Lab F2
              </button>
            </div>
          </div>

          {/* Targeted PIR Disclaimer Badge */}
          <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900 font-mono flex items-center space-x-2.5">
            <ShieldAlert className="w-4 h-4 text-blue-700 shrink-0" />
            <span className="font-semibold text-[11px]">
              SIMULATED PIR OCCUPANCY – OCCUPANT COUNT IS MANUALLY ENTERED. NO PIR SENSOR IS CONNECTED.
            </span>
          </div>

          {/* Current Occupancy Status Header */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-border-soft font-mono">
            <div>
              <span className="text-[10px] text-slate-400 uppercase">Monitored Space</span>
              <div className="font-bold text-slate-900 text-sm">{activePIR.roomName}</div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase">Occupancy Status</span>
              <div>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-xs ${
                    activePIR.statusLevel === 'Empty'
                      ? 'bg-slate-200 text-slate-700'
                      : activePIR.statusLevel === 'Low'
                      ? 'bg-emerald-100 text-emerald-800'
                      : activePIR.statusLevel === 'Moderate'
                      ? 'bg-blue-100 text-blue-800'
                      : activePIR.statusLevel === 'High'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {activePIR.statusLevel} ({activePIR.occupantCount} / {activePIR.maxCapacity})
                </span>
              </div>
            </div>
          </div>

          {/* Occupancy Slider & Input */}
          <div className="space-y-2 font-mono text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span className="font-semibold">Simulated Occupant Count:</span>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="0"
                  max="40"
                  value={manualCountInput}
                  onChange={(e) => setManualCountInput(Math.max(0, Math.min(40, parseInt(e.target.value, 10) || 0)))}
                  className="w-16 text-center font-bold text-sm bg-white border border-border-soft rounded-lg py-1 text-slate-900"
                />
                <span className="text-slate-400">/ 40 max</span>
              </div>
            </div>

            <input
              type="range"
              min="0"
              max="40"
              value={manualCountInput}
              onChange={(e) => setManualCountInput(parseInt(e.target.value, 10))}
              className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
            />

            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0 (Empty)</span>
              <span>10 (Low)</span>
              <span>25 (Moderate)</span>
              <span>35 (High)</span>
              <span>40 (Full Capacity)</span>
            </div>
          </div>

          {/* Apply Button */}
          <button
            onClick={handleApplyPIR}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-mono text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center space-x-2"
          >
            <Users className="w-4 h-4" />
            <span>Apply to Simulation & Update Thermal Load</span>
          </button>

          {/* Mini Hourly Schedule Chart */}
          <div className="space-y-2 pt-2 border-t border-border-soft">
            <div className="flex items-center justify-between text-xs font-mono text-slate-500">
              <span>Scheduled Lab Occupancy Profile (08:00 – 16:00)</span>
              <Clock className="w-3.5 h-3.5 text-slate-400" />
            </div>

            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activePIR.hourlySchedule} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="hour"
                    stroke="#94a3b8"
                    tick={{ fontSize: 10, fontFamily: 'monospace' }}
                    tickFormatter={(h) => `${h}:00`}
                  />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                    }}
                    formatter={(val: any) => [`${val} Persons`, 'Expected Occupancy']}
                    labelFormatter={(h) => `${h}:00 Slot`}
                  />
                  <Bar dataKey="expectedOccupancy" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right: Occupancy-Aware Intelligent AC Temperature Recommendation */}
        <div className="lg:col-span-6 bg-white border border-border-soft rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-border-soft pb-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                  <Thermometer className="w-4 h-4 text-emerald-600" />
                  <span>Occupancy-Aware Intelligent AC Recommendation</span>
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                  COMFORT: 24.0°C – 26.0°C
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                Real-time thermodynamic coupling of PIR occupancy, ambient conditions, and ASHRAE 55 comfort standard
              </p>
            </div>

            {/* Current vs Recommended Setpoint Display */}
            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div className="p-3 bg-slate-50 border border-border-soft rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 uppercase">Current Indoor Temp</span>
                <div className="text-xl font-bold text-slate-900">{activeRec.currentIndoorTemp}°C</div>
                <div className="text-[10px] text-slate-500">
                  Target Setpoint: <span className="font-bold">{activeRec.currentSetpoint}°C</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                <span className="text-[10px] text-emerald-700 font-bold uppercase">AI Recommended Setpoint</span>
                <div className="text-xl font-bold text-emerald-700">{activeRec.recommendedSetpoint}°C</div>
                <div className="text-[10px] text-emerald-800">
                  Mode: <span className="font-bold">{activeRec.recommendedMode}</span>
                </div>
              </div>
            </div>

            {/* Environmental Coupling Telemetry */}
            <div className="grid grid-cols-3 gap-2 font-mono text-[11px] p-2.5 bg-slate-50 rounded-xl border border-border-soft text-slate-600">
              <div>
                <span className="text-slate-400 block text-[10px]">PIR OCCUPANCY</span>
                <span className="font-bold text-slate-900">{activeRec.occupantCount} Students</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">OUTDOOR AMBIENT</span>
                <span className="font-bold text-slate-900">{activeRec.ambientTemp}°C</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">RELATIVE HUMIDITY</span>
                <span className="font-bold text-slate-900">{activeRec.humidityPct}% RH</span>
              </div>
            </div>

            {/* Engineering Reason Card */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-border-soft text-xs space-y-1">
              <span className="font-mono text-[10px] font-bold uppercase text-slate-500 flex items-center space-x-1.5">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Decision Logic & Thermodynamic Reason</span>
              </span>
              <p className="text-slate-700 leading-relaxed font-sans text-xs">{activeRec.reason}</p>
            </div>

            {/* Expected Impact Summary */}
            <div className="grid grid-cols-3 gap-2 font-mono text-xs p-3 bg-blue-50/50 rounded-xl border border-blue-100">
              <div>
                <span className="text-[10px] text-blue-700 uppercase">Power Saved</span>
                <div className="font-bold text-blue-900">{activeRec.powerSavingsKW} kW</div>
              </div>
              <div>
                <span className="text-[10px] text-blue-700 uppercase">Hourly Savings</span>
                <div className="font-bold text-blue-900">₹ {activeRec.hourlyCostSavingsINR} / hr</div>
              </div>
              <div>
                <span className="text-[10px] text-blue-700 uppercase">Daily Savings</span>
                <div className="font-bold text-blue-900">₹ {activeRec.dailyCostSavingsINR} / day</div>
              </div>
            </div>
          </div>

          {/* Accept / Reject Buttons */}
          <div className="flex items-center space-x-3 pt-3 border-t border-border-soft">
            <button
              onClick={handleAcceptAC}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center space-x-2"
            >
              <Check className="w-4 h-4" />
              <span>Accept Recommendation ({activeRec.recommendedSetpoint}°C)</span>
            </button>
            <button
              onClick={() => rejectACRecommendation(selectedLabId)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs font-medium rounded-xl border border-border-soft transition-all"
            >
              Reject
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: BEFORE-AND-AFTER MANAGEMENT COMPARISON CARD */}
      <div className="bg-white border border-border-soft rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-soft pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <TrendingDown className="w-4 h-4 text-savings" />
              <span>Before-and-After Management Supervisory Impact</span>
            </h3>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
              Evaluating baseline unmanaged facility vs active AI supervisory interventions
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="text-slate-500">Active Interventions:</span>
            <span className="bg-savings-light text-savings font-bold px-2.5 py-0.5 rounded-full border border-savings/20">
              {acceptedManagementActionIds.length} Accepted
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 font-mono text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-border-soft space-y-1">
            <span className="text-[10px] text-slate-400 uppercase">Operating Demand</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-slate-400 line-through">{beforeAfterComparison.beforeDemandKW} kW</span>
              <span className="text-base font-bold text-savings">{beforeAfterComparison.afterDemandKW} kW</span>
            </div>
            <div className="text-[10px] text-savings font-bold">-{beforeAfterComparison.demandReductionKW} kW</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-border-soft space-y-1">
            <span className="text-[10px] text-slate-400 uppercase">Peak Demand (kW)</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-slate-400 line-through">{beforeAfterComparison.beforePeakKW} kW</span>
              <span className="text-base font-bold text-savings">{beforeAfterComparison.afterPeakKW} kW</span>
            </div>
            <div className="text-[10px] text-savings font-bold">-{beforeAfterComparison.peakReductionKW} kW clipped</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-border-soft space-y-1">
            <span className="text-[10px] text-slate-400 uppercase">Daily Energy (kWh)</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-slate-400 line-through">{beforeAfterComparison.beforeDailyKWh}</span>
              <span className="text-base font-bold text-savings">{beforeAfterComparison.afterDailyKWh}</span>
            </div>
            <div className="text-[10px] text-savings font-bold">-{beforeAfterComparison.dailyKWhReduction} kWh/day</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-border-soft space-y-1">
            <span className="text-[10px] text-slate-400 uppercase">Annual Energy (kWh)</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-slate-400 line-through text-[11px]">
                {beforeAfterComparison.beforeAnnualKWh.toLocaleString()}
              </span>
              <span className="text-sm font-bold text-savings">
                {beforeAfterComparison.afterAnnualKWh.toLocaleString()}
              </span>
            </div>
            <div className="text-[10px] text-savings font-bold">
              -{beforeAfterComparison.annualKWhReduction.toLocaleString()} kWh/yr
            </div>
          </div>

          <div className="p-3 bg-savings-light rounded-xl border border-savings/20 space-y-1">
            <span className="text-[10px] text-savings font-semibold uppercase">Annual Cost Savings</span>
            <div className="text-lg font-bold text-savings">
              ₹ {beforeAfterComparison.annualCostSavingsINR.toLocaleString()}
            </div>
            <div className="text-[10px] text-savings font-medium">
              {beforeAfterComparison.percentageReduction}% reduction achieved
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: BUILDING-WIDE ENERGY MANAGEMENT RECOMMENDATIONS */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Zap className="w-4 h-4 text-blue-600" />
              <span>Building-Wide Energy Management Action Catalog</span>
            </h3>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
              Supervisory recommendations across Lighting, Fans, HVAC, IT Workstations, Peak Clipping, and Retrofits
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl text-xs font-mono">
            {['all', 'lighting', 'fan', 'ac', 'computers', 'peak', 'planning'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategoryFilter(cat)}
                className={`px-3 py-1 rounded-lg capitalize transition-all ${
                  selectedCategoryFilter === cat
                    ? 'bg-white text-blue-700 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Recommendations Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredManagementRecs.map((rec) => {
            const isAccepted = acceptedManagementActionIds.includes(rec.id);
            const IconComponent = CATEGORY_ICONS[rec.category] || Zap;

            return (
              <div
                key={rec.id}
                className={`p-5 rounded-2xl border transition-all space-y-3.5 ${
                  isAccepted
                    ? 'bg-emerald-50/40 border-emerald-300 shadow-xs'
                    : 'bg-white border-border-soft hover:border-blue-300 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start space-x-3">
                    <div
                      className={`p-2 rounded-xl shrink-0 ${
                        isAccepted ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider ${
                            rec.priority === 'IMMEDIATE'
                              ? 'bg-rose-100 text-rose-800'
                              : rec.priority === 'SHORT_TERM'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {rec.priority}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 capitalize">{rec.category}</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm mt-1">{rec.title}</h4>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                      isAccepted
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isAccepted ? 'Applied' : 'Pending'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{rec.description}</p>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-border-soft text-[11px] text-slate-700 font-mono">
                  <span className="font-bold text-slate-900">Control Action: </span>
                  {rec.action}
                </div>

                <div className="grid grid-cols-3 gap-2 font-mono text-xs pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Demand Impact</span>
                    <div className="font-bold text-blue-700">-{rec.impactDemandKW} kW</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Daily Savings</span>
                    <div className="font-bold text-indigo-700">{rec.dailyKWhSaved} kWh/d</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Annual Savings</span>
                    <div className="font-bold text-emerald-700">₹ {rec.annualCostSavedINR.toLocaleString()}</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-border-soft flex items-center justify-end space-x-2">
                  {isAccepted ? (
                    <button
                      onClick={() => rejectManagementAction(rec.id)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-mono text-xs font-semibold rounded-lg transition-all flex items-center space-x-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Revert Action</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => acceptManagementAction(rec.id)}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold rounded-lg transition-all shadow-2xs flex items-center space-x-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Accept & Apply to Facility</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
