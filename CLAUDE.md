# FinanceOS — App

PWA de finanzas personales. React 18 + Vite + IndexedDB. **Privacy-first: los datos viven en el dispositivo**, no hay backend que los lea. Supabase se usa solo para licencias y para sincronizar *blobs ya cifrados en el cliente*.

```bash
npm run dev      # vite
npm run build    # node build.js -> dist/index.html (redirect) + dist/app/ (la app real)
```

**El build produce dos cosas.** `dist/index.html` es solo un redirect a la landing; la app de verdad está en `dist/app/index.html`. Para verificar algo del `<head>` (fuentes, meta), mirar **`dist/app/index.html`**, no el de la raíz.

## Deploy

Push a git **no** actualiza el dominio. Deploy por CLI y alias a mano:

```bash
npx vercel --prod --yes
```

Con la URL que devuelve, aliasear **los dos** dominios:

```bash
npx vercel alias <url-nueva> app.financeospro.com
```

Y repetir con `demo.financeospro.com`. Si solo se aliasea uno, el otro se queda en la versión vieja.

El navegador integrado tiene bloqueado `*.financeospro.com` por política: verificar producción con `curl` por contenido, o en `localhost` con el servidor de desarrollo.

## Reglas que no son negociables

**Paridad i18n.** `src/i18n/translations.js` tiene `es`, `en`, `pt` y `de` (1161 claves por idioma al 2026-08-14). Toda clave nueva va en los CUATRO. Una clave que falta no rompe el build pero cae al fallback español (ver `useT.js`) — el usuario alemán ve una isla en su UI.

**`DB_VERSION` en `src/core/db/index.js`.** Está en 2. Subirlo obliga a escribir la migración; cambiarlo sin migración deja a los usuarios existentes con la base rota. No tocar a la ligera.

**Nada de datos financieros al servidor sin cifrar.** El sync empuja blobs cifrados con AES-GCM en el cliente. El servidor nunca ve montos ni categorías.

**Al importar movimientos hay que refrescar el modelo.** `dbAdd` solo escribe en IndexedDB; sin `rehydrate()` los datos no aparecen hasta recargar. Y sin `markLocalChange()` no suben a la nube. Ver `src/pages/Import/index.jsx`.

## Supabase

Seis `.sql` en la raíz. **`supabase-e2e-hardening.sql` es la fuente de verdad** de `sync_push`, `sync_pull` y `validate_license`: define `fnos_resolve_hash`, que acepta tanto la clave cruda como el hash de 64 caracteres.

Ya pasó una vez: volver a correr `supabase-sync.sql` **pisó** esa versión buena y reintrodujo un doble hash (`sha256(sha256(key))`), con lo que `validate_license` aceptaba una licencia que `sync_push` rechazaba con `invalid_license`. Si el sync falla para una licencia que valida bien, es esto. Correr `supabase-e2e-hardening.sql`.

## Sistema visual

Tokens en `src/styles/globals.css`.

- **Display: Archivo variable** (`--display`), compartida con la landing. Los ejes van en `--vf-hero` (cifra protagonista) y `--vf-head` (secciones y `.num`). **`font-weight` por sí solo no pide el ancho**: hay que declarar `font-variation-settings`. Y `font-variation-settings` gana a `font-weight`, así que un `fontWeight` inline al lado no hace nada.
- **`.num` para cifras** (lleva `tnum`, alinea en columna), `.num-hero` para la cifra protagonista.
- **Mono para datos, sans para lenguaje.** No usar `--mono` en prosa.
- Color por rol: `--grn` es marca; `--pos` / `--neg` / `--warn` / `--info` son semánticos de dato. No mezclarlos.

Si el sistema visual cambia aquí, cambia también en `../financeos-landing` (comparten display y ejes).

## Archivos delicados

- `src/core/db/index.js` — `DB_VERSION` y migraciones
- `src/utils/licenseValidator.js` — formato `FNOS-XXXX-XXXX-XXXX`
- `src/utils/taxCalcCL.js` — UTM de Chile hardcodeada, se queda vieja
- `src/utils/taxCalcDE.js` — Beitragsbemessungsgrenze DE + Grundfreibetrag hardcodeados
- `src/utils/apvCalc.js` — fórmula de valor futuro
- `docs/novedades.html` — histórico, preservar

## Convenciones sensibles al no violar

**Checkbox: siempre con `style={{width:16, height:16, flexShrink:0}}`.** La regla global `input { width:100% }` en `globals.css` aplica también a checkboxes; sin este override el checkbox ocupa el ancho completo del contenedor flex y empuja el texto lejos. Ver `Debts/Income/Movements/Steuer`.

**Agregar un país nuevo requiere tocar SIETE lugares:**
1. `Onboarding.jsx` — array `COUNTRIES`
2. `Settings/index.jsx` — `<option>` hardcoded (~L82)
3. `Dashboard/CountryTool.jsx` — map `TOOL_BY_COUNTRY`
4. `layout/Shell.jsx` — entry con `countries: ['XX']`
5. `App.jsx` + `demo/DemoShell.jsx` — lazy import + case
6. Página `pages/<Tool>/index.jsx` — usando `useT()` para todos los textos
7. `i18n/translations.js` — claves en los 4 idiomas

**Agregar un idioma nuevo requiere:**
1. Bloque nuevo `<code>: { ... }` en `translations.js` con paridad completa
2. `SUPPORTED_LANGUAGES` al final del archivo
3. `<option>` en `Settings/index.jsx` (~L74)
4. `LANGUAGES` array en `Onboarding.jsx` (~L39)

**Textos hardcoded en JSX = bug.** Si escribís `<div>Título</div>`, el usuario que cambie idioma va a ver solo esa isla en español. Todo texto visible debe pasar por `useT()` con `t('key')`. Aplica también a `label`/`placeholder`/`title`/`aria-*`.

## Gotchas de deploy y verificación

- **Service worker cachea agresivamente**. Post-deploy, para verificar cambios: `navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()))` + `caches.keys().then(ks => ks.forEach(k => caches.delete(k)))` + hard reload.
- **`~/Documents/.claude/launch.json`** es la config raíz de preview servers (fuera del repo). Si la ruta canónica del repo cambia, ese archivo también.
