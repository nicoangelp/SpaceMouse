import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Send, Trash2, Download, Activity, Zap, Play, Square } from 'lucide-react';

interface SerialMonitorTabProps {
 logs: Array<{ text: string; type: 'rx' | 'tx' | 'info' | 'error'; timestamp: number }>;
 isConnected: boolean;
 currentHz: number;
 onSendCommand: (cmd: string) => void;
 onClearLogs: () => void;
}

export const SerialMonitorTab: React.FC<SerialMonitorTabProps> = ({
 logs,
 isConnected,
 currentHz,
 onSendCommand,
 onClearLogs,
}) => {
 const [inputCmd, setInputCmd] = useState<string>('');
 const [autoScroll, setAutoScroll] = useState<boolean>(true);
 const logEndRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
 if (autoScroll && logEndRef.current) {
 logEndRef.current.scrollIntoView({ behavior: 'smooth' });
 }
 }, [logs, autoScroll]);

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 if (!inputCmd.trim()) return;
 onSendCommand(inputCmd.trim());
 setInputCmd('');
 };

 const handleExportLogs = () => {
 const text = logs
 .map((l) => `[${new Date(l.timestamp).toLocaleTimeString()}] [${l.type.toUpperCase()}] ${l.text}`)
 .join('\n');
 const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
 const url = URL.createObjectURL(blob);
 const link = document.createElement('a');
 link.href = url;
 link.download = `oofo_one_serial_log_${Date.now()}.txt`;
 link.click();
 URL.revokeObjectURL(url);
 };

 return (
 <div className="space-y-4">
 {/* Top Header */}
 <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#0a0d12] rounded-xl border border-[#1e2632]">
 <div className="flex items-center gap-3">
 <div className="p-2 rounded-lg bg-[#050608] border border-[#1e2632] text-blue-400 glow-cyan-sm">
 <Terminal className="w-5 h-5" />
 </div>
 <div>
 <h2 className="text-base font-semibold text-white flex items-center gap-2 ">
 <span>SERIAL MONITOR & PACKET INSPECTOR</span>
 <span
 className={`text-[9px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
 isConnected
 ? 'bg-emerald-950/80 text-blue-400 border border-green-300 glow-emerald-sm'
 : 'bg-rose-950/80 text-red-600 border border-red-300'
 }`}
 >
 {isConnected ? 'PORT OPEN' : 'DISCONNECTED'}
 </span>
 </h2>
 <div className="text-xs text-zinc-400 mt-0.5 flex items-center gap-3 ">
 <span>Streaming telemetry & ASCII command interface.</span>
 <span className="text-blue-400 font-semibold flex items-center gap-1">
 <Activity className="w-3.5 h-3.5" />
 <span>{currentHz} Hz</span>
 </span>
 </div>
 </div>
 </div>

 <div className="flex items-center gap-2">
 <button
 onClick={() => setAutoScroll(!autoScroll)}
 className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
 autoScroll
 ? 'bg-cyan-950/80 border-blue-500 text-blue-400 glow-cyan-sm'
 : 'bg-[#050608] border-[#1e2632] text-zinc-400'
 }`}
 >
 AUTO-SCROLL: {autoScroll ? 'ON' : 'OFF'}
 </button>
 <button
 onClick={handleExportLogs}
 className="p-2 rounded-lg bg-[#050608] hover:border-slate-700 text-zinc-300 hover:text-white border border-[#1e2632] transition-all active:scale-95 transition-all"
 title="Export Logs"
 >
 <Download className="w-4 h-4 text-blue-400" />
 </button>
 <button
 onClick={onClearLogs}
 className="neo-button-danger"
 title="Clear Console"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </div>

 {/* Quick Serial Commands Bar */}
 <div className="flex flex-wrap items-center gap-2 p-3 bg-[#0a0d12] rounded-xl border border-[#1e2632] text-xs ">
 <span className="text-zinc-400 font-semibold">QUICK MACROS:</span>
 <button
 onClick={() => onSendCommand('CAL_ZERO')}
 className="px-2.5 py-1 rounded bg-[#050608] border border-[#1e2632] hover:border-blue-500 hover:text-blue-400 text-zinc-300 transition-colors"
 >
 CAL_ZERO
 </button>
 <button
 onClick={() => onSendCommand('GET_CONFIG')}
 className="px-2.5 py-1 rounded bg-[#050608] border border-[#1e2632] hover:border-blue-500 hover:text-blue-400 text-zinc-300 transition-colors"
 >
 GET_CONFIG
 </button>
 <button
 onClick={() => onSendCommand('SAVE_EEPROM')}
 className="px-2.5 py-1 rounded bg-[#050608] border border-[#1e2632] hover:border-blue-500 hover:text-blue-400 text-zinc-300 transition-colors"
 >
 SAVE_EEPROM
 </button>
 <button
 onClick={() => onSendCommand('SET_ALPHA:0.35')}
 className="px-2.5 py-1 rounded bg-[#050608] border border-[#1e2632] hover:border-blue-500 hover:text-blue-400 text-zinc-300 transition-colors"
 >
 SET_ALPHA:0.35
 </button>
 <button
 onClick={() => onSendCommand('STATUS')}
 className="px-2.5 py-1 rounded bg-[#050608] border border-[#1e2632] hover:border-blue-500 hover:text-blue-400 text-zinc-300 transition-colors"
 >
 STATUS
 </button>
 </div>

 {/* Terminal Viewport */}
 <div className="h-96 bg-[#050608] rounded-xl border border-[#1e2632] p-4 text-xs overflow-y-auto space-y-1 select-text shadow-inner">
 {logs.length === 0 ? (
 <div className="text-zinc-500 italic py-8 text-center ">
 No serial data received yet. Click "Connect Serial" in top bar to open WebSerial port.
 </div>
 ) : (
 logs.map((log, i) => {
 const timeStr = new Date(log.timestamp).toLocaleTimeString();
 let color = 'text-zinc-300';
 if (log.type === 'tx') color = 'text-blue-400 font-semibold';
 if (log.type === 'rx') color = 'text-zinc-300';
 if (log.type === 'info') color = 'text-blue-400';
 if (log.type === 'error') color = 'text-red-600 font-semibold';

 return (
 <div key={i} className="leading-relaxed flex items-start gap-2">
 <span className="text-zinc-500 select-none text-xs min-w-[60px] ">{timeStr}</span>
 <span className={color}>{log.text}</span>
 </div>
 );
 })
 )}
 <div ref={logEndRef} />
 </div>

 {/* Command Input Box */}
 <form onSubmit={handleSubmit} className="flex gap-2 ">
 <input
 type="text"
 placeholder="Send custom serial command (e.g. CAL_ZERO, SET_ALPHA:0.25, PING)..."
 value={inputCmd}
 onChange={(e) => setInputCmd(e.target.value)}
 className="flex-1 px-4 py-2.5 bg-[#050608] border border-[#1e2632] rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500"
 />
 <button
 type="submit"
 disabled={!isConnected && !inputCmd.trim()}
 className="neo-button-primary"
 >
 <Send className="w-3.5 h-3.5 text-black" />
 <span>SEND</span>
 </button>
 </form>
 </div>
 );
};
