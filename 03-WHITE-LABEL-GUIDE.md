# Guía White-label — FinanceOS Pro

> **Esta opción es avanzada y opcional.**
> Puedes usar FinanceOS Pro como PWA sin hacer ningún deploy propio.
> Si no tienes experiencia técnica, empieza con la opción PWA descrita
> en `01-START-HERE-PRO.md`.

---

## ¿Qué permite el white-label?

Con el plan Pro puedes personalizar FinanceOS y publicar
tu propia versión con:

- Tu nombre de marca
- Tus colores
- Tu moneda por defecto
- Tu email de soporte
- Tus textos principales

Tus clientes verán tu marca, no la de FinanceOS.

---

## Requisitos

- Node.js 18 o superior → https://nodejs.org
- Conocimientos básicos de terminal
- Cuenta en Vercel, Netlify u otro hosting

---

## Paso 1 — Instalar dependencias

```bash
cd FinanceOS-Pro-v1.5
npm install
```

---

## Paso 2 — Personalizar config.js

Abre `src/config.js` y ajusta:

```js
app: {
  name: 'Tu nombre de app',
  tagline: 'Tu slogan',
  supportEmail: 'tu@email.com',
},
defaults: {
  currency: 'CLP', // CLP, USD, EUR, VES, MXN, ARS, COP
  savingGoalPct: 20,
}
```

---

## Paso 3 — Personalizar colores (opcional)

Abre `src/styles/globals.css` y modifica:

```css
:root {
  --grn:  #tu-color-primario;
  --grn2: #version-oscura;
  --grn3: #version-brillante;
}
```

---

## Paso 4 — Generar build

```bash
npm run build
```

Genera la carpeta `dist/` lista para publicar.

---

## Paso 5 — Publicar

Consulta `04-DEPLOY-TECHNICAL-GUIDE.md` para instrucciones
de deploy en Vercel o Netlify.

---

## Soporte

maxnovaluciglobal@gmail.com
Asunto: [FinanceOS Pro - White-label]

El soporte técnico cubre dudas básicas de configuración,
no desarrollo personalizado adicional.

---

© 2026 MAXNOVA & LUCI Global LLC
