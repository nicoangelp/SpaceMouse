import React, { useState, useRef } from 'react';
import { Profile } from '../types';
import { defaultProfiles, createDefaultLedRing, createDefaultPowerManagement } from '../data/defaultProfiles';
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
 Sliders,
 HardDrive,
 Keyboard,
 Sun,
 BatteryCharging,
 Compass,
 FileCode,
} from 'lucide-react';

interface ProfilesAndFlashTabProps {
 profiles: Profile[];
 activeProfileId: string;
 onSelectProfile: (id: string) => void;
 onAddProfile: (newProfile: Profile) => void;
 onUpdateProfile: (updatedProfile: Profile) => void;
 onDeleteProfile: (id: string) => void;
 onImportProfiles: (importedProfiles: Profile[]) => void;
 isConnected: boolean;
 connectionType?: 'none' | 'serial' | 'bluetooth';
 onSyncAll?: () => Promise<boolean>;
 onNavigateToFirmware?: () => void;
}

const CAD_PRESET_TEMPLATES = [
 { id: 'fusion360', name: 'Autodesk Fusion 360', targetApp: 'fusion360', color: '#ff8800', category: 'Parametric CAD' },
 { id: 'blender', name: 'Blender 4.x (3D DCC)', targetApp: 'blender', color: '#e87d0d', category: 'Animation & Mesh' },
 { id: 'solidworks', name: 'Dassault SolidWorks', targetApp: 'solidworks', color: '#e60000', category: 'Mechanical Engineering' },
 { id: 'freecad', name: 'FreeCAD Parametric', targetApp: 'freecad', color: '#cb171e', category: 'Open Source CAD' },
 { id: 'bambu', name: 'Bambu Studio / PrusaSlicer', targetApp: 'bambu', color: '#00ae42', category: '3D Slicing & Printing' },
 { id: 'desktop', name: 'Desktop & Media Hotkeys', targetApp: 'desktop', color: '#00e5ff', category: 'General Productivity' },
 { id: 'custom', name: 'Custom Universal 6-DOF', targetApp: 'custom', color: '#a855f7', category: 'General 3D' },
];

