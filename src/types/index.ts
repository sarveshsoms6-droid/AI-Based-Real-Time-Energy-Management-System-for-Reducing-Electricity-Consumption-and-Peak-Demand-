export type RoomId =
  | 'cr101'
  | 'cr102'
  | 'cr103'
  | 'cr104'
  | 'cr105'
  | 'lab1'
  | 'lab2'
  | 'lab3'
  | 'lab4'
  | 'ca_lab1'
  | 'cp_lab1'
  | 'cr201'
  | 'cr202'
  | 'cr203'
  | 'ca_lab2'
  | 'cp_lab2';

export type FloorId = 1 | 2;

export type RoomType = 'classroom' | 'circuit_lab' | 'programming_lab';

export type CalculationMode = 'MODE_A_APPLIANCE' | 'MODE_B_MANUAL_ELECTRICAL';

export type ACMode = 'OFF' | 'ON' | 'AUTO';

export type RoomStatus = 'low' | 'normal' | 'high' | 'critical';

export interface ClassroomAppliances {
  tubeLights: boolean[]; // 10 tube lights
  fans: boolean[];       // 6 ceiling fans
  projector: boolean;    // 1 projector
}

export interface CircuitLabAppliances {
  acUnits: [ACMode, ACMode]; // 2 ACs (ON/OFF/AUTO)
  tubeLights: boolean[];     // 10 tube lights
  socketActive: boolean;     // experimental socket active
  socketWatts: number;       // default 2000W diversified
}

export interface ProgrammingLabAppliances {
  desktops: boolean[];       // 32 desktop workstations
  acUnits: [ACMode, ACMode]; // 2 ACs (ON/OFF/AUTO)
  tubeLights: boolean[];     // 10 tube lights
}

export type RoomAppliances =
  | { type: 'classroom'; data: ClassroomAppliances }
  | { type: 'circuit_lab'; data: CircuitLabAppliances }
  | { type: 'programming_lab'; data: ProgrammingLabAppliances };

export interface ElectricalRatings {
  classroomTubeLightWatts: number;      // default 40 W
  classroomFanWatts: number;            // default 75 W
  classroomProjectorWatts: number;      // default 250 W
  circuitLabAcWatts: number;            // default 2200 W
  circuitLabTubeLightWatts: number;     // default 40 W
  circuitLabDefaultSocketWatts: number; // default 2000 W
  progLabDesktopWatts: number;          // default 150 W
  progLabAcWatts: number;               // default 1800 W
  progLabTubeLightWatts: number;        // default 40 W
}

export interface ManualElectricalParams {
  voltage: number;         // Volts (e.g. 230)
  current: number;         // Amperes
  powerFactor: number;     // 0.0 to 1.0
  frequency: number;       // Hz (e.g. 50.0)
  directRealPower?: number; // Optional directly entered real power (W)
}

export interface EnvironmentalParams {
  indoorTemp: number;      // °C
  outdoorTemp: number;     // °C
  relativeHumidity: number; // %
  occupancy: number;       // Person count
}

export interface ThermalPhysicsState {
  thermalCapacitanceC: number;  // J/K
  heatTransferCoeffUA: number;  // W/K
  acCop: number;                // AC COP (3.2)
  qInternalW: number;           // Heat from people, computers, lights
  qExternalW: number;           // Heat through walls/windows
  qCoolingW: number;            // Heat removed by active AC
  physicsTemp: number;          // T calculated purely by physics model (°C)
  mlResidual: number;           // ML residual error correction (°C)
  hybridTemp: number;           // Physics + ML residual (°C)
  estimatedCoolingDemandW: number;
  targetSetpointTemp: number;   // e.g. 24°C
}

export interface RoomState {
  id: RoomId;
  name: string;
  floor: FloorId;
  type: RoomType;
  calculationMode: CalculationMode;
  appliances: RoomAppliances;
  manualParams: ManualElectricalParams;
  envParams: EnvironmentalParams;
  physics: ThermalPhysicsState;
  
