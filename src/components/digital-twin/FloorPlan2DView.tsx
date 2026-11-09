import React from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { FloorId, RoomId, RoomState } from '../../types';
import {
  Thermometer,
  Droplets,
  Zap,
  Activity,
  Layers,
  Cpu,
  Monitor,
  Flame,
  CheckCircle2,
} from 'lucide-react';

interface FloorPlan2DViewProps {
  onSelectRoom?: (roomId: RoomId) => void;
}

export const FloorPlan2DView: React.FC<FloorPlan2DViewProps> = ({ onSelectRoom }) => {
  const { rooms, activeFloorView, setActiveFloorView, setSelectedRoomId } = useSimulation();

  const floorRooms = rooms.filter((r) => r.floor === activeFloorView);

  const getStatusBorder = (status: RoomState['status']) => {
    switch (status) {
      case 'low':
        return 'border-emerald-200 bg-emerald-50/40 hover:border-emerald-400 hover:shadow-sm';
      case 'normal':
        return 'border-blue-200 bg-blue-50/30 hover:border-blue-400 hover:shadow-sm';
      case 'high':
        return 'border-amber-300 bg-amber-50/50 hover:border-amber-500 hover:shadow-sm';
      case 'critical':
        return 'border-rose-300 bg-rose-50/60 hover:border-rose-500 shadow-sm animate-pulse';
    }
  };

  const getStatusBadge = (status: RoomState['status']) => {
    switch (status) {
      case 'low':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'normal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'high':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'critical':
        return 'bg-rose-100 text-rose-800 border-rose-300';
    }
  };

  const classrooms = floorRooms.filter((r) => r.type === 'classroom');
  const circuitLab = floorRooms.find((r) => r.type === 'circuit_lab');
  const progLab = floorRooms.find((r) => r.type === 'programming_lab');

  const handleRoomClick = (roomId: RoomId) => {
    setSelectedRoomId(roomId);
    if (onSelectRoom) onSelectRoom(roomId);
  };

  return (
    <div className="bg-white border border-border-soft rounded-xl p-5 shadow-xs select-none">
      {/* Floor Plan Header & Switcher */}
      <div className="flex flex-wrap items-center justify-between pb-4 border-b border-border-soft gap-y-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
              <span>Interactive Architectural Twin</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 font-medium">
                Floor {activeFloorView}
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Click any room zone to open its appliance switchboard & parameters
            </p>
          </div>
        </div>

        {/* Floor Selection Buttons */}
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-lg border border-border-soft text-xs font-mono">
          <button
            onClick={() => setActiveFloorView(1)}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              activeFloorView === 1
                ? 'bg-white text-blue-700 shadow-xs border border-border-soft'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            FIRST FLOOR
          </button>
          <button
            onClick={() => setActiveFloorView(2)}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              activeFloorView === 2
                ? 'bg-white text-blue-700 shadow-xs border border-border-soft'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            SECOND FLOOR
          </button>
        </div>
      </div>

      {/* Visual Architectural Layout Grid */}
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: 3 Classrooms (Takes 6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="text-[11px] font-mono font-bold tracking-wider text-slate-500 uppercase flex items-center space-x-2">
            <span>Academic Wing (Classrooms)</span>
            <div className="h-px flex-1 bg-border-soft" />
          </div>

          <div className="space-y-3.5">
            {classrooms.map((room) => (
              <div
                key={room.id}
                onClick={() => handleRoomClick(room.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer relative group ${getStatusBorder(
                  room.status
                )}`}
              >
                {/* Header line */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-sm group-hover:text-blue-700 transition-colors">
                      {room.name}
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-border-soft">
                      SIMULATED
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${getStatusBadge(
                      room.status
                    )}`}
                  >
                    {room.status}
                  </span>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono mt-3">
                  <div className="bg-slate-50 p-2 rounded-lg border border-border-soft">
                    <div className="text-[10px] text-slate-500 flex items-center space-x-1">
                      <Zap className="w-3 h-3 text-blue-600" />
                      <span>DEMAND</span>
                    </div>
                    <div className="text-blue-700 font-bold text-sm mt-0.5">
                      {room.currentPowerKW.toFixed(2)} kW
                    </div>
                    <div className="text-[10px] text-slate-400">of {room.connectedLoadKW} kW</div>
                  </div>

                  <div className="bg-slate-50 p-2 rounded-lg border border-border-soft">
                    <div className="text-[10px] text-slate-500 flex items-center space-x-1">
                      <Activity className="w-3 h-3 text-emerald-600" />
                      <span>ENERGY</span>
                    </div>
                    <div className="text-emerald-700 font-bold text-sm mt-0.5">
                      {room.dailyEnergyKWh.toFixed(1)} kWh
                    </div>
                    <div className="text-[10px] text-slate-400">Today</div>
                  </div>

                  <div className="bg-slate-50 p-2 rounded-lg border border-border-soft">
                    <div className="text-[10px] text-slate-500 flex items-center space-x-1">
                      <Thermometer className="w-3 h-3 text-amber-600" />
                      <span>TEMP</span>
                    </div>
                    <div className="text-amber-700 font-bold text-sm mt-0.5">
                      {room.envParams.indoorTemp.toFixed(1)} °C
                    </div>
                    <div className="text-[10px] text-slate-400">{room.envParams.relativeHumidity}% RH</div>
                  </div>

                  <div className="bg-slate-50 p-2 rounded-lg border border-border-soft">
                    <div className="text-[10px] text-slate-500 flex items-center space-x-1">
                      <Layers className="w-3 h-3 text-indigo-600" />
                      <span>ACTIVE</span>
                    </div>
                    <div className="text-indigo-700 font-bold text-sm mt-0.5">
                      {room.activeApplianceCount} / {room.totalApplianceCount}
                    </div>
                    <div className="text-[10px] text-slate-400">Appliances</div>
                  </div>
                </div>

                {/* Sub-bar showing mode and quick occupancy */}
                <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>Occupancy: {room.envParams.occupancy} students</span>
                  <span className="text-blue-600 group-hover:underline font-medium">Configure Switches →</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: 2 Advanced Laboratories (Takes 6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="text-[11px] font-mono font-bold tracking-wider text-slate-500 uppercase flex items-center space-x-2">
            <span>Specialized Laboratory Facilities</span>
            <div className="h-px flex-1 bg-border-soft" />
          </div>

          {/* Circuit Analysis Lab */}
          {circuitLab && (
            <div
              onClick={() => handleRoomClick(circuitLab.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer relative group ${getStatusBorder(
                circuitLab.status
              )}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-900 text-base group-hover:text-blue-700 transition-colors">
                    {circuitLab.name}
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                    HEAVY LAB
                  </span>
                </div>

                <span
                  className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${getStatusBadge(
                    circuitLab.status
                  )}`}
                >
                  {circuitLab.status}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono mt-3">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-border-soft">
                  <div className="text-[10px] text-slate-500 flex items-center space-x-1">
                    <Zap className="w-3 h-3 text-blue-600" />
                    <span>DEMAND</span>
                  </div>
                  <div className="text-blue-700 font-bold text-sm mt-0.5">
                    {circuitLab.currentPowerKW.toFixed(2)} kW
                  </div>
                  <div className="text-[10px] text-slate-400">Cap: {circuitLab.connectedLoadKW} kW</div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-border-soft">
                  <div className="text-[10px] text-slate-500 flex items-center space-x-1">
                    <Activity className="w-3 h-3 text-emerald-600" />
                    <span>ENERGY</span>
                  </div>
                  <div className="text-emerald-700 font-bold text-sm mt-0.5">
                    {circuitLab.dailyEnergyKWh.toFixed(1)} kWh
                  </div>
                  <div className="text-[10px] text-slate-400">Accumulated</div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-border-soft">
                  <div className="text-[10px] text-slate-500 flex items-center space-x-1">
                    <Thermometer className="w-3 h-3 text-amber-600" />
                    <span>TEMP</span>
                  </div>
                  <div className="text-amber-700 font-bold text-sm mt-0.5">
                    {circuitLab.envParams.indoorTemp.toFixed(1)} °C
                  </div>
                  <div className="text-[10px] text-slate-400">Target: {circuitLab.physics.targetSetpointTemp}°C</div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-border-soft">
                  <div className="text-[10px] text-slate-500 flex items-center space-x-1">
                    <Cpu className="w-3 h-3 text-indigo-600" />
                    <span>ACs & SOCKET</span>
                  </div>
                  <div className="text-indigo-700 font-bold text-sm mt-0.5">
                    {circuitLab.activeApplianceCount} Active
                  </div>
                  <div className="text-[10px] text-slate-400">2x AC + Sockets</div>
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>
                  AC 1:{' '}
                  <b className="text-blue-700">
                    {circuitLab.appliances.type === 'circuit_lab' ? circuitLab.appliances.data.acUnits[0] : ''}
                  </b>{' '}
                  | AC 2:{' '}
                  <b className="text-blue-700">
                    {circuitLab.appliances.type === 'circuit_lab' ? circuitLab.appliances.data.acUnits[1] : ''}
                  </b>
                </span>
                <span className="text-blue-600 group-hover:underline font-medium">Open Lab Controls →</span>
              </div>
            </div>
          )}

          {/* C Programming Lab */}
          {progLab && (
            <div
              onClick={() => handleRoomClick(progLab.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer relative group ${getStatusBorder(
                progLab.status
              )}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-900 text-base group-hover:text-blue-700 transition-colors">
                    {progLab.name}
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                    COMPUTER LAB (32 PCs)
                  </span>
                </div>

                <span
                  className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${getStatusBadge(
                    progLab.status
                  )}`}
                >
                  {progLab.status}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono mt-3">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-border-soft">
                  <div className="text-[10px] text-slate-500 flex items-center space-x-1">
                    <Zap className="w-3 h-3 text-blue-600" />
                    <span>DEMAND</span>
                  </div>
                  <div className="text-blue-700 font-bold text-sm mt-0.5">
                    {progLab.currentPowerKW.toFixed(2)} kW
                  </div>
                  <div className="text-[10px] text-slate-400">Cap: {progLab.connectedLoadKW} kW</div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-border-soft">
                  <div className="text-[10px] text-slate-500 flex items-center space-x-1">
                    <Activity className="w-3 h-3 text-emerald-600" />
                    <span>ENERGY</span>
                  </div>
                  <div className="text-emerald-700 font-bold text-sm mt-0.5">
                    {progLab.dailyEnergyKWh.toFixed(1)} kWh
                  </div>
                  <div className="text-[10px] text-slate-400">Accumulated</div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-border-soft">
                  <div className="text-[10px] text-slate-500 flex items-center space-x-1">
                    <Monitor className="w-3 h-3 text-indigo-600" />
                    <span>DESKTOPS</span>
                  </div>
                  <div className="text-indigo-700 font-bold text-sm mt-0.5">
                    {progLab.appliances.type === 'programming_lab'
                      ? progLab.appliances.data.desktops.filter(Boolean).length
                      : 0}{' '}
                    / 32
                  </div>
                  <div className="text-[10px] text-slate-400">Active Workstations</div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-border-soft">
                  <div className="text-[10px] text-slate-500 flex items-center space-x-1">
                    <Thermometer className="w-3 h-3 text-amber-600" />
                    <span>TEMP</span>
                  </div>
                  <div className="text-amber-700 font-bold text-sm mt-0.5">
                    {progLab.envParams.indoorTemp.toFixed(1)} °C
                  </div>
                  <div className="text-[10px] text-slate-400">Target: {progLab.physics.targetSetpointTemp}°C</div>
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>
                  ACs:{' '}
                  <b className="text-blue-700">
                    {progLab.appliances.type === 'programming_lab'
                      ? `${progLab.appliances.data.acUnits[0]} / ${progLab.appliances.data.acUnits[1]}`
                      : ''}
                  </b>
                </span>
                <span className="text-blue-600 group-hover:underline font-medium">Open Computer Lab Switches →</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
