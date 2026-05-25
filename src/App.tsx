import { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Info,
  X,
  Eye,
  EyeOff,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Menu,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import PizzaScene from './components/PizzaScene';
import MenuPanel from './components/MenuPanel';
import { PIZZAS } from './config/pizzaConfig';
import SliceViewer from './components/SliceViewer';
import logoImg from './assets/FORN0.png';

export default function App() {
  const [activePizzaId, setActivePizzaId] = useState('pepperoni');
  const [isBoxOpen, setIsBoxOpen] = useState(false);
  const [isSliceModalOpen, setIsSliceModalOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // Custom interactive features
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<{ [key: string]: number }>({});
  const [isChangingPizza, setIsChangingPizza] = useState(false);
  const [boxTargetX, setBoxTargetX] = useState(0); // Posición del carrusel en X

  // Get current active pizza details
  const activePizza = PIZZAS.find((p) => p.id === activePizzaId) || PIZZAS[0];

  // Simular pantalla de carga premium
  useEffect(() => {
    const loadTimer = setTimeout(() => {
      setIsLoading(false);
    }, 1800);
    return () => clearTimeout(loadTimer);
  }, []);

  // Abrir la caja automáticamente después de cargar
  useEffect(() => {
    if (!isLoading) {
      const openTimer = setTimeout(() => {
        setIsBoxOpen(true);
      }, 1200);
      return () => clearTimeout(openTimer);
    }
  }, [isLoading]);

  // Cambiar de pizza cerrando la caja, deslizándola y abriéndola en el sentido correspondiente
  const changePizzaWithAnimation = (nextId: string, direction?: 'left' | 'right') => {
    if (nextId === activePizzaId || isChangingPizza) return;
    setIsChangingPizza(true);
    setIsBoxOpen(false); // 1. Cierra la caja
    
    // Determinar la dirección de animación basada en los índices si no se pasa
    let dir: 'left' | 'right' = 'left';
    if (direction) {
      dir = direction;
    } else {
      const currentIndex = PIZZAS.findIndex((p) => p.id === activePizzaId);
      const nextIndex = PIZZAS.findIndex((p) => p.id === nextId);
      dir = nextIndex > currentIndex ? 'left' : 'right';
    }

    // 2. Esperar a que la caja se termine de cerrar (300ms)
    setTimeout(() => {
      // 3. Desplazar la caja fuera de la pantalla en la dirección indicada
      const slideOutX = dir === 'left' ? -6 : 6;
      setBoxTargetX(slideOutX);
      
      // 4. Esperar a que salga de la vista por completo (350ms)
      setTimeout(() => {
        // 5. Cambiar el ID de la pizza
        setActivePizzaId(nextId);
        
        // 6. Teletransportar la caja al lado contrario instantáneamente (fuera de la pantalla)
        const teleportX = dir === 'left' ? 6 : -6;
        setBoxTargetX(teleportX);
        
        // 7. Pequeña espera para que R3F reconozca el teletransporte (50ms)
        setTimeout(() => {
          // 8. Desplazar la caja de vuelta al centro
          setBoxTargetX(0);
          
          // 9. Esperar a que llegue al centro y se detenga (450ms)
          setTimeout(() => {
            // 10. Abrir la caja con la nueva pizza
            setIsBoxOpen(true);
            setIsChangingPizza(false);
          }, 450);
        }, 50);
      }, 350);
    }, 300);
  };

  // Navegar entre pizzas con las flechas
  const handlePrevPizza = () => {
    if (isChangingPizza) return;
    const currentIndex = PIZZAS.findIndex((p) => p.id === activePizzaId);
    const prevIndex = (currentIndex - 1 + PIZZAS.length) % PIZZAS.length;
    changePizzaWithAnimation(PIZZAS[prevIndex].id, 'right');
  };

  const handleNextPizza = () => {
    if (isChangingPizza) return;
    const currentIndex = PIZZAS.findIndex((p) => p.id === activePizzaId);
    const nextIndex = (currentIndex + 1) % PIZZAS.length;
    changePizzaWithAnimation(PIZZAS[nextIndex].id, 'left');
  };

  // Lógica del logotipo para reiniciar la pizza a Pepperoni y mantener la caja abierta
  const handleLogoClick = () => {
    if (isChangingPizza) return;
    setIsSliceModalOpen(false);
    
    if (activePizzaId !== 'pepperoni') {
      changePizzaWithAnimation('pepperoni');
    } else {
      setIsBoxOpen(true);
    }
  };

  // Agregar al carrito con confeti oficial de la marca
  const handleAddToCart = () => {
    setCartItems((prev) => ({
      ...prev,
      [activePizzaId]: (prev[activePizzaId] || 0) + 1,
    }));
    setCartCount((prev) => prev + 1);
    
    // Lanzar confeti de marca (Rojo, Dorado y Crema)
    const duration = 1.5 * 1000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#E19D27', '#7C0000', '#F1DEC2'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#E19D27', '#7C0000', '#F1DEC2'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  // Modificar cantidades en el carrito
  const handleUpdateCartQty = (pizzaId: string, delta: number) => {
    setCartItems((prev) => {
      const newQty = (prev[pizzaId] || 0) + delta;
      if (newQty <= 0) {
        const updated = { ...prev };
        delete updated[pizzaId];
        return updated;
      }
      return { ...prev, [pizzaId]: newQty };
    });
    setCartCount((prev) => Math.max(0, prev + delta));
  };

  // Calcular el precio total
  const calculateTotal = () => {
    const total = Object.entries(cartItems).reduce((sum, [pizzaId, qty]) => {
      const pizza = PIZZAS.find((p) => p.id === pizzaId);
      return sum + (pizza ? pizza.numericPrice * qty : 0);
    }, 0);
    return total.toFixed(2);
  };

  return (
    <div className="app-container">
      {/* ======================================================== */}
      {/* LOADING SCREEN */}
      {/* ======================================================== */}
      {isLoading && (
        <div className="loading-screen">
          <img src={logoImg} className="loading-logo" alt="Forno Pizzeria Logo" />
          <div className="pizza-loader" style={{ width: '40px', height: '40px', borderWidth: '3px' }}></div>
          <div className="loading-subtext" style={{ marginTop: '0.5rem' }}>Cocinando los modelos 3D interactivos...</div>
        </div>
      )}

      {/* ======================================================== */}
      {/* HEADER */}
      {/* ======================================================== */}
      <header className="app-header">
        <div className="logo-container" onClick={handleLogoClick}>
          <img src={logoImg} className="logo-image" alt="Forno Pizzeria Logo" />
          <h1 className="logo-text">Forno Pizzeria</h1>
        </div>

        <div className="header-actions">
          <button
            className="btn-secondary"
            onClick={() => setIsCartOpen(true)}
            style={{
              position: 'relative',
              borderRadius: '50%',
              width: '46px',
              height: '46px',
              padding: 0,
            }}
          >
            <ShoppingCart size={18} />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
        </div>
      </header>

      {/* ======================================================== */}
      {/* MAIN VIEWPORT FOR 3D CANVAS AND UI OVERLAYS */}
      {/* ======================================================== */}
      <main className="main-content">
        {/* The interactive 3D scene (fills the screen behind the panels) */}
        <PizzaScene
          pizzaType={activePizzaId}
          isBoxOpen={isBoxOpen}
          onBoxOpenChange={setIsBoxOpen}
          onSliceClick={() => setIsSliceModalOpen(true)}
          boxTargetX={boxTargetX}
        />

        {/* 2D UI Overlays */}
        <div className="ui-overlay">
          {/* Left panel: Sabor menu with toggle props */}
          <MenuPanel
            activePizzaId={activePizzaId}
            onPizzaSelect={changePizzaWithAnimation}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={setIsSidebarOpen}
          />

          {/* Re-open Sidebar Floating Button when collapsed */}
          {!isSidebarOpen && (
            <button
              className="sidebar-toggle-btn"
              onClick={() => setIsSidebarOpen(true)}
              title="Mostrar Menú de Sabores"
              style={{
                position: 'absolute',
                top: '7.5rem',
                left: '2.5rem',
                zIndex: 5,
                width: '42px',
                height: '42px',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <Menu size={18} />
            </button>
          )}

          {/* Floating Navigation Arrows (only displayed when sidebar is collapsed) */}
          {!isSidebarOpen && (
            <>
              <button
                className="nav-arrow-btn left"
                onClick={handlePrevPizza}
                title="Pizza Anterior"
                disabled={isChangingPizza}
                style={{ opacity: isChangingPizza ? 0.5 : 1 }}
              >
                <ChevronLeft size={26} />
              </button>
              <button
                className="nav-arrow-btn right"
                onClick={handleNextPizza}
                title="Siguiente Pizza"
                disabled={isChangingPizza}
                style={{ opacity: isChangingPizza ? 0.5 : 1 }}
              >
                <ChevronRight size={26} />
              </button>
            </>
          )}

          {/* Right/Bottom panel: Price tag & Purchase button */}
          <div className="glass-panel action-panel">
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                  Precio Final
                </span>
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                  fontSize: '0.7rem',
                  background: 'rgba(225, 157, 39, 0.1)',
                  color: 'var(--accent)',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontWeight: 600,
                }}>
                  Recién Horneado
                </span>
              </div>
              <div className="price-tag">
                {activePizza.price}
                <span className="price-currency">USD</span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(241, 222, 194, 0.08)', paddingTop: '1rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                {activePizza.name}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                {activePizza.description}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button className="btn-primary" onClick={handleAddToCart} disabled={isChangingPizza}>
                <ShoppingCart size={18} />
                Agregar al Carrito
              </button>

              <button className="btn-secondary" onClick={() => setIsSliceModalOpen(true)}>
                <Sparkles size={16} style={{ color: 'var(--accent)' }} />
                Ver Rebanada en Detalle
              </button>
            </div>
          </div>
        </div>

        {/* Bottom controls overlay */}
        <div className="control-overlay">
          {/* Toggle Lid button */}
          <button
            className={`control-btn ${isBoxOpen ? 'active' : ''}`}
            onClick={() => setIsBoxOpen(!isBoxOpen)}
            title={isBoxOpen ? 'Cerrar Caja' : 'Abrir Caja'}
            disabled={isChangingPizza}
          >
            {isBoxOpen ? <EyeOff /> : <Eye />}
          </button>
          
          {/* Info toggle button */}
          <button
            className="control-btn"
            onClick={() => alert(`Masa artesanal con 24 horas de fermentación, horneada en horno de piedra de Forno Pizzeria.`)}
            title="Detalles de preparación"
          >
            <Info />
          </button>
        </div>
      </main>

      {/* ======================================================== */}
      {/* SHOPPING CART SLIDING DRAWER & BACKDROP OVERLAY */}
      {/* ======================================================== */}
      <div className={`cart-overlay ${isCartOpen ? 'open' : ''}`} onClick={() => setIsCartOpen(false)} />
      <div className={`cart-drawer ${isCartOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(241, 222, 194, 0.08)', paddingBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShoppingCart size={22} color="var(--accent)" />
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: 'var(--text-primary)', margin: 0 }}>Tu Orden</h2>
          </div>
          <button className="close-btn" style={{ position: 'static' }} onClick={() => setIsCartOpen(false)}>
            <X size={18} />
          </button>
        </div>
        
        <div className="cart-items-list">
          {Object.keys(cartItems).length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '6rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <ShoppingCart size={42} style={{ opacity: 0.2 }} />
              <span style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>Tu carrito está vacío.<br />¡Elige una pizza para añadir a la caja!</span>
            </div>
          ) : (
            Object.entries(cartItems).map(([pizzaId, qty]) => {
              const pizza = PIZZAS.find((p) => p.id === pizzaId);
              if (!pizza) return null;
              return (
                <div key={pizzaId} className="cart-item">
                  <div className="cart-item-emoji">{pizza.emoji}</div>
                  <div className="cart-item-details">
                    <div className="cart-item-name">{pizza.name}</div>
                    <div className="cart-item-price">{pizza.price}</div>
                  </div>
                  <div className="cart-item-controls">
                    <button className="cart-qty-btn" onClick={() => handleUpdateCartQty(pizzaId, -1)}>-</button>
                    <span className="cart-item-qty">{qty}</span>
                    <button className="cart-qty-btn" onClick={() => handleUpdateCartQty(pizzaId, 1)}>+</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        {Object.keys(cartItems).length > 0 && (
          <div className="cart-summary">
            <div className="cart-summary-row">
              <span>Subtotal</span>
              <span>${calculateTotal()} USD</span>
            </div>
            <div className="cart-summary-row">
              <span>Envío</span>
              <span style={{ color: 'var(--brand-green)', fontWeight: 700 }}>Gratis</span>
            </div>
            <div className="cart-summary-row cart-summary-total">
              <span>Total</span>
              <span style={{ color: 'var(--accent)' }}>${calculateTotal()} USD</span>
            </div>
            <button
              className="btn-primary"
              style={{ marginTop: '1.25rem' }}
              onClick={() => {
                alert('¡Gracias por tu compra! Tu pedido en Forno Pizzeria ha sido enviado a la cocina.');
                setCartItems({});
                setCartCount(0);
                setIsCartOpen(false);
              }}
            >
              Proceder al Pago
            </button>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* DETAILED SLICE MODAL OVERLAY */}
      {/* ======================================================== */}
      <div className={`slice-detail-overlay ${isSliceModalOpen ? 'active' : ''}`}>
        <div className="slice-detail-container">
          <button className="close-btn" onClick={() => setIsSliceModalOpen(false)}>
            <X size={20} />
          </button>

          {/* 3D Viewer for the isolated rotating slice */}
          <div className="slice-canvas-wrapper">
            {isSliceModalOpen && <SliceViewer pizzaType={activePizzaId} />}
            <div style={{
              position: 'absolute',
              bottom: '1rem',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.6)',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '0.7rem',
              color: 'var(--text-secondary)',
              pointerEvents: 'none',
              border: '1px solid rgba(255,255,255,0.05)',
            }}>
              Arrastra para girar rebanada
            </div>
          </div>

          {/* Description & Nutrition facts of the pizza */}
          <div className="slice-info-side">
            <span style={{
              color: 'var(--accent)',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '0.25rem',
              display: 'block',
            }}>
              Vista Detallada
            </span>
            <h2 className="slice-title">Rebanada de {activePizza.name}</h2>
            <p className="slice-desc">
              Esta rebanada muestra la distribución de ingredientes frescos, la base de masa fina crujiente y esponjosa cocinada a altas temperaturas, y el queso derretido en su punto.
            </p>

            <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Valores Nutricionales (Por Rebanada)
            </h3>
            
            <div className="nutrition-grid">
              <div className="nutrition-item">
                <div className="nutrition-val">{activePizza.nutrition.calories}</div>
                <div className="nutrition-lbl">Calorías</div>
              </div>
              <div className="nutrition-item">
                <div className="nutrition-val">{activePizza.nutrition.protein}</div>
                <div className="nutrition-lbl">Proteínas</div>
              </div>
              <div className="nutrition-item">
                <div className="nutrition-val">{activePizza.nutrition.fat}</div>
                <div className="nutrition-lbl">Grasas</div>
              </div>
            </div>

            <button
              className="btn-primary"
              onClick={() => {
                handleAddToCart();
                setIsSliceModalOpen(false);
              }}
            >
              <ShoppingCart size={18} />
              Ordenar esta Pizza ({activePizza.price})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
