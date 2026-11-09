import React from 'react';
import { useSimulation } from '../context/SimulationContext';
import {
  Zap,
  Activity,
  Layers,
  Thermometer,
  TrendingUp,
  Sparkles,
  AlertTriangle,
  Radio,
  Clock,
  CheckCircle2,
  DollarSign,
  Monitor,
  Calendar,
  Power,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  Building,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';

export const OverviewDashboard: React.FC = () => {
  const {
    rooms,
    aggregates,
    ratings,
    tariffs,
    historicalData,
    timetableSavings,
    triggerRelayShutoff,
    triggerAllRelayShutoffs,
    setSelectedRoomId,
  } = useSimulation();

  // Category breakdown for donut chart
  let totalComputerW = 0;
  let totalAcW = 0;
  let totalLightingW = 0;
  let totalFanW = 0;
  let totalSocketW = 0;
  let totalProjectorW = 0;

  rooms.forEach((r) => {
    if (r.appliances.type === 'classroom') {
      const d = r.appliances.data;
      totalLightingW += d.tubeLights.filter(Boolean).length * ratings.classroomTubeLightWatts;
      totalFanW += d.fans.filter(Boolean).length * ratings.classroomFanWatts;
      if (d.projector) totalProjectorW += ratings.classroomProjectorWatts;
    } else if (r.appliances.type === 'circuit_lab') {
      const d = r.appliances.data;
      totalLightingW += d.tubeLights.filter(Boolean).length * ratings.circuitLabTubeLightWatts;
      if (d.socketActive) totalSocketW += d.socketWatts;
      d.acUnits.forEach((mode) => {
        if (mode === 'ON') totalAcW += ratings.circuitLabAcWatts;
        else if (mode === 'AUTO' && r.physics.hybridTemp > r.physics.targetSetpointTemp) {
          totalAcW += ratings.circuitLabAcWatts;
        }
      });
    } else if (r.appliances.type === 'programming_lab') {
      const d = r.appliances.data;
      totalLightingW += d.tubeLights.filter(Boolean).length * ratings.progLabTubeLightWatts;
      totalComputerW += d.desktops.filter(Boolean).length * ratings.progLabDesktopWatts;
      d.acUnits.forEach((mode) => {
        if (mode === 'ON') totalAcW += ratings.progLabAcWatts;
        else if (mode === 'AUTO' && r.physics.hybridTemp > r.physics.targetSetpointTemp) {
          totalAcW += ratings.progLabAcWatts;
        }
      });
    }
  });

  const applianceCategoryData = [
    { name: 'Computers', value: Number((totalComputerW / 1000).toFixed(2)), color: '#1D4ED8' },
    { name: 'HVAC Cooling', value: Number((totalAcW / 1000).toFixed(2)), color: '#0284C7' },
    { name: 'Lighting', value: Number((totalLightingW / 1000).toFixed(2)), color: '#D97706' },
    { name: 'Fans & Motors', value: Number((totalFanW / 1000).toFixed(2)), color: '#2E7D5B' },
    { name: 'Lab Sockets', value: Number((totalSocketW / 1000).toFixed(2)), color: '#EA580C' },
    { name: 'Projectors', value: Number((totalProjectorW / 1000).toFixed(2)), color: '#9333EA' },
  ].filter((item) => item.value > 0);

  // Floor comparison data
  const floorData = [
    { name: 'Floor 1', DemandKW: aggregates.floor1DemandKW, ConnectedKW: 18.9 },
    { name: 'Floor 2', DemandKW: aggregates.floor2DemandKW, ConnectedKW: 18.9 },
  ];

  // Room comparison data
  const roomComparisonData = rooms.map((r) => ({
    name: r.name.replace('Classroom ', 'CR ').replace(' Lab ', ' Lab '),
    DemandKW: r.currentPowerKW,
    ConnectedKW: r.connectedLoadKW,
    id: r.id,
  }));

  const isPeakAlert = aggregates.currentBuildingDemandKW > aggregates.totalConnectedLoadKW * 0.75;

  return (
    <div className="space-y-6">
      {/* Page Title & Status Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2.5">
              <span>Energy Overview & Timetable Analytics</span>
            </h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-savings-light text-savings border border-savings/20">
              CIT EEE Block
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Real-time energy telemetry, schedule-driven load monitoring, and peak-demand reduction for Chennai Institute of Technology
          </p>
        </div>

        {/* Timetable schedule pill */}
        <div className="flex items-center space-x-2 bg-white border border-border-soft px-3 py-1.5 rounded-xl shadow-xs text-xs font-mono">
          <Calendar className="w-4 h-4 text-savings" />
          <span className="text-slate-500">COLLEGE TIMING:</span>
          <span className="font-bold text-slate-900">08:00 AM – 03:00 PM</span>
        </div>
      </div>

      {/* TOP TIMETABLE SAVINGS HERO CARD (Goal 4) */}
      <div className="bg-white border border-border-soft rounded-2xl p-6 shadow-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-y-2 pb-3 border-b border-border-soft">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-savings-light border border-savings/30 flex items-center justify-center text-savings">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <span>Timetable-Based Automated Energy Savings</span>
                <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-border-soft">
                  Simulated Control vs 7-Hr Unmanaged Baseline
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 font-mono">
                Tariff: ₹{tariffs.energyTariffINRPerKWh || 8}/kWh • Emission Factor: {tariffs.carbonEmissionFactorKgPerKWh || 0.82} kg CO₂/kWh
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 font-mono text-xs">
            <span className="px-2 py-1 rounded bg-savings-light text-savings font-bold border border-savings/30">
              {timetableSavings.percentageReduction}% Energy Shaved
            </span>
            <span className="px-2 py-1 rounded bg-blue-50 text-cit-blue font-bold border border-blue-200">
              {timetableSavings.peakReductionKW} kW Peak Reduced
            </span>
          </div>
        </div>

        {/* 6 Timetable KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-xs">
          <div className="p-3.5 bg-slate-50 border border-border-soft rounded-xl space-y-1">
            <span className="text-[10px] text-slate-500 uppercase block">KWH SAVED TODAY</span>
            <div className="text-xl font-bold text-savings">{timetableSavings.savedKWhToday} <span className="text-xs font-normal text-slate-500">kWh</span></div>
            <div className="text-[10px] text-slate-500">vs 7-hr uncontrolled base</div>
          </div>

          <div className="p-3.5 bg-slate-50 border border-border-soft rounded-xl space-y-1">
            <span className="text-[10px] text-slate-500 uppercase block">SAVINGS TODAY (INR)</span>
            <div className="text-xl font-bold text-slate-900">₹{timetableSavings.savedCostTodayINR.toLocaleString()}</div>
            <div className="text-[10px] text-slate-500">@ ₹{tariffs.energyTariffINRPerKWh || 8}/unit</div>
          </div>

          <div className="p-3.5 bg-slate-50 border border-border-soft rounded-xl space-y-1">
            <span className="text-[10px] text-slate-500 uppercase block">SAVED THIS WEEK</span>
            <div className="text-xl font-bold text-savings">{timetableSavings.savedKWhThisWeek} <span className="text-xs font-normal text-slate-500">kWh</span></div>
            <div className="text-[10px] text-slate-500">₹{timetableSavings.savedCostThisWeekINR.toLocaleString()} (5 days)</div>
          </div>

          <div className="p-3.5 bg-slate-50 border border-border-soft rounded-xl space-y-1">
            <span className="text-[10px] text-slate-500 uppercase block">SAVED THIS MONTH</span>
            <div className="text-xl font-bold text-savings">{timetableSavings.savedKWhThisMonth} <span className="text-xs font-normal text-slate-500">kWh</span></div>
            <div className="text-[10px] text-slate-500">₹{timetableSavings.savedCostThisMonthINR.toLocaleString()} (22 days)</div>
          </div>

          <div className="p-3.5 bg-slate-50 border border-border-soft rounded-xl space-y-1">
            <span className="text-[10px] text-slate-500 uppercase block">CO₂ AVOIDED TODAY</span>
            <div className="text-xl font-bold text-savings">{timetableSavings.co2AvoidedTodayKg} <span className="text-xs font-normal text-slate-500">kg</span></div>
            <div className="text-[10px] text-slate-500">{timetableSavings.co2AvoidedThisMonthKg} kg monthly</div>
          </div>

          <div className="p-3.5 bg-slate-50 border border-border-soft rounded-xl space-y-1">
            <span className="text-[10px] text-slate-500 uppercase block">PEAK DEMAND CUT</span>
            <div className="text-xl font-bold text-cit-blue">{timetableSavings.peakReductionKW} <span className="text-xs font-normal text-slate-500">kW</span></div>
            <div className="text-[10px] text-slate-500">Eliminated idle peaks</div>
          </div>
        </div>
      </div>

      {/* TOP WASTING ROOMS ALERT CARD (Goal 4 & Goal 3) */}
      {timetableSavings.topWastingRooms.length > 0 && (
        <div className="bg-white border border-border-soft rounded-2xl p-5 shadow-card space-y-3 font-mono text-xs">
          <div className="flex flex-wrap items-center justify-between gap-y-2">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <span className="font-bold text-slate-900 text-sm">
                Unscheduled Power Draw & Top-Wasting Spaces Alert
              </span>
            </div>

            <button
              onClick={triggerAllRelayShutoffs}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-wastage hover:bg-wastage-dark text-white font-bold transition-all shadow-xs"
            >
              <Power className="w-3.5 h-3.5" />
              <span>Shutoff All Idle Relays</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {timetableSavings.topWastingRooms.slice(0, 3).map((wasting) => {
              const matchedRoom = rooms.find((r) => r.timetableRoomCode === wasting.roomCode);

              return (
                <div
                  key={wasting.roomCode}
                  className="p-3.5 bg-slate-50 border border-border-soft rounded-xl space-y-2 hover:border-slate-400 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{wasting.roomCode}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-wastage-light text-wastage border border-wastage/30">
                      +{wasting.currentWasteKW.toFixed(2)} kW Idle
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-tight">
                    {wasting.reason}
                  </p>
                  <div className="pt-2 border-t border-border-soft flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Est. Loss: ₹{wasting.estimatedCostLossINR}</span>
                    {matchedRoom && (
                      <button
                        onClick={() => triggerRelayShutoff(matchedRoom.id)}
                        className="text-wastage hover:underline font-bold"
                      >
                        Trip Relay →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Building KPI Grid (8 Standard Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 font-mono">
        <div className="p-3 bg-white border border-border-soft rounded-xl space-y-1 shadow-card">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Connected</span>
            <Layers className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-lg font-bold text-slate-900">{aggregates.totalConnectedLoadKW} <span className="text-xs font-normal text-slate-500">kW</span></div>
          <div className="text-[10px] text-slate-400">Nameplate Cap</div>
        </div>

        <div className="p-3 bg-white border border-border-soft rounded-xl space-y-1 shadow-card">
          <div className="text-[10px] text-cit-blue uppercase tracking-wider flex items-center justify-between">
            <span>Live Demand</span>
            <Zap className="w-3.5 h-3.5 text-cit-blue fill-current" />
          </div>
          <div className="text-lg font-bold text-cit-blue">{aggregates.currentBuildingDemandKW.toFixed(2)} <span className="text-xs font-normal text-slate-500">kW</span></div>
          <div className="text-[10px] text-slate-500">
            {((aggregates.currentBuildingDemandKW / aggregates.totalConnectedLoadKW) * 100).toFixed(0)}% Utilized
          </div>
        </div>

        <div className="p-3 bg-white border border-border-soft rounded-xl space-y-1 shadow-card">
          <div className="text-[10px] text-savings uppercase tracking-wider flex items-center justify-between">
            <span>Daily Energy</span>
            <Activity className="w-3.5 h-3.5 text-savings" />
          </div>
          <div className="text-lg font-bold text-savings">{aggregates.dailyEnergyConsumptionKWh.toFixed(1)} <span className="text-xs font-normal text-slate-500">kWh</span></div>
          <div className="text-[10px] text-slate-400">Accumulated</div>
        </div>

        <div className="p-3 bg-white border border-border-soft rounded-xl space-y-1 shadow-card">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Est. Cost</span>
            <DollarSign className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-lg font-bold text-slate-900">₹{aggregates.estimatedDailyCostINR.toLocaleString()}</div>
          <div className="text-[10px] text-slate-400">@ ₹{tariffs.energyTariffINRPerKWh || 8}/kWh</div>
        </div>

        <div className="p-3 bg-white border border-border-soft rounded-xl space-y-1 shadow-card">
          <div className="text-[10px] text-warning uppercase tracking-wider flex items-center justify-between">
            <span>Pred. Peak</span>
            <TrendingUp className="w-3.5 h-3.5 text-warning" />
          </div>
          <div className="text-lg font-bold text-warning">{aggregates.predictedPeakDemandKW} <span className="text-xs font-normal text-slate-500">kW</span></div>
          <div className="text-[10px] text-slate-400">@ {aggregates.predictedPeakTime}</div>
        </div>

        <div className="p-3 bg-white border border-border-soft rounded-xl space-y-1 shadow-card">
          <div className="text-[10px] text-savings uppercase tracking-wider flex items-center justify-between">
            <span>Optimization</span>
            <Sparkles className="w-3.5 h-3.5 text-savings" />
          </div>
          <div className="text-lg font-bold text-savings">{timetableSavings.percentageReduction}%</div>
          <div className="text-[10px] text-slate-400">Total Shaved</div>
        </div>

        <div className="p-3 bg-white border border-border-soft rounded-xl space-y-1 shadow-card">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Active Loads</span>
            <Radio className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-lg font-bold text-slate-900">
            {aggregates.activeApplianceCount} <span className="text-xs font-normal text-slate-400">/ {aggregates.totalApplianceCount}</span>
          </div>
          <div className="text-[10px] text-slate-400">Switches ON</div>
        </div>

        <div className="p-3 bg-white border border-border-soft rounded-xl space-y-1 shadow-card">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Active Rooms</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-savings" />
          </div>
          <div className="text-lg font-bold text-slate-900">
            {aggregates.activeRoomsCount} <span className="text-xs font-normal text-slate-400">/ 10</span>
          </div>
          <div className="text-[10px] text-slate-400">Monitored</div>
        </div>
      </div>

      {/* Main Charts Row 1: Real-time Power Chart & Category Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Real-time power line chart (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-border-soft rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <Activity className="w-4 h-4 text-cit-blue" />
                <span>EEE Block Diurnal Electrical Load Curve</span>
              </h3>
              <p className="text-xs text-slate-500">
                15-minute telemetry aggregated across classrooms, computing labs, and heavy experimental test benches
              </p>
            </div>
            <div className="flex items-center space-x-3 text-xs font-mono">
              <span className="flex items-center space-x-1 text-cit-blue">
                <span className="w-2.5 h-0.5 bg-cit-blue inline-block" />
                <span>Building Total</span>
              </span>
              <span className="flex items-center space-x-1 text-indigo-600">
                <span className="w-2.5 h-0.5 bg-indigo-600 inline-block" />
                <span>Prog Labs</span>
              </span>
              <span className="flex items-center space-x-1 text-warning">
                <span className="w-2.5 h-0.5 bg-warning inline-block" />
                <span>Circuit Labs</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historicalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBuilding" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1D4ED8" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#1D4ED8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E3DA" />
                <XAxis dataKey="timestamp" stroke="#7B8794" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
                <YAxis stroke="#7B8794" tick={{ fontSize: 11, fontFamily: 'monospace' }} unit=" kW" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E7E3DA',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08)',
                  }}
                />
                <Area type="monotone" dataKey="buildingDemandKW" stroke="#1D4ED8" strokeWidth={2.5} fillOpacity={1} fill="url(#colorBuilding)" name="Total Demand" />
                <Line type="monotone" dataKey="progLabsKW" stroke="#4F46E5" strokeWidth={1.5} dot={false} name="Prog Labs" />
                <Line type="monotone" dataKey="circuitLabsKW" stroke="#D97706" strokeWidth={1.5} dot={false} name="Circuit Labs" />
                <Line type="monotone" dataKey="classroomsKW" stroke="#2E7D5B" strokeWidth={1.5} dot={false} name="Classrooms" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Appliance Category Donut (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-border-soft rounded-2xl p-5 shadow-card flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2 mb-1">
              <Zap className="w-4 h-4 text-warning" />
              <span>Load Category Distribution</span>
            </h3>
            <p className="text-xs text-slate-500">Current active electrical demand by device group</p>
          </div>

          <div className="h-52 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={applianceCategoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {applianceCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E7E3DA',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                  }}
                  formatter={(val: any) => [`${val} kW`, 'Demand']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend Grid */}
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            {applianceCategoryData.map((cat) => (
              <div key={cat.name} className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="text-slate-600 truncate">{cat.name}:</span>
                <span className="text-slate-900 font-bold ml-auto">{cat.value} kW</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Charts Row 2: Per-Block Breakdown & Room-wise Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Per-Block Breakdown (4 cols) - Goal 4 */}
        <div className="lg:col-span-4 bg-white border border-border-soft rounded-2xl p-5 shadow-card space-y-4 font-mono text-xs">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Building className="w-4 h-4 text-savings" />
              <span>EEE Block Sector Breakdown</span>
            </h3>
            <p className="text-xs text-slate-500">Academic Lecture Halls vs Heavy Engineering Laboratories</p>
          </div>

          <div className="space-y-3">
            {timetableSavings.blockBreakdown.map((blk) => (
              <div key={blk.blockName} className="p-3.5 bg-slate-50 border border-border-soft rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{blk.blockName}</span>
                  <span className="text-savings font-bold">-{blk.percentage}%</span>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-savings h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, blk.percentage)}%` }}
                  />
                </div>

                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Baseline: {blk.baselineKWh} kWh</span>
                  <span>Actual: {blk.actualKWh} kWh</span>
                  <span className="text-slate-900 font-bold">Saved: ₹{blk.savedINR}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Room-wise Energy Comparison (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-border-soft rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <Monitor className="w-4 h-4 text-cit-blue" />
                <span>Room-Wise Demand Comparison (All 10 Monitored Rooms)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Click any bar to directly inspect room switchboard and manual electrical parameters
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Total Nameplate: 37.8 kW</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={roomComparisonData}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload[0]) {
                    setSelectedRoomId(e.activePayload[0].payload.id);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E3DA" />
                <XAxis
                  dataKey="name"
                  stroke="#7B8794"
                  tick={{ fontSize: 10, fontFamily: 'monospace' }}
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis stroke="#7B8794" tick={{ fontSize: 11, fontFamily: 'monospace' }} unit=" kW" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E7E3DA',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08)',
                  }}
                  formatter={(val: any) => [`${val} kW`]}
                />
                <Bar dataKey="DemandKW" fill="#0284C7" radius={[4, 4, 0, 0]} name="Operating Demand (kW)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
