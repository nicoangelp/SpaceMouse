import React, { useState, useEffect, useRef } from 'react'; 
import { Slider } from './Slider'; 
import { TooltipLabel } from './TooltipLabel';
import {
 ButtonMapping,
 ActionType,
 Profile,
 AppTarget,
 SavedCombo,
 SixDofAxesConfig,
 AxisParameters,
 AxisOutputMode,
 SixDofState,
} from '../types';
import {
 Keyboard,
 Compass,
 Lock,
 RotateCcw,
 Zap,
 Sparkles,
 Check,
 Bluetooth,
 BatteryCharging,
 Fingerprint,
 Clock,
 Layers,
 Volume2,
 VolumeX,
 Volume1,
 Play,
 SkipForward,
 SkipBack,
 Globe,
 Monitor,
 Scissors,
 Copy,
 Folder,
 X,
 Maximize2,
 Minimize2,
 Sliders,
 Edit3,
 Flame,
 MousePointer,
 Sun,
 HardDrive,
 Plus,
 Activity,
 Clipboard,
 Trash2,
 Bookmark,
 RefreshCw,
 Power,
 Eye,
 Shield,
 Save,
 ArrowUpDown,
 ArrowLeftRight,
 Move,
 RotateCw,
 Gauge,
 SlidersHorizontal,
} from 'lucide-react';

interface ButtonMapperTabProps {
 profile: Profile;
 buttonsPressed: boolean[];
 sixDofState?: SixDofState;
 onUpdateButton: (buttonId: string, updated: Partial<ButtonMapping>) => void;
 onUpdateAxis?: (axisKey: keyof SixDofAxesConfig, params: Partial<AxisParameters>) => void;
 onAddButton?: () => void;
 onDeleteButton?: (buttonId: string) => void;
}

// Preset Library Categories for Keys
type KeyPresetCategory = 'windows' | 'media' | 'web' | 'cad' | 'hardware' | 'saved_combos' | 'custom_recorder';

// Selection Target: either a Key (0-8) or an Axis (x, y, z, rx, ry, rz)
type SelectionTarget =
 | { type: 'key'; index: number }
 | { type: 'axis'; axisKey: keyof SixDofAxesConfig };

const AVAILABLE_GPIO_PINS = [4, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33, 34, 35, 36, 39];

const DEFAULT_SAVED_COMBOS: SavedCombo[] = [
 { id: 'combo-1', name: 'Snipping Tool', category: 'windows', keys: ['Win', 'Shift', 'S'], description: 'Quick regional screenshot' },
 { id: 'combo-2', name: 'Task Manager', category: 'windows', keys: ['Ctrl', 'Shift', 'Escape'], description: 'Open process manager' },
 { id: 'combo-3', name: 'Reopen Closed Tab', category: 'web', keys: ['Ctrl', 'Shift', 'T'], description: 'Restore last closed browser tab' },
 { id: 'combo-4', name: 'Duplicate Line / Mesh', category: 'custom', keys: ['Shift', 'D'], description: 'Duplicate active entity' },
 { id: 'combo-5', name: 'CAD Center Isometric', category: 'cad', keys: ['Ctrl', '7'], description: 'Snap standard isometric' },
];

