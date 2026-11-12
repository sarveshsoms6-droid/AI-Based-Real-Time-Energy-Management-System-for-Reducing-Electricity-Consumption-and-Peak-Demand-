import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SimulatedHardwareReading } from '../types';
import {
  generateInitialHardwareReading,
  generateNextHardwareReading,
} from '../engine/hardwareOutputSimulator';
import {
  Zap,
  Activity,
  Cpu,
  Thermometer,
  Droplets,
  Play,
  Pause,
  RotateCcw,
  Sliders,
} from 'lucide-react';

export const HardwareOutputPage: React.FC = () => {
  // Current simulated readings
  const [currentReading, setCurrentReading] = useState<SimulatedHardwareReading>(() =>
    generateInitialHardwareReading()
  );

  // Simulation running state (updates every 2 seconds by default)
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Step generator
  const triggerNextStep = useCallback(() => {
    setCurrentReading((prev) => generateNextHardwareReading(prev));
  }, []);

  // 2-second interval loop
  useEffect(() => {
    if (!isRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      triggerNextStep();
    }, 2000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, triggerNextStep]);

  // Reset simulation handler
  const handleReset = () => {
    setCurrentReading(generateInitialHardwareReading());
    setIsRunning(true);
  };

  return (
    <div className="space-y-6">
      {/* Hardware Console Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-border-soft shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight font-mono uppercase">
              Hardware Console
            </h1>
            <p className="text-xs text-slate-500 font-mono">
              Real-time electrical and environmental sensor monitoring
            </p>
          </div>
        </div>

        {/* Minimal Controls: Start / Pause / Resume / Reset */}
        <div className="flex items-center space-x-2 font-mono text-xs">
          {isRunning ? (
            <button
              onClick={() => setIsRunning(false)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg font-semibold transition-all shadow-2xs"
              title="Pause Simulation"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </button>
          ) : (
            <button
              onClick={() => setIsRunning(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-all shadow-2xs"
              title="Resume Simulation"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Resume</span>
            </button>
          )}

          <button
            onClick={handleReset}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-border-soft rounded-lg font-medium transition-all"
            title="Reset Simulation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Exactly FIVE Parameter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {/* Card 1: Motor Voltage */}
        <div className="p-6 bg-white border border-border-soft hover:border-amber-300 rounded-2xl shadow-xs transition-all space-y-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 shadow-2xs">
            <Zap className="w-6 h-6" />
          </div>

          <div>
            <div className="text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider">
              Motor Voltage
            </div>
            <div className="flex items-baseline space-x-1.5 font-mono mt-2">
              <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                {currentReading.voltage.toFixed(2)}
              </span>
              <span className="text-lg font-bold text-slate-500">V</span>
            </div>
          </div>
        </div>

        {/* Card 2: Motor Current */}
        <div className="p-6 bg-white border border-border-soft hover:border-blue-300 rounded-2xl shadow-xs transition-all space-y-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600 shadow-2xs">
            <Activity className="w-6 h-6" />
          </div>

          <div>
            <div className="text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider">
              Motor Current
            </div>
            <div className="flex items-baseline space-x-1.5 font-mono mt-2">
              <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                {currentReading.current.toFixed(2)}
              </span>
              <span className="text-lg font-bold text-slate-500">A</span>
            </div>
          </div>
        </div>

        {/* Card 3: Motor Power */}
        <div className="p-6 bg-white border border-border-soft hover:border-indigo-300 rounded-2xl shadow-xs transition-all space-y-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200/60 flex items-center justify-center text-indigo-600 shadow-2xs">
            <Cpu className="w-6 h-6" />
          </div>

          <div>
            <div className="text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider">
              Motor Power
            </div>
            <div className="flex items-baseline space-x-1.5 font-mono mt-2">
              <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                {currentReading.power.toFixed(2)}
              </span>
              <span className="text-lg font-bold text-slate-500">W</span>
            </div>
          </div>
        </div>

        {/* Card 4: Temperature */}
        <div className="p-6 bg-white border border-border-soft hover:border-rose-300 rounded-2xl shadow-xs transition-all space-y-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200/60 flex items-center justify-center text-rose-600 shadow-2xs">
            <Thermometer className="w-6 h-6" />
          </div>

          <div>
            <div className="text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider">
              Temperature
            </div>
            <div className="flex items-baseline space-x-1.5 font-mono mt-2">
              <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                {currentReading.temperature.toFixed(1)}
              </span>
              <span className="text-lg font-bold text-slate-500">°C</span>
            </div>
          </div>
        </div>

        {/* Card 5: Humidity */}
        <div className="p-6 bg-white border border-border-soft hover:border-cyan-300 rounded-2xl shadow-xs transition-all space-y-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-50 border border-cyan-200/60 flex items-center justify-center text-cyan-600 shadow-2xs">
            <Droplets className="w-6 h-6" />
          </div>

          <div>
            <div className="text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider">
              Humidity
            </div>
            <div className="flex items-baseline space-x-1.5 font-mono mt-2">
              <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                {currentReading.humidity.toFixed(1)}
              </span>
              <span className="text-lg font-bold text-slate-500">%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
