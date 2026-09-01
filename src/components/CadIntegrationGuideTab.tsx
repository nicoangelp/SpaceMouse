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
 <h2 className="text-base font-semibold text-white flex items-center gap-2 ">
 <BookOpen className="w-5 h-5 text-blue-400" />
 <span>CAD INTEGRATION & AUTODESK FUSION 360 SETUP</span>
 </h2>
 <p className="text-xs text-zinc-400 mt-0.5 ">
 Comprehensive guide to linking your ESP32 DIY SpaceMouse with Autodesk Fusion 360, Blender, SolidWorks, and FreeCAD.
 </p>
 </div>

 {/* 3 Main Integration Approaches */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 {/* Method 1: Native USB HID */}
 <div className="p-5 rounded-xl bg-[#0a0d12] border border-[#1e2632] space-y-3 shadow-xl">
 <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs ">
 <span className="w-5 h-5 rounded-full bg-cyan-950/80 border border-blue-500/40 flex items-center justify-center text-xs glow-cyan-sm">
 1
 </span>
 <span>NATIVE USB HID (RECOMMENDED)</span>
 </div>
 <h3 className="text-sm font-semibold text-white ">ESP32-S2 / ESP32-S3 Direct Plug & Play</h3>
 <p className="text-xs text-zinc-400 leading-relaxed ">
 Uses standard 3Dconnexion Multi-Axis Controller HID report descriptors. Recognized natively by Fusion 360, Blender, and SolidWorks with zero third-party drivers or background software required.
 </p>
 <div className="p-2.5 rounded-lg bg-[#050608] border border-[#1e2632] text-xs text-blue-400 font-medium">
 ✓ 0ms latency, true 1000Hz USB polling rate.
 </div>
 </div>

 {/* Method 2: Fusion 360 Python Add-In */}
 <div className="p-5 rounded-xl bg-[#0a0d12] border border-[#1e2632] space-y-3 shadow-xl">
 <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs ">
 <span className="w-5 h-5 rounded-full bg-purple-950/80 border border-blue-500/40 flex items-center justify-center text-xs glow-purple-sm">
 2
 </span>
 <span>FUSION 360 PYTHON ADD-IN</span>
 </div>
 <h3 className="text-sm font-semibold text-white ">Direct COM Port Serial Reader</h3>
 <p className="text-xs text-zinc-400 leading-relaxed ">
 If using an older ESP32-WROOM or Arduino Nano over USB-UART serial, install the lightweight Fusion 360 Python Add-in below to stream 6-DOF camera transforms directly into Fusion’s active viewport.
 </p>
 <div className="p-2.5 rounded-lg bg-[#050608] border border-[#1e2632] text-xs text-blue-400 font-medium">
 ✓ Works on any microcontroller with USB serial.
 </div>
 </div>

 {/* Method 3: Blender NDOF Native */}
 <div className="p-5 rounded-xl bg-[#0a0d12] border border-[#1e2632] space-y-3 shadow-xl">
 <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs ">
 <span className="w-5 h-5 rounded-full bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-xs">
 3
 </span>
 <span>BLENDER NDOF SETTINGS</span>
 </div>
 <h3 className="text-sm font-semibold text-white ">Built-in 3D Mouse Support</h3>
 <p className="text-xs text-zinc-400 leading-relaxed ">
 In Blender, navigate to <strong>Edit &gt; Preferences &gt; Input &gt; NDOF</strong>. Select <em>Free Camera Navigation</em> or <em>Orbit Around Selection</em> for buttery smooth CAD navigation.
 </p>
 <div className="p-2.5 rounded-lg bg-[#050608] border border-[#1e2632] text-xs text-blue-400 font-medium">
 ✓ Full support for turntable & trackball modes.
 </div>
 </div>
 </div>

 {/* Fusion 360 Add-in Python Script Viewer */}
 <div className="bg-[#06080c] rounded-xl border border-[#1e2632] overflow-hidden shadow-xl">
 <div className="flex items-center justify-between px-4 py-3 bg-[#0a0d12] border-b border-[#1e2632]">
 <div className="text-xs font-semibold text-zinc-200 ">
 AUTODESK FUSION 360 COMPANION ADD-IN (PYTHON SCRIPT)
 </div>
 <button
 onClick={handleCopy}
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#050608] hover:border-slate-700 text-zinc-200 text-xs font-semibold border border-[#1e2632] transition-all active:scale-95 transition-all"
 >
 {copiedPython ? (
 <>
 <Check className="w-3.5 h-3.5 text-blue-400" />
 <span className="text-blue-400">COPIED PYTHON!</span>
 </>
 ) : (
 <>
 <Copy className="w-3.5 h-3.5 text-blue-400" />
 <span>COPY SCRIPT</span>
 </>
 )}
 </button>
 </div>

 <div className="p-4 max-h-72 overflow-y-auto text-xs text-zinc-300 leading-relaxed bg-[#050608] select-text">
 <pre>{pythonScript}</pre>
 </div>

 <div className="p-4 bg-[#0a0d12] border-t border-[#1e2632] text-xs text-zinc-400 ">
 <strong className="text-zinc-200">How to install in Fusion 360:</strong> Press <kbd className="px-1.5 py-0.5 bg-[#050608] border border-[#1e2632] rounded text-blue-400">Shift + S</kbd> in Fusion 360 &gt; Go to <strong>Add-Ins</strong> tab &gt; Click <strong>Create New</strong> &gt; Select Python &gt; Paste this script &gt; Click <strong>Run</strong>.
 </div>
 </div>

 {/* Troubleshooting FAQ */}
 <div className="p-5 bg-[#0a0d12] rounded-xl border border-[#1e2632] space-y-4 shadow-xl">
 <h3 className="text-sm font-semibold text-white flex items-center gap-2 ">
 <Wrench className="w-4 h-4 text-blue-400" />
 <span>HARDWARE & CAD TROUBLESHOOTING TIPS</span>
 </h3>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-zinc-300 ">
 <div className="p-3.5 rounded-lg bg-[#050608] border border-[#1e2632] space-y-1.5">
 <h4 className="font-semibold text-white flex items-center gap-1.5">
 <ShieldAlert className="w-4 h-4 text-blue-400" />
 <span>Camera drifting when not touching knob?</span>
 </h4>
 <p className="text-zinc-400 text-xs leading-relaxed">
 Analog Hall sensors (SS49E) have minor thermal drift. Go to the <strong>Sensor Calibration</strong> tab and click <em>Capture Zero Tare</em>, or increase the deadzone in <strong>Axis Tuning</strong> to 8-10%.
 </p>
 </div>

 <div className="p-3.5 rounded-lg bg-[#050608] border border-[#1e2632] space-y-1.5">
 <h4 className="font-semibold text-white flex items-center gap-1.5">
 <CheckCircle2 className="w-4 h-4 text-blue-400" />
 <span>Zoom direction feels backwards?</span>
 </h4>
 <p className="text-zinc-400 text-xs leading-relaxed">
 In CAD software, pulling up on the puck can either zoom in (camera moves closer) or zoom out (magnifying whole model). Toggle the <strong>Invert Axis</strong> checkbox on Axis Z in the Tuning tab!
 </p>
 </div>
 </div>
 </div>
 </div>
 );
};
