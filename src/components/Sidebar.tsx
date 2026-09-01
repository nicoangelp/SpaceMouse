import React, { useState } from 'react';
import { ActiveTab } from './NavigationHeader';
import { Profile } from '../types';
import { ConnectionType } from '../services/hardwareConnection';
import {
 Orbit, Sliders, Keyboard, Sun, BatteryCharging, Layers,
 Target, Terminal, FileCode, Wrench, BookOpen, Sparkles,
 ChevronDown, Flame, Bluetooth, Usb, ChevronRight
} from 'lucide-react';

interface SidebarProps {
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
 packetHz: number;
 onQuickBurnNvs?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
 activeTab, onSelectTab, profiles, activeProfile, onSelectProfile,
 isConnected, connectionType, deviceName, onConnectBluetooth,
 onConnectSerial, onDisconnect, packetHz, onQuickBurnNvs
}) => {
 const [isBurning, setIsBurning] = useState(false);
 const [showAdvanced, setShowAdvanced] = useState(false);

 const handleBurnClick = async () => {
 if (onQuickBurnNvs) {
 setIsBurning(true);
 await onQuickBurnNvs();
 setTimeout(() => setIsBurning(false), 1200);
 }
 };

 const primaryNav = [
 { id: 'dashboard', label: '3D Studio', icon: Orbit },
 { id: 'buttons', label: 'Key & Axis Mapping', icon: Keyboard },
 { id: 'tuning', label: 'Axis Tuning', icon: Sliders },
 { id: 'led_ring', label: 'Lighting & Ring', icon: Sun },
 { id: 'power', label: 'Battery & Sleep', icon: BatteryCharging },
 { id: 'profiles', label: 'Profiles & Flash', icon: Layers },
 ];

 const advancedNav = [
 { id: 'calibration', label: 'Sensor Calibration', icon: Target },
 { id: 'serial', label: 'Serial Monitor', icon: Terminal },
 { id: 'firmware', label: 'Firmware Code', icon: FileCode },
 { id: 'manual', label: 'Hardware Manual', icon: Wrench },
 { id: 'guide', label: 'CAD Integration', icon: BookOpen },
 { id: 'ai', label: 'AI Advisor', icon: Sparkles },
 ];

 return (
 <aside className="w-72 flex-shrink-0 bg-[#1c1c1e] border-r border-white/5 flex flex-col h-screen sticky top-0 overflow-y-auto shadow-[4px_0_24px_rgba(0,0,0,0.5)] z-50">
 
 {/* Header & Branding */}
 <div className="p-6 pb-2">
 <h1 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2 drop-shadow-md">
 <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-400 shadow-[0_2px_10px_rgba(37,99,235,0.5),inset_0_1px_0_rgba(255,255,255,0.4)] border-t border-l border-white/30 flex items-center justify-center">
 <div className="w-2 h-2 rounded-full bg-white shadow-sm" />
 </div>
 OOFO Studio
 </h1>
 </div>

 {/* Profile Selector */}
 <div className="px-6 py-4">
 <div className="neo-panel-inset p-1.5 flex items-center relative">
 <select
 value={activeProfile.id}
 onChange={(e) => onSelectProfile(e.target.value)}
 className="w-full appearance-none bg-transparent text-xs font-semibold text-white py-2 pl-3 pr-8 focus:outline-none cursor-pointer"
 >
 {profiles.map((p) => (
 <option key={p.id} value={p.id} className="bg-[#242529] text-white">
 {p.name}
 </option>
 ))}
 </select>
 <ChevronDown className="w-4 h-4 text-zinc-500 absolute right-3 pointer-events-none" />
 </div>
 </div>

 {/* Navigation */}
 <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto pb-6">
 {primaryNav.map((item) => {
 const isActive = activeTab === item.id;
 const Icon = item.icon;
 return (
 <button
 key={item.id}
 onClick={() => onSelectTab(item.id as ActiveTab)}
 className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ease-out active:scale-95 ${
 isActive
 ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-sm'
 : 'text-zinc-400 hover:text-white hover:bg-white/5'
 }`}
 >
 <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'text-zinc-500'}`} />
 {item.label}
 </button>
 );
 })}

 {/* Advanced Accordion */}
 <div className="pt-4 pb-2">
 <button 
 onClick={() => setShowAdvanced(!showAdvanced)}
 className="w-full flex items-center justify-between px-2 text-xs font-semibold text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-wider"
 >
 <span>Advanced Utilities</span>
 <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-300 ${showAdvanced ? 'rotate-90' : ''}`} />
 </button>
 </div>

 <div className={`space-y-1.5 overflow-hidden transition-all duration-300 ${showAdvanced ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
 {advancedNav.map((item) => {
 const isActive = activeTab === item.id;
 const Icon = item.icon;
 return (
 <button
 key={item.id}
 onClick={() => onSelectTab(item.id as ActiveTab)}
 className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ease-out active:scale-95 ${
 isActive
 ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
 : 'text-zinc-500 hover:text-white hover:bg-white/5'
 }`}
 >
 <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'text-zinc-600'}`} />
 {item.label}
 </button>
 );
 })}
 </div>
 </nav>

 {/* Docked Hardware Controls */}
 <div className="p-4 bg-[#242529] border-t border-white/5 shadow-[0_-8px_24px_rgba(0,0,0,0.4)] flex flex-col gap-3">
 {onQuickBurnNvs && (
 <button
 onClick={handleBurnClick}
 disabled={isBurning || !isConnected}
 className={`neo-button-primary w-full ${!isConnected ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
 >
 <Flame className={`w-4 h-4 ${isBurning ? 'animate-bounce text-yellow-300' : 'text-white'}`} />
 {isBurning ? 'Writing NVS...' : 'Burn to Hardware'}
 </button>
 )}

 {isConnected ? (
 <div className="neo-panel-inset p-2 flex flex-col gap-2">
 <div className="flex items-center gap-2 px-2 py-1">
 <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
 <span className="text-xs font-semibold text-blue-400 flex-1">
 {connectionType === 'bluetooth' ? 'BLE Active' : 'USB Active'}
 </span>
 <span className="text-xs text-zinc-500 ">{packetHz}Hz</span>
 </div>
 <button
 onClick={onDisconnect}
 className="neo-button-danger w-full py-2 text-xs"
 >
 Disconnect
 </button>
 </div>
 ) : (
 <div className="flex flex-col gap-2">
 <button onClick={onConnectBluetooth} className="neo-button w-full text-xs py-2">
 <Bluetooth className="w-3.5 h-3.5 text-blue-400" /> Connect BLE
 </button>
 <button onClick={onConnectSerial} className="neo-button w-full text-xs py-2">
 <Usb className="w-3.5 h-3.5 text-zinc-400" /> Connect USB
 </button>
 </div>
 )}
 </div>
 </aside>
 );
};