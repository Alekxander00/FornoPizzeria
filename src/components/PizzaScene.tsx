import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import PizzaBox from './PizzaBox';

interface PizzaSceneProps {
  pizzaType: string;
  isBoxOpen: boolean;
  onBoxOpenChange: (open: boolean) => void;
  onSliceClick: () => void;
  boxTargetX: number;
}

// Table surface with MaterialesFondo tiled pattern in light cream color
function Table() {
  const texture = useTexture('/MaterialesFondo.png');

  // Configure texture wrap and repetition (tiling)
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  texture.anisotropy = 16;

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[40, 40]} />
      <meshStandardMaterial
        map={texture}
        color="#F1DEC2" // Lighter cream/beige brand color
        roughness={0.7}
        metalness={0.1}
      />
    </mesh>
  );
}

export default function PizzaScene({
  pizzaType,
  isBoxOpen,
  onBoxOpenChange,
  onSliceClick,
  boxTargetX,
}: PizzaSceneProps) {
  return (
    <div className="canvas-container">
      <Canvas
        shadows
        camera={{ position: [0, 3.8, 5.2], fov: 45 }}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
      >
        {/* Soft Ambient Light */}
        <ambientLight intensity={0.5} />

        {/* Directional Key Light */}
        <directionalLight
          castShadow
          position={[4, 7, 3]}
          intensity={1.2}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={25}
          shadow-camera-left={-5}
          shadow-camera-right={5}
          shadow-camera-top={5}
          shadow-camera-bottom={-5}
          shadow-bias={-0.0005}
        />

        {/* Point Light representing ambient warmth */}
        <pointLight position={[0, 2.5, 1]} intensity={0.4} color="#e19d27" />

        <Suspense fallback={null}>
          <group position={[0, -0.5, 0]}>
            {/* The interactive Pizza Box */}
            <PizzaBox
              pizzaType={pizzaType}
              isBoxOpen={isBoxOpen}
              onBoxOpenChange={onBoxOpenChange}
              onSliceClick={onSliceClick}
              targetX={boxTargetX}
            />

            {/* Tiled Cream-Beige Table */}
            <Table />

            {/* Soft shadows under the pizza box */}
            <ContactShadows
              position={[0, 0, 0]}
              opacity={0.65}
              scale={7}
              blur={2.2}
              far={3}
            />
          </group>
        </Suspense>

        {/* Camera Orbit Controls */}
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.05}
          maxPolarAngle={Math.PI / 2 - 0.05} // Stop camera from going below table level
          minDistance={2.0}
          maxDistance={7.5}
          target={[0, 0.1, 0]}
        />
      </Canvas>
    </div>
  );
}
