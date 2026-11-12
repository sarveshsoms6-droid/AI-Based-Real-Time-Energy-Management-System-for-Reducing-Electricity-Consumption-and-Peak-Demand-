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
  ElectricalRatings,
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
 * Maps a RoomState or RoomId to the Timetable Room Code (CR101-CR105, CR203, LAB1-LAB4)
 */
export function mapRoomToCode(roomId: string): string {
  const clean = roomId.toLowerCase().trim();
  if (clean === 'cr203' || clean.includes('203')) return 'CR203';
  if (clean === 'ca_lab2' || clean.includes('ca_lab2') || clean === 'lab3') return 'LAB3';
  if (clean === 'cp_lab2' || clean.includes('cp_lab2') || clean === 'lab4') return 'LAB4';
  if (clean === 'ca_lab1' || clean.includes('ca_lab1') || clean === 'lab1') return 'LAB1';
  if (clean === 'cp_lab1' || clean.includes('cp_lab1') || clean === 'lab2') return 'LAB2';
  if (clean.includes('101')) return 'CR101';
  if (clean.includes('102')) return 'CR102';
  if (clean.includes('103')) return 'CR103';
  if (clean.includes('104') || clean.includes('201')) return 'CR104';
  if (clean.includes('105') || clean.includes('202')) return 'CR105';
  if (clean.includes('lab3')) return 'LAB3';
  if (clean.includes('lab4')) return 'LAB4';
  if (clean.includes('lab1')) return 'LAB1';
  if (clean.includes('lab2')) return 'LAB2';
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
 * 7-Hour Academic Day College Schedule Intervals (08:00 AM to 03:00 PM)
 * Total duration: 420 minutes = 7.0 hours
 */
export const COLLEGE_HOURS_SCHEDULE = [
  { id: 'P1', name: 'Period 1', start: '08:00', end: '08:50', durationH: 50 / 60, isBreak: false },
  { id: 'P2', name: 'Period 2', start: '08:50', end: '09:40', durationH: 50 / 60, isBreak: false },
  { id: 'break', name: 'Morning Break', start: '09:40', end: '09:55', durationH: 15 / 60, isBreak: true },
  { id: 'P3', name: 'Period 3', start: '09:55', end: '10:45', durationH: 50 / 60, isBreak: false },
  { id: 'P4', name: 'Period 4', start: '10:45', end: '11:35', durationH: 50 / 60, isBreak: false },
  { id: 'lunch', name: 'Lunch Interval', start: '11:35', end: '12:20', durationH: 45 / 60, isBreak: true },
  { id: 'P5', name: 'Period 5', start: '12:20', end: '13:10', durationH: 50 / 60, isBreak: false },
  { id: 'P6', name: 'Period 6', start: '13:10', end: '14:00', durationH: 50 / 60, isBreak: false },
  { id: 'P7', name: 'Period 7', start: '14:00', end: '14:50', durationH: 50 / 60, isBreak: false },
  { id: 'egress', name: 'Session Close', start: '14:50', end: '15:00', durationH: 10 / 60, isBreak: true },
];

/**
 * Computes connected wattage for a room inventory based on current electrical ratings
 */
export function getRoomConnectedWatts(inv: RoomInventory, ratings?: ElectricalRatings): number {
  if (ratings) {
    if (inv.type === 'classroom') {
      const fans = inv.fans || 6;
      const tubes = inv.tube_lights || 10;
      return (
        fans * (ratings.classroomFanWatts ?? 75) +
        tubes * (ratings.classroomTubeLightWatts ?? 40) +
        (ratings.classroomProjectorWatts ?? 250)
      );
    }
    if (inv.room === 'LAB1' || inv.room === 'LAB3') {
      const acs = inv.ac_units || 2;
      const tubes = inv.tube_lights || 10;
      const socket = ratings.circuitLabDefaultSocketWatts ?? 2000;
      return (
        acs * (ratings.circuitLabAcWatts ?? 2200) +
        tubes * (ratings.circuitLabTubeLightWatts ?? 40) +
        socket
      );
    }
    if (inv.room === 'LAB2' || inv.room === 'LAB4') {
      const pcs = inv.computers || 32;
      const acs = inv.ac_units || 2;
      const tubes = inv.tube_lights || 10;
      return (
        pcs * (ratings.progLabDesktopWatts ?? 150) +
        acs * (ratings.progLabAcWatts ?? 1800) +
        tubes * (ratings.progLabTubeLightWatts ?? 40)
      );
    }
  }
  return inv.total_connected_w || 1100;
}

/**
 * Calculates complete Timetable-Based Energy Savings, comparing:
 * - Baseline: 7-Hour Unmanaged Operating Baseline where devices run without timetable control
 * - Optimized: Timetable-adhering schedule with idle de-energization and real-time wastage feedback
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
  calendarEntry: CalendarEntry | null = null,
  ratings?: ElectricalRatings
): TimetableEnergySavingsSummary {
  // College hours: 08:00 (480 mins) to 15:00 (900 mins) = 7 hours
  const collegeStartM = 8 * 60; // 480
  const collegeEndM = 15 * 60;   // 900
  const isCollegeHours = simMinutes >= collegeStartM && simMinutes <= collegeEndM;

  // 1. Evaluate Room Timetable Statuses for all rooms
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

  // 2. Unmanaged 7-Hour Baseline Calculation (Sum of Quantity * Rated Power * 7.0 h / 1000)
  let totalConnectedKW = 0;
  let floor1BaselineKWh = 0;
  let floor2BaselineKWh = 0;
  const roomBaselineMap = new Map<string, number>();

  inventoryList.forEach((inv) => {
    const connectedW = getRoomConnectedWatts(inv, ratings);
    const kw = connectedW / 1000;
    totalConnectedKW += kw;
    const roomBaselineKWh = Number((kw * 7.0).toFixed(2));
    roomBaselineMap.set(inv.room, roomBaselineKWh);
    if (inv.floor === 1) floor1BaselineKWh += roomBaselineKWh;
    if (inv.floor === 2) floor2BaselineKWh += roomBaselineKWh;
  });

  totalConnectedKW = Number(totalConnectedKW.toFixed(2));
  const baselineEnergyTodayKWh = Number((totalConnectedKW * 7.0).toFixed(2));
  const baselineDailyEnergyKWh = baselineEnergyTodayKWh;
  floor1BaselineKWh = Number(floor1BaselineKWh.toFixed(2));
  floor2BaselineKWh = Number(floor2BaselineKWh.toFixed(2));
  // Coincident unmanaged baseline peak demand (standard 80% diversity factor)
  const baselinePeakDemandKW = Number((totalConnectedKW * 0.80).toFixed(2));

  // 3. Timetable Scheduled Energy Function for any day
  const calcDaySchedule = (targetDay: DayOfWeek, targetDayType: CalendarDayType, targetCalEntry: CalendarEntry | null) => {
    let dayTotalKWh = 0;
    let dayPeakKW = 0;
    const roomEnergy = new Map<string, number>();
    const roomScheduledHours = new Map<string, number>();

    inventoryList.forEach((inv) => {
      roomEnergy.set(inv.room, 0);
      roomScheduledHours.set(inv.room, 0);
    });

    COLLEGE_HOURS_SCHEDULE.forEach((slot) => {
      const slotMidM = (timeStringToMinutes(slot.start) + timeStringToMinutes(slot.end)) / 2;
      let slotBuildingKW = 0;

      inventoryList.forEach((inv) => {
        let kw = 0.03; // Standby load during breaks/unoccupied slots
        if (!slot.isBreak && targetDayType !== 'holiday' && targetDayType !== 'vacation') {
          if (targetDayType === 'exam' && targetCalEntry) {
            const isExam = targetCalEntry.rooms_affected === 'all' || targetCalEntry.rooms_affected.includes(inv.room);
            if (isExam) {
              kw = calculate_expected_load(inv, 45, usageFactors);
              roomScheduledHours.set(inv.room, (roomScheduledHours.get(inv.room) || 0) + slot.durationH);
            }
          } else {
            const cls = timetable.find((e) => {
              if (e.day !== targetDay) return false;
              if (e.room !== inv.room) return false;
              const s = timeStringToMinutes(e.start_time);
              const end = timeStringToMinutes(e.end_time);
              return slotMidM >= s && slotMidM < end;
            });
            if (cls) {
              kw = calculate_expected_load(inv, cls.strength || 45, usageFactors);
              roomScheduledHours.set(inv.room, (roomScheduledHours.get(inv.room) || 0) + slot.durationH);
            }
          }
        }
        slotBuildingKW += kw;
        roomEnergy.set(inv.room, (roomEnergy.get(inv.room) || 0) + kw * slot.durationH);
      });

      dayTotalKWh += slotBuildingKW * slot.durationH;
      if (slotBuildingKW > dayPeakKW) dayPeakKW = slotBuildingKW;
    });

    return { dayTotalKWh, dayPeakKW, roomEnergy, roomScheduledHours };
  };

  // Scheduled baseline for the active day
  const activeDayCalc = calcDaySchedule(dayOfWeek, calendarDayType, calendarEntry);

  // 4. Dynamic Wastage and Real-time Appliance Feedback
  let currentActiveWasteKW = 0;
  let additionalWasteEnergyTodayKWh = 0;
  const roomActualMap = new Map<string, number>();

  inventoryList.forEach((inv) => {
    const baseScheduledKWh = activeDayCalc.roomEnergy.get(inv.room) || 0;
    const scheduledH = activeDayCalc.roomScheduledHours.get(inv.room) || 0;
    const unscheduledH = Math.max(0, 7.0 - scheduledH);

    const matchedRoom = rooms.find((r) => mapRoomToCode(r.id) === inv.room);
    const st = roomStatuses.find((s) => s.roomCode === inv.room);

    let roomWasteKWh = 0;
    if (st && !st.isScheduled && matchedRoom && matchedRoom.currentPowerKW > 0.05) {
      const idleWasteKW = Math.max(0, matchedRoom.currentPowerKW - 0.03);
      roomWasteKWh = idleWasteKW * unscheduledH;
      currentActiveWasteKW += idleWasteKW;
    } else if (st && st.isScheduled && matchedRoom && matchedRoom.currentPowerKW > (st.expectedLoadKW + 0.1)) {
      const extraKW = matchedRoom.currentPowerKW - st.expectedLoadKW;
      roomWasteKWh = extraKW * scheduledH;
    }

    const roomActualKWh = Number(Math.max(0.1, baseScheduledKWh + roomWasteKWh).toFixed(2));
    roomActualMap.set(inv.room, roomActualKWh);
    additionalWasteEnergyTodayKWh += roomWasteKWh;
  });

  // 5. Today's Savings Metrics (Nonzero, physically derived)
  const actualEnergyTodayKWh = Number(
    Math.min(baselineDailyEnergyKWh, Math.max(0.5, activeDayCalc.dayTotalKWh + additionalWasteEnergyTodayKWh)).toFixed(2)
  );
  const savedKWhToday = Number(Math.max(0, baselineDailyEnergyKWh - actualEnergyTodayKWh).toFixed(2));
  const percentageReduction =
    baselineDailyEnergyKWh > 0
      ? Number(((savedKWhToday / baselineDailyEnergyKWh) * 100).toFixed(1))
      : 0;

  // 6. Peak Demand Cut (Baseline Peak Demand - Optimized Coincident Peak Demand)
  const currentWasteKW = activeWastingRooms.reduce((sum, s) => sum + s.wasteKW, 0);
  const optimizedPeakDemandKW = Number((activeDayCalc.dayPeakKW + currentWasteKW).toFixed(2));
  const peakReductionKW = Number(Math.max(0, baselinePeakDemandKW - optimizedPeakDemandKW).toFixed(2));
  const peakPercentageReduction =
    baselinePeakDemandKW > 0
      ? Number(((peakReductionKW / baselinePeakDemandKW) * 100).toFixed(1))
      : 0;

  // 7. Weekly Aggregation (5 Instructional Days) & Monthly (22 Working Days Estimate)
  const daysList: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  let weeklySavedKWh = 0;

  daysList.forEach((d) => {
    if (d === dayOfWeek) {
      weeklySavedKWh += savedKWhToday;
    } else {
      const dCalc = calcDaySchedule(d, 'working', null);
      const daySaved = Math.max(0, baselineDailyEnergyKWh - dCalc.dayTotalKWh);
      weeklySavedKWh += daySaved;
    }
  });

  const savedKWhThisWeek = Number(weeklySavedKWh.toFixed(1));
  const savedKWhThisMonth = Number(((savedKWhThisWeek / 5) * 22).toFixed(1));

  // Tariffs & Financial Savings
  const tariff = tariffs.energyTariffINRPerKWh || 8.0;
  const savedCostTodayINR = Math.round(savedKWhToday * tariff);
  const savedCostThisWeekINR = Math.round(savedKWhThisWeek * tariff);
  const savedCostThisMonthINR = Math.round(savedKWhThisMonth * tariff);

  // Carbon Emission Savings (0.82 kg CO2 / kWh)
  const carbonFactor = tariffs.carbonEmissionFactorKgPerKWh || 0.82;
  const co2AvoidedTodayKg = Number((savedKWhToday * carbonFactor).toFixed(2));
  const co2AvoidedThisMonthKg = Number((savedKWhThisMonth * carbonFactor).toFixed(1));

  // 8. Top Wasting Rooms Alert List
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

  // 9. Room Breakdown (All Monitored Spaces)
  const roomBreakdown = inventoryList.map((inv) => {
    const matchedStatus = roomStatuses.find((s) => s.roomCode === inv.room);
    const roomBaselineKWh = roomBaselineMap.get(inv.room) || 0;
    const roomActualKWh = roomActualMap.get(inv.room) || Number((roomBaselineKWh * 0.35).toFixed(2));
    const roomSavedKWh = Number(Math.max(0, roomBaselineKWh - roomActualKWh).toFixed(2));

    return {
      roomCode: inv.room,
      roomName: inv.name,
      type: inv.type === 'classroom' ? 'Classroom' : 'Laboratory',
      floor: inv.floor,
      baselineKWh: roomBaselineKWh,
      actualKWh: roomActualKWh,
      savedKWh: roomSavedKWh,
      savedINR: Math.round(roomSavedKWh * tariff),
      wasteKW: matchedStatus?.wasteKW || 0,
      status: matchedStatus?.statusBadge || 'Unscheduled',
    };
  });

  // 10. Block Breakdown & Floor Breakdown
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
    calcBlock('EEE Academic Classrooms (CR101 - CR105, CR203)', classroomRooms),
    calcBlock('EEE Advanced Laboratories (LAB1 - LAB4)', labRooms),
  ];

  // Floor breakdowns
  const floor1Rooms = roomBreakdown.filter((r) => r.floor === 1);
  const floor2Rooms = roomBreakdown.filter((r) => r.floor === 2);
  const floor1ActualKWh = Number(floor1Rooms.reduce((sum, r) => sum + r.actualKWh, 0).toFixed(2));
  const floor2ActualKWh = Number(floor2Rooms.reduce((sum, r) => sum + r.actualKWh, 0).toFixed(2));
  const floor1SavedKWh = Number(Math.max(0, floor1BaselineKWh - floor1ActualKWh).toFixed(2));
  const floor2SavedKWh = Number(Math.max(0, floor2BaselineKWh - floor2ActualKWh).toFixed(2));

  return {
    collegeTiming: '8:00 AM - 3:00 PM, Monday to Friday',
    isCollegeHours,
    currentDayType: calendarDayType,
    scheduledClassesNow,
    activeWastingRoomsCount: activeWastingRooms.length,
    baselineEnergyTodayKWh,
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
    peakPercentageReduction,
    baselinePeakDemandKW,
    optimizedPeakDemandKW,
    floor1BaselineKWh,
    floor2BaselineKWh,
    floor1ActualKWh,
    floor2ActualKWh,
    floor1SavedKWh,
    floor2SavedKWh,
    isScenarioEstimate: true,
    topWastingRooms,
    roomBreakdown,
    blockBreakdown,
  };
}
