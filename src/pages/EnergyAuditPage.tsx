import React, { useState, useMemo } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { performComprehensiveEnergyAudit } from '../engine/energyAuditEngine';
import { ApplianceAuditItem, RoomAuditProfile, LightingTechType, ACTechType, FanTechType, EquipmentTechType } from '../types';
import {
  FileText,
  AlertTriangle,
  Zap,
  TrendingDown,
  DollarSign,
  Clock,
  Sparkles,
  Layers,
  Sliders,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  Plus,
  Edit2,
  ChevronRight,
  ShieldAlert,
  BarChart3,
  Calendar,
  Building,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

interface EnergyAuditPageProps {
  onNavigateToWhatIf?: () => void;
}

export const EnergyAuditPage: React.FC<EnergyAuditPageProps> = ({ onNavigateToWhatIf }) => {
  const {
    auditProfiles,
    updateApplianceAuditConfig,
    resetAuditProfiles,
    aggregates,
    tariffs,
    updateWhatIfParams,
  } = useSimulation();

  const [selectedRoomId, setSelectedRoomId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'appliance_editor' | 'retrofits' | 'recommendations'>('overview');
  const [whatIfAppliedMsg, setWhatIfAppliedMsg] = useState<string | null>(null);

  // Perform full audit calculations
  const auditAnalysis = useMemo(() => {
    return performComprehensiveEnergyAudit(
      auditProfiles,
      aggregates.currentBuildingDemandKW,
      tariffs.energyTariffINRPerKWh
    );
  }, [auditProfiles, aggregates.currentBuildingDemandKW, tariffs.energyTariffINRPerKWh]);

  const { metrics, comparisons, categoryBreakdown, roomBreakdown, floorBreakdown, recommendations } = auditAnalysis;

  // Filter appliances for the editor
  const filteredAppliancesList = useMemo(() => {
    const list: { room: RoomAuditProfile; app: ApplianceAuditItem }[] = [];
    auditProfiles.forEach((room) => {
      if (selectedRoomId !== 'all' && room.roomId !== selectedRoomId) return;
      room.appliances.forEach((app) => {
        if (selectedCategory !== 'all' && app.category !== selectedCategory) return;
        list.push({ room, app });
      });
    });
    return list;
  }, [auditProfiles, selectedRoomId, selectedCategory]);

  const handleSimulateInWhatIf = (rec: (typeof recommendations)[0]) => {
    if (rec.whatIfPreset) {
      updateWhatIfParams(rec.whatIfPreset);
      setWhatIfAppliedMsg(`Applied parameter preset for "${rec.title}" to What-If engine!`);
      setTimeout(() => setWhatIfAppliedMsg(null), 4000);
      if (onNavigateToWhatIf) {
        onNavigateToWhatIf();
      }
    }
  };

  const CATEGORY_COLORS: Record<string, string> = {
    ac: '#3b82f6',        // Blue
    equipment: '#8b5cf6', // Violet
    lighting: '#f59e0b',  // Amber
    fan: '#10b981',       // Emerald
  };

  return (
    <div className="space-y-6">
      {/* Mandatory Simulation Mode Banner */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl shadow-xs">
        <div className="flex items-center space-x-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="text-xs text-amber-900 font-semibold tracking-wide">
            SIMULATION MODE – ALL DATA IS MANUALLY ENTERED OR SOFTWARE-GENERATED. NO PHYSICAL SENSORS OR HARDWARE ARE CONNECTED.
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2.5">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>AI-Based Building Energy Audit</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Comprehensive ASHRAE Level-II energy audit simulation evaluating appliance efficiency, operational hours, retrofits, and financial payback
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          {whatIfAppliedMsg && (
            <span className="text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 font-mono font-medium animate-pulse">
              ✓ {whatIfAppliedMsg}
            </span>
          )}
          <button
            onClick={resetAuditProfiles}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono font-medium rounded-lg border border-border-soft transition-all"
            title="Reset all appliance configurations to institutional baseline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Baseline</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-border-soft pb-2 text-xs font-mono">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            activeTab === 'overview'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Audit Dashboard & KPIs
        </button>
        <button
          onClick={() => setActiveTab('appliance_editor')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            activeTab === 'appliance_editor'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Appliance Inventory & Ratings ({filteredAppliancesList.length})
        </button>
        <button
          onClick={() => setActiveTab('retrofits')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            activeTab === 'retrofits'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Retrofit Payback Analysis
        </button>
        <button
          onClick={() => setActiveTab('recommendations')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            activeTab === 'recommendations'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          AI Audit Recommendations ({recommendations.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW & KPIS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top KPI Cards (8 Key Audit Metrics) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
            <div className="p-3.5 bg-white border border-border-soft rounded-xl shadow-xs space-y-1">
              <div className="text-[10px] text-slate-500 font-semibold uppercase flex items-center justify-between">
                <span>TOTAL CONNECTED LOAD</span>
                <Zap className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div className="text-xl font-bold text-slate-900">{metrics.totalConnectedLoadKW} kW</div>
              <div className="text-[10px] text-slate-500">Nameplate rated capacity</div>
            </div>

            <div className="p-3.5 bg-white border border-border-soft rounded-xl shadow-xs space-y-1">
              <div className="text-[10px] text-slate-500 font-semibold uppercase flex items-center justify-between">
                <span>ACTUAL OPERATING DEMAND</span>
                <Sliders className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <div className="text-xl font-bold text-blue-700">{metrics.actualOperatingDemandKW} kW</div>
              <div className="text-[10px] text-slate-500">
                {((metrics.actualOperatingDemandKW / (metrics.totalConnectedLoadKW || 1)) * 100).toFixed(0)}% diversity factor
              </div>
            </div>

            <div className="p-3.5 bg-white border border-border-soft rounded-xl shadow-xs space-y-1">
              <div className="text-[10px] text-slate-500 font-semibold uppercase flex items-center justify-between">
                <span>ESTIMATED ANNUAL ENERGY</span>
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              </div>
              <div className="text-xl font-bold text-indigo-700">
                {metrics.estimatedAnnualEnergyKWh.toLocaleString()} kWh
              </div>
              <div className="text-[10px] text-slate-500">Based on operating schedule</div>
            </div>

            <div className="p-3.5 bg-white border border-border-soft rounded-xl shadow-xs space-y-1">
              <div className="text-[10px] text-slate-500 font-semibold uppercase flex items-center justify-between">
                <span>ESTIMATED ANNUAL COST</span>
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <div className="text-xl font-bold text-emerald-700">₹ {metrics.estimatedAnnualCostINR.toLocaleString()}</div>
              <div className="text-[10px] text-slate-500">At ₹{tariffs.energyTariffINRPerKWh.toFixed(2)} / kWh tariff</div>
            </div>

            <div className="p-3.5 bg-white border border-border-soft rounded-xl shadow-xs space-y-1">
              <div className="text-[10px] text-slate-500 font-semibold uppercase">TOP CONSUMING CATEGORY</div>
              <div className="text-sm font-bold text-slate-900 truncate">{metrics.highestApplianceCategory}</div>
              <div className="text-[10px] text-blue-600 font-bold">{metrics.highestApplianceKWh.toLocaleString()} kWh/yr</div>
            </div>

            <div className="p-3.5 bg-white border border-border-soft rounded-xl shadow-xs space-y-1">
              <div className="text-[10px] text-slate-500 font-semibold uppercase">TOP CONSUMING ROOM</div>
              <div className="text-sm font-bold text-slate-900 truncate">{metrics.highestConsumingRoom}</div>
              <div className="text-[10px] text-blue-600 font-bold">{metrics.highestRoomKWh.toLocaleString()} kWh/yr</div>
            </div>

            <div className="p-3.5 bg-white border border-border-soft rounded-xl shadow-xs space-y-1">
              <div className="text-[10px] text-slate-500 font-semibold uppercase">TOP CONSUMING FLOOR</div>
              <div className="text-sm font-bold text-slate-900">{metrics.highestConsumingFloor}</div>
              <div className="text-[10px] text-blue-600 font-bold">{metrics.highestFloorKWh.toLocaleString()} kWh/yr</div>
            </div>

            <div className="p-3.5 bg-white border border-savings/30 bg-savings-light rounded-xl shadow-xs space-y-1">
              <div className="text-[10px] text-savings font-semibold uppercase flex items-center justify-between">
                <span>POTENTIAL ANNUAL SAVINGS</span>
                <TrendingDown className="w-3.5 h-3.5 text-savings" />
              </div>
              <div className="text-lg font-bold text-savings">₹ {metrics.potentialAnnualCostSavedINR.toLocaleString()}</div>
              <div className="text-[10px] text-savings font-medium">
                {metrics.potentialAnnualKWhSaved.toLocaleString()} kWh ({metrics.overallPaybackYears} yr payback)
              </div>
            </div>
          </div>

          {/* Charts Row: Category Breakdown & Room Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Energy Consumption by Category */}
            <div className="bg-white border border-border-soft rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                    <span>Annual Consumption by Appliance Category</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">Calculated via rated wattage × hours × operating days</p>
                </div>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryBreakdown} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="label"
                      stroke="#64748b"
                      tick={{ fontSize: 10, fontFamily: 'monospace' }}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10, fontFamily: 'monospace' }} unit=" kWh" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e2e8f0',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                      }}
                      formatter={(val: any) => [`${val.toLocaleString()} kWh`, 'Annual Energy']}
                    />
                    <Bar dataKey="annualKWh" radius={[4, 4, 0, 0]}>
                      {categoryBreakdown.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={CATEGORY_COLORS[entry.category] || '#3b82f6'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border-soft font-mono text-[11px]">
                {categoryBreakdown.map((c) => (
                  <div key={c.category} className="p-2 bg-slate-50 rounded-lg">
                    <div className="text-slate-500 truncate">{c.label}</div>
                    <div className="font-bold text-slate-900 mt-0.5">{c.sharePct}% ({c.annualKWh} kWh)</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 2: Room by Room Energy Comparison */}
            <div className="bg-white border border-border-soft rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                    <Building className="w-4 h-4 text-indigo-600" />
                    <span>Room-by-Room Energy Consumption (All 10 Spaces)</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">Comparing classrooms, circuit labs, and programming labs</p>
                </div>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={roomBreakdown} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="roomName"
                      stroke="#64748b"
                      tick={{ fontSize: 9, fontFamily: 'monospace' }}
                      angle={-20}
                      textAnchor="end"
                    />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10, fontFamily: 'monospace' }} unit=" kWh" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e2e8f0',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                      }}
                      formatter={(val: any) => [`${val.toLocaleString()} kWh (₹ ${(val * tariffs.energyTariffINRPerKWh).toLocaleString()})`, 'Energy']}
                    />
                    <Bar dataKey="annualKWh" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Floor summary pill */}
              <div className="flex items-center justify-between pt-2 border-t border-border-soft font-mono text-[11px]">
                {floorBreakdown.map((f) => (
                  <div key={f.floor} className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                    <span className="font-semibold text-slate-700">{f.label}:</span>
                    <span className="font-bold text-indigo-700">{f.annualKWh.toLocaleString()} kWh ({f.sharePct}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: APPLIANCE INVENTORY & EFFICIENCY CONFIGURATION EDITOR */}
      {activeTab === 'appliance_editor' && (
        <div className="space-y-5">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-border-soft shadow-xs text-xs font-mono">
            <div className="flex items-center space-x-3">
              <span className="text-slate-500 font-semibold uppercase">Filter Room:</span>
              <select
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                className="bg-slate-50 border border-border-soft rounded-lg px-2.5 py-1 text-slate-800 focus:outline-hidden"
              >
                <option value="all">All 10 Monitored Rooms</option>
                {auditProfiles.map((r) => (
                  <option key={r.roomId} value={r.roomId}>
                    {r.roomName} (Floor {r.floor})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-slate-500 font-semibold uppercase">Filter Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-50 border border-border-soft rounded-lg px-2.5 py-1 text-slate-800 focus:outline-hidden"
              >
                <option value="all">All Categories</option>
                <option value="lighting">Lighting Fixtures</option>
                <option value="ac">Air Conditioning (HVAC)</option>
                <option value="fan">Ceiling Fans</option>
                <option value="equipment">IT & Lab Equipment</option>
              </select>
            </div>
          </div>

          {/* Editable Appliance Table */}
          <div className="bg-white border border-border-soft rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-border-soft flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Appliance Specifications & Efficiency Configuration</h3>
                <p className="text-[11px] text-slate-500 font-mono">
                  Modify quantities, rated wattages, operating hours, and technology types. All calculations update dynamically.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-600 bg-white px-2.5 py-1 rounded-md border border-border-soft">
                Showing {filteredAppliancesList.length} items
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] tracking-wider border-b border-border-soft">
                  <tr>
                    <th className="py-2.5 px-3">Room / Space</th>
                    <th className="py-2.5 px-3">Appliance & Type</th>
                    <th className="py-2.5 px-3">Technology</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Rated Power (W)</th>
                    <th className="py-2.5 px-3 text-center">Hours/Day</th>
                    <th className="py-2.5 px-3 text-center">Days/Wk</th>
                    <th className="py-2.5 px-3 text-right">Daily (kWh)</th>
                    <th className="py-2.5 px-3 text-right">Annual (kWh)</th>
                    <th className="py-2.5 px-3 text-center">Efficiency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-soft">
                  {filteredAppliancesList.map(({ room, app }) => {
                    const daily = (app.quantity * app.ratedWattsPerUnit * app.operatingHoursPerDay) / 1000;
                    const annual = daily * app.operatingDaysPerWeek * 52;

                    return (
                      <tr key={`${room.roomId}_${app.id}`} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-semibold text-slate-800">
                          {room.roomName}
                          <span className="block text-[10px] text-slate-400 font-normal">Floor {room.floor}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-medium text-slate-900">{app.name}</span>
                          {app.acTonnage && (
                            <span className="block text-[10px] text-blue-600 font-medium">
                              {app.acTonnage} TR | BEE {app.beeStarRating || 2} Star | {app.isInverter ? 'Inverter' : 'Fixed Speed'}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {/* Technology Selector */}
                          <select
                            value={app.techType}
                            onChange={(e) =>
                              updateApplianceAuditConfig(room.roomId, app.id, {
                                techType: e.target.value as any,
                              })
                            }
                            className="bg-white border border-border-soft rounded px-2 py-1 text-[11px] text-slate-800 focus:outline-hidden"
                          >
                            {app.category === 'lighting' && (
                              <>
                                <option value="fluorescent">Fluorescent Tube Light</option>
                                <option value="led">LED Tube Light</option>
                                <option value="cfl">CFL Lamp</option>
                                <option value="incandescent">Incandescent</option>
                                <option value="custom">Custom</option>
                              </>
                            )}
                            {app.category === 'ac' && (
                              <>
                                <option value="fixed_speed">Fixed-Speed Non-Inverter</option>
                                <option value="inverter">Inverter AC</option>
                                <option value="custom">Custom HVAC</option>
                              </>
                            )}
                            {app.category === 'fan' && (
                              <>
                                <option value="induction">Conventional Induction Fan</option>
                                <option value="bldc">BLDC Energy Saver Fan</option>
                                <option value="custom">Custom Fan</option>
                              </>
                            )}
                            {app.category === 'equipment' && (
                              <>
                                <option value="desktop">Desktop Workstation</option>
                                <option value="laptop">Laptop Computer</option>
                                <option value="projector">Classroom Projector</option>
                                <option value="lab_equipment">Laboratory Equipment</option>
                                <option value="custom">Custom Equipment</option>
                              </>
                            )}
                          </select>
                        </td>

                        {/* Editable Quantity */}
                        <td className="py-3 px-3 text-center">
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={app.quantity}
                            onChange={(e) =>
                              updateApplianceAuditConfig(room.roomId, app.id, {
                                quantity: Math.max(1, parseInt(e.target.value, 10) || 1),
                              })
                            }
                            className="w-14 text-center bg-white border border-border-soft rounded px-1.5 py-0.5 text-slate-800"
                          />
                        </td>

                        {/* Editable Wattage */}
                        <td className="py-3 px-3 text-right">
                          <input
                            type="number"
                            min="5"
                            max="10000"
                            step="5"
                            value={app.ratedWattsPerUnit}
                            onChange={(e) =>
                              updateApplianceAuditConfig(room.roomId, app.id, {
                                ratedWattsPerUnit: Math.max(1, parseInt(e.target.value, 10) || 1),
                              })
                            }
                            className="w-20 text-right bg-white border border-border-soft rounded px-1.5 py-0.5 text-slate-800"
                          />
                        </td>

                        {/* Editable Operating Hours/Day */}
                        <td className="py-3 px-3 text-center">
                          <input
                            type="number"
                            min="1"
                            max="24"
                            step="0.5"
                            value={app.operatingHoursPerDay}
                            onChange={(e) =>
                              updateApplianceAuditConfig(room.roomId, app.id, {
                                operatingHoursPerDay: Math.max(0.5, Math.min(24, parseFloat(e.target.value) || 1)),
                              })
                            }
                            className="w-14 text-center bg-white border border-border-soft rounded px-1.5 py-0.5 text-slate-800"
                          />
                        </td>

                        {/* Operating Days/Week */}
                        <td className="py-3 px-3 text-center">
                          <input
                            type="number"
                            min="1"
                            max="7"
                            value={app.operatingDaysPerWeek}
                            onChange={(e) =>
                              updateApplianceAuditConfig(room.roomId, app.id, {
                                operatingDaysPerWeek: Math.max(1, Math.min(7, parseInt(e.target.value, 10) || 1)),
                              })
                            }
                            className="w-12 text-center bg-white border border-border-soft rounded px-1.5 py-0.5 text-slate-800"
                          />
                        </td>

                        {/* Calculations */}
                        <td className="py-3 px-3 text-right font-medium text-slate-700">{daily.toFixed(2)}</td>
                        <td className="py-3 px-3 text-right font-bold text-slate-900">{Math.round(annual).toLocaleString()}</td>

                        {/* Efficiency Category */}
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              app.efficiencyCategory === 'High'
                                ? 'bg-emerald-100 text-emerald-800'
                                : app.efficiencyCategory === 'Medium'
                                ? 'bg-blue-100 text-blue-800'
                                : app.efficiencyCategory === 'Low'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {app.efficiencyCategory}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RETROFIT & FINANCIAL PAYBACK ANALYSIS */}
      {activeTab === 'retrofits' && (
        <div className="space-y-6">
          <div className="bg-white border border-border-soft rounded-2xl p-5 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Existing vs. Energy-Efficient Replacement Options</span>
              </h3>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                Financial payback evaluated using formula: Payback (Years) = Capital Cost / Annual Savings
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] tracking-wider border-b border-border-soft">
                  <tr>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Current Technology</th>
                    <th className="py-2.5 px-3">Proposed Upgrade</th>
                    <th className="py-2.5 px-3 text-right">Power Delta</th>
                    <th className="py-2.5 px-3 text-right">Daily Saved</th>
                    <th className="py-2.5 px-3 text-right">Annual Saved (kWh)</th>
                    <th className="py-2.5 px-3 text-right">Annual Savings (₹)</th>
                    <th className="py-2.5 px-3 text-right">Investment (₹)</th>
                    <th className="py-2.5 px-3 text-center">Payback (Yrs)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-soft">
                  {comparisons.map((c, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 uppercase text-[10px] font-bold text-slate-500">{c.category}</td>
                      <td className="py-3 px-3 font-semibold text-rose-700">{c.currentTech}</td>
                      <td className="py-3 px-3 font-semibold text-emerald-700">{c.proposedTech}</td>
                      <td className="py-3 px-3 text-right">
                        <span className="line-through text-slate-400 mr-1.5">{c.currentWatts}W</span>
                        <span className="font-bold text-emerald-600">{c.proposedWatts}W</span>
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-slate-700">+{c.dailyKWhSaved} kWh</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">{c.annualKWhSaved.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-700">₹ {c.annualCostSavedINR.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right text-slate-700">₹ {c.totalImplementationCostINR.toLocaleString()}</td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                            c.paybackYears <= 1.5
                              ? 'bg-emerald-100 text-emerald-800'
                              : c.paybackYears <= 3.5
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {c.paybackYears} yrs
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AI AUDIT RECOMMENDATIONS */}
      {activeTab === 'recommendations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Prioritized Energy Efficiency Retrofit Proposals</h3>
            <span className="text-xs font-mono text-slate-500">
              Ranked by ROI, simple payback period, and engineering feasibility
            </span>
          </div>

          <div className="space-y-4">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="bg-white border border-border-soft hover:border-blue-300 rounded-2xl p-5 shadow-xs transition-all space-y-3.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider ${
                        rec.priority === 'HIGH'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : rec.priority === 'MEDIUM'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {rec.priority} PRIORITY
                    </span>
                    <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {rec.category}
                    </span>
                    <h4 className="font-bold text-slate-900 text-base">{rec.title}</h4>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-right font-mono text-xs">
                      <div className="text-[10px] text-slate-400">PAYBACK</div>
                      <div className="font-bold text-emerald-700">{rec.paybackYears} Years</div>
                    </div>
                    {rec.whatIfPreset && (
                      <button
                        onClick={() => handleSimulateInWhatIf(rec)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-mono text-xs font-bold rounded-xl transition-all shadow-2xs"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        <span>Simulate in What-If</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase text-rose-600 font-semibold">Identified Problem</span>
                    <p className="text-slate-600 leading-relaxed">{rec.identifiedProblem}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase text-emerald-600 font-semibold">Recommended Action</span>
                    <p className="text-slate-800 font-medium leading-relaxed">{rec.recommendedAction}</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-border-soft text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">Engineering & Operational Justification: </span>
                  {rec.engineeringReason}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-border-soft font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Daily Energy Saved</span>
                    <div className="font-bold text-blue-700">{rec.dailySavingsKWh} kWh/day</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Annual Energy Saved</span>
                    <div className="font-bold text-indigo-700">{rec.annualSavingsKWh.toLocaleString()} kWh/yr</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Annual Financial Savings</span>
                    <div className="font-bold text-emerald-700">₹ {rec.annualCostSavingsINR.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Estimated Implementation Cost</span>
                    <div className="font-bold text-slate-800">₹ {rec.estimatedCostINR.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
