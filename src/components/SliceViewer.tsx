import { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { PIZZAS } from '../config/pizzaConfig';

// Componente cargador para modelos GLTF de rebanada
function GltfModel({ path, ...props }: { path: string; [key: string]: any }) {
  const { scene } = useGLTF(path);
  const clone = scene.clone();
  
  clone.traverse((child: any) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return <primitive object={clone} {...props} />;
}

interface SliceViewerProps {
  pizzaType: string;
}

function Slice3D({ pizzaType }: { pizzaType: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const activePizza = PIZZAS.find((p) => p.id === pizzaType);

  useFrame((_state, delta) => {
    if (groupRef.current) {
      // Slow rotation on Y and slight rocking on X/Z
      groupRef.current.rotation.y += delta * 0.4;
      groupRef.current.rotation.x = Math.sin(_state.clock.getElapsedTime() * 0.8) * 0.1;
    }
  });

  // Topping positions specific to a single 1/8 slice (wedge)
  // The wedge is from -22.5 to +22.5 degrees (around the positive X-axis if rotated, or let's place it facing positive Z)
  // Let's place toppings within the sector: angle in [-Math.PI / 8, Math.PI / 8]
  const sliceToppings = [
    { r: 0.4, a: -0.05, s: 1.1 },
    { r: 0.65, a: 0.1, s: 0.95 },
    { r: 0.7, a: -0.12, s: 1.0 },
    { r: 0.9, a: 0.02, s: 0.85 },
    { r: 0.5, a: 0.08, s: 0.9 },
  ];

  // Renderiza el modelo procedural como fallback o por defecto
  const renderProceduralSlice = () => (
    <group position={[-0.4, 0, 0]}>
      {/* Cheese layer (top of wedge) */}
      <mesh position={[0, 0.03, 0]} castShadow receiveShadow>
        <cylinderGeometry
          args={[
            1.0,        // radiusTop
            1.0,        // radiusBottom
            0.02,       // height
            16,         // radialSegments
            1,          // heightSegments
            false,      // openEnded
            -Math.PI/8, // thetaStart
            Math.PI/4   // thetaLength
          ]}
        />
        <meshStandardMaterial
          color={pizzaType === 'four_cheese' ? '#ffeb3b' : '#ffc107'}
          roughness={0.45}
          metalness={0.05}
        />
      </mesh>

      {/* Sauce layer */}
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <cylinderGeometry
          args={[
            1.03,
            1.03,
            0.015,
            16,
            1,
            false,
            -Math.PI/8 - 0.01,
            Math.PI/4 + 0.02
          ]}
        />
        <meshStandardMaterial color="#b71c1c" roughness={0.8} />
      </mesh>

      {/* Dough/Bread wedge */}
      <mesh position={[0, 0.01, 0]} castShadow receiveShadow>
        <cylinderGeometry
          args={[
            1.05,
            1.05,
            0.04,
            16,
            1,
            false,
            -Math.PI/8 - 0.02,
            Math.PI/4 + 0.04
          ]}
        />
        <meshStandardMaterial color="#dfa96d" roughness={0.9} />
      </mesh>

      {/* Outer Crust Rim (Torus sector) */}
      <mesh
        position={[0, 0.035, 0]}
        rotation={[Math.PI / 2, 0, Math.PI / 2]}
        castShadow
      >
        <torusGeometry
          args={[
            1.0,
            0.065,
            12,
            24,
            Math.PI / 4
          ]}
        />
        <meshStandardMaterial color="#d78e34" roughness={0.85} />
      </mesh>

      {/* Wedge side cuts */}
      <mesh
        position={[
          Math.cos(-Math.PI / 8) * 0.5,
          0.01,
          Math.sin(-Math.PI / 8) * 0.5
        ]}
        rotation={[0, Math.PI / 8, 0]}
        receiveShadow
      >
        <boxGeometry args={[1.0, 0.06, 0.01]} />
        <meshStandardMaterial color="#f0d3b7" roughness={0.9} />
      </mesh>

      <mesh
        position={[
          Math.cos(Math.PI / 8) * 0.5,
          0.01,
          Math.sin(Math.PI / 8) * 0.5
        ]}
        rotation={[0, -Math.PI / 8, 0]}
        receiveShadow
      >
        <boxGeometry args={[1.0, 0.06, 0.01]} />
        <meshStandardMaterial color="#f0d3b7" roughness={0.9} />
      </mesh>

      {/* Toppings */}
      {sliceToppings.map((top, idx) => {
        const xVal = Math.cos(top.a) * top.r;
        const zVal = Math.sin(top.a) * top.r;

        if (pizzaType === 'pepperoni') {
          return (
            <mesh
              key={idx}
              position={[xVal, 0.045, zVal]}
              scale={[top.s * 0.8, 1, top.s * 0.8]}
              castShadow
            >
              <cylinderGeometry args={[0.08, 0.08, 0.012, 16]} />
              <meshStandardMaterial color="#ac2222" roughness={0.65} />
            </mesh>
          );
        }

        if (pizzaType === 'margherita') {
          if (idx % 2 === 0) {
            return (
              <mesh
                key={idx}
                position={[xVal, 0.045, zVal]}
                rotation={[0.1, Math.random(), 0.1]}
                scale={[top.s * 0.6, 0.2, top.s * 1.1]}
                castShadow
              >
                <boxGeometry args={[0.06, 0.01, 0.12]} />
                <meshStandardMaterial color="#1b5e20" roughness={0.9} />
              </mesh>
            );
          }
          return (
            <mesh
              key={idx}
              position={[xVal, 0.043, zVal]}
              scale={[top.s * 0.8, 1, top.s * 0.8]}
              castShadow
            >
              <cylinderGeometry args={[0.06, 0.06, 0.014, 8]} />
              <meshStandardMaterial color="#d32f2f" roughness={0.6} />
            </mesh>
          );
        }

        if (pizzaType === 'vegetarian') {
          if (idx % 2 === 0) {
            return (
              <group key={idx} position={[xVal, 0.045, zVal]} rotation={[0.1, idx, 0]}>
                <mesh castShadow>
                  <sphereGeometry args={[0.045, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
                  <meshStandardMaterial color="#d7ccc8" roughness={0.9} />
                </mesh>
                <mesh position={[0, -0.025, 0]}>
                  <cylinderGeometry args={[0.018, 0.018, 0.04, 8]} />
                  <meshStandardMaterial color="#efebe9" roughness={0.9} />
                </mesh>
              </group>
            );
          }
          return (
            <mesh
              key={idx}
              position={[xVal, 0.042, zVal]}
              rotation={[0, Math.random(), 0]}
              scale={[top.s * 0.6, 1, top.s * 0.7]}
              castShadow
            >
              <torusGeometry args={[0.05, 0.012, 8, 12, Math.PI]} />
              <meshStandardMaterial color="#2e7d32" roughness={0.6} />
            </mesh>
          );
        }

        if (pizzaType === 'four_cheese') {
          if (idx % 2 === 0) {
            return (
              <mesh
                key={idx}
                position={[xVal, 0.042, zVal]}
                scale={[top.s * 1.0, 0.25, top.s * 1.0]}
                castShadow
              >
                <sphereGeometry args={[0.06, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color="#fffde6" roughness={0.8} />
              </mesh>
            );
          }
          return (
            <mesh
              key={idx}
              position={[xVal, 0.041, zVal]}
              scale={[top.s * 0.5, 0.1, top.s * 0.5]}
            >
              <sphereGeometry args={[0.05, 6, 6]} />
              <meshStandardMaterial color="#78909c" roughness={0.9} />
            </mesh>
          );
        }

        return null;
      })}
    </group>
  );

  return (
    <group ref={groupRef}>
      {activePizza?.sliceGlbPath ? (
        <Suspense fallback={renderProceduralSlice()}>
          <GltfModel path={activePizza.sliceGlbPath} scale={1.15} position={[0, -0.05, 0]} />
        </Suspense>
      ) : (
        renderProceduralSlice()
      )}
    </group>
  );
}

export default function SliceViewer({ pizzaType }: SliceViewerProps) {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas
        shadows
        camera={{ position: [0, 1.5, 3.2], fov: 40 }}
        gl={{ antialias: true }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 5, 2]} intensity={1.5} castShadow />
        <pointLight position={[-2, 3, -1]} intensity={0.5} color="#ffd54f" />

        <group position={[0, -0.1, 0]}>
          <Slice3D pizzaType={pizzaType} />
          <ContactShadows
            position={[0, -0.06, 0]}
            opacity={0.6}
            scale={2.2}
            blur={1.2}
            far={1.5}
          />
        </group>

        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={1.5}
          maxDistance={5}
          autoRotate={false}
        />
      </Canvas>
    </div>
  );
}
