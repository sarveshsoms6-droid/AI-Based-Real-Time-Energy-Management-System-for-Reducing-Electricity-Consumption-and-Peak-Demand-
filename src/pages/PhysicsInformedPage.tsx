import React, { useState } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { RoomId } from '../types';
import { generateThermalResponseCurve } from '../engine/physicsEngine';
import {
  Cpu,
  Thermometer,
  Flame,
  Wind,
  Layers,
  Sparkles,
  Info,
  ShieldCheck,
  Activity,
  ArrowRight,
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

export const PhysicsInformedPage: React.FC = () => {
  const { rooms, updateEnvParams } = useSimulation();

  const [selectedRoomId, setSelectedRoomId] = useState<RoomId>('cp_lab1');
  const [acForcedMode, setAcForcedMode] = useState<boolean>(false);

  const room = rooms.find((r) => r.id === selectedRoomId) || rooms[0];

  const thermalCurveData = generateThermalResponseCurve(room, acForcedMode);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2.5">
            <Cpu className="w-5 h-5 text-blue-600" />
            <span>Physics-Informed Thermal Energy Balance Engine</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            First-principles differential thermal mass modeling coupled with empirical machine-learning residual error correction
          </p>
        </div>

        {/* Room Switcher */}
        <div className="flex items-center space-x-3 text-xs font-mono">
          <span className="text-slate-500">Select Space:</span>
          <select
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value as RoomId)}
            className="bg-white border border-border-soft rounded-lg px-3 py-2 text-slate-900 font-bold focus:border-blue-500 outline-none shadow-2xs"
          >
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.type})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Governing Equations Card */}
      <div className="bg-white border border-border-soft rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border-soft pb-3">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
            <Thermometer className="w-4 h-4 text-blue-600" />
            <span>First-Principles Room Thermal Mass Differential Formulation</span>
          </div>
          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-mono font-semibold">
            DISCRETE EULER INTEGRATOR
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono">
          <div className="p-4 bg-slate-50 rounded-xl border border-border-soft space-y-2">
            <span className="text-slate-600 block text-[11px] font-bold">1. CONTINUOUS GOVERNING EQUATION:</span>
            <div className="text-blue-700 text-base font-extrabold py-1">
              C · (dT / dt) = Q_internal + Q_external − Q_cooling
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Where <b>C</b> is effective room thermal capacitance (J/K), <b>Q_internal</b> is heat dissipation from occupants,
              computers, and ballasts, <b>Q_external = UA · (T_outdoor − T_indoor)</b>, and <b>Q_cooling = COP × P_AC</b>.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-border-soft space-y-2">
            <span className="text-blue-700 block text-[11px] font-bold">2. HYBRID PHYSICS + ML FORMULATION:</span>
            <div className="text-slate-900 text-base font-extrabold py-1">
              T_hybrid(t + Δt) = T_physics(t + Δt) + ML_residual_correction
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Combines white-box thermodynamic energy conservation with a demonstration ML residual corrector
              capturing non-linear solar radiation, thermal air stratification, and humidity coupling.
            </p>
          </div>
        </div>
      </div>

      {/* Live Room Thermodynamic State (KPIs) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-xs">
        <div className="p-3 bg-white border border-border-soft rounded-xl shadow-xs">
          <div className="text-[10px] text-slate-500 font-semibold">INDOOR TEMP</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{room.envParams.indoorTemp.toFixed(1)} °C</div>
          <div className="text-[10px] text-slate-400">Live Space Temp</div>
        </div>

        <div className="p-3 bg-white border border-border-soft rounded-xl shadow-xs">
          <div className="text-[10px] text-slate-500 font-semibold">PHYSICS ONLY</div>
          <div className="text-xl font-bold text-slate-700 mt-1">{room.physics.physicsTemp.toFixed(1)} °C</div>
          <div className="text-[10px] text-slate-400">Pure First-Principles</div>
        </div>

        <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-xl shadow-xs">
          <div className="text-[10px] text-blue-700 font-semibold">HYBRID PREDICTED</div>
          <div className="text-xl font-bold text-blue-800 mt-1">{room.physics.hybridTemp.toFixed(1)} °C</div>
          <div className="text-[10px] text-slate-500">
            Residual: {room.physics.mlResidual > 0 ? `+${room.physics.mlResidual}` : room.physics.mlResidual}°C
          </div>
        </div>

        <div className="p-3 bg-white border border-border-soft rounded-xl shadow-xs">
          <div className="text-[10px] text-amber-700 font-semibold">INTERNAL HEAT (Q_in)</div>
          <div className="text-xl font-bold text-amber-700 mt-1">{room.physics.qInternalW} W</div>
          <div className="text-[10px] text-slate-400">Occupants + Workstations</div>
        </div>

        <div className="p-3 bg-white border border-border-soft rounded-xl shadow-xs">
          <div className="text-[10px] text-rose-700 font-semibold">ENVELOPE HEAT (Q_ext)</div>
          <div className="text-xl font-bold text-rose-700 mt-1">{room.physics.qExternalW} W</div>
          <div className="text-[10px] text-slate-400">UA Envelope Conduction</div>
        </div>

        <div className="p-3 bg-white border border-border-soft rounded-xl shadow-xs">
          <div className="text-[10px] text-blue-700 font-semibold">COOLING REMOVED</div>
          <div className="text-xl font-bold text-blue-700 mt-1">{room.physics.qCoolingW} W</div>
          <div className="text-[10px] text-slate-400">Active HVAC Heat Pump</div>
        </div>
      </div>

      {/* Thermal Response Simulation Chart */}
      <div className="bg-white border border-border-soft rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-y-2">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <span>Simulated 12-Hour Diurnal Thermal Response Curve ({room.name})</span>
            </h3>
            <p className="text-xs text-slate-500">
              Transient indoor temperature trajectory under changing diurnal solar irradiation and occupancy heat dissipation
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs font-mono">
            <button
              onClick={() => setAcForcedMode(!acForcedMode)}
              className={`px-3 py-1.5 rounded-lg border transition-all ${
                acForcedMode
                  ? 'bg-blue-600 text-white font-bold shadow-xs border-blue-600'
                  : 'bg-slate-100 text-slate-600 border-border-soft hover:text-slate-900'
              }`}
            >
              {acForcedMode ? 'AC Cooling Forced Full ON' : 'Default AC Schedule'}
            </button>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={thermalCurveData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
              <YAxis
                yAxisId="temp"
                domain={[20, 36]}
                stroke="#64748b"
                tick={{ fontSize: 11, fontFamily: 'monospace' }}
                unit=" °C"
              />
              <YAxis
                yAxisId="demand"
                orientation="right"
                stroke="#d97706"
                tick={{ fontSize: 11, fontFamily: 'monospace' }}
                unit=" kW"
              />
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
              <Legend
                wrapperStyle={{
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  paddingTop: '10px',
                }}
              />
              <Line
                yAxisId="temp"
                type="monotone"
                dataKey="hybridTemp"
                stroke="#1d4ed8"
                strokeWidth={2.5}
                name="Hybrid Temp (°C)"
                dot={false}
              />
              <Line
                yAxisId="temp"
                type="monotone"
                dataKey="physicsTemp"
                stroke="#64748b"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                name="Physics-Only Temp (°C)"
                dot={false}
              />
              <Line
                yAxisId="demand"
                type="monotone"
                dataKey="coolingDemandKW"
                stroke="#d97706"
                strokeWidth={2}
                name="Required Cooling Demand (kW)"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Model Transparency Note */}
      <div className="p-4 bg-slate-50 border border-border-soft rounded-xl text-xs font-mono text-slate-600 space-y-1">
        <div className="flex items-center space-x-2 text-blue-800 font-bold">
          <Info className="w-4 h-4 text-blue-600" />
          <span>SCIENTIFIC TRANSPARENCY NOTICE</span>
        </div>
        <p className="leading-relaxed">
          The ML residual model utilized in this demonstration is a demonstration residual estimator calibrated to simulate
          humidity enthalpy shifts, structural thermal time constants, and envelope infiltration. In accordance with ethical
          engineering guidelines, it is not claimed to be a physically field-validated neural network on live physical sensors.
        </p>
      </div>
    </div>
  );
};
