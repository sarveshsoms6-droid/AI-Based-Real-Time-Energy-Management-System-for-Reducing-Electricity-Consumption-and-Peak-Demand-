import React, { useState } from 'react';
import { SimulationProvider, useSimulation } from './context/SimulationContext';
import { Header } from './components/layout/Header';
import { StatusTicker } from './components/layout/StatusTicker';
import { Sidebar, NavPageId } from './components/layout/Sidebar';
import { RoomDetailModal } from './components/rooms/RoomDetailModal';

// Pages
import { OverviewDashboard } from './pages/OverviewDashboard';
import { TimetablePage } from './pages/TimetablePage';
import { DigitalTwinPage } from './pages/DigitalTwinPage';
import { FloorManagementPage } from './pages/FloorManagementPage';
import { RoomMonitoringPage } from './pages/RoomMonitoringPage';
import { ManualSensorConsolePage } from './pages/ManualSensorConsolePage';
import { PhysicsInformedPage } from './pages/PhysicsInformedPage';
import { ForecastingPage } from './pages/ForecastingPage';
import { AnomalyDetectionPage } from './pages/AnomalyDetectionPage';
import { PeakOptimizationPage } from './pages/PeakOptimizationPage';
import { WhatIfSimulationPage } from './pages/WhatIfSimulationPage';
import { EnergyReportsPage } from './pages/EnergyReportsPage';
import { SettingsPage } from './pages/SettingsPage';

const MainLayout: React.FC = () => {
  const [activePage, setActivePage] = useState<NavPageId>('overview');
  const { selectedRoomId, setSelectedRoomId } = useSimulation();

  const renderActivePage = () => {
    switch (activePage) {
      case 'overview':
        return <OverviewDashboard />;
      case 'timetable':
        return <TimetablePage />;
      case 'digital_twin':
        return <DigitalTwinPage />;
      case 'floor_management':
        return <FloorManagementPage />;
      case 'room_monitoring':
        return <RoomMonitoringPage />;
      case 'manual_console':
        return <ManualSensorConsolePage />;
      case 'physics_model':
        return <PhysicsInformedPage />;
      case 'ai_forecasting':
        return <ForecastingPage />;
      case 'anomaly_detection':
        return <AnomalyDetectionPage />;
      case 'peak_optimization':
        return <PeakOptimizationPage />;
      case 'what_if':
        return <WhatIfSimulationPage />;
      case 'reports':
        return <EnergyReportsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <OverviewDashboard />;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-page text-slate-900">
      {/* Top Header */}
      <Header />

      {/* Real-Time SCADA Telemetry Status Ticker */}
      <StatusTicker />

      {/* Main Body: Sidebar + Dynamic Page Content */}
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar activePage={activePage} setActivePage={setActivePage} />

        <main className="flex-1 overflow-y-auto p-6 bg-page scada-grid">
          <div className="max-w-[1600px] mx-auto pb-12">
            {renderActivePage()}
          </div>
        </main>
      </div>

      {/* Interactive Room Control & Switchboard Modal */}
      <RoomDetailModal
        roomId={selectedRoomId}
        onClose={() => setSelectedRoomId(null)}
      />
    </div>
  );
};

export default function App() {
  return (
    <SimulationProvider>
      <MainLayout />
    </SimulationProvider>
  );
}
