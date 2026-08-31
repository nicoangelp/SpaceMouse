import React, { useState, useEffect, useCallback } from 'react';
import {
  Profile,
  SixDofState,
  SixDofAxesConfig,
  GlobalFilterConfig,
  ButtonMapping,
  CalibrationData,
  AxisParameters,
} from './types';
import { defaultProfiles, createDefaultLedRing, createDefaultPowerManagement, createDefaultTriangularFlexure } from './data/defaultProfiles';
import { serialManager } from './services/serialManager';
import { NavigationHeader, ActiveTab } from './components/NavigationHeader';
import { Visualizer3D } from './components/Visualizer3D';
import { SixDofGauges } from './components/SixDofGauges';
import { AxisTuningTab } from './components/AxisTuningTab';
import { ButtonMapperTab } from './components/ButtonMapperTab';
import { CalibrationWizardTab } from './components/CalibrationWizardTab';
import { FirmwareGeneratorTab } from './components/FirmwareGeneratorTab';
import { HardwareManualTab } from './components/HardwareManualTab';
import { LedRingCustomizerTab } from './components/LedRingCustomizerTab';
import { PowerBatteryManagerTab } from './components/PowerBatteryManagerTab';
import { SerialMonitorTab } from './components/SerialMonitorTab';
import { CadIntegrationGuideTab } from './components/CadIntegrationGuideTab';
import { AiAssistantTab } from './components/AiAssistantTab';
import { Sparkles, Usb, Zap, Keyboard, RotateCcw } from 'lucide-react';
import { LedRingConfig, PowerManagementConfig, TriangularSpringFlexureConfig } from './types';

