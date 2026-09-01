import React, { useState, useRef } from 'react';
import {
 Profile,
 AxisParameters,
 GlobalFilterConfig,
 LedRingConfig,
 PowerManagementConfig,
} from '../types';
import {
 defaultProfiles,
 createDefaultLedRing,
 createDefaultPowerManagement,
} from '../data/defaultProfiles';
import { hardwareConnection } from '../services/hardwareConnection';
import {
 Layers,
 Plus,
 Copy,
 Trash2,
 Edit2,
 Check,
 X,
 Flame,
 Download,
 Upload,
 Cpu,
 Sparkles,
 Bluetooth,
 Usb,
 Shield,
 CheckCircle,
 AlertCircle,
 RefreshCw,
 Box,
 Sliders,
} from 'lucide-react';

interface ProfileManagerModalProps {
 isOpen: boolean;
 onClose: () => void;
 profiles: Profile[];
 activeProfileId: string;
 onSelectProfile: (id: string) => void;
 onAddProfile: (newProfile: Profile) => void;
 onUpdateProfile: (updatedProfile: Profile) => void;
 onDeleteProfile: (id: string) => void;
 onImportProfiles: (importedProfiles: Profile[]) => void;
 onBurnAllProfiles?: () => Promise<boolean>;
}

const CAD_PRESET_TEMPLATES = [
 { id: 'fusion360', name: 'Autodesk Fusion 360', targetApp: 'fusion360', color: '#ff8800' },
 { id: 'blender', name: 'Blender 4.x / 3D DCC', targetApp: 'blender', color: '#e87d0d' },
 { id: 'solidworks', name: 'Dassault SolidWorks', targetApp: 'solidworks', color: '#e60000' },
 { id: 'freecad', name: 'FreeCAD Parametric 3D', targetApp: 'freecad', color: '#cb171e' },
 { id: 'bambu', name: 'Bambu Studio / OrcaSlicer', targetApp: 'bambu', color: '#00ae42' },
 { id: 'desktop', name: 'Desktop & Media Hotkeys', targetApp: 'desktop', color: '#00e5ff' },
 { id: 'unreal', name: 'Unreal Engine 5 Editor', targetApp: 'unreal', color: '#0e70ff' },
 { id: 'maya', name: 'Autodesk Maya', targetApp: 'maya', color: '#00d084' },
 { id: 'rhino', name: 'Rhino 3D / Grasshopper', targetApp: 'rhino', color: '#00c389' },
 { id: 'onshape', name: 'OnShape Cloud CAD', targetApp: 'onshape', color: '#1773eb' },
 { id: 'custom', name: 'Custom Universal 6-DOF', targetApp: 'custom', color: '#a855f7' },
];

