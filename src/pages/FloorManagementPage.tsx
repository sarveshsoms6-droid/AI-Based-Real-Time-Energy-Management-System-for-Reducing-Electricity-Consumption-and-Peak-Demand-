import React from 'react';
import { useSimulation } from '../context/SimulationContext';
import { FloorId, RoomState } from '../types';
import {
  Layers,
  Zap,
  Activity,
  Thermometer,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Power,
} from 'lucide-react';

export const FloorManagementPage: React.FC = () => {
  const { rooms, aggregates, setSelectedRoomId, executeGroupAction } = useSimulation();

  const floor1Rooms = rooms.filter((r) => r.floor === 1);
  const floor2Rooms = rooms.filter((r) => r.floor === 2);

  const renderFloorSummary = (floorNum: FloorId, floorRooms: RoomState[]) => {
    let demand = 0;
    let connected = 0;
    let dailyEnergy = 0;
    let activeAppliances = 0;
    let totalAppliances = 0;

    floorRooms.forEach((r) => {
      demand += r.currentPowerKW;
      connected += r.connectedLoadKW;
      dailyEnergy += r.dailyEnergyKWh;
      activeAppliances += r.activeApplianceCount;
      totalAppliances += r.totalApplianceCount;
    });

    const isF1 = floorNum === 1;

    return (
      <div className="bg-white border border-border-soft rounded-2xl p-6 shadow-xs space-y-6">
        {/* Floor Header */}
        <div className="flex flex-wrap items-center justify-between pb-4 border-b border-border-soft gap-y-2">
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg font-mono ${
                isF1
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
              }`}
            >
              F{floorNum}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-wide">
                {isF1 ? 'First Floor Monitored Wing' : 'Second Floor Monitored Wing'}
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                5 Zones: 3 Classrooms + 1 Circuit Lab + 1 C Programming Lab
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs font-mono">
            <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-border-soft text-right">
              <span className="text-slate-500 text-[10px] block font-semibold">FLOOR DEMAND</span>
              <span className="text-blue-700 font-bold text-sm">{demand.toFixed(2)} kW</span>
            </div>
            <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-border-soft text-right">
              <span className="text-slate-500 text-[10px] block font-semibold">CONNECTED</span>
              <span className="text-slate-700 font-bold text-sm">{connected.toFixed(1)} kW</span>
            </div>
          </div>
        </div>

        {/* Quick Floor Stats */}
        <div className="grid grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 bg-slate-50 rounded-xl border border-border-soft">
            <div className="text-[10px] text-slate-500 font-semibold">DAILY ENERGY</div>
            <div className="text-emerald-700 font-bold text-base mt-1">{dailyEnergy.toFixed(1)} kWh</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-border-soft">
            <div className="text-[10px] text-slate-500 font-semibold">ACTIVE LOADS</div>
            <div className="text-blue-700 font-bold text-base mt-1">
              {activeAppliances} / {totalAppliances}
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-border-soft">
            <div className="text-[10px] text-slate-500 font-semibold">CAPACITY RATIO</div>
            <div className="text-amber-700 font-bold text-base mt-1">
              {((demand / connected) * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Room List in Floor */}
        <div className="space-y-2.5">
          <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
            Floor {floorNum} Monitored Rooms
          </div>

          <div className="space-y-2">
            {floorRooms.map((room) => (
              <div
                key={room.id}
                onClick={() => setSelectedRoomId(room.id)}
                className="p-3.5 rounded-xl bg-slate-50/70 border border-border-soft hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      room.status === 'critical'
                        ? 'bg-rose-500'
                        : room.status === 'high'
                        ? 'bg-amber-500'
                        : room.status === 'normal'
                        ? 'bg-blue-500'
                        : 'bg-emerald-500'
                    }`}
                  />
                  <div>
                    <div className="font-bold text-slate-900 text-xs group-hover:text-blue-700 transition-colors">
                      {room.name}
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">
                      {room.type === 'classroom'
                        ? 'Standard Classroom'
                        : room.type === 'circuit_lab'
                        ? 'Heavy Circuit Lab'
                        : 'Computer Lab (32 Workstations)'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-6 text-xs font-mono">
                  <div className="text-right">
                    <span className="text-blue-700 font-bold">{room.currentPowerKW.toFixed(2)} kW</span>
                    <span className="text-[10px] text-slate-400 block">of {room.connectedLoadKW} kW</span>
                  </div>

                  <div className="text-right hidden sm:block">
                    <span className="text-amber-700 font-semibold">{room.envParams.indoorTemp.toFixed(1)} °C</span>
                    <span className="text-[10px] text-slate-400 block">{room.envParams.relativeHumidity}% RH</span>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2.5">
          <Layers className="w-5 h-5 text-blue-600" />
          <span>Floor Management & Aggregation</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Comparative feeder analysis between First Floor (18.9 kW connected) and Second Floor (18.9 kW connected)
        </p>
      </div>

      {/* Side-by-Side Floor Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderFloorSummary(1, floor1Rooms)}
        {renderFloorSummary(2, floor2Rooms)}
      </div>
    </div>
  );
};
