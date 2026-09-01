import React, { useState } from 'react';
import { Profile } from '../types';
import {
 Orbit,
 Sliders,
 Keyboard,
 Sun,
 BatteryCharging,
 Layers,
 HelpCircle,
 Bluetooth,
 Usb,
 Flame,
 Play,
 Pause,
 ChevronDown,
 FileCode,
 Target,
 Terminal,
 Wrench,
 BookOpen,
 Sparkles,
 Zap,
} from 'lucide-react';
import { ConnectionType } from '../services/hardwareConnection';

export type ActiveTab =
 | 'dashboard'
 | 'tuning'
 | 'calibration'
 | 'buttons'
 | 'led_ring'
 | 'power'
 | 'profiles'
 | 'firmware'
 | 'serial'
 | 'manual'
 | 'guide'
 | 'ai';

interface NavigationHeaderProps {
 activeTab: ActiveTab;
 onSelectTab: (tab: ActiveTab) => void;
 profiles: Profile[];
 activeProfile: Profile;
 onSelectProfile: (profileId: string) => void;
 isConnected: boolean;
 connectionType: ConnectionType;
 deviceName?: string;
 onConnectBluetooth: () => void;
 onConnectSerial: () => void;
 onDisconnect: () => void;
 baudRate: number;
 onSelectBaudRate: (baud: number) => void;
 packetHz: number;
 isSimulating: boolean;
 onToggleSimulation: () => void;
 onOpenProfileManager: () => void;
 onQuickBurnNvs?: () => void;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
 activeTab,
 onSelectTab,
 profiles,
 activeProfile,
 onSelectProfile,
 isConnected,
 connectionType,
 deviceName,
 onConnectBluetooth,
 onConnectSerial,
 onDisconnect,
 baudRate,
 onSelectBaudRate,
 packetHz,
 isSimulating,
 onToggleSimulation,
 onOpenProfileManager,
 onQuickBurnNvs,
}) => {
 const [isBurning, setIsBurning] = useState(false);

 const handleBurnClick = async () => {
 if (onQuickBurnNvs) {
 setIsBurning(true);
 await onQuickBurnNvs();
 setTimeout(() => setIsBurning(false), 1200);
 }
 };

 // Primary top navigation items
 const primaryNavItems: Array<{
 id: string;
 targetTab: ActiveTab;
 label: string;
 icon: React.ComponentType<{ className?: string }>;
 isActive: boolean;
 }> = [
 {
 id: 'studio',
 targetTab: 'dashboard',
 label: '3D Studio',
 icon: Orbit,
 isActive: activeTab === 'dashboard',
 },
 {
 id: 'keys',
 targetTab: 'buttons',
 label: 'Key & Axis Mapping',
 icon: Keyboard,
 isActive: activeTab === 'buttons',
 },
 {
 id: 'tuning',
 targetTab: 'tuning',
 label: 'Axis Tuning',
 icon: Sliders,
 isActive: ['tuning', 'calibration', 'serial'].includes(activeTab),
 },
 {
 id: 'lighting',
 targetTab: 'led_ring',
 label: 'Lighting & Ring',
 icon: Sun,
 isActive: activeTab === 'led_ring',
 },
 {
 id: 'power',
 targetTab: 'power',
 label: 'Battery & Sleep',
 icon: BatteryCharging,
 isActive: activeTab === 'power',
 },
 {
 id: 'profiles',
 targetTab: 'profiles',
 label: 'Profiles & Flash',
 icon: Layers,
 isActive: ['profiles', 'firmware'].includes(activeTab),
 },
 {
 id: 'docs',
 targetTab: 'manual',
 label: 'Hardware & Docs',
 icon: HelpCircle,
 isActive: ['manual', 'guide', 'ai'].includes(activeTab),
 },
 ];

 return (
 <header className="neo-panel-inset border-b border-[#1c2230] sticky top-0 z-40 shadow-xl select-none">
 {/* Top Main Navigation Bar */}
 <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
 {/* Left: Brand Identity */}
 <div className="flex items-center gap-3">
 <div
 onClick={() => onSelectTab('dashboard')}
 className="cursor-pointer w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 via-sky-500 to-indigo-600 p-0.5 shadow-md flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
 title="Return to OOFO One Studio"
 >
 <div className="w-full h-full neo-panel-inset rounded-[10px] flex items-center justify-center text-blue-400">
 <Orbit className="w-5 h-5" />
 </div>
 </div>
 <div>
 <div className="flex items-center gap-2">
 <h1 className="text-xs font-semibold text-white tracking-wide uppercase">
 OOFO <span className="text-blue-400">ONE</span>
 </h1>
 <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-950/80 border border-blue-200 text-blue-400 font-semibold">
 6-DOF
 </span>
 </div>
 <div className="text-xs text-zinc-400 flex items-center gap-1.5">
 <span>Profile:</span>
 <span className="text-white font-semibold truncate max-w-[120px]">
 {activeProfile.name}
 </span>
 </div>
 </div>
 </div>

 {/* Center: Primary Navigation Tabs (Logi Options+ Style) */}
 <nav className="flex items-center p-1 rounded-xl neo-panel backdrop-blur-xl border border-transparent gap-1">
 {primaryNavItems.map((item) => {
 const Icon = item.icon;
 return (
 <button
 key={item.id}
 onClick={() => onSelectTab(item.targetTab)}
 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
 item.isActive
 ? 'bg-blue-600 text-black font-semibold shadow-sm'
 : 'text-zinc-400 hover:text-white hover:bg-slate-800'
 }`}
 >
 <Icon className={`w-3.5 h-3.5 ${item.isActive ? 'text-black' : 'text-zinc-400'}`} />
 <span className="hidden sm:inline">{item.label}</span>
 </button>
 );
 })}
 </nav>

 {/* Right: Hardware Connection & Fast Flash Action */}
 <div className="flex items-center gap-2">
 {/* Profile Switcher Quick Pill */}
 <div className="hidden lg:flex items-center neo-panel backdrop-blur-xl rounded-xl border border-transparent px-2 py-1 gap-1.5 text-xs">
 <div
 className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
 style={{ backgroundColor: activeProfile.ledColor || '#ff8800' }}
 />
 <select
 value={activeProfile.id}
 onChange={(e) => onSelectProfile(e.target.value)}
 className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer max-w-[130px] truncate"
 >
 {profiles.map((p) => (
 <option key={p.id} value={p.id} className="neo-panel backdrop-blur-xl text-white">
 {p.name}
 </option>
 ))}
 </select>
 </div>

 {/* Simulation Toggle */}
 <button
 onClick={onToggleSimulation}
 className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition ${
 isSimulating
 ? 'bg-blue-500/20 border-amber-500/50 text-blue-400'
 : 'neo-panel backdrop-blur-xl border-transparent text-zinc-400 hover:text-white'
 }`}
 title="Toggle Keyboard Simulation (W/A/S/D/Q/E + Arrows)"
 >
 {isSimulating ? <Pause className="w-3.5 h-3.5 text-blue-400" /> : <Play className="w-3.5 h-3.5 text-zinc-400" />}
 <span className="hidden md:inline">{isSimulating ? 'Sim On' : 'Simulate'}</span>
 </button>

 {/* Quick Burn to Flash Button */}
 {onQuickBurnNvs && (
 <button
 onClick={handleBurnClick}
 disabled={isBurning || !isConnected}
 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
 !isConnected
 ? 'neo-panel backdrop-blur-xl text-zinc-500 border border-transparent cursor-not-allowed opacity-60'
 : isBurning
 ? 'bg-blue-700 text-black'
 : 'bg-blue-600 hover:bg-cyan-400 text-black shadow-sm'
 }`}
 title="Save active profile & settings to ESP32 Flash Memory (NVS)"
 >
 <Flame className={`w-3.5 h-3.5 ${isBurning ? 'animate-bounce' : ''}`} />
 <span className="hidden sm:inline">{isBurning ? 'Writing...' : 'Burn NVS'}</span>
 </button>
 )}

 {/* Hardware Connection Controls */}
 {isConnected ? (
 <div className="flex items-center neo-panel backdrop-blur-xl rounded-xl border border-green-300 p-0.5">
 <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs">
 <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
 <span className="font-semibold text-blue-400">
 {connectionType === 'bluetooth' ? 'BLE 6-DOF' : 'USB 6-DOF'}
 </span>
 <span className="text-xs text-zinc-400">({packetHz}Hz)</span>
 </div>
 <button
 onClick={onDisconnect}
 className="neo-button-danger"
 >
 Disconnect
 </button>
 </div>
 ) : (
 <div className="flex items-center gap-1">
 <button
 onClick={onConnectBluetooth}
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-xs font-semibold transition active:scale-95 transition-all"
 title="Connect via Web Bluetooth Low Energy"
 >
 <Bluetooth className="w-3.5 h-3.5" />
 <span className="hidden sm:inline">Bluetooth</span>
 </button>
 <button
 onClick={onConnectSerial}
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl neo-panel backdrop-blur-xl hover:bg-slate-800 text-zinc-300 hover:text-white border border-transparent text-xs font-semibold transition"
 title="Connect via USB Serial Port"
 >
 <Usb className="w-3.5 h-3.5" />
 <span className="hidden sm:inline">USB Serial</span>
 </button>
 </div>
 )}
 </div>
 </div>

 {/* Secondary Sub-Category Bar (clean segmented sub-tabs for multi-tool sections) */}
 {['tuning', 'calibration', 'serial'].includes(activeTab) && (
 <div className="bg-[#F2F2F7]/80 backdrop-blur-2xl border-t border-[#1c2230] py-1.5 px-4">
 <div className="max-w-7xl mx-auto flex items-center gap-2">
 <span className="text-xs font-semibold text-zinc-500 mr-2 uppercase tracking-wider">
 Tuning Tools:
 </span>
 <button
 onClick={() => onSelectTab('tuning')}
 className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition ${
 activeTab === 'tuning'
 ? 'neo-panel-inset text-blue-400 font-semibold border border-blue-200'
 : 'text-zinc-400 hover:text-white'
 }`}
 >
 <Sliders className="w-3 h-3" />
 <span>Axis Curves & Deadzones</span>
 </button>
 <button
 onClick={() => onSelectTab('calibration')}
 className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition ${
 activeTab === 'calibration'
 ? 'neo-panel-inset text-blue-400 font-semibold border border-blue-200'
 : 'text-zinc-400 hover:text-white'
 }`}
 >
 <Target className="w-3 h-3" />
 <span>Sensor Calibration Wizard</span>
 </button>
 <button
 onClick={() => onSelectTab('serial')}
 className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition ${
 activeTab === 'serial'
 ? 'neo-panel-inset text-blue-400 font-semibold border border-blue-200'
 : 'text-zinc-400 hover:text-white'
 }`}
 >
 <Terminal className="w-3 h-3" />
 <span>Serial Telemetry Stream</span>
 </button>
 </div>
 </div>
 )}

 {['profiles', 'firmware'].includes(activeTab) && (
 <div className="bg-[#F2F2F7]/80 backdrop-blur-2xl border-t border-[#1c2230] py-1.5 px-4">
 <div className="max-w-7xl mx-auto flex items-center gap-2">
 <span className="text-xs font-semibold text-zinc-500 mr-2 uppercase tracking-wider">
 Profile Views:
 </span>
 <button
 onClick={() => onSelectTab('profiles')}
 className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition ${
 activeTab === 'profiles'
 ? 'neo-panel-inset text-blue-400 font-semibold border border-blue-200'
 : 'text-zinc-400 hover:text-white'
 }`}
 >
 <Layers className="w-3 h-3" />
 <span>Profile Manager & Flash Memory</span>
 </button>
 <button
 onClick={() => onSelectTab('firmware')}
 className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition ${
 activeTab === 'firmware'
 ? 'neo-panel-inset text-blue-400 font-semibold border border-blue-200'
 : 'text-zinc-400 hover:text-white'
 }`}
 >
 <FileCode className="w-3 h-3" />
 <span>C++ Firmware Code Generator</span>
 </button>
 </div>
 </div>
 )}

 {['manual', 'guide', 'ai'].includes(activeTab) && (
 <div className="bg-[#F2F2F7]/80 backdrop-blur-2xl border-t border-[#1c2230] py-1.5 px-4">
 <div className="max-w-7xl mx-auto flex items-center gap-2">
 <span className="text-xs font-semibold text-zinc-500 mr-2 uppercase tracking-wider">
 Documentation:
 </span>
 <button
 onClick={() => onSelectTab('manual')}
 className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition ${
 activeTab === 'manual'
 ? 'neo-panel-inset text-blue-400 font-semibold border border-blue-200'
 : 'text-zinc-400 hover:text-white'
 }`}
 >
 <Wrench className="w-3 h-3" />
 <span>Hardware Wiring Manual</span>
 </button>
 <button
 onClick={() => onSelectTab('guide')}
 className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition ${
 activeTab === 'guide'
 ? 'neo-panel-inset text-blue-400 font-semibold border border-blue-200'
 : 'text-zinc-400 hover:text-white'
 }`}
 >
 <BookOpen className="w-3 h-3" />
 <span>CAD Integration Guide</span>
 </button>
 <button
 onClick={() => onSelectTab('ai')}
 className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition ${
 activeTab === 'ai'
 ? 'neo-panel-inset text-blue-400 font-semibold border border-blue-200'
 : 'text-zinc-400 hover:text-white'
 }`}
 >
 <Sparkles className="w-3 h-3" />
 <span>AI Hardware Advisor</span>
 </button>
 </div>
 </div>
 )}
 </header>
 );
};
