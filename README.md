# FinanceOS — Personal Finance Command Center

> App web progresiva para gestión de finanzas personales. Funciona offline, instala como app nativa, sin backend.

## Stack
- React 18 + Vite 5
- IndexedDB (via `idb`) — persistencia local completa
- CSS Modules + Variables CSS — tema claro/oscuro
- Vite PWA Plugin — instalable, funciona offline
- Export CSV + JSON / Import JSON

## Instalación

```bash
# 1. Clonar o descomprimir el proyecto
cd financeos

# 2. Instalar dependencias
npm install

# 3. Iniciar en desarrollo
npm run dev
# → http://localhost:5173

# 4. Build para producción
npm run build

# 5. Preview del build
npm run preview
```

## Estructura

```
src/
├── core/db/index.js          # IndexedDB — todos los stores y CRUD
├── context/AppContext.jsx    # Estado global + sync con DB
├── pages/
│   ├── Dashboard/            # KPIs, movimientos recientes, metas
│   └── index.jsx             # Income, Expenses, Budgets, Debts, Goals, Reports, Settings
├── components/
│   ├── layout/Shell.jsx      # Sidebar + layout principal
│   └── ui/index.jsx          # Componentes reutilizables
├── utils/index.js            # Formatters, constantes, seed data
└── styles/globals.css        # Variables CSS, temas claro/oscuro
```

## IndexedDB — Stores

| Store      | Descripción                          |
|------------|--------------------------------------|
| `incomes`  | Ingresos con categoría y recurrencia |
| `expenses` | Gastos con tipo (necesidad/deseo)    |
| `budgets`  | Límites mensuales por categoría      |
| `debts`    | Deudas con progreso de pago          |
| `goals`    | Metas de ahorro con progreso         |
| `settings` | Configuración del usuario            |

## Personalización rápida

**Colores** → `src/styles/globals.css` → variables `:root` y `[data-theme="dark"]`

**Categorías** → `src/utils/index.js` → `CATS_INCOME` y `CATS_EXPENSE`

**Moneda** → Ajustes dentro de la app (persiste en IndexedDB)

**Nombre/branding** → `src/components/layout/Shell.jsx` → `.logoName`

## Deploy en Vercel

```bash
npm run build
# Subir carpeta dist/ a Vercel o usar Vercel CLI:
npx vercel --prod
```

## Deploy en Netlify

```bash
npm run build
# Drag & drop de dist/ en netlify.com/drop
# O conectar repo de GitHub
```

## Fase 3 — Pendiente
- [ ] Calendario financiero
- [ ] Comparación entre meses
- [ ] Categorías personalizables desde UI

## Notas
- Los datos se almacenan localmente en el navegador (IndexedDB)
- No hay backend, no hay cuentas, no hay sincronización en la nube (v1)
- Orientación general financiera — no constituye asesoría profesional certificada
