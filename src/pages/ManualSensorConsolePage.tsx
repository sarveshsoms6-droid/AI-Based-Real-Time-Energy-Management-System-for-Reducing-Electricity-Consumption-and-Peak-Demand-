import React, { useState } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { RoomId, CalculationMode } from '../types';
import {
  Terminal,
  Zap,
  Thermometer,
  ShieldAlert,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  Layers,
  Sparkles,
} from 'lucide-react';

export const ManualSensorConsolePage: React.FC = () => {
  const { rooms, ratings, setCalculationMode, updateManualParams, updateEnvParams } = useSimulation();

  const [activeRoomId, setActiveRoomId] = useState<RoomId>('cr101');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const room = rooms.find((r) => r.id === activeRoomId) || rooms[0];

  // Local form inputs
  const [voltage, setVoltage] = useState(room.manualParams.voltage);
  const [current, setCurrent] = useState(room.manualParams.current);
  const [powerFactor, setPowerFactor] = useState(room.manualParams.powerFactor);
  const [frequency, setFrequency] = useState(room.manualParams.frequency);
  const [directPower, setDirectPower] = useState<string>(
    room.manualParams.directRealPower !== undefined ? room.manualParams.directRealPower.toString() : ''
  );

  const [indoorTemp, setIndoorTemp] = useState(room.envParams.indoorTemp);
  const [outdoorTemp, setOutdoorTemp] = useState(room.envParams.outdoorTemp);
  const [humidity, setHumidity] = useState(room.envParams.relativeHumidity);
  const [occupancy, setOccupancy] = useState(room.envParams.occupancy);

  // Sync when room selection changes
  const handleRoomSelect = (id: RoomId) => {
    setActiveRoomId(id);
    const r = rooms.find((x) => x.id === id);
    if (r) {
      setVoltage(r.manualParams.voltage);
      setCurrent(r.manualParams.current);
      setPowerFactor(r.manualParams.powerFactor);
      setFrequency(r.manualParams.frequency);
      setDirectPower(r.manualParams.directRealPower !== undefined ? r.manualParams.directRealPower.toString() : '');
      setIndoorTemp(r.envParams.indoorTemp);
      setOutdoorTemp(r.envParams.outdoorTemp);
      setHumidity(r.envParams.relativeHumidity);
      setOccupancy(r.envParams.occupancy);
    }
  };

  const handleApplyInput = (targetMode?: CalculationMode) => {
    // Validate inputs
    const vVal = Math.max(100, Math.min(300, Number(voltage) || 230));
    const iVal = Math.max(0, Math.min(100, Number(current) || 0));
    const pfVal = Math.max(0.1, Math.min(1.0, Number(powerFactor) || 0.92));
    const freqVal = Math.max(40, Math.min(70, Number(frequency) || 50.0));
    const directVal = directPower.trim() !== '' ? Math.max(0, Number(directPower)) : undefined;

    updateManualParams(room.id, {
      voltage: vVal,
      current: iVal,
      powerFactor: pfVal,
      frequency: freqVal,
      directRealPower: directVal,
    });

    updateEnvParams(room.id, {
      indoorTemp: Number(indoorTemp),
      outdoorTemp: Number(outdoorTemp),
      relativeHumidity: Number(humidity),
      occupancy: Number(occupancy),
    });

    if (targetMode) {
      setCalculationMode(room.id, targetMode);
    }

    setSuccessToast(`Successfully updated parameters for ${room.name}!`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Sinusoidal single-phase power calculations for preview
  const V = Number(voltage) || 230;
  const I = Number(current) || 0;
  const PF = Math.max(0.1, Math.min(1.0, Number(powerFactor) || 0.92));
  const calcApparentS = V * I; // VA
  const calcRealP = directPower ? Number(directPower) : calcApparentS * PF; // W
  const calcReactiveQ = Math.sqrt(Math.max(0, calcApparentS ** 2 - calcRealP ** 2)); // VAR

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2.5">
            <Terminal className="w-5 h-5 text-blue-600" />
            <span>Manual Sensor Console & Parameter Injection</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manual entry for electrical parameters (V, I, PF, Hz) and microclimate parameters (Temp, RH)
          </p>
        </div>

        {/* Room Switcher Dropdown */}
        <div className="flex items-center space-x-3 text-xs font-mono">
          <span className="text-slate-500">Select Room:</span>
          <select
            value={activeRoomId}
            onChange={(e) => handleRoomSelect(e.target.value as RoomId)}
            className="bg-white border border-border-soft rounded-lg px-3 py-2 text-slate-900 font-bold focus:border-blue-500 outline-none shadow-2xs"
          >
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} (Floor {r.floor})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mandatory Warning Banner */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 font-mono text-xs flex items-start space-x-3 shadow-xs">
        <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
        <div className="space-y-1">
          <div className="font-extrabold text-amber-900 text-sm">
            WARNING: SIMULATION MODE – MANUALLY ENTERED DATA, NOT LIVE SENSOR READINGS.
          </div>
          <p className="text-amber-800 text-xs leading-relaxed">
            This educational platform operates in a strict software simulation sandbox. There are no physical ESP32
            hardware or MQTT connections active. Mode A calculates demand strictly from individual virtual appliance
            switches, while Mode B calculates demand strictly from manual electrical single-phase sinusoidal inputs (P = V
            × I × PF). These modes are mutually exclusive to prevent double-counting.
          </p>
        </div>
      </div>

      {/* Mode Selector Card */}
      <div className="bg-white border border-border-soft rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between pb-4 border-b border-border-soft gap-y-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <span>Active Calculation Engine for</span>
              <span className="text-blue-700">{room.name}</span>
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Current Mode:{' '}
              <b className="text-slate-800">
                {room.calculationMode === 'MODE_A_APPLIANCE'
                  ? 'MODE A – APPLIANCE SIMULATION'
                  : 'MODE B – MANUAL ELECTRICAL INPUT'}
              </b>
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-xl border border-border-soft font-mono text-xs">
            <button
              onClick={() => handleApplyInput('MODE_A_APPLIANCE')}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${
                room.calculationMode === 'MODE_A_APPLIANCE'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              MODE A: Appliance Simulation
            </button>
            <button
              onClick={() => handleApplyInput('MODE_B_MANUAL_ELECTRICAL')}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${
                room.calculationMode === 'MODE_B_MANUAL_ELECTRICAL'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              MODE B: Manual Electrical Input
            </button>
          </div>
        </div>

        {/* Form Inputs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Section 1: Electrical Parameters */}
          <div className="space-y-4 bg-slate-50 p-5 rounded-xl border border-border-soft">
            <div className="flex items-center space-x-2 text-xs font-mono font-bold text-slate-800 uppercase tracking-wider">
              <Zap className="w-4 h-4 text-blue-600" />
              <span>Electrical Parameters (Single-Phase AC)</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <label className="text-slate-600 block mb-1">Voltage (V):</label>
                <input
                  type="number"
                  step="1"
                  value={voltage}
                  onChange={(e) => setVoltage(Number(e.target.value))}
                  className="w-full bg-white border border-border-soft rounded-lg px-3 py-2 text-slate-900 font-bold focus:border-blue-500 outline-none"
                />
                <span className="text-[10px] text-slate-400">Nominal: 230 V (Grid bounds 207-253V)</span>
              </div>

              <div>
                <label className="text-slate-600 block mb-1">Current (A):</label>
                <input
                  type="number"
                  step="0.1"
                  value={current}
                  onChange={(e) => setCurrent(Number(e.target.value))}
                  className="w-full bg-white border border-border-soft rounded-lg px-3 py-2 text-slate-900 font-bold focus:border-blue-500 outline-none"
                />
                <span className="text-[10px] text-slate-400">RMS Load Current</span>
              </div>

              <div>
                <label className="text-slate-600 block mb-1">Power Factor (PF):</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  max="1.0"
                  value={powerFactor}
                  onChange={(e) => setPowerFactor(Number(e.target.value))}
                  className="w-full bg-white border border-border-soft rounded-lg px-3 py-2 text-slate-900 font-bold focus:border-blue-500 outline-none"
                />
                <span className="text-[10px] text-slate-400">cos(φ), 0.10 to 1.00</span>
              </div>

              <div>
                <label className="text-slate-600 block mb-1">Grid Frequency (Hz):</label>
                <input
                  type="number"
                  step="0.1"
                  value={frequency}
                  onChange={(e) => setFrequency(Number(e.target.value))}
                  className="w-full bg-white border border-border-soft rounded-lg px-3 py-2 text-slate-900 font-bold focus:border-blue-500 outline-none"
                />
                <span className="text-[10px] text-slate-400">Nominal 50.0 Hz</span>
              </div>
            </div>

            <div className="pt-2 border-t border-border-soft">
              <label className="text-slate-600 text-xs font-mono block mb-1">
                Direct Real Power Override (W, optional):
              </label>
              <input
                type="number"
                placeholder="Leave blank to use V × I × PF"
                value={directPower}
                onChange={(e) => setDirectPower(e.target.value)}
                className="w-full bg-white border border-border-soft rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Section 2: Environmental Parameters */}
          <div className="space-y-4 bg-slate-50 p-5 rounded-xl border border-border-soft">
            <div className="flex items-center space-x-2 text-xs font-mono font-bold text-slate-800 uppercase tracking-wider">
              <Thermometer className="w-4 h-4 text-amber-600" />
              <span>Microclimate & Environmental Parameters</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <label className="text-slate-600 block mb-1">Indoor Temperature (°C):</label>
                <input
                  type="number"
                  step="0.1"
                  value={indoorTemp}
                  onChange={(e) => setIndoorTemp(Number(e.target.value))}
                  className="w-full bg-white border border-border-soft rounded-lg px-3 py-2 text-slate-900 font-bold focus:border-amber-500 outline-none"
                />
                <span className="text-[10px] text-slate-400">Room sensor input</span>
              </div>

              <div>
                <label className="text-slate-600 block mb-1">Outdoor Ambient (°C):</label>
                <input
                  type="number"
                  step="0.1"
                  value={outdoorTemp}
                  onChange={(e) => setOutdoorTemp(Number(e.target.value))}
                  className="w-full bg-white border border-border-soft rounded-lg px-3 py-2 text-slate-900 font-bold focus:border-amber-500 outline-none"
                />
                <span className="text-[10px] text-slate-400">Campus weather station</span>
              </div>

              <div>
                <label className="text-slate-600 block mb-1">Relative Humidity (%):</label>
                <input
                  type="number"
                  step="1"
                  min="10"
                  max="100"
                  value={humidity}
                  onChange={(e) => setHumidity(Number(e.target.value))}
                  className="w-full bg-white border border-border-soft rounded-lg px-3 py-2 text-slate-900 font-bold focus:border-amber-500 outline-none"
                />
                <span className="text-[10px] text-slate-400">Indoor psychrometric state</span>
              </div>

              <div>
                <label className="text-slate-600 block mb-1">Occupancy (Persons):</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={occupancy}
                  onChange={(e) => setOccupancy(Number(e.target.value))}
                  className="w-full bg-white border border-border-soft rounded-lg px-3 py-2 text-slate-900 font-bold focus:border-amber-500 outline-none"
                />
                <span className="text-[10px] text-slate-400">100 W/person sensible load</span>
              </div>
            </div>
          </div>
        </div>

        {/* Calculation Summary Preview Card */}
        <div className="bg-slate-50 p-4 rounded-xl border border-border-soft font-mono text-xs space-y-3">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
            <span>Mode B Sinusoidal Power Preview</span>
            <span className="text-blue-700 text-[11px] font-bold">P = V · I · PF | S = V · I | Q = √(S² − P²)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-white rounded-lg border border-border-soft">
              <span className="text-slate-500 text-[10px] block font-semibold">REAL POWER (P)</span>
              <span className="text-blue-700 font-bold text-base mt-0.5">{(calcRealP / 1000).toFixed(2)} kW</span>
              <span className="text-slate-400 text-[10px] block">{calcRealP.toFixed(0)} W</span>
            </div>

            <div className="p-3 bg-white rounded-lg border border-border-soft">
              <span className="text-slate-500 text-[10px] block font-semibold">APPARENT POWER (S)</span>
              <span className="text-slate-800 font-bold text-base mt-0.5">{(calcApparentS / 1000).toFixed(2)} kVA</span>
              <span className="text-slate-400 text-[10px] block">{calcApparentS.toFixed(0)} VA</span>
            </div>

            <div className="p-3 bg-white rounded-lg border border-border-soft">
              <span className="text-slate-500 text-[10px] block font-semibold">REACTIVE POWER (Q)</span>
              <span className="text-amber-700 font-bold text-base mt-0.5">{(calcReactiveQ / 1000).toFixed(2)} kVAR</span>
              <span className="text-slate-400 text-[10px] block">{calcReactiveQ.toFixed(0)} VAR</span>
            </div>

            <div className="p-3 bg-white rounded-lg border border-border-soft">
              <span className="text-slate-500 text-[10px] block font-semibold">POWER FACTOR</span>
              <span className="text-emerald-700 font-bold text-base mt-0.5">{PF.toFixed(2)}</span>
              <span className="text-slate-400 text-[10px] block">Lagging</span>
            </div>
          </div>
        </div>

        {/* Action Button & Toast */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          {successToast ? (
            <div className="flex items-center space-x-2 text-emerald-700 text-xs font-mono animate-in fade-in">
              <CheckCircle className="w-4 h-4" />
              <span>{successToast}</span>
            </div>
          ) : (
            <span className="text-xs font-mono text-slate-500">
              Click Apply to commit manual sensor values to the central simulation engine.
            </span>
          )}

          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleApplyInput('MODE_A_APPLIANCE')}
              className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-800 border border-border-soft hover:bg-slate-200 font-mono text-xs font-bold transition-all"
            >
              APPLY IN MODE A
            </button>
            <button
              onClick={() => handleApplyInput('MODE_B_MANUAL_ELECTRICAL')}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-mono text-xs font-extrabold shadow-xs transition-all"
            >
              APPLY INPUT & SWITCH TO MODE B
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
