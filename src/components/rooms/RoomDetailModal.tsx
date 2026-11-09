import React, { useState } from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { RoomId, ACMode, CalculationMode } from '../../types';
import {
  X,
  Lightbulb,
  Fan,
  Tv,
  Monitor,
  Cpu,
  Power,
  Zap,
  Sliders,
  Settings2,
  Thermometer,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface RoomDetailModalProps {
  roomId: RoomId | null;
  onClose: () => void;
}

export const RoomDetailModal: React.FC<RoomDetailModalProps> = ({ roomId, onClose }) => {
  const {
    rooms,
    ratings,
    setCalculationMode,
    updateManualParams,
    updateEnvParams,
    toggleClassroomLight,
    toggleClassroomFan,
    toggleClassroomProjector,
    setCircuitLabAcMode,
    toggleCircuitLabLight,
    setCircuitLabSocket,
    setProgLabComputerCount,
    toggleProgLabDesktop,
    setProgLabAcMode,
    toggleProgLabLight,
    executeGroupAction,
  } = useSimulation();

  const [activeTab, setActiveTab] = useState<'appliances' | 'manual_electrical' | 'physics'>('appliances');

  if (!roomId) return null;

  const room = rooms.find((r) => r.id === roomId);
  if (!room) return null;

  const classroomData = room.appliances.type === 'classroom' ? room.appliances.data : null;
  const circuitLabData = room.appliances.type === 'circuit_lab' ? room.appliances.data : null;
  const progLabData = room.appliances.type === 'programming_lab' ? room.appliances.data : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs select-none animate-in fade-in duration-200">
      <div className="bg-white border border-border-soft rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border-soft flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h2 className="text-lg font-bold text-slate-900 tracking-wide">{room.name}</h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                  FLOOR {room.floor}
                </span>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                    room.status === 'critical'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : room.status === 'high'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : room.status === 'normal'
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {room.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                Connected Load: {room.connectedLoadKW} kW | Current Demand:{' '}
                <b className="text-blue-700">{room.currentPowerKW.toFixed(2)} kW</b>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Calculation Mode Toggle */}
            <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-lg border border-border-soft text-xs font-mono">
              <button
                onClick={() => setCalculationMode(room.id, 'MODE_A_APPLIANCE')}
                className={`px-2.5 py-1 rounded transition-all ${
                  room.calculationMode === 'MODE_A_APPLIANCE'
                    ? 'bg-white text-blue-700 font-bold shadow-xs border border-border-soft'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Appliance Sim
              </button>
              <button
                onClick={() => setCalculationMode(room.id, 'MODE_B_MANUAL_ELECTRICAL')}
                className={`px-2.5 py-1 rounded transition-all ${
                  room.calculationMode === 'MODE_B_MANUAL_ELECTRICAL'
                    ? 'bg-amber-500 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Manual Electrical
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white border border-border-soft text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center px-6 border-b border-border-soft bg-slate-50/50 space-x-6 text-xs font-mono">
          <button
            onClick={() => setActiveTab('appliances')}
            className={`py-3 border-b-2 font-semibold transition-all flex items-center space-x-2 ${
              activeTab === 'appliances'
                ? 'border-blue-600 text-blue-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Virtual Appliance Switches</span>
          </button>
          <button
            onClick={() => setActiveTab('manual_electrical')}
            className={`py-3 border-b-2 font-semibold transition-all flex items-center space-x-2 ${
              activeTab === 'manual_electrical'
                ? 'border-blue-600 text-blue-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Electrical & Environmental Console</span>
          </button>
          <button
            onClick={() => setActiveTab('physics')}
            className={`py-3 border-b-2 font-semibold transition-all flex items-center space-x-2 ${
              activeTab === 'physics'
                ? 'border-blue-600 text-blue-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Thermometer className="w-4 h-4" />
            <span>Thermal Physics Model</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: APPLIANCE CONTROL */}
          {activeTab === 'appliances' && (
            <div className="space-y-6">
              {/* Group Action Buttons */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-border-soft flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <span className="text-slate-500 font-semibold uppercase text-[11px]">Group Controls:</span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => executeGroupAction(room.id, 'switch_all_on')}
                    className="px-2.5 py-1 rounded bg-blue-100 text-blue-800 border border-blue-300 hover:bg-blue-200 transition-all font-semibold"
                  >
                    All ON
                  </button>
                  <button
                    onClick={() => executeGroupAction(room.id, 'switch_all_off')}
                    className="px-2.5 py-1 rounded bg-rose-100 text-rose-800 border border-rose-300 hover:bg-rose-200 transition-all font-semibold"
                  >
                    All OFF
                  </button>
                  <button
                    onClick={() => executeGroupAction(room.id, 'lights_on')}
                    className="px-2.5 py-1 rounded bg-white text-slate-700 border border-border-soft hover:bg-slate-100"
                  >
                    Lights ON
                  </button>
                  <button
                    onClick={() => executeGroupAction(room.id, 'lights_off')}
                    className="px-2.5 py-1 rounded bg-white text-slate-700 border border-border-soft hover:bg-slate-100"
                  >
                    Lights OFF
                  </button>
                  {room.type === 'classroom' && (
                    <>
                      <button
                        onClick={() => executeGroupAction(room.id, 'fans_on')}
                        className="px-2.5 py-1 rounded bg-white text-slate-700 border border-border-soft hover:bg-slate-100"
                      >
                        Fans ON
                      </button>
                      <button
                        onClick={() => executeGroupAction(room.id, 'fans_off')}
                        className="px-2.5 py-1 rounded bg-white text-slate-700 border border-border-soft hover:bg-slate-100"
                      >
                        Fans OFF
                      </button>
                    </>
                  )}
                  {(room.type === 'circuit_lab' || room.type === 'programming_lab') && (
                    <>
                      <button
                        onClick={() => executeGroupAction(room.id, 'ac_auto')}
                        className="px-2.5 py-1 rounded bg-indigo-100 text-indigo-800 border border-indigo-300 hover:bg-indigo-200 font-semibold"
                      >
                        AC AUTO
                      </button>
                      <button
                        onClick={() => executeGroupAction(room.id, 'ac_off')}
                        className="px-2.5 py-1 rounded bg-white text-slate-700 border border-border-soft hover:bg-slate-100"
                      >
                        AC OFF
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* CLASSROOM SWITCHES */}
              {classroomData && (
                <div className="space-y-6">
                  {/* Tube Lights (10) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs font-mono font-bold text-slate-700">
                        <Lightbulb className="w-4 h-4 text-blue-600" />
                        <span>TUBE LIGHTS (10 × {ratings.classroomTubeLightWatts} W)</span>
                      </div>
                      <span className="text-xs font-mono text-blue-700 font-bold">
                        {classroomData.tubeLights.filter(Boolean).length} / 10 Active
                      </span>
                    </div>

                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                      {classroomData.tubeLights.map((isOn, idx) => (
                        <button
                          key={`tl_${idx}`}
                          onClick={() => toggleClassroomLight(room.id, idx)}
                          className={`p-2.5 rounded-lg border text-center transition-all ${
                            isOn
                              ? 'bg-blue-50 border-blue-400 text-blue-800 shadow-xs font-bold'
                              : 'bg-slate-50 border-border-soft text-slate-400 hover:border-slate-300'
                          }`}
                        >
                          <Lightbulb className={`w-4 h-4 mx-auto mb-1 ${isOn ? 'text-amber-500 fill-current' : 'text-slate-400'}`} />
                          <div className="text-[10px] font-mono">L{idx + 1}</div>
                          <div className={`text-[9px] font-mono ${isOn ? 'text-blue-700 font-bold' : 'text-slate-400'}`}>{isOn ? 'ON' : 'OFF'}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Ceiling Fans (6) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs font-mono font-bold text-slate-700">
                        <Fan className="w-4 h-4 text-cyan-600" />
                        <span>CEILING FANS (6 × {ratings.classroomFanWatts} W)</span>
                      </div>
                      <span className="text-xs font-mono text-cyan-700 font-bold">
                        {classroomData.fans.filter(Boolean).length} / 6 Active
                      </span>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {classroomData.fans.map((isOn, idx) => (
                        <button
                          key={`fan_${idx}`}
                          onClick={() => toggleClassroomFan(room.id, idx)}
                          className={`p-3 rounded-lg border text-center transition-all ${
                            isOn
                              ? 'bg-cyan-50 border-cyan-400 text-cyan-800 shadow-xs font-bold'
                              : 'bg-slate-50 border-border-soft text-slate-400 hover:border-slate-300'
                          }`}
                        >
                          <Fan className={`w-5 h-5 mx-auto mb-1 ${isOn ? 'text-cyan-600 animate-spin' : 'text-slate-400'}`} />
                          <div className="text-[10px] font-mono">Fan {idx + 1}</div>
                          <div className={`text-[9px] font-mono ${isOn ? 'text-cyan-700 font-bold' : 'text-slate-400'}`}>{isOn ? 'ON' : 'OFF'}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Projector (1) */}
                  <div className="space-y-2">
                    <div className="text-xs font-mono font-bold text-slate-700 flex items-center space-x-2">
                      <Tv className="w-4 h-4 text-indigo-600" />
                      <span>PRESENTATION PROJECTOR (1 × {ratings.classroomProjectorWatts} W)</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-border-soft flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Tv className={`w-6 h-6 ${classroomData.projector ? 'text-indigo-600' : 'text-slate-400'}`} />
                        <div>
                          <div className="font-bold text-slate-900 text-sm">Classroom Overhead Projector</div>
                          <div className="text-[11px] font-mono text-slate-500">Essential teaching load</div>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleClassroomProjector(room.id)}
                        className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all ${
                          classroomData.projector
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white text-slate-600 border border-border-soft hover:bg-slate-100'
                        }`}
                      >
                        {classroomData.projector ? 'PROJECTOR ON (250 W)' : 'PROJECTOR OFF (0 W)'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* CIRCUIT ANALYSIS LAB SWITCHES */}
              {circuitLabData && (
                <div className="space-y-6">
                  {/* Air Conditioners (2) */}
                  <div className="space-y-2">
                    <div className="text-xs font-mono font-bold text-slate-700 flex items-center space-x-2">
                      <Cpu className="w-4 h-4 text-blue-600" />
                      <span>AIR CONDITIONERS (2 × {ratings.circuitLabAcWatts} W)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {circuitLabData.acUnits.map((mode, idx) => (
                        <div key={`ac_${idx}`} className="p-3.5 bg-slate-50 rounded-xl border border-border-soft space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 text-xs font-mono">Air Conditioner #{idx + 1}</span>
                            <span className="text-[10px] font-mono font-bold text-blue-700 uppercase">
                              Mode: {mode}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-1.5 font-mono text-xs">
                            {(['OFF', 'AUTO', 'ON'] as ACMode[]).map((m) => (
                              <button
                                key={m}
                                onClick={() => setCircuitLabAcMode(room.id, idx as 0 | 1, m)}
                                className={`py-1.5 rounded transition-all text-center font-bold ${
                                  mode === m
                                    ? m === 'ON'
                                      ? 'bg-blue-600 text-white shadow-xs'
                                      : m === 'AUTO'
                                      ? 'bg-indigo-600 text-white shadow-xs'
                                      : 'bg-rose-500 text-white shadow-xs'
                                    : 'bg-white text-slate-600 border border-border-soft hover:bg-slate-100'
                                }`}
                              >
                                {m}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Experimental Sockets (Adjustable) */}
                  <div className="space-y-2">
                    <div className="text-xs font-mono font-bold text-slate-700 flex items-center space-x-2">
                      <Power className="w-4 h-4 text-amber-600" />
                      <span>EXPERIMENTAL SOCKET GROUP (DIVERSIFIED LOAD)</span>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-border-soft space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-900 text-sm">Modular Circuit Test Benches</div>
                          <div className="text-xs font-mono text-slate-500">
                            Active Load:{' '}
                            <b className="text-amber-700">
                              {circuitLabData.socketActive ? circuitLabData.socketWatts : 0} W
                            </b>
                          </div>
                        </div>

                        <button
                          onClick={() => setCircuitLabSocket(room.id, !circuitLabData.socketActive)}
                          className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all ${
                            circuitLabData.socketActive
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'bg-white text-slate-600 border border-border-soft hover:bg-slate-100'
                          }`}
                        >
                          {circuitLabData.socketActive ? 'SOCKET GROUP ACTIVE' : 'SOCKET GROUP ISOLATED'}
                        </button>
                      </div>

                      {circuitLabData.socketActive && (
                        <div className="space-y-1 pt-2 border-t border-border-soft">
                          <div className="flex justify-between text-xs font-mono text-slate-600">
                            <span>Adjust Load Capacity:</span>
                            <span className="text-amber-700 font-bold">{circuitLabData.socketWatts} W</span>
                          </div>
                          <input
                            type="range"
                            min="200"
                            max="3000"
                            step="100"
                            value={circuitLabData.socketWatts}
                            onChange={(e) => setCircuitLabSocket(room.id, true, Number(e.target.value))}
                            className="w-full accent-amber-500 cursor-pointer"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tube Lights (10) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs font-mono font-bold text-slate-700">
                        <Lightbulb className="w-4 h-4 text-blue-600" />
                        <span>LABORATORY TUBE LIGHTS (10 × {ratings.circuitLabTubeLightWatts} W)</span>
                      </div>
                      <span className="text-xs font-mono text-blue-700 font-bold">
                        {circuitLabData.tubeLights.filter(Boolean).length} / 10 Active
                      </span>
                    </div>

                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                      {circuitLabData.tubeLights.map((isOn, idx) => (
                        <button
                          key={`ca_tl_${idx}`}
                          onClick={() => toggleCircuitLabLight(room.id, idx)}
                          className={`p-2.5 rounded-lg border text-center transition-all ${
                            isOn
                              ? 'bg-blue-50 border-blue-400 text-blue-800 shadow-xs font-bold'
                              : 'bg-slate-50 border-border-soft text-slate-400 hover:border-slate-300'
                          }`}
                        >
                          <Lightbulb className={`w-4 h-4 mx-auto mb-1 ${isOn ? 'text-amber-500 fill-current' : 'text-slate-400'}`} />
                          <div className="text-[10px] font-mono">L{idx + 1}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* C PROGRAMMING LAB SWITCHES */}
              {progLabData && (
                <div className="space-y-6">
                  {/* Desktops (32) with Slider & Individual Grid */}
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2 text-xs font-mono font-bold text-slate-700">
                        <Monitor className="w-4 h-4 text-indigo-600" />
                        <span>WORKSTATION COMPUTERS (32 × {ratings.progLabDesktopWatts} W = 4,800 W)</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setProgLabComputerCount(room.id, 0)}
                          className="px-2 py-0.5 rounded bg-white border border-border-soft text-[10px] font-mono text-slate-600 hover:text-slate-900"
                        >
                          All 0
                        </button>
                        <button
                          onClick={() => setProgLabComputerCount(room.id, 16)}
                          className="px-2 py-0.5 rounded bg-white border border-border-soft text-[10px] font-mono text-slate-600 hover:text-slate-900"
                        >
                          Half (16)
                        </button>
                        <button
                          onClick={() => setProgLabComputerCount(room.id, 32)}
                          className="px-2 py-0.5 rounded bg-white border border-border-soft text-[10px] font-mono text-slate-600 hover:text-slate-900"
                        >
                          Full (32)
                        </button>
                        <span className="text-xs font-mono text-blue-700 font-bold ml-1">
                          {progLabData.desktops.filter(Boolean).length} / 32 ON
                        </span>
                      </div>
                    </div>

                    {/* Quick Count Slider */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-border-soft space-y-1">
                      <div className="flex justify-between text-xs font-mono text-slate-600">
                        <span>Direct Active Workstation Count:</span>
                        <span className="text-blue-700 font-bold">
                          {progLabData.desktops.filter(Boolean).length} Desktops (
                          {(progLabData.desktops.filter(Boolean).length * ratings.progLabDesktopWatts) / 1000} kW)
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="32"
                        value={progLabData.desktops.filter(Boolean).length}
                        onChange={(e) => setProgLabComputerCount(room.id, Number(e.target.value))}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>

                    {/* Individual 32 Desktops Matrix */}
                    <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-16 gap-1.5 pt-1">
                      {progLabData.desktops.map((isOn, idx) => (
                        <button
                          key={`pc_${idx}`}
                          onClick={() => toggleProgLabDesktop(room.id, idx)}
                          title={`PC-${idx + 1}: ${isOn ? 'RUNNING (150 W)' : 'POWERED OFF'}`}
                          className={`p-1.5 rounded border text-center transition-all ${
                            isOn
                              ? 'bg-blue-100 border-blue-400 text-blue-800 shadow-xs font-bold'
                              : 'bg-slate-50 border-border-soft text-slate-400 hover:border-slate-300'
                          }`}
                        >
                          <Monitor className={`w-3.5 h-3.5 mx-auto ${isOn ? 'text-blue-700' : 'text-slate-400'}`} />
                          <div className="text-[9px] font-mono mt-0.5">{idx + 1}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Air Conditioners (2) */}
                  <div className="space-y-2">
                    <div className="text-xs font-mono font-bold text-slate-700 flex items-center space-x-2">
                      <Cpu className="w-4 h-4 text-blue-600" />
                      <span>LAB AIR CONDITIONERS (2 × {ratings.progLabAcWatts} W = 3,600 W)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {progLabData.acUnits.map((mode, idx) => (
                        <div key={`prog_ac_${idx}`} className="p-3.5 bg-slate-50 rounded-xl border border-border-soft space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 text-xs font-mono">Precision AC #{idx + 1}</span>
                            <span className="text-[10px] font-mono font-bold text-blue-700 uppercase">
                              Mode: {mode}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-1.5 font-mono text-xs">
                            {(['OFF', 'AUTO', 'ON'] as ACMode[]).map((m) => (
                              <button
                                key={m}
                                onClick={() => setProgLabAcMode(room.id, idx as 0 | 1, m)}
                                className={`py-1.5 rounded transition-all text-center font-bold ${
                                  mode === m
                                    ? m === 'ON'
                                      ? 'bg-blue-600 text-white shadow-xs'
                                      : m === 'AUTO'
                                      ? 'bg-indigo-600 text-white shadow-xs'
                                      : 'bg-rose-500 text-white shadow-xs'
                                    : 'bg-white text-slate-600 border border-border-soft hover:bg-slate-100'
                                }`}
                              >
                                {m}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tube Lights (10) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs font-mono font-bold text-slate-700">
                        <Lightbulb className="w-4 h-4 text-blue-600" />
                        <span>LABORATORY TUBE LIGHTS (10 × {ratings.progLabTubeLightWatts} W)</span>
                      </div>
                      <span className="text-xs font-mono text-blue-700 font-bold">
                        {progLabData.tubeLights.filter(Boolean).length} / 10 Active
                      </span>
                    </div>

                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                      {progLabData.tubeLights.map((isOn, idx) => (
                        <button
                          key={`prog_tl_${idx}`}
                          onClick={() => toggleProgLabLight(room.id, idx)}
                          className={`p-2.5 rounded-lg border text-center transition-all ${
                            isOn
                              ? 'bg-blue-50 border-blue-400 text-blue-800 shadow-xs font-bold'
                              : 'bg-slate-50 border-border-soft text-slate-400 hover:border-slate-300'
                          }`}
                        >
                          <Lightbulb className={`w-4 h-4 mx-auto mb-1 ${isOn ? 'text-amber-500 fill-current' : 'text-slate-400'}`} />
                          <div className="text-[10px] font-mono">L{idx + 1}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MANUAL SENSOR INPUT & ELECTRICAL PARAMETERS */}
          {activeTab === 'manual_electrical' && (
            <div className="space-y-6">
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-mono flex items-start space-x-2.5">
                <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
                <div>
                  <div className="font-bold">SIMULATION MODE – MANUALLY ENTERED DATA, NOT LIVE SENSOR READINGS.</div>
                  <div className="text-amber-800 text-[11px] mt-0.5">
                    Select Mode B (Manual Electrical Input) to compute room demand via Single-Phase sinusoidal formula:
                    P = V × I × PF, S = V × I, Q = √(S² − P²).
                  </div>
                </div>
              </div>

              {/* Electrical Parameters Form */}
              <div className="bg-slate-50 p-4 rounded-xl border border-border-soft space-y-4">
                <div className="text-xs font-mono font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <span>Single-Phase Electrical Supply Inputs</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                  <div>
                    <label className="text-slate-600 block mb-1">Voltage (V)</label>
                    <input
                      type="number"
                      step="1"
                      min="180"
                      max="280"
                      value={room.manualParams.voltage}
                      onChange={(e) => updateManualParams(room.id, { voltage: Number(e.target.value) })}
                      className="w-full bg-white border border-border-soft rounded-lg px-3 py-2 text-slate-900 font-bold focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 block mb-1">Current (A)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={room.manualParams.current}
                      onChange={(e) => updateManualParams(room.id, { current: Number(e.target.value) })}
                      className="w-full bg-white border border-border-soft rounded-lg px-3 py-2 text-slate-900 font-bold focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 block mb-1">Power Factor (0.1 - 1.0)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.1"
                      max="1.0"
                      value={room.manualParams.powerFactor}
                      onChange={(e) => updateManualParams(room.id, { powerFactor: Number(e.target.value) })}
                      className="w-full bg-white border border-border-soft rounded-lg px-3 py-2 text-slate-900 font-bold focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 block mb-1">Frequency (Hz)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={room.manualParams.frequency}
                      onChange={(e) => updateManualParams(room.id, { frequency: Number(e.target.value) })}
                      className="w-full bg-white border border-border-soft rounded-lg px-3 py-2 text-slate-900 font-bold focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* Direct Real Power (optional) */}
                <div className="pt-2 border-t border-border-soft">
                  <label className="text-slate-600 text-xs font-mono block mb-1">
                    Optional Direct Real Power Override (W):
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="number"
                      placeholder="e.g. 1500 (leave empty to use V × I × PF)"
                      value={room.manualParams.directRealPower || ''}
                      onChange={(e) =>
                        updateManualParams(room.id, {
                          directRealPower: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      className="flex-1 bg-white border border-border-soft rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:border-blue-500 outline-none"
                    />
                    <button
                      onClick={() => setCalculationMode(room.id, 'MODE_B_MANUAL_ELECTRICAL')}
                      className="px-4 py-2 rounded-lg bg-blue-600 text-white font-mono text-xs font-bold hover:bg-blue-700 shadow-xs"
                    >
                      APPLY MANUAL MODE
                    </button>
                  </div>
                </div>
              </div>

              {/* Environmental Parameters */}
              <div className="bg-slate-50 p-4 rounded-xl border border-border-soft space-y-4">
                <div className="text-xs font-mono font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                  <Thermometer className="w-4 h-4 text-amber-600" />
                  <span>Environmental & Occupancy Conditions</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-mono">
                  <div>
                    <label className="text-slate-600 block mb-1">Indoor Temp (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={room.envParams.indoorTemp}
                      onChange={(e) => updateEnvParams(room.id, { indoorTemp: Number(e.target.value) })}
                      className="w-full bg-white border border-border-soft rounded-lg px-3 py-2 text-slate-900 font-bold focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 block mb-1">Outdoor Temp (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={room.envParams.outdoorTemp}
                      onChange={(e) => updateEnvParams(room.id, { outdoorTemp: Number(e.target.value) })}
                      className="w-full bg-white border border-border-soft rounded-lg px-3 py-2 text-slate-900 font-bold focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 block mb-1">Relative Humidity (%)</label>
                    <input
                      type="number"
                      step="1"
                      min="10"
                      max="100"
                      value={room.envParams.relativeHumidity}
                      onChange={(e) => updateEnvParams(room.id, { relativeHumidity: Number(e.target.value) })}
                      className="w-full bg-white border border-border-soft rounded-lg px-3 py-2 text-slate-900 font-bold focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 block mb-1">Occupancy (Persons)</label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      value={room.envParams.occupancy}
                      onChange={(e) => updateEnvParams(room.id, { occupancy: Number(e.target.value) })}
                      className="w-full bg-white border border-border-soft rounded-lg px-3 py-2 text-slate-900 font-bold focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: THERMAL PHYSICS MODEL */}
          {activeTab === 'physics' && (
            <div className="space-y-6 text-xs font-mono">
              <div className="bg-slate-50 p-4 rounded-xl border border-border-soft space-y-3">
                <div className="font-bold text-slate-900 text-sm flex items-center justify-between">
                  <span>Room Thermal Energy-Balance Equations</span>
                  <span className="text-blue-700 text-xs">C · dT/dt = Q_int + Q_ext − Q_cool</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Simulates transient room heat dynamics where internal loads (occupants, computers, ballasts)
                  and ambient thermal envelope transmission interact with active HVAC capacity:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-lg bg-white border border-border-soft">
                    <div className="text-slate-500 text-[10px]">INTERNAL HEAT (Q_int)</div>
                    <div className="text-amber-700 text-base font-bold mt-1">{room.physics.qInternalW} W</div>
                    <div className="text-[10px] text-slate-400">People + PCs + Lights</div>
                  </div>

                  <div className="p-3 rounded-lg bg-white border border-border-soft">
                    <div className="text-slate-500 text-[10px]">ENVELOPE HEAT (Q_ext)</div>
                    <div className="text-rose-700 text-base font-bold mt-1">{room.physics.qExternalW} W</div>
                    <div className="text-[10px] text-slate-400">UA · (T_out − T_in)</div>
                  </div>

                  <div className="p-3 rounded-lg bg-white border border-border-soft">
                    <div className="text-slate-500 text-[10px]">HEAT REMOVAL (Q_cool)</div>
                    <div className="text-blue-700 text-base font-bold mt-1">{room.physics.qCoolingW} W</div>
                    <div className="text-[10px] text-slate-400">COP × AC Electrical Draw</div>
                  </div>
                </div>
              </div>

              {/* Hybrid Model vs Pure Physics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-border-soft space-y-2">
                  <div className="text-slate-600">Pure Physics Calculation:</div>
                  <div className="text-2xl font-bold text-slate-900">{room.physics.physicsTemp.toFixed(2)} °C</div>
                  <div className="text-[11px] text-slate-500">Euler discrete integration without empirical correction</div>
                </div>

                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200 space-y-2">
                  <div className="text-blue-800 font-semibold flex items-center justify-between">
                    <span>Hybrid (Physics + ML Residual):</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                      Residual: {room.physics.mlResidual > 0 ? `+${room.physics.mlResidual}` : room.physics.mlResidual} °C
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-blue-700">{room.physics.hybridTemp.toFixed(2)} °C</div>
                  <div className="text-[11px] text-slate-500">
                    T_hybrid = T_physics + ML_residual (Demonstration calibrated)
                  </div>
                </div>
              </div>

              {/* Estimated Cooling Demand */}
              <div className="p-4 bg-slate-50 rounded-xl border border-border-soft flex items-center justify-between">
                <div>
                  <div className="text-slate-900 font-bold text-sm">Estimated Cooling Demand for 24°C Setpoint:</div>
                  <div className="text-slate-500 text-[11px]">
                    Continuous thermal tonnage required to maintain thermal equilibrium
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-blue-700">{room.physics.estimatedCoolingDemandW} W</div>
                  <div className="text-[10px] text-slate-500">
                    {(room.physics.estimatedCoolingDemandW / 3517).toFixed(2)} Tons Refrigeration (TR)
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-border-soft bg-slate-50/80 flex items-center justify-between text-xs font-mono">
          <div className="text-slate-600 flex items-center space-x-2">
            <span>Room Power:</span>
            <span className="text-slate-900 font-bold">{room.currentPowerKW.toFixed(2)} kW</span>
            <span className="text-slate-300">|</span>
            <span>Apparent:</span>
            <span className="text-slate-700">{room.apparentPowerVA.toFixed(0)} VA</span>
            <span className="text-slate-300">|</span>
            <span>Reactive:</span>
            <span className="text-slate-700">{room.reactivePowerVAR.toFixed(0)} VAR</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold transition-colors"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
};
