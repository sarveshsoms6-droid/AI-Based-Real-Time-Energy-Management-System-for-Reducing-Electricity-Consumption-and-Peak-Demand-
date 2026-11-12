import { SimulatedHardwareReading } from '../types';

export const HARDWARE_BOUNDS = {
  voltage: { min: 10.57, max: 10.98, unit: 'V', decimals: 2 },
  current: { min: 0.42, max: 0.49, unit: 'A', decimals: 2 },
  temperature: { min: 25.0, max: 26.0, unit: '°C', decimals: 1 },
  humidity: { min: 50.0, max: 60.0, unit: '%', decimals: 1 },
} as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function formatTimestamp(date: Date = new Date()): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const h = pad(date.getHours());
  const m = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  return `${h}:${m}:${s}`;
}

/**
 * Generates an initial nominal reading in the middle of all specified ranges
 */
export function generateInitialHardwareReading(): SimulatedHardwareReading {
  const rawVoltage = 10.76;
  const rawCurrent = 0.45;
  const rawPower = rawVoltage * rawCurrent; // 4.842 W
  const rawTemp = 25.5;
  const rawHumidity = 55.0;

  const voltage = Number(rawVoltage.toFixed(HARDWARE_BOUNDS.voltage.decimals));
  const current = Number(rawCurrent.toFixed(HARDWARE_BOUNDS.current.decimals));
  const power = Number(rawPower.toFixed(2));
  const temperature = Number(rawTemp.toFixed(HARDWARE_BOUNDS.temperature.decimals));
  const humidity = Number(rawHumidity.toFixed(HARDWARE_BOUNDS.humidity.decimals));

  return {
    id: `hw_${Date.now()}_0`,
    timestamp: formatTimestamp(),
    voltage,
    current,
    power,
    temperature,
    humidity,
    rawVoltage,
    rawCurrent,
    rawPower,
    verificationPass: true,
  };
}

/**
 * Generates the next reading with smooth random drift strictly bounded
 * within the specified min/max thresholds.
 *
 * Voltage: 10.57 V to 10.98 V
 * Current: 0.42 A to 0.49 A
 * Power: Calculated from Voltage * Current (unrounded), then rounded to 2 decimals
 * Temperature: 25.0 °C to 26.0 °C
 * Humidity: 50.0% to 60.0%
 */
export function generateNextHardwareReading(
  previous: SimulatedHardwareReading
): SimulatedHardwareReading {
  const { min: vMin, max: vMax } = HARDWARE_BOUNDS.voltage;
  const { min: iMin, max: iMax } = HARDWARE_BOUNDS.current;
  const { min: tMin, max: tMax } = HARDWARE_BOUNDS.temperature;
  const { min: hMin, max: hMax } = HARDWARE_BOUNDS.humidity;

  // Midpoints for gentle mean-reversion drift to avoid getting stuck at boundaries
  const vMid = (vMin + vMax) / 2;
  const iMid = (iMin + iMax) / 2;
  const tMid = (tMin + tMax) / 2;
  const hMid = (hMin + hMax) / 2;

  // 1. Voltage: small smooth random step (-0.03 to +0.03 V) with mean-reversion
  const vPull = (vMid - previous.rawVoltage) * 0.08;
  const vDelta = (Math.random() - 0.5) * 0.035 + vPull;
  const rawVoltage = clamp(previous.rawVoltage + vDelta, vMin, vMax);

  // 2. Current: small smooth random step (-0.008 to +0.008 A) with mean-reversion
  const iPull = (iMid - previous.rawCurrent) * 0.08;
  const iDelta = (Math.random() - 0.5) * 0.009 + iPull;
  const rawCurrent = clamp(previous.rawCurrent + iDelta, iMin, iMax);

  // 3. Motor Power (W) = Motor Voltage (V) × Motor Current (A)
  // CRITICAL REQUIREMENT: Always calculate it using the currently generated voltage and current.
  const rawPower = rawVoltage * rawCurrent;

  // 4. Temperature: small smooth random step (-0.1 to +0.1 °C)
  const tPull = (tMid - previous.temperature) * 0.1;
  const tDelta = (Math.random() - 0.5) * 0.12 + tPull;
  const rawTemp = clamp(previous.temperature + tDelta, tMin, tMax);

  // 5. Humidity: small smooth random step (-0.6 to +0.6 %)
  const hPull = (hMid - previous.humidity) * 0.08;
  const hDelta = (Math.random() - 0.5) * 0.7 + hPull;
  const rawHumidity = clamp(previous.humidity + hDelta, hMin, hMax);

  // Formatted display values
  const voltage = Number(rawVoltage.toFixed(HARDWARE_BOUNDS.voltage.decimals));
  const current = Number(rawCurrent.toFixed(HARDWARE_BOUNDS.current.decimals));
  const power = Number(rawPower.toFixed(2));
  const temperature = Number(rawTemp.toFixed(HARDWARE_BOUNDS.temperature.decimals));
  const humidity = Number(rawHumidity.toFixed(HARDWARE_BOUNDS.humidity.decimals));

  // Mathematical verification: Power equals Voltage * Current
  const verificationPass = Math.abs(power - Number((rawVoltage * rawCurrent).toFixed(2))) <= 0.01;

  return {
    id: `hw_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    timestamp: formatTimestamp(),
    voltage,
    current,
    power,
    temperature,
    humidity,
    rawVoltage,
    rawCurrent,
    rawPower,
    verificationPass,
  };
}

/**
 * Generates an initial buffer of historical readings for immediate time-series rendering
 */
export function generateInitialHardwareHistory(count: number = 15): SimulatedHardwareReading[] {
  const history: SimulatedHardwareReading[] = [];
  let current = generateInitialHardwareReading();
  const now = new Date();

  for (let i = count - 1; i >= 0; i--) {
    const pointTime = new Date(now.getTime() - i * 2000);
    current = generateNextHardwareReading(current);
    current.timestamp = formatTimestamp(pointTime);
    history.push({ ...current });
  }

  return history;
}
