import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { SixDofState } from '../types';
import { Box, Eye, Layers, RefreshCw, Sparkles, Orbit, Compass } from 'lucide-react';

interface Visualizer3DProps {
 state: SixDofState;
 ledColor?: string;
 isSimulating?: boolean;
 calibrationMode?: boolean;
 eulerAngles?: { yaw: number; pitch: number; roll: number };
 onEulerChange?: (e: { yaw: number; pitch: number; roll: number }) => void;
 invertAxes?: { x: boolean; y: boolean; z: boolean };
 onInvertChange?: (e: { x: boolean; y: boolean; z: boolean }) => void;
}

export const Visualizer3D: React.FC<Visualizer3DProps> = ({
 state,
 ledColor = '#00e5ff',
 isSimulating = false,
 calibrationMode = false,
 eulerAngles = { yaw: 0, pitch: 0, roll: 0 },
 onEulerChange,
 invertAxes = { x: false, y: false, z: false },
 onInvertChange,
}) => {
 const containerRef = useRef<HTMLDivElement>(null);
 const [viewMode, setViewMode] = useState<'puck' | 'cad_scene'>('puck');
 const [cadModelType, setCadModelType] = useState<'turbine' | 'bracket' | 'torus'>('turbine');
 const [wireframe, setWireframe] = useState<boolean>(false);

 const sceneRef = useRef<THREE.Scene | null>(null);
 const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
 const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
 const puckGroupRef = useRef<THREE.Group | null>(null);
 const orientationPivotRef = useRef<THREE.Group | null>(null);
 const transformControlsRef = useRef<TransformControls | null>(null);
 const cadGroupRef = useRef<THREE.Group | null>(null);
 const ledMeshRef = useRef<THREE.Mesh | null>(null);
 const dynamicModelRef = useRef<THREE.Mesh | null>(null);

 // CAD scene camera manipulation state
 const cadCameraState = useRef({
 distance: 6,
 rotX: 0.4,
 rotY: 0.6,
 panX: 0,
 panY: 0,
 });

 useEffect(() => {
 if (!containerRef.current) return;

 const width = containerRef.current.clientWidth;
 const height = containerRef.current.clientHeight || 380;

 // 1. Scene setup
 const scene = new THREE.Scene();
 scene.background = new THREE.Color(0x0a0d14);
 sceneRef.current = scene;

 // 2. Camera setup
 const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
 camera.position.set(0, 4.2, 7.2);
 camera.lookAt(0, 0.5, 0);
 cameraRef.current = camera;

 // 3. Renderer setup
 const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
 renderer.setSize(width, height);
 renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
 renderer.shadowMap.enabled = true;
 renderer.shadowMap.type = THREE.PCFSoftShadowMap;
 rendererRef.current = renderer;

 containerRef.current.innerHTML = '';
 containerRef.current.appendChild(renderer.domElement);

 // Transform Controls (Gizmo)
 const transformControls = new TransformControls(camera, renderer.domElement);
 transformControls.setMode('rotate');
 transformControls.setSpace('local');
 transformControls.size = 3.0;
 scene.add(transformControls.getHelper());
 transformControlsRef.current = transformControls;

 // 4. Studio Lighting (OOFO Cinematic Setup)
 const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
 scene.add(ambientLight);

 const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
 keyLight.position.set(5, 12, 8);
 keyLight.castShadow = true;
 keyLight.shadow.mapSize.width = 1024;
 keyLight.shadow.mapSize.height = 1024;
 scene.add(keyLight);

 const rimLight = new THREE.DirectionalLight(0x00e5ff, 0.7);
 rimLight.position.set(-6, 4, -5);
 scene.add(rimLight);

 const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.4);
 fillLight.position.set(0, -4, 4);
 scene.add(fillLight);

 // 5. Build SpaceMouse Hardware Model (Ergonomic contoured body with palm rest, 3x3 keypad, textured grip, and 6-DOF puck)
 const puckMaster = new THREE.Group();
 puckGroupRef.current = puckMaster;

 // --- A. Ergonomic Contoured Main Base Chassis ---
 const bodyGeo = new THREE.CylinderGeometry(2.4, 2.7, 0.45, 64);
 const bodyMat = new THREE.MeshStandardMaterial({
 color: 0x141822,
 metalness: 0.3,
 roughness: 0.6,
 });
 const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
 bodyMesh.position.set(0, -0.22, 0);
 bodyMesh.receiveShadow = true;
 puckMaster.add(bodyMesh);

 // Sweeping Palm Rest extension on bottom
 const palmRestGeo = new THREE.BoxGeometry(3.6, 0.35, 2.2);
 const palmRestMat = new THREE.MeshStandardMaterial({
 color: 0x11151e,
 metalness: 0.2,
 roughness: 0.7,
 });
 const palmRestMesh = new THREE.Mesh(palmRestGeo, palmRestMat);
 palmRestMesh.position.set(0.2, -0.25, 1.6);
 palmRestMesh.rotation.x = 0.08;
 puckMaster.add(palmRestMesh);

 // --- B. Textured Rubber Side Grip on Right ---
 const gripGeo = new THREE.BoxGeometry(0.5, 0.25, 1.8);
 const gripMat = new THREE.MeshStandardMaterial({
 color: 0x0c0f17,
 metalness: 0.1,
 roughness: 0.9,
 });
 const gripMesh = new THREE.Mesh(gripGeo, gripMat);
 gripMesh.position.set(1.95, -0.15, 0.5);
 gripMesh.rotation.y = -0.2;
 puckMaster.add(gripMesh);

 // Subtle grip ribs
 for (let r = -0.6; r <= 0.6; r += 0.2) {
 const ribGeo = new THREE.BoxGeometry(0.52, 0.04, 0.06);
 const ribMat = new THREE.MeshStandardMaterial({ color: 0x181f2c });
 const ribMesh = new THREE.Mesh(ribGeo, ribMat);
 ribMesh.position.set(1.95, -0.05, 0.5 + r);
 ribMesh.rotation.y = -0.2;
 puckMaster.add(ribMesh);
 }

 // --- C. Integrated 3x3 Keypad on Left Front Slope ---
 const keypadBaseGeo = new THREE.BoxGeometry(1.6, 0.15, 1.6);
 const keypadBaseMat = new THREE.MeshStandardMaterial({ color: 0x0a0d14, metalness: 0.4, roughness: 0.5 });
 const keypadBase = new THREE.Mesh(keypadBaseGeo, keypadBaseMat);
 keypadBase.position.set(-1.4, -0.1, 1.1);
 keypadBase.rotation.y = 0.25;
 keypadBase.rotation.x = 0.12;
 puckMaster.add(keypadBase);

 // 9 Mechanical Keycaps
 const keyGeo = new THREE.BoxGeometry(0.36, 0.14, 0.36);
 const keyMat = new THREE.MeshStandardMaterial({ color: 0x1e2636, metalness: 0.2, roughness: 0.6 });
 for (let row = 0; row < 3; row++) {
 for (let col = 0; col < 3; col++) {
 const keyMesh = new THREE.Mesh(keyGeo, keyMat);
 const kx = (col - 1) * 0.44;
 const kz = (row - 1) * 0.44;
 keyMesh.position.set(kx, 0.1, kz);
 keypadBase.add(keyMesh);
 }
 }

 // --- D. 24-LED Illuminated Halo Ring ---
 const haloGeo = new THREE.TorusGeometry(1.78, 0.06, 16, 64);
 const haloMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(ledColor) });
 const haloMesh = new THREE.Mesh(haloGeo, haloMat);
 haloMesh.rotation.x = Math.PI / 2;
 haloMesh.position.y = 0.05;
 puckMaster.add(haloMesh);
 ledMeshRef.current = haloMesh;

 // --- E. Central 6-DOF Deflection Knob Puck ---
 const orientationPivot = new THREE.Group();
 orientationPivot.name = 'orientationPivot';
 orientationPivotRef.current = orientationPivot;
 
 const capGroup = new THREE.Group();
 capGroup.name = 'capGroup';

 // Lower collar
 const collarGeo = new THREE.CylinderGeometry(1.4, 1.5, 0.6, 48);
 const collarMat = new THREE.MeshStandardMaterial({
 color: 0x181d2a,
 metalness: 0.4,
 roughness: 0.6,
 });
 const collar = new THREE.Mesh(collarGeo, collarMat);
 collar.position.y = 0.35;
 capGroup.add(collar);

 // Ergonomic top grip cap
 const topCapGeo = new THREE.CylinderGeometry(1.48, 1.4, 0.55, 48);
 const topCapMat = new THREE.MeshStandardMaterial({
 color: 0x0c0f16,
 metalness: 0.7,
 roughness: 0.3,
 });
 const topCap = new THREE.Mesh(topCapGeo, topCapMat);
 topCap.position.y = 0.88;
 capGroup.add(topCap);

 // Beveled metallic ring
 const metallicRingGeo = new THREE.TorusGeometry(1.46, 0.035, 16, 48);
 const metallicRingMat = new THREE.MeshStandardMaterial({ color: 0x00e5ff, metalness: 0.9, roughness: 0.1 });
 const metallicRing = new THREE.Mesh(metallicRingGeo, metallicRingMat);
 metallicRing.rotation.x = Math.PI / 2;
 metallicRing.position.y = 0.65;
 capGroup.add(metallicRing);

 // Concave crown insert
 const crownGeo = new THREE.CylinderGeometry(1.2, 1.3, 0.1, 48);
 const crownMat = new THREE.MeshStandardMaterial({ color: 0x141822, metalness: 0.8, roughness: 0.2 });
 const crown = new THREE.Mesh(crownGeo, crownMat);
 crown.position.y = 1.16;
 capGroup.add(crown);

 // 6-Axis Center Coordinate Gizmo
 const axesGizmo = new THREE.AxesHelper(1.1);
 axesGizmo.position.y = 1.25;
 capGroup.add(axesGizmo);

 orientationPivot.add(capGroup);
 puckMaster.add(orientationPivot);
 scene.add(puckMaster);

 // --- 6. CAD 3D Scene Viewport Setup ---
 const cadMaster = new THREE.Group();
 cadGroupRef.current = cadMaster;
 cadMaster.visible = false;

 // Floor Grid
 const grid = new THREE.GridHelper(12, 24, 0x00e5ff, 0x1c2434);
 grid.position.y = -1.4;
 cadMaster.add(grid);

 // Build Initial CAD Model
 const createCadModel = (type: 'turbine' | 'bracket' | 'torus', isWire: boolean) => {
   if (dynamicModelRef.current) {
     cadMaster.remove(dynamicModelRef.current);
     dynamicModelRef.current.geometry.dispose();
     if (Array.isArray(dynamicModelRef.current.material)) {
       dynamicModelRef.current.material.forEach((m) => m.dispose());
     } else if (dynamicModelRef.current.material) {
       dynamicModelRef.current.material.dispose();
     }
   }

   let geo: THREE.BufferGeometry;
   if (type === 'turbine') {
     geo = new THREE.TorusKnotGeometry(1.2, 0.35, 100, 16, 2, 3);
   } else if (type === 'bracket') {
     geo = new THREE.BoxGeometry(2.2, 2.2, 2.2);
   } else {
     geo = new THREE.TorusGeometry(1.4, 0.45, 24, 64);
   }

   const mat = new THREE.MeshStandardMaterial({
     color: 0x38bdf8,
     metalness: 0.6,
     roughness: 0.3,
     wireframe: isWire,
   });

   const mesh = new THREE.Mesh(geo, mat);
   mesh.position.y = 0.5;
   mesh.castShadow = true;
   mesh.receiveShadow = true;
   cadMaster.add(mesh);
   dynamicModelRef.current = mesh;
 };

 createCadModel(cadModelType, wireframe);
 scene.add(cadMaster);

 // ResizeObserver
 const resizeObserver = new ResizeObserver(() => {
 if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
 const w = containerRef.current.clientWidth;
 const h = containerRef.current.clientHeight || 380;
 cameraRef.current.aspect = w / h;
 cameraRef.current.updateProjectionMatrix();
 rendererRef.current.setSize(w, h);
 });
 resizeObserver.observe(containerRef.current);

 // Animation Render Loop
 let animationFrameId: number;
 const animate = () => {
 animationFrameId = requestAnimationFrame(animate);
 if (rendererRef.current && sceneRef.current && cameraRef.current) {
 rendererRef.current.render(sceneRef.current, cameraRef.current);
 }
 };
 animate();

 return () => {
 cancelAnimationFrame(animationFrameId);
 resizeObserver.disconnect();
 transformControls.dispose();
 renderer.dispose();
 };
 }, []);

 // Update LED Halo Color
 useEffect(() => {
 if (ledMeshRef.current) {
 (ledMeshRef.current.material as THREE.MeshBasicMaterial).color.set(ledColor);
 }
 }, [ledColor]);

 // Update View Mode Visibility
 useEffect(() => {
 if (puckGroupRef.current && cadGroupRef.current && cameraRef.current) {
 if (viewMode === 'puck') {
 puckGroupRef.current.visible = true;
 cadGroupRef.current.visible = false;
 cameraRef.current.position.set(0, 4.2, 7.2);
 cameraRef.current.lookAt(0, 0.5, 0);
 } else {
 puckGroupRef.current.visible = false;
 cadGroupRef.current.visible = true;
 }
 }
 }, [viewMode]);

 // Handle TransformControls Attach/Detach & Events
 useEffect(() => {
    const tControls = transformControlsRef.current;
    const pivot = orientationPivotRef.current;
    if (!tControls || !pivot) return;

    if (calibrationMode && viewMode === 'puck') {
      tControls.attach(pivot);
    } else {
      tControls.detach();
    }

    const handleChange = () => {
      if (tControls.object && onEulerChange) {
        // Read the local euler angles that were dragged and convert to degrees
        const objEuler = tControls.object.rotation;
        
        // Round to nearest degree to avoid float spam
        const yaw = Math.round((objEuler.y * 180) / Math.PI);
        const pitch = Math.round((objEuler.x * 180) / Math.PI);
        const roll = Math.round((objEuler.z * 180) / Math.PI);
        
        // Only trigger update if it changed
        if (eulerAngles.yaw !== yaw || eulerAngles.pitch !== pitch || eulerAngles.roll !== roll) {
            onEulerChange({ yaw, pitch, roll });
        }
      }
    };

    tControls.addEventListener('change', handleChange);
    
    return () => {
      tControls.removeEventListener('change', handleChange);
    };
  }, [calibrationMode, viewMode, onEulerChange]);

  // Sync external eulerAngles back to the 3D model (if user dragged sliders instead of gizmo)
  useEffect(() => {
    if (orientationPivotRef.current && !transformControlsRef.current?.dragging) {
      orientationPivotRef.current.rotation.set(
        (eulerAngles.pitch * Math.PI) / 180,
        (eulerAngles.yaw * Math.PI) / 180,
        (eulerAngles.roll * Math.PI) / 180
      );
    }
  }, [eulerAngles]);

 // Update 3D Transformations every frame from 6-DOF telemetry
 useEffect(() => {
 if (viewMode === 'puck' && puckGroupRef.current) {
 const capGroup = puckGroupRef.current.getObjectByName('capGroup');
 if (capGroup) {
 capGroup.position.x = (state.x || 0) * 0.45;
 capGroup.position.z = -(state.y || 0) * 0.45;
 capGroup.position.y = (state.z || 0) * 0.35;

 capGroup.rotation.x = -(state.rx || 0) * 0.35;
 capGroup.rotation.z = -(state.ry || 0) * 0.35;
 capGroup.rotation.y = -(state.rz || 0) * 0.55;
 }
 } else if (viewMode === 'cad_scene' && cameraRef.current) {
 const s = cadCameraState.current;
 const speed = 0.05;

 s.rotY += (state.rz || 0) * speed * 0.8;
 s.rotX += (state.rx || 0) * speed * 0.8;
 s.rotX = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, s.rotX));

 s.panX += (state.x || 0) * speed * 0.6;
 s.panY += (state.y || 0) * speed * 0.6;

 s.distance += -(state.z || 0) * speed * 1.5;
 s.distance = Math.max(2, Math.min(18, s.distance));

 const cam = cameraRef.current;
 const posX = s.panX + s.distance * Math.sin(s.rotY) * Math.cos(s.rotX);
 const posY = s.panY + s.distance * Math.sin(s.rotX);
 const posZ = s.distance * Math.cos(s.rotY) * Math.cos(s.rotX);

 cam.position.set(posX, posY, posZ);
 cam.lookAt(s.panX, s.panY, 0);
 }
 }, [state, viewMode]);

 const resetCadCamera = () => {
 cadCameraState.current = {
 distance: 6,
 rotX: 0.4,
 rotY: 0.6,
 panX: 0,
 panY: 0,
 };
 };

 return (
 <div className="relative w-full h-full min-h-[400px] rounded-2xl overflow-hidden neo-panel bg-[#141822] border border-transparent shadow-2xl flex flex-col">
 {/* Visualizer Top Bar Controls */}
 <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
 {/* View Mode Toggle */}
 <div className="flex items-center gap-1 p-1 neo-panel backdrop-blur-xl/90 backdrop-blur-md rounded-xl border border-transparent shadow-xl pointer-events-auto">
 <button
 onClick={() => setViewMode('puck')}
 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
 viewMode === 'puck'
 ? 'bg-blue-600 text-black font-semibold shadow-sm'
 : 'text-zinc-400 hover:text-white'
 }`}
 >
 <Orbit className="w-3.5 h-3.5" />
 <span>3D SpaceMouse Model</span>
 </button>
 <button
 onClick={() => setViewMode('cad_scene')}
 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
 viewMode === 'cad_scene'
 ? 'bg-blue-600 text-black font-semibold shadow-sm'
 : 'text-zinc-400 hover:text-white'
 }`}
 >
 <Box className="w-3.5 h-3.5" />
 <span>CAD Viewport</span>
 </button>
 </div>

 {/* CAD Scene Options */}
 {viewMode === 'cad_scene' && (
 <div className="flex items-center gap-2 pointer-events-auto">
 <div className="flex items-center gap-1 p-1 neo-panel backdrop-blur-xl/90 backdrop-blur-md rounded-xl border border-transparent text-xs">
 <button
 onClick={() => setCadModelType('turbine')}
 className={`px-2.5 py-1 rounded-lg transition ${cadModelType === 'turbine' ? 'bg-blue-600 text-black font-semibold' : 'text-zinc-400 hover:text-white'}`}
 >
 Turbine
 </button>
 <button
 onClick={() => setCadModelType('bracket')}
 className={`px-2.5 py-1 rounded-lg transition ${cadModelType === 'bracket' ? 'bg-blue-600 text-black font-semibold' : 'text-zinc-400 hover:text-white'}`}
 >
 Bracket
 </button>
 <button
 onClick={() => setCadModelType('torus')}
 className={`px-2.5 py-1 rounded-lg transition ${cadModelType === 'torus' ? 'bg-blue-600 text-black font-semibold' : 'text-zinc-400 hover:text-white'}`}
 >
 Knot
 </button>
 </div>
 <button
 onClick={() => setWireframe(!wireframe)}
 className={`p-2 rounded-xl border transition ${
 wireframe ? 'bg-blue-600 text-black border-cyan-400' : 'neo-panel backdrop-blur-xl/90 border-transparent text-zinc-400 hover:text-white'
 }`}
 title="Toggle Wireframe"
 >
 <Layers className="w-3.5 h-3.5" />
 </button>
 <button
 onClick={resetCadCamera}
 className="p-2 rounded-xl neo-panel backdrop-blur-xl/90 border border-transparent text-zinc-400 hover:text-white transition"
 title="Reset Camera (Home View)"
 >
 <RefreshCw className="w-3.5 h-3.5" />
 </button>
 </div>
 )}
 </div>

  {/* 3D Canvas Mount Point */}
  <div ref={containerRef} className="w-full flex-1 cursor-grab active:cursor-grabbing" />

  {/* Calibration Interactive Overlay */}
  {calibrationMode && viewMode === 'puck' && onEulerChange && onInvertChange && (
    <div className="absolute bottom-3 left-3 right-3 p-4 rounded-xl neo-panel backdrop-blur-xl/90 backdrop-blur-md border border-blue-500/30 flex flex-col gap-4 z-20">
      <div className="flex justify-between items-center text-xs font-semibold text-blue-400">
        <div className="flex items-center gap-2"><Sparkles className="w-4 h-4" /> 3D Orientation Calibration</div>
        <div className="text-zinc-400 font-normal">Grab the 3D rings above, or use the sliders below.</div>
      </div>
      
      {/* Mini Sliders */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Yaw (Z)', val: eulerAngles.yaw, set: (v: number) => onEulerChange({ ...eulerAngles, yaw: v }) },
          { label: 'Pitch (X)', val: eulerAngles.pitch, set: (v: number) => onEulerChange({ ...eulerAngles, pitch: v }) },
          { label: 'Roll (Y)', val: eulerAngles.roll, set: (v: number) => onEulerChange({ ...eulerAngles, roll: v }) },
        ].map((axis, i) => (
          <div key={i} className="flex flex-col gap-1">
            <div className="flex justify-between text-[10px] text-zinc-300">
              <span>{axis.label}</span>
              <span className="text-blue-400">{axis.val}°</span>
            </div>
            <input type="range" min="-180" max="180" step="1" value={axis.val} onChange={(e) => axis.set(parseInt(e.target.value))} className="w-full accent-blue-500 h-1 bg-zinc-800 rounded-lg appearance-none" />
          </div>
        ))}
      </div>

      {/* Invert Toggles */}
      <div className="flex items-center gap-4 pt-2 border-t border-zinc-800">
        <span className="text-[10px] text-zinc-500 uppercase font-semibold">Invert Hardware Polarity:</span>
        {[
          { label: 'X Axis', val: invertAxes.x, set: (v: boolean) => onInvertChange({ ...invertAxes, x: v }) },
          { label: 'Y Axis', val: invertAxes.y, set: (v: boolean) => onInvertChange({ ...invertAxes, y: v }) },
          { label: 'Z Axis', val: invertAxes.z, set: (v: boolean) => onInvertChange({ ...invertAxes, z: v }) },
        ].map((inv, i) => (
          <label key={i} className="flex items-center gap-1.5 cursor-pointer text-[10px] text-zinc-300">
            <input type="checkbox" checked={inv.val} onChange={(e) => inv.set(e.target.checked)} className="w-3 h-3 rounded border-zinc-700 bg-zinc-900 text-blue-500" />
            {inv.label}
          </label>
        ))}
      </div>
    </div>
  )}

  {/* Bottom Telemetry Overlay (Hidden during calibration) */}
  {(!calibrationMode || viewMode !== 'puck') && (
    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none text-xs">
    <div className="px-3 py-1.5 rounded-xl neo-panel backdrop-blur-xl/90 backdrop-blur-md border border-transparent text-zinc-300 flex items-center gap-2 text-xs">
    <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: ledColor }} />
    <span>{viewMode === 'puck' ? '6-DOF Live Deflection & Halo Ring' : 'CAD Orbit / Pan / Zoom Testing'}</span>
    </div>
    {isSimulating && (
    <div className="px-3 py-1.5 rounded-xl bg-blue-500/20 border border-amber-500/50 text-blue-400 text-xs font-semibold">
    Simulating with Keyboard (W/A/S/D/Q/E)
    </div>
    )}
    </div>
  )}
  </div>
 );
};
