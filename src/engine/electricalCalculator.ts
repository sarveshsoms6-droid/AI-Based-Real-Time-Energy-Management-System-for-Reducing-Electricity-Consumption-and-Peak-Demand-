import {
  ElectricalRatings,
  RoomState,
  RoomAppliances,
  RoomStatus,
} from '../types';

export function calculateRoomElectrical(
  room: RoomState,
  ratings: ElectricalRatings,
  deltaSeconds: number = 1
): {
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
} {
  // 1. Calculate Connected Load (maximum potential capacity)
  let connectedLoadW = 0;
  let totalApplianceCount = 0;
  let activeApplianceCount = 0;
  let appliancePowerW = 0;

  if (room.appliances.type === 'classroom') {
    const d = room.appliances.data;
    totalApplianceCount = 10 + 6 + 1; // 17
    connectedLoadW =
      10 * ratings.classroomTubeLightWatts +
      6 * ratings.classroomFanWatts +
      1 * ratings.classroomProjectorWatts; // 1100 W

    const activeLights = d.tubeLights.filter(Boolean).length;
    const activeFans = d.fans.filter(Boolean).length;
    const activeProjector = d.projector ? 1 : 0;
    activeApplianceCount = activeLights + activeFans + activeProjector;

    appliancePowerW =
      activeLights * ratings.classroomTubeLightWatts +
      activeFans * ratings.classroomFanWatts +
      activeProjector * ratings.classroomProjectorWatts;
  } else if (room.appliances.type === 'circuit_lab') {
    const d = room.appliances.data;
    totalApplianceCount = 2 + 10 + 1; // 13
    connectedLoadW =
      2 * ratings.circuitLabAcWatts +
      10 * ratings.circuitLabTubeLightWatts +
      ratings.circuitLabDefaultSocketWatts; // 6800 W

    const activeLights = d.tubeLights.filter(Boolean).length;
    const activeSocket = d.socketActive ? 1 : 0;
    
    // Check AC running states
    let activeAcs = 0;
    let acPowerW = 0;
    d.acUnits.forEach((acMode) => {
      if (acMode === 'ON') {
        activeAcs++;
        acPowerW += ratings.circuitLabAcWatts;
      } else if (acMode === 'AUTO') {
        // Auto mode logic: runs if temp > setpoint + 0.5
        if (room.physics.hybridTemp > room.physics.targetSetpointTemp + 0.3) {
          activeAcs++;
          acPowerW += ratings.circuitLabAcWatts;
        } else if (room.physics.hybridTemp > room.physics.targetSetpointTemp - 0.5) {
          // Part load / compressor modulation
          activeAcs += 0.5;
          acPowerW += ratings.circuitLabAcWatts * 0.45;
        }
      }
    });

    activeApplianceCount = Math.round(activeLights + activeSocket + activeAcs);
    appliancePowerW =
      acPowerW +
      activeLights * ratings.circuitLabTubeLightWatts +
      (d.socketActive ? d.socketWatts : 0);
  } else if (room.appliances.type === 'programming_lab') {
    const d = room.appliances.data;
    totalApplianceCount = 32 + 2 + 10; // 44
    connectedLoadW =
      32 * ratings.progLabDesktopWatts +
      2 * ratings.progLabAcWatts +
      10 * ratings.progLabTubeLightWatts; // 8800 W

    const activeDesktops = d.desktops.filter(Boolean).length;
    const activeLights = d.tubeLights.filter(Boolean).length;

    let activeAcs = 0;
    let acPowerW = 0;
    d.acUnits.forEach((acMode) => {
      if (acMode === 'ON') {
        activeAcs++;
        acPowerW += ratings.progLabAcWatts;
      } else if (acMode === 'AUTO') {
        if (room.physics.hybridTemp > room.physics.targetSetpointTemp + 0.3) {
          activeAcs++;
          acPowerW += ratings.progLabAcWatts;
        } else if (room.physics.hybridTemp > room.physics.targetSetpointTemp - 0.5) {
          activeAcs += 0.5;
          acPowerW += ratings.progLabAcWatts * 0.45;
        }
      }
    });

    activeApplianceCount = Math.round(activeDesktops + activeLights + activeAcs);
    appliancePowerW =
      activeDesktops * ratings.progLabDesktopWatts +
      acPowerW +
      activeLights * ratings.progLabTubeLightWatts;
  }

  // 2. Compute Real, Reactive, Apparent Power based on Mode
  let currentPowerW = 0;
  let reactivePowerVAR = 0;
  let apparentPowerVA = 0;

  if (room.calculationMode === 'MODE_A_APPLIANCE') {
    // Mode A: Appliance Simulation
    currentPowerW = appliancePowerW;
    const pf = room.manualParams.powerFactor > 0.1 ? room.manualParams.powerFactor : 0.93;
    apparentPowerVA = currentPowerW > 0 ? currentPowerW / pf : 0;
    reactivePowerVAR = Math.sqrt(Math.max(0, apparentPowerVA ** 2 - currentPowerW ** 2));
  } else {
    // Mode B: Manual Electrical Input
    // P = V * I * PF, S = V * I, Q = sqrt(S^2 - P^2)
    const V = room.manualParams.voltage || 230;
    const I = room.manualParams.current || 0;
    const pf = Math.max(0.01, Math.min(1.0, room.manualParams.powerFactor || 0.92));

    if (room.manualParams.directRealPower !== undefined && room.manualParams.directRealPower > 0) {
      currentPowerW = room.manualParams.directRealPower;
      apparentPowerVA = currentPowerW / pf;
    } else {
      apparentPowerVA = V * I;
      currentPowerW = apparentPowerVA * pf;
    }
    reactivePowerVAR = Math.sqrt(Math.max(0, apparentPowerVA ** 2 - currentPowerW ** 2));
  }

  const currentPowerKW = currentPowerW / 1000;
  const connectedLoadKW = connectedLoadW / 1000;

  // 3. Energy accumulation: kWh = (kW * hours)
  const hoursElapsed = deltaSeconds / 3600;
  const addedKWh = currentPowerKW * hoursElapsed;
  const dailyEnergyKWh = Number((room.dailyEnergyKWh + addedKWh).toFixed(4));
  const monthlyEnergyKWh = Number((room.monthlyEnergyKWh + addedKWh).toFixed(4));

  // 4. Status evaluation:
  // Low: < 30% of connected load
  // Normal: 30% - 75%
  // High: 75% - 92%
  // Critical: > 92% or abnormal condition (empty room high load, abnormal PF, or voltage surge/sag)
  let status: RoomStatus = 'normal';
  let statusReason = 'Nominal operating range';

  const loadRatio = connectedLoadW > 0 ? currentPowerW / connectedLoadW : 0;

  // Check electrical anomalies
  if (room.manualParams.voltage < 205) {
    status = 'critical';
    statusReason = `Low Voltage Alert: ${room.manualParams.voltage}V (Grid Sag)`;
  } else if (room.manualParams.voltage > 255) {
    status = 'critical';
    statusReason = `Overvoltage Alert: ${room.manualParams.voltage}V (Surge)`;
  } else if (room.manualParams.powerFactor < 0.80 && currentPowerW > 500) {
    status = 'warning' as any;
    status = 'high';
    statusReason = `Poor Power Factor: ${room.manualParams.powerFactor.toFixed(2)} (High reactive penalty)`;
  } else if (room.envParams.occupancy === 0 && currentPowerW > 1200) {
    status = 'critical';
    statusReason = 'Unoccupied room with high active electrical load';
  } else if (loadRatio > 0.90) {
    status = 'critical';
    statusReason = `Heavy Load: ${(loadRatio * 100).toFixed(1)}% of connected capacity`;
  } else if (loadRatio > 0.70) {
    status = 'high';
    statusReason = `High Consumption: ${(loadRatio * 100).toFixed(1)}% of connected capacity`;
  } else if (loadRatio < 0.25) {
    status = 'low';
    statusReason = `Low Consumption / Standby`;
  }

  return {
    currentPowerW,
    currentPowerKW: Number(currentPowerKW.toFixed(3)),
    reactivePowerVAR: Number(reactivePowerVAR.toFixed(1)),
    apparentPowerVA: Number(apparentPowerVA.toFixed(1)),
    connectedLoadKW: Number(connectedLoadKW.toFixed(2)),
    dailyEnergyKWh,
    monthlyEnergyKWh,
    activeApplianceCount,
    totalApplianceCount,
    status,
    statusReason,
  };
}