  // Computed values
  currentPowerW: number;
  currentPowerKW: number;
  reactivePowerVAR: number;
  apparentPowerVA: number;
  connectedLoadKW: number;
  dailyEnergyKWh: number;
  monthlyEnergyKWh: number;
  activeApplianceCount: number;
  totalApplianceCount: number;
  status: RoomStatus;
  statusReason?: string;

  // Timetable integration
  timetableRoomCode: string; // e.g. 'CR101', 'LAB1'
  relayOverrideActive?: boolean; // Manual override for relay shutoff
}

// ==================== TIMETABLE & CALENDAR DATA MODELS ====================

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';

export interface TimetablePeriod {
  id: string; // 'P1', 'P2', 'break', 'P3', 'P4', 'lunch', 'P5', 'P6', 'P7'
  name: string;
  startTime: string; // '08:00'
  endTime: string;   // '08:50'
  isBreak?: boolean;
}

export interface TimetableEntry {
  id: string;
  day: DayOfWeek;
  start_time: string; // e.g. '08:00'
  end_time: string;   // e.g. '08:50'
  room: string;       // 'CR101', 'CR102', 'CR103', 'CR104', 'CR105', 'LAB1', 'LAB2', 'LAB3', 'LAB4'
  type: 'class' | 'lab';
  subject: string;
  department: string; // e.g. 'EEE'
  year: number;       // 1, 2, 3, 4
  strength: number;   // e.g. 45 students
  period_label?: string; // e.g. 'P1', 'P1-P3'
}

export interface RoomInventoryDeviceRatings {
  fanW: number;
  tubeLightW: number;
  ledW: number;
  acW: number;
  computerW: number;
  projectorW: number;
  socketW: number;
}

export interface RoomInventory {
  room: string;       // e.g. 'CR101'
  name: string;       // e.g. 'EEE Lecture Hall 101'
  type: 'classroom' | 'lab';
  floor: FloorId;
  fans: number;
  tube_lights: number;
  led_lights: number;
  ac_units: number;
  computers: number;
  rated_power_per_device: RoomInventoryDeviceRatings;
  total_connected_w: number;
}

export type CalendarDayType = 'working' | 'holiday' | 'exam' | 'event' | 'vacation';

export interface CalendarEntry {
  id: string;
  date: string; // YYYY-MM-DD
  day_type: CalendarDayType;
  description: string;
  rooms_affected: string[] | 'all';
}

export interface UsageFactors {
  fanFactor: number;        // e.g. 0.80
  lightFactor: number;      // e.g. 0.90
  acFactor: number;         // e.g. 0.75
  computerFactor: number;   // e.g. 0.85
  socketFactor: number;     // e.g. 0.70
}

export type TimetableScheduleStatus = 'Occupied' | 'Scheduled empty' | 'Unscheduled';

export interface RoomTimetableStatus {
  roomCode: string;
  roomId: RoomId;
  roomName: string;
  isScheduled: boolean;
  currentClass: TimetableEntry | null;
  statusBadge: TimetableScheduleStatus;
  expectedOccupancy: number;
  expectedLoadKW: number;
  actualLoadKW: number;
  wasteKW: number;
  isWasting: boolean;
  relayShutoffSuggested: boolean;
  reason: string;
}

export interface TopWastingRoomItem {
  roomCode: string;
  roomName: string;
  floor: FloorId;
  currentWasteKW: number;
  accumulatedWasteKWh: number;
  estimatedCostLossINR: number;
  reason: string;
  relayTriggered: boolean;
}

export interface TimetableEnergySavingsSummary {
  collegeTiming: string; // "8:00 AM - 3:00 PM, Mon-Fri"
  isCollegeHours: boolean;
  currentDayType: CalendarDayType;
  scheduledClassesNow: number;
  activeWastingRoomsCount: number;
  
