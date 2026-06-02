import { useRef, useEffect, useState, Suspense, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Html, useGLTF } from '@react-three/drei';
import { PIZZAS } from '../config/pizzaConfig';

const glbNodeMap: { [key: string]: { pizza: string; slice: string } } = {
  pepperoni: { pizza: 'PizzaPeperoni', slice: 'RebanadaPeperoni' },
  margherita: { pizza: 'PizzaMargarita001', slice: 'RebanadaMargarita' },
  vegetarian: { pizza: 'PizzaChampiñones', slice: 'RebanadaChampiñones' },
  four_cheese: { pizza: 'PizzaQueso001', slice: 'RebanadaQueso' },
};

function PizzaModel({ pizzaType }: { pizzaType: string }) {
  const { nodes } = useGLTF('/AllPizzas.glb?v=3');
  const nodeName = glbNodeMap[pizzaType]?.pizza;
  const node = nodes[nodeName];
  const ref = useRef<THREE.Group>(null);

  const { clone, localBounds } = useMemo(() => {
    if (!node) return { clone: null, localBounds: null };
    const c = node.clone();
    c.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // Calculate local bounds of the cloned mesh before it's attached to the scene.
    // Since parent is null, this computes standard static local bounds.
    c.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(c);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    return {
      clone: c,
      localBounds: {
        size,
        center,
        minY: box.min.y,
      },
    };
  }, [node]);

  useEffect(() => {
    if (ref.current && localBounds) {
      const { size, center, minY } = localBounds;

      // Scale pizza so its diameter fills the box interior nicely
      const targetDiameter = 2.35;
      const currentDiameter = Math.max(size.x, size.z);
      const scaleFactor = targetDiameter / currentDiameter;

      ref.current.scale.set(scaleFactor, scaleFactor, scaleFactor);

      // Center horizontally and place the bottom of the pizza at local Y = 0
      // so the parent group controls the final resting height inside the box
      ref.current.position.set(
        -center.x * scaleFactor,
        -minY * scaleFactor,
        -center.z * scaleFactor
      );
    }
  }, [localBounds]);

  if (!clone) return null;

  return (
    <group ref={ref}>
      <primitive object={clone} />
    </group>
  );
}

interface PizzaBoxProps {
  pizzaType: string;
  isBoxOpen: boolean;
  onBoxOpenChange: (open: boolean) => void;
  onSliceClick: () => void;
  targetX: number;
}

interface ToppingPosition {
  x: number;
  z: number;
  rot: number;
  scale: number;
}

