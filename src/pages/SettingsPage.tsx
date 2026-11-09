import React, { useState } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { useTheme } from '../context/ThemeContext';
import {
  Settings,
  DollarSign,
  Leaf,
  Zap,
  Cpu,
  RotateCcw,
  CheckCircle,
  HelpCircle,
  ShieldCheck,
  Radio,
  Sliders,
  Sun,
  Moon,
  Palette,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const {
    ratings,
    tariffs,
    usageFactors,
    hardwareMode,
    updateElectricalRatings,
    updateTariffs,
    updateUsageFactors,
    setHardwareMode,
    resetSimulation,
  } = useSimulation();

  const { theme, isDark, setTheme, toggleTheme } = useTheme();

  const [tariffVal, setTariffVal] = useState(tariffs.energyTariffINRPerKWh);
  const [demandChargeVal, setDemandChargeVal] = useState(tariffs.peakDemandChargeINRPerKW);
  const [carbonVal, setCarbonVal] = useState(tariffs.carbonEmissionFactorKgPerKWh);

  // Usage Factors State
  const [localUsageFactors, setLocalUsageFactors] = useState({ ...usageFactors });

  // Electrical ratings state
  const [localRatings, setLocalRatings] = useState({ ...ratings });
  const [savedToast, setSavedToast] = useState<string | null>(null);

  const handleSaveSettings = () => {
    updateTariffs({
      energyTariffINRPerKWh: Number(tariffVal),
      peakDemandChargeINRPerKW: Number(demandChargeVal),
      carbonEmissionFactorKgPerKWh: Number(carbonVal),
    });

    updateUsageFactors(localUsageFactors);
    updateElectricalRatings(localRatings);

    setSavedToast('Configuration settings updated successfully!');
    setTimeout(() => setSavedToast(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2.5">
            <Settings className="w-5 h-5 text-blue-600" />
            <span>Application Settings, Tariffs & System Configuration</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure utility rates, carbon intensity, device usage factors, nameplate ratings, and Stage 2 hardware integration
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-mono text-xs font-extrabold shadow-xs transition-all"
        >
          SAVE CONFIGURATION
        </button>
      </div>

      {savedToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-mono text-xs flex items-center space-x-2 shadow-2xs">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{savedToast}</span>
        </div>
      )}

      {/* Theme Selection Card */}
      <div className="bg-white border border-border-soft rounded-2xl p-6 shadow-xs font-mono text-xs">
        <div className="flex flex-wrap items-center justify-between pb-4 border-b border-border-soft gap-y-2">
          <div className="flex items-center space-x-2.5">
            <Palette className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Visual Interface & Theme Mode</h2>
              <p className="text-[11px] text-slate-500 font-sans mt-0.5">
                Toggle between Light Mode (academic off-white) and Dark Mode (SCADA deep navy cyber)
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded bg-blue-50 text-blue-800 border border-blue-200">
            Active: {theme === 'light' ? 'LIGHT (OFF-WHITE)' : 'DARK (SCADA NAVY)'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          {/* Light Mode Option */}
          <button
            onClick={() => setTheme('light')}
            className={`p-4 rounded-xl border text-left transition-all flex items-start space-x-3.5 ${
              theme === 'light'
                ? 'border-blue-500 bg-blue-50/40 shadow-xs'
                : 'border-border-soft bg-slate-50/50 hover:bg-slate-100 hover:border-slate-300'
            }`}
          >
            <div className={`p-2.5 rounded-lg border ${
              theme === 'light' ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-slate-100 text-slate-500 border-border-soft'
            }`}>
              <Sun className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs">Light Mode (Off-White)</span>
                {theme === 'light' && (
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">Active</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-sans mt-1 leading-relaxed">
                Clean institutional off-white background (#F7F5F0), pure white cards, soft borders (#E7E3DA), and dark grey typography (#1F2933).
              </p>
            </div>
          </button>

          {/* Dark Mode Option */}
          <button
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-xl border text-left transition-all flex items-start space-x-3.5 ${
              theme === 'dark'
                ? 'border-blue-500 bg-slate-100 shadow-xs'
                : 'border-border-soft bg-slate-50/50 hover:bg-slate-100 hover:border-slate-300'
            }`}
          >
            <div className={`p-2.5 rounded-lg border ${
              theme === 'dark' ? 'bg-indigo-100 text-indigo-800 border-indigo-300' : 'bg-slate-100 text-slate-500 border-border-soft'
            }`}>
              <Moon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs">Dark Mode (SCADA Deep Navy)</span>
                {theme === 'dark' && (
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">Active</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-sans mt-1 leading-relaxed">
                High-contrast industrial telemetry mode with deep midnight navy surfaces (#0A0F1D / #0F172A), cyber accents, and luminescent gauges.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Grid: Main Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Utility Tariffs & Carbon Assumptions */}
        <div className="bg-white border border-border-soft rounded-2xl p-6 shadow-xs space-y-4 font-mono text-xs">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm pb-3 border-b border-border-soft">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>Commercial Utility Tariff & Emissions</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-slate-700 block mb-1 font-semibold">
                Active Energy Tariff Rate (₹ / kWh):
              </label>
              <input
                type="number"
                step="0.1"
                value={tariffVal}
                onChange={(e) => setTariffVal(Number(e.target.value))}
                className="w-full bg-slate-50 border border-border-soft rounded-lg px-3 py-2 text-slate-900 font-bold focus:border-blue-500 outline-none"
              />
              <span className="text-[10px] text-slate-400">
                Institutional rate (Default ₹8.00 per unit kWh)
              </span>
            </div>

            <div>
              <label className="text-slate-700 block mb-1 font-semibold">
                Peak Demand Charge Rate (₹ / kW / month):
              </label>
              <input
                type="number"
                step="10"
                value={demandChargeVal}
                onChange={(e) => setDemandChargeVal(Number(e.target.value))}
                className="w-full bg-slate-50 border border-border-soft rounded-lg px-3 py-2 text-slate-900 font-bold focus:border-blue-500 outline-none"
              />
              <span className="text-[10px] text-slate-400">
                Levied on monthly maximum demand (Default ₹350/kW)
              </span>
            </div>

            <div>
              <label className="text-slate-700 block mb-1 font-semibold">
                Carbon Emission Intensity (kg CO₂ / kWh):
              </label>
              <input
                type="number"
                step="0.01"
                value={carbonVal}
                onChange={(e) => setCarbonVal(Number(e.target.value))}
                className="w-full bg-slate-50 border border-border-soft rounded-lg px-3 py-2 text-slate-900 font-bold focus:border-blue-500 outline-none"
              />
              <span className="text-[10px] text-slate-400">
                CEA Indian Grid baseline average (Default 0.82 kg CO₂/kWh)
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Timetable Load Usage Factors */}
        <div className="bg-white border border-border-soft rounded-2xl p-6 shadow-xs space-y-4 font-mono text-xs">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm pb-3 border-b border-border-soft">
            <Sliders className="w-4 h-4 text-blue-600" />
            <span>Timetable Load Usage Factors</span>
          </div>

          <div className="space-y-3.5">
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-slate-700 font-semibold">Light Usage Factor:</label>
                <span className="text-blue-700 font-bold">{localUsageFactors.lightFactor.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={localUsageFactors.lightFactor}
                onChange={(e) =>
                  setLocalUsageFactors({ ...localUsageFactors, lightFactor: Number(e.target.value) })
                }
                className="w-full accent-blue-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400">Scheduled classroom/lab lighting activation factor (Default 0.90)</span>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="text-slate-700 font-semibold">Fan Usage Factor:</label>
                <span className="text-blue-700 font-bold">{localUsageFactors.fanFactor.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={localUsageFactors.fanFactor}
                onChange={(e) =>
                  setLocalUsageFactors({ ...localUsageFactors, fanFactor: Number(e.target.value) })
                }
                className="w-full accent-blue-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400">Ceiling fan diversity factor (Default 0.80)</span>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="text-slate-700 font-semibold">AC Usage Factor:</label>
                <span className="text-blue-700 font-bold">{localUsageFactors.acFactor.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={localUsageFactors.acFactor}
                onChange={(e) =>
                  setLocalUsageFactors({ ...localUsageFactors, acFactor: Number(e.target.value) })
                }
                className="w-full accent-blue-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400">Lab air conditioner duty cycle factor (Default 0.75)</span>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="text-slate-700 font-semibold">Computer Usage Factor:</label>
                <span className="text-blue-700 font-bold">{localUsageFactors.computerFactor.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={localUsageFactors.computerFactor}
                onChange={(e) =>
                  setLocalUsageFactors({ ...localUsageFactors, computerFactor: Number(e.target.value) })
                }
                className="w-full accent-blue-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400">Computer lab active workstation ratio (Default 0.85)</span>
            </div>
          </div>
        </div>

        {/* Card 3: Future ESP32 Hardware Integration */}
        <div className="bg-white border border-border-soft rounded-2xl p-6 shadow-xs space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-border-soft">
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
              <Cpu className="w-4 h-4 text-blue-600" />
              <span>Future ESP32 Hardware (Stage 2)</span>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                hardwareMode === 'HARDWARE'
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-blue-100 text-blue-800 border border-blue-200'
              }`}
            >
              {hardwareMode === 'HARDWARE' ? 'HARDWARE MODE' : 'SIMULATION MODE'}
            </span>
          </div>

          <div className="space-y-3 text-slate-600 text-[11px] leading-relaxed">
            <p>
              The platform is architected with a decoupled <b>IDataProvider</b> abstraction layer. Physical hardware integration
              can be activated in Stage 2 without restructuring the core digital twin:
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-border-soft space-y-1.5 font-mono text-[10px]">
              <div className="text-blue-700 font-bold">END-TO-END TELEMETRY PIPELINE:</div>
              <div className="text-slate-600">
                ESP32 (PZEM-004T + DHT22) ➔ Wi-Fi ➔ MQTT Broker (Port 1883) ➔ Python FastAPI ➔ SQLite ➔ Digital Twin
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <div>
                <span className="text-slate-500 block font-semibold">Configured MQTT Topic Prefix:</span>
                <span className="text-blue-700 font-bold">campus/building1/floor&#123;id&#125;/room&#123;id&#125;/telemetry</span>
              </div>
              <div>
                <span className="text-slate-500 block font-semibold">Telemetry Payload Format:</span>
                <span className="text-slate-500 font-mono text-[10px]">
                  &#123;"voltage": 230.2, "current": 4.12, "power": 920, "pf": 0.94, "temp": 24.5, "rh": 55&#125;
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setHardwareMode(hardwareMode === 'SIMULATION' ? 'HARDWARE' : 'SIMULATION')}
                className="w-full py-2 rounded-lg bg-slate-100 text-slate-700 border border-border-soft hover:bg-slate-200 font-bold transition-all text-center"
              >
                Toggle Data Provider Mode ({hardwareMode})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Card 4: Appliance Nameplate Electrical Ratings Editor */}
      <div className="bg-white border border-border-soft rounded-2xl p-6 shadow-xs space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-border-soft">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
            <Zap className="w-4 h-4 text-amber-600" />
            <span>Appliance Nameplate Electrical Ratings (Editable)</span>
          </div>
          <span className="text-slate-500 text-[11px]">Total Connected Load: 37.8 kW (Standard)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Classrooms */}
          <div className="p-4 bg-slate-50 rounded-xl border border-border-soft space-y-3">
            <span className="font-bold text-blue-700 block text-xs">Classrooms (6 Rooms)</span>

            <div>
              <label className="text-slate-600 block text-[10px]">Tube Light Wattage (W):</label>
              <input
                type="number"
                value={localRatings.classroomTubeLightWatts}
                onChange={(e) =>
                  setLocalRatings({ ...localRatings, classroomTubeLightWatts: Number(e.target.value) })
                }
                className="w-full bg-white border border-border-soft rounded px-2.5 py-1.5 text-slate-900 font-bold outline-none"
              />
              <span className="text-[10px] text-slate-400">Default: 40 W (10 lights = 400 W)</span>
            </div>

            <div>
              <label className="text-slate-600 block text-[10px]">Ceiling Fan Wattage (W):</label>
              <input
                type="number"
                value={localRatings.classroomFanWatts}
                onChange={(e) =>
                  setLocalRatings({ ...localRatings, classroomFanWatts: Number(e.target.value) })
                }
                className="w-full bg-white border border-border-soft rounded px-2.5 py-1.5 text-slate-900 font-bold outline-none"
              />
              <span className="text-[10px] text-slate-400">Default: 75 W (6 fans = 450 W)</span>
            </div>

            <div>
              <label className="text-slate-600 block text-[10px]">Overhead Projector (W):</label>
              <input
                type="number"
                value={localRatings.classroomProjectorWatts}
                onChange={(e) =>
                  setLocalRatings({ ...localRatings, classroomProjectorWatts: Number(e.target.value) })
                }
                className="w-full bg-white border border-border-soft rounded px-2.5 py-1.5 text-slate-900 font-bold outline-none"
              />
              <span className="text-[10px] text-slate-400">Default: 250 W (Total CR = 1.1 kW)</span>
            </div>
          </div>

          {/* Circuit Analysis Lab */}
          <div className="p-4 bg-slate-50 rounded-xl border border-border-soft space-y-3">
            <span className="font-bold text-amber-700 block text-xs">Circuit Analysis Labs (2 Rooms)</span>

            <div>
              <label className="text-slate-600 block text-[10px]">Lab Air Conditioner (W):</label>
              <input
                type="number"
                value={localRatings.circuitLabAcWatts}
                onChange={(e) =>
                  setLocalRatings({ ...localRatings, circuitLabAcWatts: Number(e.target.value) })
                }
                className="w-full bg-white border border-border-soft rounded px-2.5 py-1.5 text-slate-900 font-bold outline-none"
              />
              <span className="text-[10px] text-slate-400">Default: 2,200 W (2 ACs = 4.4 kW)</span>
            </div>

            <div>
              <label className="text-slate-600 block text-[10px]">Tube Light Wattage (W):</label>
              <input
                type="number"
                value={localRatings.circuitLabTubeLightWatts}
                onChange={(e) =>
                  setLocalRatings({ ...localRatings, circuitLabTubeLightWatts: Number(e.target.value) })
                }
                className="w-full bg-white border border-border-soft rounded px-2.5 py-1.5 text-slate-900 font-bold outline-none"
              />
              <span className="text-[10px] text-slate-400">Default: 40 W (10 lights = 400 W)</span>
            </div>

            <div>
              <label className="text-slate-600 block text-[10px]">Experimental Socket Group (W):</label>
              <input
                type="number"
                value={localRatings.circuitLabDefaultSocketWatts}
                onChange={(e) =>
                  setLocalRatings({ ...localRatings, circuitLabDefaultSocketWatts: Number(e.target.value) })
                }
                className="w-full bg-white border border-border-soft rounded px-2.5 py-1.5 text-slate-900 font-bold outline-none"
              />
              <span className="text-[10px] text-slate-400">Default: 2,000 W (Total Lab = 6.8 kW)</span>
            </div>
          </div>

          {/* C Programming Lab */}
          <div className="p-4 bg-slate-50 rounded-xl border border-border-soft space-y-3">
            <span className="font-bold text-indigo-700 block text-xs">C Programming Labs (2 Rooms)</span>

            <div>
              <label className="text-slate-600 block text-[10px]">Desktop Workstation (W):</label>
              <input
                type="number"
                value={localRatings.progLabDesktopWatts}
                onChange={(e) =>
                  setLocalRatings({ ...localRatings, progLabDesktopWatts: Number(e.target.value) })
                }
                className="w-full bg-white border border-border-soft rounded px-2.5 py-1.5 text-slate-900 font-bold outline-none"
              />
              <span className="text-[10px] text-slate-400">Default: 150 W (32 PCs = 4.8 kW)</span>
            </div>

            <div>
              <label className="text-slate-600 block text-[10px]">Precision Lab AC (W):</label>
              <input
                type="number"
                value={localRatings.progLabAcWatts}
                onChange={(e) =>
                  setLocalRatings({ ...localRatings, progLabAcWatts: Number(e.target.value) })
                }
                className="w-full bg-white border border-border-soft rounded px-2.5 py-1.5 text-slate-900 font-bold outline-none"
              />
              <span className="text-[10px] text-slate-400">Default: 1,800 W (2 ACs = 3.6 kW)</span>
            </div>

            <div>
              <label className="text-slate-600 block text-[10px]">Tube Light Wattage (W):</label>
              <input
                type="number"
                value={localRatings.progLabTubeLightWatts}
                onChange={(e) =>
                  setLocalRatings({ ...localRatings, progLabTubeLightWatts: Number(e.target.value) })
                }
                className="w-full bg-white border border-border-soft rounded px-2.5 py-1.5 text-slate-900 font-bold outline-none"
              />
              <span className="text-[10px] text-slate-400">Default: 40 W (Total Lab = 8.8 kW)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Factory Reset */}
      <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between font-mono text-xs">
        <div>
          <span className="font-bold text-rose-800 block">Factory Simulation State Reset</span>
          <span className="text-slate-500 text-[11px]">
            Clear localStorage persistence and restore all 10 room states, ratings, and histories to default baseline
          </span>
        </div>

        <button
          onClick={() => {
            if (confirm('Are you sure you want to reset all simulation settings and room states?')) {
              resetSimulation();
              setSavedToast('All data reset to factory default!');
            }
          }}
          className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all shadow-xs"
        >
          Reset All to Default
        </button>
      </div>
    </div>
  );
};
