// ============================================================================
// CONFIGURACIÓN CENTRAL DE PIZZAS Y MODELOS 3D - FORNO PIZZERIA
// ============================================================================
// En este archivo puedes cambiar los nombres, precios, descripciones,
// ingredientes y configurar las rutas de tus modelos 3D definitivos (.glb).
//
// 📂 INSTRUCCIONES PARA AGREGAR MODELOS 3D REALES:
// 1. Guarda los archivos .glb de tu compañero en la carpeta "public/models/"
//    (por ejemplo: "public/models/caja.glb", "public/models/pepperoni.glb", etc.)
// 2. Edita los campos "boxGlbPath", "pizzaGlbPath" y "sliceGlbPath" abajo
//    con la ruta relativa a la carpeta public (ejemplo: "/models/caja.glb").
// 3. El código intentará cargar el modelo 3D. Si la ruta está vacía o el archivo
//    no existe, el sistema usará automáticamente las pizzas simuladas procedimentales.
// ============================================================================

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
  // RUTAS A LOS MODELOS 3D (.glb en la carpeta public/)
  boxGlbPath?: string;   // Modelo 3D de la caja (debe tener tapa animable rotando sobre X)
  pizzaGlbPath?: string; // Modelo 3D de la pizza entera
  sliceGlbPath?: string; // Modelo 3D de una rebanada suelta para la vista zoom
}

export const PIZZAS: PizzaData[] = [
  {
    id: 'pepperoni',
    name: 'Pepperoni Classico',
    price: '$14.99',
    numericPrice: 14.99,
    description: 'Salsa de tomate pomodoro, mozzarella premium y abundantes rodajas de pepperoni curado.',
    emoji: '🍕',
    ingredients: 'Masa de fermentación lenta, salsa pomodoro, queso mozzarella, pepperoni madurado, orégano seco y aceite de oliva.',
    nutrition: { calories: '290 kcal', protein: '12g', fat: '14g' },
    boxGlbPath: '/CAJA PIZZA.glb',   
    pizzaGlbPath: '/AllPizzas.glb', 
    sliceGlbPath: '/AllPizzas.glb', 
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
    boxGlbPath: '/CAJA PIZZA.glb',
    pizzaGlbPath: '/AllPizzas.glb',
    sliceGlbPath: '/AllPizzas.glb',
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
    boxGlbPath: '/CAJA PIZZA.glb',
    pizzaGlbPath: '/AllPizzas.glb',
    sliceGlbPath: '/AllPizzas.glb',
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
    boxGlbPath: '/CAJA PIZZA.glb',
    pizzaGlbPath: '/AllPizzas.glb',
    sliceGlbPath: '/AllPizzas.glb',
  },
];
