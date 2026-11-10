import {
  RoomAuditProfile,
  ApplianceAuditItem,
  AuditComparisonItem,
  AuditSummaryMetrics,
  AuditRecommendation,
} from '../types';

export function calculateApplianceDailyKWh(appliance: ApplianceAuditItem): number {
  return (appliance.quantity * appliance.ratedWattsPerUnit * appliance.operatingHoursPerDay) / 1000;
}

export function calculateApplianceAnnualKWh(appliance: ApplianceAuditItem): number {
  const daily = calculateApplianceDailyKWh(appliance);
  const annualDays = appliance.operatingDaysPerWeek * 52;
  return daily * annualDays;
}

export function calculateApplianceComparison(
  appliance: ApplianceAuditItem,
  tariffINR: number = 8.0
): AuditComparisonItem | null {
  if (!appliance.proposedReplacement) return null;

  const currentDailyKWh = calculateApplianceDailyKWh(appliance);
  const proposedDailyKWh =
    (appliance.quantity * appliance.proposedReplacement.ratedWattsPerUnit * appliance.operatingHoursPerDay) / 1000;

  const dailyKWhSaved = Math.max(0, currentDailyKWh - proposedDailyKWh);
  const annualDays = appliance.operatingDaysPerWeek * 52;
  const annualKWhSaved = dailyKWhSaved * annualDays;
  const annualCostSavedINR = annualKWhSaved * tariffINR;
  const totalImplementationCostINR = appliance.quantity * appliance.proposedReplacement.unitCostINR;
  const paybackYears = annualCostSavedINR > 0 ? totalImplementationCostINR / annualCostSavedINR : 0;

  return {
    category: appliance.category,
    currentTech: appliance.name,
    proposedTech: appliance.proposedReplacement.name,
    currentWatts: appliance.quantity * appliance.ratedWattsPerUnit,
    proposedWatts: appliance.quantity * appliance.proposedReplacement.ratedWattsPerUnit,
    currentDailyKWh: Number(currentDailyKWh.toFixed(2)),
    proposedDailyKWh: Number(proposedDailyKWh.toFixed(2)),
    dailyKWhSaved: Number(dailyKWhSaved.toFixed(2)),
    annualKWhSaved: Number(annualKWhSaved.toFixed(1)),
    annualCostSavedINR: Math.round(annualCostSavedINR),
    totalImplementationCostINR: Math.round(totalImplementationCostINR),
    paybackYears: Number(paybackYears.toFixed(2)),
  };
}

export interface EnergyAuditAnalysis {
  metrics: AuditSummaryMetrics;
  comparisons: AuditComparisonItem[];
  categoryBreakdown: {
    category: string;
    label: string;
    annualKWh: number;
    annualCostINR: number;
    connectedKW: number;
    sharePct: number;
  }[];
  roomBreakdown: {
    roomId: string;
    roomName: string;
    floor: number;
    annualKWh: number;
    annualCostINR: number;
    connectedKW: number;
  }[];
  floorBreakdown: {
    floor: number;
    label: string;
    annualKWh: number;
    annualCostINR: number;
    connectedKW: number;
    sharePct: number;
  }[];
  recommendations: AuditRecommendation[];
}

