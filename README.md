# FinanceOS v1.5

App de finanzas personales PWA · React 18 + Vite · Offline · Sin backend

**Demo:** https://financeos-hazel.vercel.app/app/?demo=true  
**Docs:** https://financeos-landing-omega.vercel.app/docs/  
**Soporte:** maxnovaluciglobal@gmail.com

---

## Inicio rápido

### Requisitos
- Node.js 18+ → https://nodejs.org

### Instalación
```bash
npm install
npm run dev
# Abrí: http://localhost:5173/app/
```

### Build para producción
```bash
npm run build
# Genera dist/ listo para deploy
```

---

## Personalización (plan Pro)

Abrí `src/config.js`:
```js
app: {
  name: 'Tu nombre de app',
  supportEmail: 'tu@email.com',
},
defaults: {
  currency: 'CLP', // CLP, USD, EUR, VES, MXN, ARS, COP
}
```

Colores en `src/styles/globals.css`:
```css
--grn: #tu-color;
```

---

## Deploy

**Vercel:** Build Command `node build.js` · Output Directory `dist`

**Netlify Drop:** `npm run build` → arrastrá `dist/` a netlify.com/drop

---

## Documentación completa

https://financeos-landing-omega.vercel.app/docs/

---

## Datos locales — importante

Los datos se guardan en el navegador del usuario. Sin backup previo,
los datos no se pueden recuperar — ni por el usuario ni por
MAXNOVA & LUCI Global LLC.

Exportá backup JSON desde Ajustes regularmente.

---

© 2026 MAXNOVA & LUCI Global LLC · Desarrollado por Walter La Madriz
