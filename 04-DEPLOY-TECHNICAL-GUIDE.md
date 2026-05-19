# Guía de Deploy — FinanceOS Pro

> **Esta opción es avanzada y opcional.**
> Solo la necesitas si quieres publicar tu propia versión white-label.

---

## Opción A — Vercel (recomendada)

1. Sube el proyecto a un repositorio privado en GitHub
2. Entra a vercel.com e importa el repositorio
3. Configura:
   - Build Command: `node build.js`
   - Output Directory: `dist`
4. Haz clic en Deploy

URL pública lista en menos de 2 minutos.

Cada vez que haces `git push`, Vercel redespliega automáticamente.

---

## Opción B — Netlify Drop (más rápida)

1. Ejecuta `npm run build` en tu computadora
2. Ve a netlify.com/drop
3. Arrastra la carpeta `dist/` a la zona indicada

URL pública lista en 60 segundos.

---

## Dominio propio (opcional)

Tanto Vercel como Netlify permiten conectar un dominio propio gratis.
El proceso tarda entre 10 y 30 minutos.

---

## Errores comunes

**App abre en blanco:**
Verifica que Output Directory sea `dist` en Vercel Settings.

**Deploy bloqueado en Vercel:**
El email del commit no coincide con GitHub.
Ejecuta: `git config --global user.email "tu@email.com"`

**Service Worker con versión vieja:**
DevTools → Application → Service Workers → Unregister
Recarga con Cmd+Shift+R (Mac) o Ctrl+Shift+R.

---

## Documentación completa

https://financeos-landing-omega.vercel.app/docs/deploy.html

---

© 2026 MAXNOVA & LUCI Global LLC · maxnovaluciglobal@gmail.com