export const ButtonMapperTab: React.FC<ButtonMapperTabProps> = ({
 profile,
 buttonsPressed,
 sixDofState,
 onUpdateButton,
 onUpdateAxis,
}) => {
 // Main Selection State: Key or Axis
 const [selection, setSelection] = useState<SelectionTarget>({ type: 'key', index: 0 });
 const [filterMode, setFilterMode] = useState<'all' | 'keys' | 'axes'>('all');
 
 // Key Mapping Options
 const [activeKeyCategory, setActiveKeyCategory] = useState<KeyPresetCategory>('windows');
 const [activeActionTarget, setActiveActionTarget] = useState<'tap' | 'hold'>('tap');
 
 // Custom Key Combo Recorder State (for Keys and Axes)
 const [isRecording, setIsRecording] = useState<boolean>(false);
 const [recordingTarget, setRecordingTarget] = useState<'key_tap' | 'key_hold' | 'axis_pos' | 'axis_neg'>('key_tap');
 const [recordedKeys, setRecordedKeys] = useState<string[]>([]);
 const [comboNameInput, setComboNameInput] = useState<string>('');

 // Saved Combos Library State (Local Storage)
 const [savedCombos, setSavedCombos] = useState<SavedCombo[]>(() => {
 const stored = localStorage.getItem('oofo_saved_combos');
 if (stored) {
 try {
 const parsed = JSON.parse(stored);
 if (Array.isArray(parsed) && parsed.length > 0) return parsed;
 } catch {}
 }
 return DEFAULT_SAVED_COMBOS;
 });

 useEffect(() => {
 localStorage.setItem('oofo_saved_combos', JSON.stringify(savedCombos));
 }, [savedCombos]);

 // Ensure 9-key array is always complete and accessible (Key 1 to Key 9)
 const defaultPins = [13, 12, 14, 27, 26, 25, 33, 32, 4];
 const currentButtons = profile.buttons || [];
 const normalizedButtons: ButtonMapping[] = Array.from({ length: 9 }, (_, i) => {
 const existing = currentButtons.find((b) => b.gridPosition === i || b.id === `btn-${i + 1}`) || currentButtons[i];
 if (existing) {
 return {
 ...existing,
 id: existing.id || `btn-${i + 1}`,
 gridPosition: i,
 pinNumber: existing.pinNumber ?? defaultPins[i],
 };
 }
 return {
 id: `btn-${i + 1}`,
 pinNumber: defaultPins[i] || 32 + i,
 gridPosition: i,
 label: i === 8 ? 'Next Profile' : `Key ${i + 1}`,
 actionType: i === 8 ? 'profile_cycle_next' : 'cad_action',
 keyCombo: i === 8 ? [] : ['F6'],
 cadActionName: i === 8 ? 'Switch Profile' : `Action ${i + 1}`,
 description: i === 8 ? 'Tap: Next Profile / Hold: Show Battery' : `Custom Macro Key ${i + 1}`,
 holdActionType: i === 8 ? 'battery_indicator' : 'disabled',
 color: '#06b6d4',
 };
 });

 const selectedKeyIndex = selection.type === 'key' ? selection.index : 0;
 const activeBtn = normalizedButtons[selectedKeyIndex] || normalizedButtons[0];

 // Active Axis Data
 const selectedAxisKey = selection.type === 'axis' ? selection.axisKey : 'x';
 const currentAxisConfig: AxisParameters = profile.axes[selectedAxisKey] || {
 deadzone: 8,
 sensitivity: 1.2,
 inverted: false,
 curve: 'quadratic',
 expoPower: 2.0,
 minRaw: 800,
 maxRaw: 3200,
 centerRaw: 2048,
 outputMode: 'cad_6dof',
 };

 const axisMetadata: Record<keyof SixDofAxesConfig, { label: string; short: string; desc: string; type: 'translation' | 'rotation'; icon: any }> = {
 x: { label: 'X Axis (Pan Left / Right)', short: 'X: Pan L/R', desc: 'Lateral translation horizontal tracking', type: 'translation', icon: ArrowLeftRight },
 y: { label: 'Y Axis (Pan Up / Down)', short: 'Y: Pan U/D', desc: 'Vertical / depth translation tracking', type: 'translation', icon: ArrowUpDown },
 z: { label: 'Z Axis (Zoom Push / Pull)', short: 'Z: Zoom', desc: 'Axial compression & tension camera zoom', type: 'translation', icon: Move },
 rx: { label: 'Rx Axis (Pitch Tilt Forward / Back)', short: 'Rx: Pitch', desc: 'Elevation view angle tilt', type: 'rotation', icon: RotateCw },
 ry: { label: 'Ry Axis (Roll Tilt Left / Right)', short: 'Ry: Roll', desc: 'Horizon banking angle tilt', type: 'rotation', icon: RotateCcw },
 rz: { label: 'Rz Axis (Yaw Twist Left / Right)', short: 'Rz: Twist', desc: 'Azimuth rotational twist knob', type: 'rotation', icon: RefreshCw },
 };

 // Keyboard Event Listener for live key combination recording
 useEffect(() => {
 if (!isRecording) return;

 const handleKeyDown = (e: KeyboardEvent) => {
 e.preventDefault();
 e.stopPropagation();

 const keys: string[] = [];
 if (e.ctrlKey) keys.push('Ctrl');
 if (e.shiftKey) keys.push('Shift');
 if (e.altKey) keys.push('Alt');
 if (e.metaKey) keys.push('Win');

 let keyName = e.key;
 if (['Control', 'Shift', 'Alt', 'Meta'].includes(keyName)) {
 // Modifiers recorded
 } else {
 if (keyName === ' ') keyName = 'Space';
 else if (keyName === 'ArrowUp') keyName = 'Up';
 else if (keyName === 'ArrowDown') keyName = 'Down';
 else if (keyName === 'ArrowLeft') keyName = 'Left';
 else if (keyName === 'ArrowRight') keyName = 'Right';
 else if (keyName === 'Escape') keyName = 'Esc';
 else if (keyName === 'Delete') keyName = 'Del';
 else if (keyName.length === 1) keyName = keyName.toUpperCase();

 if (!keys.includes(keyName)) {
 keys.push(keyName);
 }
 }

 setRecordedKeys(keys);
 };

 window.addEventListener('keydown', handleKeyDown, { capture: true });
 return () => {
 window.removeEventListener('keydown', handleKeyDown, { capture: true });
 };
 }, [isRecording]);

 // Apply recorded keys
 const handleSaveRecordedCombo = () => {
 if (recordedKeys.length === 0) {
 setIsRecording(false);
 return;
 }

 const labelName = comboNameInput.trim() || recordedKeys.join('+');

 if (recordingTarget === 'key_tap') {
 onUpdateButton(activeBtn.id, {
 actionType: 'keyCombo',
 keyCombo: recordedKeys,
 label: labelName,
 cadActionName: labelName,
 description: `Tap: ${labelName}`,
 });
 } else if (recordingTarget === 'key_hold') {
 onUpdateButton(activeBtn.id, {
 holdActionType: 'keyCombo',
 holdKeyCombo: recordedKeys,
 holdCadActionName: labelName,
 holdDescription: `Hold: ${labelName}`,
 });
 } else if (recordingTarget === 'axis_pos') {
 if (onUpdateAxis) {
 onUpdateAxis(selectedAxisKey, {
 positiveActionName: labelName,
 positiveKeyCombo: recordedKeys,
 });
 }
 } else if (recordingTarget === 'axis_neg') {
 if (onUpdateAxis) {
 onUpdateAxis(selectedAxisKey, {
 negativeActionName: labelName,
 negativeKeyCombo: recordedKeys,
 });
 }
 }

 if (comboNameInput.trim()) {
 const newCombo: SavedCombo = {
 id: `custom-${Date.now()}`,
 name: comboNameInput.trim(),
 category: 'custom',
 keys: recordedKeys,
 description: `Custom combo: ${recordedKeys.join('+')}`,
 };
 setSavedCombos((prev) => [newCombo, ...prev]);
 }

 setIsRecording(false);
 setComboNameInput('');
 };

 const handleStartRecording = (target: 'key_tap' | 'key_hold' | 'axis_pos' | 'axis_neg') => {
 setRecordingTarget(target);
 setRecordedKeys([]);
 setComboNameInput('');
 setIsRecording(true);
 };

 // Preset Libraries
 const WINDOWS_SHORTCUTS = [
 { label: 'Snipping Tool (Win+Shift+S)', name: 'Snipping Tool', keys: ['Win', 'Shift', 'S'], icon: Scissors },
 { label: 'Task Manager (Ctrl+Shift+Esc)', name: 'Task Manager', keys: ['Ctrl', 'Shift', 'Escape'], icon: Activity },
 { label: 'Lock PC (Win+L)', name: 'Lock PC', keys: ['Win', 'L'], icon: Lock },
 { label: 'Task View / Desktops (Win+Tab)', name: 'Task View', keys: ['Win', 'Tab'], icon: Layers },
 { label: 'Show Desktop (Win+D)', name: 'Show Desktop', keys: ['Win', 'D'], icon: Monitor },
 { label: 'File Explorer (Win+E)', name: 'File Explorer', keys: ['Win', 'E'], icon: Folder },
 { label: 'Close Active Window (Alt+F4)', name: 'Close Window', keys: ['Alt', 'F4'], icon: X },
 { label: 'Maximize Window (Win+Up)', name: 'Maximize', keys: ['Win', 'Up'], icon: Maximize2 },
 { label: 'Minimize Window (Win+Down)', name: 'Minimize', keys: ['Win', 'Down'], icon: Minimize2 },
 { label: 'Run Dialog (Win+R)', name: 'Run Dialog', keys: ['Win', 'R'], icon: Sparkles },
 { label: 'Task Switcher (Alt+Tab)', name: 'Alt+Tab', keys: ['Alt', 'Tab'], icon: Layers },
 { label: 'Screenshot (PrintScreen)', name: 'Screenshot', keys: ['PrintScreen'], icon: Scissors },
 ];

 const MEDIA_SHORTCUTS = [
 { label: 'Volume Up', name: 'Volume Up', keys: ['AudioVolumeUp'], icon: Volume2 },
 { label: 'Volume Down', name: 'Volume Down', keys: ['AudioVolumeDown'], icon: Volume1 },
 { label: 'Mute Audio', name: 'Mute Audio', keys: ['AudioVolumeMute'], icon: VolumeX },
 { label: 'Play / Pause Media', name: 'Play / Pause', keys: ['MediaPlayPause'], icon: Play },
 { label: 'Next Track', name: 'Next Track', keys: ['MediaTrackNext'], icon: SkipForward },
 { label: 'Previous Track', name: 'Previous Track', keys: ['MediaTrackPrevious'], icon: SkipBack },
 { label: 'Stop Playback', name: 'Stop Playback', keys: ['MediaStop'], icon: X },
 { label: 'Microphone Mute (Win+Alt+K)', name: 'Mic Mute', keys: ['Win', 'Alt', 'K'], icon: VolumeX },
 ];

 const WEB_SHORTCUTS = [
 { label: 'New Tab (Ctrl+T)', name: 'New Tab', keys: ['Ctrl', 'T'], icon: Globe },
 { label: 'Close Tab (Ctrl+W)', name: 'Close Tab', keys: ['Ctrl', 'W'], icon: X },
 { label: 'Reopen Closed Tab (Ctrl+Shift+T)', name: 'Reopen Tab', keys: ['Ctrl', 'Shift', 'T'], icon: RefreshCw },
 { label: 'Refresh Page (F5)', name: 'Refresh', keys: ['F5'], icon: RefreshCw },
 { label: 'Hard Refresh (Ctrl+F5)', name: 'Hard Reload', keys: ['Ctrl', 'F5'], icon: RefreshCw },
 { label: 'Back in History (Alt+Left)', name: 'History Back', keys: ['Alt', 'Left'], icon: SkipBack },
 { label: 'Forward in History (Alt+Right)', name: 'History Forward', keys: ['Alt', 'Right'], icon: SkipForward },
 { label: 'Bookmark Page (Ctrl+D)', name: 'Bookmark', keys: ['Ctrl', 'D'], icon: Bookmark },
 { label: 'Developer Tools (F12)', name: 'DevTools', keys: ['F12'], icon: Sparkles },
 { label: 'Find on Page (Ctrl+F)', name: 'Find', keys: ['Ctrl', 'F'], icon: Scissors },
 ];

 const CAD_SHORTCUTS: Record<AppTarget, Array<{ label: string; name: string; keys: string[] }>> = {
 fusion360: [
 { label: 'Fit Model to Window (F6)', name: 'Fit View', keys: ['F6'] },
 { label: 'Look At Face (F5)', name: 'Look At', keys: ['F5'] },
 { label: 'Top View (Num 7)', name: 'Top View', keys: ['Num7'] },
 { label: 'Front View (Num 1)', name: 'Front View', keys: ['Num1'] },
 { label: 'Right View (Num 3)', name: 'Right View', keys: ['Num3'] },
 { label: 'Home Isometric View', name: 'Home View', keys: ['Home'] },
 { label: 'Extrude Feature (E)', name: 'Extrude', keys: ['E'] },
 { label: 'Create Sketch (S)', name: 'Sketch', keys: ['S'] },
 { label: 'Measure Tool (I)', name: 'Measure', keys: ['I'] },
 { label: 'Fillet Edge (F)', name: 'Fillet', keys: ['F'] },
 { label: 'Undo (Ctrl+Z)', name: 'Undo', keys: ['Ctrl', 'Z'] },
 { label: 'Redo (Ctrl+Y)', name: 'Redo', keys: ['Ctrl', 'Y'] },
 ],
 blender: [
 { label: 'Frame Selected (Num .)', name: 'View Selected', keys: ['Num.'] },
 { label: 'Toggle Quad View', name: 'Quad View', keys: ['Ctrl', 'Alt', 'Q'] },
 { label: 'Active Camera View (Num 0)', name: 'Camera View', keys: ['Num0'] },
 { label: 'Top View (Num 7)', name: 'Top View', keys: ['Num7'] },
 { label: 'Front View (Num 1)', name: 'Front View', keys: ['Num1'] },
 { label: 'Side View (Num 3)', name: 'Side View', keys: ['Num3'] },
 { label: 'Wireframe Shading (Z)', name: 'Wireframe', keys: ['Z'] },
 { label: 'Solid Shading (Alt+Z)', name: 'Solid View', keys: ['Alt', 'Z'] },
 { label: 'Undo (Ctrl+Z)', name: 'Undo', keys: ['Ctrl', 'Z'] },
 { label: 'Redo (Ctrl+Shift+Z)', name: 'Redo', keys: ['Ctrl', 'Shift', 'Z'] },
 ],
 solidworks: [
 { label: 'Zoom to Fit (F)', name: 'Zoom to Fit', keys: ['F'] },
 { label: 'Normal To Plane (Ctrl+8)', name: 'Normal To', keys: ['Ctrl', '8'] },
 { label: 'Isometric View (Ctrl+7)', name: 'Isometric', keys: ['Ctrl', '7'] },
 { label: 'Rebuild Model (Ctrl+B)', name: 'Rebuild', keys: ['Ctrl', 'B'] },
 { label: 'Smart Dimension (D)', name: 'Dimension', keys: ['D'] },
 { label: 'Measure (M)', name: 'Measure', keys: ['M'] },
 { label: 'Undo (Ctrl+Z)', name: 'Undo', keys: ['Ctrl', 'Z'] },
 ],
 freecad: [
 { label: 'Fit All (V, F)', name: 'Fit All', keys: ['V', 'F'] },
 { label: 'Isometric View (0)', name: 'Isometric', keys: ['0'] },
 { label: 'Top View (2)', name: 'Top View', keys: ['2'] },
 { label: 'Front View (1)', name: 'Front View', keys: ['1'] },
 { label: 'Undo (Ctrl+Z)', name: 'Undo', keys: ['Ctrl', 'Z'] },
 ],
 bambu: [
 { label: 'Auto Arrange (A)', name: 'Auto Arrange', keys: ['A'] },
 { label: 'Slice Active Plate (Ctrl+R)', name: 'Slice Plate', keys: ['Ctrl', 'R'] },
 { label: 'Top Bed View (1)', name: 'Top Bed', keys: ['1'] },
 { label: 'Scale Model (S)', name: 'Scale', keys: ['S'] },
 { label: 'Undo (Ctrl+Z)', name: 'Undo', keys: ['Ctrl', 'Z'] },
 ],
 desktop: [
 { label: 'Task View (Win+Tab)', name: 'Task View', keys: ['Win', 'Tab'] },
 { label: 'Show Desktop (Win+D)', name: 'Show Desktop', keys: ['Win', 'D'] },
 { label: 'Snipping Tool (Win+Shift+S)', name: 'Snipping Tool', keys: ['Win', 'Shift', 'S'] },
 { label: 'Copy (Ctrl+C)', name: 'Copy', keys: ['Ctrl', 'C'] },
 { label: 'Paste (Ctrl+V)', name: 'Paste', keys: ['Ctrl', 'V'] },
 { label: 'Undo (Ctrl+Z)', name: 'Undo', keys: ['Ctrl', 'Z'] },
 ],
 custom: [
 { label: 'Custom Shortcut', name: 'Custom Combo', keys: ['Ctrl', 'Shift', 'A'] },
 { label: 'Escape / Deselect', name: 'Escape', keys: ['Escape'] },
 { label: 'Delete Selected', name: 'Delete', keys: ['Delete'] },
 { label: 'Undo (Ctrl+Z)', name: 'Undo', keys: ['Ctrl', 'Z'] },
 ],
 };

 const currentCadList = CAD_SHORTCUTS[profile.targetApp] || CAD_SHORTCUTS.fusion360;

 const HARDWARE_ACTIONS = [
 {
 actionType: 'profile_cycle_next' as ActionType,
 name: 'Switch to Next Profile (ESP32 Flash)',
 desc: 'Cycles onboard profiles with a dynamic LED color spin animation',
 icon: Layers,
 recommended: 'tap',
 },
 {
 actionType: 'battery_indicator' as ActionType,
 name: 'Battery Fuel Gauge on LED Ring',
 desc: 'Illuminates 24-LED ring in green/amber/red indicating battery charge',
 icon: BatteryCharging,
 recommended: 'hold',
 },
 {
 actionType: 'ble_pairing_mode' as ActionType,
 name: 'Bluetooth BLE Pairing Mode',
 desc: 'Forces ESP32 discoverable for 60s to connect to new devices',
 icon: Bluetooth,
 recommended: 'hold',
 },
 {
 actionType: 'zero_tare' as ActionType,
 name: 'Center Tare / Re-zero Drift',
 desc: 'Instantly recalibrates 6-axis neutral sensor equilibrium',
 icon: RotateCcw,
 recommended: 'tap',
 },
 {
 actionType: 'precision_mode' as ActionType,
 name: '0.25x Micro-Precision Mode',
 desc: 'Scales 6-DOF speed to 25% for high-accuracy precision work',
 icon: Zap,
 recommended: 'hold',
 },
 {
 actionType: 'axis_lock' as ActionType,
 name: 'Toggle Pan / Orbit Axis Lock',
 desc: 'Locks rotation or pan axes for pure 2D drafting',
 icon: Lock,
 recommended: 'tap',
 },
 {
 actionType: 'toggle_dominant_axis' as ActionType,
 name: 'Toggle Dominant Axis Isolation',
 desc: 'Isolates only the single strongest axis deflection',
 icon: Shield,
 recommended: 'tap',
 },
 {
 actionType: 'toggle_lights' as ActionType,
 name: 'Toggle LED Ring On/Off',
 desc: 'Quickly turns the 24-LED ring lighting on or off',
 icon: Sun,
 recommended: 'tap',
 },
 {
 actionType: 'cycle_brightness' as ActionType,
 name: 'Cycle LED Brightness (100% → 75% → 50% → 25% → OFF)',
 desc: 'Steps through LED ring brightness levels dynamically',
 icon: Sun,
 recommended: 'tap',
 },
 {
 actionType: 'reboot_esp32' as ActionType,
 name: 'Soft Reboot Controller (ESP32)',
 desc: 'Performs clean internal controller reset',
 icon: Power,
 recommended: 'hold',
 },
 {
 actionType: 'ble_disconnect_all' as ActionType,
 name: 'Clear Bluetooth Device Bonds',
 desc: 'Wipes bonded Bluetooth hosts for fresh pairing',
 icon: Bluetooth,
 recommended: 'hold',
 },
 ];

 // Helper to assign a preset shortcut to active button
 const handleAssignKeyShortcut = (name: string, keys: string[]) => {
 if (activeActionTarget === 'tap') {
 onUpdateButton(activeBtn.id, {
 label: name,
 cadActionName: name,
 keyCombo: keys,
 actionType: 'keyCombo',
 description: `Tap: ${name}`,
 });
 } else {
 onUpdateButton(activeBtn.id, {
 holdCadActionName: name,
 holdKeyCombo: keys,
 holdActionType: 'keyCombo',
 holdDescription: `Hold: ${name}`,
 });
 }
 };

 const handleAssignKeyHardware = (actionType: ActionType, name: string) => {
 if (activeActionTarget === 'tap') {
 onUpdateButton(activeBtn.id, {
 label: name,
 actionType,
 description: `Tap: ${name}`,
 });
 } else {
 onUpdateButton(activeBtn.id, {
 holdActionType: actionType,
 holdDescription: `Hold: ${name}`,
 });
 }
 };

 const handlePinChange = (newPin: number) => {
 onUpdateButton(activeBtn.id, {
 pinNumber: newPin,
 });
 };

 // Axis Output Modes List
 const AXIS_OUTPUT_MODES: Array<{ id: AxisOutputMode; label: string; desc: string; icon: any }> = [
 { id: 'cad_6dof', label: '3D 6-DOF CAD Navigation', desc: 'Standard 3D SpaceMouse Pan, Zoom, Orbit & Tilt', icon: Compass },
 { id: 'media_volume', label: 'Audio Volume Control', desc: '+Deflection: Volume Up / -Deflection: Volume Down', icon: Volume2 },
 { id: 'media_track', label: 'Media Track Skipping', desc: '+Deflection: Next Track / -Deflection: Prev Track', icon: SkipForward },
 { id: 'mouse_scroll', label: 'Mouse Scroll Wheel', desc: '+Deflection: Scroll Up / -Deflection: Scroll Down', icon: ArrowUpDown },
 { id: 'keystroke_repeat', label: 'Deflection Keystroke Repeater', desc: 'Continuous hotkey pulses (e.g. Zoom Ctrl+/Ctrl-, Left/Right scrub)', icon: Keyboard },
 { id: 'custom_hotkey_bidirectional', label: 'Bidirectional Custom Hotkeys', desc: 'Positive = Combo A, Negative = Combo B', icon: Sparkles },
 ];

 // Quick Axis Presets
 const handleApplyAxisPreset = (presetType: 'volume' | 'track' | 'scroll' | 'zoom_keys' | 'arrow_keys' | 'cad') => {
 if (!onUpdateAxis) return;
 if (presetType === 'volume') {
 onUpdateAxis(selectedAxisKey, {
 outputMode: 'media_volume',
 positiveActionName: 'Volume Up',
 positiveKeyCombo: ['AudioVolumeUp'],
 negativeActionName: 'Volume Down',
 negativeKeyCombo: ['AudioVolumeDown'],
 repeatRateMs: 40,
 });
 } else if (presetType === 'track') {
 onUpdateAxis(selectedAxisKey, {
 outputMode: 'media_track',
 positiveActionName: 'Next Track',
 positiveKeyCombo: ['MediaTrackNext'],
 negativeActionName: 'Previous Track',
 negativeKeyCombo: ['MediaTrackPrevious'],
 repeatRateMs: 250,
 });
 } else if (presetType === 'scroll') {
 onUpdateAxis(selectedAxisKey, {
 outputMode: 'mouse_scroll',
 positiveActionName: 'Scroll Up',
 negativeActionName: 'Scroll Down',
 repeatRateMs: 50,
 });
 } else if (presetType === 'zoom_keys') {
 onUpdateAxis(selectedAxisKey, {
 outputMode: 'keystroke_repeat',
 positiveActionName: 'Zoom In (Ctrl +)',
 positiveKeyCombo: ['Ctrl', '='],
 negativeActionName: 'Zoom Out (Ctrl -)',
 negativeKeyCombo: ['Ctrl', '-'],
 repeatRateMs: 60,
 });
 } else if (presetType === 'arrow_keys') {
 onUpdateAxis(selectedAxisKey, {
 outputMode: 'keystroke_repeat',
 positiveActionName: selectedAxisKey === 'y' ? 'Arrow Up' : 'Arrow Right',
 positiveKeyCombo: [selectedAxisKey === 'y' ? 'Up' : 'Right'],
 negativeActionName: selectedAxisKey === 'y' ? 'Arrow Down' : 'Arrow Left',
 negativeKeyCombo: [selectedAxisKey === 'y' ? 'Down' : 'Left'],
 repeatRateMs: 70,
 });
 } else if (presetType === 'cad') {
 onUpdateAxis(selectedAxisKey, {
 outputMode: 'cad_6dof',
 });
 }
 };

 return (
 <div className="space-y-6">
 {/* Top Header Card */}
 <div className="p-5 rounded-3xl neo-panel backdrop-blur-xl border border-transparent flex flex-wrap items-center justify-between gap-4">
 <div>
 <div className="flex items-center gap-2">
 <Keyboard className="w-5 h-5 text-blue-400" />
 <TooltipLabel label="OOFO One Key & 6-DOF Axis Remapper
 " tooltip="Click any of the 9 mechanical keys or 6 joystick axes to customize tap actions, hold macros, volume knobs, scroll wheels, or repeaters.
 " className="text-base font-semibold text-white tracking-tight" /></div>
 </div>

 {/* View Filter Switcher */}
 <div className="flex items-center p-1 rounded-xl neo-panel-inset border border-transparent gap-1">
 <button
 onClick={() => setFilterMode('all')}
 className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
 filterMode === 'all' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' : 'text-zinc-400 hover:text-white'
 }`}
 >
 All Controls
 </button>
 <button
 onClick={() => {
 setFilterMode('keys');
 if (selection.type !== 'key') setSelection({ type: 'key', index: 0 });
 }}
 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
 filterMode === 'keys' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' : 'text-zinc-400 hover:text-white'
 }`}
 >
 <Keyboard className="w-3.5 h-3.5" />
 <span>9 Keys</span>
 </button>
 <button
 onClick={() => {
 setFilterMode('axes');
 if (selection.type !== 'axis') setSelection({ type: 'axis', axisKey: 'x' });
 }}
 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
 filterMode === 'axes' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' : 'text-zinc-400 hover:text-white'
 }`}
 >
 <Compass className="w-3.5 h-3.5" />
 <span>6 Axes</span>
 </button>
 </div>
 </div>

 {/* Main 2-Column Section */}
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
 {/* Left Column: Interactive Hardware Visualizer (5 Cols) */}
 <div className="lg:col-span-5 space-y-4">
 <div className="p-5 rounded-3xl neo-panel backdrop-blur-xl border border-transparent flex flex-col items-center justify-center space-y-4">
 {/* Visualizer Title */}
 <div className="w-full flex items-center justify-between text-xs text-zinc-400 ">
 <span className="flex items-center gap-1.5 text-blue-400 font-semibold">
 <Flame className="w-3.5 h-3.5" />
 INTERACTIVE CONTROLLER MAP
 </span>
 <span className="text-xs text-zinc-500">Click a Key or Axis Arrow</span>
 </div>

 {/* Interactive Physical Silhouette */}
 <div className="relative w-full max-w-[360px] aspect-[4/3] neo-panel-inset rounded-2xl border border-transparent p-3 flex items-center justify-center shadow-inner overflow-hidden select-none">
 {/* Contoured Palm Body */}
 <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-[#181d2a] via-[#10141e] to-[#080a0f] border border-[#273248] shadow-2xl flex items-center justify-between p-3">
 {/* 3x3 Keypad Matrix on Left (Keys 1 to 9) */}
 <div className="w-32 h-full p-2 rounded-xl bg-[#1c1c1e] border border-[#1f2838] grid grid-cols-3 gap-1.5 shadow-inner">
 {normalizedButtons.map((btn, i) => {
 const isSelected = selection.type === 'key' && selection.index === i;
 const isPressed = buttonsPressed[i] || false;
 return (
 <button
 key={btn.id || i}
 onClick={() => setSelection({ type: 'key', index: i })}
 className={`rounded-lg text-xs font-semibold transition-all flex flex-col items-center justify-center select-none shadow-sm relative group ${
 isPressed
 ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.6)] scale-95'
 : isSelected
 ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 scale-105 z-20'
 : 'neo-panel-inset text-zinc-300 hover:bg-[#252e40] hover:text-white border border-[#273248]'
 }`}
 title={`${btn.label} (GPIO ${btn.pinNumber}) - Click to configure`}
 >
 <span className="text-xs font-semibold">{i + 1}</span>
 <span className="text-[8px] opacity-75 font-sans leading-none mt-0.5">
 {i === 8 ? 'Pro/Bat' : `P${btn.pinNumber}`}
 </span>
 </button>
 );
 })}
 </div>

 {/* 6-DOF Joystick Puck on Right with Clickable Axis Arrows */}
 <div className="relative w-44 h-44 flex items-center justify-center">
 {/* Outer Rz Yaw Twist Ring with Dual Arrows */}
 <button
 onClick={() => setSelection({ type: 'axis', axisKey: 'rz' })}
 className={`absolute inset-0 rounded-full border-2 transition-all flex items-center justify-between px-1 ${
 selection.type === 'axis' && selection.axisKey === 'rz'
 ? 'border-cyan-400 bg-blue-600/10 shadow-[0_0_15px_rgba(6,182,212,0.4)] scale-105 z-20'
 : 'border-blue-200 hover:border-cyan-400/80 hover:bg-blue-600/5'
 }`}
 title="Click to configure Axis Rz (Yaw Twist)"
 >
 <span className="text-[9px] text-blue-400 font-semibold neo-panel-inset/90 px-1 py-0.5 rounded shadow border border-blue-200 flex items-center gap-0.5">
 <RefreshCw className="w-2.5 h-2.5" /> Rz
 </span>
 <span className="text-[9px] text-blue-400 font-semibold neo-panel-inset/90 px-1 py-0.5 rounded shadow border border-blue-200">
 ↻
 </span>
 </button>

 {/* Rx Pitch Tilt Top/Bottom Arrows */}
 <div className="absolute inset-x-0 inset-y-1 flex flex-col justify-between items-center pointer-events-none z-10">
 <button
 onClick={(e) => {
 e.stopPropagation();
 setSelection({ type: 'axis', axisKey: 'rx' });
 }}
 className={`pointer-events-auto px-1.5 py-0.5 rounded-full text-[9px] font-semibold transition-all ${
 selection.type === 'axis' && selection.axisKey === 'rx'
 ? 'bg-blue-500 text-white shadow-lg scale-110'
 : 'neo-panel backdrop-blur-xl/90 border border-blue-500/40 text-blue-400 hover:bg-purple-600 hover:text-white'
 }`}
 title="Click to configure Axis Rx (Pitch Tilt Forward/Back)"
 >
 ▲ Rx Pitch
 </button>
 <button
 onClick={(e) => {
 e.stopPropagation();
 setSelection({ type: 'axis', axisKey: 'rx' });
 }}
 className={`pointer-events-auto px-1.5 py-0.5 rounded-full text-[9px] font-semibold transition-all ${
 selection.type === 'axis' && selection.axisKey === 'rx'
 ? 'bg-blue-500 text-white shadow-lg scale-110'
 : 'neo-panel backdrop-blur-xl/90 border border-blue-500/40 text-blue-400 hover:bg-purple-600 hover:text-white'
 }`}
 title="Click to configure Axis Rx (Pitch Tilt)"
 >
 ▼
 </button>
 </div>

 {/* Ry Roll Tilt Left/Right Arrows */}
 <div className="absolute inset-y-0 inset-x-1 flex justify-between items-center pointer-events-none z-10">
 <button
 onClick={(e) => {
 e.stopPropagation();
 setSelection({ type: 'axis', axisKey: 'ry' });
 }}
 className={`pointer-events-auto px-1 py-0.5 rounded text-[8px] font-semibold transition-all ${
 selection.type === 'axis' && selection.axisKey === 'ry'
 ? 'bg-indigo-500 text-white shadow-lg scale-110'
 : 'neo-panel backdrop-blur-xl/90 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-600 hover:text-white'
 }`}
 title="Click to configure Axis Ry (Roll Tilt Left/Right)"
 >
 ◀ Ry
 </button>
 <button
 onClick={(e) => {
 e.stopPropagation();
 setSelection({ type: 'axis', axisKey: 'ry' });
 }}
 className={`pointer-events-auto px-1 py-0.5 rounded text-[8px] font-semibold transition-all ${
 selection.type === 'axis' && selection.axisKey === 'ry'
 ? 'bg-indigo-500 text-white shadow-lg scale-110'
 : 'neo-panel backdrop-blur-xl/90 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-600 hover:text-white'
 }`}
 title="Click to configure Axis Ry (Roll Tilt)"
 >
 Ry ▶
 </button>
 </div>

 {/* Central Main Puck Aluminum Knob */}
 <div className="w-28 h-28 rounded-full bg-gradient-to-b from-[#1c2333] to-[#0c1018] border-2 border-slate-700 shadow-xl relative flex items-center justify-center">
 {/* Y Axis Translation Arrows (Up / Down) */}
 <button
 onClick={() => setSelection({ type: 'axis', axisKey: 'y' })}
 className={`absolute top-1.5 px-2 py-0.5 rounded text-[9px] font-semibold transition-all ${
 selection.type === 'axis' && selection.axisKey === 'y'
 ? 'bg-emerald-500 text-black shadow-md scale-110 z-20'
 : 'bg-[#F2F2F7]/80 text-blue-400 hover:bg-emerald-500 hover:text-black border border-emerald-500/30'
 }`}
 title="Click to configure Axis Y (Pan Up/Down)"
 >
 ▲ Y
 </button>
 <button
 onClick={() => setSelection({ type: 'axis', axisKey: 'y' })}
 className={`absolute bottom-1.5 px-2 py-0.5 rounded text-[9px] font-semibold transition-all ${
 selection.type === 'axis' && selection.axisKey === 'y'
 ? 'bg-emerald-500 text-black shadow-md scale-110 z-20'
 : 'bg-[#F2F2F7]/80 text-blue-400 hover:bg-emerald-500 hover:text-black border border-emerald-500/30'
 }`}
 title="Click to configure Axis Y (Pan Up/Down)"
 >
 ▼ Y
 </button>

 {/* X Axis Translation Arrows (Left / Right) */}
 <button
 onClick={() => setSelection({ type: 'axis', axisKey: 'x' })}
 className={`absolute left-1.5 px-1.5 py-0.5 rounded text-[9px] font-semibold transition-all ${
 selection.type === 'axis' && selection.axisKey === 'x'
 ? 'bg-sky-500 text-black shadow-md scale-110 z-20'
 : 'bg-[#F2F2F7]/80 text-blue-400 hover:bg-sky-500 hover:text-black border border-sky-500/30'
 }`}
 title="Click to configure Axis X (Pan Left/Right)"
 >
 ◀ X
 </button>
 <button
 onClick={() => setSelection({ type: 'axis', axisKey: 'x' })}
 className={`absolute right-1.5 px-1.5 py-0.5 rounded text-[9px] font-semibold transition-all ${
 selection.type === 'axis' && selection.axisKey === 'x'
 ? 'bg-sky-500 text-black shadow-md scale-110 z-20'
 : 'bg-[#F2F2F7]/80 text-blue-400 hover:bg-sky-500 hover:text-black border border-sky-500/30'
 }`}
 title="Click to configure Axis X (Pan Left/Right)"
 >
 X ▶
 </button>

 {/* Center Z Axis Push / Pull (Zoom) */}
 <button
 onClick={() => setSelection({ type: 'axis', axisKey: 'z' })}
 className={`w-12 h-12 rounded-full border transition-all flex flex-col items-center justify-center shadow-inner ${
 selection.type === 'axis' && selection.axisKey === 'z'
 ? 'bg-amber-500 text-black border-amber-300 shadow-amber-500/50 scale-110 z-20 font-semibold'
 : 'neo-panel backdrop-blur-xl text-blue-400 hover:bg-blue-500/20 border-amber-500/40 font-semibold'
 }`}
 title="Click to configure Axis Z (Zoom Push / Pull)"
 >
 <span className="text-xs leading-none">↕ Z</span>
 <span className="text-[7px] leading-none opacity-80 mt-0.5">ZOOM</span>
 </button>
 </div>
 </div>
 </div>
 </div>

 {/* Quick Pill Selector Bar */}
 <div className="w-full space-y-2 pt-1">
 {/* 9 Key Pills */}
 <div className="flex flex-wrap items-center gap-1 justify-center">
 <span className="text-xs text-zinc-500 mr-1">KEYS:</span>
 {normalizedButtons.map((_, i) => (
 <button
 key={i}
 onClick={() => setSelection({ type: 'key', index: i })}
 className={`px-2 py-1 rounded-md text-xs font-semibold transition ${
 selection.type === 'key' && selection.index === i
 ? 'bg-blue-600 text-black'
 : 'neo-panel-inset text-zinc-400 hover:text-white border border-transparent'
 }`}
 >
 K{i + 1}
 </button>
 ))}
 </div>

 {/* 6 Axis Pills */}
 <div className="flex flex-wrap items-center gap-1 justify-center">
 <span className="text-xs text-zinc-500 mr-1">AXES:</span>
 {(['x', 'y', 'z', 'rx', 'ry', 'rz'] as Array<keyof SixDofAxesConfig>).map((ax) => (
 <button
 key={ax}
 onClick={() => setSelection({ type: 'axis', axisKey: ax })}
 className={`px-2 py-1 rounded-md text-xs font-semibold transition ${
 selection.type === 'axis' && selection.axisKey === ax
 ? 'bg-blue-500 text-white'
 : 'neo-panel-inset text-zinc-400 hover:text-white border border-transparent'
 }`}
 >
 {axisMetadata[ax].short}
 </button>
 ))}
 </div>
 </div>

 {/* Active Selection Summary Badge Card */}
 <div className="w-full p-3 rounded-xl neo-panel-inset border border-transparent flex items-center justify-between text-xs">
 <div className="flex items-center gap-2">
 <span className="neo-button-primary">
 {selection.type === 'key' ? `${selectedKeyIndex + 1}` : selectedAxisKey.toUpperCase()}
 </span>
 <div>
 <span className="font-semibold text-white block">
 {selection.type === 'key' ? `Key ${selectedKeyIndex + 1}: ${activeBtn.label}` : axisMetadata[selectedAxisKey].label}
 </span>
 <span className="text-xs text-zinc-400 ">
 {selection.type === 'key'
 ? `GPIO ${activeBtn.pinNumber} • ${activeActionTarget === 'tap' ? 'Tap Mode' : 'Hold Mode'}`
 : `Mode: ${currentAxisConfig.outputMode || 'cad_6dof'}`}
 </span>
 </div>
 </div>

 {selection.type === 'key' && (
 <div className="flex items-center gap-1 neo-panel backdrop-blur-xl px-2 py-1 rounded-lg border border-transparent">
 <span className="text-[9px] text-zinc-400 ">PIN:</span>
 <select
 value={activeBtn.pinNumber}
 onChange={(e) => handlePinChange(parseInt(e.target.value, 10))}
 className="bg-transparent text-xs font-semibold text-blue-400 focus:outline-none cursor-pointer "
 >
 {AVAILABLE_GPIO_PINS.map((pin) => (
 <option key={pin} value={pin} className="neo-panel backdrop-blur-xl text-white">
 GPIO {pin}
 </option>
 ))}
 </select>
 </div>
 )}
 </div>
 </div>
 </div>

 {/* Right Column: Customizer Panel (7 Cols) */}
 <div className="lg:col-span-7 space-y-4">
 {/* ========================================================================= */}
 {/* VIEW A: KEY CONFIGURATOR (When Key 1-9 is selected) */}
 {/* ========================================================================= */}
 {selection.type === 'key' && (
 <div className="space-y-4">
 {/* Tap vs Hold Selector */}
 <div className="p-4 rounded-3xl neo-panel backdrop-blur-xl border border-transparent flex flex-wrap items-center justify-between gap-3">
 <div className="flex items-center gap-2">
 <Fingerprint className="w-4 h-4 text-blue-400" />
 <span className="text-xs font-semibold text-white">Configure Key {selectedKeyIndex + 1} Action:</span>
 </div>

 <div className="flex items-center p-1 rounded-xl neo-panel-inset border border-transparent gap-1">
 <button
 onClick={() => setActiveActionTarget('tap')}
 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
 activeActionTarget === 'tap'
 ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
 : 'text-zinc-400 hover:text-white'
 }`}
 >
 <Fingerprint className="w-3.5 h-3.5" />
 <span>Instant Tap</span>
 </button>
 <button
 onClick={() => setActiveActionTarget('hold')}
 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
 activeActionTarget === 'hold'
 ? 'bg-blue-500 text-white font-semibold shadow-sm'
 : 'text-zinc-400 hover:text-white'
 }`}
 >
 <Clock className="w-3.5 h-3.5" />
 <span>Hold Macro (0.8s-3s)</span>
 </button>
 </div>
 </div>

 {/* Current Key Assignment Summary Banner */}
 <div className="p-3.5 rounded-xl neo-panel-inset border border-transparent grid grid-cols-2 gap-3 text-xs">
 <div className={`p-2.5 rounded-lg border transition ${activeActionTarget === 'tap' ? 'bg-cyan-950/40 border-blue-500/60' : 'neo-panel backdrop-blur-xl border-transparent'}`}>
 <span className="text-xs text-blue-400 font-semibold uppercase flex items-center gap-1">
 <Fingerprint className="w-3 h-3" /> Current Tap Action
 </span>
 <span className="font-semibold text-white block mt-1 truncate">
 {activeBtn.label || activeBtn.cadActionName || 'Default Action'}
 </span>
 <span className="text-xs text-zinc-400 block truncate">
 {activeBtn.keyCombo && activeBtn.keyCombo.length > 0 ? activeBtn.keyCombo.join(' + ') : activeBtn.actionType}
 </span>
 </div>

 <div className={`p-2.5 rounded-lg border transition ${activeActionTarget === 'hold' ? 'bg-indigo-50 border-purple-500/60' : 'neo-panel backdrop-blur-xl border-transparent'}`}>
 <span className="text-xs text-blue-400 font-semibold uppercase flex items-center gap-1">
 <Clock className="w-3 h-3" /> Current Hold Action
 </span>
 <span className="font-semibold text-white block mt-1 truncate">
 {activeBtn.holdDescription || activeBtn.holdCadActionName || (activeBtn.holdActionType && activeBtn.holdActionType !== 'disabled' ? activeBtn.holdActionType : 'None')}
 </span>
 <span className="text-xs text-zinc-400 block truncate">
 {activeBtn.holdKeyCombo && activeBtn.holdKeyCombo.length > 0 ? activeBtn.holdKeyCombo.join(' + ') : 'Long press'}
 </span>
 </div>
 </div>

 {/* Key Preset Library Category Tabs */}
 <div className="p-1 rounded-xl neo-panel backdrop-blur-xl border border-transparent flex flex-wrap gap-1">
 {[
 { id: 'windows', label: 'Windows & OS', icon: Monitor },
 { id: 'media', label: 'Media & Audio', icon: Volume2 },
 { id: 'web', label: 'Web Browsing', icon: Globe },
 { id: 'cad', label: 'CAD & 3D Tools', icon: Compass },
 { id: 'hardware', label: 'ESP32 Hardware', icon: Flame },
 { id: 'saved_combos', label: 'Saved Combos', icon: Bookmark },
 { id: 'custom_recorder', label: 'Live Recorder', icon: Sparkles },
 ].map((tab) => {
 const Icon = tab.icon;
 const isActive = activeKeyCategory === tab.id;
 return (
 <button
 key={tab.id}
 onClick={() => setActiveKeyCategory(tab.id as KeyPresetCategory)}
 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
 isActive
 ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
 : 'text-zinc-400 hover:text-white hover:bg-slate-800'
 }`}
 >
 <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-zinc-400'}`} />
 <span>{tab.label}</span>
 </button>
 );
 })}
 </div>

 {/* Preset Cards Display */}
 {activeKeyCategory === 'windows' && (
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
 {WINDOWS_SHORTCUTS.map((item, idx) => (
 <button
 key={idx}
 onClick={() => handleAssignKeyShortcut(item.name, item.keys)}
 className="p-3 rounded-xl neo-panel backdrop-blur-xl border border-transparent hover:border-blue-300 hover:neo-panel backdrop-blur-xl text-left transition flex items-center justify-between group"
 >
 <div className="flex items-center gap-2.5">
 <div className="w-8 h-8 rounded-lg neo-panel-inset border border-transparent flex items-center justify-center text-blue-400">
 <item.icon className="w-4 h-4" />
 </div>
 <div>
 <span className="text-xs font-semibold text-white block group-hover:text-blue-400 transition">{item.name}</span>
 <span className="text-xs text-zinc-400 ">{item.keys.join(' + ')}</span>
 </div>
 </div>
 <Plus className="w-4 h-4 text-zinc-500 group-hover:text-blue-400 transition" />
 </button>
 ))}
 </div>
 )}

 {activeKeyCategory === 'media' && (
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
 {MEDIA_SHORTCUTS.map((item, idx) => (
 <button
 key={idx}
 onClick={() => handleAssignKeyShortcut(item.name, item.keys)}
 className="p-3 rounded-xl neo-panel backdrop-blur-xl border border-transparent hover:border-indigo-200 hover:neo-panel backdrop-blur-xl text-left transition flex items-center justify-between group"
 >
 <div className="flex items-center gap-2.5">
 <div className="w-8 h-8 rounded-lg neo-panel-inset border border-transparent flex items-center justify-center text-blue-400">
 <item.icon className="w-4 h-4" />
 </div>
 <div>
 <span className="text-xs font-semibold text-white block group-hover:text-blue-400 transition">{item.name}</span>
 <span className="text-xs text-zinc-400 ">{item.keys.join(' + ')}</span>
 </div>
 </div>
 <Plus className="w-4 h-4 text-zinc-500 group-hover:text-blue-400 transition" />
 </button>
 ))}
 </div>
 )}

 {activeKeyCategory === 'web' && (
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
 {WEB_SHORTCUTS.map((item, idx) => (
 <button
 key={idx}
 onClick={() => handleAssignKeyShortcut(item.name, item.keys)}
 className="p-3 rounded-xl neo-panel backdrop-blur-xl border border-transparent hover:border-green-300 hover:neo-panel backdrop-blur-xl text-left transition flex items-center justify-between group"
 >
 <div className="flex items-center gap-2.5">
 <div className="w-8 h-8 rounded-lg neo-panel-inset border border-transparent flex items-center justify-center text-blue-400">
 <item.icon className="w-4 h-4" />
 </div>
 <div>
 <span className="text-xs font-semibold text-white block group-hover:text-blue-400 transition">{item.name}</span>
 <span className="text-xs text-zinc-400 ">{item.keys.join(' + ')}</span>
 </div>
 </div>
 <Plus className="w-4 h-4 text-zinc-500 group-hover:text-blue-400 transition" />
 </button>
 ))}
 </div>
 )}

 {activeKeyCategory === 'cad' && (
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
 {currentCadList.map((item, idx) => (
 <button
 key={idx}
 onClick={() => handleAssignKeyShortcut(item.name, item.keys)}
 className="p-3 rounded-xl neo-panel backdrop-blur-xl border border-transparent hover:border-blue-300 hover:neo-panel backdrop-blur-xl text-left transition flex items-center justify-between group"
 >
 <div className="flex items-center gap-2.5">
 <div className="w-8 h-8 rounded-lg neo-panel-inset border border-transparent flex items-center justify-center text-blue-400">
 <Compass className="w-4 h-4" />
 </div>
 <div>
 <span className="text-xs font-semibold text-white block group-hover:text-blue-400 transition">{item.name}</span>
 <span className="text-xs text-zinc-400 ">{item.keys.join(' + ')}</span>
 </div>
 </div>
 <Plus className="w-4 h-4 text-zinc-500 group-hover:text-blue-400 transition" />
 </button>
 ))}
 </div>
 )}

 {activeKeyCategory === 'hardware' && (
 <div className="grid grid-cols-1 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
 {HARDWARE_ACTIONS.map((item, idx) => {
 const Icon = item.icon;
 return (
 <button
 key={idx}
 onClick={() => handleAssignKeyHardware(item.actionType, item.name)}
 className="p-3 rounded-xl neo-panel backdrop-blur-xl border border-transparent hover:border-amber-500/50 hover:neo-panel backdrop-blur-xl text-left transition flex items-center justify-between group"
 >
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-lg neo-panel-inset border border-transparent flex items-center justify-center text-blue-400">
 <Icon className="w-4 h-4" />
 </div>
 <div>
 <span className="text-xs font-semibold text-white block group-hover:text-blue-400 transition">{item.name}</span>
 <span className="text-xs text-zinc-400 block">{item.desc}</span>
 </div>
 </div>
 <span className="text-xs px-2 py-1 rounded neo-panel-inset text-zinc-400 ">
 {item.recommended === 'tap' ? 'Tap Rec.' : 'Hold Rec.'}
 </span>
 </button>
 );
 })}
 </div>
 )}

 {activeKeyCategory === 'saved_combos' && (
 <div className="space-y-3">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[320px] overflow-y-auto pr-1">
 {savedCombos.map((combo) => (
 <div
 key={combo.id}
 className="p-3 rounded-xl neo-panel backdrop-blur-xl border border-transparent flex items-center justify-between"
 >
 <div
 onClick={() => handleAssignKeyShortcut(combo.name, combo.keys)}
 className="cursor-pointer flex-1"
 >
 <span className="text-xs font-semibold text-white hover:text-blue-400 transition block">{combo.name}</span>
 <span className="text-xs text-zinc-400 ">{combo.keys.join(' + ')}</span>
 </div>
 <button
 onClick={() => setSavedCombos((prev) => prev.filter((c) => c.id !== combo.id))}
 className="neo-button-danger"
 title="Delete combo"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </div>
 ))}
 </div>
 </div>
 )}

 {activeKeyCategory === 'custom_recorder' && (
 <div className="p-5 rounded-3xl neo-panel backdrop-blur-xl border border-transparent space-y-4">
 <div className="flex items-center justify-between">
 <span className="text-xs font-semibold text-white flex items-center gap-2">
 <Sparkles className="w-4 h-4 text-blue-400" />
 Live Keyboard Hotkey Capture
 </span>
 <span className="text-xs text-zinc-400 ">
 Target: {activeActionTarget === 'tap' ? 'Instant Tap' : 'Hold Macro'}
 </span>
 </div>

 <div className="p-4 rounded-xl neo-panel-inset border border-transparent flex flex-col items-center justify-center space-y-3">
 <div className="flex items-center gap-2 min-h-[36px]">
 {recordedKeys.length > 0 ? (
 recordedKeys.map((k, idx) => (
 <span key={idx} className="neo-button-primary">
 {k}
 </span>
 ))
 ) : (
 <span className="text-xs text-zinc-500 italic">
 {isRecording ? 'Listening for physical keypresses...' : 'Click Record and press any key combination'}
 </span>
 )}
 </div>

 <div className="flex items-center gap-2">
 {!isRecording ? (
 <button
 onClick={() => handleStartRecording(activeActionTarget === 'tap' ? 'key_tap' : 'key_hold')}
 className="neo-button-primary"
 >
 Start Recording Keys
 </button>
 ) : (
 <button
 onClick={() => setIsRecording(false)}
 className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs shadow-md transition animate-pulse"
 >
 Stop Recording
 </button>
 )}
 </div>
 </div>

 <div className="flex items-center gap-2">
 <input
 type="text"
 placeholder="Combo name (e.g. Snipping Tool)..."
 value={comboNameInput}
 onChange={(e) => setComboNameInput(e.target.value)}
 className="flex-1 px-3 py-2 rounded-xl neo-panel-inset border border-transparent text-xs text-white focus:outline-none focus:border-blue-500"
 />
 <button
 onClick={handleSaveRecordedCombo}
 disabled={recordedKeys.length === 0}
 className="px-4 py-2 rounded-xl bg-emerald-500 disabled:opacity-40 hover:bg-emerald-400 text-black font-semibold text-xs shadow transition flex items-center gap-1.5 active:scale-95 transition-all"
 >
 <Save className="w-3.5 h-3.5" />
 <span>Apply to Key {selectedKeyIndex + 1}</span>
 </button>
 </div>
 </div>
 )}

 {/* Disable Button */}
 <div className="flex items-center justify-end pt-2">
 <button
 onClick={() => {
 if (activeActionTarget === 'tap') {
 onUpdateButton(activeBtn.id, {
 label: `Key ${selectedKeyIndex + 1}`,
 actionType: 'disabled',
 keyCombo: [],
 description: 'Disabled',
 });
 } else {
 onUpdateButton(activeBtn.id, {
 holdActionType: 'disabled',
 holdKeyCombo: [],
 holdDescription: 'Disabled',
 });
 }
 }}
 className="neo-button-danger"
 >
 <X className="w-3.5 h-3.5" />
 <span>Disable {activeActionTarget === 'tap' ? 'Tap' : 'Hold'} Action</span>
 </button>
 </div>
 </div>
 )}

 {/* ========================================================================= */}
 {/* VIEW B: AXIS OUTPUT MAPPER (When X, Y, Z, Rx, Ry, Rz is selected) */}
 {/* ========================================================================= */}
 {selection.type === 'axis' && (
 <div className="space-y-4">
 {/* Selected Axis Banner & Quick Presets */}
 <div className="p-4 rounded-3xl neo-panel backdrop-blur-xl border border-transparent space-y-3">
 <div className="flex flex-wrap items-center justify-between gap-2">
 <div className="flex items-center gap-2">
 <Compass className="w-5 h-5 text-blue-400" />
 <div>
 <h3 className="text-sm font-semibold text-white">
 {axisMetadata[selectedAxisKey].label}
 </h3>
 <p className="hidden text-xs text-zinc-400">
 {axisMetadata[selectedAxisKey].desc}
 </p>
 </div>
 </div>

 {/* Mode Badge */}
 <span className="text-xs px-2.5 py-1 rounded-full bg-purple-950/80 border border-blue-500/40 text-blue-400 font-semibold ">
 Mode: {currentAxisConfig.outputMode || 'cad_6dof'}
 </span>
 </div>

 {/* Quick Axis Preset Pills */}
 <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-transparent">
 <span className="text-xs text-zinc-500 ">QUICK PRESETS:</span>
 <button
 onClick={() => handleApplyAxisPreset('volume')}
 className="px-2.5 py-1 rounded-lg neo-panel-inset hover:bg-purple-950/60 text-blue-400 hover:text-white text-xs font-medium border border-blue-500/30 flex items-center gap-1 transition"
 >
 <Volume2 className="w-3 h-3" /> Volume Knob
 </button>
 <button
 onClick={() => handleApplyAxisPreset('track')}
 className="px-2.5 py-1 rounded-lg neo-panel-inset hover:bg-purple-950/60 text-blue-400 hover:text-white text-xs font-medium border border-blue-500/30 flex items-center gap-1 transition"
 >
 <SkipForward className="w-3 h-3" /> Media Track
 </button>
 <button
 onClick={() => handleApplyAxisPreset('scroll')}
 className="px-2.5 py-1 rounded-lg neo-panel-inset hover:bg-cyan-950/60 text-blue-400 hover:text-white text-xs font-medium border border-blue-200 flex items-center gap-1 transition"
 >
 <ArrowUpDown className="w-3 h-3" /> Scroll Wheel
 </button>
 <button
 onClick={() => handleApplyAxisPreset('zoom_keys')}
 className="px-2.5 py-1 rounded-lg neo-panel-inset hover:bg-amber-950/60 text-blue-400 hover:text-white text-xs font-medium border border-amber-500/30 flex items-center gap-1 transition"
 >
 <Keyboard className="w-3 h-3" /> Zoom Ctrl+/-
 </button>
 <button
 onClick={() => handleApplyAxisPreset('cad')}
 className="px-2.5 py-1 rounded-lg neo-panel-inset hover:bg-cyan-950/60 text-zinc-300 hover:text-white text-xs font-medium border border-slate-700 flex items-center gap-1 transition"
 >
 <RotateCcw className="w-3 h-3" /> 3D CAD Orbit
 </button>
 </div>
 </div>

 {/* Axis Output Mode Selection Cards */}
 <div className="space-y-2">
 <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wide flex items-center gap-1.5">
 <Sliders className="w-3.5 h-3.5 text-blue-400" />
 Select Output Mode for {selectedAxisKey.toUpperCase()} Axis:
 </span>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
 {AXIS_OUTPUT_MODES.map((mode) => {
 const Icon = mode.icon;
 const isSelected = (currentAxisConfig.outputMode || 'cad_6dof') === mode.id;
 return (
 <button
 key={mode.id}
 onClick={() => onUpdateAxis && onUpdateAxis(selectedAxisKey, { outputMode: mode.id })}
 className={`p-3 rounded-xl border text-left transition flex items-start gap-3 ${
 isSelected
 ? 'bg-purple-950/50 border-blue-400 shadow-md ring-1 ring-purple-400/50'
 : 'neo-panel backdrop-blur-xl border-transparent hover:border-transparent hover:neo-panel backdrop-blur-xl'
 }`}
 >
 <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
 isSelected ? 'bg-blue-500 text-white' : 'neo-panel-inset text-zinc-400 border border-transparent'
 }`}>
 <Icon className="w-4 h-4" />
 </div>
 <div className="flex-1">
 <span className={`text-xs font-semibold block ${isSelected ? 'text-white' : 'text-zinc-200'}`}>
 {mode.label}
 </span>
 <span className="text-xs text-zinc-400 block mt-0.5 leading-tight">
 {mode.desc}
 </span>
 </div>
 </button>
 );
 })}
 </div>
 </div>

 {/* Custom Hotkey / Keystroke Repeater Detail Card */}
 {['keystroke_repeat', 'custom_hotkey_bidirectional', 'media_volume', 'media_track'].includes(currentAxisConfig.outputMode || '') && (
 <div className="p-4 rounded-3xl neo-panel backdrop-blur-xl border border-transparent space-y-4">
 <span className="text-xs font-semibold text-white flex items-center gap-2">
 <Keyboard className="w-4 h-4 text-blue-400" />
 Bidirectional Deflection Actions (+ / -)
 </span>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 {/* Positive Deflection */}
 <div className="p-3 rounded-xl neo-panel-inset border border-transparent space-y-2">
 <span className="text-xs text-blue-400 font-semibold uppercase flex items-center gap-1">
 ▲ Positive Deflection (+)
 </span>
 <input
 type="text"
 value={currentAxisConfig.positiveActionName || ''}
 onChange={(e) => onUpdateAxis && onUpdateAxis(selectedAxisKey, { positiveActionName: e.target.value })}
 placeholder="Action name (e.g. Volume Up)..."
 className="w-full px-2.5 py-1.5 rounded-lg neo-panel backdrop-blur-xl border border-transparent text-xs text-white focus:outline-none focus:border-emerald-500"
 />
 <div className="flex items-center justify-between pt-1">
 <span className="text-xs text-zinc-400 ">
 Keys: {currentAxisConfig.positiveKeyCombo?.join(' + ') || 'None'}
 </span>
 <button
 onClick={() => handleStartRecording('axis_pos')}
 className="px-2 py-1 rounded bg-blue-500/20 hover:bg-emerald-500 text-blue-400 hover:text-black text-xs font-semibold transition "
 >
 Record Keys
 </button>
 </div>
 </div>

 {/* Negative Deflection */}
 <div className="p-3 rounded-xl neo-panel-inset border border-transparent space-y-2">
 <span className="text-xs text-red-600 font-semibold uppercase flex items-center gap-1">
 ▼ Negative Deflection (-)
 </span>
 <input
 type="text"
 value={currentAxisConfig.negativeActionName || ''}
 onChange={(e) => onUpdateAxis && onUpdateAxis(selectedAxisKey, { negativeActionName: e.target.value })}
 placeholder="Action name (e.g. Volume Down)..."
 className="w-full px-2.5 py-1.5 rounded-lg neo-panel backdrop-blur-xl border border-transparent text-xs text-white focus:outline-none focus:border-rose-500"
 />
 <div className="flex items-center justify-between pt-1">
 <span className="text-xs text-zinc-400 ">
 Keys: {currentAxisConfig.negativeKeyCombo?.join(' + ') || 'None'}
 </span>
 <button
 onClick={() => handleStartRecording('axis_neg')}
 className="neo-button-danger"
 >
 Record Keys
 </button>
 </div>
 </div>
 </div>

 {/* Repeat Pulse Rate Slider */}
 <div className="space-y-2 pt-2 border-t border-transparent">
 <div className="flex items-center justify-between text-xs">
 <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
 <Clock className="w-3.5 h-3.5 text-blue-400" />
 Deflection Keystroke Repeat Interval:
 </span>
 <span className=" text-blue-400 font-semibold">
 {currentAxisConfig.repeatRateMs || 50} ms
 </span>
 </div>

 <Slider  
 min="20"
 max="400"
 step="5"
 value={currentAxisConfig.repeatRateMs || 50}
 onChange={(e) => onUpdateAxis && onUpdateAxis(selectedAxisKey, { repeatRateMs: parseInt(e.target.value, 10) })}
 className="w-full h-1 neo-panel-inset rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-500 transition-all duration-300 hover:scale-[1.02] active:scale-95"
 />

 <div className="flex items-center gap-2 justify-end text-xs">
 <button
 onClick={() => onUpdateAxis && onUpdateAxis(selectedAxisKey, { repeatRateMs: 35 })}
 className="px-2 py-0.5 rounded neo-panel-inset text-zinc-400 hover:text-blue-400 "
 >
 ⚡ 35ms (Rapid)
 </button>
 <button
 onClick={() => onUpdateAxis && onUpdateAxis(selectedAxisKey, { repeatRateMs: 80 })}
 className="px-2 py-0.5 rounded neo-panel-inset text-zinc-400 hover:text-blue-400 "
 >
 ⚖️ 80ms (Balanced)
 </button>
 <button
 onClick={() => onUpdateAxis && onUpdateAxis(selectedAxisKey, { repeatRateMs: 200 })}
 className="px-2 py-0.5 rounded neo-panel-inset text-zinc-400 hover:text-blue-400 "
 >
 🐢 200ms (Smooth)
 </button>
 </div>
 </div>
 </div>
 )}

 {/* Axis Tuning & Sensitivity Parameters */}
 <div className="p-4 rounded-3xl neo-panel backdrop-blur-xl border border-transparent space-y-4">
 <span className="text-xs font-semibold text-white flex items-center gap-2">
 <SlidersHorizontal className="w-4 h-4 text-blue-400" />
 Axis Kinematics & Direction
 </span>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
 {/* Invert Direction */}
 <div className="p-3 rounded-xl neo-panel-inset border border-transparent flex items-center justify-between">
 <div>
 <span className="font-semibold text-white block">Invert Axis Direction</span>
 <span className="text-xs text-zinc-400">Swap positive and negative deflection</span>
 </div>
 <button
 onClick={() => onUpdateAxis && onUpdateAxis(selectedAxisKey, { inverted: !currentAxisConfig.inverted })}
 className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
 currentAxisConfig.inverted ? 'bg-blue-500' : 'bg-[#1c1c1e] border border-white/10'
 }`}
 >
 <div className={`w-5 h-5 rounded-full neo-panel transition-transform ${
 currentAxisConfig.inverted ? 'translate-x-6' : 'translate-x-0'
 }`} />
 </button>
 </div>

 {/* Deadzone */}
 <div className="p-3 rounded-xl neo-panel-inset border border-transparent space-y-1.5">
 <div className="flex items-center justify-between">
 <span className="font-semibold text-white">Deadzone</span>
 <span className=" text-blue-400 font-semibold">{currentAxisConfig.deadzone}%</span>
 </div>
 <Slider  
 min="1"
 max="35"
 value={currentAxisConfig.deadzone}
 onChange={(e) => onUpdateAxis && onUpdateAxis(selectedAxisKey, { deadzone: parseInt(e.target.value, 10) })}
 className="w-full h-1 neo-panel-inset rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-500 transition-all duration-300 hover:scale-[1.02] active:scale-95"
 />
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 </div>
 </div>
 );
};