export const ProfileManagerModal: React.FC<ProfileManagerModalProps> = ({
 isOpen,
 onClose,
 profiles,
 activeProfileId,
 onSelectProfile,
 onAddProfile,
 onUpdateProfile,
 onDeleteProfile,
 onImportProfiles,
 onBurnAllProfiles,
}) => {
 const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
 const [newProfileName, setNewProfileName] = useState<string>('');
 const [selectedTemplate, setSelectedTemplate] = useState<string>('fusion360');
 const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
 const [editNameValue, setEditNameValue] = useState<string>('');
 
 // NVS Burning State
 const [isBurningNvs, setIsBurningNvs] = useState<boolean>(false);
 const [burnStatus, setBurnStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
 const [burnProgress, setBurnProgress] = useState<number>(0);
 const [burnStepText, setBurnStepText] = useState<string>('');

 const fileInputRef = useRef<HTMLInputElement>(null);

 if (!isOpen) return null;

 const MAX_PROFILES_LIMIT = 16;
 const isMaxProfilesReached = profiles.length >= MAX_PROFILES_LIMIT;
 const activeProfile = profiles.find((p) => p.id === activeProfileId) || profiles[0];

 // Handle Add Profile
 const handleCreateProfile = (e: React.FormEvent) => {
 e.preventDefault();
 if (!newProfileName.trim()) return;
 if (isMaxProfilesReached) {
 alert(`Maximum capacity reached: ESP32 hardware supports up to ${MAX_PROFILES_LIMIT} dynamic profiles.`);
 return;
 }

 const template = CAD_PRESET_TEMPLATES.find((t) => t.id === selectedTemplate) || CAD_PRESET_TEMPLATES[0];
 const baseTemplateProfile = defaultProfiles.find((p) => p.targetApp === template.targetApp) || defaultProfiles[0];

 const newProfile: Profile = {
 ...JSON.parse(JSON.stringify(baseTemplateProfile)),
 id: `profile-${Date.now()}`,
 name: newProfileName.trim(),
 targetApp: template.targetApp as any,
 ledColor: template.color,
 ledRing: createDefaultLedRing(template.color),
 powerManagement: createDefaultPowerManagement(),
 };

 onAddProfile(newProfile);
 onSelectProfile(newProfile.id);
 setNewProfileName('');
 setIsCreatingNew(false);

 if (hardwareConnection.isConnected) {
 hardwareConnection.setProfileCount(Math.min(profiles.length + 1, MAX_PROFILES_LIMIT));
 }

 setBurnStatus({
 type: 'success',
 message: `Created profile "${newProfile.name}" (Slot #${profiles.length + 1}). Flash to ESP32 to make it permanent!`,
 });
 };

 // Handle Duplicate Profile
 const handleDuplicateProfile = (sourceProfile: Profile) => {
 if (isMaxProfilesReached) {
 alert(`Maximum capacity reached: ESP32 hardware supports up to ${MAX_PROFILES_LIMIT} dynamic profiles.`);
 return;
 }
 const cloned: Profile = {
 ...JSON.parse(JSON.stringify(sourceProfile)),
 id: `profile-${Date.now()}`,
 name: `${sourceProfile.name} (Copy)`,
 };
 onAddProfile(cloned);
 onSelectProfile(cloned.id);

 if (hardwareConnection.isConnected) {
 hardwareConnection.setProfileCount(Math.min(profiles.length + 1, MAX_PROFILES_LIMIT));
 }

 setBurnStatus({
 type: 'success',
 message: `Duplicated into "${cloned.name}".`,
 });
 };

 // Handle Delete Profile
 const handleDelete = (profileToDelete: Profile) => {
 if (profiles.length <= 1) {
 alert('You must have at least one profile in your studio.');
 return;
 }
 if (confirm(`Are you sure you want to delete profile "${profileToDelete.name}"?`)) {
 onDeleteProfile(profileToDelete.id);
 if (activeProfileId === profileToDelete.id) {
 const remaining = profiles.filter((p) => p.id !== profileToDelete.id);
 if (remaining[0]) onSelectProfile(remaining[0].id);
 }
 if (hardwareConnection.isConnected) {
 hardwareConnection.setProfileCount(Math.max(profiles.length - 1, 1));
 }
 }
 };

 // Handle Rename Save
 const handleSaveRename = (profile: Profile) => {
 if (!editNameValue.trim()) {
 setEditingProfileId(null);
 return;
 }
 onUpdateProfile({
 ...profile,
 name: editNameValue.trim(),
 });
 setEditingProfileId(null);
 };

 // Handle Burn Single Active Profile to ESP32 Flash (NVS)
 const handleBurnToEsp32Nvs = async (targetProfile: Profile, profileIndex?: number) => {
 if (!hardwareConnection.isConnected) {
 setBurnStatus({
 type: 'error',
 message: 'ESP32 not connected! Please connect via Bluetooth or USB Serial before burning.',
 });
 return;
 }

 setIsBurningNvs(true);
 setBurnStatus(null);
 setBurnProgress(20);
 setBurnStepText(`Flashing "${targetProfile.name}" into ESP32 NVS...`);

 try {
 const targetIdx = typeof profileIndex === 'number' ? profileIndex : profiles.findIndex((p) => p.id === targetProfile.id);
 const slot = targetIdx >= 0 ? targetIdx : 0;
 setBurnProgress(50);
 const success = await hardwareConnection.burnProfileToNVS(targetProfile, slot, Math.min(profiles.length, MAX_PROFILES_LIMIT));
 setBurnProgress(100);

 if (success) {
 setBurnStatus({
 type: 'success',
 message: `🔥 Permanent Flash Complete! "${targetProfile.name}" (Slot #${slot}) is saved in ESP32 Flash memory.`,
 });
 } else {
 setBurnStatus({
 type: 'error',
 message: 'Failed to write to ESP32 NVS memory. Please check connection and try again.',
 });
 }
 } catch (err: any) {
 setBurnStatus({
 type: 'error',
 message: err.message || 'Error during NVS flash write.',
 });
 } finally {
 setIsBurningNvs(false);
 setBurnStepText('');
 }
 };

 // Handle Full Batch Sync: Burn All 1..16 Profiles to ESP32 NVS
 const handleBurnAllToEsp32Nvs = async () => {
 if (!hardwareConnection.isConnected) {
 setBurnStatus({
 type: 'error',
 message: 'ESP32 not connected! Please connect via Bluetooth or USB Serial before burning.',
 });
 return;
 }

 setIsBurningNvs(true);
 setBurnStatus(null);
 setBurnProgress(5);

 try {
 const success = await hardwareConnection.burnAllProfilesToNVS(
 profiles,
 activeProfileId,
 (percent, stepText) => {
 setBurnProgress(percent);
 setBurnStepText(stepText);
 }
 );

 if (success) {
 setBurnStatus({
 type: 'success',
 message: `🔥 Full Sync Complete! All ${Math.min(profiles.length, MAX_PROFILES_LIMIT)} profiles are permanently written to ESP32 Flash. Switch profiles on-device or via app anytime.`,
 });
 } else {
 setBurnStatus({
 type: 'error',
 message: 'Failed during multi-profile flash write. Check connection.',
 });
 }
 } catch (err: any) {
 setBurnStatus({
 type: 'error',
 message: err.message || 'Error during multi-profile NVS flash.',
 });
 } finally {
 setIsBurningNvs(false);
 setBurnStepText('');
 }
 };

 // Factory Reset ESP32 NVS Flash
 const handleFactoryResetNvs = async () => {
 if (!hardwareConnection.isConnected) {
 alert('Connect ESP32 via Bluetooth or USB Serial first.');
 return;
 }
 if (confirm('Erase ESP32 NVS flash and reset back to embedded factory default profiles?')) {
 const ok = await hardwareConnection.eraseNVS();
 if (ok) {
 setBurnStatus({
 type: 'success',
 message: 'ESP32 Flash reset to factory default profiles.',
 });
 }
 }
 };

 // Export Profiles to JSON File
 const handleExportJson = () => {
 const dataStr = JSON.stringify({ version: 2, profiles, activeProfileId }, null, 2);
 const blob = new Blob([dataStr], { type: 'application/json' });
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url;
 a.download = `SpaceMouse_Profiles_${new Date().toISOString().slice(0, 10)}.json`;
 a.click();
 URL.revokeObjectURL(a.href);
 };

 // Import Profiles from JSON File
 const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;

 const reader = new FileReader();
 reader.onload = (evt) => {
 try {
 const text = evt.target?.result as string;
 const parsed = JSON.parse(text);
 if (Array.isArray(parsed)) {
 onImportProfiles(parsed);
 setBurnStatus({ type: 'success', message: `Imported ${parsed.length} profiles from JSON file!` });
 } else if (parsed && Array.isArray(parsed.profiles)) {
 onImportProfiles(parsed.profiles);
 if (parsed.activeProfileId) onSelectProfile(parsed.activeProfileId);
 setBurnStatus({ type: 'success', message: `Imported ${parsed.profiles.length} profiles from backup file!` });
 } else {
 setBurnStatus({ type: 'error', message: 'Invalid profile backup JSON file structure.' });
 }
 } catch (err: any) {
 setBurnStatus({ type: 'error', message: 'Failed to parse JSON file: ' + err.message });
 }
 };
 reader.readAsText(file);
 e.target.value = '';
 };

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
 <div className="relative w-full max-w-3xl bg-[#080c14] border border-blue-500/40 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col ">
 {/* Header */}
 <div className="p-4 sm:p-5 bg-gradient-to-r from-[#0d1524] via-[#080c14] to-[#0d1524] border-b border-[#1e2632] flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-blue-300 text-blue-400 shadow-lg shadow-cyan-500/20">
 <Layers className="w-6 h-6" />
 </div>
 <div>
 <div className="flex items-center gap-2">
 <h2 className="text-base font-semibold text-white">Custom Profile & Hardware Flash Studio</h2>
 <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
 isMaxProfilesReached
 ? 'bg-amber-950 text-blue-400 border-amber-500/50'
 : 'bg-cyan-950 text-blue-400 border border-blue-500/40'
 }`}>
 {profiles.length}/16 Capacity
 </span>
 </div>
 <p className="text-xs text-zinc-400 mt-0.5">
 Dynamic 1-16 Profile Storage. Create, edit, clone, and flash profiles directly into ESP32 NVS memory.
 </p>
 </div>
 </div>

 <button
 onClick={onClose}
 className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-slate-800 transition active:scale-95 transition-all"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Action Top Bar */}
 <div className="p-4 bg-[#05070d] border-b border-[#1e2632] flex flex-wrap items-center justify-between gap-3 text-xs">
 <div className="flex flex-wrap items-center gap-2">
 <button
 onClick={() => setIsCreatingNew(true)}
 disabled={isMaxProfilesReached}
 className="neo-button-primary"
 title={isMaxProfilesReached ? 'Maximum 16 hardware profiles limit reached' : 'Create a new CAD profile'}
 >
 <Plus className="w-4 h-4 text-black" />
 <span>{isMaxProfilesReached ? 'Max 16 Reached' : 'New CAD Profile'}</span>
 </button>

 <button
 onClick={() => handleBurnToEsp32Nvs(activeProfile)}
 disabled={isBurningNvs || !hardwareConnection.isConnected}
 className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 disabled:opacity-50 text-white font-semibold transition shadow-lg shadow-rose-900/30"
 title="Burns active profile into current ESP32 Flash slot"
 >
 <Flame className={`w-4 h-4 ${isBurningNvs ? 'animate-bounce text-yellow-300' : 'text-amber-200'}`} />
 <span>Burn Active</span>
 </button>

 <button
 onClick={handleBurnAllToEsp32Nvs}
 disabled={isBurningNvs || !hardwareConnection.isConnected}
 className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-semibold transition shadow-lg shadow-sm"
 title="Burns ALL active profiles (1 to 16) and updates profile count in ESP32 Flash"
 >
 <Cpu className="w-4 h-4 text-blue-400" />
 <span>Burn All ({profiles.length}) to ESP32 Flash</span>
 </button>
 </div>

 <div className="flex items-center gap-2">
 <button
 onClick={handleFactoryResetNvs}
 disabled={!hardwareConnection.isConnected}
 className="neo-button-danger"
 title="Reset ESP32 NVS flash back to factory default profiles"
 >
 <RefreshCw className="w-3.5 h-3.5" />
 <span>Factory Reset</span>
 </button>

 <button
 onClick={handleExportJson}
 className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-[#0c121e] hover:bg-slate-800 text-zinc-300 hover:text-white border border-[#1e2632] transition active:scale-95 transition-all"
 title="Export all profiles as a local JSON file"
 >
 <Download className="w-3.5 h-3.5" />
 <span>Export</span>
 </button>

 <button
 onClick={() => fileInputRef.current?.click()}
 className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-[#0c121e] hover:bg-slate-800 text-zinc-300 hover:text-white border border-[#1e2632] transition"
 title="Import profiles from a local JSON backup"
 >
 <Upload className="w-3.5 h-3.5" />
 <span>Import</span>
 </button>
 <input
 type="file"
 ref={fileInputRef}
 onChange={handleFileSelect}
 accept=".json"
 className="hidden"
 />
 </div>
 </div>

 {/* Burn Status Feedback Banner */}
 {burnStatus && (
 <div
 className={`mx-4 mt-3 p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
 burnStatus.type === 'success'
 ? 'bg-emerald-950/70 border-green-300 text-blue-400'
 : 'bg-rose-950/70 border-red-300 text-red-600'
 }`}
 >
 <div className="flex items-center gap-2.5">
 {burnStatus.type === 'success' ? (
 <CheckCircle className="w-4 h-4 text-blue-400 shrink-0" />
 ) : (
 <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
 )}
 <span>{burnStatus.message}</span>
 </div>
 <button
 onClick={() => setBurnStatus(null)}
 className="text-zinc-400 hover:text-white p-1"
 >
 <X className="w-3.5 h-3.5" />
 </button>
 </div>
 )}

 {/* Burning Progress Bar & Live Step Info */}
 {isBurningNvs && (
 <div className="mx-4 mt-2 space-y-1">
 <div className="flex items-center justify-between text-xs text-blue-400">
 <span>{burnStepText || 'Writing to ESP32 Flash...'}</span>
 <span>{burnProgress}%</span>
 </div>
 <div className="h-1.5 neo-panel rounded-full overflow-hidden">
 <div
 className="h-full bg-gradient-to-r from-amber-400 via-rose-500 to-cyan-400 transition-all duration-300"
 style={{ width: `${burnProgress}%` }}
 />
 </div>
 </div>
 )}

 {/* Main List & Editor Area */}
 <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
 {/* Create New Profile Form Drawer */}
 {isCreatingNew && (
 <form
 onSubmit={handleCreateProfile}
 className="p-4 rounded-xl bg-[#0d1524] border border-blue-300 shadow-xl space-y-3.5 animate-fadeIn"
 >
 <div className="flex items-center justify-between border-b border-[#1e2632] pb-2">
 <div className="flex items-center gap-2 text-white font-semibold text-xs uppercase">
 <Plus className="w-4 h-4 text-blue-400" />
 <span>Create Custom CAD Profile</span>
 </div>
 <button
 type="button"
 onClick={() => setIsCreatingNew(false)}
 className="text-zinc-400 hover:text-white p-1"
 >
 <X className="w-4 h-4" />
 </button>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
 <div className="space-y-1.5">
 <label className="text-xs text-zinc-400 block font-semibold">PROFILE NAME</label>
 <input
 type="text"
 required
 placeholder="e.g. Fusion 360 - Precision Modeling"
 value={newProfileName}
 onChange={(e) => setNewProfileName(e.target.value)}
 className="w-full px-3 py-2 bg-black border border-[#1e2632] rounded-lg text-white text-xs focus:outline-none focus:border-cyan-400 font-sans"
 />
 </div>

 <div className="space-y-1.5">
 <label className="text-xs text-zinc-400 block font-semibold">BASE CAD SUITE TEMPLATE</label>
 <select
 value={selectedTemplate}
 onChange={(e) => setSelectedTemplate(e.target.value)}
 className="w-full px-3 py-2 bg-black border border-[#1e2632] rounded-lg text-white text-xs focus:outline-none focus:border-cyan-400 font-sans"
 >
 {CAD_PRESET_TEMPLATES.map((t) => (
 <option key={t.id} value={t.id}>
 {t.name}
 </option>
 ))}
 </select>
 </div>
 </div>

 <div className="flex items-center justify-end gap-2 pt-1">
 <button
 type="button"
 onClick={() => setIsCreatingNew(false)}
 className="px-3 py-1.5 rounded-lg neo-panel-inset text-zinc-300 hover:text-white text-xs"
 >
 Cancel
 </button>
 <button
 type="submit"
 className="neo-button-primary"
 >
 <Check className="w-3.5 h-3.5 text-black" />
 <span>Create & Activate</span>
 </button>
 </div>
 </form>
 )}

 {/* Profiles Grid */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
 {profiles.map((profile, idx) => {
 const isActive = profile.id === activeProfileId;
 const isEditing = editingProfileId === profile.id;

 return (
 <div
 key={profile.id}
 className={`p-4 rounded-xl border transition-all relative flex flex-col justify-between ${
 isActive
 ? 'bg-[#0b1320] border-cyan-400/80 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/30'
 : 'bg-[#070a10] border-[#1e2632] hover:border-slate-700'
 }`}
 >
 {/* Card Top */}
 <div>
 <div className="flex items-start justify-between gap-2 mb-2">
 <div className="flex items-center gap-2.5 flex-1 min-w-0">
 <div className="flex items-center gap-1.5 shrink-0">
 <span className="text-xs px-1.5 py-0.5 rounded neo-panel border border-slate-800 text-zinc-400 font-semibold">
 #{idx + 1}
 </span>
 <div
 className="w-4 h-4 rounded-full shrink-0 border border-white/20 shadow-sm"
 style={{ backgroundColor: profile.ledColor || '#ff8800' }}
 title={`LED Accent: ${profile.ledColor}`}
 />
 </div>

 {isEditing ? (
 <div className="flex items-center gap-1.5 flex-1">
 <input
 type="text"
 value={editNameValue}
 onChange={(e) => setEditNameValue(e.target.value)}
 className="w-full px-2 py-1 bg-black border border-blue-500 rounded text-xs text-white focus:outline-none"
 autoFocus
 />
 <button
 onClick={() => handleSaveRename(profile)}
 className="p-1 text-blue-400 hover:bg-emerald-950 rounded"
 >
 <Check className="w-3.5 h-3.5" />
 </button>
 <button
 onClick={() => setEditingProfileId(null)}
 className="p-1 text-zinc-400 hover:bg-slate-800 rounded"
 >
 <X className="w-3.5 h-3.5" />
 </button>
 </div>
 ) : (
 <div className="min-w-0">
 <h3 className="text-xs font-semibold text-white truncate flex items-center gap-2 font-sans">
 <span>{profile.name}</span>
 {isActive && (
 <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 border border-blue-500/40 text-blue-400 font-semibold">
 ACTIVE
 </span>
 )}
 </h3>
 <span className="text-xs text-zinc-400 uppercase tracking-wider block">
 Target: {profile.targetApp}
 </span>
 </div>
 )}
 </div>

 {/* Top Action Icons */}
 <div className="flex items-center gap-1 shrink-0">
 {!isEditing && (
 <button
 onClick={() => {
 setEditingProfileId(profile.id);
 setEditNameValue(profile.name);
 }}
 className="p-1 rounded text-zinc-400 hover:text-white hover:bg-slate-800"
 title="Rename Profile"
 >
 <Edit2 className="w-3 h-3" />
 </button>
 )}
 <button
 onClick={() => handleDuplicateProfile(profile)}
 disabled={isMaxProfilesReached}
 className="p-1 rounded text-zinc-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
 title={isMaxProfilesReached ? 'Max 16 capacity reached' : 'Duplicate / Clone Profile'}
 >
 <Copy className="w-3 h-3" />
 </button>
 <button
 onClick={() => handleDelete(profile)}
 disabled={profiles.length <= 1}
 className="neo-button-danger"
 title="Delete Profile"
 >
 <Trash2 className="w-3 h-3" />
 </button>
 </div>
 </div>

 {/* Quick Profile Parameters Summary */}
 <div className="grid grid-cols-3 gap-1.5 py-2 my-1 border-t border-b border-[#1e2632]/60 text-xs text-zinc-400">
 <div>
 <span className="text-zinc-500 block">X/Y SENS:</span>
 <span className="text-zinc-200 font-semibold">{profile.axes.x.sensitivity}x</span>
 </div>
 <div>
 <span className="text-zinc-500 block">SMOOTHING:</span>
 <span className="text-zinc-200 font-semibold">{profile.filters.smoothingAlpha}</span>
 </div>
 <div>
 <span className="text-zinc-500 block">LED MODE:</span>
 <span className="text-zinc-200 font-semibold truncate block">
 {profile.ledRing?.idleAnimation || 'breathing'}
 </span>
 </div>
 </div>
 </div>

 {/* Card Bottom Controls */}
 <div className="flex items-center justify-between gap-2 mt-3 pt-1">
 {!isActive ? (
 <button
 onClick={() => onSelectProfile(profile.id)}
 className="px-3 py-1.5 rounded-lg neo-panel-inset hover:bg-cyan-900/60 hover:text-blue-400 text-zinc-300 text-xs font-semibold transition"
 >
 Activate Profile
 </button>
 ) : (
 <span className="text-xs text-blue-400 flex items-center gap-1 font-semibold">
 <CheckCircle className="w-3.5 h-3.5" />
 <span>Currently Active</span>
 </span>
 )}

 <button
 onClick={() => handleBurnToEsp32Nvs(profile, idx)}
 disabled={isBurningNvs || !hardwareConnection.isConnected}
 className="px-2.5 py-1.5 rounded-lg bg-amber-950/80 hover:bg-amber-900 border border-amber-500/40 text-blue-400 text-xs font-semibold flex items-center gap-1 transition disabled:opacity-40"
 title={`Burn profile into ESP32 Slot #${idx + 1}`}
 >
 <Flame className="w-3 h-3 text-blue-400" />
 <span>Burn Slot #{idx + 1}</span>
 </button>
 </div>
 </div>
 );
 })}
 </div>
 </div>

 {/* Footer */}
 <div className="p-4 bg-[#05070d] border-t border-[#1e2632] flex flex-wrap items-center justify-between gap-3 text-xs">
 <div className="flex items-center gap-2 text-zinc-400">
 <Cpu className="w-4 h-4 text-blue-400" />
 <span>
 ESP32 Onboard Memory (NVS):{' '}
 <strong className={hardwareConnection.isConnected ? 'text-blue-400' : 'text-zinc-500'}>
 {hardwareConnection.isConnected
 ? `Ready (${hardwareConnection.connectionType.toUpperCase()})`
 : 'Connect Bluetooth or Serial to Burn'}
 </strong>
 </span>
 </div>

 <button
 onClick={onClose}
 className="neo-button-primary"
 >
 Done
 </button>
 </div>
 </div>
 </div>
 );
};
