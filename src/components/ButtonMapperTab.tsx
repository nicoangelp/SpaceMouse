import React, { useState } from 'react';
import { ButtonMapping, ActionType, Profile, AppTarget } from '../types';
import { Keyboard, Plus, Trash2, Edit3, Compass, Lock, RotateCcw, Zap, Sparkles, Check, PieChart, Layers } from 'lucide-react';

interface ButtonMapperTabProps {
  profile: Profile;
  buttonsPressed: boolean[];
  onUpdateButton: (buttonId: string, updated: Partial<ButtonMapping>) => void;
  onAddButton: () => void;
  onDeleteButton: (buttonId: string) => void;
}

export const ButtonMapperTab: React.FC<ButtonMapperTabProps> = ({
  profile,
  buttonsPressed,
  onUpdateButton,
  onAddButton,
  onDeleteButton,
}) => {
  const [editingBtnId, setEditingBtnId] = useState<string | null>(null);
  const [showRadialDemo, setShowRadialDemo] = useState<boolean>(false);

  const activeEditingButton = profile.buttons.find((b) => b.id === editingBtnId);

  const cadPresetActions: Record<AppTarget, Array<{ label: string; actionName: string; keys: string[] }>> = {
    fusion360: [
      { label: 'Fit View to Window', actionName: 'Fit View', keys: ['F6'] },
      { label: 'Look At Selected Face', actionName: 'Look At', keys: ['F5'] },
      { label: 'Top View (Num 7)', actionName: 'Top View', keys: ['Numpad7'] },
      { label: 'Front View (Num 1)', actionName: 'Front View', keys: ['Numpad1'] },
      { label: 'Right View (Num 3)', actionName: 'Right View', keys: ['Numpad3'] },
      { label: 'Home Isometric View', actionName: 'Home View', keys: ['Home'] },
      { label: 'Extrude Feature (E)', actionName: 'Extrude', keys: ['KeyE'] },
      { label: 'Create Sketch (S)', actionName: 'Sketch', keys: ['KeyS'] },
      { label: 'Measure Tool (I)', actionName: 'Measure', keys: ['KeyI'] },
      { label: 'Fillet (F)', actionName: 'Fillet', keys: ['KeyF'] },
      { label: 'Undo Modeling Step', actionName: 'Undo', keys: ['Control', 'KeyZ'] },
      { label: 'Redo Modeling Step', actionName: 'Redo', keys: ['Control', 'KeyY'] },
    ],
    blender: [
      { label: 'Frame Selected (Numpad .)', actionName: 'View Selected', keys: ['NumpadDecimal'] },
      { label: 'Toggle Quad View', actionName: 'Quad View', keys: ['Control', 'Alt', 'KeyQ'] },
      { label: 'Camera View (Numpad 0)', actionName: 'Camera View', keys: ['Numpad0'] },
      { label: 'Top View (7)', actionName: 'Top View', keys: ['Numpad7'] },
      { label: 'Front View (1)', actionName: 'Front View', keys: ['Numpad1'] },
      { label: 'Side View (3)', actionName: 'Side View', keys: ['Numpad3'] },
      { label: 'Wireframe Shading (Z)', actionName: 'Wireframe', keys: ['KeyZ'] },
      { label: 'Undo Stroke / Transform', actionName: 'Undo', keys: ['Control', 'KeyZ'] },
    ],
    solidworks: [
      { label: 'Zoom to Fit (F)', actionName: 'Zoom to Fit', keys: ['KeyF'] },
      { label: 'Normal To Plane (Ctrl+8)', actionName: 'Normal To', keys: ['Control', 'Digit8'] },
      { label: 'Isometric View (Ctrl+7)', actionName: 'Isometric View', keys: ['Control', 'Digit7'] },
      { label: 'Rebuild Model (Ctrl+B)', actionName: 'Rebuild', keys: ['Control', 'KeyB'] },
      { label: 'Measure Distance (M)', actionName: 'Measure', keys: ['KeyM'] },
      { label: 'Smart Dimension (D)', actionName: 'Smart Dimension', keys: ['KeyD'] },
      { label: 'Undo Sketch/Feature', actionName: 'Undo', keys: ['Control', 'KeyZ'] },
    ],
    freecad: [
      { label: 'Fit All (V, F)', actionName: 'Fit All', keys: ['KeyV', 'KeyF'] },
      { label: 'Isometric View (0)', actionName: 'Isometric', keys: ['Digit0'] },
      { label: 'Top View (2)', actionName: 'Top View', keys: ['Digit2'] },
      { label: 'Front View (1)', actionName: 'Front View', keys: ['Digit1'] },
      { label: 'Undo', actionName: 'Undo', keys: ['Control', 'KeyZ'] },
    ],
    bambu: [
      { label: 'Auto Arrange Plate (A)', actionName: 'Auto Arrange', keys: ['KeyA'] },
      { label: 'Slice Active Plate (Ctrl+R)', actionName: 'Slice Plate', keys: ['Control', 'KeyR'] },
      { label: 'Top Bed View (1)', actionName: 'Top View', keys: ['Digit1'] },
      { label: 'Scale Model (S)', actionName: 'Scale', keys: ['KeyS'] },
      { label: 'Undo Change', actionName: 'Undo', keys: ['Control', 'KeyZ'] },
    ],
    custom: [
      { label: 'Custom Shortcut Combo', actionName: 'Custom Combo', keys: ['Control', 'Shift', 'KeyA'] },
      { label: 'Escape / Deselect', actionName: 'Escape', keys: ['Escape'] },
      { label: 'Delete Selected', actionName: 'Delete', keys: ['Delete'] },
    ],
  };

  const currentCadPresets = cadPresetActions[profile.targetApp] || cadPresetActions.fusion360;

  return (
    <div className="space-y-5">
      {/* Top Bar with Add Button and Radial Demo Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#0a0d12] rounded-xl border border-[#1e2632]">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 font-mono">
            <Keyboard className="w-5 h-5 text-cyan-400" />
            <span>HARDWARE BUTTON & CAD ACTION MAPPING</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Map hardware buttons, rotary encoders, and switches on your ESP32 SpaceMouse to instant CAD macros.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRadialDemo(!showRadialDemo)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold font-mono border transition-all ${
              showRadialDemo
                ? 'bg-purple-950/80 border-purple-500 text-purple-300 glow-purple-sm'
                : 'bg-[#050608] border-[#1e2632] text-slate-300 hover:text-white hover:border-slate-700'
            }`}
          >
            <PieChart className="w-4 h-4 text-purple-400" />
            <span>RADIAL PIE MENU</span>
          </button>

          <button
            id="btn-add-button-mapping"
            onClick={onAddButton}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black text-xs font-bold font-mono shadow-md glow-cyan-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 text-black" />
            <span>ADD BUTTON / PIN</span>
          </button>
        </div>
      </div>

      {/* Radial Pie Menu Interactive Demo Overlay */}
      {showRadialDemo && (
        <div className="p-6 bg-[#06080c] rounded-xl border-2 border-purple-500/40 relative flex flex-col items-center justify-center glow-purple-sm shadow-2xl">
          <div className="text-xs font-bold text-purple-300 mb-4 flex items-center gap-2 font-mono">
            <Sparkles className="w-4 h-4" />
            <span>8-WAY RADIAL CAD QUICK MENU (HOLD BUTTON IN FUSION 360 / BLENDER)</span>
          </div>

          <div className="relative w-64 h-64 rounded-full border-2 border-purple-500/30 flex items-center justify-center bg-[#0a0d12] shadow-2xl">
            {/* Center Puck */}
            <div className="w-20 h-20 rounded-full bg-purple-900/50 border border-purple-400 flex flex-col items-center justify-center text-center p-1">
              <span className="text-[10px] font-bold text-white font-mono">CAD TOOLS</span>
              <span className="text-[9px] text-purple-300 font-mono">Move Knob</span>
            </div>

            {/* 8 Radial Nodes */}
            {[
              { label: 'Sketch (S)', angle: 0 },
              { label: 'Measure (I)', angle: 45 },
              { label: 'Fillet (F)', angle: 90 },
              { label: 'Chamfer', angle: 135 },
              { label: 'Look At', angle: 180 },
              { label: 'Fit (F6)', angle: 225 },
              { label: 'Top View', angle: 270 },
              { label: 'Extrude (E)', angle: 315 },
            ].map((node, i) => {
              const rad = (node.angle * Math.PI) / 180;
              const x = Math.sin(rad) * 96;
              const y = -Math.cos(rad) * 96;
              return (
                <button
                  key={i}
                  className="absolute px-2 py-1 rounded-md bg-[#090b0e] border border-purple-400/50 text-[10px] font-semibold text-purple-200 shadow hover:bg-purple-600 hover:text-white transition-all transform -translate-x-1/2 -translate-y-1/2 font-mono"
                  style={{
                    left: `calc(50% + ${x}px)`,
                    top: `calc(50% + ${y}px)`,
                  }}
                  onClick={() => alert(`Triggered: ${node.label}`)}
                >
                  {node.label}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setShowRadialDemo(false)}
            className="mt-4 text-xs text-slate-400 hover:text-slate-200 underline font-mono"
          >
            Close Preview
          </button>
        </div>
      )}

      {/* Button Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {profile.buttons.map((btn, index) => {
          const isPressed = buttonsPressed[index] || false;
          const isEditing = editingBtnId === btn.id;

          return (
            <div
              key={btn.id}
              className={`p-4 rounded-xl border transition-all relative ${
                isPressed
                  ? 'bg-cyan-950/80 border-cyan-400 ring-2 ring-cyan-500/50 shadow-lg scale-[1.02] glow-cyan-sm'
                  : isEditing
                  ? 'bg-[#0a0d12] border-cyan-500 ring-1 ring-cyan-500'
                  : 'bg-[#0a0d12] border-[#1e2632] hover:border-slate-700'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full glow-cyan-sm"
                    style={{ backgroundColor: btn.color || '#06b6d4' }}
                  />
                  <span className="text-xs font-bold text-slate-100 font-mono">{btn.label}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#050608] border border-[#1e2632] text-slate-300 font-mono">
                    GPIO {btn.pinNumber}
                  </span>
                  {isPressed && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold animate-pulse border border-emerald-500/40">
                      PRESSED
                    </span>
                  )}
                </div>
              </div>

              {/* Action Preview */}
              <div className="my-2 p-2.5 rounded-lg bg-[#050608] border border-[#1e2632] min-h-[52px] flex flex-col justify-center">
                <div className="text-[11px] font-bold text-cyan-400 flex items-center gap-1.5 font-mono">
                  {btn.actionType === 'cad_action' && <Compass className="w-3.5 h-3.5" />}
                  {btn.actionType === 'keyCombo' && <Keyboard className="w-3.5 h-3.5" />}
                  {btn.actionType === 'axis_lock' && <Lock className="w-3.5 h-3.5" />}
                  {btn.actionType === 'precision_mode' && <Zap className="w-3.5 h-3.5" />}
                  {btn.actionType === 'zero_tare' && <RotateCcw className="w-3.5 h-3.5" />}
                  {btn.actionType === 'radial_menu' && <PieChart className="w-3.5 h-3.5" />}
                  <span className="truncate">{btn.cadActionName || btn.label}</span>
                </div>
                {btn.keyCombo && btn.keyCombo.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {btn.keyCombo.map((k, ki) => (
                      <span
                        key={ki}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-[#111620] text-cyan-300 font-mono border border-[#1e2632]"
                      >
                        {k.replace('Key', '').replace('Digit', '').replace('Numpad', 'Num ')}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <p className="text-[11px] text-slate-400 line-clamp-2 h-8 leading-snug">{btn.description}</p>

              {/* Card Actions */}
              <div className="mt-3 pt-2.5 border-t border-[#1e2632] flex items-center justify-between">
                <button
                  onClick={() => setEditingBtnId(isEditing ? null : btn.id)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-mono font-semibold flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{isEditing ? 'Close' : 'Configure'}</span>
                </button>
                <button
                  onClick={() => onDeleteButton(btn.id)}
                  className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors"
                  title="Remove button mapping"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Modal / Drawer when Editing a button */}
      {activeEditingButton && (
        <div className="p-5 bg-[#0a0d12] rounded-xl border-2 border-cyan-500/50 shadow-2xl space-y-4 glow-cyan-sm">
          <div className="flex items-center justify-between pb-2 border-b border-[#1e2632]">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 font-mono">
              <Edit3 className="w-4 h-4 text-cyan-400" />
              <span>CONFIGURE BUTTON: {activeEditingButton.label}</span>
            </h3>
            <button
              onClick={() => setEditingBtnId(null)}
              className="text-xs px-3 py-1 rounded bg-[#050608] border border-[#1e2632] text-slate-300 hover:text-white font-mono"
            >
              Done
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Name & GPIO Pin */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 font-mono">Button Label</label>
              <input
                type="text"
                value={activeEditingButton.label}
                onChange={(e) => onUpdateButton(activeEditingButton.id, { label: e.target.value })}
                className="w-full px-3 py-1.5 bg-[#050608] border border-[#1e2632] rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 font-mono">ESP32 GPIO Pin</label>
              <input
                type="number"
                value={activeEditingButton.pinNumber}
                onChange={(e) => onUpdateButton(activeEditingButton.id, { pinNumber: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-1.5 bg-[#050608] border border-[#1e2632] rounded-lg text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 font-mono">Action Type</label>
              <select
                value={activeEditingButton.actionType}
                onChange={(e) => onUpdateButton(activeEditingButton.id, { actionType: e.target.value as ActionType })}
                className="w-full px-3 py-1.5 bg-[#050608] border border-[#1e2632] rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              >
                <option value="cad_action">CAD Preset Action</option>
                <option value="keyCombo">Custom Key Combo</option>
                <option value="battery_indicator">Battery Level Fuel Gauge (24-LEDs)</option>
                <option value="axis_lock">Toggle Axis Lock (Pan/Orbit)</option>
                <option value="precision_mode">Precision Mode (0.25x Speed)</option>
                <option value="zero_tare">Zero / Center Tare</option>
                <option value="radial_menu">8-Way Radial Quick Pie Menu</option>
              </select>
            </div>
          </div>

          {/* Preset CAD Actions Quick Picker */}
          {activeEditingButton.actionType === 'cad_action' && (
            <div className="space-y-2 pt-2">
              <label className="text-xs font-semibold text-slate-300 font-mono">
                Choose {profile.name} Built-in Action:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {currentCadPresets.map((preset, pIdx) => (
                  <button
                    key={pIdx}
                    onClick={() =>
                      onUpdateButton(activeEditingButton.id, {
                        label: preset.actionName,
                        cadActionName: preset.label,
                        keyCombo: preset.keys,
                        description: `Triggers ${preset.label} shortcut in ${profile.name}`,
                      })
                    }
                    className="p-2 text-left rounded-lg bg-[#050608] border border-[#1e2632] hover:border-cyan-500 hover:bg-[#111620] transition-all text-xs"
                  >
                    <div className="font-semibold text-slate-200 truncate font-mono">{preset.actionName}</div>
                    <div className="text-[10px] text-cyan-400 font-mono truncate">{preset.keys.join('+')}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-semibold text-slate-300 font-mono">Action Description</label>
            <input
              type="text"
              value={activeEditingButton.description}
              onChange={(e) => onUpdateButton(activeEditingButton.id, { description: e.target.value })}
              className="w-full px-3 py-1.5 bg-[#050608] border border-[#1e2632] rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
      )}
    </div>
  );
};
