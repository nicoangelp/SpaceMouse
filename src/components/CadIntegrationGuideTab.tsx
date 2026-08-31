import React, { useState } from 'react';
import { generateFusion360AddinPython } from '../data/firmwareTemplates';
import { BookOpen, Copy, Check, ExternalLink, HelpCircle, CheckCircle2, Wrench, ShieldAlert } from 'lucide-react';

export const CadIntegrationGuideTab: React.FC = () => {
  const [copiedPython, setCopiedPython] = useState<boolean>(false);
  const pythonScript = generateFusion360AddinPython();

  const handleCopy = () => {
    navigator.clipboard.writeText(pythonScript);
    setCopiedPython(true);
    setTimeout(() => setCopiedPython(false), 2000);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="p-4 bg-[#0a0d12] rounded-xl border border-[#1e2632]">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 font-mono">
          <BookOpen className="w-5 h-5 text-cyan-400" />
          <span>CAD INTEGRATION & AUTODESK FUSION 360 SETUP</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5 font-mono">
          Comprehensive guide to linking your ESP32 DIY SpaceMouse with Autodesk Fusion 360, Blender, SolidWorks, and FreeCAD.
        </p>
      </div>

      {/* 3 Main Integration Approaches */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Method 1: Native USB HID */}
        <div className="p-5 rounded-xl bg-[#0a0d12] border border-[#1e2632] space-y-3 shadow-xl">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs font-mono">
            <span className="w-5 h-5 rounded-full bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-[10px] glow-cyan-sm">
              1
            </span>
            <span>NATIVE USB HID (RECOMMENDED)</span>
          </div>
          <h3 className="text-sm font-bold text-white font-mono">ESP32-S2 / ESP32-S3 Direct Plug & Play</h3>
          <p className="text-xs text-slate-400 leading-relaxed font-mono">
            Uses standard 3Dconnexion Multi-Axis Controller HID report descriptors. Recognized natively by Fusion 360, Blender, and SolidWorks with zero third-party drivers or background software required.
          </p>
          <div className="p-2.5 rounded-lg bg-[#050608] border border-[#1e2632] text-[11px] text-cyan-400 font-mono font-medium">
            ✓ 0ms latency, true 1000Hz USB polling rate.
          </div>
        </div>

        {/* Method 2: Fusion 360 Python Add-In */}
        <div className="p-5 rounded-xl bg-[#0a0d12] border border-[#1e2632] space-y-3 shadow-xl">
          <div className="flex items-center gap-2 text-purple-400 font-bold text-xs font-mono">
            <span className="w-5 h-5 rounded-full bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-[10px] glow-purple-sm">
              2
            </span>
            <span>FUSION 360 PYTHON ADD-IN</span>
          </div>
          <h3 className="text-sm font-bold text-white font-mono">Direct COM Port Serial Reader</h3>
          <p className="text-xs text-slate-400 leading-relaxed font-mono">
            If using an older ESP32-WROOM or Arduino Nano over USB-UART serial, install the lightweight Fusion 360 Python Add-in below to stream 6-DOF camera transforms directly into Fusion’s active viewport.
          </p>
          <div className="p-2.5 rounded-lg bg-[#050608] border border-[#1e2632] text-[11px] text-purple-300 font-mono font-medium">
            ✓ Works on any microcontroller with USB serial.
          </div>
        </div>

        {/* Method 3: Blender NDOF Native */}
        <div className="p-5 rounded-xl bg-[#0a0d12] border border-[#1e2632] space-y-3 shadow-xl">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs font-mono">
            <span className="w-5 h-5 rounded-full bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-[10px]">
              3
            </span>
            <span>BLENDER NDOF SETTINGS</span>
          </div>
          <h3 className="text-sm font-bold text-white font-mono">Built-in 3D Mouse Support</h3>
          <p className="text-xs text-slate-400 leading-relaxed font-mono">
            In Blender, navigate to <strong>Edit &gt; Preferences &gt; Input &gt; NDOF</strong>. Select <em>Free Camera Navigation</em> or <em>Orbit Around Selection</em> for buttery smooth CAD navigation.
          </p>
          <div className="p-2.5 rounded-lg bg-[#050608] border border-[#1e2632] text-[11px] text-amber-300 font-mono font-medium">
            ✓ Full support for turntable & trackball modes.
          </div>
        </div>
      </div>

      {/* Fusion 360 Add-in Python Script Viewer */}
      <div className="bg-[#06080c] rounded-xl border border-[#1e2632] overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 bg-[#0a0d12] border-b border-[#1e2632]">
          <div className="text-xs font-bold text-slate-200 font-mono">
            AUTODESK FUSION 360 COMPANION ADD-IN (PYTHON SCRIPT)
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#050608] hover:border-slate-700 text-slate-200 text-xs font-bold font-mono border border-[#1e2632] transition-all"
          >
            {copiedPython ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">COPIED PYTHON!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-cyan-400" />
                <span>COPY SCRIPT</span>
              </>
            )}
          </button>
        </div>

        <div className="p-4 max-h-72 overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed bg-[#050608] select-text">
          <pre>{pythonScript}</pre>
        </div>

        <div className="p-4 bg-[#0a0d12] border-t border-[#1e2632] text-xs text-slate-400 font-mono">
          <strong className="text-slate-200">How to install in Fusion 360:</strong> Press <kbd className="px-1.5 py-0.5 bg-[#050608] border border-[#1e2632] rounded text-cyan-300">Shift + S</kbd> in Fusion 360 &gt; Go to <strong>Add-Ins</strong> tab &gt; Click <strong>Create New</strong> &gt; Select Python &gt; Paste this script &gt; Click <strong>Run</strong>.
        </div>
      </div>

      {/* Troubleshooting FAQ */}
      <div className="p-5 bg-[#0a0d12] rounded-xl border border-[#1e2632] space-y-4 shadow-xl">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 font-mono">
          <Wrench className="w-4 h-4 text-cyan-400" />
          <span>HARDWARE & CAD TROUBLESHOOTING TIPS</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300 font-mono">
          <div className="p-3.5 rounded-lg bg-[#050608] border border-[#1e2632] space-y-1.5">
            <h4 className="font-semibold text-white flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Camera drifting when not touching knob?</span>
            </h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Analog Hall sensors (SS49E) have minor thermal drift. Go to the <strong>Sensor Calibration</strong> tab and click <em>Capture Zero Tare</em>, or increase the deadzone in <strong>Axis Tuning</strong> to 8-10%.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-[#050608] border border-[#1e2632] space-y-1.5">
            <h4 className="font-semibold text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Zoom direction feels backwards?</span>
            </h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              In CAD software, pulling up on the puck can either zoom in (camera moves closer) or zoom out (magnifying whole model). Toggle the <strong>Invert Axis</strong> checkbox on Axis Z in the Tuning tab!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
