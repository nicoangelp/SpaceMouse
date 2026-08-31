import React from 'react';
import { Profile } from '../types';
import {
  Orbit,
  Sliders,
  Keyboard,
  Target,
  Cpu,
  Terminal,
  BookOpen,
  Sparkles,
  Usb,
  Radio,
  Layers,
  Save,
  CheckCircle,
  Play,
  Pause,
  Wrench,
  BatteryCharging,
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'manual'
  | 'led_ring'
  | 'power'
  | 'tuning'
  | 'buttons'
  | 'calibration'
  | 'firmware'
  | 'serial'
  | 'guide'
  | 'ai';

interface NavigationHeaderProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  profiles: Profile[];
  activeProfile: Profile;
  onSelectProfile: (profileId: string) => void;
  isConnected: boolean;
  onConnectSerial: () => void;
  onDisconnectSerial: () => void;
  baudRate: number;
  onSelectBaudRate: (baud: number) => void;
  packetHz: number;
  isSimulating: boolean;
  onToggleSimulation: () => void;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  activeTab,
  onSelectTab,
  profiles,
  activeProfile,
  onSelectProfile,
  isConnected,
  onConnectSerial,
  onDisconnectSerial,
  baudRate,
  onSelectBaudRate,
  packetHz,
  isSimulating,
  onToggleSimulation,
}) => {
  const tabs = [
    { id: 'dashboard' as const, label: 'Live 6-DOF Studio', icon: Orbit },
    { id: 'manual' as const, label: 'Hardware Manual & Wiring', icon: Wrench },
    { id: 'led_ring' as const, label: '24-LED Ring Studio', icon: Sparkles },
    { id: 'power' as const, label: 'Battery & Sleep Optimizer', icon: BatteryCharging },
    { id: 'tuning' as const, label: 'Axis Curves & Deadzone', icon: Sliders },
    { id: 'buttons' as const, label: 'CAD Button Mapper', icon: Keyboard },
    { id: 'calibration' as const, label: 'Sensor Calibration', icon: Target },
    { id: 'firmware' as const, label: 'ESP32 Firmware', icon: Cpu },
    { id: 'serial' as const, label: 'Serial Monitor', icon: Terminal },
    { id: 'guide' as const, label: 'Fusion & CAD Guide', icon: BookOpen },
    { id: 'ai' as const, label: 'AI Hardware Advisor', icon: Sparkles },
  ];

  return (
    <header className="bg-[#090b0e]/95 backdrop-blur-xl border-b border-[#1e2632] sticky top-0 z-50 shadow-2xl">
      {/* Top Main Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* App Title & Identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 via-sky-500 to-indigo-600 p-0.5 glow-cyan-sm flex items-center justify-center">
            <div className="w-full h-full bg-[#050608] rounded-[7px] flex items-center justify-center text-cyan-400">
              <Orbit className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs font-black text-white tracking-wide uppercase font-mono">
                SpaceMouse <span className="text-cyan-400">Studio</span>
              </h1>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 font-semibold">
                ESP32 6-DOF
              </span>
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-2 font-mono">
              <span className="text-slate-500">6-AXIS CAD CONTROLLER</span>
              <span className="w-1 h-1 rounded-full bg-cyan-500/60" />
              <span className="text-cyan-300 font-medium">{activeProfile.name}</span>
            </div>
          </div>
        </div>

        {/* Center: Profile Switcher & Simulation Toggle */}
        <div className="flex items-center gap-2.5">
          {/* Active Profile Dropdown */}
          <div className="flex items-center gap-1.5 px-2 py-1 bg-[#050608] rounded-lg border border-[#1e2632] text-xs">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] text-slate-400 font-mono">PROFILE:</span>
            <select
              value={activeProfile.id}
              onChange={(e) => onSelectProfile(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white px-1 py-0.5 focus:outline-none cursor-pointer"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#090b0e] text-white">
                  {p.name} ({p.targetApp.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* Simulation Mode Toggle */}
          <button
            id="btn-toggle-simulation"
            onClick={onToggleSimulation}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              isSimulating
                ? 'bg-amber-950/70 border-amber-500/60 text-amber-300 glow-amber-sm'
                : 'bg-[#050608] border-[#1e2632] text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
            title="Simulate 6-DOF SpaceMouse using on-screen sliders and keyboard"
          >
            {isSimulating ? <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" /> : <Pause className="w-3.5 h-3.5" />}
            <span className="font-mono text-[11px]">SIM: {isSimulating ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {/* Right: WebSerial Connect & Status */}
        <div className="flex items-center gap-2">
          {/* Baud Rate Picker */}
          <select
            value={baudRate}
            onChange={(e) => onSelectBaudRate(parseInt(e.target.value, 10))}
            disabled={isConnected}
            className="bg-[#050608] text-slate-300 border border-[#1e2632] rounded-lg text-xs px-2.5 py-1.5 font-mono focus:outline-none focus:border-cyan-500 disabled:opacity-50"
          >
            <option value={115200}>115.2k baud</option>
            <option value={230400}>230.4k baud</option>
            <option value={921600}>921.6k baud</option>
            <option value={57600}>57.6k baud</option>
          </select>

          {/* Connect / Disconnect Action */}
          {isConnected ? (
            <button
              id="btn-disconnect-serial"
              onClick={onDisconnectSerial}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-rose-950/90 text-emerald-300 hover:text-rose-300 border border-emerald-500/50 hover:border-rose-500 text-xs font-semibold glow-emerald-sm transition-all"
            >
              <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
              <span className="font-mono text-[11px]">PORT OPEN ({packetHz} Hz)</span>
            </button>
          ) : (
            <button
              id="btn-connect-serial"
              onClick={onConnectSerial}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs shadow-lg glow-cyan-sm active:scale-95 transition-all"
            >
              <Usb className="w-3.5 h-3.5 text-black" />
              <span>CONNECT SERIAL</span>
            </button>
          )}
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 overflow-x-auto no-scrollbar border-t border-[#1e2632]/80">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium border-b-2 whitespace-nowrap transition-all ${
                isActive
                  ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
