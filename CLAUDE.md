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

**Paridad i18n.** `src/i18n/translations.js` tiene `es`, `en` y `pt`. Toda clave nueva va en los tres. Una clave que falta no rompe el build: se muestra el identificador crudo en pantalla.

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
- `src/utils/apvCalc.js` — fórmula de valor futuro
- `docs/novedades.html` — histórico, preservar
