import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { SixDofState } from '../types';
import { Box, Eye, Layers, RefreshCw, Sparkles, Orbit } from 'lucide-react';

interface Visualizer3DProps {
  state: SixDofState;
  ledColor?: string;
  isSimulating?: boolean;
}

export const Visualizer3D: React.FC<Visualizer3DProps> = ({
  state,
  ledColor = '#ff8800',
  isSimulating = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'puck' | 'cad_scene'>('puck');
  const [cadModelType, setCadModelType] = useState<'turbine' | 'bracket' | 'torus'>('turbine');
  const [wireframe, setWireframe] = useState<boolean>(false);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const puckGroupRef = useRef<THREE.Group | null>(null);
  const cadGroupRef = useRef<THREE.Group | null>(null);
  const ledMeshRef = useRef<THREE.Mesh | null>(null);

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
    const height = containerRef.current.clientHeight || 360;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06080c); // Deep Cyber Black
    sceneRef.current = scene;

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 3.8, 6.5);
    camera.lookAt(0, 0.4, 0);
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

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(5, 10, 7);
    dirLight1.castShadow = true;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x06b6d4, 0.8); // Cyan rim light
    dirLight2.position.set(-5, 3, -5);
    scene.add(dirLight2);

    // 5. Build SpaceMouse Puck Model
    const puckMaster = new THREE.Group();
    puckGroupRef.current = puckMaster;

    // Base pedestal
    const baseGeo = new THREE.CylinderGeometry(2.0, 2.3, 0.5, 48);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x111620,
      metalness: 0.85,
      roughness: 0.25,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -0.25;
    baseMesh.receiveShadow = true;
    puckMaster.add(baseMesh);

    // LED Glow Ring
    const ledGeo = new THREE.TorusGeometry(1.95, 0.05, 16, 64);
    const ledMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(ledColor) });
    const ledMesh = new THREE.Mesh(ledGeo, ledMat);
    ledMesh.rotation.x = Math.PI / 2;
    ledMesh.position.y = 0.02;
    puckMaster.add(ledMesh);
    ledMeshRef.current = ledMesh;

    // Center moving Cap / Knob
    const capGroup = new THREE.Group();
    capGroup.name = 'capGroup';

    // Rubber ring
    const capBaseGeo = new THREE.CylinderGeometry(1.6, 1.7, 0.9, 48);
    const capBaseMat = new THREE.MeshStandardMaterial({
      color: 0x1e2736,
      metalness: 0.3,
      roughness: 0.7,
    });
    const capBase = new THREE.Mesh(capBaseGeo, capBaseMat);
    capBase.position.y = 0.55;
    capGroup.add(capBase);

    // Ergonomic concave top cap
    const capTopGeo = new THREE.CylinderGeometry(1.5, 1.6, 0.4, 48);
    const capTopMat = new THREE.MeshStandardMaterial({
      color: 0x090c12,
      metalness: 0.9,
      roughness: 0.15,
    });
    const capTop = new THREE.Mesh(capTopGeo, capTopMat);
    capTop.position.y = 1.1;
    capGroup.add(capTop);

    // Aluminum Trim Ring
    const ringGeo = new THREE.TorusGeometry(1.62, 0.04, 16, 48);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.95, roughness: 0.1 });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = 0.98;
    capGroup.add(ringMesh);

    // 6-Axis Coordinate Arrows (Gizmo on Cap)
    const axesGizmo = new THREE.AxesHelper(1.2);
    axesGizmo.position.y = 1.4;
    capGroup.add(axesGizmo);

    puckMaster.add(capGroup);
    scene.add(puckMaster);

    // 6. Build CAD Geometry Assembly for CAD testing mode
    const cadMaster = new THREE.Group();
    cadGroupRef.current = cadMaster;
    cadMaster.visible = false;

    // Grid Floor
    const grid = new THREE.GridHelper(10, 20, 0x06b6d4, 0x1e2632);
    grid.position.y = -1.5;
    cadMaster.add(grid);

    scene.add(cadMaster);

    // ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight || 360;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    });
    resizeObserver.observe(containerRef.current);

    // Animation Loop
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
      renderer.dispose();
    };
  }, []);

  // Update LED Color
  useEffect(() => {
    if (ledMeshRef.current) {
      (ledMeshRef.current.material as THREE.MeshBasicMaterial).color.set(ledColor);
    }
  }, [ledColor]);

  // Update CAD Model Mesh when switching types or wireframe
  useEffect(() => {
    if (!cadGroupRef.current) return;
    const cadGroup = cadGroupRef.current;

    // Remove old mesh (keep grid)
    const oldMesh = cadGroup.getObjectByName('cadModel');
    if (oldMesh) cadGroup.remove(oldMesh);

    let geo: THREE.BufferGeometry;
    if (cadModelType === 'turbine') {
      // Create multi-blade impeller
      const group = new THREE.Group();
      group.name = 'cadModel';
      const hub = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.9, 1.2, 32),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.8, roughness: 0.2, wireframe })
      );
      group.add(hub);

      for (let i = 0; i < 8; i++) {
        const blade = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 1.1, 1.4),
          new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.6, roughness: 0.3, wireframe })
        );
        blade.position.set(Math.sin((i / 8) * Math.PI * 2) * 1.1, 0, Math.cos((i / 8) * Math.PI * 2) * 1.1);
        blade.rotation.y = (i / 8) * Math.PI * 2 + 0.4;
        blade.rotation.z = 0.3;
        group.add(blade);
      }
      cadGroup.add(group);
    } else if (cadModelType === 'bracket') {
      // Mechanical Bracket
      const group = new THREE.Group();
      group.name = 'cadModel';
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 0.4, 2.0),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.7, roughness: 0.3, wireframe })
      );
      const upright = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 2.0, 2.0),
        new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.7, roughness: 0.3, wireframe })
      );
      upright.position.set(-1.0, 1.0, 0);
      const boss = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.6, 0.6, 24),
        new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.9, roughness: 0.2, wireframe })
      );
      boss.rotation.z = Math.PI / 2;
      boss.position.set(-0.8, 1.4, 0);
      group.add(base, upright, boss);
      cadGroup.add(group);
    } else {
      // Knot Torus
      const mesh = new THREE.Mesh(
        new THREE.TorusKnotGeometry(1.1, 0.35, 100, 16),
        new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.8, roughness: 0.2, wireframe })
      );
      mesh.name = 'cadModel';
      cadGroup.add(mesh);
    }
  }, [cadModelType, wireframe]);

  // Update View Mode Visibility
  useEffect(() => {
    if (puckGroupRef.current && cadGroupRef.current && cameraRef.current) {
      if (viewMode === 'puck') {
        puckGroupRef.current.visible = true;
        cadGroupRef.current.visible = false;
        cameraRef.current.position.set(0, 3.8, 6.5);
        cameraRef.current.lookAt(0, 0.4, 0);
      } else {
        puckGroupRef.current.visible = false;
        cadGroupRef.current.visible = true;
      }
    }
  }, [viewMode]);

  // Update 3D Transformations every frame from 6-DOF telemetry
  useEffect(() => {
    if (viewMode === 'puck' && puckGroupRef.current) {
      const capGroup = puckGroupRef.current.getObjectByName('capGroup');
      if (capGroup) {
        // Linear deflection mapping
        capGroup.position.x = (state.x || 0) * 0.45;
        capGroup.position.z = -(state.y || 0) * 0.45; // Pan Y maps to screen depth
        capGroup.position.y = (state.z || 0) * 0.35; // Pan Z maps to vertical push/pull

        // Angular tilt & twist mapping (Pitch, Roll, Yaw)
        capGroup.rotation.x = -(state.rx || 0) * 0.35;
        capGroup.rotation.z = -(state.ry || 0) * 0.35;
        capGroup.rotation.y = -(state.rz || 0) * 0.55;
      }
    } else if (viewMode === 'cad_scene' && cameraRef.current) {
      // Apply 6-DOF velocity directly to CAD Camera
      const s = cadCameraState.current;
      const speed = 0.05;

      // Orbit Rotations
      s.rotY += (state.rz || 0) * speed * 0.8;
      s.rotX += (state.rx || 0) * speed * 0.8;
      s.rotX = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, s.rotX));

      // Pan Translations
      s.panX += (state.x || 0) * speed * 0.6;
      s.panY += (state.y || 0) * speed * 0.6;

      // Zoom
      s.distance += -(state.z || 0) * speed * 1.5;
      s.distance = Math.max(2, Math.min(18, s.distance));

      // Calculate new camera position
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
    <div className="relative w-full h-full min-h-[380px] rounded-xl overflow-hidden bg-[#06080c] border border-[#1e2632] shadow-2xl flex flex-col glow-cyan-sm">
      {/* Visualizer Top Bar Controls */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        {/* View Mode Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-[#090b0e]/90 backdrop-blur-md rounded-lg border border-[#1e2632] shadow-xl pointer-events-auto">
          <button
            id="view-mode-puck"
            onClick={() => setViewMode('puck')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold font-mono transition-all ${
              viewMode === 'puck'
                ? 'bg-cyan-500 text-black shadow-md glow-cyan-sm font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <Orbit className="w-3.5 h-3.5" />
            <span>SPACEMOUSE PUCK</span>
          </button>
          <button
            id="view-mode-cad"
            onClick={() => setViewMode('cad_scene')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold font-mono transition-all ${
              viewMode === 'cad_scene'
                ? 'bg-cyan-500 text-black shadow-md glow-cyan-sm font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>CAD 3D VIEWPORT</span>
          </button>
        </div>

        {/* CAD Scene Options */}
        {viewMode === 'cad_scene' && (
          <div className="flex items-center gap-2 pointer-events-auto">
            <div className="flex items-center gap-1 p-1 bg-[#090b0e]/90 backdrop-blur-md rounded-lg border border-[#1e2632] text-xs font-mono">
              <button
                onClick={() => setCadModelType('turbine')}
                className={`px-2 py-1 rounded transition-colors ${cadModelType === 'turbine' ? 'bg-cyan-950/80 border border-cyan-500/40 text-cyan-300' : 'text-slate-400 hover:text-white'}`}
              >
                Turbine
              </button>
              <button
                onClick={() => setCadModelType('bracket')}
                className={`px-2 py-1 rounded transition-colors ${cadModelType === 'bracket' ? 'bg-cyan-950/80 border border-cyan-500/40 text-cyan-300' : 'text-slate-400 hover:text-white'}`}
              >
                Bracket
              </button>
              <button
                onClick={() => setCadModelType('torus')}
                className={`px-2 py-1 rounded transition-colors ${cadModelType === 'torus' ? 'bg-cyan-950/80 border border-cyan-500/40 text-cyan-300' : 'text-slate-400 hover:text-white'}`}
              >
                Knot
              </button>
            </div>
            <button
              onClick={() => setWireframe(!wireframe)}
              title="Toggle Wireframe"
              className={`p-2 rounded-lg border transition-all ${
                wireframe ? 'bg-cyan-950/80 border-cyan-500 text-cyan-400' : 'bg-[#090b0e]/90 border-[#1e2632] text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={resetCadCamera}
              title="Recenter Camera (Home View)"
              className="p-2 rounded-lg bg-[#090b0e]/90 border border-[#1e2632] text-slate-400 hover:text-white hover:border-cyan-500/50 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 3D Canvas Mount Point */}
      <div ref={containerRef} className="w-full flex-1 cursor-grab active:cursor-grabbing" />

      {/* Bottom Telemetry Overlay */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none text-xs font-mono">
        <div className="px-3 py-1 rounded-lg bg-[#090b0e]/85 backdrop-blur-md border border-[#1e2632] text-slate-300 flex items-center gap-2 text-[11px]">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: ledColor }} />
          <span>{viewMode === 'puck' ? '6-DOF LIVE DEFLECTION' : 'CAD FREE CAMERA ORBIT / PAN'}</span>
        </div>
        {isSimulating && (
          <div className="px-3 py-1 rounded-lg bg-amber-950/80 border border-amber-600/60 text-amber-300 text-[11px] font-bold glow-amber-sm">
            SIMULATION ACTIVE (W/A/S/D/Q/E)
          </div>
        )}
      </div>
    </div>
  );
};
