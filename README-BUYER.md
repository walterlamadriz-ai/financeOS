# FinanceOS — Guía del Comprador

> Gracias por adquirir FinanceOS. Esta guía te lleva de la descarga al producto listo para entregar a clientes en menos de 30 minutos.

---

## Lo que recibiste en este ZIP

```
financeos/
├── src/                    ← Código fuente completo (React 18 + Vite)
├── public/                 ← Assets públicos (favicon, iconos PWA)
├── src/config.js           ← ⭐ EMPIEZA AQUÍ — toda la personalización
├── package.json            ← Dependencias del proyecto
├── vite.config.js          ← Configuración del build + PWA
├── vercel.json             ← Deploy en Vercel listo
├── netlify.toml            ← Deploy en Netlify listo
├── DEPLOY.md               ← Instrucciones de deploy paso a paso
├── LICENSE.txt             ← Tu licencia de uso
└── README-BUYER.md         ← Este archivo
```

---

## Instalación en 3 comandos

```bash
# 1. Entra a la carpeta
cd financeos

# 2. Instala dependencias (necesitas Node.js 18+)
npm install

# 3. Corre en modo desarrollo
npm run dev
# → Abre http://localhost:5173
```

> ¿No tienes Node.js? Descárgalo en https://nodejs.org (versión LTS)

---

## ⭐ Personalización — empieza por config.js

El archivo `src/config.js` centraliza **todo** lo que puedes cambiar sin tocar lógica:

### Cambiar nombre y datos de contacto

```js
app: {
  name: 'MiApp Finanzas',        // Nombre en el sidebar y título del tab
  tagline: 'Controla tu futuro',
  supportEmail: 'hola@tudominio.com',
}
```

### Cambiar moneda por defecto

```js
defaults: {
  currency: 'CLP',   // 'USD' | 'EUR' | 'VES' | 'MXN' | 'ARS' | 'COP'
}
```

### Personalizar categorías para tu mercado

```js
categoriesExpense: [
  'Vivienda', 'Alimentación', 'Tu categoría personalizada', ...
]
```

### Activar o desactivar módulos

```js
features: {
  debts:     true,   // Cambia a false para ocultar el módulo de deudas
  exportCSV: true,   // false = el cliente no puede exportar datos
  demoData:  false,  // false = oculta el botón "Cargar demo" en producción
}
```

### Cambiar colores de la app (brand)

```js
brand: {
  primary:      '#tu-color',   // Color principal (botones, sidebar)
  primaryLight: '#version-clara',
  primaryMid:   '#version-media',
}
```

Luego **replica los mismos valores** en `src/styles/globals.css` → `:root`:
```css
:root {
  --grn:    #tu-color;
  --grn-bg: #version-clara;
  --grn-m:  #version-media;
}
```

---

## Entregar a un cliente — checklist en 30 minutos

### Paso 1 — Personaliza (5 min)
- [ ] Edita `src/config.js` con el nombre y datos del cliente
- [ ] Cambia los colores en `config.js` y `globals.css`
- [ ] Reemplaza `public/favicon.svg` con el logo del cliente (SVG o PNG)

### Paso 2 — Build (2 min)
```bash
npm run build
# Genera carpeta dist/ con todos los archivos optimizados
```

### Paso 3 — Deploy (3 min)

**Netlify (más rápido):**
1. Ve a https://app.netlify.com/drop
2. Arrastra la carpeta `dist/` a la pantalla
3. Copia la URL que te da → listo ✅

**Vercel:**
1. Ve a https://vercel.com → New Project → Deploy without Git
2. Arrastra `dist/` → Deploy ✅

### Paso 4 — Dominio personalizado (opcional, 10 min)
- En Netlify: Site Settings → Domain Management → Add custom domain
- En Vercel: Project Settings → Domains → Add

### Paso 5 — Entrega al cliente (5 min)
- Comparte la URL
- Entrégale esta guía de uso rápido: [Guía usuario final](#guía-usuario-final)

---

## Guía usuario final

*(Puedes compartir esta sección directamente con tu cliente)*

### Primeros pasos

1. **Abre la app** en tu navegador (Chrome, Safari, Firefox)
2. **Instala en tu celular**: en Chrome → menú (⋮) → "Agregar a pantalla de inicio"
3. **Carga datos demo** en Ajustes → "Cargar demo" para explorar la app
4. **Empieza a registrar**: ve a Ingresos → agrega tu salario del mes

### Tus datos son privados

- Todo se guarda **solo en tu dispositivo** — nadie más puede verlos
- Para hacer backup: Ajustes → "Exportar JSON" → guárdalo en un lugar seguro
- Para restaurar en otro dispositivo: Ajustes → "Importar JSON"

### Funciona sin internet

Después de la primera carga, la app funciona completamente offline. Puedes registrar gastos aunque no tengas conexión.

---

## Preguntas frecuentes del comprador

**¿Puedo usar esto para más de un cliente?**
Con la licencia Pro puedes usarlo para hasta 20 clientes. Para más, escríbenos para el plan Enterprise.

**¿Mis clientes necesitan pagar algo?**
No. Tú pagas la licencia una vez y tus clientes usan la app sin costo adicional.

**¿Los datos de mis clientes están seguros?**
Sí. FinanceOS es 100% local — los datos nunca salen del dispositivo del usuario. No hay servidor, no hay base de datos en la nube (en la versión v1).

**¿Puedo cambiar el nombre y el logo?**
Sí, con la licencia Pro y Enterprise. Ver sección de Personalización arriba.

**¿Cómo recibo actualizaciones?**
Las actualizaciones se entregan por email al correo con el que compraste. Los compradores Pro reciben actualizaciones por 1 año, Enterprise por 2 años.

**¿Qué pasa si tengo un bug o necesito soporte?**
Escríbenos a soporte@magnova.io con tu número de licencia. Planes Pro tienen respuesta en 48h, Enterprise en 24h.

---

## Soporte técnico

- **Email:** soporte@magnova.io
- **Documentación completa:** Está incluida en la app (módulo Docs)
- **Número de licencia:** Guarda el email de confirmación de compra

---

*FinanceOS v1.1 · MAGNOVA LLC · https://magnova.io*
