import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
 Profile,
 SixDofState,
 SixDofAxesConfig,
 GlobalFilterConfig,
 ButtonMapping,
 CalibrationData,
 AxisParameters,
 LedRingConfig,
 PowerManagementConfig,
 ActiveTab,
} from './types';
import {
 defaultProfiles,
 createDefaultLedRing,
 createDefaultPowerManagement,
} from './data/defaultProfiles';
import { hardwareConnection, ConnectionType } from './services/hardwareConnection';
import { Sidebar } from "./components/Sidebar";
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
import { ProfileManagerModal } from './components/ProfileManagerModal';
import { ProfilesAndFlashTab } from './components/ProfilesAndFlashTab';
import {
 Sparkles,
 Usb,
 Zap,
 Keyboard,
 RotateCcw,
 Bluetooth,
 Flame,
 CheckCircle,
 AlertCircle,
 X,
 Layers,
} from 'lucide-react';

// Helper to ensure 9 buttons are always present and normalized
const normalizeProfileButtons = (buttons?: ButtonMapping[]): ButtonMapping[] => {
 const defaultPins = [13, 12, 14, 27, 26, 25, 33, 32, 4];
 const list = buttons && Array.isArray(buttons) ? [...buttons] : [];
 return Array.from({ length: 9 }, (_, i) => {
 const existing = list.find((b) => b.gridPosition === i || b.id === `btn-${i + 1}`) || list[i];
 if (existing) {
 return {
 ...existing,
 id: existing.id || `btn-${i + 1}`,
 gridPosition: i,
 pinNumber: existing.pinNumber ?? defaultPins[i],
 };
 }
 return {
 id: `btn-${i + 1}`,
 pinNumber: defaultPins[i] || 32 + i,
 gridPosition: i,
 label: i === 8 ? 'Next Profile' : `Key ${i + 1}`,
 actionType: i === 8 ? 'profile_cycle_next' : 'cad_action',
 keyCombo: i === 8 ? [] : ['F6'],
 cadActionName: i === 8 ? 'Switch Profile' : `Action ${i + 1}`,
 description: i === 8 ? 'Tap: Cycle Profile / Hold: Show Battery' : `Custom Macro Key ${i + 1}`,
 holdActionType: i === 8 ? 'battery_indicator' : 'disabled',
 color: '#06b6d4',
 };
 });
};

