# Guía white-label — FinanceOS Pro v1.0

MAXNOVA & LUCI Global LLC · maxnovaluciglobal@gmail.com

---

## Paso 1 — Nombre y contacto

Abrí `src/config.js`:

```js
app: {
  name: 'Tu nombre de app',      // ← tu marca
  tagline: 'Tu slogan',          // ← opcional
  supportEmail: 'tu@email.com',  // ← tu email de soporte
},
defaults: {
  currency: 'CLP', // CLP, USD, EUR, VES, MXN, ARS, COP
  savingGoalPct: 20,
},
```

---

## Paso 2 — Colores

Abrí `src/styles/globals.css` y buscá las variables:

```css
:root {
  --grn:  #0a5c3e;  /* ← color primario */
  --grn2: #127a50;  /* ← versión más oscura */
  --grn3: #1aa368;  /* ← versión más brillante */
}
```

Reemplazalas con tus colores de marca.

---

## Paso 3 — Regenerar el build

```bash
npm run build
```

---

## Paso 4 — Deploy

**Vercel:**
1. Subí el proyecto a GitHub
2. Importalo en vercel.com
3. Build Command: `node build.js`
4. Output Directory: `dist`

**Netlify Drop:**
1. `npm run build`
2. Arrastrá la carpeta `dist/` a netlify.com/drop

---

## Paso 5 — Verificar

- [ ] Nombre correcto visible en el sidebar
- [ ] Colores actualizados en toda la app
- [ ] Email de soporte correcto en Ajustes
- [ ] URL funciona en celular

---

## Guía completa

https://financeos-landing-omega.vercel.app/docs/white-label.html

---

© 2026 MAXNOVA & LUCI Global LLC
