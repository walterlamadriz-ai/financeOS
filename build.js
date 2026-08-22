import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))

execSync('npx vite build', { stdio: 'inherit' })

const dist = path.join(__dirname, 'dist')
let landing = fs.readFileSync(path.join(__dirname, 'landing', 'index.html'), 'utf8')
landing = landing.replace(/href="#demo"/g, 'href="/app"')
landing = landing.replace(/onclick="window\.location\.href='#'"/g, "onclick=\"window.location.href='/app'\"")
fs.writeFileSync(path.join(dist, 'index.html'), landing)
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
