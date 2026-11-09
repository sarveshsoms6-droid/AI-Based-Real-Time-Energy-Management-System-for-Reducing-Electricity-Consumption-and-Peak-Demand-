import React, { useState } from 'react';
import { useSimulation } from '../context/SimulationContext';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Filter,
  Search,
  CheckCircle,
  FileText,
  Layers,
} from 'lucide-react';

interface ReportRow {
  timestamp: string;
  floor: number;
  room: string;
  applianceCategory: string;
  status: string;
  voltageV: number;
  currentA: number;
  powerFactor: number;
  realPowerW: number;
  energyKWh: number;
  temperatureC: number;
  humidityPct: number;
}

export const EnergyReportsPage: React.FC = () => {
  const { rooms, tariffs } = useSimulation();

  const [reportRange, setReportRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [filterFloor, setFilterFloor] = useState<'all' | '1' | '2'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Generate tabular rows from current room telemetry and appliance configurations
  const rows: ReportRow[] = [];
  const now = new Date();
  const timeStr = now.toISOString().replace('T', ' ').substring(0, 19);

  rooms.forEach((r) => {
    if (r.appliances.type === 'classroom') {
      const activeLights = r.appliances.data.tubeLights.filter(Boolean).length;
      const activeFans = r.appliances.data.fans.filter(Boolean).length;
      const proj = r.appliances.data.projector;

      rows.push({
        timestamp: timeStr,
        floor: r.floor,
        room: r.name,
        applianceCategory: 'Tube Lights',
        status: `${activeLights}/10 ON`,
        voltageV: r.manualParams.voltage,
        currentA: r.manualParams.current,
        powerFactor: r.manualParams.powerFactor,
        realPowerW: activeLights * 40,
        energyKWh: Number((r.dailyEnergyKWh * 0.35).toFixed(2)),
        temperatureC: Number(r.envParams.indoorTemp.toFixed(1)),
        humidityPct: r.envParams.relativeHumidity,
      });

      rows.push({
        timestamp: timeStr,
        floor: r.floor,
        room: r.name,
        applianceCategory: 'Ceiling Fans',
        status: `${activeFans}/6 ON`,
        voltageV: r.manualParams.voltage,
        currentA: r.manualParams.current,
        powerFactor: r.manualParams.powerFactor,
        realPowerW: activeFans * 75,
        energyKWh: Number((r.dailyEnergyKWh * 0.45).toFixed(2)),
        temperatureC: Number(r.envParams.indoorTemp.toFixed(1)),
        humidityPct: r.envParams.relativeHumidity,
      });

      rows.push({
        timestamp: timeStr,
        floor: r.floor,
        room: r.name,
        applianceCategory: 'Projector',
        status: proj ? 'ON' : 'OFF',
        voltageV: r.manualParams.voltage,
        currentA: r.manualParams.current,
        powerFactor: r.manualParams.powerFactor,
        realPowerW: proj ? 250 : 0,
        energyKWh: Number((r.dailyEnergyKWh * 0.20).toFixed(2)),
        temperatureC: Number(r.envParams.indoorTemp.toFixed(1)),
        humidityPct: r.envParams.relativeHumidity,
      });
    } else if (r.appliances.type === 'circuit_lab') {
      const activeLights = r.appliances.data.tubeLights.filter(Boolean).length;
      const ac1 = r.appliances.data.acUnits[0];
      const ac2 = r.appliances.data.acUnits[1];

      rows.push({
        timestamp: timeStr,
        floor: r.floor,
        room: r.name,
        applianceCategory: 'Air Conditioners (2x)',
        status: `AC1:${ac1}, AC2:${ac2}`,
        voltageV: r.manualParams.voltage,
        currentA: r.manualParams.current,
        powerFactor: r.manualParams.powerFactor,
        realPowerW: (ac1 === 'ON' ? 2200 : 0) + (ac2 === 'ON' ? 2200 : 0),
        energyKWh: Number((r.dailyEnergyKWh * 0.65).toFixed(2)),
        temperatureC: Number(r.envParams.indoorTemp.toFixed(1)),
        humidityPct: r.envParams.relativeHumidity,
      });

      rows.push({
        timestamp: timeStr,
        floor: r.floor,
        room: r.name,
        applianceCategory: 'Experimental Sockets',
        status: r.appliances.data.socketActive ? 'ACTIVE' : 'ISOLATED',
        voltageV: r.manualParams.voltage,
        currentA: r.manualParams.current,
        powerFactor: r.manualParams.powerFactor,
        realPowerW: r.appliances.data.socketActive ? r.appliances.data.socketWatts : 0,
        energyKWh: Number((r.dailyEnergyKWh * 0.25).toFixed(2)),
        temperatureC: Number(r.envParams.indoorTemp.toFixed(1)),
        humidityPct: r.envParams.relativeHumidity,
      });

      rows.push({
        timestamp: timeStr,
        floor: r.floor,
        room: r.name,
        applianceCategory: 'Lab Tube Lights',
        status: `${activeLights}/10 ON`,
        voltageV: r.manualParams.voltage,
        currentA: r.manualParams.current,
        powerFactor: r.manualParams.powerFactor,
        realPowerW: activeLights * 40,
        energyKWh: Number((r.dailyEnergyKWh * 0.10).toFixed(2)),
        temperatureC: Number(r.envParams.indoorTemp.toFixed(1)),
        humidityPct: r.envParams.relativeHumidity,
      });
    } else if (r.appliances.type === 'programming_lab') {
      const activePCs = r.appliances.data.desktops.filter(Boolean).length;
      const ac1 = r.appliances.data.acUnits[0];
      const ac2 = r.appliances.data.acUnits[1];

      rows.push({
        timestamp: timeStr,
        floor: r.floor,
        room: r.name,
        applianceCategory: 'Desktop Workstations (32x)',
        status: `${activePCs}/32 ON`,
        voltageV: r.manualParams.voltage,
        currentA: r.manualParams.current,
        powerFactor: r.manualParams.powerFactor,
        realPowerW: activePCs * 150,
        energyKWh: Number((r.dailyEnergyKWh * 0.55).toFixed(2)),
        temperatureC: Number(r.envParams.indoorTemp.toFixed(1)),
        humidityPct: r.envParams.relativeHumidity,
      });

      rows.push({
        timestamp: timeStr,
        floor: r.floor,
        room: r.name,
        applianceCategory: 'Precision ACs (2x)',
        status: `AC1:${ac1}, AC2:${ac2}`,
        voltageV: r.manualParams.voltage,
        currentA: r.manualParams.current,
        powerFactor: r.manualParams.powerFactor,
        realPowerW: (ac1 === 'ON' ? 1800 : 0) + (ac2 === 'ON' ? 1800 : 0),
        energyKWh: Number((r.dailyEnergyKWh * 0.38).toFixed(2)),
        temperatureC: Number(r.envParams.indoorTemp.toFixed(1)),
        humidityPct: r.envParams.relativeHumidity,
      });
    }
  });

  const filteredRows = rows.filter((r) => {
    if (filterFloor !== 'all' && r.floor.toString() !== filterFloor) return false;
    if (searchTerm && !r.room.toLowerCase().includes(searchTerm.toLowerCase()) && !r.applianceCategory.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Export to CSV Function
  const exportToCSV = () => {
    const headers = [
      'Timestamp',
      'Floor',
      'Room',
      'Appliance Category',
      'Operating Status',
      'Voltage (V)',
      'Current (A)',
      'Power Factor',
      'Real Power (W)',
      'Accumulated Energy (kWh)',
      'Indoor Temp (°C)',
      'Relative Humidity (%)',
    ];

    const csvContent = [
      headers.join(','),
      ...filteredRows.map((r) =>
        [
          `"${r.timestamp}"`,
          r.floor,
          `"${r.room}"`,
          `"${r.applianceCategory}"`,
          `"${r.status}"`,
          r.voltageV,
          r.currentA,
          r.powerFactor,
          r.realPowerW,
          r.energyKWh,
          r.temperatureC,
          r.humidityPct,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `campusenergy_${reportRange}_telemetry_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2.5">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            <span>Energy Audit & Compliance Reports</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Export structured telemetry records containing voltage, current, real power, and temperature parameters
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={exportToCSV}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-mono text-xs font-bold shadow-xs transition-all"
        >
          <Download className="w-4 h-4" />
          <span>EXPORT CSV REPORT</span>
        </button>
      </div>

      {/* Filter and Range Controls */}
      <div className="bg-white border border-border-soft p-4 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
        {/* Report Interval */}
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span className="text-slate-500">Report Window:</span>
          <div className="flex bg-slate-100 p-1 rounded-lg border border-border-soft">
            {(['daily', 'weekly', 'monthly'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setReportRange(range)}
                className={`px-3 py-1 rounded capitalize transition-all ${
                  reportRange === range ? 'bg-white text-blue-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Floor Filter & Search */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-lg border border-border-soft">
            <button
              onClick={() => setFilterFloor('all')}
              className={`px-2.5 py-1 rounded transition-all ${
                filterFloor === 'all' ? 'bg-white text-blue-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Floors
            </button>
            <button
              onClick={() => setFilterFloor('1')}
              className={`px-2.5 py-1 rounded transition-all ${
                filterFloor === '1' ? 'bg-white text-blue-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Floor 1
            </button>
            <button
              onClick={() => setFilterFloor('2')}
              className={`px-2.5 py-1 rounded transition-all ${
                filterFloor === '2' ? 'bg-white text-blue-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Floor 2
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search room or load..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border border-border-soft rounded-lg pl-8 pr-3 py-1.5 text-slate-900 placeholder-slate-400 focus:border-blue-500 outline-none w-44 shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* Telemetry Report Table */}
      <div className="bg-white border border-border-soft rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-border-soft font-semibold">
              <tr>
                <th className="py-3 px-4">TIMESTAMP</th>
                <th className="py-3 px-4">FLOOR</th>
                <th className="py-3 px-4">ROOM NAME</th>
                <th className="py-3 px-4">APPLIANCE CATEGORY</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4 text-right">VOLTAGE (V)</th>
                <th className="py-3 px-4 text-right">CURRENT (A)</th>
                <th className="py-3 px-4 text-right">PF</th>
                <th className="py-3 px-4 text-right">POWER (W)</th>
                <th className="py-3 px-4 text-right">ENERGY (kWh)</th>
                <th className="py-3 px-4 text-right">TEMP (°C)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft text-slate-700">
              {filteredRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-4 text-slate-400 text-[11px]">{row.timestamp}</td>
                  <td className="py-2.5 px-4 font-bold text-slate-600">F{row.floor}</td>
                  <td className="py-2.5 px-4 font-bold text-slate-900">{row.room}</td>
                  <td className="py-2.5 px-4 text-blue-700 font-medium">{row.applianceCategory}</td>
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-border-soft text-[10px]">
                      {row.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right">{row.voltageV}</td>
                  <td className="py-2.5 px-4 text-right">{row.currentA}</td>
                  <td className="py-2.5 px-4 text-right text-blue-700">{row.powerFactor.toFixed(2)}</td>
                  <td className="py-2.5 px-4 text-right font-bold text-amber-700">{row.realPowerW} W</td>
                  <td className="py-2.5 px-4 text-right font-bold text-emerald-700">{row.energyKWh}</td>
                  <td className="py-2.5 px-4 text-right text-rose-700">{row.temperatureC}°</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-50 border-t border-border-soft flex items-center justify-between text-xs font-mono text-slate-500">
          <span>Displaying {filteredRows.length} audited sub-metering points</span>
          <span className="text-blue-700 font-bold">Standard CSV Format compliant with IEEE 1459</span>
        </div>
      </div>
    </div>
  );
};