export function performComprehensiveEnergyAudit(
  profiles: RoomAuditProfile[],
  currentOperatingDemandKW: number,
  tariffINR: number = 8.0
): EnergyAuditAnalysis {
  let totalConnectedKW = 0;
  let totalAnnualKWh = 0;
  let totalAnnualCostINR = 0;

  const categoryTotals: Record<string, { connectedKW: number; annualKWh: number }> = {
    lighting: { connectedKW: 0, annualKWh: 0 },
    ac: { connectedKW: 0, annualKWh: 0 },
    fan: { connectedKW: 0, annualKWh: 0 },
    equipment: { connectedKW: 0, annualKWh: 0 },
  };

  const floorTotals: Record<number, { connectedKW: number; annualKWh: number }> = {
    1: { connectedKW: 0, annualKWh: 0 },
    2: { connectedKW: 0, annualKWh: 0 },
  };

  const roomBreakdown: EnergyAuditAnalysis['roomBreakdown'] = [];
  const comparisons: AuditComparisonItem[] = [];

  profiles.forEach((profile) => {
    let roomConnectedKW = 0;
    let roomAnnualKWh = 0;

    profile.appliances.forEach((app) => {
      const connected = (app.quantity * app.ratedWattsPerUnit) / 1000;
      const annualKWh = calculateApplianceAnnualKWh(app);

      roomConnectedKW += connected;
      roomAnnualKWh += annualKWh;

      if (!categoryTotals[app.category]) {
        categoryTotals[app.category] = { connectedKW: 0, annualKWh: 0 };
      }
      categoryTotals[app.category].connectedKW += connected;
      categoryTotals[app.category].annualKWh += annualKWh;

      if (floorTotals[profile.floor]) {
        floorTotals[profile.floor].connectedKW += connected;
        floorTotals[profile.floor].annualKWh += annualKWh;
      }

      const comp = calculateApplianceComparison(app, tariffINR);
      if (comp) {
        comparisons.push(comp);
      }
    });

    totalConnectedKW += roomConnectedKW;
    totalAnnualKWh += roomAnnualKWh;

    roomBreakdown.push({
      roomId: profile.roomId,
      roomName: profile.roomName,
      floor: profile.floor,
      annualKWh: Math.round(roomAnnualKWh),
      annualCostINR: Math.round(roomAnnualKWh * tariffINR),
      connectedKW: Number(roomConnectedKW.toFixed(2)),
    });
  });

  totalAnnualCostINR = Math.round(totalAnnualKWh * tariffINR);

  // Category breakdown formatted
  const categoryLabels: Record<string, string> = {
    ac: 'Air Conditioning (HVAC)',
    equipment: 'IT & Lab Equipment',
    lighting: 'Illumination & Lighting',
    fan: 'Ceiling Air Circulation Fans',
  };

  const categoryBreakdown = Object.entries(categoryTotals).map(([cat, data]) => ({
    category: cat,
    label: categoryLabels[cat] || cat,
    annualKWh: Math.round(data.annualKWh),
    annualCostINR: Math.round(data.annualKWh * tariffINR),
    connectedKW: Number(data.connectedKW.toFixed(2)),
    sharePct: totalAnnualKWh > 0 ? Number(((data.annualKWh / totalAnnualKWh) * 100).toFixed(1)) : 0,
  }));

  // Sort categories descending
  categoryBreakdown.sort((a, b) => b.annualKWh - a.annualKWh);

  // Floor breakdown formatted
  const floorBreakdown = [1, 2].map((f) => {
    const data = floorTotals[f] || { connectedKW: 0, annualKWh: 0 };
    return {
      floor: f,
      label: `Floor ${f} (EEE Wing)`,
      annualKWh: Math.round(data.annualKWh),
      annualCostINR: Math.round(data.annualKWh * tariffINR),
      connectedKW: Number(data.connectedKW.toFixed(2)),
      sharePct: totalAnnualKWh > 0 ? Number(((data.annualKWh / totalAnnualKWh) * 100).toFixed(1)) : 0,
    };
  });

  // Sort rooms descending to identify highest
  const sortedRooms = [...roomBreakdown].sort((a, b) => b.annualKWh - a.annualKWh);
  const highestConsumingRoom = sortedRooms[0]?.roomName || 'Circuit Analysis Lab – F1';
  const highestRoomKWh = sortedRooms[0]?.annualKWh || 0;

  const highestConsumingFloor =
    floorTotals[1].annualKWh >= floorTotals[2].annualKWh ? 'Floor 1 (Ground Level)' : 'Floor 2 (Upper Level)';
  const highestFloorKWh = Math.max(floorTotals[1].annualKWh, floorTotals[2].annualKWh);

  // Aggregate comparisons
  let potentialAnnualKWhSaved = 0;
  let potentialAnnualCostSavedINR = 0;
  let totalRetrofitCostINR = 0;

  comparisons.forEach((c) => {
    potentialAnnualKWhSaved += c.annualKWhSaved;
    potentialAnnualCostSavedINR += c.annualCostSavedINR;
    totalRetrofitCostINR += c.totalImplementationCostINR;
  });

  const overallPaybackYears =
    potentialAnnualCostSavedINR > 0 ? Number((totalRetrofitCostINR / potentialAnnualCostSavedINR).toFixed(2)) : 0;

  const metrics: AuditSummaryMetrics = {
    totalConnectedLoadKW: Number(totalConnectedKW.toFixed(2)),
    actualOperatingDemandKW: Number(currentOperatingDemandKW.toFixed(2)),
    estimatedAnnualEnergyKWh: Math.round(totalAnnualKWh),
    estimatedAnnualCostINR: totalAnnualCostINR,
    highestApplianceCategory: categoryBreakdown[0]?.label || 'Air Conditioning (HVAC)',
    highestApplianceKWh: categoryBreakdown[0]?.annualKWh || 0,
    highestConsumingRoom,
    highestRoomKWh,
    highestConsumingFloor,
    highestFloorKWh,
    potentialAnnualKWhSaved: Math.round(potentialAnnualKWhSaved),
    potentialAnnualCostSavedINR: Math.round(potentialAnnualCostSavedINR),
    totalRetrofitCostINR: Math.round(totalRetrofitCostINR),
    overallPaybackYears,
  };

  const recommendations = generateAuditRecommendations(profiles, comparisons, tariffINR);

  return {
    metrics,
    comparisons,
    categoryBreakdown,
    roomBreakdown,
    floorBreakdown,
    recommendations,
  };
}

