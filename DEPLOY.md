# FinanceOS — Guía de Deploy

## Requisito previo: Node.js

Si no tienes Node.js instalado:
1. Ve a https://nodejs.org
2. Descarga la versión **LTS** (18 o superior)
3. Instala y reinicia la terminal
4. Verifica: `node --version` debe mostrar v18+

---

## Opción A — Deploy en Vercel (recomendado, gratis)

### Método 1: Drag & Drop (más rápido, sin GitHub)

```bash
# 1. Entra a la carpeta del proyecto
cd financeos

# 2. Instala dependencias
npm install

# 3. Genera el build de producción
npm run build
# → Crea la carpeta dist/
```

4. Ve a **https://vercel.com** → crea cuenta gratis
5. En el dashboard haz clic en **"Add New → Project"**
6. Elige **"Deploy without Git"** → arrastra la carpeta `dist/` completa
7. Vercel te da una URL tipo `financeos-abc123.vercel.app` en 30 segundos ✅

### Método 2: Conectar con GitHub (recomendado para actualizaciones)

```bash
# 1. Instala Git si no lo tienes: https://git-scm.com
git init
git add .
git commit -m "feat: FinanceOS v1.0 inicial"

# 2. Crea repo en github.com → botón "New repository"
# 3. Copia la URL del repo y ejecuta:
git remote add origin https://github.com/TU_USUARIO/financeos.git
git push -u origin main
```

4. En Vercel → "Add New → Project" → "Import Git Repository"
5. Selecciona el repo → Vercel detecta Vite automáticamente
6. Haz clic en **Deploy** → URL lista en 1-2 minutos ✅
7. Cada `git push` en el futuro redeploya automáticamente

---

## Opción B — Deploy en Netlify (alternativa)

### Método 1: Drag & Drop

```bash
npm install
npm run build
```

1. Ve a **https://app.netlify.com/drop**
2. Arrastra la carpeta `dist/` → URL instantánea ✅

### Método 2: Conectar GitHub
1. Netlify → "Add new site → Import from Git"
2. Conecta GitHub → selecciona repo
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Deploy ✅

---

## Dominio personalizado (opcional)

Una vez deployado en Vercel o Netlify:

1. En el dashboard del proyecto → **"Domains"**
2. Agrega tu dominio (ej. `financeos.magnova.io`)
3. Sigue las instrucciones para apuntar el DNS
4. SSL automático incluido ✅

Dominios gratis disponibles en Vercel: `tu-proyecto.vercel.app`

---

## Verificar que el PWA funciona

Una vez live en HTTPS:
1. Abre la URL en Chrome (móvil o desktop)
2. En móvil: menú → "Agregar a pantalla de inicio"
3. En desktop: ícono de instalación en la barra de URL
4. La app funciona offline después de la primera carga ✅

---

## Correr localmente (desarrollo)

```bash
npm install
npm run dev
# → http://localhost:5173
```

## Build y preview local antes de subir

```bash
npm run build
npm run preview
# → http://localhost:4173
```

---

## Checklist antes de compartir

- [ ] `npm run build` corre sin errores
- [ ] La app carga en la URL de producción
- [ ] Dashboard muestra datos demo al cargar
- [ ] Formularios guardan datos (IndexedDB)
- [ ] Dark mode funciona
- [ ] En móvil se ve bien
- [ ] PWA instalable desde el navegador
