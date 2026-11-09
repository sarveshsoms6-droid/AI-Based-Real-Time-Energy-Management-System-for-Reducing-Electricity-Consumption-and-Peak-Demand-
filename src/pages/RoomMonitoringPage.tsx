import React, { useState } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { RoomId, RoomType, FloorId } from '../types';
import {
  Sliders,
  Zap,
  Activity,
  Thermometer,
  Layers,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Settings,
  Power,
} from 'lucide-react';

export const RoomMonitoringPage: React.FC = () => {
  const { rooms, setSelectedRoomId, executeGroupAction } = useSimulation();

  const [floorFilter, setFloorFilter] = useState<'all' | '1' | '2'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | RoomType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRooms = rooms.filter((r) => {
    if (floorFilter !== 'all' && r.floor.toString() !== floorFilter) return false;
    if (typeFilter !== 'all' && r.type !== typeFilter) return false;
    if (searchQuery && !r.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2.5">
            <Sliders className="w-5 h-5 text-blue-600" />
            <span>Room Monitoring & Control Matrix</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time branch circuit telemetry, appliance states, and environmental sensors across all 10 spaces
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter rooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-border-soft rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 outline-none w-36 sm:w-48 shadow-2xs"
            />
          </div>

          {/* Floor */}
          <div className="flex bg-slate-100 border border-border-soft p-1 rounded-lg">
            <button
              onClick={() => setFloorFilter('all')}
              className={`px-2.5 py-1 rounded transition-all ${
                floorFilter === 'all' ? 'bg-white text-blue-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Floors
            </button>
            <button
              onClick={() => setFloorFilter('1')}
              className={`px-2.5 py-1 rounded transition-all ${
                floorFilter === '1' ? 'bg-white text-blue-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              F1
            </button>
            <button
              onClick={() => setFloorFilter('2')}
              className={`px-2.5 py-1 rounded transition-all ${
                floorFilter === '2' ? 'bg-white text-blue-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              F2
            </button>
          </div>

          {/* Type */}
          <div className="flex bg-slate-100 border border-border-soft p-1 rounded-lg">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-2.5 py-1 rounded transition-all ${
                typeFilter === 'all' ? 'bg-white text-blue-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setTypeFilter('classroom')}
              className={`px-2.5 py-1 rounded transition-all ${
                typeFilter === 'classroom' ? 'bg-white text-blue-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Classrooms
            </button>
            <button
              onClick={() => setTypeFilter('circuit_lab')}
              className={`px-2.5 py-1 rounded transition-all ${
                typeFilter === 'circuit_lab' ? 'bg-white text-blue-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Circuit Labs
            </button>
            <button
              onClick={() => setTypeFilter('programming_lab')}
              className={`px-2.5 py-1 rounded transition-all ${
                typeFilter === 'programming_lab' ? 'bg-white text-blue-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Prog Labs
            </button>
          </div>
        </div>
      </div>

      {/* Room Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredRooms.map((room) => {
          const loadRatio = room.connectedLoadKW > 0 ? (room.currentPowerKW / room.connectedLoadKW) * 100 : 0;

          return (
            <div
              key={room.id}
              className="bg-white border border-border-soft rounded-2xl p-5 shadow-xs space-y-4 hover:border-blue-400 transition-all flex flex-col justify-between"
            >
              {/* Room Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-base">{room.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-border-soft">
                      Floor {room.floor}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-slate-500 mt-0.5">
                    Mode:{' '}
                    <span className="text-blue-700 font-semibold">
                      {room.calculationMode === 'MODE_A_APPLIANCE' ? 'Appliance Simulation' : 'Manual Electrical Input'}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                    room.status === 'critical'
                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                      : room.status === 'high'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : room.status === 'normal'
                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  }`}
                >
                  {room.status}
                </span>
              </div>

              {/* Demand & Progress Bar */}
              <div className="space-y-1.5 font-mono">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Demand:</span>
                  <span className="text-blue-700 font-bold text-sm">
                    {room.currentPowerKW.toFixed(2)} kW{' '}
                    <span className="text-[11px] font-normal text-slate-400">/ {room.connectedLoadKW} kW</span>
                  </span>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-border-soft">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      loadRatio > 90
                        ? 'bg-rose-500'
                        : loadRatio > 75
                        ? 'bg-amber-500'
                        : loadRatio > 25
                        ? 'bg-blue-600'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(2, loadRatio))}%` }}
                  />
                </div>
              </div>

              {/* Telemetry Matrix */}
              <div className="grid grid-cols-3 gap-2 text-xs font-mono bg-slate-50 p-3 rounded-xl border border-border-soft">
                <div>
                  <span className="text-[10px] text-slate-500 block font-semibold">VOLTAGE</span>
                  <span className="text-slate-800 font-bold">{room.manualParams.voltage} V</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-semibold">CURRENT</span>
                  <span className="text-slate-800 font-bold">{room.manualParams.current} A</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-semibold">POWER FACTOR</span>
                  <span className="text-blue-700 font-bold">{room.manualParams.powerFactor.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-semibold">TEMPERATURE</span>
                  <span className="text-amber-700 font-bold">{room.envParams.indoorTemp.toFixed(1)} °C</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-semibold">HUMIDITY</span>
                  <span className="text-slate-700 font-bold">{room.envParams.relativeHumidity}% RH</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-semibold">ACTIVE LOADS</span>
                  <span className="text-indigo-700 font-bold">
                    {room.activeApplianceCount} / {room.totalApplianceCount}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 pt-2 border-t border-border-soft text-xs font-mono">
                <button
                  onClick={() => setSelectedRoomId(room.id)}
                  className="flex-1 py-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 font-semibold transition-all text-center flex items-center justify-center space-x-1.5"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Configure Switches</span>
                </button>
                <button
                  onClick={() => executeGroupAction(room.id, 'switch_all_off')}
                  title="Switch All Appliances OFF in this room"
                  className="p-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-all"
                >
                  <Power className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
