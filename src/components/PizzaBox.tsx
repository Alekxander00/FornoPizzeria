import { useRef, useEffect, useState, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Html, useGLTF } from '@react-three/drei';
import { PIZZAS } from '../config/pizzaConfig';

// Componente para cargar modelos GLTF/GLB dinámicamente con fallbacks
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

interface PizzaBoxProps {
  pizzaType: string;
  isBoxOpen: boolean;
  onBoxOpenChange: (open: boolean) => void;
  onSliceClick: () => void;
  targetX: number;
}

// Interfaces for toppings
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
  const lidRef = useRef<THREE.Group>(null);
  const pizzaRef = useRef<THREE.Group>(null);
  const groupRef = useRef<THREE.Group>(null);

  // Target rotation for the lid (X-axis)
  // Closed = 0, Open = -115 degrees (-2.0 radians)
  const targetLidRotation = isBoxOpen ? -Math.PI * 0.65 : 0;

  // Generate deterministic topping positions so they don't jump around on re-renders
  const [toppingPositions, setToppingPositions] = useState<ToppingPosition[]>([]);

  useEffect(() => {
    // Generate 16 random positions on the pizza surface
    const positions: ToppingPosition[] = [];
    for (let i = 0; i < 18; i++) {
      // Keep toppings within a radius of 0.85 (pizza radius is 1.0)
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
    if (lidRef.current) {
      // Lerp rotation for smooth opening/closing
      lidRef.current.rotation.x = THREE.MathUtils.lerp(
        lidRef.current.rotation.x,
        targetLidRotation,
        delta * 6.5
      );
    }

    if (pizzaRef.current) {
      // Slowly rotate the pizza inside the box for visual interest
      pizzaRef.current.rotation.y += delta * 0.08;
    }

    if (groupRef.current) {
      // Teletransportación instantánea si el salto es muy grande (> 8 unidades)
      if (Math.abs(groupRef.current.position.x - targetX) > 8) {
        groupRef.current.position.x = targetX;
      } else {
        // Desplazamiento suave de carrusel
        groupRef.current.position.x = THREE.MathUtils.lerp(
          groupRef.current.position.x,
          targetX,
          delta * 8.0
        );
      }
    }
  });

  // Get current pizza details for the label inside the lid
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

  // Helper to render toppings based on pizza type
  const renderToppings = () => {
    if (toppingPositions.length === 0) return null;

    return toppingPositions.map((pos, idx) => {
      if (pizzaType === 'pepperoni') {
        // Red pepperoni circles
        return (
          <mesh
            key={idx}
            position={[pos.x, 0.045, pos.z]}
            rotation={[0, pos.rot, 0]}
            scale={[pos.scale, 1, pos.scale]}
            castShadow
          >
            <cylinderGeometry args={[0.1, 0.1, 0.012, 16]} />
            <meshStandardMaterial
              color="#ac2222"
              roughness={0.7}
              bumpScale={0.02}
              // Add a bit of darker rim to represent pepperoni grease/baking
              roughnessMap={undefined}
            />
          </mesh>
        );
      }

      if (pizzaType === 'margherita') {
        // Green basil leaves
        if (idx % 2 === 0) {
          return (
            <mesh
              key={idx}
              position={[pos.x, 0.045, pos.z]}
              rotation={[0.1, pos.rot, 0.1]}
              scale={[pos.scale * 0.7, 0.2, pos.scale * 1.3]}
              castShadow
            >
              <boxGeometry args={[0.08, 0.01, 0.15]} />
              <meshStandardMaterial color="#1b5e20" roughness={0.9} />
            </mesh>
          );
        } else {
          // Red tomato wedges
          return (
            <mesh
              key={idx}
              position={[pos.x, 0.042, pos.z]}
              rotation={[0, pos.rot, 0]}
              scale={[pos.scale * 0.9, 1, pos.scale * 0.9]}
              castShadow
            >
              <cylinderGeometry args={[0.08, 0.08, 0.015, 8]} />
              <meshStandardMaterial color="#e53935" roughness={0.6} />
            </mesh>
          );
        }
      }

      if (pizzaType === 'vegetarian') {
        // Mushrooms (idx % 3 === 0)
        if (idx % 3 === 0) {
          return (
            <group key={idx} position={[pos.x, 0.045, pos.z]} rotation={[0.2, pos.rot, 0]}>
              {/* Mushroom Cap */}
              <mesh castShadow>
                <sphereGeometry args={[0.05, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color="#d7ccc8" roughness={0.9} />
              </mesh>
              {/* Stem */}
              <mesh position={[0, -0.03, 0]}>
                <cylinderGeometry args={[0.02, 0.02, 0.05, 8]} />
                <meshStandardMaterial color="#efebe9" roughness={0.9} />
              </mesh>
            </group>
          );
        }
        // Green Peppers
        if (idx % 3 === 1) {
          return (
            <mesh
              key={idx}
              position={[pos.x, 0.042, pos.z]}
              rotation={[0, pos.rot, 0]}
              scale={[pos.scale * 0.7, 1, pos.scale * 0.8]}
              castShadow
            >
              <torusGeometry args={[0.07, 0.015, 8, 12, Math.PI]} />
              <meshStandardMaterial color="#2e7d32" roughness={0.6} />
            </mesh>
          );
        }
        // Red Onion rings
        return (
          <mesh
            key={idx}
            position={[pos.x, 0.042, pos.z]}
            rotation={[0.1, pos.rot, 0]}
            scale={[pos.scale * 0.8, 1, pos.scale * 0.8]}
          >
            <torusGeometry args={[0.08, 0.01, 8, 12]} />
            <meshStandardMaterial color="#880e4f" roughness={0.7} />
          </mesh>
        );
      }

      if (pizzaType === 'four_cheese') {
        // Blobs of melted white cheese / dollops of ricotta
        if (idx % 2 === 0) {
          return (
            <mesh
              key={idx}
              position={[pos.x, 0.043, pos.z]}
              rotation={[0, pos.rot, 0]}
              scale={[pos.scale * 1.2, 0.3, pos.scale * 1.2]}
              castShadow
            >
              <sphereGeometry args={[0.07, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color="#fffae6" roughness={0.8} />
            </mesh>
          );
        }
        // Gorgonzola blue spots
        return (
          <mesh
            key={idx}
            position={[pos.x, 0.041, pos.z]}
            rotation={[0, pos.rot, 0]}
            scale={[pos.scale * 0.6, 0.1, pos.scale * 0.6]}
          >
            <sphereGeometry args={[0.06, 6, 6]} />
            <meshStandardMaterial color="#78909c" roughness={0.9} />
          </mesh>
        );
      }

      return null;
    });
  };

  // Build the pizza base mesh (dough + tomato sauce + cheese surface)
  const renderPizzaBody = () => {
    return (
      <group>
        {/* Cheese Surface (Top Layer) */}
        <mesh position={[0, 0.03, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[0.95, 0.95, 0.02, 32]} />
          <meshStandardMaterial
            color={pizzaType === 'four_cheese' ? '#ffeb3b' : '#ffc107'}
            roughness={0.5}
            metalness={0.05}
          />
        </mesh>
        
        {/* Tomato Sauce Border (Subtle Ring) */}
        <mesh position={[0, 0.02, 0]} receiveShadow>
          <cylinderGeometry args={[0.98, 0.98, 0.015, 32]} />
          <meshStandardMaterial color="#bf360c" roughness={0.8} />
        </mesh>

        {/* Pizza Crust (Dough) */}
        <mesh position={[0, 0.01, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.0, 1.0, 0.04, 32]} />
          <meshStandardMaterial color="#e0a96d" roughness={0.9} />
        </mesh>

        {/* Puffy Crust Rim (Torus for baking aesthetic) */}
        <mesh position={[0, 0.035, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.96, 0.055, 12, 48]} />
          <meshStandardMaterial color="#d78e34" roughness={0.8} />
        </mesh>
      </group>
    );
  };

  // Handle clicking on the pizza
  const handlePizzaClick = (e: any) => {
    e.stopPropagation();
    if (!isBoxOpen) {
      // If box is closed, click opens the box!
      onBoxOpenChange(true);
    } else {
      // If box is open, click enters slice detailed view
      onSliceClick();
    }
  };

  return (
    <group ref={groupRef}>
      {/* ======================================================== */}
      {/* PIZZA BOX BASE */}
      {/* ======================================================== */}
      <group position={[0, 0, 0]}>
        {/* Bottom Panel (Lighter cardboard color #F1DEC2) */}
        <mesh position={[0, 0.04, 0]} receiveShadow castShadow>
          <boxGeometry args={[2.5, 0.08, 2.5]} />
          <meshStandardMaterial color="#F1DEC2" roughness={0.85} metalness={0.05} />
        </mesh>

        {/* Side Walls of Box Base (Left, Right, Front - slightly shaded cream) */}
        <mesh position={[-1.21, 0.12, 0]} castShadow>
          <boxGeometry args={[0.08, 0.16, 2.5]} />
          <meshStandardMaterial color="#ebd9bf" roughness={0.85} />
        </mesh>
        <mesh position={[1.21, 0.12, 0]} castShadow>
          <boxGeometry args={[0.08, 0.16, 2.5]} />
          <meshStandardMaterial color="#ebd9bf" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.12, 1.21]} castShadow>
          <boxGeometry args={[2.5, 0.16, 0.08]} />
          <meshStandardMaterial color="#ebd9bf" roughness={0.85} />
        </mesh>
        
        {/* Back Wall */}
        <mesh position={[0, 0.12, -1.21]} castShadow>
          <boxGeometry args={[2.5, 0.16, 0.08]} />
          <meshStandardMaterial color="#ebd9bf" roughness={0.85} />
        </mesh>
      </group>

      {/* ======================================================== */}
      {/* PIZZA (INSIDE THE BOX) */}
      {/* ======================================================== */}
      <group
        ref={pizzaRef}
        position={[0, 0.08, 0]}
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
            <GltfModel path={activePizza.pizzaGlbPath} scale={1.0} position={[0, -0.04, 0]} />
          </Suspense>
        ) : (
          <>
            {renderPizzaBody()}
            {renderToppings()}
          </>
        )}
      </group>

      {/* ======================================================== */}
      {/* PIZZA BOX LID (HINGED AT THE BACK Z = -1.2) */}
      {/* ======================================================== */}
      <group ref={lidRef} position={[0, 0.18, -1.2]} onClick={(e) => e.stopPropagation()}>
        {/* Lid Top Panel (Cream color #F1DEC2) */}
        {/* Offset position by +1.2 in Z so hinge is at the local origin */}
        <mesh position={[0, 0.02, 1.2]} castShadow receiveShadow>
          <boxGeometry args={[2.54, 0.04, 2.54]} />
          <meshStandardMaterial color="#F1DEC2" roughness={0.85} metalness={0.05} />
        </mesh>

        {/* Lid Front Lip */}
        <mesh position={[0, -0.04, 2.45]} rotation={[-0.05, 0, 0]} castShadow>
          <boxGeometry args={[2.54, 0.1, 0.04]} />
          <meshStandardMaterial color="#ebd9bf" roughness={0.85} />
        </mesh>
        
        {/* Lid Side Lips */}
        <mesh position={[-1.25, -0.04, 1.2]} castShadow>
          <boxGeometry args={[0.04, 0.1, 2.5]} />
          <meshStandardMaterial color="#ebd9bf" roughness={0.85} />
        </mesh>
        <mesh position={[1.25, -0.04, 1.2]} castShadow>
          <boxGeometry args={[0.04, 0.1, 2.5]} />
          <meshStandardMaterial color="#ebd9bf" roughness={0.85} />
        </mesh>

        {/* FORNO PIZZERIA PRINTED LOGO ON THE OUTSIDE OF THE LID */}
        <group position={[0, 0.042, 1.2]} rotation={[-Math.PI / 2, 0, 0]}>
          <mesh receiveShadow>
            <ringGeometry args={[0.55, 0.6, 32]} />
            <meshStandardMaterial color="#E19D27" roughness={0.5} />
          </mesh>
          
          <mesh receiveShadow position={[0, 0, 0.001]}>
            <circleGeometry args={[0.12, 32]} />
            <meshStandardMaterial color="#7C0000" roughness={0.5} />
          </mesh>
        </group>

        {/* ======================================================== */}
        {/* PREMIUM INFO LABEL ON THE INSIDE OF THE LID */}
        {/* ======================================================== */}
        {isBoxOpen && (
          <Html
            position={[0, -0.015, 1.2]}
            rotation={[Math.PI / 2, 0, 0]}
            transform
            occlude
            distanceFactor={1.2}
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