export default function App() {
  // Profiles State
  const [profiles, setProfiles] = useState<Profile[]>(() => {
    const saved = localStorage.getItem('spacemouse_profiles');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure backward compatibility by merging missing ledRing, powerManagement, and triangularFlexure
          return parsed.map((p: Profile) => ({
            ...p,
            ledRing: p.ledRing || createDefaultLedRing(p.ledColor || '#ff8800'),
            powerManagement: p.powerManagement || createDefaultPowerManagement(),
            triangularFlexure: p.triangularFlexure || createDefaultTriangularFlexure(),
          }));
        }
      } catch (e) {
        console.error('Failed to parse saved profiles:', e);
      }
    }
    return defaultProfiles;
  });

  const [activeProfileId, setActiveProfileId] = useState<string>(profiles[0]?.id || 'fusion360-default');
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Serial & Telemetry State
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [baudRate, setBaudRate] = useState<number>(115200);
  const [packetHz, setPacketHz] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState<boolean>(true); // Active by default for immediate feedback
  const [serialLogs, setSerialLogs] = useState<
    Array<{ text: string; type: 'rx' | 'tx' | 'info' | 'error'; timestamp: number }>
  >([]);

  // 6-DOF Live State
  const [sixDofState, setSixDofState] = useState<SixDofState>({
    x: 0,
    y: 0,
    z: 0,
    rx: 0,
    ry: 0,
    rz: 0,
    rawAdc: [2048, 2048, 2048, 2048, 2048, 2048],
    buttonsPressed: new Array(16).fill(false),
    timestamp: Date.now(),
  });

  // Calibration Data
  const [calibrationData, setCalibrationData] = useState<CalibrationData>(() => {
    const saved = localStorage.getItem('spacemouse_calibration');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {
      zeroOffsets: [2048, 2048, 2048, 2048, 2048, 2048],
      minDeflections: [800, 800, 800, 800, 800, 800],
      maxDeflections: [3200, 3200, 3200, 3200, 3200, 3200],
      matrixDecoupling: [
        [1, 0, 0, 0, 0, 0],
        [0, 1, 0, 0, 0, 0],
        [0, 0, 1, 0, 0, 0],
        [0, 0, 0, 1, 0, 0],
        [0, 0, 0, 0, 1, 0],
        [0, 0, 0, 0, 0, 1],
      ],
      isCalibrated: false,
    };
  });

  const activeProfile = profiles.find((p) => p.id === activeProfileId) || profiles[0];

  // Save Profiles to LocalStorage on change
  useEffect(() => {
    localStorage.setItem('spacemouse_profiles', JSON.stringify(profiles));
  }, [profiles]);

  // Set up Serial Callbacks
  useEffect(() => {
    serialManager.setCallbacks(
      (data: SixDofState) => {
        setSixDofState(data);
        setIsConnected(true);
        setPacketHz(serialManager.currentHz);
      },
      (logText: string, type: 'rx' | 'tx' | 'info' | 'error') => {
        setSerialLogs((prev) => [
          ...prev.slice(-300), // Keep last 300 logs
          { text: logText, type, timestamp: Date.now() },
        ]);
      }
    );
  }, []);

  // Update Hz ticker
  useEffect(() => {
    const interval = setInterval(() => {
      if (serialManager.isConnected) {
        setPacketHz(serialManager.currentHz);
      } else {
        setPacketHz(0);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Serial Connect / Disconnect handlers
  const handleConnectSerial = async () => {
    const ok = await serialManager.connect(baudRate);
    if (ok) {
      setIsConnected(true);
      setIsSimulating(false); // Stop simulation when real hardware is active
    }
  };

  const handleDisconnectSerial = async () => {
    await serialManager.disconnect();
    setIsConnected(false);
  };

  const handleSendCommand = (cmd: string) => {
    serialManager.sendCommand(cmd);
  };

  // Profile Modification Helpers
  const handleUpdateAxis = (axisKey: keyof SixDofAxesConfig, params: Partial<AxisParameters>) => {
    setProfiles((prev) =>
      prev.map((p) => {
        if (p.id !== activeProfile.id) return p;
        return {
          ...p,
          axes: {
            ...p.axes,
            [axisKey]: { ...p.axes[axisKey], ...params },
          },
        };
      })
    );
  };

  const handleUpdateFilters = (filters: Partial<GlobalFilterConfig>) => {
    setProfiles((prev) =>
      prev.map((p) => {
        if (p.id !== activeProfile.id) return p;
        return {
          ...p,
          filters: { ...p.filters, ...filters },
        };
      })
    );
  };

  const handleUpdateButton = (buttonId: string, updated: Partial<ButtonMapping>) => {
    setProfiles((prev) =>
      prev.map((p) => {
        if (p.id !== activeProfile.id) return p;
        return {
          ...p,
          buttons: p.buttons.map((b) => (b.id === buttonId ? { ...b, ...updated } : b)),
        };
      })
    );
  };

  const handleAddButton = () => {
    const newId = `btn-${Date.now()}`;
    const newButton: ButtonMapping = {
      id: newId,
      pinNumber: 32 + (activeProfile.buttons.length % 8),
      label: `Button ${activeProfile.buttons.length + 1}`,
      actionType: 'cad_action',
      keyCombo: ['F6'],
      cadActionName: 'Custom Action',
      description: 'Custom auxiliary trigger',
      color: '#38bdf8',
    };
    setProfiles((prev) =>
      prev.map((p) => {
        if (p.id !== activeProfile.id) return p;
        return {
          ...p,
          buttons: [...p.buttons, newButton],
        };
      })
    );
  };

  const handleDeleteButton = (buttonId: string) => {
    setProfiles((prev) =>
      prev.map((p) => {
        if (p.id !== activeProfile.id) return p;
        return {
          ...p,
          buttons: p.buttons.filter((b) => b.id !== buttonId),
        };
      })
    );
  };

  const handleUpdateLedRing = (ledRing: LedRingConfig) => {
    setProfiles((prev) =>
      prev.map((p) => {
        if (p.id !== activeProfile.id) return p;
        return {
          ...p,
          ledRing,
          ledColor: ledRing.primaryColor,
        };
      })
    );
  };

  const handleUpdatePowerManagement = (powerManagement: PowerManagementConfig) => {
    setProfiles((prev) =>
      prev.map((p) => {
        if (p.id !== activeProfile.id) return p;
        return {
          ...p,
          powerManagement,
        };
      })
    );
  };

  const handleUpdateTriangularFlexure = (triangularFlexure: TriangularSpringFlexureConfig) => {
    setProfiles((prev) =>
      prev.map((p) => {
        if (p.id !== activeProfile.id) return p;
        return {
          ...p,
          triangularFlexure,
        };
      })
    );
  };

  // Tare / Zero Center
  const handleZeroTare = () => {
    if (isConnected) {
      serialManager.sendCommand('CAL_ZERO');
    }
    setSixDofState((prev) => ({
      ...prev,
      x: 0,
      y: 0,
      z: 0,
      rx: 0,
      ry: 0,
      rz: 0,
    }));
  };

  // Keyboard Simulation Handler (W/A/S/D/Q/E + Arrows)
  useEffect(() => {
    if (!isSimulating) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid intercepting input while typing in text inputs
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;

      const step = e.shiftKey ? 0.15 : 0.4;
      if (e.key === 'a' || e.key === 'A') setSixDofState((s) => ({ ...s, x: Math.max(-1, s.x - step) }));
      if (e.key === 'd' || e.key === 'D') setSixDofState((s) => ({ ...s, x: Math.min(1, s.x + step) }));
      if (e.key === 'w' || e.key === 'W') setSixDofState((s) => ({ ...s, y: Math.min(1, s.y + step) }));
      if (e.key === 's' || e.key === 'S') setSixDofState((s) => ({ ...s, y: Math.max(-1, s.y - step) }));
      if (e.key === 'q' || e.key === 'Q') setSixDofState((s) => ({ ...s, z: Math.min(1, s.z + step) }));
      if (e.key === 'e' || e.key === 'E') setSixDofState((s) => ({ ...s, z: Math.max(-1, s.z - step) }));
      if (e.key === 'ArrowUp') setSixDofState((s) => ({ ...s, rx: Math.min(1, s.rx + step) }));
      if (e.key === 'ArrowDown') setSixDofState((s) => ({ ...s, rx: Math.max(-1, s.rx - step) }));
      if (e.key === 'ArrowLeft') setSixDofState((s) => ({ ...s, rz: Math.max(-1, s.rz - step) }));
      if (e.key === 'ArrowRight') setSixDofState((s) => ({ ...s, rz: Math.min(1, s.rz + step) }));
      if (e.key === ' ') handleZeroTare();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;
      if (['a', 'A', 'd', 'D'].includes(e.key)) setSixDofState((s) => ({ ...s, x: 0 }));
      if (['w', 'W', 's', 'S'].includes(e.key)) setSixDofState((s) => ({ ...s, y: 0 }));
      if (['q', 'Q', 'e', 'E'].includes(e.key)) setSixDofState((s) => ({ ...s, z: 0 }));
      if (['ArrowUp', 'ArrowDown'].includes(e.key)) setSixDofState((s) => ({ ...s, rx: 0 }));
      if (['ArrowLeft', 'ArrowRight'].includes(e.key)) setSixDofState((s) => ({ ...s, rz: 0 }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isSimulating]);

  return (
    <div className="min-h-screen bg-[#050608] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Navigation Top Header */}
      <NavigationHeader
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        profiles={profiles}
        activeProfile={activeProfile}
        onSelectProfile={setActiveProfileId}
        isConnected={isConnected}
        onConnectSerial={handleConnectSerial}
        onDisconnectSerial={handleDisconnectSerial}
        baudRate={baudRate}
        onSelectBaudRate={setBaudRate}
        packetHz={packetHz}
        isSimulating={isSimulating}
        onToggleSimulation={() => setIsSimulating(!isSimulating)}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto px-4 py-5 flex-1 flex flex-col space-y-5">
        {/* TAB 1: Live Dashboard & 3D Visualizer */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1">
            {/* Left 3D Viewport Column */}
            <div className="lg:col-span-7 flex flex-col space-y-3">
              <div className="flex-1 min-h-[420px]">
                <Visualizer3D
                  state={sixDofState}
                  ledColor={activeProfile.ledColor}
                  isSimulating={isSimulating}
                />
              </div>

              {/* Keyboard Simulator Quick Helper */}
              {isSimulating && (
                <div className="p-3 bg-[#0a0d12]/90 rounded-xl border border-[#1e2632] text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Keyboard className="w-4 h-4 text-cyan-400" />
                    <span className="font-semibold text-slate-200">Simulation Controls:</span>
                    <span className="font-mono text-cyan-300">W/S</span> (Pan Y),{' '}
                    <span className="font-mono text-cyan-300">A/D</span> (Pan X),{' '}
                    <span className="font-mono text-cyan-300">Q/E</span> (Zoom),{' '}
                    <span className="font-mono text-cyan-300">Arrows</span> (Tilt/Twist),{' '}
                    <span className="font-mono text-cyan-300">Space</span> (Tare)
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Shift for fine precision</span>
                </div>
              )}
            </div>

            {/* Right Telemetry Gauges Column */}
            <div className="lg:col-span-5 space-y-3">
              <SixDofGauges
                state={sixDofState}
                axes={activeProfile.axes}
                filters={activeProfile.filters}
                isSimulating={isSimulating}
                onSimulateChange={(key, val) => setSixDofState((s) => ({ ...s, [key]: val }))}
                onToggleFilter={(key) =>
                  handleUpdateFilters({ [key]: !activeProfile.filters[key] })
                }
                onZeroTare={handleZeroTare}
              />
            </div>
          </div>
        )}

        {/* TAB 2: Hardware Manual & Wiring */}
        {activeTab === 'manual' && (
          <HardwareManualTab
            profile={activeProfile}
            onApplyHardwarePreset={() => {
              setActiveProfileId('fusion360-default');
            }}
          />
        )}

        {/* TAB 2.5: 24-LED Ring Studio Customizer */}
        {activeTab === 'led_ring' && (
          <LedRingCustomizerTab
            config={activeProfile.ledRing || createDefaultLedRing(activeProfile.ledColor || '#ff8800')}
            onChangeConfig={handleUpdateLedRing}
            sixDofState={sixDofState}
          />
        )}

        {/* TAB 2.6: Battery & Power Efficiency Optimizer */}
        {activeTab === 'power' && (
          <PowerBatteryManagerTab
            config={activeProfile.powerManagement || createDefaultPowerManagement()}
            onChangeConfig={handleUpdatePowerManagement}
            ledBrightness={activeProfile.ledRing?.brightness || 65}
          />
        )}

        {/* TAB 3: Axis Tuning & Curves */}
        {activeTab === 'tuning' && (
          <AxisTuningTab
            axes={activeProfile.axes}
            filters={activeProfile.filters}
            triangularFlexure={activeProfile.triangularFlexure || createDefaultTriangularFlexure()}
            onUpdateAxis={handleUpdateAxis}
            onUpdateFilters={handleUpdateFilters}
            onUpdateTriangularFlexure={handleUpdateTriangularFlexure}
            onSyncToEsp32={() => {
              if (isConnected) {
                serialManager.sendCommand(`SET_ALPHA:${activeProfile.filters.smoothingAlpha}`);
                serialManager.sendCommand('SAVE_EEPROM');
              }
            }}
            isConnected={isConnected}
          />
        )}

        {/* TAB 4: Button & Macro Mapper */}
        {activeTab === 'buttons' && (
          <ButtonMapperTab
            profile={activeProfile}
            buttonsPressed={sixDofState.buttonsPressed}
            onUpdateButton={handleUpdateButton}
            onAddButton={handleAddButton}
            onDeleteButton={handleDeleteButton}
          />
        )}

        {/* TAB 4: Sensor Calibration Wizard */}
        {activeTab === 'calibration' && (
          <CalibrationWizardTab
            state={sixDofState}
            calibration={calibrationData}
            onSaveCalibration={(cal) => {
              setCalibrationData(cal);
              localStorage.setItem('spacemouse_calibration', JSON.stringify(cal));
            }}
            onSendSerialCommand={handleSendCommand}
            isConnected={isConnected}
          />
        )}

        {/* TAB 5: ESP32 Firmware Generator */}
        {activeTab === 'firmware' && <FirmwareGeneratorTab profile={activeProfile} />}

        {/* TAB 6: Serial Monitor */}
        {activeTab === 'serial' && (
          <SerialMonitorTab
            logs={serialLogs}
            isConnected={isConnected}
            currentHz={packetHz}
            onSendCommand={handleSendCommand}
            onClearLogs={() => setSerialLogs([])}
          />
        )}

        {/* TAB 7: CAD & Fusion 360 Guide */}
        {activeTab === 'guide' && <CadIntegrationGuideTab />}

        {/* TAB 8: AI Advisor */}
        {activeTab === 'ai' && <AiAssistantTab profile={activeProfile} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1e2632] bg-[#090b0e] py-3 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-cyan-500/80 animate-pulse" />
            <span className="text-slate-300">DIY SpaceMouse Studio</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">ESP32 6-DOF Open Architecture</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[10px] text-slate-400">
            <span>Autodesk Fusion 360 • Blender • SolidWorks • FreeCAD</span>
            <span className="w-1 h-1 rounded-full bg-[#1e2632]" />
            <span className="text-cyan-400/80">TinyUSB 1000Hz HID</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
