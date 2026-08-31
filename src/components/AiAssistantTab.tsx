import React, { useState } from 'react';
import { Sparkles, Send, Bot, User, RefreshCw, Cpu, Wrench, Lightbulb, Check } from 'lucide-react';
import { Profile } from '../types';

interface AiAssistantTabProps {
  profile: Profile;
}

export const AiAssistantTab: React.FC<AiAssistantTabProps> = ({ profile }) => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: `Hello! I am your **DIY SpaceMouse & Embedded CAD Engineer Assistant**.

I can help you with:
- Wiring and selecting Hall effect sensors (SS49E / AH49E), joysticks, or magnetic encoders.
- Decoupling matrices and filtering algorithms (EMA, Kalman filters) to eliminate 6-DOF cross-talk.
- Writing custom C++ firmware routines for ESP32-S3, ESP32-S2, TinyUSB, and BLE Gamepad.
- Creating specialized CAD hotkey macros and Python scripts for Autodesk Fusion 360, Blender, and SolidWorks.

How can I help with your DIY SpaceMouse project today?`,
    },
  ]);

  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const sampleQuestions = [
    'How do I wire 6x SS49E Hall sensors to ESP32-S3?',
    'How do I calculate the 6-DOF decoupling matrix to eliminate magnetic cross-talk?',
    'What are the best Fusion 360 macros for fast sketching and 3D modeling?',
    'How to eliminate analog ADC noise and thermal drift on ESP32?',
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
            buttons: profile.buttons.map((b) => ({ label: b.label, pin: b.pinNumber, action: b.cadActionName })),
          },
        }),
      });

      const data = await res.json();
      const reply = data.reply || 'Sorry, I could not process your request.';
      setMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: `Failed to connect to AI assistant: ${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-4 bg-[#0a0d12] rounded-xl border border-[#1e2632] flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 font-mono">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <span>AI SPACEMOUSE HARDWARE & CAD COPILOT</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Ask technical questions on ESP32 firmware, 6-DOF kinematics, Hall effect sensor arrays, and Fusion 360 workflows.
          </p>
        </div>
      </div>

      {/* Suggested Quick Questions */}
      <div className="flex flex-wrap gap-2">
        {sampleQuestions.map((q, i) => (
          <button
            key={i}
            onClick={() => handleSend(q)}
            className="px-3 py-1.5 rounded-lg bg-[#0a0d12] border border-[#1e2632] hover:border-cyan-500/50 hover:bg-[#050608] text-xs text-slate-300 transition-all text-left flex items-center gap-1.5 font-mono"
          >
            <Lightbulb className="w-3 h-3 text-cyan-400" />
            <span>{q}</span>
          </button>
        ))}
      </div>

      {/* Chat Messages */}
      <div className="h-[420px] bg-[#050608] rounded-xl border border-[#1e2632] p-4 overflow-y-auto space-y-4 shadow-inner">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex gap-3 text-xs leading-relaxed ${
              m.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {m.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-300 flex-shrink-0 mt-0.5 glow-cyan-sm">
                <Bot className="w-4 h-4" />
              </div>
            )}
            <div
              className={`p-3.5 rounded-xl max-w-[85%] select-text font-mono ${
                m.role === 'user'
                  ? 'bg-cyan-600 text-black font-bold rounded-br-none shadow-md glow-cyan-sm'
                  : 'bg-[#0a0d12] text-slate-200 border border-[#1e2632] rounded-bl-none'
              }`}
            >
              <div className="whitespace-pre-wrap">{m.text}</div>
            </div>
            {m.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-300 flex-shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 text-xs justify-start">
            <div className="w-7 h-7 rounded-lg bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-300 flex-shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-xl bg-[#0a0d12] border border-[#1e2632] text-slate-400 flex items-center gap-2 font-mono">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              <span>Analyzing embedded architecture & generating solution...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex gap-2 font-mono"
      >
        <input
          type="text"
          placeholder="Ask anything about ESP32 wiring, ADC calibration, CAD macros, or C++ firmware..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 px-4 py-2.5 bg-[#050608] border border-[#1e2632] rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-black text-xs font-bold font-mono shadow-md glow-cyan-sm flex items-center gap-1.5 active:scale-95 transition-all"
        >
          <Send className="w-3.5 h-3.5 text-black" />
          <span>ASK AI</span>
        </button>
      </form>
    </div>
  );
};
