import React, { useState } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { WhatIfParameters } from '../types';
import {
  GitBranch,
  Sliders,
  RotateCcw,
  Zap,
  DollarSign,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
  Thermometer,
  Monitor,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

export const WhatIfSimulationPage: React.FC = () => {
  const { rooms, aggregates, tariffs, ratings } = useSimulation();

  // Baseline metrics
  const baselineDemandKW = aggregates.currentBuildingDemandKW;
  const baselineDailyKWh = aggregates.dailyEnergyConsumptionKWh;
  const baselineDailyCost = aggregates.estimatedDailyCostINR;
  const baselinePeakKW = aggregates.predictedPeakDemandKW;

  // What-If Sliders State
  const [computerPct, setComputerPct] = useState<number>(100);
  const [lightPct, setLightPct] = useState<number>(100);
  const [fanPct, setFanPct] = useState<number>(100);
  const [acSetpointOffset, setAcSetpointOffset] = useState<number>(0);
  const [outdoorTempOffset, setOutdoorTempOffset] = useState<number>(0);
  const [occupancyPct, setOccupancyPct] = useState<number>(100);
  const [socketActive, setSocketActive] = useState<boolean>(true);

  // Compute modified scenario values dynamically
  // 1. Computer wattage modified:
  let baselinePCWatts = 0;
  let modifiedPCWatts = 0;
  let baselineLightWatts = 0;
  let modifiedLightWatts = 0;
  let baselineFanWatts = 0;
  let modifiedFanWatts = 0;
  let baselineAcWatts = 0;
  let modifiedAcWatts = 0;
  let baselineSocketWatts = 0;
  let modifiedSocketWatts = 0;

  rooms.forEach((r) => {
    if (r.appliances.type === 'classroom') {
      const activeL = r.appliances.data.tubeLights.filter(Boolean).length;
      baselineLightWatts += activeL * ratings.classroomTubeLightWatts;
      modifiedLightWatts += activeL * ratings.classroomTubeLightWatts * (lightPct / 100);

      const activeF = r.appliances.data.fans.filter(Boolean).length;
      baselineFanWatts += activeF * ratings.classroomFanWatts;
      modifiedFanWatts += activeF * ratings.classroomFanWatts * (fanPct / 100);
    } else if (r.appliances.type === 'circuit_lab') {
      const activeL = r.appliances.data.tubeLights.filter(Boolean).length;
      baselineLightWatts += activeL * ratings.circuitLabTubeLightWatts;
      modifiedLightWatts += activeL * ratings.circuitLabTubeLightWatts * (lightPct / 100);

      if (r.appliances.data.socketActive) {
        baselineSocketWatts += r.appliances.data.socketWatts;
        if (socketActive) modifiedSocketWatts += r.appliances.data.socketWatts;
      }

      // AC power responds to setpoint (+1°C saves ~6% AC power) and outdoor temp
      const acFactor = Math.max(0.4, 1.0 - (acSetpointOffset * 0.06) + (outdoorTempOffset * 0.04));
      r.appliances.data.acUnits.forEach((mode) => {
        if (mode === 'ON') {
          baselineAcWatts += ratings.circuitLabAcWatts;
          modifiedAcWatts += ratings.circuitLabAcWatts * acFactor;
        }
      });
    } else if (r.appliances.type === 'programming_lab') {
      const activeL = r.appliances.data.tubeLights.filter(Boolean).length;
      baselineLightWatts += activeL * ratings.progLabTubeLightWatts;
      modifiedLightWatts += activeL * ratings.progLabTubeLightWatts * (lightPct / 100);

      const activePCs = r.appliances.data.desktops.filter(Boolean).length;
      baselinePCWatts += activePCs * ratings.progLabDesktopWatts;
      modifiedPCWatts += activePCs * ratings.progLabDesktopWatts * (computerPct / 100);

      const acFactor = Math.max(0.4, 1.0 - (acSetpointOffset * 0.06) + (outdoorTempOffset * 0.04));
      r.appliances.data.acUnits.forEach((mode) => {
        if (mode === 'ON') {
          baselineAcWatts += ratings.progLabAcWatts;
          modifiedAcWatts += ratings.progLabAcWatts * acFactor;
        }
      });
    }
  });

  const baselineCategorySumW =
    baselinePCWatts + baselineLightWatts + baselineFanWatts + baselineAcWatts + baselineSocketWatts;
  const modifiedCategorySumW =
    modifiedPCWatts + modifiedLightWatts + modifiedFanWatts + modifiedAcWatts + modifiedSocketWatts;

  const deltaDemandW = modifiedCategorySumW - baselineCategorySumW;
  const modifiedDemandKW = Number(Math.max(1.2, baselineDemandKW + deltaDemandW / 1000).toFixed(2));

  const demandRatio = baselineDemandKW > 0 ? modifiedDemandKW / baselineDemandKW : 1;
  const modifiedDailyKWh = Number((baselineDailyKWh * demandRatio).toFixed(1));
  const modifiedDailyCost = Math.round(modifiedDailyKWh * tariffs.energyTariffINRPerKWh);
  const modifiedPeakKW = Number((baselinePeakKW * demandRatio).toFixed(2));

  const deltaCost = modifiedDailyCost - baselineDailyCost;
  const deltaPeak = Number((modifiedPeakKW - baselinePeakKW).toFixed(2));

  // Comparison chart data
  const comparisonChartData = [
    { metric: 'Live Demand (kW)', Baseline: baselineDemandKW, Scenario: modifiedDemandKW },
    { metric: 'Peak Demand (kW)', Baseline: baselinePeakKW, Scenario: modifiedPeakKW },
    { metric: 'Daily Energy (kWh)', Baseline: baselineDailyKWh, Scenario: modifiedDailyKWh },
  ];

  const resetWhatIf = () => {
    setComputerPct(100);
    setLightPct(100);
    setFanPct(100);
    setAcSetpointOffset(0);
    setOutdoorTempOffset(0);
    setOccupancyPct(100);
    setSocketActive(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2.5">
            <GitBranch className="w-5 h-5 text-blue-600" />
            <span>Interactive What-If Scenario Sandbox</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Simulate operational load shifts, thermostat offsets, occupancy variations, and equipment throttling in real-time
          </p>
        </div>

        <button
          onClick={resetWhatIf}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-white border border-border-soft text-slate-700 hover:bg-slate-100 font-mono text-xs font-semibold transition-all shadow-2xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Scenario to Baseline</span>
        </button>
      </div>

      {/* Main Grid: Left Controls, Right Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sliders Console (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-border-soft rounded-2xl p-6 shadow-xs space-y-5 font-mono text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-border-soft">
            <div className="flex items-center space-x-2 font-bold text-slate-900 text-sm">
              <Sliders className="w-4 h-4 text-blue-600" />
              <span>Scenario Input Parameters</span>
            </div>
            <span className="text-[10px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              LIVE RE-CALCULATION
            </span>
          </div>

          {/* 1. Computer Farm Load */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-700">Lab Computer Utilization:</span>
              <span className="text-blue-700 font-bold">{computerPct}% ({((computerPct / 100) * 64).toFixed(0)} PCs across labs)</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={computerPct}
              onChange={(e) => setComputerPct(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          {/* 2. Lighting Load */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-700">Active Campus Lighting:</span>
              <span className="text-amber-700 font-bold">{lightPct}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={lightPct}
              onChange={(e) => setLightPct(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* 3. Ceiling Fans */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-700">Classroom Ceiling Fans:</span>
              <span className="text-cyan-700 font-bold">{fanPct}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="10"
              value={fanPct}
              onChange={(e) => setFanPct(Number(e.target.value))}
              className="w-full accent-cyan-600 cursor-pointer"
            />
          </div>

          {/* 4. AC Setpoint Offset */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-700">AC Thermostat Setpoint Float:</span>
              <span className="text-indigo-700 font-bold">
                {acSetpointOffset > 0 ? `+${acSetpointOffset}` : acSetpointOffset} °C (Base 24°C)
              </span>
            </div>
            <input
              type="range"
              min="-3"
              max="4"
              step="0.5"
              value={acSetpointOffset}
              onChange={(e) => setAcSetpointOffset(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>

          {/* 5. Outdoor Ambient Heat Wave */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-700">Outdoor Heat Wave Deviation:</span>
              <span className="text-rose-700 font-bold">
                {outdoorTempOffset > 0 ? `+${outdoorTempOffset}` : outdoorTempOffset} °C
              </span>
            </div>
            <input
              type="range"
              min="-5"
              max="10"
              step="1"
              value={outdoorTempOffset}
              onChange={(e) => setOutdoorTempOffset(Number(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer"
            />
          </div>

          {/* 6. Student Occupancy */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-700">Campus Occupancy Density:</span>
              <span className="text-emerald-700 font-bold">{occupancyPct}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="150"
              step="10"
              value={occupancyPct}
              onChange={(e) => setOccupancyPct(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>

          {/* 7. Experimental Socket Group Switch */}
          <div className="pt-2 border-t border-border-soft flex items-center justify-between">
            <div>
              <span className="text-slate-900 font-bold block">Circuit Lab Experimental Sockets:</span>
              <span className="text-slate-500 text-[11px]">2.0 kW heavy testing loads</span>
            </div>
            <button
              onClick={() => setSocketActive(!socketActive)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                socketActive ? 'bg-amber-500 text-white shadow-xs' : 'bg-slate-100 text-slate-600 border border-border-soft'
              }`}
            >
              {socketActive ? 'LOAD ACTIVE' : 'LOAD SHED (OFF)'}
            </button>
          </div>
        </div>

        {/* Impact & Baseline Comparison (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Delta KPI Cards */}
          <div className="grid grid-cols-2 gap-3 font-mono text-xs">
            <div className="p-4 bg-white border border-border-soft rounded-xl shadow-xs space-y-1">
              <span className="text-slate-500 text-[10px] font-semibold uppercase">SCENARIO DEMAND</span>
              <div className="text-2xl font-bold text-blue-700">{modifiedDemandKW} kW</div>
              <div className={`text-[11px] font-bold ${modifiedDemandKW < baselineDemandKW ? 'text-emerald-700' : 'text-rose-700'}`}>
                {modifiedDemandKW < baselineDemandKW ? '▼' : '▲'} {Math.abs(modifiedDemandKW - baselineDemandKW).toFixed(2)} kW vs Baseline
              </div>
            </div>

            <div className="p-4 bg-white border border-border-soft rounded-xl shadow-xs space-y-1">
              <span className="text-slate-500 text-[10px] font-semibold uppercase">PREDICTED PEAK</span>
              <div className="text-2xl font-bold text-amber-700">{modifiedPeakKW} kW</div>
              <div className={`text-[11px] font-bold ${deltaPeak < 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {deltaPeak < 0 ? '▼' : '▲'} {Math.abs(deltaPeak)} kW vs Baseline
              </div>
            </div>

            <div className="p-4 bg-white border border-border-soft rounded-xl shadow-xs space-y-1">
              <span className="text-slate-500 text-[10px] font-semibold uppercase">DAILY ENERGY IMPACT</span>
              <div className="text-2xl font-bold text-slate-900">{modifiedDailyKWh} kWh</div>
              <div className="text-[11px] text-slate-500">Baseline: {baselineDailyKWh} kWh</div>
            </div>

            <div className="p-4 bg-white border border-border-soft rounded-xl shadow-xs space-y-1">
              <span className="text-slate-500 text-[10px] font-semibold uppercase">EST. DAILY COST</span>
              <div className="text-2xl font-bold text-emerald-700">₹{modifiedDailyCost.toLocaleString()}</div>
              <div className={`text-[11px] font-bold ${deltaCost <= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {deltaCost <= 0 ? `Saves ₹${Math.abs(deltaCost)}/day` : `Increases ₹${deltaCost}/day`}
              </div>
            </div>
          </div>

          {/* Visual Bar Comparison Chart */}
          <div className="bg-white border border-border-soft rounded-2xl p-5 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2 mb-3">
              <Activity className="w-4 h-4 text-blue-600" />
              <span>Baseline vs Modified Scenario Metric Comparison</span>
            </h3>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="metric" stroke="#64748b" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
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
                  <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: '11px' }} />
                  <Bar dataKey="Baseline" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Baseline Model" />
                  <Bar dataKey="Scenario" fill="#1d4ed8" radius={[4, 4, 0, 0]} name="What-If Scenario" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
