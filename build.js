import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))

execSync('npx vite build', { stdio: 'inherit' })

const dist = path.join(__dirname, 'dist')
// dist/index.html: vercel.json ya redirige "/" a financeos-landing (la única
// landing real) — este archivo solo existe para que la ruta exacta /index.html
// no quede vacía. NO usar landing/index.html acá: ese archivo tenía pricing de
// un modelo de negocio ya abandonado y quedó sirviéndose en vivo sin que nadie
// lo notara (ver auditoría 2026-08-27). Un redirect real, no HTML estático.
fs.writeFileSync(path.join(dist, 'index.html'),
  '<!doctype html><meta http-equiv="refresh" content="0; url=https://www.financeospro.com/">' +
  '<link rel="canonical" href="https://www.financeospro.com/">'
)
fs.copyFileSync(path.join(__dirname, 'public', 'favicon.svg'), path.join(dist, 'favicon.svg'))

// Digital Asset Links (TWA Android): tiene que quedar en la raíz del dominio,
// no bajo /app/ — vite copia public/ a dist/app/, así que este paso lo saca
// a mano. Verifica la firma del paquete Android contra este dominio.
fs.mkdirSync(path.join(dist, '.well-known'), { recursive: true })
fs.copyFileSync(
  path.join(__dirname, 'public', '.well-known', 'assetlinks.json'),
  path.join(dist, '.well-known', 'assetlinks.json')
)

console.log('Build listo: dist/index.html + dist/app/ + dist/.well-known/assetlinks.json')
