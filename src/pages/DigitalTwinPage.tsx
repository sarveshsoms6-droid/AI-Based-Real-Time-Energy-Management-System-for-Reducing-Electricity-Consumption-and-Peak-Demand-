import React, { useState } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { Building3DView } from '../components/digital-twin/Building3DView';
import { FloorPlan2DView } from '../components/digital-twin/FloorPlan2DView';
import { Box, Layers, Zap, Info, ShieldCheck, Cpu } from 'lucide-react';
import { RoomId } from '../types';

export const DigitalTwinPage: React.FC = () => {
  const { rooms, aggregates, setSelectedRoomId } = useSimulation();
  const [viewMode, setViewMode] = useState<'3d' | '2d' | 'both'>('both');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2.5">
            <Box className="w-5 h-5 text-blue-600" />
            <span>Building Digital Twin (Two-Floor Educational Institution)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Spatial 3D mesh rendering & architectural schematic with live status colors, telemetry flow, and direct room interaction
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl border border-border-soft text-xs font-mono">
          <button
            onClick={() => setViewMode('both')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'both' ? 'bg-white text-blue-700 font-bold shadow-2xs border border-border-soft' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Split View (3D + 2D)
          </button>
          <button
            onClick={() => setViewMode('3d')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === '3d' ? 'bg-white text-blue-700 font-bold shadow-2xs border border-border-soft' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            3D Spatial Twin
          </button>
          <button
            onClick={() => setViewMode('2d')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === '2d' ? 'bg-white text-blue-700 font-bold shadow-2xs border border-border-soft' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            2D Floor Plans
          </button>
        </div>
      </div>

      {/* Simulation Architecture Notice */}
      <div className="p-3 bg-slate-50 border border-border-soft rounded-xl flex items-center justify-between text-xs font-mono text-slate-600">
        <div className="flex items-center space-x-2.5">
          <Info className="w-4 h-4 text-blue-600" />
          <span>
            <b>SOFTWARE-SIMULATED DIGITAL TWIN:</b> 10 monitored spaces across 2 floors. All branch circuits calculated dynamically.
          </span>
        </div>
        <div className="hidden md:flex items-center space-x-2 text-blue-700 font-semibold">
          <span>Connected Load: {aggregates.totalConnectedLoadKW} kW</span>
          <span>|</span>
          <span>Operating: {aggregates.currentBuildingDemandKW.toFixed(2)} kW</span>
        </div>
      </div>

      {/* Dynamic Views */}
      {viewMode === 'both' ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-6 space-y-4">
            <div className="text-xs font-mono font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-2">
              <Box className="w-4 h-4 text-blue-600" />
              <span>3D Spatial Isometric Rendering</span>
            </div>
            <Building3DView onSelectRoom={(id) => setSelectedRoomId(id)} />
          </div>

          <div className="xl:col-span-6 space-y-4">
            <div className="text-xs font-mono font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Architectural Floor Schematic</span>
            </div>
            <FloorPlan2DView onSelectRoom={(id) => setSelectedRoomId(id)} />
          </div>
        </div>
      ) : viewMode === '3d' ? (
        <div className="space-y-4">
          <Building3DView onSelectRoom={(id) => setSelectedRoomId(id)} />
        </div>
      ) : (
        <div className="space-y-4">
          <FloorPlan2DView onSelectRoom={(id) => setSelectedRoomId(id)} />
        </div>
      )}
    </div>
  );
};
