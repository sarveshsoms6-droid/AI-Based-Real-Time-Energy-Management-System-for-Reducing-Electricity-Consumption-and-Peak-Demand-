import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useSimulation } from '../../context/SimulationContext';
import { RoomState, FloorId, RoomId } from '../../types';
import { Layers, RotateCw, Sparkles } from 'lucide-react';

interface Building3DViewProps {
  onSelectRoom?: (roomId: RoomId) => void;
}

export const Building3DView: React.FC<Building3DViewProps> = ({ onSelectRoom }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const { rooms, activeFloorView, setActiveFloorView, setSelectedRoomId } = useSimulation();

  const [hoveredRoom, setHoveredRoom] = useState<RoomState | null>(null);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [floorFilter, setFloorFilter] = useState<'all' | '1' | '2'>('all');

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const roomMeshesRef = useRef<Map<RoomId, THREE.Mesh>>(new Map());
  const animationFrameIdRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const previousMousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Get color for room status on light theme
  const getStatusColor = (status: RoomState['status']) => {
    switch (status) {
      case 'low':
        return 0x2E7D5B; // Calm Green
      case 'normal':
        return 0x1D4ED8; // Blue
      case 'high':
        return 0xD97706; // Amber
      case 'critical':
        return 0xD64545; // Calm Red
      default:
        return 0x0284C7;
    }
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene with off-white background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xF7F5F0);
    scene.fog = new THREE.FogExp2(0xF7F5F0, 0.012);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(38, 28, 48);
    camera.lookAt(0, 4, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting for light background
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight1.position.set(25, 45, 25);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xE2E8F0, 0.7);
    dirLight2.position.set(-20, 25, -20);
    scene.add(dirLight2);

    // Ground Grid on off-white
    const gridHelper = new THREE.GridHelper(60, 30, 0xD3CEC4, 0xE7E3DA);
    gridHelper.position.y = -0.05;
    scene.add(gridHelper);

    // Foundation Base
    const baseGeo = new THREE.BoxGeometry(44, 0.6, 26);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0xE7E3DA,
      roughness: 0.9,
      metalness: 0.1,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -0.3;
    scene.add(baseMesh);

    // Group for Building
    const buildingGroup = new THREE.Group();
    buildingGroup.name = 'building';
    scene.add(buildingGroup);

    const roomOffsets: Record<string, { x: number; z: number; width: number; depth: number }> = {
      cr1: { x: -13, z: -7.5, width: 8.5, depth: 6.5 },
      cr2: { x: -13, z: 0, width: 8.5, depth: 6.5 },
      cr3: { x: -13, z: 7.5, width: 8.5, depth: 6.5 },
      ca: { x: 5, z: -5, width: 14, depth: 9 },
      cp: { x: 5, z: 6, width: 14, depth: 9 },
    };

    const roomMeshes = new Map<RoomId, THREE.Mesh>();
    const floorHeights = { 1: 3.5, 2: 10.5 };

    rooms.forEach((room) => {
      let layoutKey = 'cr1';
      if (room.id.includes('101') || room.id.includes('201') || room.timetableRoomCode === 'CR101' || room.timetableRoomCode === 'CR104') layoutKey = 'cr1';
      else if (room.id.includes('102') || room.id.includes('202') || room.timetableRoomCode === 'CR102' || room.timetableRoomCode === 'CR105') layoutKey = 'cr2';
      else if (room.id.includes('103') || room.id.includes('203') || room.timetableRoomCode === 'CR103') layoutKey = 'cr3';
      else if (room.id.includes('ca_lab') || room.timetableRoomCode === 'LAB1' || room.timetableRoomCode === 'LAB3') layoutKey = 'ca';
      else if (room.id.includes('cp_lab') || room.timetableRoomCode === 'LAB2' || room.timetableRoomCode === 'LAB4') layoutKey = 'cp';

      const layout = roomOffsets[layoutKey];
      const yPos = floorHeights[room.floor];
      const roomHeight = 4.8;

      const geom = new THREE.BoxGeometry(layout.width, roomHeight, layout.depth);
      const color = getStatusColor(room.status);

      const mat = new THREE.MeshStandardMaterial({
        color,
        transparent: true,
        opacity: 0.78,
        roughness: 0.3,
        metalness: 0.1,
      });

      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(layout.x, yPos, layout.z);
      mesh.userData = { roomId: room.id, floor: room.floor };

      const edges = new THREE.EdgesGeometry(geom);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x3E4C59,
        linewidth: 1.5,
        transparent: true,
        opacity: 0.7,
      });
      const wireframe = new THREE.LineSegments(edges, lineMat);
      mesh.add(wireframe);

      buildingGroup.add(mesh);
      roomMeshes.set(room.id, mesh);
    });

    roomMeshesRef.current = roomMeshes;

    // Floor Slabs
    const slabGeo = new THREE.BoxGeometry(40, 0.4, 24);
    const slabMat = new THREE.MeshStandardMaterial({
      color: 0xD3CEC4,
      transparent: true,
      opacity: 0.85,
    });
    const floor1Ceiling = new THREE.Mesh(slabGeo, slabMat);
    floor1Ceiling.position.y = 6.4;
    buildingGroup.add(floor1Ceiling);

    const floor2Roof = new THREE.Mesh(slabGeo, slabMat);
    floor2Roof.position.y = 13.4;
    buildingGroup.add(floor2Roof);

    // Energy Conduit line
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-20, 0, 0),
      new THREE.Vector3(-20, 6.4, 0),
      new THREE.Vector3(0, 6.4, 0),
      new THREE.Vector3(0, 13.4, 0),
      new THREE.Vector3(15, 13.4, 0),
    ]);
    const conduitGeo = new THREE.TubeGeometry(curve, 40, 0.15, 8, false);
    const conduitMat = new THREE.MeshBasicMaterial({ color: 0x1D4ED8, wireframe: true });
    const conduitMesh = new THREE.Mesh(conduitGeo, conduitMat);
    buildingGroup.add(conduitMesh);

    // Mouse Interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / height) * 2 + 1;

      if (isDraggingRef.current) {
        const deltaX = event.clientX - previousMousePositionRef.current.x;
        buildingGroup.rotation.y += deltaX * 0.008;
        previousMousePositionRef.current = { x: event.clientX, y: event.clientY };
      }

      raycaster.setFromCamera(mouse, camera);
      const meshesArray = Array.from(roomMeshes.values());
      const intersects = raycaster.intersectObjects(meshesArray);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const hitRoomId = hit.userData.roomId as RoomId;
        const matched = rooms.find((r) => r.id === hitRoomId);
        setHoveredRoom(matched || null);
        container.style.cursor = 'pointer';
      } else {
        setHoveredRoom(null);
        container.style.cursor = isDraggingRef.current ? 'grabbing' : 'default';
      }
    };

    const onMouseDown = (event: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: event.clientX, y: event.clientY };
    };

    const onMouseUp = (event: MouseEvent) => {
      isDraggingRef.current = false;

      const rect = container.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const meshesArray = Array.from(roomMeshes.values());
      const intersects = raycaster.intersectObjects(meshesArray);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const clickedRoomId = hit.userData.roomId as RoomId;
        setSelectedRoomId(clickedRoomId);
        if (onSelectRoom) onSelectRoom(clickedRoomId);
      }
    };

    const onResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      cameraRef.current.aspect = newW / newH;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newW, newH);
    };

    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('resize', onResize);

    let clock = new THREE.Clock();
    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (autoRotate && !isDraggingRef.current) {
        buildingGroup.rotation.y += delta * 0.2;
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameIdRef.current);
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', onResize);
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Sync Room Status Colors
  useEffect(() => {
    roomMeshesRef.current.forEach((mesh, roomId) => {
      const room = rooms.find((r) => r.id === roomId);
      if (!room) return;

      const mat = mesh.material as THREE.MeshStandardMaterial;
      const color = getStatusColor(room.status);
      mat.color.setHex(color);

      if (floorFilter === 'all') {
        mesh.visible = true;
      } else if (floorFilter === '1') {
        mesh.visible = room.floor === 1;
      } else if (floorFilter === '2') {
        mesh.visible = room.floor === 2;
      }
    });
  }, [rooms, floorFilter]);

  return (
    <div className="relative w-full h-[520px] rounded-2xl overflow-hidden border border-border-soft bg-page shadow-card">
      <div ref={mountRef} className="w-full h-full" />

      {/* Top Floating Controls */}
      <div className="absolute top-4 left-4 flex items-center space-x-2 z-10">
        <div className="bg-white/95 backdrop-blur-md border border-border-soft p-1 rounded-xl flex items-center space-x-1 text-xs font-mono shadow-sm">
          <Layers className="w-3.5 h-3.5 text-savings ml-1.5 mr-0.5" />
          <button
            onClick={() => setFloorFilter('all')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              floorFilter === 'all' ? 'bg-savings text-white font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Floors
          </button>
          <button
            onClick={() => setFloorFilter('1')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              floorFilter === '1' ? 'bg-cit-blue text-white font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Floor 1
          </button>
          <button
            onClick={() => setFloorFilter('2')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              floorFilter === '2' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Floor 2
          </button>
        </div>

        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`p-2 rounded-xl border border-border-soft backdrop-blur-md text-xs font-mono flex items-center space-x-1 transition-all shadow-sm ${
            autoRotate
              ? 'bg-savings-light text-savings font-bold'
              : 'bg-white text-slate-600'
          }`}
          title="Toggle Auto-Rotation"
        >
          <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Auto Orbit</span>
        </button>
      </div>

      {/* Legend & Simulation Notice */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md border border-border-soft px-3.5 py-2.5 rounded-xl z-10 text-[11px] font-mono space-y-1.5 shadow-sm">
        <div className="text-[10px] text-slate-900 font-bold uppercase tracking-wider mb-1 flex items-center space-x-1">
          <Sparkles className="w-3 h-3 text-savings" />
          <span>Real-Time Status Colors</span>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-savings" />
            <span className="text-slate-700">Low (&lt;30%)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cit-blue" />
            <span className="text-slate-700">Normal</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-warning" />
            <span className="text-slate-700">High (&gt;75%)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-wastage" />
            <span className="text-slate-700">Critical (&gt;90%)</span>
          </div>
        </div>
      </div>

      {/* Hover Info Tooltip */}
      {hoveredRoom && (
        <div className="absolute top-4 right-4 bg-white border border-border-soft p-4 rounded-xl shadow-modal z-20 w-64 text-xs font-mono transition-all animate-in fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-border-soft">
            <span className="font-bold text-slate-900 text-sm">{hoveredRoom.name}</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                hoveredRoom.status === 'critical'
                  ? 'bg-wastage-light text-wastage'
                  : hoveredRoom.status === 'high'
                  ? 'bg-amber-50 text-warning'
                  : hoveredRoom.status === 'normal'
                  ? 'bg-blue-50 text-cit-blue'
                  : 'bg-savings-light text-savings'
              }`}
            >
              {hoveredRoom.status}
            </span>
          </div>

          <div className="mt-2 space-y-1 text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-500">Demand:</span>
              <span className="text-slate-900 font-bold">{hoveredRoom.currentPowerKW.toFixed(2)} kW</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Connected:</span>
              <span>{hoveredRoom.connectedLoadKW} kW</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Temperature:</span>
              <span className="font-semibold text-warning">{hoveredRoom.envParams.indoorTemp.toFixed(1)} °C</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Active Loads:</span>
              <span>{hoveredRoom.activeApplianceCount} / {hoveredRoom.totalApplianceCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Timetable Code:</span>
              <span className="text-savings font-bold">{hoveredRoom.timetableRoomCode || 'CR101'}</span>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-border-soft text-[10px] text-slate-500 text-center">
            Click to configure switches
          </div>
        </div>
      )}
    </div>
  );
};
