import {
  RoomState,
  CircuitLabPIRState,
  PIRStatusLevel,
  ACIntelligentRecommendation,
  EnergyManagementRecommendation,
  BeforeAfterComparison,
  ACMode,
} from '../types';

export function getPIRStatusLevel(count: number, maxCapacity: number = 40): PIRStatusLevel {
  if (count <= 0) return 'Empty';
  if (count <= 10) return 'Low';
  if (count <= 25) return 'Moderate';
  if (count <= 35) return 'High';
  return 'Full';
}

/**
 * Intelligent AC Temperature Recommendation for Circuit Analysis Labs
 * Couples simulated PIR occupant count, outdoor ambient temp, humidity,
 * and ASHRAE 55 thermal comfort standard (24.0°C – 26.0°C default range).
 */
export function generateACIntelligentRecommendation(
  room: RoomState,
  pirState: CircuitLabPIRState,
  comfortMin: number = 24.0,
  comfortMax: number = 26.0,
  tariffINR: number = 8.0
): ACIntelligentRecommendation {
  const indoorTemp = room.envParams.indoorTemp;
  const ambientTemp = room.envParams.outdoorTemp;
  const humidity = room.envParams.relativeHumidity;
  const occupancy = pirState.occupantCount;
  const currentSetpoint = room.physics.targetSetpointTemp || 24.0;

  let currentMode: ACMode = 'OFF';
  if (room.appliances.type === 'circuit_lab') {
    currentMode = room.appliances.data.acUnits[0];
  }

  let recommendedSetpoint = 25.0;
  let recommendedMode: ACMode = 'AUTO';
  let reason = '';
  let powerSavingsKW = 0;

  if (occupancy === 0) {
    recommendedSetpoint = 28.0;
    recommendedMode = 'OFF';
    reason = `Circuit Lab is currently unoccupied (0 occupants via PIR). Setting AC to OFF/28°C prevents parasitic cooling and eliminates up to 4.4 kW idle compressor draw.`;
    powerSavingsKW = currentMode !== 'OFF' ? 3.6 : 0;
  } else if (occupancy <= 10) {
    recommendedSetpoint = 26.0;
    recommendedMode = 'AUTO';
    reason = `Low occupancy (${occupancy} students, ~${occupancy * 100} W internal metabolic heat). Modulating setpoint to 26.0°C preserves thermal comfort while curtailing compressor duty cycle by 25%.`;
    powerSavingsKW = 1.1;
  } else if (occupancy <= 25) {
    recommendedSetpoint = 25.0;
    recommendedMode = 'AUTO';
    reason = `Moderate occupancy (${occupancy} students, ~${(occupancy * 100) / 1000} kW metabolic heat). Optimal balance between cooling enthalpy and efficiency achieved at 25.0°C.`;
    powerSavingsKW = currentSetpoint < 24.0 ? 0.75 : 0.45;
  } else {
    // High / Full occupancy (>25)
    recommendedSetpoint = 24.0;
    recommendedMode = 'AUTO';
    reason = `High occupancy (${occupancy} students, ~${(occupancy * 100) / 1000} kW metabolic sensible heat). 24.0°C setpoint with dual compressor operation required to avoid thermal drift above comfort threshold.`;
    powerSavingsKW = currentSetpoint < 23.0 ? 0.5 : 0.2;
  }

  // Adjust for extreme ambient conditions
  if (ambientTemp > 35 && occupancy > 0) {
    recommendedSetpoint = Math.max(comfortMin, recommendedSetpoint - 0.5);
    reason += ` (Outdoor temperature is high at ${ambientTemp.toFixed(1)}°C, adjusted setpoint by -0.5°C).`;
  }

  if (humidity > 65 && occupancy > 0) {
    reason += ` Relative humidity is ${humidity.toFixed(0)}%, dehumidification priority enabled.`;
  }

  const isComfortOptimal =
    indoorTemp >= comfortMin && indoorTemp <= comfortMax && Math.abs(currentSetpoint - recommendedSetpoint) < 0.5;

  const hourlyCostSavingsINR = Number((powerSavingsKW * tariffINR).toFixed(2));
  const dailyCostSavingsINR = Number((hourlyCostSavingsINR * 6).toFixed(2)); // 6 operating hours

  return {
    roomId: pirState.roomId,
    roomName: pirState.roomName,
    currentIndoorTemp: Number(indoorTemp.toFixed(1)),
    currentSetpoint: Number(currentSetpoint.toFixed(1)),
    recommendedSetpoint: Number(recommendedSetpoint.toFixed(1)),
    currentMode,
    recommendedMode,
    reason,
    occupantCount: occupancy,
    ambientTemp: Number(ambientTemp.toFixed(1)),
    humidityPct: Number(humidity.toFixed(0)),
    isComfortOptimal,
    powerSavingsKW: Number(powerSavingsKW.toFixed(2)),
    hourlyCostSavingsINR,
    dailyCostSavingsINR,
    status: 'PENDING',
  };
}