  // Savings metrics
  baselineEnergyTodayKWh: number;   // Uncontrolled: all ON during 8:00 - 15:00
  actualEnergyTodayKWh: number;     // Measured/simulated energy
  savedKWhToday: number;
  savedKWhThisWeek: number;
  savedKWhThisMonth: number;
  savedCostTodayINR: number;
  savedCostThisWeekINR: number;
  savedCostThisMonthINR: number;
  co2AvoidedTodayKg: number;
  co2AvoidedThisMonthKg: number;
  percentageReduction: number;
  peakReductionKW: number;
  peakPercentageReduction?: number;
  baselinePeakDemandKW?: number;
  optimizedPeakDemandKW?: number;
  floor1BaselineKWh?: number;
  floor2BaselineKWh?: number;
  floor1ActualKWh?: number;
  floor2ActualKWh?: number;
  floor1SavedKWh?: number;
  floor2SavedKWh?: number;
  isScenarioEstimate?: boolean;

  // Breakdowns
  topWastingRooms: TopWastingRoomItem[];
  roomBreakdown: {
    roomCode: string;
    roomName: string;
    type: string;
    floor?: number;
    baselineKWh: number;
    actualKWh: number;
    savedKWh: number;
    savedINR: number;
    wasteKW?: number;
    status: TimetableScheduleStatus;
  }[];
  blockBreakdown: {
    blockName: string;
    baselineKWh: number;
    actualKWh: number;
    savedKWh: number;
    savedINR: number;
    percentage: number;
  }[];
}

// ==================== BUILDING & ANOMALY MODELS ====================

export interface BuildingAggregates {
  totalConnectedLoadKW: number;     // 37.8 kW
  currentBuildingDemandKW: number;  // Operating power
  floor1DemandKW: number;
  floor2DemandKW: number;
  dailyEnergyConsumptionKWh: number;
  monthlyEnergyConsumptionKWh: number;
  estimatedDailyCostINR: number;
  estimatedMonthlyCostINR: number;
  predictedPeakDemandKW: number;
  predictedPeakTime: string;
  potentialEnergySavingPct: number;
  activeApplianceCount: number;
  totalApplianceCount: number;
  activeRoomsCount: number;
  totalRoomsCount: number;
  carbonEmissionsKg: number;
  powerFactorAvg: number;
  gridFrequencyHz: number;
  buildingStatus: RoomStatus;
}

export interface AnomalyItem {
  id: string;
  roomId: RoomId;
  roomName: string;
  floor: FloorId;
  title: string;
  description: string;
  expectedConsumptionKW: number;
  observedConsumptionKW: number;
  deviationKW: number;
  deviationPct: number;
  severity: 'info' | 'warning' | 'critical';
  timestamp: string;
  suggestedAction: string;
  resolved: boolean;
  isTimetableWaste?: boolean;
}

export interface ForecastPoint {
  timeLabel: string;
  horizonMinutes: number;
  physicsKW: number;
  mlKW: number;
  hybridKW: number;
  actualKW?: number;
  baselineKW: number;
  upperConfidenceKW: number;
  lowerConfidenceKW: number;
}

export interface OptimizationScheduleSlot {
  hour: number;
  timeLabel: string;
  originalDemandKW: number;
  optimizedDemandKW: number;
  acPreCoolingActive: boolean;
  socketDeferred: boolean;
  batteryDischargeKW: number;
  savedCostINR: number;
}

export interface OptimizationResult {
  originalPeakKW: number;
  optimizedPeakKW: number;
  peakReductionKW: number;
  peakReductionPct: number;
  originalCostINR: number;
  optimizedCostINR: number;
  costSavingINR: number;
  carbonSavedKg: number;
  schedule: OptimizationScheduleSlot[];
  appliedRecommendations: string[];
}