export default function App() {
 // Profiles State
 const [profiles, setProfiles] = useState<Profile[]>(() => {
 const saved = localStorage.getItem('oofo_profiles') || localStorage.getItem('spacemouse_profiles');
 if (saved) {
 try {
 const parsed = JSON.parse(saved);
 if (Array.isArray(parsed) && parsed.length > 0) {
 return parsed.map((p: Profile) => ({
 ...p,
 buttons: normalizeProfileButtons(p.buttons),
 ledRing: p.ledRing || createDefaultLedRing(p.ledColor || '#ff8800'),
 powerManagement: p.powerManagement || createDefaultPowerManagement(),
 }));
 }
 } catch (e) {
 console.error('Failed to parse saved profiles:', e);
 }
 }
 return defaultProfiles.map((p) => ({
 ...p,
 buttons: normalizeProfileButtons(p.buttons),
 }));
 });

 const [activeProfileId, setActiveProfileId] = useState<string>(() => {
 const saved = localStorage.getItem('oofo_active_profile') || localStorage.getItem('spacemouse_active_profile');
 return saved || profiles[0]?.id || 'fusion360-default';
 });

 const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
 const [isProfileManagerOpen, setIsProfileManagerOpen] = useState<boolean>(false);

 // Hardware Connection State (Web Bluetooth / Web Serial)
 const [isConnected, setIsConnected] = useState<boolean>(false);
 const [connectionType, setConnectionType] = useState<ConnectionType>('none');
 const [connectedDeviceName, setConnectedDeviceName] = useState<string>('');
 const [baudRate, setBaudRate] = useState<number>(115200);
 const [packetHz, setPacketHz] = useState<number>(0);
 const [isSimulating, setIsSimulating] = useState<boolean>(true);
 const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

 const [serialLogs, setSerialLogs] = useState<
 Array<{ text: string; type: 'rx' | 'tx' | 'info' | 'error'; timestamp: number }>
 >([]);

 // Main SixDof State
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

 // Live Preview Matrix for Calibration
 const [previewMatrix, setPreviewMatrix] = useState<number[][] | null>(null);
 const [calibrationEuler, setCalibrationEuler] = useState({ yaw: 0, pitch: 0, roll: 0 });
 const [calibrationInvert, setCalibrationInvert] = useState({ x: false, y: false, z: false });

 const displaySixDofState = React.useMemo(() => {
   if (!previewMatrix || activeTab !== 'calibration') return sixDofState;
   const raw = [sixDofState.x, sixDofState.y, sixDofState.z, sixDofState.rx, sixDofState.ry, sixDofState.rz];
   const decoupled = [0, 0, 0, 0, 0, 0];
   for (let r = 0; r < 6; r++) {
     for (let c = 0; c < 6; c++) {
       decoupled[r] += previewMatrix[r][c] * raw[c];
     }
   }
   return {
     ...sixDofState,
     x: decoupled[0],
     y: decoupled[1],
     z: decoupled[2],
     rx: decoupled[3],
     ry: decoupled[4],
     rz: decoupled[5],
   };
 }, [sixDofState, previewMatrix, activeTab]);

 // Calibration Data
 const [calibrationData, setCalibrationData] = useState<CalibrationData>(() => {
 const saved = localStorage.getItem('oofo_calibration') || localStorage.getItem('spacemouse_calibration');
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

 // Save Profiles to LocalStorage
 useEffect(() => {
 localStorage.setItem('oofo_profiles', JSON.stringify(profiles));
 localStorage.setItem('oofo_active_profile', activeProfileId);
 }, [profiles, activeProfileId]);

 // Save Calibration Data
 useEffect(() => {
 localStorage.setItem('oofo_calibration', JSON.stringify(calibrationData));
 }, [calibrationData]);

 // Set up Hardware Connection Callbacks
 useEffect(() => {
 hardwareConnection.setCallbacks(
 (data: SixDofState) => {
 setSixDofState(data);
 setIsConnected(true);
 setPacketHz(hardwareConnection.currentHz);
 },
 (logText: string, type: 'rx' | 'tx' | 'info' | 'error') => {
 setSerialLogs((prev) => [
 ...prev.slice(-300),
 { text: logText, type, timestamp: Date.now() },
 ]);
 },
 (connected: boolean, type: ConnectionType, name: string) => {
 setIsConnected(connected);
 setConnectionType(type);
 setConnectedDeviceName(name);
 if (connected) {
 setIsSimulating(false);
 showToast('success', `Connected to ${name} via ${type === 'bluetooth' ? 'Bluetooth BLE' : 'USB Serial'}!`);
 } else {
 showToast('info', 'Hardware disconnected.');
 }
 }
 );
 }, []);

 // Update Hz ticker
 useEffect(() => {
 const interval = setInterval(() => {
 if (hardwareConnection.isConnected) {
 setPacketHz(hardwareConnection.currentHz);
 } else {
 setPacketHz(0);
 }
 }, 1000);
 return () => clearInterval(interval);
 }, []);

 const showToast = (type: 'success' | 'info' | 'error', text: string) => {
 setToastMessage({ type, text });
 setTimeout(() => {
 setToastMessage((cur) => (cur?.text === text ? null : cur));
 }, 4500);
 };

 // Connect Web Bluetooth
 const handleConnectBluetooth = async () => {
 const ok = await hardwareConnection.connectBluetooth();
 if (ok) {
 setIsConnected(true);
 setConnectionType('bluetooth');
 setIsSimulating(false);
 }
 };

 // Connect Web Serial
 const handleConnectSerial = async () => {
 const ok = await hardwareConnection.connectSerial(baudRate);
 if (ok) {
 setIsConnected(true);
 setConnectionType('serial');
 setIsSimulating(false);
 }
 };

 // Disconnect Hardware
 const handleDisconnectHardware = async () => {
 await hardwareConnection.disconnect();
 setIsConnected(false);
 setConnectionType('none');
 };

 // Send Command to ESP32 (BLE or Serial)
 const handleSendCommand = (cmd: string) => {
 hardwareConnection.sendCommand(cmd);
 };

  // Global 1-Click Sync ALL Profiles to Device
  const handleSyncAll = async (): Promise<boolean> => {
    if (!hardwareConnection.isConnected) {
      showToast('error', 'Device disconnected. Connect via Bluetooth or USB Serial first.');
      return false;
    }
    
    showToast('info', `Syncing ${profiles.length} profile(s) to SpaceMouse...`);
    const success = await hardwareConnection.syncAllToDevice(profiles, activeProfile.id);
    
    if (success) {
      showToast('success', `SpaceMouse is now fully synced!`);
      return true;
    } else {
      showToast('error', 'Failed to sync to SpaceMouse.');
      return false;
    }
  };

 // Profile Management Handlers
 const handleAddProfile = (newProfile: Profile) => {
 setProfiles((prev) => [...prev, newProfile]);
 };

 const handleUpdateProfile = (updatedProfile: Profile) => {
 setProfiles((prev) => prev.map((p) => (p.id === updatedProfile.id ? updatedProfile : p)));
 };

 const handleDeleteProfile = (profileId: string) => {
 setProfiles((prev) => prev.filter((p) => p.id !== profileId));
 };

 const handleImportProfiles = (imported: Profile[]) => {
 const formatted = imported.map((p) => ({
 ...p,
 buttons: normalizeProfileButtons(p.buttons),
 ledRing: p.ledRing || createDefaultLedRing(p.ledColor || '#ff8800'),
 powerManagement: p.powerManagement || createDefaultPowerManagement(),
 decouplingMatrix: p.decouplingMatrix || [
 [1, 0, 0, 0, 0, 0],
 [0, 1, 0, 0, 0, 0],
 [0, 0, 1, 0, 0, 0],
 [0, 0, 0, 1, 0, 0],
 [0, 0, 0, 0, 1, 0],
 [0, 0, 0, 0, 0, 1],
 ],
 }));
 setProfiles(formatted);
 if (formatted[0]) setActiveProfileId(formatted[0].id);
 showToast('success', `Imported ${formatted.length} profiles.`);
 };

 // Axis & Filter Modification Helpers
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
 const normalized = normalizeProfileButtons(p.buttons);
 const updatedButtons = normalized.map((b, idx) => {
 if (b.id === buttonId || `btn-${idx + 1}` === buttonId || (buttonId === 'btn-9' && idx === 8) || (b.gridPosition === 8 && buttonId.includes('9'))) {
 return { ...b, ...updated };
 }
 return b;
 });
 return {
 ...p,
 buttons: updatedButtons,
 };
 })
 );
 };

 const handleAddButton = () => {
 const newId = `btn-${Date.now()}`;
 const newButton: ButtonMapping = {
 id: newId,
 pinNumber: 32 + (activeProfile.buttons.length % 8),
 label: `Key ${activeProfile.buttons.length + 1}`,
 actionType: 'cad_action',
 keyCombo: ['F6'],
 cadActionName: 'Custom Action',
 description: 'Custom shortcut trigger',
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

 // Tare / Zero Center
 const handleZeroTare = () => {
 if (isConnected) {
 hardwareConnection.sendCommand('CAL_ZERO');
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
 <div className="min-h-screen bg-[#1c1c1e] text-zinc-100 flex font-sans selection:bg-blue-600 selection:text-blue-900">
 <Sidebar 
 activeTab={activeTab} 
 onSelectTab={setActiveTab}
 profiles={profiles}
 activeProfile={activeProfile}
 onSelectProfile={setActiveProfileId}
 isConnected={isConnected}
 connectionType={connectionType}
 deviceName={connectedDeviceName}
 onConnectBluetooth={handleConnectBluetooth}
 onConnectSerial={handleConnectSerial}
 onDisconnect={handleDisconnectHardware}
 packetHz={packetHz}
 onSyncAll={handleSyncAll}
 />
 
 <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
 

 {/* Floating Status Toast */}
 {toastMessage && (
 <div
 className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl border text-xs shadow-2xl flex items-center gap-3 animate-slideUp ${
 toastMessage.type === 'success'
 ? 'bg-green-50 border-green-300 text-green-700'
 : toastMessage.type === 'error'
 ? 'bg-red-50 border-red-300 text-red-700'
 : 'bg-blue-50 border-blue-300 text-blue-700'
 }`}
 >
 {toastMessage.type === 'success' ? (
 <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
 ) : toastMessage.type === 'error' ? (
 <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
 ) : (
 <Flame className="w-4 h-4 text-blue-600 shrink-0" />
 )}
 <span>{toastMessage.text}</span>
 <button
 onClick={() => setToastMessage(null)}
 className="text-zinc-400 hover:text-white p-1 ml-1"
 >
 <X className="w-3.5 h-3.5" />
 </button>
 </div>
 )}

 {/* Profile Management Modal */}
 <ProfileManagerModal
 isOpen={isProfileManagerOpen}
 onClose={() => setIsProfileManagerOpen(false)}
 profiles={profiles}
 activeProfileId={activeProfileId}
 onSelectProfile={setActiveProfileId}
 onAddProfile={handleAddProfile}
 onUpdateProfile={handleUpdateProfile}
 onDeleteProfile={handleDeleteProfile}
 onImportProfiles={handleImportProfiles}
 />

 {/* Main Content Area */}
 <main className="flex-1 overflow-y-auto p-6 animate-fadeIn">
 <div className="max-w-[1600px] mx-auto flex flex-col space-y-6">

  {/* TAB 1 & Calibration: 3D Studio Dashboard */}
  {(activeTab === 'dashboard' || activeTab === 'calibration') && (
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
  {/* Left 3D Viewport Column */}
 <div className="lg:col-span-7 flex flex-col space-y-3">
 <div className="flex-1 min-h-[420px]">
 <Visualizer3D
 state={displaySixDofState}
 ledColor={activeProfile.ledColor}
 isSimulating={isSimulating}
 calibrationMode={activeTab === 'calibration'}
 eulerAngles={calibrationEuler}
 onEulerChange={setCalibrationEuler}
 invertAxes={calibrationInvert}
 onInvertChange={setCalibrationInvert}
 />
 </div>

 {/* Keyboard Simulator Quick Helper */}
 {isSimulating && (
 <div className="p-3.5 neo-panel rounded-2xl border border-white/5 text-xs text-zinc-400 flex flex-wrap items-center justify-between gap-2">
 <div className="flex items-center gap-2">
 <Keyboard className="w-4 h-4 text-blue-600" />
 <span className="font-semibold text-zinc-200">Simulation Controls:</span>
 <span className=" text-blue-600">W/S</span> (Pan Y),{' '}
 <span className=" text-blue-600">A/D</span> (Pan X),{' '}
 <span className=" text-blue-600">Q/E</span> (Zoom),{' '}
 <span className=" text-blue-600">Arrows</span> (Tilt/Twist),{' '}
 <span className=" text-blue-600">Space</span> (Tare)
 </div>
 <span className="text-xs text-zinc-500">Hold Shift for micro precision</span>
 </div>
 )}
 </div>

  {/* Right Telemetry Gauges Column */}
  <div className="lg:col-span-5 space-y-3">
  {activeTab === 'dashboard' && (
  <SixDofGauges
  state={displaySixDofState}
  axes={activeProfile.axes}
  filters={activeProfile.filters}
  isSimulating={isSimulating}
  onSimulateChange={(key, val) => setSixDofState((s) => ({ ...s, [key]: val }))}
  onToggleFilter={(key) =>
  handleUpdateFilters({ [key]: !activeProfile.filters[key] })
  }
  onZeroTare={handleZeroTare}
  />
  )}
  
  {activeTab === 'calibration' && (
  <CalibrationWizardTab
  state={displaySixDofState}
  calibration={calibrationData}
  onPreviewMatrix={setPreviewMatrix}
  eulerAngles={calibrationEuler}
  onEulerChange={setCalibrationEuler}
  invertAxes={calibrationInvert}
  onInvertChange={setCalibrationInvert}
  onSaveCalibration={async (cal) => {
  setCalibrationData(cal);
  setPreviewMatrix(null); // Clear local preview once saved to hardware
  
  // The decoupling matrix is a global hardware property, but the firmware currently
  // stores it per-profile. Therefore, we must inject it into ALL profiles immediately.
  if (cal.matrixDecoupling && cal.matrixDecoupling.length === 6) {
    let updatedProfiles = profiles;
    setProfiles((prev) => {
      updatedProfiles = prev.map((p) => ({
        ...p,
        decouplingMatrix: cal.matrixDecoupling,
      }));
      return updatedProfiles;
    });
    
    // If connected, sync the new matrix to all 10 hardware slots immediately
    if (hardwareConnection.isConnected) {
      showToast('info', 'Pushing new orientation matrix to hardware...');
      const success = await hardwareConnection.syncAllToDevice(updatedProfiles, activeProfile.id);
      if (success) {
        showToast('success', 'Orientation applied to all profiles successfully!');
      } else {
        showToast('error', 'Failed to sync new orientation matrix to device.');
      }
    }
  }
  }}
  onSendSerialCommand={handleSendCommand}
  isConnected={isConnected}
  />
  )}
  </div>
  </div>
  )}

 {/* TAB 2: Key & Axis Mapping */}
 {activeTab === 'buttons' && (
 <ButtonMapperTab
 profile={activeProfile}
 buttonsPressed={sixDofState.buttonsPressed}
 sixDofState={sixDofState}
 onUpdateButton={handleUpdateButton}
 onUpdateAxis={handleUpdateAxis}
 onAddButton={handleAddButton}
 onDeleteButton={handleDeleteButton}
 />
 )}

 {/* TAB 3: Axis Tuning */}
 {activeTab === 'tuning' && (
 <AxisTuningTab
 axes={activeProfile.axes}
 filters={activeProfile.filters}
 onUpdateAxis={handleUpdateAxis}
 onUpdateFilters={handleUpdateFilters}
 onSyncAll={handleSyncAll}
 isConnected={isConnected}
 />
 )}

 {/* TAB 4: Lighting & Ring */}
 {activeTab === 'led_ring' && (
 <LedRingCustomizerTab
 config={activeProfile.ledRing || createDefaultLedRing(activeProfile.ledColor || '#ff8800')}
 onChangeConfig={handleUpdateLedRing}
 sixDofState={sixDofState}
 />
 )}

 {/* TAB 5: Battery & Sleep */}
 {activeTab === 'power' && (
 <PowerBatteryManagerTab
 config={activeProfile.powerManagement || createDefaultPowerManagement()}
 onChangeConfig={handleUpdatePowerManagement}
 ledBrightness={activeProfile.ledRing?.brightness || 65}
 ledRing={activeProfile.ledRing}
 />
 )}

 {/* TAB 6: Profiles & Flash */}
 {activeTab === 'profiles' && (
 <ProfilesAndFlashTab
 profiles={profiles}
 activeProfileId={activeProfileId}
 onSelectProfile={setActiveProfileId}
 onAddProfile={handleAddProfile}
 onUpdateProfile={handleUpdateProfile}
 onDeleteProfile={handleDeleteProfile}
 onImportProfiles={handleImportProfiles}
 isConnected={isConnected}
 connectionType={connectionType}
 onSyncAll={handleSyncAll}
 onNavigateToFirmware={() => setActiveTab('firmware')}
 />
 )}

 {/* SUB-TABS: Firmware, Calibration, Serial, Manual, Guide, AI */}
 {activeTab === 'firmware' && <FirmwareGeneratorTab profile={activeProfile} allProfiles={profiles} calibrationData={calibrationData} />}

 {activeTab === 'serial' && (
 <SerialMonitorTab
 logs={serialLogs}
 isConnected={isConnected}
 currentHz={packetHz}
 onSendCommand={handleSendCommand}
 onClearLogs={() => setSerialLogs([])}
 />
 )}

 {activeTab === 'manual' && (
 <HardwareManualTab
 profile={activeProfile}
 onApplyHardwarePreset={() => {
 setActiveProfileId('fusion360-default');
 }}
 />
 )}

 {activeTab === 'guide' && <CadIntegrationGuideTab />}
 {activeTab === 'ai' && <AiAssistantTab profile={activeProfile} />}
 </div>
 </main>
 </div>
 </div>
 );
};