/**
 * Building-Wide Energy Management Recommendations Generator
 * 6 Categories: lighting, fan, ac, computers, peak, planning
 */
export function generateBuildingManagementRecommendations(
  rooms: RoomState[],
  tariffINR: number = 8.0,
  acceptedIds: string[] = []
): EnergyManagementRecommendation[] {
  // Check active state of classrooms
  let activeEmptyClassroomLights = 0;
  let activeEmptyClassroomFans = 0;
  let emptyClassroomIds: string[] = [];

  rooms.forEach((r) => {
    if (r.type === 'classroom') {
      const isUnoccupied = r.envParams.occupancy === 0;
      if (r.appliances.type === 'classroom') {
        const lightsOn = r.appliances.data.tubeLights.filter(Boolean).length;
        const fansOn = r.appliances.data.fans.filter(Boolean).length;
        if (isUnoccupied && (lightsOn > 0 || fansOn > 0)) {
          emptyClassroomIds.push(r.name);
          activeEmptyClassroomLights += lightsOn;
          activeEmptyClassroomFans += fansOn;
        }
      }
    }
  });

  const recs: EnergyManagementRecommendation[] = [
    {
      id: 'mgmt_ac_circuit_labs',
      category: 'ac',
      title: 'Optimize Circuit Analysis Lab AC Setpoints to 25°C',
      description:
        'Elevate cooling setpoint from overcooled 22°C to comfort-standard 25°C in Circuit Analysis Labs during moderate occupancy.',
      action: 'Increase setpoint by +3°C to match ASHRAE 55 college comfort range.',
      impactDemandKW: 1.45,
      dailyKWhSaved: 8.7,
      annualCostSavedINR: Math.round(8.7 * 260 * tariffINR),
      priority: 'IMMEDIATE',
      targetRooms: ['ca_lab1', 'ca_lab2'],
      status: acceptedIds.includes('mgmt_ac_circuit_labs') ? 'ACCEPTED' : 'PENDING',
    },
    {
      id: 'mgmt_light_unoccupied_shutoff',
      category: 'lighting',
      title: 'Automated Lighting Shutoff in Unoccupied Classrooms',
      description: `Detect and deactivate ${activeEmptyClassroomLights > 0 ? activeEmptyClassroomLights : 18} active fluorescent tube lights in empty classrooms.`,
      action: 'Switch off all illumination circuits in unscheduled classrooms.',
      impactDemandKW: 0.72,
      dailyKWhSaved: 4.3,
      annualCostSavedINR: Math.round(4.3 * 260 * tariffINR),
      priority: 'IMMEDIATE',
      targetRooms: ['cr102', 'cr202', 'cr203'],
      status: acceptedIds.includes('mgmt_light_unoccupied_shutoff') ? 'ACCEPTED' : 'PENDING',
    },
    {
      id: 'mgmt_fan_speed_curtailment',
      category: 'fan',
      title: 'Ceiling Fan Relay Interlock in Idle Spaces',
      description:
        'De-energize 12 ceiling fans operating in empty classrooms CR102 and CR202 during free periods.',
      action: 'Trigger sub-panel contactor disconnect for ceiling fan circuits.',
      impactDemandKW: 0.9,
      dailyKWhSaved: 5.4,
      annualCostSavedINR: Math.round(5.4 * 260 * tariffINR),
      priority: 'IMMEDIATE',
      targetRooms: ['cr102', 'cr202'],
      status: acceptedIds.includes('mgmt_fan_speed_curtailment') ? 'ACCEPTED' : 'PENDING',
    },
    {
      id: 'mgmt_pc_sleep_mode',
      category: 'computers',
      title: 'Enforce Deep ACPI S3 Sleep for Idle Lab Workstations',
      description:
        'Broadcast Wake-on-LAN / ACPI Sleep policy to 32 idle computer workstations in C Programming Lab 2 during lecture slots.',
      action: 'Transition desktop monitors and motherboards into 4 W low-power sleep.',
      impactDemandKW: 3.84,
      dailyKWhSaved: 19.2,
      annualCostSavedINR: Math.round(19.2 * 260 * tariffINR),
      priority: 'SHORT_TERM',
      targetRooms: ['cp_lab2'],
      status: acceptedIds.includes('mgmt_pc_sleep_mode') ? 'ACCEPTED' : 'PENDING',
    },
    {
      id: 'mgmt_peak_clipping',
      category: 'peak',
      title: 'Peak Load Shifting (13:00 – 15:00 Grid Tariff Window)',
      description:
        'Defer 2 kW experimental socket bench tests in Circuit Labs to off-peak morning hours (09:00 – 11:00 AM) and pre-cool lab rooms.',
      action: 'Implement staggered compressor starts and defer socket load testing.',
      impactDemandKW: 3.2,
      dailyKWhSaved: 6.4,
      annualCostSavedINR: Math.round(6.4 * 260 * tariffINR + 3.2 * 350 * 12), // includes demand charge savings
      priority: 'SHORT_TERM',
      targetRooms: ['ca_lab1', 'ca_lab2'],
      status: acceptedIds.includes('mgmt_peak_clipping') ? 'ACCEPTED' : 'PENDING',
    },
    {
      id: 'mgmt_strategic_retrofit',
      category: 'planning',
      title: 'Phase-1 Campus Energy Modernization Package',
      description:
        'Complete capital retrofit of 100 LED battens, 36 BLDC fans, and 8 5-Star inverter AC units as recommended by AI Energy Audit.',
      action: 'Initiate institutional procurement with 2.8-year payback horizon.',
      impactDemandKW: 8.6,
      dailyKWhSaved: 58.0,
      annualCostSavedINR: Math.round(58.0 * 260 * tariffINR),
      priority: 'STRATEGIC',
      status: acceptedIds.includes('mgmt_strategic_retrofit') ? 'ACCEPTED' : 'PENDING',
    },
  ];

  return recs;
}

