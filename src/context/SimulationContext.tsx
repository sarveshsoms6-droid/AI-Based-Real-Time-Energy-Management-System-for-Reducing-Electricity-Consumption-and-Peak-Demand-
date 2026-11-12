import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  RoomId,
  FloorId,
  RoomState,
  RoomAppliances,
  CalculationMode,
  ElectricalRatings,
  CostTariffSettings,
  BuildingAggregates,
  HistoricalDataPoint,
  WhatIfParameters,
  ACMode,
  TimetableEntry,
  RoomInventory,
  CalendarEntry,
  UsageFactors,
  DayOfWeek,
  TimetableEnergySavingsSummary,
  RoomAuditProfile,
  ApplianceAuditItem,
  CircuitLabPIRState,
  ACIntelligentRecommendation,
  EnergyManagementRecommendation,
  BeforeAfterComparison,
} from '../types';
import {
  DEFAULT_ELECTRICAL_RATINGS,
  DEFAULT_TARIFF_SETTINGS,
  DEFAULT_WHAT_IF_PARAMS,
  createDefaultRooms,
} from '../data/defaultBuildingState';
import {
  SAMPLE_TIMETABLE_DATA,
  DEFAULT_ROOM_INVENTORY,
  DEFAULT_CALENDAR_DATA,
  DEFAULT_USAGE_FACTORS,
} from '../data/timetableData';
import {
  DEFAULT_ROOM_AUDIT_PROFILES,
  DEFAULT_CIRCUIT_LAB_PIR_STATES,
} from '../data/defaultAuditData';
import { calculateRoomElectrical } from '../engine/electricalCalculator';
import { updateRoomThermalPhysics } from '../engine/physicsEngine';
import { IDataProvider, SimulationDataProvider, ESP32DataProvider } from '../engine/dataProviders';
import {
  calculate_timetable_energy_savings,
  getActiveCalendarDayType,
  mapRoomToCode,
} from '../engine/timetableEnergyEngine';
import {
  generateACIntelligentRecommendation,
  generateBuildingManagementRecommendations,
  calculateBeforeAfterComparison,
  getPIRStatusLevel,
} from '../engine/energyManagementEngine';

interface SimulationContextType {
  rooms: RoomState[];
  ratings: ElectricalRatings;
  tariffs: CostTariffSettings;
  whatIfParams: WhatIfParameters;
  aggregates: BuildingAggregates;
  historicalData: HistoricalDataPoint[];
  isSimulating: boolean;
  simSpeed: 1 | 5 | 10 | 60;
  simTimeMinutes: number; // 0 to 1439
  simTimeString: string;
  selectedRoomId: RoomId | null;
  hardwareMode: 'SIMULATION' | 'HARDWARE';
  dataProvider: IDataProvider;
  activeFloorView: FloorId;

  // Timetable & Calendar Integration
  timetable: TimetableEntry[];
  roomInventory: RoomInventory[];
  calendar: CalendarEntry[];
  usageFactors: UsageFactors;
  activeDayOfWeek: DayOfWeek;
  activeCalendarDate: string;
  timetableSavings: TimetableEnergySavingsSummary;
  
  // Actions
  setSelectedRoomId: (id: RoomId | null) => void;
  setActiveFloorView: (floor: FloorId) => void;
  setSimSpeed: (speed: 1 | 5 | 10 | 60) => void;
  toggleSimulationRunning: () => void;
  setHardwareMode: (mode: 'SIMULATION' | 'HARDWARE') => void;
  resetSimulation: () => void;
  setActiveDayOfWeek: (day: DayOfWeek) => void;
  setActiveCalendarDate: (date: string) => void;
  
  // Room controls
  setCalculationMode: (roomId: RoomId, mode: CalculationMode) => void;
  updateManualParams: (roomId: RoomId, params: Partial<RoomState['manualParams']>) => void;
  updateEnvParams: (roomId: RoomId, params: Partial<RoomState['envParams']>) => void;
  toggleClassroomLight: (roomId: RoomId, index: number) => void;
  toggleClassroomFan: (roomId: RoomId, index: number) => void;
  toggleClassroomProjector: (roomId: RoomId) => void;
  setCircuitLabAcMode: (roomId: RoomId, acIndex: 0 | 1, mode: ACMode) => void;
  toggleCircuitLabLight: (roomId: RoomId, index: number) => void;
  setCircuitLabSocket: (roomId: RoomId, active: boolean, watts?: number) => void;
  setProgLabComputerCount: (roomId: RoomId, count: number) => void;
  toggleProgLabDesktop: (roomId: RoomId, index: number) => void;
  setProgLabAcMode: (roomId: RoomId, acIndex: 0 | 1, mode: ACMode) => void;
  toggleProgLabLight: (roomId: RoomId, index: number) => void;
  
  // Group actions & Relay control
  executeGroupAction: (
    roomId: RoomId,
    action:
      | 'switch_all_on'
      | 'switch_all_off'
      | 'lights_on'
      | 'lights_off'
      | 'fans_on'
      | 'fans_off'
      | 'ac_on'
      | 'ac_off'
      | 'ac_auto'
      | 'computers_on'
      | 'computers_off'
  ) => void;
  triggerRelayShutoff: (roomId: RoomId) => void;
  triggerAllRelayShutoffs: () => void;
  toggleRelayOverride: (roomId: RoomId) => void;
  
  // Timetable CRUD & CSV
  addTimetableEntry: (entry: Omit<TimetableEntry, 'id'>) => void;
  updateTimetableEntry: (id: string, entry: Partial<TimetableEntry>) => void;
  deleteTimetableEntry: (id: string) => void;
  importTimetableCSV: (csvText: string) => { success: boolean; count: number; error?: string };
  exportTimetableCSVTemplate: () => string;
  addCalendarEntry: (entry: Omit<CalendarEntry, 'id'>) => void;
  deleteCalendarEntry: (id: string) => void;
  updateUsageFactors: (factors: Partial<UsageFactors>) => void;
  
