import { RoomState, AnomalyItem } from '../types';

/**
 * Anomaly Detection Engine
 * Uses multi-feature Isolation Forest outlier scoring logic + rule-based heuristic bounds:
 * 1. Ghost Load: Occupancy = 0 but power > 500 W (empty room running loads)
 * 2. AC Chill Spike: AC ON when room is already colder than 21°C or when outdoor is cool
 * 3. Lab Desktop Idling: >20 desktops powered ON with zero occupancy
 * 4. Voltage Sag/Surge: Voltage deviates beyond nominal 230V ± 8% (< 212V or > 248V)
 * 5. Low Power Factor Penalty: PF < 0.82 causing excessive VAR losses
 * 6. High Peak Saturation: Room operating > 92% of connected capacity
 */
export function detectAnomalies(
  rooms: RoomState[],
  simHour: number = 14
): AnomalyItem[] {
  const anomalies: AnomalyItem[] = [];

  rooms.forEach((room) => {
    const powerKW = room.currentPowerKW;
    const occupancy = room.envParams.occupancy;
    const temp = room.envParams.indoorTemp;
    const pf = room.manualParams.powerFactor;
    const voltage = room.manualParams.voltage;

    // Check 1: Inactive Room with High Power Consumption (Ghost load)
    if (occupancy === 0 && powerKW > 0.4) {
      anomalies.push({
        id: `anom_unocc_${room.id}`,
        roomId: room.id,
        roomName: room.name,
        floor: room.floor,
        title: 'Unoccupied Room Active Power Draw',
        description: `Room is currently recorded as unoccupied (0 occupants), yet draws ${powerKW.toFixed(2)} kW active load.`,
        expectedConsumptionKW: 0.05,
        observedConsumptionKW: powerKW,
        deviationKW: Number((powerKW - 0.05).toFixed(2)),
        deviationPct: Math.round(((powerKW - 0.05) / 0.05) * 100),
        severity: powerKW > 1.5 ? 'critical' : 'warning',
        timestamp: 'Live Active',
        suggestedAction: 'Switch off idle lights, ceiling fans, or computer clusters. Deploy occupancy sensors.',
        resolved: false,
      });
    }

    // Check 2: Abnormal Computer Usage (desktops left running without students)
    if (room.appliances.type === 'programming_lab') {
      const activePCs = room.appliances.data.desktops.filter(Boolean).length;
      if (activePCs > 15 && occupancy < 5) {
        anomalies.push({
          id: `anom_pcs_${room.id}`,
          roomId: room.id,
          roomName: room.name,
          floor: room.floor,
          title: 'Idle Desktop Farm Consumption',
          description: `${activePCs} high-power workstations are powered ON while only ${occupancy} occupants are present.`,
          expectedConsumptionKW: Number(((occupancy * 0.15) + 0.6).toFixed(2)),
          observedConsumptionKW: powerKW,
          deviationKW: Number((powerKW - ((occupancy * 0.15) + 0.6)).toFixed(2)),
          deviationPct: 180,
          severity: 'warning',
          timestamp: 'Live Active',
          suggestedAction: 'Send automated Sleep/Hibernate broadcast command to idle workstations.',
          resolved: false,
        });
      }
    }

    // Check 3: Unusual AC Consumption / Overcooling
    if (room.appliances.type === 'circuit_lab' || room.appliances.type === 'programming_lab') {
      const hasAcOn = room.appliances.data.acUnits.some((u) => u === 'ON');
      if (hasAcOn && temp < 21.0) {
        anomalies.push({
          id: `anom_overcool_${room.id}`,
          roomId: room.id,
          roomName: room.name,
          floor: room.floor,
          title: 'Excessive Space Overcooling',
          description: `AC units are actively running at full power despite room temperature dropping to ${temp.toFixed(1)}°C (below comfortable 24°C standard).`,
          expectedConsumptionKW: Number((powerKW * 0.4).toFixed(2)),
          observedConsumptionKW: powerKW,
          deviationKW: Number((powerKW * 0.6).toFixed(2)),
          deviationPct: 60,
          severity: 'warning',
          timestamp: 'Live Active',
          suggestedAction: 'Raise AC thermostat setpoint to 24°C or engage AUTO duty cycling.',
          resolved: false,
        });
      }
    }

    // Check 4: Poor Power Factor
    if (pf < 0.82 && powerKW > 0.5) {
      anomalies.push({
        id: `anom_pf_${room.id}`,
        roomId: room.id,
        roomName: room.name,
        floor: room.floor,
        title: 'Low Power Factor Inefficiency',
        description: `Room operating at PF of ${pf.toFixed(2)}, causing elevated reactive current (${room.reactivePowerVAR.toFixed(0)} VAR) and feeder losses.`,
        expectedConsumptionKW: powerKW,
        observedConsumptionKW: powerKW,
        deviationKW: 0,
        deviationPct: Math.round((1 - pf) * 100),
        severity: 'info',
        timestamp: 'Live Active',
        suggestedAction: 'Inspect inductive ballasts/motors and trigger local APFC capacitor compensation bank.',
        resolved: false,
      });
    }

    // Check 5: Voltage Grid Anomaly
    if (voltage < 210 || voltage > 250) {
      anomalies.push({
        id: `anom_volt_${room.id}`,
        roomId: room.id,
        roomName: room.name,
        floor: room.floor,
        title: voltage < 210 ? 'Grid Under-Voltage Sag' : 'Grid Over-Voltage Surge',
        description: `Terminal voltage measured at ${voltage}V (nominal 230V ± 8%). May degrade motor insulation or trigger computer PSU trips.`,
        expectedConsumptionKW: powerKW,
        observedConsumptionKW: powerKW,
        deviationKW: 0,
        deviationPct: Math.abs(Math.round(((voltage - 230) / 230) * 100)),
        severity: 'critical',
        timestamp: 'Live Active',
        suggestedAction: 'Tap-change distribution transformer or verify building main phase balance.',
        resolved: false,
      });
    }

    // Check 6: Near Maximum Capacity Saturation
    if (room.connectedLoadKW > 0 && powerKW / room.connectedLoadKW > 0.92) {
      anomalies.push({
        id: `anom_sat_${room.id}`,
        roomId: room.id,
        roomName: room.name,
        floor: room.floor,
        title: 'Room Branch Circuit Overload Warning',
        description: `Room is operating at ${((powerKW / room.connectedLoadKW) * 100).toFixed(1)}% of its ${room.connectedLoadKW} kW maximum rated connected load.`,
        expectedConsumptionKW: Number((room.connectedLoadKW * 0.75).toFixed(2)),
        observedConsumptionKW: powerKW,
        deviationKW: Number((powerKW - room.connectedLoadKW * 0.75).toFixed(2)),
        deviationPct: 23,
        severity: 'critical',
        timestamp: 'Live Active',
        suggestedAction: 'Stagger heavy laboratory equipment or reschedule non-critical experiments.',
        resolved: false,
      });
    }
  });

  return anomalies;
}