export interface WhatIfParameters {
  computerUsagePct: number;     // 0 - 100%
  activeLightPct: number;       // 0 - 100%
  activeFanPct: number;         // 0 - 100%
  acSetpointOffset: number;     // -3 to +3 °C
  acOperatingModeOverride: 'AS_IS' | 'ALL_ON' | 'ALL_OFF' | 'ALL_AUTO';
  outdoorTempOffset: number;    // -5 to +10 °C
  occupancyMultiplier: number;  // 0.0 to 1.5
  experimentalSocketDeferred: boolean;
}

export interface CostTariffSettings {
  energyTariffINRPerKWh: number;        // Default ₹ 8.00 per kWh as requested
  peakDemandChargeINRPerKW: number;     // Default ₹ 350 per kW
  carbonEmissionFactorKgPerKWh: number; // Default 0.82 kg CO2 / kWh
}

export interface HistoricalDataPoint {
  timestamp: string;
  hour: number;
  minute: number;
  buildingDemandKW: number;
  floor1DemandKW: number;
  floor2DemandKW: number;
  classroomsKW: number;
  circuitLabsKW: number;
  progLabsKW: number;
  temperature: number;
  energyKWhCumulative: number;
}

// ==================== MODULE 1: AI ENERGY AUDIT MODELS ====================

export type LightingTechType = 'fluorescent' | 'led' | 'cfl' | 'incandescent' | 'custom';
export type ACTechType = 'fixed_speed' | 'inverter' | 'custom';
export type FanTechType = 'induction' | 'bldc' | 'custom';
export type EquipmentTechType = 'desktop' | 'laptop' | 'projector' | 'lab_equipment' | 'custom';
export type ApplianceEfficiencyRating = 'High' | 'Medium' | 'Low' | 'Poor';

export interface ProposedReplacement {
  name: string;
  techType: string;
  ratedWattsPerUnit: number;
  unitCostINR: number;
  beeStarRating?: number;
}

export interface ApplianceAuditItem {
  id: string;
  category: 'lighting' | 'ac' | 'fan' | 'equipment';
  name: string;
  techType: LightingTechType | ACTechType | FanTechType | EquipmentTechType;
  quantity: number;
  ratedWattsPerUnit: number;
  operatingHoursPerDay: number;
  operatingDaysPerWeek: number;
  applianceAgeYears?: number;
  efficiencyCategory: ApplianceEfficiencyRating;
  // AC-specific parameters
  acTonnage?: number;
  beeStarRating?: 1 | 2 | 3 | 4 | 5;
  isInverter?: boolean;
  temperatureSetpoint?: number;
  coolingCapacityWatts?: number;
  // Equipment / other
  operatingSchedule?: string;
  // Proposed energy efficient replacement
  proposedReplacement?: ProposedReplacement;
}

export interface RoomAuditProfile {
  roomId: RoomId;
  roomName: string;
  floor: FloorId;
  appliances: ApplianceAuditItem[];
}

export interface AuditComparisonItem {
  category: string;
  currentTech: string;
  proposedTech: string;
  currentWatts: number;
  proposedWatts: number;
  currentDailyKWh: number;
  proposedDailyKWh: number;
  dailyKWhSaved: number;
  annualKWhSaved: number;
  annualCostSavedINR: number;
  totalImplementationCostINR: number;
  paybackYears: number;
}

export interface AuditSummaryMetrics {
  totalConnectedLoadKW: number;
  actualOperatingDemandKW: number;
  estimatedAnnualEnergyKWh: number;
  estimatedAnnualCostINR: number;
  highestApplianceCategory: string;
  highestApplianceKWh: number;
  highestConsumingRoom: string;
  highestRoomKWh: number;
  highestConsumingFloor: string;
  highestFloorKWh: number;
  potentialAnnualKWhSaved: number;
  potentialAnnualCostSavedINR: number;
  totalRetrofitCostINR: number;
  overallPaybackYears: number;
}

