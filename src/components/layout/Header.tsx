import React from 'react';
import { useSimulation } from '../../context/SimulationContext';
import {
  Play,
  Pause,
  RotateCcw,
  Clock,
  Zap,
  Activity,
  Cpu,
  GraduationCap,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    isSimulating,
    simSpeed,
    simTimeString,
    hardwareMode,
    toggleSimulationRunning,
    setSimSpeed,
    resetSimulation,
    setHardwareMode,
  } = useSimulation();

  return (
    <header className="h-16 border-b border-border-soft bg-white px-6 flex items-center justify-between z-30 select-none shadow-xs">
      {/* Brand & Institutional Identity */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        <div className="w-10 h-10 rounded-xl bg-savings-light border border-savings/20 flex items-center justify-center text-savings shadow-xs">
          <Zap className="w-5 h-5 fill-current" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-base tracking-tight text-slate-900">
              CIT <span className="text-savings">EEE ENERGY AI</span>
            </span>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold tracking-wider bg-savings/10 text-savings border border-savings/20 rounded">
              TRACK 5
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium -mt-0.5 hidden sm:block">
            Chennai Institute of Technology • EEE Block Smart Energy Management & Digital Twin
          </p>
        </div>
      </div>

      {/* Simulation Controls & Status Pill */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Hardware / Simulation Mode Badge */}
        <div className="flex items-center bg-slate-100 border border-border-soft rounded-lg p-0.5 text-xs font-mono">
          <button
            onClick={() => setHardwareMode('SIMULATION')}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center space-x-1.5 ${
              hardwareMode === 'SIMULATION'
                ? 'bg-white text-savings font-bold border border-border-soft shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-savings" />
            <span>SIMULATION</span>
          </button>
          <button
            onClick={() => setHardwareMode('HARDWARE')}
            title="Stage 2 Hardware Interface (ESP32 + MQTT)"
            className={`px-2.5 py-1 rounded-md transition-all flex items-center space-x-1.5 ${
              hardwareMode === 'HARDWARE'
                ? 'bg-white text-warning font-bold border border-border-soft shadow-xs'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-warning" />
            <span className="text-[11px]">HARDWARE (STAGE 2)</span>
          </button>
        </div>

        {/* Live Simulation Clock */}
        <div className="hidden lg:flex items-center space-x-2 bg-slate-50 border border-border-soft px-3 py-1.5 rounded-lg text-xs font-mono text-slate-700">
          <Clock className="w-3.5 h-3.5 text-savings" />
          <span>SIM TIME:</span>
          <span className="font-bold text-slate-900 text-sm">{simTimeString}</span>
        </div>

        {/* Simulation Speed Selector */}
        <div className="flex items-center bg-slate-100 border border-border-soft rounded-lg p-0.5 text-xs font-mono text-slate-600">
          {([1, 5, 10, 60] as const).map((spd) => (
            <button
              key={spd}
              onClick={() => setSimSpeed(spd)}
              className={`px-2 py-1 rounded transition-all ${
                simSpeed === spd
                  ? 'bg-white text-slate-900 font-bold border border-border-soft shadow-xs'
                  : 'hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              {spd}×
            </button>
          ))}
        </div>

        {/* Pause / Play */}
        <button
          onClick={toggleSimulationRunning}
          title={isSimulating ? 'Pause Simulation' : 'Resume Simulation'}
          className={`p-2 rounded-lg border transition-all ${
            isSimulating
              ? 'bg-savings-light text-savings border-savings/30 hover:bg-savings/20'
              : 'bg-amber-50 text-warning border-warning/30 hover:bg-amber-100'
          }`}
        >
          {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
        </button>

        {/* Reset to Baseline */}
        <button
          onClick={() => {
            if (confirm('Reset entire EEE Block energy simulation to default baseline?')) {
              resetSimulation();
            }
          }}
          title="Reset Simulation State"
          className="p-2 rounded-lg bg-slate-100 border border-border-soft text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
