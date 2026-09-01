import React, { useState } from 'react';
import { Profile } from '../types';
import { ConnectionType } from '../services/hardwareConnection';
import { Flame, Bluetooth, Usb, ChevronDown } from 'lucide-react';

interface TopBarProps {
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

export const TopBar: React.FC<TopBarProps> = ({
 profiles,
 activeProfile,
 onSelectProfile,
 isConnected,
 connectionType,
 deviceName,
 onConnectBluetooth,
 onConnectSerial,
 onDisconnect,
 packetHz,
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

 return (
 <header className="h-16 flex-shrink-0 flex items-center justify-between px-6 bg-[#F2F2F7]/60 backdrop-blur-xl border-b border-transparent sticky top-0 z-40">
 <div className="flex items-center gap-3">
 <div className="flex items-center bg-white shadow-sm rounded-xl border border-transparent p-1 relative min-w-[220px]">
 <select
 value={activeProfile.id}
 onChange={(e) => onSelectProfile(e.target.value)}
 className="w-full appearance-none bg-transparent text-sm font-semibold text-gray-800 py-1.5 pl-3 pr-8 focus:outline-none cursor-pointer"
 >
 {profiles.map((p) => (
 <option key={p.id} value={p.id} className="bg-white text-zinc-300">
 {p.name}
 </option>
 ))}
 </select>
 <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 pointer-events-none" />
 </div>
 
 {onQuickBurnNvs && (
 <button
 onClick={handleBurnClick}
 disabled={isBurning || !isConnected}
 className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ease-out hover:scale-[1.02] active:scale-95 ${
 !isConnected
 ? 'neo-panel-inset text-zinc-500 cursor-not-allowed opacity-60'
 : isBurning
 ? 'bg-blue-700 text-white'
 : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-500/20'
 }`}
 title="Save active profile & settings to ESP32 Flash Memory (NVS)"
 >
 <Flame className={`w-3.5 h-3.5 ${isBurning ? 'animate-bounce' : ''}`} />
 <span>{isBurning ? 'Writing NVS...' : 'Burn to NVS'}</span>
 </button>
 )}
 </div>

 <div className="flex items-center gap-3">
 {isConnected ? (
 <div className="flex items-center bg-white shadow-sm rounded-xl border border-green-200 p-1 backdrop-blur-xl">
 <div className="flex items-center gap-2 px-3 py-1.5">
 <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
 <span className="text-xs font-semibold text-blue-400">
 {connectionType === 'bluetooth' ? 'BLE 6-DOF' : 'USB 6-DOF'}
 </span>
 <span className="text-xs text-gray-500 ">({packetHz}Hz)</span>
 </div>
 <div className="w-px h-4 neo-panel-inset mx-1"></div>
 <button
 onClick={onDisconnect}
 className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-600 hover:bg-rose-500/10 rounded-lg transition-all"
 >
 Disconnect
 </button>
 </div>
 ) : (
 <div className="flex items-center gap-2">
 <button
 onClick={onConnectBluetooth}
 className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1c1c1e] hover:bg-slate-800 text-zinc-300 hover:text-white border border-[#273248] text-xs font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-95"
 >
 <Bluetooth className="w-3.5 h-3.5" />
 <span>Connect BLE</span>
 </button>
 <button
 onClick={onConnectSerial}
 className="flex items-center gap-2 px-4 py-2 rounded-xl neo-panel-inset hover:bg-slate-800 text-zinc-300 border border-transparent text-xs font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-95"
 >
 <Usb className="w-3.5 h-3.5" />
 <span>Connect USB</span>
 </button>
 </div>
 )}
 </div>
 </header>
 );
};
