import { Flame, Sparkles, ChevronLeft } from 'lucide-react';

import { PIZZAS } from '../config/pizzaConfig';

interface MenuPanelProps {
  activePizzaId: string;
  onPizzaSelect: (id: string) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: (open: boolean) => void;
}

export default function MenuPanel({
  activePizzaId,
  onPizzaSelect,
  isSidebarOpen,
  onToggleSidebar,
}: MenuPanelProps) {
  return (
    <div className={`glass-panel menu-sidebar ${isSidebarOpen ? '' : 'collapsed'}`}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
          <h2 className="menu-title" style={{ marginBottom: 0 }}>
            <Flame size={22} color="var(--accent)" />
            Nuestras Pizzas
          </h2>
          <button
            className="sidebar-toggle-btn"
            onClick={() => onToggleSidebar(false)}
            title="Esconder Menú"
          >
            <ChevronLeft size={16} />
          </button>
        </div>
        <p className="menu-subtitle">
          Elige una pizza para ver el modelo 3D y abrir su caja en tiempo real.
        </p>
      </div>

      <div className="pizza-list">
        {PIZZAS.map((pizza) => (
          <div
            key={pizza.id}
            className={`pizza-card ${activePizzaId === pizza.id ? 'active' : ''}`}
            onClick={() => onPizzaSelect(pizza.id)}
          >
            <div className="pizza-card-img">{pizza.emoji}</div>
            <div className="pizza-card-info">
              <div className="pizza-card-name">{pizza.name}</div>
              <div className="pizza-card-desc">{pizza.description}</div>
            </div>
            <div className="pizza-card-price">{pizza.price}</div>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 'auto',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        paddingTop: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: '0.8rem',
          fontWeight: 600,
          color: 'var(--accent)'
        }}>
          <Sparkles size={14} />
          <span>Experiencia 100% Interactiva</span>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
          Puedes girar la caja, hacer zoom con el mouse (scroll) y arrastrar con clic izquierdo para ver todos los ángulos.
        </p>
      </div>
    </div>
  );
}
