# FinanceOS Personal — v1.5

App de finanzas personales · PWA offline · React 18 + Vite

**Empresa:** MAXNOVA & LUCI Global LLC  
**Soporte:** maxnovaluciglobal@gmail.com  
**Desarrollado por:** Walter La Madriz

---

## Qué incluye este plan

- Código fuente completo React 18 + Vite
- 10 módulos: Dashboard, Ingresos, Gastos, Presupuestos, Deudas, Metas, Proyección, Reportes, Suscripciones, Ajustes
- **Puntaje de salud financiera** 0–100 en el Dashboard (Excelente / Bueno / Regular / Crítico)
- **Señales del Diagnóstico** visibles directamente en el Dashboard
- **Ingreso esperado vs recibido** — widget configurable en Ajustes
- **Diagnóstico mensual** con checklist de 5 puntos de revisión
- **FAB mobile** — botón flotante "+" para registro rápido en celular
- Análisis de suscripciones y gastos recurrentes
- PWA instalable en iPhone, Android y escritorio (también desde Ajustes)
- Onboarding de 6 pasos · 7 plantillas por perfil
- Sistema de backups JSON · Export CSV · Importación CSV
- Documentación completa

## Qué NO incluye este plan

- Licencia comercial (solo uso personal)
- Modo Asesor — al acceder verás pantalla de upgrade
- Reporte PDF — verás enlace de upgrade en lugar del botón de descarga
- APV Chile y Simulador de deudas — requieren plan Pro
- Soporte técnico directo

> Los módulos Pro muestran un badge **PRO** en el menú — es informativo y no afecta el uso del resto de la app.

---

## Inicio rápido — 3 pasos

### Requisitos
- Node.js 18+ → https://nodejs.org

### 1. Instalá dependencias
```bash
cd FinanceOS-Personal-v1.5
npm install
```

### 2. Probá localmente
```bash
npm run dev
# Abrí: http://localhost:5173/app/
```

### 3. Publicá en Vercel
```bash
npm run build
```
Subí la carpeta `dist/` a Vercel o Netlify.
Ver guía completa: https://financeos-landing-omega.vercel.app/docs/deploy.html

---

## Personalización básica

Abrí `src/config.js` y cambiá:
```js
app: {
  name: 'Mi app',
  supportEmail: 'tu@email.com',
},
defaults: {
  currency: 'CLP', // CLP, USD, EUR, VES, MXN, ARS, COP
}
```

---

## Módulos incluidos

| Módulo | Descripción |
|---|---|
| Dashboard | KPIs del mes · **Puntaje de salud 0–100** · señales del Diagnóstico · ingreso esperado vs recibido |
| Ingresos | Registro por categoría y fecha |
| Gastos | Registro por categoría y fecha |
| Presupuestos | Límites por categoría con alertas |
| Deudas | Seguimiento de saldo, TAE y pagos mínimos |
| Metas | Progreso de ahorro con fecha objetivo |
| Proyección | Flujo de caja proyectado |
| Reportes | Análisis mensual con gráficos |
| Suscripciones | Análisis de gastos recurrentes estimados |
| Diagnóstico | Señales orientativas + **checklist mensual** de 5 puntos de revisión |

---

## Backups — importante

Los datos se guardan en el navegador del dispositivo.
**Sin backup previo, los datos no se pueden recuperar.**

Crear backup: Ajustes → "Crear respaldo" → guardar el JSON en lugar seguro.

Ver guía: https://financeos-landing-omega.vercel.app/docs/backups.html

---

## Links

Ver LINKS.txt incluido en este paquete.

---

## Aviso legal

FinanceOS es una herramienta de organización y seguimiento financiero personal.
No constituye asesoría financiera, tributaria, contable ni de inversión.
El Diagnóstico financiero genera señales orientativas basadas en datos registrados.
No reemplaza la consulta con profesionales certificados.

© 2026 MAXNOVA & LUCI Global LLC — Licencia de uso personal incluida en LICENSE-PERSONAL.txt