  // Settings
  updateElectricalRatings: (ratings: Partial<ElectricalRatings>) => void;
  updateTariffs: (tariffs: Partial<CostTariffSettings>) => void;
  updateWhatIfParams: (params: Partial<WhatIfParameters>) => void;

  // Module 1: AI Energy Audit
  auditProfiles: RoomAuditProfile[];
  updateApplianceAuditConfig: (roomId: RoomId, applianceId: string, updates: Partial<ApplianceAuditItem>) => void;
  resetAuditProfiles: () => void;

  // Module 2: AI Energy Management & Action Centre
  circuitLabPIRStates: Record<'ca_lab1' | 'ca_lab2', CircuitLabPIRState>;
  updateCircuitLabPIR: (
    roomId: 'ca_lab1' | 'ca_lab2',
    occupantCount: number,
    schedule?: { hour: number; expectedOccupancy: number }[]
  ) => void;
  acRecommendations: Record<'ca_lab1' | 'ca_lab2', ACIntelligentRecommendation>;
  acceptACRecommendation: (roomId: 'ca_lab1' | 'ca_lab2') => void;
  rejectACRecommendation: (roomId: 'ca_lab1' | 'ca_lab2') => void;
  managementRecommendations: EnergyManagementRecommendation[];
  acceptedManagementActionIds: string[];
  acceptManagementAction: (actionId: string) => void;
  rejectManagementAction: (actionId: string) => void;
  resetManagementActions: () => void;
  beforeAfterComparison: BeforeAfterComparison;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_ROOMS = 'campusenergy_rooms_v2';
const LOCAL_STORAGE_KEY_RATINGS = 'campusenergy_ratings_v2';
const LOCAL_STORAGE_KEY_TARIFFS = 'campusenergy_tariffs_v2';
const LOCAL_STORAGE_KEY_TIMETABLE = 'campusenergy_timetable_v2';
const LOCAL_STORAGE_KEY_CALENDAR = 'campusenergy_calendar_v2';
const LOCAL_STORAGE_KEY_USAGE_FACTORS = 'campusenergy_usage_factors_v2';
const LOCAL_STORAGE_KEY_AUDIT = 'campusenergy_audit_profiles_v2';
const LOCAL_STORAGE_KEY_PIR = 'campusenergy_pir_states_v2';
const LOCAL_STORAGE_KEY_ACTIONS = 'campusenergy_mgmt_actions_v2';

function generateInitialHistory(currentDemandKW: number): HistoricalDataPoint[] {
  const points: HistoricalDataPoint[] = [];
  const baseHour = 10;
  for (let h = 0; h <= baseHour; h++) {
    const timeLabel = `${h.toString().padStart(2, '0')}:00`;
    let factor = 0.15;
    if (h >= 8) factor = 0.65 + (h - 8) * 0.12;
    const demand = Number((currentDemandKW * factor + Math.random() * 0.4).toFixed(2));
    points.push({
      timestamp: timeLabel,
      hour: h,
      minute: 0,
      buildingDemandKW: demand,
      floor1DemandKW: Number((demand * 0.48).toFixed(2)),
      floor2DemandKW: Number((demand * 0.52).toFixed(2)),
      classroomsKW: Number((demand * 0.18).toFixed(2)),
      circuitLabsKW: Number((demand * 0.36).toFixed(2)),
      progLabsKW: Number((demand * 0.46).toFixed(2)),
      temperature: 28 + (h * 0.4),
      energyKWhCumulative: Number((demand * h * 0.85).toFixed(2)),
    });
  }
  return points;
}

export const SimulationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load ratings & tariffs
  const [ratings, setRatings] = useState<ElectricalRatings>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_RATINGS);
      return saved ? JSON.parse(saved) : DEFAULT_ELECTRICAL_RATINGS;
    } catch {
      return DEFAULT_ELECTRICAL_RATINGS;
    }
  });

  const [tariffs, setTariffs] = useState<CostTariffSettings>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_TARIFFS);
      return saved ? JSON.parse(saved) : DEFAULT_TARIFF_SETTINGS;
    } catch {
      return DEFAULT_TARIFF_SETTINGS;
    }
  });

  const [whatIfParams, setWhatIfParams] = useState<WhatIfParameters>(DEFAULT_WHAT_IF_PARAMS);

  const [rooms, setRooms] = useState<RoomState[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_ROOMS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 10) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return createDefaultRooms(DEFAULT_ELECTRICAL_RATINGS);
  });

  // Timetable, Calendar & Usage factors
  const [timetable, setTimetable] = useState<TimetableEntry[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_TIMETABLE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return SAMPLE_TIMETABLE_DATA;
  });

  const [roomInventory] = useState<RoomInventory[]>(DEFAULT_ROOM_INVENTORY);

  const [calendar, setCalendar] = useState<CalendarEntry[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_CALENDAR);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_CALENDAR_DATA;
  });

  const [usageFactors, setUsageFactors] = useState<UsageFactors>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_USAGE_FACTORS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_USAGE_FACTORS;
  });

  const [activeDayOfWeek, setActiveDayOfWeek] = useState<DayOfWeek>('Monday');
  const [activeCalendarDate, setActiveCalendarDate] = useState<string>('2026-11-09');

  // Module 1: AI Energy Audit state
  const [auditProfiles, setAuditProfiles] = useState<RoomAuditProfile[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_AUDIT);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_ROOM_AUDIT_PROFILES;
  });

  // Module 2: Circuit Lab PIR Occupancy state
  const [circuitLabPIRStates, setCircuitLabPIRStates] = useState<Record<'ca_lab1' | 'ca_lab2', CircuitLabPIRState>>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_PIR);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_CIRCUIT_LAB_PIR_STATES;
  });

  // Module 2: Management Accepted Action IDs
  const [acceptedManagementActionIds, setAcceptedManagementActionIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_ACTIONS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<1 | 5 | 10 | 60>(1);
  const [simTimeMinutes, setSimTimeMinutes] = useState<number>(9 * 60 + 15); // 09:15 AM (Class in session)
  const [selectedRoomId, setSelectedRoomId] = useState<RoomId | null>(null);
  const [activeFloorView, setActiveFloorView] = useState<FloorId>(1);
  const [hardwareMode, setHardwareMode] = useState<'SIMULATION' | 'HARDWARE'>('SIMULATION');

  const simDataProvider = useMemo(() => new SimulationDataProvider(), []);
  const esp32DataProvider = useMemo(() => new ESP32DataProvider(), []);
  const dataProvider = hardwareMode === 'HARDWARE' ? esp32DataProvider : simDataProvider;

  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>(() => generateInitialHistory(18.5));

  // Persistence effects
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_ROOMS, JSON.stringify(rooms));
    } catch {}
  }, [rooms]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_RATINGS, JSON.stringify(ratings));
    } catch {}
  }, [ratings]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_TARIFFS, JSON.stringify(tariffs));
    } catch {}
  }, [tariffs]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_TIMETABLE, JSON.stringify(timetable));
    } catch {}
  }, [timetable]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_CALENDAR, JSON.stringify(calendar));
    } catch {}
  }, [calendar]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_USAGE_FACTORS, JSON.stringify(usageFactors));
    } catch {}
  }, [usageFactors]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_AUDIT, JSON.stringify(auditProfiles));
    } catch {}
  }, [auditProfiles]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_PIR, JSON.stringify(circuitLabPIRStates));
    } catch {}
  }, [circuitLabPIRStates]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_ACTIONS, JSON.stringify(acceptedManagementActionIds));
    } catch {}
  }, [acceptedManagementActionIds]);

  // Format simulated time string
  const simTimeString = useMemo(() => {
    const hours = Math.floor((simTimeMinutes / 60) % 24);
    const mins = Math.floor(simTimeMinutes % 60);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }, [simTimeMinutes]);

  // Simulation tick loop
  useEffect(() => {
    if (!isSimulating) return;

    const intervalMs = 1000;
    const timer = setInterval(() => {
      setSimTimeMinutes((prev) => (prev + (simSpeed * 0.2)) % 1440);

      setRooms((prevRooms) => {
        return prevRooms.map((room) => {
          const thermalResult = updateRoomThermalPhysics(room, simSpeed, simTimeMinutes);
          
          const roomWithUpdatedPhysics: RoomState = {
            ...room,
            envParams: {
              ...room.envParams,
              indoorTemp: thermalResult.indoorTemp,
            },
            physics: thermalResult.updatedPhysics,
          };

          const electricalResult = calculateRoomElectrical(roomWithUpdatedPhysics, ratings, simSpeed);

          return {
            ...roomWithUpdatedPhysics,
            ...electricalResult,
          };
        });
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isSimulating, simSpeed, simTimeMinutes, ratings]);

  // Compute building-wide aggregates
  const aggregates = useMemo<BuildingAggregates>(() => {
    let totalConnected = 0;
    let currentBuildingDemand = 0;
    let floor1Demand = 0;
    let floor2Demand = 0;
    let dailyEnergy = 0;
    let monthlyEnergy = 0;
    let activeAppliances = 0;
    let totalAppliances = 0;
    let activeRooms = 0;
    let pfWeightedSum = 0;

    rooms.forEach((r) => {
      totalConnected += r.connectedLoadKW;
      currentBuildingDemand += r.currentPowerKW;
      dailyEnergy += r.dailyEnergyKWh;
      monthlyEnergy += r.monthlyEnergyKWh;
      activeAppliances += r.activeApplianceCount;
      totalAppliances += r.totalApplianceCount;

      if (r.floor === 1) floor1Demand += r.currentPowerKW;
      if (r.floor === 2) floor2Demand += r.currentPowerKW;

      if (r.currentPowerKW > 0.05) activeRooms++;
      pfWeightedSum += (r.manualParams.powerFactor || 0.92) * (r.currentPowerKW + 0.1);
    });

    const avgPF = Number((pfWeightedSum / (currentBuildingDemand + 1)).toFixed(2));
    const estimatedDailyCost = dailyEnergy * (tariffs.energyTariffINRPerKWh || 8.0);
    const estimatedMonthlyCost = monthlyEnergy * (tariffs.energyTariffINRPerKWh || 8.0) + (currentBuildingDemand * tariffs.peakDemandChargeINRPerKW);

    const predictedPeakDemand = Number(Math.max(currentBuildingDemand * 1.15, currentBuildingDemand + 1.8).toFixed(2));
    const potentialSavingPct = 22.8;
    const carbonEmissionsKg = Number((dailyEnergy * (tariffs.carbonEmissionFactorKgPerKWh || 0.82)).toFixed(2));

    let buildingStatus: RoomState['status'] = 'normal';
    if (currentBuildingDemand > totalConnected * 0.85) buildingStatus = 'critical';
    else if (currentBuildingDemand > totalConnected * 0.65) buildingStatus = 'high';
    else if (currentBuildingDemand < totalConnected * 0.25) buildingStatus = 'low';

    return {
      totalConnectedLoadKW: Number(totalConnected.toFixed(2)),
      currentBuildingDemandKW: Number(currentBuildingDemand.toFixed(2)),
      floor1DemandKW: Number(floor1Demand.toFixed(2)),
      floor2DemandKW: Number(floor2Demand.toFixed(2)),
      dailyEnergyConsumptionKWh: Number(dailyEnergy.toFixed(2)),
      monthlyEnergyConsumptionKWh: Number(monthlyEnergy.toFixed(2)),
      estimatedDailyCostINR: Math.round(estimatedDailyCost),
      estimatedMonthlyCostINR: Math.round(estimatedMonthlyCost),
      predictedPeakDemandKW: predictedPeakDemand,
      predictedPeakTime: '13:45',
      potentialEnergySavingPct: potentialSavingPct,
      activeApplianceCount: activeAppliances,
      totalApplianceCount: totalAppliances,
      activeRoomsCount: activeRooms,
      totalRoomsCount: rooms.length,
      carbonEmissionsKg,
      powerFactorAvg: avgPF,
      gridFrequencyHz: 50.0,
      buildingStatus,
    };
  }, [rooms, tariffs]);

  // Timetable energy savings calculation
  const timetableSavings = useMemo<TimetableEnergySavingsSummary>(() => {
    const { dayType, entry } = getActiveCalendarDayType(activeCalendarDate, calendar);
    return calculate_timetable_energy_savings(
      rooms,
      roomInventory,
      simTimeMinutes,
      activeDayOfWeek,
      timetable,
      usageFactors,
      tariffs,
      dayType,
      entry,
      ratings
    );
  }, [rooms, roomInventory, simTimeMinutes, activeDayOfWeek, timetable, usageFactors, tariffs, activeCalendarDate, calendar, ratings]);

  // Rolling historical data
  const lastLoggedMinuteRef = useRef<number>(-1);
  useEffect(() => {
    const currentSimMinute = Math.floor(simTimeMinutes);
    if (Math.abs(currentSimMinute - lastLoggedMinuteRef.current) >= 15) {
      lastLoggedMinuteRef.current = currentSimMinute;
      const hours = Math.floor((currentSimMinute / 60) % 24);
      const mins = Math.floor(currentSimMinute % 60);
      const timeLabel = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;

      let crKW = 0;
      let caKW = 0;
      let cpKW = 0;
      rooms.forEach((r) => {
        if (r.type === 'classroom') crKW += r.currentPowerKW;
        else if (r.type === 'circuit_lab') caKW += r.currentPowerKW;
        else if (r.type === 'programming_lab') cpKW += r.currentPowerKW;
      });

      const newPoint: HistoricalDataPoint = {
        timestamp: timeLabel,
        hour: hours,
        minute: mins,
        buildingDemandKW: aggregates.currentBuildingDemandKW,
        floor1DemandKW: aggregates.floor1DemandKW,
        floor2DemandKW: aggregates.floor2DemandKW,
        classroomsKW: Number(crKW.toFixed(2)),
        circuitLabsKW: Number(caKW.toFixed(2)),
        progLabsKW: Number(cpKW.toFixed(2)),
        temperature: 30.5,
        energyKWhCumulative: aggregates.dailyEnergyConsumptionKWh,
      };

      setHistoricalData((prev) => {
        const next = [...prev, newPoint];
        if (next.length > 48) next.shift();
        return next;
      });
    }
  }, [simTimeMinutes, aggregates, rooms]);

  // Mutators for Room States
  const setCalculationMode = useCallback((roomId: RoomId, mode: CalculationMode) => {
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id !== roomId) return r;
        const updated = { ...r, calculationMode: mode };
        const calc = calculateRoomElectrical(updated, ratings, 0);
        return { ...updated, ...calc };
      })
    );
  }, [ratings]);

  const updateManualParams = useCallback((roomId: RoomId, params: Partial<RoomState['manualParams']>) => {
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id !== roomId) return r;
        const updated = {
          ...r,
          manualParams: { ...r.manualParams, ...params },
        };
        const calc = calculateRoomElectrical(updated, ratings, 0);
        return { ...updated, ...calc };
      })
    );
  }, [ratings]);

  const updateEnvParams = useCallback((roomId: RoomId, params: Partial<RoomState['envParams']>) => {
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id !== roomId) return r;
        const updated = {
          ...r,
          envParams: { ...r.envParams, ...params },
        };
        const thermal = updateRoomThermalPhysics(updated, 0, simTimeMinutes);
        return {
          ...updated,
          physics: thermal.updatedPhysics,
        };
      })
    );
  }, [simTimeMinutes]);

  const toggleClassroomLight = useCallback((roomId: RoomId, index: number) => {
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id !== roomId || r.appliances.type !== 'classroom') return r;
        const tubeLights = [...r.appliances.data.tubeLights];
        tubeLights[index] = !tubeLights[index];
        const updated = {
          ...r,
          appliances: {
            type: 'classroom' as const,
            data: { ...r.appliances.data, tubeLights },
          },
        };
        return { ...updated, ...calculateRoomElectrical(updated, ratings, 0) };
      })
    );
  }, [ratings]);

  const toggleClassroomFan = useCallback((roomId: RoomId, index: number) => {
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id !== roomId || r.appliances.type !== 'classroom') return r;
        const fans = [...r.appliances.data.fans];
        fans[index] = !fans[index];
        const updated = {
          ...r,
          appliances: {
            type: 'classroom' as const,
            data: { ...r.appliances.data, fans },
          },
        };
        return { ...updated, ...calculateRoomElectrical(updated, ratings, 0) };
      })
    );
  }, [ratings]);

  const toggleClassroomProjector = useCallback((roomId: RoomId) => {
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id !== roomId || r.appliances.type !== 'classroom') return r;
        const updated = {
          ...r,
          appliances: {
            type: 'classroom' as const,
            data: { ...r.appliances.data, projector: !r.appliances.data.projector },
          },
        };
        return { ...updated, ...calculateRoomElectrical(updated, ratings, 0) };
      })
    );
  }, [ratings]);

  const setCircuitLabAcMode = useCallback((roomId: RoomId, acIndex: 0 | 1, mode: ACMode) => {
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id !== roomId || r.appliances.type !== 'circuit_lab') return r;
        const acUnits = [...r.appliances.data.acUnits] as [ACMode, ACMode];
        acUnits[acIndex] = mode;
        const updated = {
          ...r,
          appliances: {
            type: 'circuit_lab' as const,
            data: { ...r.appliances.data, acUnits },
          },
        };
        return { ...updated, ...calculateRoomElectrical(updated, ratings, 0) };
      })
    );
  }, [ratings]);

  const toggleCircuitLabLight = useCallback((roomId: RoomId, index: number) => {
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id !== roomId || r.appliances.type !== 'circuit_lab') return r;
        const tubeLights = [...r.appliances.data.tubeLights];
        tubeLights[index] = !tubeLights[index];
        const updated = {
          ...r,
          appliances: {
            type: 'circuit_lab' as const,
            data: { ...r.appliances.data, tubeLights },
          },
        };
        return { ...updated, ...calculateRoomElectrical(updated, ratings, 0) };
      })
    );
  }, [ratings]);

  const setCircuitLabSocket = useCallback((roomId: RoomId, active: boolean, watts?: number) => {
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id !== roomId || r.appliances.type !== 'circuit_lab') return r;
        const updated = {
          ...r,
          appliances: {
            type: 'circuit_lab' as const,
            data: {
              ...r.appliances.data,
              socketActive: active,
              socketWatts: watts !== undefined ? watts : r.appliances.data.socketWatts,
            },
          },
        };
        return { ...updated, ...calculateRoomElectrical(updated, ratings, 0) };
      })
    );
  }, [ratings]);

  const setProgLabComputerCount = useCallback((roomId: RoomId, count: number) => {
    const clamped = Math.max(0, Math.min(32, Math.round(count)));
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id !== roomId || r.appliances.type !== 'programming_lab') return r;
        const desktops = Array.from({ length: 32 }, (_, i) => i < clamped);
        const updated = {
          ...r,
          appliances: {
            type: 'programming_lab' as const,
            data: { ...r.appliances.data, desktops },
          },
        };
        return { ...updated, ...calculateRoomElectrical(updated, ratings, 0) };
      })
    );
  }, [ratings]);

  const toggleProgLabDesktop = useCallback((roomId: RoomId, index: number) => {
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id !== roomId || r.appliances.type !== 'programming_lab') return r;
        const desktops = [...r.appliances.data.desktops];
        desktops[index] = !desktops[index];
        const updated = {
          ...r,
          appliances: {
            type: 'programming_lab' as const,
            data: { ...r.appliances.data, desktops },
          },
        };
        return { ...updated, ...calculateRoomElectrical(updated, ratings, 0) };
      })
    );
  }, [ratings]);

  const setProgLabAcMode = useCallback((roomId: RoomId, acIndex: 0 | 1, mode: ACMode) => {
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id !== roomId || r.appliances.type !== 'programming_lab') return r;
        const acUnits = [...r.appliances.data.acUnits] as [ACMode, ACMode];
        acUnits[acIndex] = mode;
        const updated = {
          ...r,
          appliances: {
            type: 'programming_lab' as const,
            data: { ...r.appliances.data, acUnits },
          },
        };
        return { ...updated, ...calculateRoomElectrical(updated, ratings, 0) };
      })
    );
  }, [ratings]);

  const toggleProgLabLight = useCallback((roomId: RoomId, index: number) => {
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id !== roomId || r.appliances.type !== 'programming_lab') return r;
        const tubeLights = [...r.appliances.data.tubeLights];
        tubeLights[index] = !tubeLights[index];
        const updated = {
          ...r,
          appliances: {
            type: 'programming_lab' as const,
            data: { ...r.appliances.data, tubeLights },
          },
        };
        return { ...updated, ...calculateRoomElectrical(updated, ratings, 0) };
      })
    );
  }, [ratings]);

  // Group actions: switch all on/off, group lights, fans, ACs, computers
  const executeGroupAction = useCallback(
    (
      roomId: RoomId,
      action:
        | 'switch_all_on'
        | 'switch_all_off'
        | 'lights_on'
        | 'lights_off'
        | 'fans_on'
        | 'fans_off'
        | 'ac_on'
        | 'ac_off'
        | 'ac_auto'
        | 'computers_on'
        | 'computers_off'
    ) => {
      setRooms((prev) =>
        prev.map((r) => {
          if (r.id !== roomId) return r;
          let updatedAppliances = { ...r.appliances };

          if (r.appliances.type === 'classroom') {
            const d = { ...r.appliances.data };
            if (action === 'switch_all_on') {
              d.tubeLights = Array(10).fill(true);
              d.fans = Array(6).fill(true);
              d.projector = true;
            } else if (action === 'switch_all_off') {
              d.tubeLights = Array(10).fill(false);
              d.fans = Array(6).fill(false);
              d.projector = false;
            } else if (action === 'lights_on') {
              d.tubeLights = Array(10).fill(true);
            } else if (action === 'lights_off') {
              d.tubeLights = Array(10).fill(false);
            } else if (action === 'fans_on') {
              d.fans = Array(6).fill(true);
            } else if (action === 'fans_off') {
              d.fans = Array(6).fill(false);
            }
            updatedAppliances = { type: 'classroom', data: d };
          } else if (r.appliances.type === 'circuit_lab') {
            const d = { ...r.appliances.data };
            if (action === 'switch_all_on') {
              d.tubeLights = Array(10).fill(true);
              d.acUnits = ['ON', 'ON'];
              d.socketActive = true;
            } else if (action === 'switch_all_off') {
              d.tubeLights = Array(10).fill(false);
              d.acUnits = ['OFF', 'OFF'];
              d.socketActive = false;
            } else if (action === 'lights_on') {
              d.tubeLights = Array(10).fill(true);
            } else if (action === 'lights_off') {
              d.tubeLights = Array(10).fill(false);
            } else if (action === 'ac_on') {
              d.acUnits = ['ON', 'ON'];
            } else if (action === 'ac_off') {
              d.acUnits = ['OFF', 'OFF'];
            } else if (action === 'ac_auto') {
              d.acUnits = ['AUTO', 'AUTO'];
            }
            updatedAppliances = { type: 'circuit_lab', data: d };
          } else if (r.appliances.type === 'programming_lab') {
            const d = { ...r.appliances.data };
            if (action === 'switch_all_on') {
              d.desktops = Array(32).fill(true);
              d.tubeLights = Array(10).fill(true);
              d.acUnits = ['ON', 'ON'];
            } else if (action === 'switch_all_off') {
              d.desktops = Array(32).fill(false);
              d.tubeLights = Array(10).fill(false);
              d.acUnits = ['OFF', 'OFF'];
            } else if (action === 'lights_on') {
              d.tubeLights = Array(10).fill(true);
            } else if (action === 'lights_off') {
              d.tubeLights = Array(10).fill(false);
            } else if (action === 'computers_on') {
              d.desktops = Array(32).fill(true);
            } else if (action === 'computers_off') {
              d.desktops = Array(32).fill(false);
            } else if (action === 'ac_on') {
              d.acUnits = ['ON', 'ON'];
            } else if (action === 'ac_off') {
              d.acUnits = ['OFF', 'OFF'];
            } else if (action === 'ac_auto') {
              d.acUnits = ['AUTO', 'AUTO'];
            }
            updatedAppliances = { type: 'programming_lab', data: d };
          }

          const updatedRoom = { ...r, appliances: updatedAppliances };
          return { ...updatedRoom, ...calculateRoomElectrical(updatedRoom, ratings, 0) };
        })
      );
    },
    [ratings]
  );

  // Relay Shutoff for Timetable Wastage
  const triggerRelayShutoff = useCallback((roomId: RoomId) => {
    executeGroupAction(roomId, 'switch_all_off');
  }, [executeGroupAction]);

  const triggerAllRelayShutoffs = useCallback(() => {
    timetableSavings.topWastingRooms.forEach((wasting) => {
      const room = rooms.find((r) => mapRoomToCode(r.id) === wasting.roomCode);
      if (room && !room.relayOverrideActive) {
        executeGroupAction(room.id, 'switch_all_off');
      }
    });
  }, [timetableSavings, rooms, executeGroupAction]);

  const toggleRelayOverride = useCallback((roomId: RoomId) => {
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id !== roomId) return r;
        return { ...r, relayOverrideActive: !r.relayOverrideActive };
      })
    );
  }, []);

  // Timetable CRUD
  const addTimetableEntry = useCallback((entry: Omit<TimetableEntry, 'id'>) => {
    const newEntry: TimetableEntry = {
      ...entry,
      id: `tt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    };
    setTimetable((prev) => [...prev, newEntry]);
  }, []);

  const updateTimetableEntry = useCallback((id: string, entry: Partial<TimetableEntry>) => {
    setTimetable((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...entry } : item))
    );
  }, []);

  const deleteTimetableEntry = useCallback((id: string) => {
    setTimetable((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const importTimetableCSV = useCallback((csvText: string) => {
    try {
      const lines = csvText.trim().split('\n');
      if (lines.length < 2) {
        return { success: false, count: 0, error: 'CSV file contains no data rows.' };
      }

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const newEntries: TimetableEntry[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
        if (cols.length < 9) continue;

        const dayRaw = cols[0];
        const day: DayOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(dayRaw)
          ? (dayRaw as DayOfWeek)
          : 'Monday';

        newEntries.push({
          id: `tt_imp_${i}_${Date.now()}`,
          day,
          start_time: cols[1] || '08:00',
          end_time: cols[2] || '08:50',
          room: cols[3].toUpperCase() || 'CR101',
          type: (cols[4].toLowerCase() === 'lab' ? 'lab' : 'class'),
          subject: cols[5] || 'General Lecture',
          department: cols[6] || 'EEE',
          year: parseInt(cols[7], 10) || 1,
          strength: parseInt(cols[8], 10) || 45,
          period_label: cols[9] || 'P',
        });
      }

      if (newEntries.length === 0) {
        return { success: false, count: 0, error: 'No valid timetable rows could be parsed.' };
      }

      setTimetable(newEntries);
      return { success: true, count: newEntries.length };
    } catch (err: any) {
      return { success: false, count: 0, error: err.message || 'Failed to parse CSV file.' };
    }
  }, []);

  const exportTimetableCSVTemplate = useCallback(() => {
    const headers = 'day,start_time,end_time,room,type,subject,department,year,strength,period_label';
    const sampleRows = [
      'Monday,08:00,08:50,CR101,class,Electric Circuit Analysis,EEE,2,52,P1',
      'Monday,08:50,09:40,CR101,class,Electromagnetic Fields,EEE,2,52,P2',
      'Monday,08:00,10:45,LAB1,lab,Circuits & Devices Laboratory,EEE,2,32,P1-P3',
      'Monday,12:20,14:50,LAB2,lab,C++ & Python Embedded Lab,EEE,1,32,P5-P7',
      'Tuesday,08:00,08:50,CR102,class,Power System Analysis,EEE,3,48,P1',
      'Wednesday,08:00,10:45,LAB3,lab,Power Electronics & Drives Lab,EEE,3,28,P1-P3',
    ];
    return [headers, ...sampleRows].join('\n');
  }, []);

  // Calendar CRUD
  const addCalendarEntry = useCallback((entry: Omit<CalendarEntry, 'id'>) => {
    const newEntry: CalendarEntry = {
      ...entry,
      id: `cal_${Date.now()}`,
    };
    setCalendar((prev) => [...prev, newEntry]);
  }, []);

  const deleteCalendarEntry = useCallback((id: string) => {
    setCalendar((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateUsageFactors = useCallback((factors: Partial<UsageFactors>) => {
    setUsageFactors((prev) => ({ ...prev, ...factors }));
  }, []);

  const updateElectricalRatings = useCallback((newRatings: Partial<ElectricalRatings>) => {
    setRatings((prev) => ({ ...prev, ...newRatings }));
  }, []);

  const updateTariffs = useCallback((newTariffs: Partial<CostTariffSettings>) => {
    setTariffs((prev) => ({ ...prev, ...newTariffs }));
  }, []);

  const updateWhatIfParams = useCallback((params: Partial<WhatIfParameters>) => {
    setWhatIfParams((prev) => ({ ...prev, ...params }));
  }, []);

  // Module 1: Audit Callbacks
  const updateApplianceAuditConfig = useCallback((roomId: RoomId, applianceId: string, updates: Partial<ApplianceAuditItem>) => {
    setAuditProfiles((prev) =>
      prev.map((profile) => {
        if (profile.roomId === roomId) {
          return {
            ...profile,
            appliances: profile.appliances.map((app) => (app.id === applianceId ? { ...app, ...updates } : app)),
          };
        }
        return profile;
      })
    );
  }, []);

  const resetAuditProfiles = useCallback(() => {
    localStorage.removeItem(LOCAL_STORAGE_KEY_AUDIT);
    setAuditProfiles(DEFAULT_ROOM_AUDIT_PROFILES);
  }, []);

  // Module 2: Circuit Lab PIR Callbacks
  const updateCircuitLabPIR = useCallback((
    roomId: 'ca_lab1' | 'ca_lab2',
    occupantCount: number,
    schedule?: { hour: number; expectedOccupancy: number }[]
  ) => {
    const safeCount = Math.max(0, Math.min(50, occupantCount));
    setCircuitLabPIRStates((prev) => {
      const current = prev[roomId];
      const newStatus = getPIRStatusLevel(safeCount, current.maxCapacity);
      const hours = Math.floor((simTimeMinutes / 60) % 24);
      const mins = Math.floor(simTimeMinutes % 60);
      const nowStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
      const newHistory = [...current.history.slice(-7), { timestamp: nowStr, count: safeCount }];
      return {
        ...prev,
        [roomId]: {
          ...current,
          occupantCount: safeCount,
          statusLevel: newStatus,
          hourlySchedule: schedule || current.hourlySchedule,
          history: newHistory,
          lastUpdated: 'Just now (Simulated)',
        },
      };
    });

    // Synchronize into RoomState occupancy so thermal physics calculates Q_internal = occupancy * 100 W!
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id === roomId) {
          return {
            ...r,
            envParams: {
              ...r.envParams,
              occupancy: safeCount,
            },
          };
        }
        return r;
      })
    );
  }, [simTimeMinutes]);

  // Compute Intelligent AC Recommendations for ca_lab1 and ca_lab2
  const acRecommendations = useMemo(() => {
    const lab1 = rooms.find((r) => r.id === 'ca_lab1');
    const lab2 = rooms.find((r) => r.id === 'ca_lab2');
    return {
      ca_lab1: lab1
        ? generateACIntelligentRecommendation(lab1, circuitLabPIRStates.ca_lab1, 24.0, 26.0, tariffs.energyTariffINRPerKWh)
        : ({} as ACIntelligentRecommendation),
      ca_lab2: lab2
        ? generateACIntelligentRecommendation(lab2, circuitLabPIRStates.ca_lab2, 24.0, 26.0, tariffs.energyTariffINRPerKWh)
        : ({} as ACIntelligentRecommendation),
    };
  }, [rooms, circuitLabPIRStates, tariffs.energyTariffINRPerKWh]);

  const acceptACRecommendation = useCallback((roomId: 'ca_lab1' | 'ca_lab2') => {
    const rec = acRecommendations[roomId];
    if (!rec) return;

    setRooms((prev) =>
      prev.map((r) => {
        if (r.id === roomId) {
          return {
            ...r,
            physics: {
              ...r.physics,
              targetSetpointTemp: rec.recommendedSetpoint,
            },
            appliances:
              r.appliances.type === 'circuit_lab'
                ? {
                    ...r.appliances,
                    data: {
                      ...r.appliances.data,
                      acUnits: [rec.recommendedMode, rec.recommendedMode],
                    },
                  }
                : r.appliances,
          };
        }
        return r;
      })
    );
  }, [acRecommendations]);

  const rejectACRecommendation = useCallback((roomId: 'ca_lab1' | 'ca_lab2') => {
    // Acknowledged reject
  }, []);

  // Compute Building Management Recommendations
  const managementRecommendations = useMemo(() => {
    return generateBuildingManagementRecommendations(rooms, tariffs.energyTariffINRPerKWh, acceptedManagementActionIds);
  }, [rooms, tariffs.energyTariffINRPerKWh, acceptedManagementActionIds]);

  const acceptManagementAction = useCallback((actionId: string) => {
    setAcceptedManagementActionIds((prev) => (prev.includes(actionId) ? prev : [...prev, actionId]));

    if (actionId === 'mgmt_ac_circuit_labs') {
      setRooms((prev) =>
        prev.map((r) =>
          r.id === 'ca_lab1' || r.id === 'ca_lab2'
            ? { ...r, physics: { ...r.physics, targetSetpointTemp: 25.0 } }
            : r
        )
      );
    } else if (actionId === 'mgmt_light_unoccupied_shutoff') {
      setRooms((prev) =>
        prev.map((r) => {
          if (r.type === 'classroom' && r.envParams.occupancy === 0 && r.appliances.type === 'classroom') {
            return {
              ...r,
              appliances: {
                ...r.appliances,
                data: {
                  ...r.appliances.data,
                  tubeLights: Array(10).fill(false),
                },
              },
            };
          }
          return r;
        })
      );
    } else if (actionId === 'mgmt_fan_speed_curtailment') {
      setRooms((prev) =>
        prev.map((r) => {
          if (r.type === 'classroom' && r.envParams.occupancy === 0 && r.appliances.type === 'classroom') {
            return {
              ...r,
              appliances: {
                ...r.appliances,
                data: {
                  ...r.appliances.data,
                  fans: Array(6).fill(false),
                },
              },
            };
          }
          return r;
        })
      );
    } else if (actionId === 'mgmt_pc_sleep_mode') {
      setRooms((prev) =>
        prev.map((r) => {
          if (r.id === 'cp_lab2' && r.appliances.type === 'programming_lab') {
            return {
              ...r,
              appliances: {
                ...r.appliances,
                data: {
                  ...r.appliances.data,
                  desktops: Array(32).fill(false),
                },
              },
            };
          }
          return r;
        })
      );
    } else if (actionId === 'mgmt_peak_clipping') {
      setRooms((prev) =>
        prev.map((r) => {
          if ((r.id === 'ca_lab1' || r.id === 'ca_lab2') && r.appliances.type === 'circuit_lab') {
            return {
              ...r,
              appliances: {
                ...r.appliances,
                data: {
                  ...r.appliances.data,
                  socketActive: false,
                },
              },
            };
          }
          return r;
        })
      );
    }
  }, []);

  const rejectManagementAction = useCallback((actionId: string) => {
    setAcceptedManagementActionIds((prev) => prev.filter((id) => id !== actionId));
  }, []);

  const resetManagementActions = useCallback(() => {
    setAcceptedManagementActionIds([]);
  }, []);

  const beforeAfterComparison = useMemo(() => {
    const acceptedRecs = managementRecommendations.filter((r) => acceptedManagementActionIds.includes(r.id));
    return calculateBeforeAfterComparison(
      aggregates.currentBuildingDemandKW,
      aggregates.predictedPeakDemandKW || 26.8,
      acceptedRecs,
      tariffs.energyTariffINRPerKWh
    );
  }, [aggregates.currentBuildingDemandKW, aggregates.predictedPeakDemandKW, managementRecommendations, acceptedManagementActionIds, tariffs.energyTariffINRPerKWh]);

  const resetSimulation = useCallback(() => {
    localStorage.removeItem(LOCAL_STORAGE_KEY_ROOMS);
    localStorage.removeItem(LOCAL_STORAGE_KEY_RATINGS);
    localStorage.removeItem(LOCAL_STORAGE_KEY_TARIFFS);
    localStorage.removeItem(LOCAL_STORAGE_KEY_TIMETABLE);
    localStorage.removeItem(LOCAL_STORAGE_KEY_CALENDAR);
    localStorage.removeItem(LOCAL_STORAGE_KEY_USAGE_FACTORS);
    localStorage.removeItem(LOCAL_STORAGE_KEY_AUDIT);
    localStorage.removeItem(LOCAL_STORAGE_KEY_PIR);
    localStorage.removeItem(LOCAL_STORAGE_KEY_ACTIONS);

    setRatings(DEFAULT_ELECTRICAL_RATINGS);
    setTariffs(DEFAULT_TARIFF_SETTINGS);
    setWhatIfParams(DEFAULT_WHAT_IF_PARAMS);
    setTimetable(SAMPLE_TIMETABLE_DATA);
    setCalendar(DEFAULT_CALENDAR_DATA);
    setUsageFactors(DEFAULT_USAGE_FACTORS);
    setAuditProfiles(DEFAULT_ROOM_AUDIT_PROFILES);
    setCircuitLabPIRStates(DEFAULT_CIRCUIT_LAB_PIR_STATES);
    setAcceptedManagementActionIds([]);

    const initial = createDefaultRooms(DEFAULT_ELECTRICAL_RATINGS);
    setRooms(initial);
    setHistoricalData(generateInitialHistory(18.5));
    setSimTimeMinutes(9 * 60 + 15);
  }, []);

  const toggleSimulationRunning = useCallback(() => {
    setIsSimulating((prev) => !prev);
  }, []);

  return (
    <SimulationContext.Provider
      value={{
        rooms,
        ratings,
        tariffs,
        whatIfParams,
        aggregates,
        historicalData,
        isSimulating,
        simSpeed,
        simTimeMinutes,
        simTimeString,
        selectedRoomId,
        hardwareMode,
        dataProvider,
        activeFloorView,
        timetable,
        roomInventory,
        calendar,
        usageFactors,
        activeDayOfWeek,
        activeCalendarDate,
        timetableSavings,
        setSelectedRoomId,
        setActiveFloorView,
        setSimSpeed,
        toggleSimulationRunning,
        setHardwareMode,
        resetSimulation,
        setActiveDayOfWeek,
        setActiveCalendarDate,
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
        triggerRelayShutoff,
        triggerAllRelayShutoffs,
        toggleRelayOverride,
        addTimetableEntry,
        updateTimetableEntry,
        deleteTimetableEntry,
        importTimetableCSV,
        exportTimetableCSVTemplate,
        addCalendarEntry,
        deleteCalendarEntry,
        updateUsageFactors,
        updateElectricalRatings,
        updateTariffs,
        updateWhatIfParams,
        auditProfiles,
        updateApplianceAuditConfig,
        resetAuditProfiles,
        circuitLabPIRStates,
        updateCircuitLabPIR,
        acRecommendations,
        acceptACRecommendation,
        rejectACRecommendation,
        managementRecommendations,
        acceptedManagementActionIds,
        acceptManagementAction,
        rejectManagementAction,
        resetManagementActions,
        beforeAfterComparison,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
};

export function useSimulation(): SimulationContextType {
  const ctx = useContext(SimulationContext);
  if (!ctx) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return ctx;
}