export function generateAuditRecommendations(
  profiles: RoomAuditProfile[],
  comparisons: AuditComparisonItem[],
  tariffINR: number = 8.0
): AuditRecommendation[] {
  // Aggregate savings by upgrade theme
  const ledComps = comparisons.filter((c) => c.category === 'lighting');
  const ledDailySaved = ledComps.reduce((s, c) => s + c.dailyKWhSaved, 0);
  const ledAnnualSaved = ledComps.reduce((s, c) => s + c.annualKWhSaved, 0);
  const ledCost = ledComps.reduce((s, c) => s + c.totalImplementationCostINR, 0);
  const ledINR = ledAnnualSaved * tariffINR;
  const ledPayback = ledINR > 0 ? ledCost / ledINR : 0.8;

  const bldcComps = comparisons.filter((c) => c.category === 'fan');
  const bldcDailySaved = bldcComps.reduce((s, c) => s + c.dailyKWhSaved, 0);
  const bldcAnnualSaved = bldcComps.reduce((s, c) => s + c.annualKWhSaved, 0);
  const bldcCost = bldcComps.reduce((s, c) => s + c.totalImplementationCostINR, 0);
  const bldcINR = bldcAnnualSaved * tariffINR;
  const bldcPayback = bldcINR > 0 ? bldcCost / bldcINR : 2.4;

  const acComps = comparisons.filter((c) => c.category === 'ac');
  const acDailySaved = acComps.reduce((s, c) => s + c.dailyKWhSaved, 0);
  const acAnnualSaved = acComps.reduce((s, c) => s + c.annualKWhSaved, 0);
  const acCost = acComps.reduce((s, c) => s + c.totalImplementationCostINR, 0);
  const acINR = acAnnualSaved * tariffINR;
  const acPayback = acINR > 0 ? acCost / acINR : 3.1;

  const pcComps = comparisons.filter((c) => c.proposedTech.includes('Mini-PC') || c.proposedTech.includes('Workstation'));
  const pcDailySaved = pcComps.reduce((s, c) => s + c.dailyKWhSaved, 0);
  const pcAnnualSaved = pcComps.reduce((s, c) => s + c.annualKWhSaved, 0);
  const pcCost = pcComps.reduce((s, c) => s + c.totalImplementationCostINR, 0);
  const pcINR = pcAnnualSaved * tariffINR;
  const pcPayback = pcINR > 0 ? pcCost / pcINR : 3.8;

  const socketComps = comparisons.filter((c) => c.category === 'equipment' && c.proposedTech.includes('Socket'));
  const socketDailySaved = socketComps.reduce((s, c) => s + c.dailyKWhSaved, 0);
  const socketAnnualSaved = socketComps.reduce((s, c) => s + c.annualKWhSaved, 0);
  const socketCost = socketComps.reduce((s, c) => s + c.totalImplementationCostINR, 0);
  const socketINR = socketAnnualSaved * tariffINR;
  const socketPayback = socketINR > 0 ? socketCost / socketINR : 1.9;

  return [
    {
      id: 'rec_audit_led',
      priority: 'HIGH',
      category: 'Lighting Retrofit',
      title: 'Full Building LED Batten Retrofit (100 Fixtures)',
      identifiedProblem:
        'All 10 monitored spaces currently utilize legacy 40 W T8 magnetic ballast fluorescent tube lights with low luminous efficacy (~65 lm/W) and high thermal dissipation.',
      recommendedAction:
        'Replace all 100 fluorescent fixtures with 18 W high-efficiency T8 LED battens (120 lm/W) featuring electronic driver circuitry.',
      engineeringReason:
        'Reduces lighting connected load across the building from 4.0 kW to 1.8 kW (55% direct power reduction) while lowering secondary heat gain onto the building thermal envelope by 1,760 W.',
      dailySavingsKWh: Number(ledDailySaved.toFixed(1)),
      annualSavingsKWh: Math.round(ledAnnualSaved),
      annualCostSavingsINR: Math.round(ledINR),
      estimatedCostINR: Math.round(ledCost),
      paybackYears: Number(ledPayback.toFixed(2)),
      whatIfPreset: {
        activeLightPct: 45, // 55% reduction equivalent
      },
    },
    {
      id: 'rec_audit_bldc',
      priority: 'HIGH',
      category: 'Ceiling Fan Upgrade',
      title: 'Classroom BLDC Energy-Saver Fan Conversion (36 Units)',
      identifiedProblem:
        '36 conventional single-phase induction ceiling fans (75 W each) operate across 6 classrooms with low motor power factor (0.65) and continuous heat dissipation.',
      recommendedAction:
        'Upgrade to 28 W sensorless Brushless DC (BLDC) ceiling fans featuring microcontroller-driven PWM commutation and high power factor (>0.95).',
      engineeringReason:
        'Cuts fan connected load from 2.70 kW to 1.01 kW (62.6% energy savings) and eliminates harmonic motor hum in academic learning environments.',
      dailySavingsKWh: Number(bldcDailySaved.toFixed(1)),
      annualSavingsKWh: Math.round(bldcAnnualSaved),
      annualCostSavingsINR: Math.round(bldcINR),
      estimatedCostINR: Math.round(bldcCost),
      paybackYears: Number(bldcPayback.toFixed(2)),
      whatIfPreset: {
        activeFanPct: 38, // 62% reduction equivalent
      },
    },
    {
      id: 'rec_audit_inverter_ac',
      priority: 'HIGH',
      category: 'HVAC Modernization',
      title: '5-Star Variable Inverter AC Replacement (8 Units in 4 Labs)',
      identifiedProblem:
        'Fixed-speed reciprocating compressor ACs (2 Star BEE rating, 2200 W in Circuit Labs, 1800 W in Prog Labs) cause severe cyclic power draw and high locked-rotor inrush currents.',
      recommendedAction:
        'Replace with 5-Star BEE compliant twin-rotary inverter AC units with ISEER >= 5.0 and eco R32 refrigerant.',
      engineeringReason:
        'Compressor capacity modulates seamlessly with thermal load rather than cycling ON/OFF. Saves ~38% HVAC power and curtails peak cooling demand during hot afternoons.',
      dailySavingsKWh: Number(acDailySaved.toFixed(1)),
      annualSavingsKWh: Math.round(acAnnualSaved),
      annualCostSavingsINR: Math.round(acINR),
      estimatedCostINR: Math.round(acCost),
      paybackYears: Number(acPayback.toFixed(2)),
      whatIfPreset: {
        acSetpointOffset: 2,
        acOperatingModeOverride: 'ALL_AUTO',
      },
    },
    {
      id: 'rec_audit_mini_pc',
      priority: 'MEDIUM',
      category: 'Computing Infrastructure',
      title: 'Transition 64 Programming Lab PCs to Energy Star Mini-PCs',
      identifiedProblem:
        '64 legacy desktop workstations consume 150 W each continuously during practical lab hours, contributing 9.6 kW connected load and substantial parasitic heat gain.',
      recommendedAction:
        'Transition to 65 W 80-Plus Platinum certified compact mini-PCs or thin clients with aggressive ACPI S3 sleep scheduling.',
      engineeringReason:
        'Decreases computing electrical demand from 9.6 kW to 4.16 kW (56.7% load reduction) and alleviates 5.4 kW of internal thermal load on lab AC chillers.',
      dailySavingsKWh: Number(pcDailySaved.toFixed(1)),
      annualSavingsKWh: Math.round(pcAnnualSaved),
      annualCostSavingsINR: Math.round(pcINR),
      estimatedCostINR: Math.round(pcCost),
      paybackYears: Number(pcPayback.toFixed(2)),
      whatIfPreset: {
        computerUsagePct: 44, // 56% load drop
      },
    },
    {
      id: 'rec_audit_sockets',
      priority: 'MEDIUM',
      category: 'Laboratory Power Quality',
      title: 'Smart Auto-Idle Relay Benches for Circuit Analysis Labs',
      identifiedProblem:
        'Experimental socket benches (2,000 W each) remain powered even during theoretical lectures and break periods, suffering phantom transformer losses.',
      recommendedAction:
        'Install IoT smart sub-metered contactor benches with current-threshold automatic idle shutoff after 15 minutes of inactivity.',
      engineeringReason:
        'Prevents accidental energized loads, limits peak lab coincident demand, and enhances student electrical safety.',
      dailySavingsKWh: Number(socketDailySaved.toFixed(1)),
      annualSavingsKWh: Math.round(socketAnnualSaved),
      annualCostSavingsINR: Math.round(socketINR),
      estimatedCostINR: Math.round(socketCost),
      paybackYears: Number(socketPayback.toFixed(2)),
      whatIfPreset: {
        experimentalSocketDeferred: true,
      },
    },
  ];
}