export default function PizzaBox({
  pizzaType,
  isBoxOpen,
  onBoxOpenChange,
  onSliceClick,
  targetX,
}: PizzaBoxProps) {
  const pizzaRef = useRef<THREE.Group>(null);
  const groupRef = useRef<THREE.Group>(null);
  const htmlGroupRef = useRef<THREE.Group>(null);

  // Load CAJA PIZZA.glb and create cloned optimized scene
  const { nodes: boxNodes } = useGLTF('/CAJA PIZZA.glb?v=3');

  const { boxScene, lidNode, boxFloorY } = useMemo(() => {
    // Clone meshes to avoid cache sharing issues. Note that useGLTF sanitizes dots to nothing in keys.
    const lid = boxNodes['TapaSuperior002']?.clone();
    const base = boxNodes['TapaInferior']?.clone();
    const group = new THREE.Group();

    if (base) {
      base.traverse((child: any) => {
        if (child.isMesh) {
          child.receiveShadow = true;
          child.castShadow = false; // Disable to prevent shadow acne blinking
        }
      });
      group.add(base);
    }
    
    if (lid) {
      lid.traverse((child: any) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      group.add(lid);
    }

    let floorY = 0.02; // fallback

    // Scale and center the entire group using ONLY the base mesh bounding box
    if (base) {
      const box = new THREE.Box3().setFromObject(base);
      const size = new THREE.Vector3();
      box.getSize(size);
      const center = new THREE.Vector3();
      box.getCenter(center);

      // We want the box to be about 2.7 units wide
      const targetWidth = 2.7;
      const scaleFactor = targetWidth / size.x;
      group.scale.set(scaleFactor, scaleFactor, scaleFactor);

      // Center base horizontally, and set bottom at Y = 0
      group.position.set(
        -center.x * scaleFactor,
        -box.min.y * scaleFactor,
        -center.z * scaleFactor
      );

      // Compute the Y position of the box interior floor.
      // The mesh vertex min.y (v.y=0 in Blender) maps to groupRef y≈0 after
      // applying scale + group.position.y = -box.min.y * scaleFactor.
      // The interior floor is right at this y≈0 level (the bottom cardboard face).
      // We add a tiny 0.015 gap so the pizza sits just above it.
      floorY = 0.015;
    }

    return { boxScene: group, lidNode: lid, baseNode: base, boxFloorY: floorY };
  }, [boxNodes]);

  // Target rotation for the lid (X-axis)
  // Default lid rotation in glTF is 0 (closed) in the new GLB.
  // When opening, we rotate it backward by -1.85 radians (~-105°).
  const targetLidRotation = isBoxOpen ? -1.85 : 0;

  // Generate deterministic topping positions for procedural fallbacks
  const [toppingPositions, setToppingPositions] = useState<ToppingPosition[]>([]);

  useEffect(() => {
    const positions: ToppingPosition[] = [];
    for (let i = 0; i < 18; i++) {
      const angle = (i * Math.PI * 2) / 10 + Math.sin(i) * 0.3;
      const radius = 0.3 + (i % 3) * 0.2 + Math.cos(i) * 0.08;
      positions.push({
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius,
        rot: Math.random() * Math.PI * 2,
        scale: 0.8 + Math.random() * 0.4,
      });
    }
    setToppingPositions(positions);
  }, []);

  useFrame((_state, delta) => {
    // 1. Smoothly open/close the box lid node
    if (lidNode) {
      lidNode.rotation.x = THREE.MathUtils.lerp(
        lidNode.rotation.x,
        targetLidRotation,
        delta * 6.5
      );
    }

    // 2. Rotate the pizza slowly in place
    if (pizzaRef.current) {
      // We rotate the container group, so the pizza spins exactly on its center
      // without orbiting, since it's already centered relative to this group.
      pizzaRef.current.rotation.y += delta * 0.25;
    }

    // 3. Carousel slide transition
    if (groupRef.current) {
      if (Math.abs(groupRef.current.position.x - targetX) > 8) {
        groupRef.current.position.x = targetX;
      } else {
        groupRef.current.position.x = THREE.MathUtils.lerp(
          groupRef.current.position.x,
          targetX,
          delta * 8.0
        );
      }
    }

    // 4. Update the HTML label group position/rotation to match the lid mesh in world space
    // Since htmlGroupRef is a sibling of boxScene under groupRef, we copy boxScene's position
    // and the local quaternion of lidNode to avoid double-translation during carousel sliding.
    if (lidNode && htmlGroupRef.current && boxScene) {
      htmlGroupRef.current.position.copy(boxScene.position);
      htmlGroupRef.current.quaternion.copy(lidNode.quaternion);
    }
  });

  const getPizzaInfo = () => {
    switch (pizzaType) {
      case 'pepperoni':
        return { name: 'Pepperoni Classico', price: '$14.99', ingredients: 'Salsa de tomate, mozzarella, pepperoni curado, orégano.' };
      case 'margherita':
        return { name: 'Margherita Premium', price: '$12.99', ingredients: 'Tomates frescos, mozzarella di bufala, albahaca fresca, aceite de oliva.' };
      case 'vegetarian':
        return { name: 'Orto Vegana', price: '$13.99', ingredients: 'Champiñones, pimentón asado, cebolla morada, albahaca, aceite de ajo.' };
      case 'four_cheese':
        return { name: 'Quattro Formaggi', price: '$15.49', ingredients: 'Salsa blanca, mozzarella, gorgonzola, parmesano, provolone.' };
      default:
        return { name: 'Pizza Especial', price: '$14.00', ingredients: 'Ingredientes seleccionados de la casa.' };
    }
  };

  const info = getPizzaInfo();
  const activePizza = PIZZAS.find((p) => p.id === pizzaType);

  // Fallback: render toppings procedurally
  const renderToppings = () => {
    if (toppingPositions.length === 0) return null;
    return toppingPositions.map((pos, idx) => {
      if (pizzaType === 'pepperoni') {
        return (
          <mesh key={idx} position={[pos.x, 0.045, pos.z]} rotation={[0, pos.rot, 0]} scale={[pos.scale, 1, pos.scale]} castShadow>
            <cylinderGeometry args={[0.1, 0.1, 0.012, 16]} />
            <meshStandardMaterial color="#ac2222" roughness={0.7} />
          </mesh>
        );
      }
      if (pizzaType === 'margherita') {
        if (idx % 2 === 0) {
          return (
            <mesh key={idx} position={[pos.x, 0.045, pos.z]} rotation={[0.1, pos.rot, 0.1]} scale={[pos.scale * 0.7, 0.2, pos.scale * 1.3]} castShadow>
              <boxGeometry args={[0.08, 0.01, 0.15]} />
              <meshStandardMaterial color="#1b5e20" roughness={0.9} />
            </mesh>
          );
        } else {
          return (
            <mesh key={idx} position={[pos.x, 0.042, pos.z]} rotation={[0, pos.rot, 0]} scale={[pos.scale * 0.9, 1, pos.scale * 0.9]} castShadow>
              <cylinderGeometry args={[0.08, 0.08, 0.015, 8]} />
              <meshStandardMaterial color="#e53935" roughness={0.6} />
            </mesh>
          );
        }
      }
      if (pizzaType === 'vegetarian') {
        if (idx % 3 === 0) {
          return (
            <group key={idx} position={[pos.x, 0.045, pos.z]} rotation={[0.2, pos.rot, 0]}>
              <mesh castShadow>
                <sphereGeometry args={[0.05, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color="#d7ccc8" roughness={0.9} />
              </mesh>
              <mesh position={[0, -0.03, 0]}>
                <cylinderGeometry args={[0.02, 0.02, 0.05, 8]} />
                <meshStandardMaterial color="#efebe9" roughness={0.9} />
              </mesh>
            </group>
          );
        }
        if (idx % 3 === 1) {
          return (
            <mesh key={idx} position={[pos.x, 0.042, pos.z]} rotation={[0, pos.rot, 0]} scale={[pos.scale * 0.7, 1, pos.scale * 0.8]} castShadow>
              <torusGeometry args={[0.07, 0.015, 8, 12, Math.PI]} />
              <meshStandardMaterial color="#2e7d32" roughness={0.6} />
            </mesh>
          );
        }
        return (
          <mesh key={idx} position={[pos.x, 0.042, pos.z]} rotation={[0.1, pos.rot, 0]} scale={[pos.scale * 0.8, 1, pos.scale * 0.8]}>
            <torusGeometry args={[0.08, 0.01, 8, 12]} />
            <meshStandardMaterial color="#880e4f" roughness={0.7} />
          </mesh>
        );
      }
      if (pizzaType === 'four_cheese') {
        if (idx % 2 === 0) {
          return (
            <mesh key={idx} position={[pos.x, 0.043, pos.z]} rotation={[0, pos.rot, 0]} scale={[pos.scale * 1.2, 0.3, pos.scale * 1.2]} castShadow>
              <sphereGeometry args={[0.07, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color="#fffae6" roughness={0.8} />
            </mesh>
          );
        }
        return (
          <mesh key={idx} position={[pos.x, 0.041, pos.z]} rotation={[0, pos.rot, 0]} scale={[pos.scale * 0.6, 0.1, pos.scale * 0.6]}>
            <sphereGeometry args={[0.06, 6, 6]} />
            <meshStandardMaterial color="#78909c" roughness={0.9} />
          </mesh>
        );
      }
      return null;
    });
  };

  // Fallback: render pizza body procedurally
  const renderPizzaBody = () => (
    <group>
      <mesh position={[0, 0.03, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.95, 0.95, 0.02, 32]} />
        <meshStandardMaterial color={pizzaType === 'four_cheese' ? '#ffeb3b' : '#ffc107'} roughness={0.5} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <cylinderGeometry args={[0.98, 0.98, 0.015, 32]} />
        <meshStandardMaterial color="#bf360c" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.01, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.0, 1.0, 0.04, 32]} />
        <meshStandardMaterial color="#e0a96d" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.035, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.96, 0.055, 12, 48]} />
        <meshStandardMaterial color="#d78e34" roughness={0.8} />
      </mesh>
    </group>
  );

  const handlePizzaClick = (e: any) => {
    e.stopPropagation();
    if (!isBoxOpen) {
      onBoxOpenChange(true);
    } else {
      onSliceClick();
    }
  };

  return (
    <group ref={groupRef}>
      {/* 3D GLB BOX MODEL */}
      <primitive object={boxScene} onClick={(e: any) => e.stopPropagation()} />

      {/* 3D PIZZA MODEL INSIDE THE BOX */}
      <group
        ref={pizzaRef}
        position={[0, boxFloorY, 0]} // Dynamic: sits exactly on the box interior floor
        onClick={handlePizzaClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        {activePizza?.pizzaGlbPath ? (
          <Suspense fallback={
            <>
              {renderPizzaBody()}
              {renderToppings()}
            </>
          }>
            <PizzaModel pizzaType={pizzaType} />
          </Suspense>
        ) : (
          <>
            {renderPizzaBody()}
            {renderToppings()}
          </>
        )}
      </group>

      {/* DYNAMIC WORLD-BOUND HTML LABEL & LOGO GROUP FOR THE LID */}
      <group ref={htmlGroupRef}>
        {/* LOGO ON THE OUTSIDE OF THE GLB LID (Centered along Z-axis) */}
        <group position={[0, 0.01, 1.35]} rotation={[-Math.PI / 2, 0, 0]}>
          <mesh receiveShadow>
            <ringGeometry args={[0.4, 0.45, 32]} />
            <meshStandardMaterial color="#E19D27" roughness={0.5} />
          </mesh>
          <mesh receiveShadow position={[0, 0, 0.001]}>
            <circleGeometry args={[0.09, 32]} />
            <meshStandardMaterial color="#7C0000" roughness={0.5} />
          </mesh>
        </group>

        {/* PREMIUM INFO LABEL ON THE INSIDE OF THE GLB LID */}
        {isBoxOpen && (
          <Html
            position={[0, -0.27, 1.35]}
            rotation={[Math.PI / 2, 0, 0]}
            transform
            occlude
            distanceFactor={0.95}
            style={{
              transition: 'opacity 0.6s ease',
              pointerEvents: 'none',
            }}
          >
            <div className="pizza-lid-card">
              <span className="pizza-lid-card-title">{info.name}</span>
              <div className="pizza-lid-card-price">{info.price}</div>
              <span className="pizza-lid-card-desc">{info.ingredients}</span>
              <div className="pizza-lid-card-footer">
                Haz clic en la pizza para ver en detalle
              </div>
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}

useGLTF.preload('/CAJA PIZZA.glb?v=3');
useGLTF.preload('/AllPizzas.glb?v=3');
