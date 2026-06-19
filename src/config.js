// ─────────────────────────────────────────────────────────────────────────────
// FinanceOS — config.js
// Archivo de configuración centralizado para licencias Pro y Enterprise.
// ESTE es el único archivo que necesitas editar para personalizar la app.
// No toques ningún otro archivo a menos que quieras cambiar lógica de negocio.
// ─────────────────────────────────────────────────────────────────────────────

const config = {

  // ── IDENTIDAD ──────────────────────────────────────────────────────────────
  app: {
    name:        'FinanceOS',           // Nombre que aparece en sidebar y título
    tagline:     'Tu dinero, bajo control total',
    version:     '1.5.0',
    supportEmail:'maxnovaluciglobal@gmail.com',  // Aparece en Ajustes > soporte
    website:     'https://tuempresa.com',
    logoText:    'FO',                  // Iniciales para favicon SVG si no hay imagen
  },

  // ── DEFAULTS DEL USUARIO ───────────────────────────────────────────────────
  defaults: {
    currency:            'CLP',   // 'CLP' | 'USD' | 'EUR' | 'VES' | 'MXN' | 'ARS' | 'COP'
    language:            'es',    // 'es' | 'en'
    theme:               'light', // 'light' | 'dark'
    savingGoalPct:       25,      // % de ingreso como meta de ahorro (1-100)
    emergencyFundMonths: 5,       // Meses de gastos como fondo de emergencia
  },

  // ── MONEDAS DISPONIBLES ────────────────────────────────────────────────────
  // Agrega o elimina monedas según tu mercado objetivo.
  currencies: [
    { code: 'CLP', label: 'CLP — Peso chileno',     symbol: '$'   },
    { code: 'USD', label: 'USD — Dólar',             symbol: 'US$' },
    { code: 'EUR', label: 'EUR — Euro',              symbol: '€'   },
    { code: 'VES', label: 'VES — Bolívar',           symbol: 'Bs.' },
    { code: 'MXN', label: 'MXN — Peso mexicano',    symbol: '$'   },
    { code: 'ARS', label: 'ARS — Peso argentino',   symbol: '$'   },
    { code: 'COP', label: 'COP — Peso colombiano',  symbol: '$'   },
    { code: 'PEN', label: 'PEN — Sol peruano',       symbol: 'S/.' },
  ],

  // ── CATEGORÍAS DE INGRESOS ─────────────────────────────────────────────────
  // Personaliza para tu audiencia. Ej: si tus clientes son freelancers,
  // agrega 'Proyecto web', 'Consultoría', etc.
  categoriesIncome: [
    'Salario',
    'Freelance',
    'Inversión',
    'Arriendo',
    'Bono',
    'Pensión',
    'Negocio propio',
    'Otro',
  ],

  // ── CATEGORÍAS DE GASTOS ───────────────────────────────────────────────────
  categoriesExpense: [
    'Vivienda',
    'Alimentación',
    'Transporte',
    'Salud',
    'Educación',
    'Entretenimiento',
    'Servicios',
    'Ropa',
    'Tecnología',
    'Mascota',
    'Otro',
  ],

  // ── COLORES POR CATEGORÍA ──────────────────────────────────────────────────
  // Asigna un color hex a cada categoría. Si una categoría no tiene color
  // asignado aquí, usa el fallback '#888780'.
  categoryColors: {
    Vivienda:        '#1a6b4a',
    Alimentación:    '#3dbe7a',
    Transporte:      '#d4982a',
    Salud:           '#4a9ad4',
    Educación:       '#7f77dd',
    Entretenimiento: '#e05a4a',
    Servicios:       '#0f6e56',
    Ropa:            '#d4537e',
    Tecnología:      '#1a5a8a',
    Mascota:         '#9a6500',
    Otro:            '#888780',
    Salario:         '#1a6b4a',
    Freelance:       '#4a9ad4',
    Inversión:       '#7f77dd',
    Arriendo:        '#d4982a',
    Bono:            '#3dbe7a',
    Pensión:         '#888780',
    'Negocio propio':'#0f6e56',
  },

  // ── MÉTODOS DE PAGO ────────────────────────────────────────────────────────
  paymentMethods: [
    'Débito',
    'Crédito',
    'Efectivo',
    'Transferencia',
    'Billetera digital',
  ],

  // ── RECURRENCIAS ───────────────────────────────────────────────────────────
  recurrences: [
    'Único',
    'Semanal',
    'Quincenal',
    'Mensual',
    'Anual',
  ],

  // ── COLORES DE LA APP (BRAND) ──────────────────────────────────────────────
  // Para cambiar el color primario (verde por defecto), edita estos valores.
  // Luego copia los mismos valores en src/styles/globals.css → :root
  // para que afecten también los estilos CSS que no usan este config.
  brand: {
    primary:      '#1a6b4a', // Color principal (botones, sidebar activo, acentos)
    primaryLight: '#e8f5ef', // Fondo claro del color principal
    primaryMid:   '#1d9e75', // Versión media para barras y gráficos
  },

  // ── FEATURES ON/OFF ────────────────────────────────────────────────────────
  // Activa o desactiva módulos según el plan que estás vendiendo.
  features: {
    budgets:      true,  // Módulo de presupuestos
    debts:        true,  // Módulo de deudas
    goals:        true,  // Módulo de metas
    reports:      true,  // Módulo de reportes
    exportCSV:    true,  // Botón exportar CSV
    exportJSON:   true,  // Botón exportar JSON
    importJSON:   true,  // Botón importar JSON
    darkMode:     true,  // Toggle de tema oscuro
    demoData:     true,  // Botón "Cargar demo" en Ajustes
    onboarding:   true,  // Pantalla de bienvenida al primer uso
  },

  // ── ONBOARDING ─────────────────────────────────────────────────────────────
  onboarding: {
    enabled:       true,
    welcomeTitle:  '¡Bienvenido a FinanceOS!',
    welcomeText:   'Tus datos se guardan solo en este dispositivo. Sin servidores, sin suscripciones.',
    steps: [
      { id: 'currency',    title: 'Elige tu moneda',         desc: '¿Con qué moneda trabajas día a día?' },
      { id: 'income',      title: 'Tu ingreso principal',    desc: '¿Cuánto recibes este mes?' },
      { id: 'goal',        title: 'Meta de ahorro',          desc: '¿Qué porcentaje quieres ahorrar?' },
    ],
  },

  // ── DISCLAIMER LEGAL ───────────────────────────────────────────────────────
  // Aparece en el footer de Ajustes y en los reportes.
  legalDisclaimer: 'Orientación general sobre finanzas personales. No constituye asesoría financiera, tributaria ni legal certificada. Consulta a un profesional para decisiones financieras importantes.',

  // ── PLAN / TIER (para features gating) ────────────────────────────────────
  // Cambia según la licencia que estés distribuyendo.
  // 'starter' | 'pro' | 'enterprise'
  plan: 'pro',

}

export default config
