import { Flame, Sparkles, ChevronLeft } from 'lucide-react';

export interface PizzaData {
  id: string;
  name: string;
  price: string;
  numericPrice: number;
  description: string;
  emoji: string;
  ingredients: string;
  nutrition: {
    calories: string;
    protein: string;
    fat: string;
  };
}

export const PIZZAS: PizzaData[] = [
  {
    id: 'pepperoni',
    name: 'Pepperoni Classico',
    price: '$14.99',
    numericPrice: 14.99,
    description: 'Salsa de tomate, mozzarella premium y abundantes rodajas de pepperoni curado.',
    emoji: '🍕',
    ingredients: 'Masa de fermentación lenta, salsa pomodoro, queso mozzarella, pepperoni madurado, orégano seco y aceite de oliva.',
    nutrition: { calories: '290 kcal', protein: '12g', fat: '14g' },
  },
  {
    id: 'margherita',
    name: 'Margherita Premium',
    price: '$12.99',
    numericPrice: 12.99,
    description: 'La tradición italiana: mozzarella di bufala, tomates frescos y albahaca recién cortada.',
    emoji: '🌿',
    ingredients: 'Masa fina artesanal, tomates San Marzano, mozzarella fresca de búfala, hojas de albahaca fresca y aceite de oliva virgen extra.',
    nutrition: { calories: '240 kcal', protein: '10g', fat: '9g' },
  },
  {
    id: 'vegetarian',
    name: 'Orto Vegana',
    price: '$13.99',
    numericPrice: 13.99,
    description: 'Una explosión de frescura: champiñones, pimentones asados y cebolla morada sobre base pomodoro.',
    emoji: '🍄',
    ingredients: 'Masa rústica integral, salsa de tomate, champiñones, pimentones asados, aros de cebolla morada y aceite perfumado con ajo.',
    nutrition: { calories: '220 kcal', protein: '8g', fat: '7g' },
  },
  {
    id: 'four_cheese',
    name: 'Quattro Formaggi',
    price: '$15.49',
    numericPrice: 15.49,
    description: 'Exquisita mezcla cremosa de mozzarella, gorgonzola azul, parmesano maduro y provolone ahumado.',
    emoji: '🧀',
    ingredients: 'Masa artesanal, crema de queso especial, mozzarella rallada, gorgonzola, lascas de parmesano, provolone y pimienta negra.',
    nutrition: { calories: '320 kcal', protein: '14g', fat: '18g' },
  },
];

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
