import React, { useState, useRef } from 'react';
import { useSimulation } from '../context/SimulationContext';
import {
  TimetableEntry,
  DayOfWeek,
  CalendarDayType,
  CalendarEntry,
} from '../types';
import { TIMETABLE_PERIODS } from '../data/timetableData';
import {
  timeStringToMinutes,
  minutesToTimeString,
  mapRoomToCode,
} from '../engine/timetableEnergyEngine';
import {
  Calendar as CalendarIcon,
  Clock,
  Download,
  Upload,
  Plus,
  Trash2,
  Edit2,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Sparkles,
  Zap,
  Power,
  ShieldCheck,
  Building,
  GraduationCap,
  Users,
} from 'lucide-react';

export const TimetablePage: React.FC = () => {
  const {
    timetable,
    roomInventory,
    calendar,
    activeDayOfWeek,
    setActiveDayOfWeek,
    activeCalendarDate,
    setActiveCalendarDate,
    simTimeMinutes,
    simTimeString,
    timetableSavings,
    addTimetableEntry,
    updateTimetableEntry,
    deleteTimetableEntry,
    importTimetableCSV,
    exportTimetableCSVTemplate,
    addCalendarEntry,
    deleteCalendarEntry,
    triggerRelayShutoff,
    toggleRelayOverride,
    rooms,
  } = useSimulation();

  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'grid' | 'calendar' | 'inventory'>('grid');

  // Edit / Add modal state
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [classForm, setClassForm] = useState<Omit<TimetableEntry, 'id'>>({
    day: 'Monday',
    start_time: '08:00',
    end_time: '08:50',
    room: 'CR101',
    type: 'class',
    subject: '',
    department: 'EEE',
    year: 2,
    strength: 50,
    period_label: 'P1',
  });

  // Calendar Modal state
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [calendarForm, setCalendarForm] = useState<Omit<CalendarEntry, 'id'>>({
    date: '2026-11-15',
    day_type: 'event',
    description: '',
    rooms_affected: 'all',
  });

  // CSV toast message
  const [csvMessage, setCsvMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const daysList: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const handleOpenAddModal = (day: DayOfWeek = activeDayOfWeek, room: string = 'CR101') => {
    setEditingEntryId(null);
    setClassForm({
      day,
      start_time: '08:00',
      end_time: '08:50',
      room,
      type: room.startsWith('LAB') ? 'lab' : 'class',
      subject: '',
      department: 'EEE',
      year: 2,
      strength: 48,
      period_label: 'P1',
    });
    setIsClassModalOpen(true);
  };

  const handleOpenEditModal = (entry: TimetableEntry) => {
    setEditingEntryId(entry.id);
    setClassForm({
      day: entry.day,
      start_time: entry.start_time,
      end_time: entry.end_time,
      room: entry.room,
      type: entry.type,
      subject: entry.subject,
      department: entry.department,
      year: entry.year,
      strength: entry.strength,
      period_label: entry.period_label,
    });
    setIsClassModalOpen(true);
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classForm.subject.trim()) {
      alert('Please enter a subject name.');
      return;
    }

    if (editingEntryId) {
      updateTimetableEntry(editingEntryId, classForm);
    } else {
      addTimetableEntry(classForm);
    }
    setIsClassModalOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const res = importTimetableCSV(text);
      if (res.success) {
        setCsvMessage({ text: `Imported ${res.count} timetable slots successfully!`, isError: false });
      } else {
        setCsvMessage({ text: res.error || 'Failed to import CSV.', isError: true });
      }
      setTimeout(() => setCsvMessage(null), 4000);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownloadTemplate = () => {
    const csvContent = exportTimetableCSVTemplate();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cit_eee_timetable_template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveCalendar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!calendarForm.description.trim()) {
      alert('Please enter an event description.');
      return;
    }
    addCalendarEntry(calendarForm);
    setIsCalendarModalOpen(false);
  };

  // Filtered rooms for grid view
  const displayedRooms = selectedRoomFilter === 'ALL'
    ? roomInventory
    : roomInventory.filter((r) => r.room === selectedRoomFilter);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2.5">
              <CalendarIcon className="w-5 h-5 text-savings" />
              <span>EEE Block Academic Timetable & Scheduling System</span>
            </h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-savings/10 text-savings border border-savings/20">
              CIT Track 5
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            College Timing: <b>08:00 AM – 03:00 PM, Monday to Friday</b> | Chennai Institute of Technology EEE Wing
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv,text/csv"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-white border border-border-soft hover:bg-slate-50 text-slate-800 font-semibold shadow-sm transition-all"
          >
            <Upload className="w-3.5 h-3.5 text-slate-600" />
            <span>Upload Timetable CSV</span>
          </button>

          <button
            onClick={handleDownloadTemplate}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-white border border-border-soft hover:bg-slate-50 text-slate-800 font-semibold shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Download Template</span>
          </button>

          <button
            onClick={() => handleOpenAddModal()}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-savings hover:bg-savings-dark text-white font-bold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Class / Lab</span>
          </button>
        </div>
      </div>

      {/* CSV feedback message */}
      {csvMessage && (
        <div
          className={`p-3 rounded-lg border text-xs font-mono flex items-center space-x-2 ${
            csvMessage.isError
              ? 'bg-wastage-light text-wastage border-wastage/30'
              : 'bg-savings-light text-savings border-savings/30'
          }`}
        >
          {csvMessage.isError ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{csvMessage.text}</span>
        </div>
      )}

      {/* College Timing & Live Status Strip */}
      <div className="bg-white border border-border-soft rounded-xl p-4 shadow-card grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-savings-light text-savings">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">College Working Hours</span>
            <span className="text-slate-900 font-bold text-sm">08:00 – 15:00 (Mon–Fri)</span>
            <span className="text-[10px] text-slate-500 block">Current Sim Time: {simTimeString}</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-blue-50 text-cit-blue">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">Active Timetable Day</span>
            <div className="flex items-center space-x-1 mt-0.5">
              <select
                value={activeDayOfWeek}
                onChange={(e) => setActiveDayOfWeek(e.target.value as DayOfWeek)}
                className="bg-slate-50 border border-border-soft text-slate-900 font-bold px-2 py-0.5 rounded text-xs outline-none focus:border-savings"
              >
                {daysList.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <span className="text-[10px] text-slate-500 block">Day Type: {timetableSavings.currentDayType}</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-amber-50 text-warning">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">In-Session Classes</span>
            <span className="text-slate-900 font-bold text-sm">
              {timetableSavings.scheduledClassesNow} Rooms Active
            </span>
            <span className="text-[10px] text-slate-500 block">Out of 9 EEE Monitored Rooms</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className={`p-2.5 rounded-lg ${
            timetableSavings.activeWastingRoomsCount > 0 ? 'bg-wastage-light text-wastage' : 'bg-savings-light text-savings'
          }`}>
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">Wastage / Idle Status</span>
            <span className={`font-bold text-sm ${
              timetableSavings.activeWastingRoomsCount > 0 ? 'text-wastage' : 'text-savings'
            }`}>
              {timetableSavings.activeWastingRoomsCount > 0
                ? `${timetableSavings.activeWastingRoomsCount} Rooms Drawing Idle Power`
                : 'Zero Idle Wastage Detected'}
            </span>
            <span className="text-[10px] text-slate-500 block">Automated relay shutdown ready</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-border-soft pb-2 text-xs font-mono">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('grid')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'grid'
                ? 'bg-savings text-white shadow-sm'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-border-soft'
            }`}
          >
            Weekly Timetable Matrix
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'calendar'
                ? 'bg-savings text-white shadow-sm'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-border-soft'
            }`}
          >
            Academic Calendar & Holidays ({calendar.length})
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'inventory'
                ? 'bg-savings text-white shadow-sm'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-border-soft'
            }`}
          >
            Rooms & Device Inventory ({roomInventory.length})
          </button>
        </div>

        {/* Room Filter Selector */}
        {activeTab === 'grid' && (
          <div className="flex items-center space-x-2">
            <span className="text-slate-500">Filter Room:</span>
            <select
              value={selectedRoomFilter}
              onChange={(e) => setSelectedRoomFilter(e.target.value)}
              className="bg-white border border-border-soft rounded-lg px-2.5 py-1 text-slate-900 font-semibold outline-none"
            >
              <option value="ALL">All EEE Rooms (9 Rooms)</option>
              {roomInventory.map((r) => (
                <option key={r.room} value={r.room}>
                  {r.room} – {r.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* TAB 1: WEEKLY TIMETABLE MATRIX */}
      {activeTab === 'grid' && (
        <div className="space-y-6">
          {displayedRooms.map((inv) => {
            const matchedRoomState = rooms.find((r) => mapRoomToCode(r.id) === inv.room);
            const statusSummary = timetableSavings.roomBreakdown.find((b) => b.roomCode === inv.room);
            const currentActualKW = matchedRoomState ? matchedRoomState.currentPowerKW : 0;
            const isWasting = statusSummary?.status === 'Unscheduled' && currentActualKW > 0.25;

            return (
              <div
                key={inv.room}
                className="bg-white border border-border-soft rounded-2xl p-5 shadow-card space-y-4"
              >
                {/* Room Status Ribbon */}
                <div className="flex flex-wrap items-center justify-between gap-y-2 pb-3 border-b border-border-soft">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-border-soft flex items-center justify-center font-bold text-slate-900 font-mono text-sm">
                      {inv.room}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-slate-900 text-base">{inv.name}</h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-border-soft">
                          Floor {inv.floor} • {inv.type === 'classroom' ? 'Classroom' : 'Heavy Lab'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-mono">
                        Connected: {(inv.total_connected_w / 1000).toFixed(1)} kW | Live Power:{' '}
                        <b className="text-slate-900">{currentActualKW.toFixed(2)} kW</b>
                      </p>
                    </div>
                  </div>

                  {/* Badges & Relay Control */}
                  <div className="flex items-center space-x-3 font-mono text-xs">
                    {/* Status Badge per specification */}
                    <span
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${
                        statusSummary?.status === 'Occupied'
                          ? 'bg-savings-light text-savings border-savings/30'
                          : statusSummary?.status === 'Scheduled empty'
                          ? 'bg-blue-50 text-cit-blue border-blue-200'
                          : isWasting
                          ? 'bg-wastage-light text-wastage border-wastage/40 animate-pulse'
                          : 'bg-slate-100 text-slate-600 border-border-soft'
                      }`}
                    >
                      {isWasting ? 'Wastage (Unscheduled Active)' : statusSummary?.status || 'Unscheduled'}
                    </span>

                    {/* Relay trigger if wasting */}
                    {isWasting && matchedRoomState && (
                      <button
                        onClick={() => triggerRelayShutoff(matchedRoomState.id)}
                        className="flex items-center space-x-1.5 px-3 py-1 rounded-md bg-wastage text-white font-bold hover:bg-wastage-dark transition-all shadow-sm"
                        title="Shut off power relays to stop energy waste"
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>Trigger Relay Shutoff</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenAddModal(activeDayOfWeek, inv.room)}
                      className="p-1.5 rounded-lg border border-border-soft text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                      title="Add slot for this room"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Grid of Periods */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 border-y border-border-soft">
                        <th className="py-2.5 px-3 w-28">DAY</th>
                        {TIMETABLE_PERIODS.map((period) => (
                          <th
                            key={period.id}
                            className={`py-2 px-2 text-center border-l border-border-soft text-[11px] ${
                              period.isBreak ? 'bg-amber-50/60 text-warning font-normal w-16' : ''
                            }`}
                          >
                            <span className="font-bold block">{period.id.toUpperCase()}</span>
                            <span className="text-[10px] text-slate-500 font-normal">
                              {period.startTime}-{period.endTime}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-soft">
                      {daysList.map((day) => {
                        const isCurrentDay = day === activeDayOfWeek;
                        const dayClasses = timetable.filter(
                          (entry) => entry.day === day && entry.room === inv.room
                        );

                        return (
                          <tr
                            key={day}
                            className={`hover:bg-slate-50/60 transition-colors ${
                              isCurrentDay ? 'bg-savings/5 font-semibold' : ''
                            }`}
                          >
                            <td className="py-3 px-3 font-bold text-slate-900 flex items-center space-x-1.5">
                              {isCurrentDay && <span className="w-1.5 h-1.5 rounded-full bg-savings" />}
                              <span>{day}</span>
                            </td>

                            {TIMETABLE_PERIODS.map((period) => {
                              if (period.isBreak) {
                                return (
                                  <td
                                    key={period.id}
                                    className="py-1 px-1 text-center bg-amber-50/40 border-l border-border-soft text-[10px] text-warning"
                                  >
                                    {period.name === 'Morning Break' ? 'Break' : 'Lunch'}
                                  </td>
                                );
                              }

                              const pStart = timeStringToMinutes(period.startTime);
                              const pEnd = timeStringToMinutes(period.endTime);

                              // Find matching class that overlaps this period
                              const matchingClass = dayClasses.find((c) => {
                                const cStart = timeStringToMinutes(c.start_time);
                                const cEnd = timeStringToMinutes(c.end_time);
                                return cStart < pEnd && cEnd > pStart;
                              });

                              // Check if currently active right now
                              const isNow =
                                isCurrentDay &&
                                simTimeMinutes >= pStart &&
                                simTimeMinutes < pEnd;

                              return (
                                <td
                                  key={period.id}
                                  className={`py-2 px-2 border-l border-border-soft align-top ${
                                    isNow
                                      ? 'bg-savings/15 ring-2 ring-savings ring-inset rounded'
                                      : ''
                                  }`}
                                >
                                  {matchingClass ? (
                                    <div className="p-2 rounded-lg bg-white border border-border-soft shadow-xs group relative hover:border-slate-400 transition-all">
                                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-900">
                                        <span className="truncate max-w-[130px]" title={matchingClass.subject}>
                                          {matchingClass.subject}
                                        </span>
                                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button
                                            onClick={() => handleOpenEditModal(matchingClass)}
                                            className="text-slate-400 hover:text-slate-700"
                                            title="Edit class"
                                          >
                                            <Edit2 className="w-3 h-3" />
                                          </button>
                                          <button
                                            onClick={() => deleteTimetableEntry(matchingClass.id)}
                                            className="text-slate-400 hover:text-wastage"
                                            title="Delete class"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>

                                      <div className="mt-1 text-[10px] text-slate-500 flex items-center justify-between">
                                        <span>Year {matchingClass.year} • {matchingClass.department}</span>
                                        <span className="text-slate-700 font-semibold">{matchingClass.strength} std</span>
                                      </div>

                                      {isNow && (
                                        <div className="mt-1 flex items-center space-x-1 text-[9px] font-bold text-savings">
                                          <span className="w-1.5 h-1.5 rounded-full bg-savings animate-ping" />
                                          <span>CURRENTLY LIVE</span>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="h-14 flex items-center justify-center text-[10px] text-slate-400 hover:bg-slate-100/50 rounded transition-colors group">
                                      <button
                                        onClick={() =>
                                          handleOpenAddModal(day, inv.room)
                                        }
                                        className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-savings text-[10px] font-medium flex items-center space-x-0.5"
                                      >
                                        <Plus className="w-3 h-3" />
                                        <span>Add</span>
                                      </button>
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: ACADEMIC CALENDAR & EVENTS */}
      {activeTab === 'calendar' && (
        <div className="bg-white border border-border-soft rounded-2xl p-6 shadow-card space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-y-2 pb-4 border-b border-border-soft">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <CalendarIcon className="w-4 h-4 text-savings" />
                <span>Academic Calendar, Exam Days & Institute Holidays</span>
              </h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Special calendar dates automatically modulate scheduled load calculations (e.g. holidays de-energize spaces)
              </p>
            </div>

            <button
              onClick={() => setIsCalendarModalOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-savings hover:bg-savings-dark text-white font-mono text-xs font-bold transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Calendar Event</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-border-soft">
                <tr>
                  <th className="py-3 px-4">DATE</th>
                  <th className="py-3 px-4">DAY TYPE</th>
                  <th className="py-3 px-4">DESCRIPTION</th>
                  <th className="py-3 px-4">ROOMS AFFECTED</th>
                  <th className="py-3 px-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft text-slate-700">
                {calendar.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{item.date}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          item.day_type === 'holiday'
                            ? 'bg-amber-50 text-warning border-warning/30'
                            : item.day_type === 'exam'
                            ? 'bg-blue-50 text-cit-blue border-blue-200'
                            : item.day_type === 'event'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-savings-light text-savings border-savings/30'
                        }`}
                      >
                        {item.day_type}
                      </span>
                    </td>
                    <td className="py-3 px-4">{item.description}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {item.rooms_affected === 'all'
                        ? 'All EEE Rooms'
                        : Array.isArray(item.rooms_affected)
                        ? item.rooms_affected.join(', ')
                        : item.rooms_affected}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => deleteCalendarEntry(item.id)}
                        className="text-slate-400 hover:text-wastage transition-colors"
                        title="Delete calendar entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ROOMS & DEVICE INVENTORY TABLE */}
      {activeTab === 'inventory' && (
        <div className="bg-white border border-border-soft rounded-2xl p-6 shadow-card space-y-5 font-mono text-xs">
          <div className="pb-4 border-b border-border-soft flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                EEE Monitored Spaces Equipment & Device Ratings Table
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Rated power specifications per appliance category utilized for expected energy and wastage calculations
              </p>
            </div>
            <span className="text-slate-700 font-bold">Total Connected: 37.8 kW</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-slate-600 border-b border-border-soft">
                <tr>
                  <th className="py-3 px-3">CODE</th>
                  <th className="py-3 px-3">ROOM NAME</th>
                  <th className="py-3 px-3">TYPE</th>
                  <th className="py-3 px-3 text-right">FANS</th>
                  <th className="py-3 px-3 text-right">TUBE LIGHTS</th>
                  <th className="py-3 px-3 text-right">AC UNITS</th>
                  <th className="py-3 px-3 text-right">COMPUTERS</th>
                  <th className="py-3 px-3 text-right">CONNECTED (W)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft text-slate-800">
                {roomInventory.map((item) => (
                  <tr key={item.room} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{item.room}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">{item.name}</td>
                    <td className="py-2.5 px-3 capitalize text-slate-600">{item.type}</td>
                    <td className="py-2.5 px-3 text-right">{item.fans} × {item.rated_power_per_device.fanW}W</td>
                    <td className="py-2.5 px-3 text-right">{item.tube_lights} × {item.rated_power_per_device.tubeLightW}W</td>
                    <td className="py-2.5 px-3 text-right">
                      {item.ac_units > 0 ? `${item.ac_units} × ${item.rated_power_per_device.acW}W` : 'None'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {item.computers > 0 ? `${item.computers} × ${item.rated_power_per_device.computerW}W` : 'None'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-savings">
                      {item.total_connected_w} W
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT TIMETABLE CLASS */}
      {isClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-border-soft rounded-2xl w-full max-w-lg shadow-modal overflow-hidden font-mono text-xs">
            <div className="px-6 py-4 border-b border-border-soft flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingEntryId ? 'Edit Scheduled Session' : 'Add New Class or Lab Slot'}
              </h3>
              <button
                onClick={() => setIsClassModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 block mb-1">Day of Week:</label>
                  <select
                    value={classForm.day}
                    onChange={(e) => setClassForm({ ...classForm, day: e.target.value as DayOfWeek })}
                    className="w-full bg-slate-50 border border-border-soft rounded-lg px-3 py-2 text-slate-900 font-semibold outline-none"
                  >
                    {daysList.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-600 block mb-1">Room Code:</label>
                  <select
                    value={classForm.room}
                    onChange={(e) => {
                      const r = e.target.value;
                      setClassForm({
                        ...classForm,
                        room: r,
                        type: r.startsWith('LAB') ? 'lab' : 'class',
                      });
                    }}
                    className="w-full bg-slate-50 border border-border-soft rounded-lg px-3 py-2 text-slate-900 font-semibold outline-none"
                  >
                    {roomInventory.map((r) => (
                      <option key={r.room} value={r.room}>
                        {r.room} ({r.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-600 block mb-1">Subject Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Electric Circuit Analysis"
                  value={classForm.subject}
                  onChange={(e) => setClassForm({ ...classForm, subject: e.target.value })}
                  className="w-full bg-slate-50 border border-border-soft rounded-lg px-3 py-2 text-slate-900 font-semibold outline-none focus:border-savings"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 block mb-1">Start Time (HH:MM):</label>
                  <input
                    type="time"
                    value={classForm.start_time}
                    onChange={(e) => setClassForm({ ...classForm, start_time: e.target.value })}
                    className="w-full bg-slate-50 border border-border-soft rounded-lg px-3 py-2 text-slate-900 font-semibold outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-600 block mb-1">End Time (HH:MM):</label>
                  <input
                    type="time"
                    value={classForm.end_time}
                    onChange={(e) => setClassForm({ ...classForm, end_time: e.target.value })}
                    className="w-full bg-slate-50 border border-border-soft rounded-lg px-3 py-2 text-slate-900 font-semibold outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-600 block mb-1">Year of Study:</label>
                  <select
                    value={classForm.year}
                    onChange={(e) => setClassForm({ ...classForm, year: parseInt(e.target.value, 10) })}
                    className="w-full bg-slate-50 border border-border-soft rounded-lg px-3 py-2 text-slate-900 font-semibold outline-none"
                  >
                    <option value={1}>Year I</option>
                    <option value={2}>Year II</option>
                    <option value={3}>Year III</option>
                    <option value={4}>Year IV</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-600 block mb-1">Student Strength:</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={classForm.strength}
                    onChange={(e) => setClassForm({ ...classForm, strength: parseInt(e.target.value, 10) || 45 })}
                    className="w-full bg-slate-50 border border-border-soft rounded-lg px-3 py-2 text-slate-900 font-semibold outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-600 block mb-1">Period Label:</label>
                  <input
                    type="text"
                    placeholder="P1 or P1-P3"
                    value={classForm.period_label || ''}
                    onChange={(e) => setClassForm({ ...classForm, period_label: e.target.value })}
                    className="w-full bg-slate-50 border border-border-soft rounded-lg px-3 py-2 text-slate-900 font-semibold outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-border-soft">
                <button
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-savings hover:bg-savings-dark text-white font-bold"
                >
                  Save Class Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD CALENDAR ENTRY */}
      {isCalendarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-border-soft rounded-2xl w-full max-w-md shadow-modal overflow-hidden font-mono text-xs">
            <div className="px-6 py-4 border-b border-border-soft flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">Add Academic Calendar Event</h3>
              <button
                onClick={() => setIsCalendarModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCalendar} className="p-6 space-y-4">
              <div>
                <label className="text-slate-600 block mb-1">Date (YYYY-MM-DD):</label>
                <input
                  type="date"
                  value={calendarForm.date}
                  onChange={(e) => setCalendarForm({ ...calendarForm, date: e.target.value })}
                  className="w-full bg-slate-50 border border-border-soft rounded-lg px-3 py-2 text-slate-900 font-semibold outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-slate-600 block mb-1">Day Type:</label>
                <select
                  value={calendarForm.day_type}
                  onChange={(e) => setCalendarForm({ ...calendarForm, day_type: e.target.value as CalendarDayType })}
                  className="w-full bg-slate-50 border border-border-soft rounded-lg px-3 py-2 text-slate-900 font-semibold outline-none"
                >
                  <option value="working">Working Day (Regular Classes)</option>
                  <option value="holiday">Institute Holiday (Zero Classes)</option>
                  <option value="exam">Exam Day (Selected Rooms Only)</option>
                  <option value="event">Symposium / Event (Event Rooms Only)</option>
                  <option value="vacation">Vacation Period (All Offline)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-600 block mb-1">Event Description:</label>
                <input
                  type="text"
                  placeholder="e.g. CIT National Symposium"
                  value={calendarForm.description}
                  onChange={(e) => setCalendarForm({ ...calendarForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-border-soft rounded-lg px-3 py-2 text-slate-900 font-semibold outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-border-soft">
                <button
                  type="button"
                  onClick={() => setIsCalendarModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-savings hover:bg-savings-dark text-white font-bold"
                >
                  Add Date
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
