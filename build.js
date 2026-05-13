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
console.log('Build listo: dist/index.html + dist/app/')
