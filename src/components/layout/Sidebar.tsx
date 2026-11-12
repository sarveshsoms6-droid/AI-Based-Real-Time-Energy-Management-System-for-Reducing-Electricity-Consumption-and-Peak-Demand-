import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  Box,
  Layers,
  Sliders,
  Terminal,
  Cpu,
  TrendingUp,
  AlertOctagon,
  Sparkles,
  GitBranch,
  FileSpreadsheet,
  Settings,
  Sun,
  Moon,
  FileText,
  Zap,
  Radio,
} from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';
import { useTheme } from '../../context/ThemeContext';

export type NavPageId =
  | 'overview'
  | 'digital_twin'
  | 'floor_management'
  | 'room_monitoring'
  | 'manual_console'
  | 'physics_model'
  | 'ai_forecasting'
  | 'anomaly_detection'
  | 'peak_optimization'
  | 'energy_audit'
  | 'energy_management'
  | 'hardware_output'
  | 'timetable'
  | 'what_if'
  | 'reports'
  | 'settings';

interface SidebarProps {
  activePage: NavPageId;
  setActivePage: (page: NavPageId) => void;
}

interface NavItem {
  id: NavPageId;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage }) => {
  const { aggregates, timetableSavings } = useSimulation();
  const { isDark, toggleTheme } = useTheme();

  const navItems: NavItem[] = [
    { id: 'overview', label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'digital_twin', label: 'Building Digital Twin', icon: Box, badge: '3D/2D' },
    { id: 'floor_management', label: 'Floor Management', icon: Layers },
    { id: 'room_monitoring', label: 'Room Monitoring', icon: Sliders },
    { id: 'manual_console', label: 'Manual Sensor Console', icon: Terminal, badge: 'Input' },
    { id: 'physics_model', label: 'Physics-Informed Model', icon: Cpu, badge: 'dT/dt' },
    { id: 'ai_forecasting', label: 'AI Energy Forecasting', icon: TrendingUp },
    { id: 'anomaly_detection', label: 'Anomaly Detection', icon: AlertOctagon, badge: 'Alerts' },
    { id: 'peak_optimization', label: 'Peak Demand Optimizer', icon: Sparkles, badge: 'LP' },
    { id: 'energy_audit', label: 'AI Energy Audit', icon: FileText, badge: 'BEE' },
    { id: 'energy_management', label: 'AI Energy Management', icon: Zap, badge: 'PIR/AC' },
    { id: 'hardware_output', label: 'Hardware Output', icon: Radio, badge: 'Arduino' },
    { id: 'timetable', label: 'EEE Timetable & Schedule', icon: Calendar, badge: 'Savings' },
    { id: 'what_if', label: 'What-If Simulation', icon: GitBranch },
    { id: 'reports', label: 'Energy Reports', icon: FileSpreadsheet, badge: 'CSV' },
    { id: 'settings', label: 'Settings & Tariffs', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-border-soft flex flex-col justify-between select-none shadow-xs">
      {/* Navigation List */}
      <div className="py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-mono tracking-wider text-slate-500 uppercase font-bold">
          Navigation Modules
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-savings-light text-savings font-bold border border-savings/20 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-savings' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wider font-semibold ${
                    isActive
                      ? 'bg-savings/20 text-savings border-savings/30'
                      : 'bg-slate-100 text-slate-500 border-border-soft'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Building Status Widget at bottom */}
      <div className="p-3 border-t border-border-soft bg-slate-50">
        <div className="p-3 rounded-xl bg-white border border-border-soft text-xs shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-slate-500 font-medium">EEE Block Status</span>
            <span
              className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${
                aggregates.buildingStatus === 'critical'
                  ? 'bg-wastage-light text-wastage border-wastage/30'
                  : aggregates.buildingStatus === 'high'
                  ? 'bg-amber-50 text-warning border-warning/30'
                  : aggregates.buildingStatus === 'normal'
                  ? 'bg-blue-50 text-cit-blue border-blue-200'
                  : 'bg-savings-light text-savings border-savings/30'
              }`}
            >
              {aggregates.buildingStatus}
            </span>
          </div>

          <div className="space-y-1 text-[11px] font-mono text-slate-600">
            <div className="flex justify-between">
              <span>Rooms Active:</span>
              <span className="text-slate-900 font-bold">{aggregates.activeRoomsCount} / 10</span>
            </div>
            <div className="flex justify-between">
              <span>Saved Today:</span>
              <span className="text-savings font-bold">₹{timetableSavings.savedCostTodayINR.toLocaleString()}</span>
            </div>
          </div>

          {/* Quick Theme Switcher */}
          <div className="mt-2.5 pt-2 border-t border-border-soft flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-medium">Appearance:</span>
            <button
              onClick={toggleTheme}
              className="flex items-center space-x-1.5 px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-[10px] font-mono text-slate-700 transition-colors shadow-2xs"
            >
              {isDark ? (
                <>
                  <Sun className="w-3 h-3 text-amber-400" />
                  <span className="font-semibold">Dark Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-3 h-3 text-slate-700" />
                  <span className="font-semibold">Light Mode</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