/**
 * Calculates Before vs After Management Comparison
 */
export function calculateBeforeAfterComparison(
  currentDemandKW: number,
  basePeakKW: number = 26.8,
  acceptedRecommendations: EnergyManagementRecommendation[],
  tariffINR: number = 8.0
): BeforeAfterComparison {
  const demandReductionKW = acceptedRecommendations.reduce((acc, r) => acc + r.impactDemandKW, 0);
  const dailyKWhReduction = acceptedRecommendations.reduce((acc, r) => acc + r.dailyKWhSaved, 0);
  const annualCostSavingsINR = acceptedRecommendations.reduce((acc, r) => acc + r.annualCostSavedINR, 0);

  const beforeDemandKW = Number(currentDemandKW.toFixed(2));
  const afterDemandKW = Number(Math.max(1.8, currentDemandKW - demandReductionKW).toFixed(2));

  const beforePeakKW = Number(basePeakKW.toFixed(2));
  const peakReductionKW = Number(Math.min(demandReductionKW * 0.75, beforePeakKW * 0.35).toFixed(2));
  const afterPeakKW = Number(Math.max(12.0, beforePeakKW - peakReductionKW).toFixed(2));

  const beforeDailyKWh = Number((currentDemandKW * 7.5).toFixed(1));
  const afterDailyKWh = Number(Math.max(15.0, beforeDailyKWh - dailyKWhReduction).toFixed(1));

  const beforeAnnualKWh = Math.round(beforeDailyKWh * 260);
  const afterAnnualKWh = Math.round(afterDailyKWh * 260);
  const annualKWhReduction = beforeAnnualKWh - afterAnnualKWh;

  const beforeAnnualCostINR = Math.round(beforeAnnualKWh * tariffINR);
  const afterAnnualCostINR = Math.round(afterAnnualKWh * tariffINR);

  const percentageReduction =
    beforeDemandKW > 0 ? Number(((demandReductionKW / beforeDemandKW) * 100).toFixed(1)) : 0;

  return {
    beforeDemandKW,
    afterDemandKW,
    demandReductionKW: Number(demandReductionKW.toFixed(2)),
    beforePeakKW,
    afterPeakKW,
    peakReductionKW,
    beforeDailyKWh,
    afterDailyKWh,
    dailyKWhReduction: Number(dailyKWhReduction.toFixed(1)),
    beforeAnnualKWh,
    afterAnnualKWh,
    annualKWhReduction,
    beforeAnnualCostINR,
    afterAnnualCostINR,
    annualCostSavingsINR,
    percentageReduction: Math.min(65, percentageReduction),
  };
}
