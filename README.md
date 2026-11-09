# CampusEnergy AI – Physics-Informed Building Digital Twin for Energy & Peak-Demand Management

[![React](https://img.shields.io/badge/Frontend-React_18_%2B_TypeScript-blue?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Bundler-Vite_6-purple?logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind_CSS-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Three.js](https://img.shields.io/badge/Digital_Twin-Three.js_WebGL-black?logo=three.js)](https://threejs.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **IMPORTANT:** This is a **software-only simulation prototype** developed for presentation and engineering demonstration. All sensor inputs, microclimate readings, and electrical appliance states are calculated dynamically in software. No physical ESP32 or MQTT hardware connection is required at this stage, while an extensible **IDataProvider** abstraction is prepared for Stage 2 physical hardware rollout.

---

## 1. Project Overview

**CampusEnergy AI** is a professional, industrial-grade Smart Energy Management Web Application and Building Digital Twin designed for a two-floor educational institution.

The application simulates:
- **10 individual monitored spaces** across **Two Floors**.
- **Virtual individual and group appliance switches** (tube lights, ceiling fans, projectors, desktop workstations, air conditioners, and experimental sockets).
- **Dual-mode calculation engine**:
  - **Mode A (Appliance Simulation):** Dynamic real power aggregated strictly from operating virtual switches.
  - **Mode B (Manual Electrical Console):** Single-phase sinusoidal AC calculation ($P = V \times I \times \text{PF}$, $S = V \times I$, $Q = \sqrt{S^2 - P^2}$).
- **Physics-Informed Thermal Modeling:** Discrete Euler numerical integration of transient heat flux balance ($C \frac{dT}{dt} = Q_{\text{in}} + Q_{\text{ext}} - Q_{\text{cool}}$) with calibrated ML residual correction.
- **AI Short-Term Energy Forecasting:** Multi-horizon autoregressive predictive modeling across 15m, 30m, 1h, 6h, and 24h horizons.
- **Anomaly & Outlier Detection:** Transparent multivariate outlier scoring identifying ghost loads, overcooling, workstation idling, voltage sags, and branch overloads.
- **Peak Demand Load Scheduling Optimization:** Linear programming minimizing utility electricity cost and peak billing demand while strictly preserving non-flexible pedagogical loads.
- **What-If Simulation Sandbox:** Real-time scenario impact analysis for load shifting, thermostat floating, heat waves, and student occupancy changes.
- **IEEE 1459 Audit Reports:** Tabular and one-click CSV export of electrical and environmental records.

---

## 2. Monitored Building Configuration

The simulated college building comprises **Two Floors** with **5 monitored spaces per floor** (10 total rooms):

| Floor | Room ID | Space Name | Monitored Space Type | Connected Capacity |
| :--- | :--- | :--- | :--- | :--- |
| **Floor 1** | `cr101` | Classroom 101 | Standard Classroom | 1.10 kW |
| **Floor 1** | `cr102` | Classroom 102 | Standard Classroom | 1.10 kW |
| **Floor 1** | `cr103` | Classroom 103 | Standard Classroom | 1.10 kW |
| **Floor 1** | `ca_lab1` | Circuit Analysis Lab – F1 | Heavy Experimental Lab | 6.80 kW |
| **Floor 1** | `cp_lab1` | C Programming Lab – F1 | Computer Workstation Lab | 8.80 kW |
| **Floor 2** | `cr201` | Classroom 201 | Standard Classroom | 1.10 kW |
| **Floor 2** | `cr202` | Classroom 202 | Standard Classroom | 1.10 kW |
| **Floor 2** | `cr203` | Classroom 203 | Standard Classroom | 1.10 kW |
| **Floor 2** | `ca_lab2` | Circuit Analysis Lab – F2 | Heavy Experimental Lab | 6.80 kW |
| **Floor 2** | `cp_lab2` | C Programming Lab – F2 | Computer Workstation Lab | 8.80 kW |

### Connected Load Verification (Exact Reconciliation: 37.8 kW)

1. **Each Classroom (6 Rooms Total):**
   - 10 Tube Lights $\times$ 40 W = 400 W
   - 6 Ceiling Fans $\times$ 75 W = 450 W
   - 1 Projector $\times$ 250 W = 250 W
   - **Subtotal per Classroom = 1,100 W (1.1 kW)**
   - **6 Classrooms Total = 6.6 kW**

2. **Each Circuit Analysis Lab (2 Rooms Total):**
   - 2 Air Conditioners $\times$ 2,200 W = 4,400 W
   - 10 Tube Lights $\times$ 40 W = 400 W
   - Experimental Socket Group = 2,000 W (diversified test benches)
   - **Subtotal per Lab = 6,800 W (6.8 kW)**
   - **2 Circuit Analysis Labs Total = 13.6 kW**

3. **Each C Programming Lab (2 Rooms Total):**
   - 32 Desktop Computers $\times$ 150 W = 4,800 W
   - 2 Air Conditioners $\times$ 1,800 W = 3,600 W
   - 10 Tube Lights $\times$ 40 W = 400 W
   - **Subtotal per Lab = 8,800 W (8.8 kW)**
   - **2 C Programming Labs Total = 17.6 kW**

$$\text{Total Building Connected Load} = 6.6\,\text{kW} + 13.6\,\text{kW} + 17.6\,\text{kW} = \mathbf{37.8\,\text{kW}}$$

---

## 3. Electrical Power Calculations & Zero Double-Counting Guarantee

To ensure mathematical consistency, the platform provides two mutually exclusive calculation modes per room:

### Mode A: Appliance Simulation
Real power $P$ is calculated as the direct summation of rated wattages for all active virtual switches:
$$P_{\text{real}} = \sum_{i} (\text{State}_i \times \text{Rating}_i)$$
Apparent power $S$ and reactive power $Q$ are derived using nominal power factor ($\text{PF} \approx 0.92 - 0.95$):
$$S = \frac{P_{\text{real}}}{\text{PF}}, \quad Q = \sqrt{S^2 - P_{\text{real}}^2}, \quad I = \frac{S}{V}$$

### Mode B: Manual Electrical Input
When manual console input is engaged, single-phase sinusoidal AC supply equations determine room demand:
$$P = V \times I \times \text{PF}$$
$$S = V \times I$$
$$Q = \sqrt{S^2 - P^2}$$

> **Zero Double-Counting Rule:** If Mode B is selected, manual input exclusively dictates the room's contribution to building demand. Mode A appliance summation is never added to Mode B inputs for the same space.

---

## 4. Physics-Informed Room Thermal Model

Transient indoor temperature is governed by the room thermal energy-balance differential equation:

$$C \cdot \frac{dT}{dt} = Q_{\text{internal}} + Q_{\text{external}} - Q_{\text{cooling}}$$

### Discrete-Time Implementation
$$T(t + \Delta t) = T(t) + \frac{\Delta t}{C} \cdot \left(Q_{\text{internal}} + Q_{\text{external}} - Q_{\text{cooling}}\right)$$

Where:
- $C$: Effective thermal capacitance of space (classrooms: $18{,}000\,\text{J/K}$, labs: $25{,}000 - 28{,}000\,\text{J/K}$).
- $Q_{\text{internal}}$: Sensible heat dissipation from occupants ($100\,\text{W/person}$) + computers ($90\%$ of electrical draw) + lights ($80\%$ of electrical draw).
- $Q_{\text{external}} = U \cdot A \cdot (T_{\text{outdoor}} - T_{\text{indoor}}) + Q_{\text{solar}}$: Envelope conduction and solar irradiance.
- $Q_{\text{cooling}} = \text{COP} \times P_{\text{AC\_electrical}}$: Active heat pump extraction ($\text{COP} \approx 3.2$).
- **Hybrid Model Formulation:**
  $$T_{\text{hybrid}} = T_{\text{physics}} + \Delta T_{\text{ML\_residual}}$$
  Where $\Delta T_{\text{ML\_residual}}$ is a demonstration residual estimator reflecting humidity enthalpy coupling, structural air stratification, and infiltration.

---

## 5. Peak Demand Optimization (Linear Programming)

- **Objective Function:**
  $$\min J = \sum_{t=1}^{24} \text{Cost}(t) + \lambda \cdot \max_{t}(P_{\text{building}}(t))$$
- **Hard Constraints (Non-Flexible Pedagogical Loads):**
  - Essential classroom lights, fans, and active teaching projectors are **never turned off**.
  - Active lab workstations during scheduled academic sessions are **preserved**.
- **Flexible Optimization Controls:**
  - **AC Pre-Cooling:** Pre-cooling labs between 08:30 – 10:00 (off-peak tariff) using structural thermal storage.
  - **Thermostat Float:** Relaxing setpoints from $22.5^\circ\text{C}$ to $24.5^\circ\text{C}$ during peak tariff hours (11:00 – 14:30), cutting cooling electrical draw by $\sim 18\%$.
  - **Load Rescheduling:** Shifting $2.0\,\text{kW}$ non-critical circuit test bench loads from 12:00 peak to 15:30 off-peak.
  - **Virtual Battery Shaving:** Discharging $3.5\,\text{kW}$ during peak contract demand hour.

---

## 6. Future Stage 2 ESP32 Hardware Integration

The platform includes a decoupled `IDataProvider` interface:
```typescript
interface IDataProvider {
  readonly modeName: 'SIMULATION' | 'HARDWARE';
  isHardwareConnected(): boolean;
  getConnectionStatus(): object;
  getRoomTelemetry(roomId: string): Promise<Partial<RoomState> | null>;
  sendControlCommand(roomId: string, applianceId: string, state: boolean): Promise<boolean>;
}
```

### Future Physical Architecture:
```
[ESP32 Microcontroller] 
    ├── PZEM-004T (V, I, Active Power, Energy, Power Factor)
    ├── DHT22 Sensor (Indoor Ambient Temp & Relative Humidity)
    └── 8-Channel Relay Module (Branch Appliance Switching)
            │
            ▼ (Wi-Fi 802.11 b/g/n)
     [MQTT Broker] (Port 1883)
            │ (campus/building1/floor{id}/room{id}/telemetry)
            ▼
   [Python FastAPI Gateway] ──> [SQLite / PostgreSQL Database]
            │
            ▼ (WebSocket / REST API)
[Building Digital Twin Web App]
```

---

## 7. How to Run the Application

### Prerequisites
- Node.js (v18+ or v20+)
- npm (v9+)
- Python 3.10+ (optional, for backend companion services)

### Step 1: Install Frontend Dependencies
```powershell
npm install
```

### Step 2: Launch the Frontend Web Application
```powershell
npm run dev
```
Open your browser to: **`http://localhost:5173`**

### Step 3: Verify Production Build
```powershell
npm run build
npm run preview
```

### Step 4 (Optional): Run the Python FastAPI Companion Backend
```powershell
cd backend
python -m pip install -r requirements.txt
python main.py
```
Backend API interactive Swagger documentation will be available at: **`http://localhost:8000/docs`**

### Step 5: Execute Mathematical & Physical Unit Tests
```powershell
python backend/test_simulation.py
```
Output:
```
[PASS] Total Building Connected Load verified: 37.8 kW exactly matches specification!
[PASS] Sinusoidal power triangle verified: S=3450 VA, P=3174 W, Q=1352 VAR
[PASS] Thermal energy-balance Euler step verified: Net flux cooling=-2288 W (dT/dt < 0)
[PASS] Mode A / Mode B mutual exclusivity verified: Zero double-counting occurred.
```

---

## 8. Demonstration Workflow for Evaluators & Hackathons

1. **Overview Dashboard:** Observe real-time building demand ($kW$), connected load ($37.8\,\text{kW}$), daily energy ($kWh$), and category donut breakdown.
2. **Digital Twin (3D / 2D):** Rotate the 3D isometric college model. Observe rooms glowing in status colors (Green = low, Blue = normal, Orange = high, Red = critical).
3. **Appliance Switchboard:** Click any room (e.g. *Classroom 101* or *C Programming Lab – F1*) to toggle individual lights, fans, AC units (ON/OFF/AUTO), or workstations (slider from 0 to 32). Watch live power recalculate instantly across room, floor, and building aggregates.
4. **Manual Sensor Console:** Select a room, enter custom voltage ($230\,\text{V}$), current ($18\,\text{A}$), and power factor ($0.91$). Click **APPLY INPUT & SWITCH TO MODE B** to witness single-phase sinusoidal AC calculation ($P = V \cdot I \cdot \text{PF}$).
5. **Physics-Informed Model:** View continuous thermal mass differential calculations ($C \frac{dT}{dt} = Q_{\text{in}} + Q_{\text{ext}} - Q_{\text{cool}}$) and 12-hour thermal response curves comparing pure physics vs hybrid ML residual predictions.
6. **AI Energy Forecasting:** Inspect multi-horizon predictions for $15\,\text{m}$, $30\,\text{m}$, $1\,\text{h}$, $6\,\text{h}$, and $24\,\text{h}$ with MAE, RMSE, and $R^2$ validation scores.
7. **Anomaly Detection:** Review automated detection of ghost loads (empty rooms drawing high power), overcooling, idle computer clusters, and voltage grid sags. Click **Execute Corrective Action** to remediate.
8. **Peak Demand Optimizer:** Run the Linear Programming scheduler to view original load curve vs shaved curve, peak capacity reduction ($kW$ and $\%$), and financial savings.
9. **What-If Simulation:** Adjust computer usage, lighting, AC thermostat offset, and heat wave temperature sliders to observe immediate financial and peak demand delta impacts.
10. **Energy Reports:** Filter and export complete sub-metering telemetry to a downloadable IEEE-compliant CSV file.
