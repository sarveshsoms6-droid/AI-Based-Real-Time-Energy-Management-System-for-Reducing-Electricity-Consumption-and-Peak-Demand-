import {
  RoomState,
  TimetableEntry,
  RoomInventory,
  CalendarEntry,
  UsageFactors,
  DayOfWeek,
  RoomTimetableStatus,
  TopWastingRoomItem,
  TimetableEnergySavingsSummary,
  CostTariffSettings,
  CalendarDayType,
} from '../types';

/**
 * Helper to convert "HH:MM" string to minutes from midnight
 */
export function timeStringToMinutes(timeStr: string): number {
  const parts = timeStr.split(':');
  if (parts.length < 2) return 0;
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
}

/**
 * Helper to format minutes from midnight to "HH:MM"
 */
export function minutesToTimeString(minutes: number): string {
  const h = Math.floor((minutes / 60) % 24);
  const m = Math.floor(minutes % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Maps a RoomState or RoomId to the Timetable Room Code (CR101-CR105, LAB1-LAB4)
 */
export function mapRoomToCode(roomId: string): string {
  const clean = roomId.toLowerCase().trim();
  if (clean.includes('101')) return 'CR101';
  if (clean.includes('102')) return 'CR102';
  if (clean.includes('103')) return 'CR103';
  if (clean.includes('104') || clean.includes('201')) return 'CR104';
  if (clean.includes('105') || clean.includes('202')) return 'CR105';
  if (clean.includes('ca_lab1') || clean.includes('lab1')) return 'LAB1';
  if (clean.includes('cp_lab1') || clean.includes('lab2')) return 'LAB2';
  if (clean.includes('ca_lab2') || clean.includes('lab3')) return 'LAB3';
  if (clean.includes('cp_lab2') || clean.includes('lab4')) return 'LAB4';
  return 'CR101';
}

/**
 * Evaluates the active day type from the calendar table
 */
export function getActiveCalendarDayType(
  dateStr: string,
  calendar: CalendarEntry[]
): { dayType: CalendarDayType; entry: CalendarEntry | null } {
  const match = calendar.find((c) => c.date === dateStr);
  if (match) {
    return { dayType: match.day_type, entry: match };
  }
  return { dayType: 'working', entry: null };
}

/**
 * Determines if a given room is scheduled at a specific simulation time
 */
export function is_scheduled(
  roomCode: string,
  simMinutes: number,
  dayOfWeek: DayOfWeek,
  timetable: TimetableEntry[],
  calendarDayType: CalendarDayType = 'working',
  calendarEntry: CalendarEntry | null = null
): { isScheduled: boolean; activeClass: TimetableEntry | null } {
  // Calendar rules:
  // Holiday & Vacation: NO classes scheduled anywhere
  if (calendarDayType === 'holiday' || calendarDayType === 'vacation') {
    return { isScheduled: false, activeClass: null };
  }

  // Exam day: Only rooms designated in calendar are scheduled
  if (calendarDayType === 'exam' && calendarEntry) {
    const isExamRoom =
      calendarEntry.rooms_affected === 'all' ||
      calendarEntry.rooms_affected.includes(roomCode);
    if (!isExamRoom) {
      return { isScheduled: false, activeClass: null };
    }
  }

  // Find class covering current sim time
  const activeClass = timetable.find((entry) => {
    if (entry.day !== dayOfWeek) return false;
    if (entry.room !== roomCode) return false;
    const startM = timeStringToMinutes(entry.start_time);
    const endM = timeStringToMinutes(entry.end_time);
    return simMinutes >= startM && simMinutes < endM;
  });

  return {
    isScheduled: !!activeClass,
    activeClass: activeClass || null,
  };
}

/**
 * Returns expected occupancy (student count) for a room at the current time
 */
export function expected_occupancy(
  roomCode: string,
  simMinutes: number,
  dayOfWeek: DayOfWeek,
  timetable: TimetableEntry[],
  calendarDayType: CalendarDayType = 'working',
  calendarEntry: CalendarEntry | null = null
): number {
  const schedule = is_scheduled(roomCode, simMinutes, dayOfWeek, timetable, calendarDayType, calendarEntry);
  if (!schedule.isScheduled || !schedule.activeClass) {
    return 0;
  }
  return schedule.activeClass.strength || 45;
}

/**
 * Calculates expected power draw (kW) based on room equipment, occupancy, and usage factors:
 * Expected Load = Rated Power × Usage Factor × Occupancy Ratio
 */
export function calculate_expected_load(
  inventory: RoomInventory,
  occupancy: number,
  usageFactors: UsageFactors
): number {
  if (occupancy <= 0) {
    // Unoccupied or idle period: expected active equipment power is zero (standby < 0.05 kW)
    return 0.03;
  }

  let totalExpectedW = 0;
  const r = inventory.rated_power_per_device;

  if (inventory.type === 'classroom') {
    // Standard Classroom: fans + tube lights + projector
    const fanLoad = inventory.fans * r.fanW * usageFactors.fanFactor;
    const lightLoad = inventory.tube_lights * r.tubeLightW * usageFactors.lightFactor;
    const projLoad = r.projectorW * 0.9;
    totalExpectedW = fanLoad + lightLoad + projLoad;
  } else {
    // Laboratory: ACs + PCs + tube lights + sockets
    const acLoad = inventory.ac_units * r.acW * usageFactors.acFactor;
    const lightLoad = inventory.tube_lights * r.tubeLightW * usageFactors.lightFactor;
    const pcLoad = Math.min(occupancy, inventory.computers) * r.computerW * usageFactors.computerFactor;
    const socketLoad = r.socketW * usageFactors.socketFactor;
    totalExpectedW = acLoad + lightLoad + pcLoad + socketLoad;
  }

  return Number((totalExpectedW / 1000).toFixed(2));
}

/**
 * Evaluates individual room status:
 * - Room unscheduled but load is high -> flag WASTAGE, suggest or trigger relay shutoff
 * - Room scheduled but load is zero -> normal (no alert)
 * - Waste = actual energy - expected energy
 */
export function evaluate_room_timetable_status(
  roomState: RoomState,
  inventory: RoomInventory,
  simMinutes: number,
  dayOfWeek: DayOfWeek,
  timetable: TimetableEntry[],
  usageFactors: UsageFactors,
  calendarDayType: CalendarDayType = 'working',
  calendarEntry: CalendarEntry | null = null
): RoomTimetableStatus {
  const roomCode = inventory.room;
  const scheduleInfo = is_scheduled(roomCode, simMinutes, dayOfWeek, timetable, calendarDayType, calendarEntry);
  const occupancy = expected_occupancy(roomCode, simMinutes, dayOfWeek, timetable, calendarDayType, calendarEntry);
  const expectedLoadKW = calculate_expected_load(inventory, occupancy, usageFactors);
  const actualLoadKW = roomState.currentPowerKW;

  let statusBadge: RoomTimetableStatus['statusBadge'] = 'Unscheduled';
  let isWasting = false;
  let relayShutoffSuggested = false;
  let reason = 'Room idle and appliances powered off.';

  // Check 1: Scheduled Room
  if (scheduleInfo.isScheduled) {
    if (actualLoadKW > 0.05) {
      statusBadge = 'Occupied';
      reason = `In session: ${scheduleInfo.activeClass?.subject} (${scheduleInfo.activeClass?.period_label || 'P'}).`;
    } else {
      // Room scheduled but load is zero -> normal, no alert (per specification)
      statusBadge = 'Scheduled empty';
      reason = `Scheduled for ${scheduleInfo.activeClass?.subject}, but equipment currently offline (normal, no alert).`;
    }
  } else {
    // Check 2: Unscheduled Room
    statusBadge = 'Unscheduled';
    // Room unscheduled but load is high (> 0.25 kW) -> flag WASTAGE
    if (actualLoadKW > 0.25) {
      isWasting = true;
      relayShutoffSuggested = !roomState.relayOverrideActive;
      reason = `UNSCHEDULED ACTIVE LOAD: ${actualLoadKW.toFixed(2)} kW drawing power with no class booked. Relay shutoff advised.`;
    } else {
      reason = 'Unscheduled period; appliances are properly de-energized.';
    }
  }

  const wasteKW = isWasting ? Number(Math.max(0, actualLoadKW - expectedLoadKW).toFixed(2)) : 0;

  return {
    roomCode,
    roomId: roomState.id,
    roomName: roomState.name,
    isScheduled: scheduleInfo.isScheduled,
    currentClass: scheduleInfo.activeClass,
    statusBadge,
    expectedOccupancy: occupancy,
    expectedLoadKW,
    actualLoadKW,
    wasteKW,
    isWasting,
    relayShutoffSuggested,
    reason,
  };
}

/**
 * Calculates complete Timetable-Based Energy Savings, comparing:
 * - Baseline: All devices left ON during college hours (08:00 to 15:00 = 7 hours)
 * - Optimized: Energy with timetable-based automated control & idle shutoffs
 */
export function calculate_timetable_energy_savings(
  rooms: RoomState[],
  inventoryList: RoomInventory[],
  simMinutes: number,
  dayOfWeek: DayOfWeek,
  timetable: TimetableEntry[],
  usageFactors: UsageFactors,
  tariffs: CostTariffSettings,
  calendarDayType: CalendarDayType = 'working',
  calendarEntry: CalendarEntry | null = null
): TimetableEnergySavingsSummary {
  // College hours: 08:00 (480 mins) to 15:00 (900 mins) = 7 hours
  const collegeStartM = 8 * 60; // 480
  const collegeEndM = 15 * 60;   // 900
  const isCollegeHours = simMinutes >= collegeStartM && simMinutes <= collegeEndM;

  const roomStatuses = inventoryList.map((inv) => {
    const matchedRoom = rooms.find((r) => mapRoomToCode(r.id) === inv.room) || rooms[0];
    return evaluate_room_timetable_status(
      matchedRoom,
      inv,
      simMinutes,
      dayOfWeek,
      timetable,
      usageFactors,
      calendarDayType,
      calendarEntry
    );
  });

  const scheduledClassesNow = roomStatuses.filter((s) => s.isScheduled).length;
  const activeWastingRooms = roomStatuses.filter((s) => s.isWasting);

  // 1. Calculate Daily Baseline Capacity (Total Connected = 37.8 kW)
  // If devices were left ON for the 7 college hours without timetable control:
  let totalConnectedKW = 0;
  inventoryList.forEach((inv) => {
    totalConnectedKW += inv.total_connected_w / 1000;
  });

  // Typical unmanaged campus operates ~72% of connected load continuously throughout college hours
  const unmanagedOperatingDemandKW = totalConnectedKW * 0.72; // ~27.2 kW
  const baselineDailyEnergyKWh = Number((unmanagedOperatingDemandKW * 7.0).toFixed(2)); // ~190 kWh / day

  // 2. Optimized Consumption: actual measured/simulated load
  let currentOperatingDemandKW = 0;
  let totalDailyEnergyKWh = 0;
  rooms.forEach((r) => {
    currentOperatingDemandKW += r.currentPowerKW;
    totalDailyEnergyKWh += r.dailyEnergyKWh;
  });

  // Calculate savings today
  const actualEnergyTodayKWh = Math.min(baselineDailyEnergyKWh, Math.max(12, totalDailyEnergyKWh));
  const savedKWhToday = Number(Math.max(0, baselineDailyEnergyKWh - actualEnergyTodayKWh).toFixed(2));
  
  // Weekly and Monthly aggregations (5 working days / week, 22 working days / month)
  const savedKWhThisWeek = Number((savedKWhToday * 5).toFixed(1));
  const savedKWhThisMonth = Number((savedKWhToday * 22).toFixed(1));

  // Financial Savings using configurable tariff (Default ₹8.00 per kWh)
  const tariff = tariffs.energyTariffINRPerKWh || 8.0;
  const savedCostTodayINR = Math.round(savedKWhToday * tariff);
  const savedCostThisWeekINR = Math.round(savedKWhThisWeek * tariff);
  const savedCostThisMonthINR = Math.round(savedKWhThisMonth * tariff);

  // Carbon Emission Savings (Default 0.82 kg CO2 / kWh)
  const carbonFactor = tariffs.carbonEmissionFactorKgPerKWh || 0.82;
  const co2AvoidedTodayKg = Number((savedKWhToday * carbonFactor).toFixed(2));
  const co2AvoidedThisMonthKg = Number((savedKWhThisMonth * carbonFactor).toFixed(1));

  // Percentage reduction
  const percentageReduction =
    baselineDailyEnergyKWh > 0
      ? Number(((savedKWhToday / baselineDailyEnergyKWh) * 100).toFixed(1))
      : 0;

  // Peak reduction: removing unscheduled simultaneous running loads
  let unscheduledWasteDemandKW = 0;
  roomStatuses.forEach((st) => {
    if (st.isWasting) unscheduledWasteDemandKW += st.wasteKW;
  });
  const peakReductionKW = Number(Math.max(1.5, unscheduledWasteDemandKW + 3.2).toFixed(2));

  // Top wasting rooms list
  const topWastingRooms: TopWastingRoomItem[] = roomStatuses
    .filter((st) => st.isWasting || st.actualLoadKW > 0.4)
    .sort((a, b) => b.wasteKW - a.wasteKW)
    .slice(0, 5)
    .map((st) => {
      const room = rooms.find((r) => r.id === st.roomId);
      return {
        roomCode: st.roomCode,
        roomName: st.roomName,
        floor: room?.floor || 1,
        currentWasteKW: st.wasteKW,
        accumulatedWasteKWh: Number((st.wasteKW * 2.5).toFixed(2)),
        estimatedCostLossINR: Math.round(st.wasteKW * 2.5 * tariff),
        reason: st.reason,
        relayTriggered: st.relayShutoffSuggested,
      };
    });

  // Per-room breakdown
  const roomBreakdown = inventoryList.map((inv) => {
    const matchedStatus = roomStatuses.find((s) => s.roomCode === inv.room);
    const roomBaselineKWh = Number(((inv.total_connected_w / 1000) * 0.72 * 7.0).toFixed(2));
    const matchedRoom = rooms.find((r) => mapRoomToCode(r.id) === inv.room);
    const actualKWh = matchedRoom ? matchedRoom.dailyEnergyKWh : roomBaselineKWh * 0.55;
    const savedKWh = Number(Math.max(0, roomBaselineKWh - actualKWh).toFixed(2));
    return {
      roomCode: inv.room,
      roomName: inv.name,
      type: inv.type === 'classroom' ? 'Classroom' : 'Laboratory',
      baselineKWh: roomBaselineKWh,
      actualKWh,
      savedKWh,
      savedINR: Math.round(savedKWh * tariff),
      status: matchedStatus?.statusBadge || 'Unscheduled',
    };
  });

  // Per-block breakdown (Classrooms vs Laboratories)
  const classroomRooms = roomBreakdown.filter((r) => r.type === 'Classroom');
  const labRooms = roomBreakdown.filter((r) => r.type === 'Laboratory');

  const calcBlock = (name: string, list: typeof roomBreakdown) => {
    const base = list.reduce((sum, item) => sum + item.baselineKWh, 0);
    const act = list.reduce((sum, item) => sum + item.actualKWh, 0);
    const saved = Math.max(0, base - act);
    return {
      blockName: name,
      baselineKWh: Number(base.toFixed(1)),
      actualKWh: Number(act.toFixed(1)),
      savedKWh: Number(saved.toFixed(1)),
      savedINR: Math.round(saved * tariff),
      percentage: base > 0 ? Number(((saved / base) * 100).toFixed(1)) : 0,
    };
  };

  const blockBreakdown = [
    calcBlock('EEE Academic Classrooms (CR101 - CR105)', classroomRooms),
    calcBlock('EEE Advanced Laboratories (LAB1 - LAB4)', labRooms),
  ];

  return {
    collegeTiming: '8:00 AM - 3:00 PM, Monday to Friday',
    isCollegeHours,
    currentDayType: calendarDayType,
    scheduledClassesNow,
    activeWastingRoomsCount: activeWastingRooms.length,
    baselineEnergyTodayKWh: baselineDailyEnergyKWh,
    actualEnergyTodayKWh,
    savedKWhToday,
    savedKWhThisWeek,
    savedKWhThisMonth,
    savedCostTodayINR,
    savedCostThisWeekINR,
    savedCostThisMonthINR,
    co2AvoidedTodayKg,
    co2AvoidedThisMonthKg,
    percentageReduction,
    peakReductionKW,
    topWastingRooms,
    roomBreakdown,
    blockBreakdown,
  };
}