export const ProfilesAndFlashTab: React.FC<ProfilesAndFlashTabProps> = ({
 profiles,
 activeProfileId,
 onSelectProfile,
 onAddProfile,
 onUpdateProfile,
 onDeleteProfile,
 onImportProfiles,
 isConnected,
 connectionType,
 onSyncAll,
 onNavigateToFirmware,
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

 const MAX_PROFILES_LIMIT = 16;
 const isMaxProfilesReached = profiles.length >= MAX_PROFILES_LIMIT;

 const fileInputRef = useRef<HTMLInputElement>(null);
 const activeProfile = profiles.find((p) => p.id === activeProfileId) || profiles[0];

 // Handle Create Profile
 const handleCreateProfile = (e: React.FormEvent) => {
 e.preventDefault();
 if (!newProfileName.trim()) return;
 if (isMaxProfilesReached) {
 alert(`Maximum capacity reached: ESP32 hardware supports up to ${MAX_PROFILES_LIMIT} profiles.`);
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

 if (isConnected) {
 hardwareConnection.setProfileCount(Math.min(profiles.length + 1, MAX_PROFILES_LIMIT));
 }

 setBurnStatus({
 type: 'success',
 message: `Profile "${newProfile.name}" created (Slot #${profiles.length + 1} of ${MAX_PROFILES_LIMIT}). Click "Burn to Flash" to write it to ESP32.`,
 });
 };

 // Handle Duplicate Profile
 const handleDuplicate = (profile: Profile) => {
 if (isMaxProfilesReached) {
 alert(`Maximum capacity reached: ESP32 hardware supports up to ${MAX_PROFILES_LIMIT} profiles.`);
 return;
 }
 const duplicated: Profile = {
 ...JSON.parse(JSON.stringify(profile)),
 id: `profile-${Date.now()}`,
 name: `${profile.name} (Copy)`,
 };
 onAddProfile(duplicated);
 onSelectProfile(duplicated.id);

 if (isConnected) {
 hardwareConnection.setProfileCount(Math.min(profiles.length + 1, MAX_PROFILES_LIMIT));
 }
 };

 // Handle Delete Profile
 const handleDelete = (profileId: string) => {
 if (profiles.length <= 1) {
 alert('You must retain at least one profile.');
 return;
 }
 onDeleteProfile(profileId);
 if (isConnected) {
 hardwareConnection.setProfileCount(Math.max(profiles.length - 1, 1));
 }
 };

 // Handle Export Profiles JSON
 const handleExportJson = () => {
 const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(profiles, null, 2));
 const downloadAnchor = document.createElement('a');
 downloadAnchor.setAttribute('href', dataStr);
 downloadAnchor.setAttribute('download', `oofo_one_profiles_${new Date().toISOString().slice(0, 10)}.json`);
 document.body.appendChild(downloadAnchor);
 downloadAnchor.click();
 downloadAnchor.remove();
 };

 // Handle Import JSON
 const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
 const fileReader = new FileReader();
 if (e.target.files && e.target.files[0]) {
 fileReader.readAsText(e.target.files[0], 'UTF-8');
 fileReader.onload = (event) => {
 try {
 const parsed = JSON.parse(event.target?.result as string);
 if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].axes) {
 const capped = parsed.slice(0, MAX_PROFILES_LIMIT);
 onImportProfiles(capped);
 setBurnStatus({
 type: 'success',
 message: `Imported ${capped.length} profiles successfully (Hardware Max: ${MAX_PROFILES_LIMIT}).`,
 });
 } else {
 alert('Invalid profile JSON structure.');
 }
 } catch {
 alert('Failed to parse JSON file.');
 }
 };
 }
 };

  // Burn active profile to ESP32 Flash (Legacy BURNNVS fallback)
  const handleBurnToFlash = async (targetProfile?: Profile, targetIdx?: number) => {
    if (!isConnected) {
      setBurnStatus({
        type: 'error',
        message: 'No ESP32 connected. Connect via Web Bluetooth or Web Serial first.',
      });
      return;
    }

    const prof = targetProfile || activeProfile;
    const slot = typeof targetIdx === 'number' ? targetIdx : profiles.findIndex((p) => p.id === prof.id);

    setIsBurningNvs(true);
    setBurnProgress(20);
    setBurnStepText(`Syncing "${prof.name}"...`);
    setBurnStatus(null);

    try {
      setBurnProgress(50);
      const ok = await hardwareConnection.burnProfileToNVS(prof, Math.max(slot, 0), Math.min(profiles.length, MAX_PROFILES_LIMIT));
      setBurnProgress(100);
      if (ok) {
        setBurnStatus({
          type: 'success',
          message: `Saved "${prof.name}" to device!`,
        });
      } else {
        setBurnStatus({
          type: 'error',
          message: 'Sync failed. Check connection.',
        });
      }
    } catch {
      setBurnStatus({
        type: 'error',
        message: 'Communication error during sync.',
      });
    } finally {
      setIsBurningNvs(false);
      setBurnStepText('');
    }
  };

  // Sync ALL Profiles to Device
  const handleSyncAll = async () => {
    if (!isConnected) {
      setBurnStatus({
        type: 'error',
        message: 'Device disconnected. Connect via Bluetooth or USB Serial first.',
      });
      return;
    }

    setIsBurningNvs(true);
    setBurnProgress(5);
    setBurnStatus(null);

    try {
      const ok = await hardwareConnection.syncAllToDevice(
        profiles,
        activeProfileId,
        (percent, stepText) => {
          setBurnProgress(percent);
          setBurnStepText(stepText);
        }
      );

      if (ok) {
        setBurnStatus({
          type: 'success',
          message: `🔥 Sync Complete! Device is now running ${Math.min(profiles.length, MAX_PROFILES_LIMIT)} profiles.`,
        });
      } else {
        setBurnStatus({
          type: 'error',
          message: 'Bulk sync failed. Check serial connection and retry.',
        });
      }
    } catch {
      setBurnStatus({
        type: 'error',
        message: 'Error during bulk profile sync.',
      });
    } finally {
      setIsBurningNvs(false);
      setBurnStepText('');
    }
  };

 // Factory Reset Flash
 const handleFactoryReset = async () => {
 if (!isConnected) {
 alert('Connect ESP32 first.');
 return;
 }
 if (confirm('Reset ESP32 Flash memory back to default factory profiles?')) {
 const ok = await hardwareConnection.eraseNVS();
 if (ok) {
 setBurnStatus({
 type: 'success',
 message: 'ESP32 Flash memory reset to factory defaults.',
 });
 }
 }
 };

 // Calculate NVS Payload Stats
 const numButtons = activeProfile.buttons?.length || 9;
 const deadzonesCount = Object.keys(activeProfile.axes || {}).length;
 const approxNvsBytes = 180 + numButtons * 32 + deadzonesCount * 16;

 return (
 <div className="space-y-6">
 {/* Top Header Card */}
 <div className="p-5 rounded-3xl neo-panel backdrop-blur-xl border border-transparent flex flex-wrap items-center justify-between gap-4">
 <div>
 <div className="flex items-center gap-2.5">
 <Layers className="w-5 h-5 text-blue-400" />
 <h2 className="text-base font-semibold text-white tracking-tight">
 Profile Management & ESP32 Flash Memory (NVS)
 </h2>
 <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
 isMaxProfilesReached
 ? 'bg-amber-950 text-blue-400 border-amber-500/50'
 : 'bg-cyan-950 text-blue-400 border border-blue-500/40'
 }`}>
 {profiles.length}/16 Capacity
 </span>
 </div>
 <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
 Dynamic 1-16 Profile Storage. Manage configurations, backup to JSON, and burn sensitivity curves, 3x3 key mappings, and LED settings directly into the ESP32's non-volatile flash memory.
 </p>
 </div>

 {/* Quick Action Buttons */}
 <div className="flex flex-wrap items-center gap-2">
 <input
 type="file"
 ref={fileInputRef}
 onChange={handleFileUpload}
 accept=".json"
 className="hidden"
 />
 <button
 onClick={handleFactoryReset}
 disabled={!isConnected}
 className="neo-button-danger"
 title="Reset ESP32 NVS flash back to factory defaults"
 >
 <RefreshCw className="w-3.5 h-3.5" />
 <span>Factory Reset</span>
 </button>

 <button
 onClick={() => fileInputRef.current?.click()}
 className="neo-button text-xs px-3 py-2 text-zinc-300 hover:text-blue-400"
 >
 <Upload className="w-3.5 h-3.5 text-blue-400" />
 <span>Import</span>
 </button>

 <button
 onClick={handleExportJson}
 className="neo-button text-xs px-3 py-2 text-zinc-300 hover:text-blue-400"
 >
 <Download className="w-3.5 h-3.5 text-blue-400" />
 <span>Export</span>
 </button>

 <button
 onClick={() => setIsCreatingNew(true)}
 disabled={isMaxProfilesReached}
 className="neo-button-primary"
 title={isMaxProfilesReached ? 'Max 16 profiles capacity reached' : 'Create a new CAD profile'}
 >
 <Plus className="w-4 h-4" />
 <span>{isMaxProfilesReached ? 'Max 16 Reached' : 'New Profile'}</span>
 </button>
 </div>
 </div>

 {/* Burn Status Alert */}
 {burnStatus && (
 <div
 className={`p-4 rounded-xl border text-xs flex items-center justify-between gap-3 ${
 burnStatus.type === 'success'
 ? 'bg-emerald-950/40 border-green-300 text-blue-400'
 : 'bg-red-50 border-rose-500/40 text-red-600'
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

 {/* Main 2-Column Layout */}
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
 {/* Left: Profile Cards List (7 Cols) */}
 <div className="lg:col-span-7 space-y-3">
 <div className="flex items-center justify-between pb-1">
 <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
 Installed Profiles ({profiles.length} of 16 Active)
 </span>
 <span className="text-xs text-zinc-500">
 Active: <strong className="text-blue-400">{activeProfile.name}</strong>
 </span>
 </div>

 {/* New Profile Creation Form */}
 {isCreatingNew && (
 <form
 onSubmit={handleCreateProfile}
 className="p-4 rounded-3xl neo-panel backdrop-blur-xl border-2 border-blue-300 space-y-4 shadow-lg animate-fadeIn"
 >
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <Plus className="w-4 h-4 text-blue-400" />
 <span className="text-xs font-semibold text-white">Create New Profile</span>
 </div>
 <button
 type="button"
 onClick={() => setIsCreatingNew(false)}
 className="text-zinc-400 hover:text-white p-1"
 >
 <X className="w-4 h-4" />
 </button>
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-semibold text-zinc-300">Profile Name</label>
 <input
 type="text"
 placeholder="e.g. Fusion 360 Precision, Blender Sculpting"
 value={newProfileName}
 onChange={(e) => setNewProfileName(e.target.value)}
 autoFocus
 className="w-full px-3.5 py-2.5 rounded-xl neo-panel-inset border border-transparent text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
 />
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-semibold text-zinc-300">Base Application Template</label>
 <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
 {CAD_PRESET_TEMPLATES.map((tmpl) => (
 <button
 type="button"
 key={tmpl.id}
 onClick={() => setSelectedTemplate(tmpl.id)}
 className={`p-2.5 rounded-xl border text-left text-xs transition ${
 selectedTemplate === tmpl.id
 ? 'bg-cyan-950/60 border-blue-500 text-white font-semibold'
 : 'neo-panel-inset border-transparent text-zinc-400 hover:text-zinc-200 hover:neo-panel-inset'
 }`}
 >
 <div className="flex items-center gap-1.5 mb-1">
 <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tmpl.color }} />
 <span className="truncate font-semibold">{tmpl.name}</span>
 </div>
 <span className="text-xs text-zinc-500 block truncate">{tmpl.category}</span>
 </button>
 ))}
 </div>
 </div>

 <div className="flex justify-end gap-2 pt-2">
 <button
 type="button"
 onClick={() => setIsCreatingNew(false)}
 className="px-4 py-2 rounded-xl neo-panel-inset text-zinc-300 hover:text-white text-xs font-semibold"
 >
 Cancel
 </button>
 <button
 type="submit"
 disabled={!newProfileName.trim()}
 className="neo-button-primary"
 >
 Create Profile
 </button>
 </div>
 </form>
 )}

 {/* Profile Cards Grid */}
 <div className="space-y-2.5">
 {profiles.map((profile, idx) => {
 const isActive = profile.id === activeProfileId;
 const isEditing = editingProfileId === profile.id;

 return (
 <div
 key={profile.id}
 onClick={() => onSelectProfile(profile.id)}
 className={`p-4 rounded-2xl border transition cursor-pointer flex flex-wrap items-center justify-between gap-3 ${
 isActive
 ? 'neo-panel-inset border-blue-500 shadow-md ring-1 ring-cyan-500/30'
 : 'neo-panel backdrop-blur-xl border-transparent hover:border-transparent hover:neo-panel-inset'
 }`}
 >
 {/* Left: Indicator & Name */}
 <div className="flex items-center gap-3 min-w-[200px]">
 <span className="text-xs px-2 py-0.5 rounded neo-panel border border-slate-800 text-zinc-400 font-semibold">
 #{idx + 1}
 </span>
 <div
 className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
 style={{ backgroundColor: profile.ledColor || '#ff8800' }}
 />
 <div>
 {isEditing ? (
 <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
 <input
 type="text"
 value={editNameValue}
 onChange={(e) => setEditNameValue(e.target.value)}
 className="px-2.5 py-1 rounded-lg neo-panel-inset border border-blue-500 text-xs text-white focus:outline-none"
 autoFocus
 />
 <button
 onClick={() => {
 if (editNameValue.trim()) {
 onUpdateProfile({ ...profile, name: editNameValue.trim() });
 }
 setEditingProfileId(null);
 }}
 className="neo-button-primary"
 >
 <Check className="w-3.5 h-3.5" />
 </button>
 </div>
 ) : (
 <div className="flex items-center gap-2">
 <span className="text-sm font-semibold text-white">{profile.name}</span>
 {isActive && (
 <span className="px-2 py-0.5 rounded-md bg-cyan-950 text-blue-400 text-xs font-semibold border border-blue-200">
 ACTIVE
 </span>
 )}
 </div>
 )}
 <span className="text-xs text-zinc-400 capitalize">
 {profile.targetApp} • {profile.buttons?.length || 9} Mapped Keys
 </span>
 </div>
 </div>

 {/* Right: Quick Action Buttons */}
 <div
 className="flex items-center gap-1 text-zinc-400"
 onClick={(e) => e.stopPropagation()}
 >
 <button
 onClick={() => handleBurnToFlash(profile, idx)}
 disabled={isBurningNvs || !isConnected}
 className="px-2.5 py-1.5 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/30 text-blue-400 text-xs font-semibold flex items-center gap-1 transition disabled:opacity-40"
 title={`Burn Slot #${idx + 1} into ESP32 flash`}
 >
 <Flame className="w-3 h-3 text-blue-400" />
 <span>Flash Slot #{idx + 1}</span>
 </button>

 <button
 onClick={() => {
 setEditingProfileId(profile.id);
 setEditNameValue(profile.name);
 }}
 className="p-2 rounded-xl hover:bg-[#252e40] hover:text-white transition"
 title="Rename Profile"
 >
 <Edit2 className="w-3.5 h-3.5" />
 </button>

 <button
 onClick={() => handleDuplicate(profile)}
 disabled={isMaxProfilesReached}
 className="p-2 rounded-xl hover:bg-[#252e40] hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
 title={isMaxProfilesReached ? 'Max 16 capacity reached' : 'Duplicate Profile'}
 >
 <Copy className="w-3.5 h-3.5" />
 </button>

 {profiles.length > 1 && (
 <button
 onClick={() => handleDelete(profile.id)}
 className="neo-button-danger"
 title="Delete Profile"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 )}
 </div>
 </div>
 );
 })}
 </div>
 </div>

 {/* Right: Flash Memory (NVS) Card & Inspector (5 Cols) */}
 <div className="lg:col-span-5 space-y-4">
 <div className="p-5 rounded-3xl neo-panel backdrop-blur-xl border border-transparent space-y-4">
 <div className="flex items-center justify-between pb-3 border-b border-transparent">
 <div className="flex items-center gap-2">
 <HardDrive className="w-4 h-4 text-blue-400" />
 <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
 ESP32 Multi-Profile Flash (NVS)
 </h3>
 </div>
 <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-blue-400 font-semibold border border-emerald-500/30">
 1-16 Dynamic Slots
 </span>
 </div>

 {/* Flash Info Summary */}
 <div className="space-y-2 text-xs">
 <div className="flex justify-between py-1.5 border-b border-[#1c2230]">
 <span className="text-zinc-400">Total Active Profiles:</span>
 <span className="font-semibold text-blue-400">{profiles.length} / 16 Maximum</span>
 </div>
 <div className="flex justify-between py-1.5 border-b border-[#1c2230]">
 <span className="text-zinc-400">Target Active Slot:</span>
 <span className="font-semibold text-white">#{profiles.findIndex((p) => p.id === activeProfileId) + 1} - {activeProfile.name}</span>
 </div>
 <div className="flex justify-between py-1.5 border-b border-[#1c2230]">
 <span className="text-zinc-400">Hardware Profile Cycling:</span>
 <span className="font-semibold text-zinc-200">0 → {Math.max(profiles.length - 1, 0)} (Modulo {profiles.length})</span>
 </div>
 <div className="flex justify-between py-1.5 border-b border-[#1c2230]">
 <span className="text-zinc-400">Flash Payload / Capacity:</span>
 <span className="font-semibold text-blue-400">~{approxNvsBytes * profiles.length} B / 24,576 B</span>
 </div>
 <div className="flex justify-between py-1.5">
 <span className="text-zinc-400">Connection Status:</span>
 <span className={`font-semibold ${isConnected ? 'text-blue-400' : 'text-zinc-500'}`}>
 {isConnected ? `Connected (${hardwareConnection.connectionType.toUpperCase()})` : 'Disconnected'}
 </span>
 </div>
 </div>

 {/* Burn Progress Bar & Step Text */}
 {isBurningNvs && (
 <div className="space-y-1.5">
 <div className="w-full h-2 neo-panel-inset rounded-full overflow-hidden">
 <div
 className="h-full bg-gradient-to-r from-cyan-500 via-amber-400 to-emerald-400 transition-all duration-300"
 style={{ width: `${burnProgress}%` }}
 />
 </div>
 <div className="flex justify-between text-xs text-blue-400">
 <span>{burnStepText || 'Writing NVS keys to ESP32 Flash...'}</span>
 <span>{burnProgress}%</span>
 </div>
 </div>
 )}

 {/* Action Buttons */}
 <div className="space-y-2 pt-1">
 
 {hardwareConnection.connectionType === 'bluetooth' && (
   <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs">
     <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
     <p>Configuration Sync is disabled over Bluetooth to prevent data loss. Please plug in via USB Serial to flash NVS memory.</p>
   </div>
 )}

 {/* Full Multi-Profile Bulk Sync Button */}
 <button
 onClick={handleSyncAll}
 disabled={isBurningNvs || !isConnected || hardwareConnection.connectionType === 'bluetooth'}
 className={`w-full py-3 px-4 rounded-xl font-semibold text-xs transition flex items-center justify-center gap-2 shadow-lg ${
 (!isConnected || hardwareConnection.connectionType === 'bluetooth')
 ? 'neo-panel-inset text-zinc-500 cursor-not-allowed border border-[#273248]'
 : isBurningNvs
 ? 'bg-blue-700 text-white'
 : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white active:scale-[0.99] border border-blue-400/30'
 }`}
 >
 <Cpu className={`w-4 h-4 ${isBurningNvs ? 'animate-bounce' : ''}`} />
 <span>{isBurningNvs ? 'Syncing Device...' : `Sync ${profiles.length} Profile(s) to SpaceMouse`}</span>
 </button>

 {/* Active Profile Slot Button */}
 <button
 onClick={() => handleBurnToFlash(activeProfile)}
 disabled={isBurningNvs || !isConnected || hardwareConnection.connectionType === 'bluetooth'}
 className={`w-full py-2 px-4 rounded-xl font-semibold text-xs transition flex items-center justify-center gap-2 border ${
 (!isConnected || hardwareConnection.connectionType === 'bluetooth')
 ? 'neo-panel backdrop-blur-xl text-zinc-500 border-transparent cursor-not-allowed'
 : 'neo-panel-inset hover:bg-[#252e40] text-blue-400 border-blue-500/30'
 }`}
 >
 <Sparkles className="w-3.5 h-3.5 text-blue-400" />
 <span>Sync Active Profile Only (Slot #{profiles.findIndex((p) => p.id === activeProfileId) + 1})</span>
 </button>
 </div>

 {!isConnected && (
 <p className="text-xs text-zinc-500 text-center">
 Connect your SpaceMouse via Bluetooth or USB Serial to burn settings.
 </p>
 )}
 </div>

 {/* Quick link to C++ Firmware Generator */}
 {onNavigateToFirmware && (
 <div className="p-4 rounded-3xl neo-panel backdrop-blur-xl border border-transparent flex items-center justify-between gap-3">
 <div>
 <span className="text-xs font-semibold text-white block">Compile Standalone Firmware</span>
 <span className="text-xs text-zinc-400">Generate complete Arduino & PlatformIO C++ sketch</span>
 </div>
 <button
 onClick={onNavigateToFirmware}
 className="px-3.5 py-1.5 rounded-xl neo-panel-inset hover:bg-[#252e40] text-xs font-semibold text-blue-400 border border-[#273248] transition flex items-center gap-1.5 active:scale-95 transition-all"
 >
 <FileCode className="w-3.5 h-3.5" />
 <span>View Code</span>
 </button>
 </div>
 )}
 </div>
 </div>
 </div>
 );
};
