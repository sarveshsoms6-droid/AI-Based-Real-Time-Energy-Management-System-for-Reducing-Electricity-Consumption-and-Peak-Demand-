import { RoomState, ManualElectricalParams, EnvironmentalParams } from '../types';

export interface ESP32TelemetryPacket {
  deviceId: string;
  roomId: string;
  timestamp: number;
  voltageV: number;
  currentA: number;
  activePowerW: number;
  powerFactor: number;
  gridFrequencyHz: number;
  temperatureC: number;
  humidityPct: number;
  relayStates: Record<string, boolean>;
}

export interface IDataProvider {
  readonly modeName: 'SIMULATION' | 'HARDWARE';
  isHardwareConnected(): boolean;
  getConnectionStatus(): {
    connected: boolean;
    brokerUrl?: string;
    topicPrefix?: string;
    lastPingMs?: number;
    message: string;
  };
  getRoomTelemetry(roomId: string): Promise<Partial<RoomState> | null>;
  sendControlCommand(roomId: string, applianceId: string, state: boolean): Promise<boolean>;
}

/**
 * Stage 1: SimulationDataProvider
 * Fully handles software-only mathematical, physical, and manual console inputs.
 */
export class SimulationDataProvider implements IDataProvider {
  readonly modeName = 'SIMULATION';

  isHardwareConnected(): boolean {
    return false;
  }

  getConnectionStatus() {
    return {
      connected: false,
      message: 'SIMULATION MODE – Manually entered data & virtual appliance simulation engine.',
    };
  }

  async getRoomTelemetry(_roomId: string): Promise<Partial<RoomState> | null> {
    // In Stage 1, telemetry is maintained directly in SimulationContext
    return null;
  }

  async sendControlCommand(_roomId: string, _applianceId: string, _state: boolean): Promise<boolean> {
    // Virtual control executed in frontend memory
    return true;
  }
}

/**
 * Stage 2: ESP32DataProvider (Prepared for hardware integration)
 * Architecture:
 * ESP32 (PZEM-004T + DHT22) -> Wi-Fi -> MQTT Broker -> Python FastAPI Backend -> WebSocket/REST -> Building Digital Twin
 */
export class ESP32DataProvider implements IDataProvider {
  readonly modeName = 'HARDWARE';
  private brokerUrl: string = 'mqtt://broker.campusenergy.internal:1883';
  private topicPrefix: string = 'campus/building1/';

  isHardwareConnected(): boolean {
    return false; // Hardware not active in Stage 1 prototype
  }

  getConnectionStatus() {
    return {
      connected: false,
      brokerUrl: this.brokerUrl,
      topicPrefix: this.topicPrefix,
      message: 'HARDWARE MODE – COMING SOON in Stage 2 hardware rollout. ESP32 & MQTT endpoint configured.',
    };
  }

  async getRoomTelemetry(roomId: string): Promise<Partial<RoomState> | null> {
    console.info(`[Stage 2 ESP32] Telemetry poll queued for ${roomId} over MQTT topic ${this.topicPrefix}${roomId}/telemetry`);
    return null;
  }

  async sendControlCommand(roomId: string, applianceId: string, state: boolean): Promise<boolean> {
    console.info(`[Stage 2 ESP32] Control packet published: ${this.topicPrefix}${roomId}/relay/${applianceId} = ${state}`);
    return true;
  }
}
