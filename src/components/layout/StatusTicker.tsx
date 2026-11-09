import React from 'react';
import { useSimulation } from '../../context/SimulationContext';
import {
  Zap,
  Activity,
  Layers,
  AlertTriangle,
  Radio,
  Calendar,
  Sparkles,
} from 'lucide-react';

export const StatusTicker: React.FC = () => {
  const { aggregates, timetableSavings, tariffs } = useSimulation();

  const isPeakAlert = aggregates.currentBuildingDemandKW > aggregates.totalConnectedLoadKW * 0.75;

  return (
    <div className="bg-slate-50 border-b border-border-soft px-6 py-2 flex flex-wrap items-center justify-between text-xs font-mono gap-y-2">
      <div className="flex items-center space-x-6 overflow-x-auto py-0.5 scrollbar-none">
        {/* Connected Load */}
        <div className="flex items-center space-x-1.5 text-slate-600">
          <span className="text-slate-400">CONNECTED:</span>
          <span className="font-bold text-slate-800">{aggregates.totalConnectedLoadKW} kW</span>
        </div>

        <div className="h-3 w-px bg-border-soft hidden sm:block" />

        {/* Operating Demand */}
        <div className="flex items-center space-x-1.5">
          <span className="text-slate-400">DEMAND:</span>
          <span className={`font-bold flex items-center space-x-1 ${
            isPeakAlert ? 'text-wastage animate-pulse' : 'text-cit-blue'
          }`}>
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>{aggregates.currentBuildingDemandKW.toFixed(2)} kW</span>
          </span>
          <span className="text-[10px] text-slate-400">
            ({((aggregates.currentBuildingDemandKW / aggregates.totalConnectedLoadKW) * 100).toFixed(0)}%)
          </span>
        </div>

        <div className="h-3 w-px bg-border-soft hidden sm:block" />

        {/* Floor Breakdown */}
        <div className="flex items-center space-x-2 text-slate-600">
          <span>F1:</span>
          <span className="text-cit-blue font-semibold">{aggregates.floor1DemandKW.toFixed(2)} kW</span>
          <span className="text-slate-300">|</span>
          <span>F2:</span>
          <span className="text-cit-blue font-semibold">{aggregates.floor2DemandKW.toFixed(2)} kW</span>
        </div>

        <div className="h-3 w-px bg-border-soft hidden md:block" />

        {/* Timetable Saved Today */}
        <div className="hidden md:flex items-center space-x-1.5">
          <span className="text-slate-400">TIMETABLE SAVED TODAY:</span>
          <span className="font-bold text-savings flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{timetableSavings.savedKWhToday} kWh (₹{timetableSavings.savedCostTodayINR})</span>
          </span>
        </div>

        <div className="h-3 w-px bg-border-soft hidden lg:block" />

        {/* Rate Indicator */}
        <div className="hidden lg:flex items-center space-x-1.5 text-slate-500">
          <span>TARIFF:</span>
          <span className="font-bold text-slate-700">₹{tariffs.energyTariffINRPerKWh || 8.0}/kWh</span>
        </div>

        <div className="h-3 w-px bg-border-soft hidden xl:block" />

        {/* College hours */}
        <div className="hidden xl:flex items-center space-x-1.5 text-slate-500">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>COLLEGE HOURS:</span>
          <span className="font-semibold text-slate-700">08:00 - 15:00</span>
        </div>
      </div>

      {/* Peak Warning or Operational Status Indicator */}
      <div className="flex items-center space-x-3">
        {isPeakAlert ? (
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-wastage-light border border-wastage/30 text-wastage text-[11px] font-semibold animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>PEAK DEMAND THRESHOLD WARNING</span>
          </div>
        ) : (
          <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-savings-light border border-savings/30 text-savings text-[11px] font-semibold">
            <Radio className="w-3 h-3 animate-ping" />
            <span>GRID NOMINAL (50.0 Hz)</span>
          </div>
        )}
      </div>
    </div>
  );
};