export interface AuditRecommendation {
  id: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  title: string;
  identifiedProblem: string;
  recommendedAction: string;
  engineeringReason: string;
  dailySavingsKWh: number;
  annualSavingsKWh: number;
  annualCostSavingsINR: number;
  estimatedCostINR: number;
  paybackYears: number;
  whatIfPreset?: Partial<WhatIfParameters>;
}

// ==================== MODULE 2: AI ENERGY MANAGEMENT MODELS ====================

export type ForecastTimeScale = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface MultiScaleForecastSlot {
  label: string;
  timestamp: string;
  expectedDemandKW: number;
  peakDemandKW: number;
  energyKWh: number;
  costINR: number;
  lowerBoundKW: number;
  upperBoundKW: number;
  occupancyCount?: number;
  isPeakSlot?: boolean;
}

export interface MultiScaleForecastResult {
  timeScale: ForecastTimeScale;
  slots: MultiScaleForecastSlot[];
  totalEnergyKWh: number;
  totalCostINR: number;
  overallPeakKW: number;
  overallPeakTime: string;
  modelNotes: string[];
}

export type PIRStatusLevel = 'Empty' | 'Low' | 'Moderate' | 'High' | 'Full';

export interface CircuitLabPIRState {
  roomId: 'ca_lab1' | 'ca_lab2';
  roomName: string;
  occupantCount: number;
  maxCapacity: number;
  statusLevel: PIRStatusLevel;
  hourlySchedule: { hour: number; expectedOccupancy: number }[];
  history: { timestamp: string; count: number }[];
  lastUpdated: string;
}

export interface ACIntelligentRecommendation {
  roomId: 'ca_lab1' | 'ca_lab2';
  roomName: string;
  currentIndoorTemp: number;
  currentSetpoint: number;
  recommendedSetpoint: number;
  currentMode: ACMode;
  recommendedMode: ACMode;
  reason: string;
  occupantCount: number;
  ambientTemp: number;
  humidityPct: number;
  isComfortOptimal: boolean;
  powerSavingsKW: number;
  hourlyCostSavingsINR: number;
  dailyCostSavingsINR: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}

export type ManagementCategory = 'lighting' | 'fan' | 'ac' | 'computers' | 'peak' | 'planning';

export interface EnergyManagementRecommendation {
  id: string;
  category: ManagementCategory;
  title: string;
  description: string;
  action: string;
  impactDemandKW: number;
  dailyKWhSaved: number;
  annualCostSavedINR: number;
  priority: 'IMMEDIATE' | 'SHORT_TERM' | 'STRATEGIC';
  targetRooms?: RoomId[];
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}

export interface BeforeAfterComparison {
  beforeDemandKW: number;
  afterDemandKW: number;
  demandReductionKW: number;
  beforePeakKW: number;
  afterPeakKW: number;
  peakReductionKW: number;
  beforeDailyKWh: number;
  afterDailyKWh: number;
  dailyKWhReduction: number;
  beforeAnnualKWh: number;
  afterAnnualKWh: number;
  annualKWhReduction: number;
  beforeAnnualCostINR: number;
  afterAnnualCostINR: number;
  annualCostSavingsINR: number;
  percentageReduction: number;
}

// ==================== SIMULATED HARDWARE OUTPUT (ARDUINO UNO DEMONSTRATION) ====================

export interface SimulatedHardwareReading {
  id: string;
  timestamp: string;
  voltage: number;         // 10.57 V to 10.98 V (2 decimal places)
  current: number;         // 0.42 A to 0.49 A (2 decimal places)
  power: number;           // Motor Power = Voltage * Current (2 decimal places)
  temperature: number;     // 25.0 °C to 26.0 °C (1 decimal place)
  humidity: number;        // 50.0% to 60.0% (1 decimal place)
  rawVoltage: number;      // Unrounded voltage value
  rawCurrent: number;      // Unrounded current value
  rawPower: number;        // Unrounded power = rawVoltage * rawCurrent
  verificationPass: boolean;
}

export type HardwareIntervalMs = 1000 | 2000 | 5000;

