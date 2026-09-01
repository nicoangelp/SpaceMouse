import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Bot, User, RefreshCw, Cpu, Wrench, Lightbulb, Check, Copy, Trash2, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Profile } from '../types';

interface AiAssistantTabProps {
 profile: Profile;
}

export const AiAssistantTab: React.FC<AiAssistantTabProps> = ({ profile }) => {
 const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; source?: string }>>([
 {
 role: 'assistant',
 text: `Hello! I am your **OOFO One 6-DOF Hardware & CAD Engineer Copilot**.

I can assist you with:
- **Sensor Wiring & ADC Setup:** Connecting 6x Linear Hall effect sensors (SS49E / AH49E) to ESP32 ADC1 pins.
- **6-DOF Kinematics & Calibration:** Computing $6 \\times 6$ cross-talk decoupling matrices and response curves.
- **ESP32 Firmware & Communication:** Modifying Web Bluetooth, Web Serial, TinyUSB HID descriptors, and NVS flash routines.
- **CAD Navigation & Macros:** Hotkeys and workflow macros for **${profile.targetApp}**, Fusion 360, Blender 4/5, SolidWorks, and FreeCAD.
- **Battery & Power Management:** Dynamic Light Sleep, Deep Sleep, and EXT1 keypad wake-ups.

Select a quick topic below or type your technical question!`,
 },
 ]);

 const [input, setInput] = useState<string>('');
 const [loading, setLoading] = useState<boolean>(false);
 const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
 const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
 const messagesEndRef = useRef<HTMLDivElement | null>(null);

 useEffect(() => {
 // Check server health to see if Gemini API key is configured
 fetch('/api/health')
 .then((res) => res.json())
 .then((data) => setHasApiKey(Boolean(data.hasGemini)))
 .catch(() => setHasApiKey(false));
 }, []);

 useEffect(() => {
 messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
 }, [messages, loading]);

 const sampleQuestions = [
 { label: 'Hall Sensor Wiring', query: 'How do I wire 6x SS49E Hall sensors to ESP32 ADC1 pins?' },
 { label: '6-DOF Decoupling Math', query: 'How do I calculate the 6-DOF decoupling matrix to eliminate cross-talk?' },
 { label: `${profile.targetApp} Macros`, query: `What are the best 9-key keypad macros for ${profile.targetApp}?` },
 { label: 'ADC Noise & EMA Filter', query: 'How to eliminate analog ADC noise and thermal drift on ESP32?' },
 { label: 'Battery & Deep Sleep', query: 'How does the ESP32 manage battery power and EXT1 pin wake up?' },
 ];

 const handleSend = async (queryText?: string) => {
 const textToSend = queryText || input;
 if (!textToSend.trim() || loading) return;

 const userMsg = { role: 'user' as const, text: textToSend };
 setMessages((prev) => [...prev, userMsg]);
 if (!queryText) setInput('');
 setLoading(true);

 try {
 const res = await fetch('/api/gemini/assist', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 prompt: textToSend,
 context: {
 activeProfile: profile.name,
 targetApp: profile.targetApp,
 axes: {
 x: profile.axes.x,
 y: profile.axes.y,
 z: profile.axes.z,
 rx: profile.axes.rx,
 ry: profile.axes.ry,
 rz: profile.axes.rz,
 },
 buttons: profile.buttons.map((b) => ({
 id: b.id,
 label: b.label,
 pin: b.pinNumber,
 action: b.cadActionName,
 tapKeyCombo: b.keyCombo,
 holdKeyCombo: b.holdKeyCombo,
 })),
 filters: profile.filters,
 },
 }),
 });

 const data = await res.json();
 const reply = data.reply || 'Sorry, I could not process your request.';
 setMessages((prev) => [...prev, { role: 'assistant', text: reply, source: data.source }]);
 } catch (err: any) {
 setMessages((prev) => [
 ...prev,
 { role: 'assistant', text: `Failed to connect to AI assistant: ${err.message}` },
 ]);
 } finally {
 setLoading(false);
 }
 };

 const handleCopy = (text: string, index: number) => {
 navigator.clipboard.writeText(text);
 setCopiedIndex(index);
 setTimeout(() => setCopiedIndex(null), 2000);
 };

 const handleClear = () => {
 setMessages([
 {
 role: 'assistant',
 text: 'Chat history cleared. How can I assist with your 6-DOF hardware or firmware setup?',
 },
 ]);
 };

 return (
 <div className="space-y-4">
 {/* Header */}
 <div className="p-4 bg-[#0a0d12] rounded-xl border border-[#1e2632] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
 <div>
 <div className="flex items-center gap-2">
 <Sparkles className="w-5 h-5 text-blue-400" />
 <h2 className="text-base font-semibold text-white tracking-wide">
 AI SPACEMOUSE HARDWARE & CAD ADVISOR
 </h2>
 <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-blue-500/40 text-xs text-blue-400 flex items-center gap-1">
 <Zap className="w-2.5 h-2.5" />
 {hasApiKey ? 'Gemini 3.7 Flash Active' : 'Embedded Knowledge Engine'}
 </span>
 </div>
 <p className="text-xs text-zinc-400 mt-1 ">
 Get instant engineering advice on ESP32 sensor wiring, ADC calibration, 6-DOF cross-talk matrices, and CAD hotkey mapping.
 </p>
 </div>

 <button
 onClick={handleClear}
 title="Clear Conversation"
 className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-[#141a23] border border-[#1e2632] hover:border-transparent text-xs text-zinc-400 hover:text-zinc-200 transition-all flex items-center gap-1.5 active:scale-95 transition-all"
 >
 <Trash2 className="w-3.5 h-3.5" />
 <span>Clear Chat</span>
 </button>
 </div>

 {/* Suggested Quick Questions */}
 <div className="flex flex-wrap gap-2">
 {sampleQuestions.map((q, i) => (
 <button
 key={i}
 onClick={() => handleSend(q.query)}
 disabled={loading}
 className="px-3 py-1.5 rounded-lg bg-[#0a0d12] border border-[#1e2632] hover:border-blue-300 hover:bg-[#101620] text-xs text-zinc-300 transition-all text-left flex items-center gap-1.5 disabled:opacity-50"
 >
 <Lightbulb className="w-3 h-3 text-blue-400 shrink-0" />
 <span>{q.label}</span>
 </button>
 ))}
 </div>

 {/* Chat Messages */}
 <div className="h-[480px] bg-[#050608] rounded-xl border border-[#1e2632] p-4 overflow-y-auto space-y-4 shadow-inner">
 {messages.map((m, i) => (
 <div
 key={i}
 className={`flex gap-3 text-xs leading-relaxed ${
 m.role === 'user' ? 'justify-end' : 'justify-start'
 }`}
 >
 {m.role === 'assistant' && (
 <div className="w-7 h-7 rounded-lg bg-cyan-950/80 border border-blue-300 flex items-center justify-center text-blue-400 flex-shrink-0 mt-0.5">
 <Bot className="w-4 h-4" />
 </div>
 )}

 <div
 className={`p-4 rounded-xl max-w-[90%] select-text relative group ${
 m.role === 'user'
 ? 'bg-blue-700 text-black font-semibold rounded-br-none shadow-md'
 : 'bg-[#0a0d12] text-zinc-200 border border-[#1e2632] rounded-bl-none'
 }`}
 >
 {m.role === 'assistant' ? (
 <div className="markdown-body text-xs space-y-2 leading-relaxed text-zinc-200">
 <ReactMarkdown>{m.text}</ReactMarkdown>
 </div>
 ) : (
 <div className="whitespace-pre-wrap">{m.text}</div>
 )}

 {m.role === 'assistant' && (
 <button
 onClick={() => handleCopy(m.text, i)}
 title="Copy Response"
 className="absolute top-2 right-2 p-1.5 rounded bg-[#141a23] border border-[#1e2632] text-zinc-400 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
 >
 {copiedIndex === i ? <Check className="w-3 h-3 text-blue-400" /> : <Copy className="w-3 h-3" />}
 </button>
 )}
 </div>

 {m.role === 'user' && (
 <div className="w-7 h-7 rounded-lg bg-cyan-950/80 border border-blue-500/40 flex items-center justify-center text-blue-400 flex-shrink-0 mt-0.5">
 <User className="w-4 h-4" />
 </div>
 )}
 </div>
 ))}

 {loading && (
 <div className="flex gap-3 text-xs justify-start">
 <div className="w-7 h-7 rounded-lg bg-cyan-950/80 border border-blue-300 flex items-center justify-center text-blue-400 flex-shrink-0">
 <Bot className="w-4 h-4" />
 </div>
 <div className="p-3.5 rounded-xl bg-[#0a0d12] border border-[#1e2632] text-zinc-400 flex items-center gap-2 ">
 <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
 <span>Analyzing embedded architecture & generating solution...</span>
 </div>
 </div>
 )}
 <div ref={messagesEndRef} />
 </div>

 {/* Input Box */}
 <form
 onSubmit={(e) => {
 e.preventDefault();
 handleSend();
 }}
 className="flex gap-2 "
 >
 <input
 type="text"
 placeholder="Ask anything about ESP32 wiring, ADC calibration, CAD macros, or C++ firmware..."
 value={input}
 onChange={(e) => setInput(e.target.value)}
 className="flex-1 px-4 py-2.5 bg-[#050608] border border-[#1e2632] rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 "
 />
 <button
 type="submit"
 disabled={loading || !input.trim()}
 className="neo-button-primary"
 >
 <Send className="w-3.5 h-3.5 text-black" />
 <span>ASK AI</span>
 </button>
 </form>
 </div>
 );
};
