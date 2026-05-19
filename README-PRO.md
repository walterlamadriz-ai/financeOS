# FinanceOS Pro — v1.0

App financiera white-label para asesores · PWA offline · React 18 + Vite

**Empresa:** MAXNOVA & LUCI Global LLC  
**Soporte:** maxnovaluciglobal@gmail.com (60 días desde la compra)  
**Desarrollado por:** Walter La Madriz

---

## Qué incluye este plan

- Todo lo del plan Personal
- **Licencia comercial — hasta 30 clientes**
- **config.js** — nombre, colores y moneda sin tocar código
- **Modo Asesor** — score, semáforo, alertas, notas por cliente
- **Reporte PDF profesional** de 2 páginas con suscripciones y señales
- **Diagnóstico financiero** con motor de reglas configurable (coachRules.js)
- **Guía de entrega al cliente** incluida
- Soporte técnico 60 días por email
- Actualizaciones por 12 meses

---

## Inicio rápido — 5 pasos

### Requisitos
- Node.js 18+ → https://nodejs.org

### 1. Instalá dependencias
```bash
cd FinanceOS-Pro-v1.0
npm install
```

### 2. Personalizá tu marca
Abrí `src/config.js`:
```js
app: {
  name: 'Tu nombre de app',
  tagline: 'Tu slogan',
  supportEmail: 'tu@email.com',
},
defaults: {
  currency: 'CLP',
}
```

### 3. Probá localmente
```bash
npm run dev
# Abrí: http://localhost:5173/app/
```

### 4. Publicá en Vercel
```bash
npm run build
```
Ver guía: https://financeos-landing-omega.vercel.app/docs/deploy.html

### 5. Entregá a tu primer cliente
Ver checklist: https://financeos-landing-omega.vercel.app/docs/deliver-client.html

---

## Módulos incluidos

| Módulo | Descripción |
|---|---|
| Dashboard | KPIs del mes, señales financieras, suscripciones |
| Ingresos | Registro por categoría y fecha |
| Gastos | Registro por categoría y fecha |
| Presupuestos | Límites por categoría con alertas |
| Deudas | Seguimiento de saldo, TAE y pagos mínimos |
| Metas | Progreso de ahorro con fecha objetivo |
| Proyección | Flujo de caja proyectado |
| Reportes | Análisis mensual con gráficos |
| Suscripciones | Análisis de gastos recurrentes estimados |
| Diagnóstico | Señales orientativas con motor de reglas local |
| **Modo Asesor** | Score, semáforo, alertas, notas, reporte PDF |

---

## Modo Asesor

El Modo Asesor está en el sidebar → sección "Asesor".

Incluye:
- Score financiero 0–100
- Semáforo verde/amarillo/rojo en 5 dimensiones
- Alertas automáticas basadas en datos del cliente
- Revisión de gastos recurrentes estimados
- Notas del asesor guardadas localmente
- Exportación de reporte PDF profesional de 2 páginas

Ver guía: https://financeos-landing-omega.vercel.app/docs/advisor.html

---

## Diagnóstico financiero — motor de reglas

El diagnóstico genera señales orientativas a partir de datos locales.
Las reglas están en `src/data/coachRules.js` — podés ajustar
umbrales y mensajes sin tocar componentes React.

```js
thresholds: {
  savingsRateGood: 0.20,       // 20% ahorro = saludable
  subscriptionRatioWarn: 0.07, // 7% suscripciones = atención
  debtLoadWarn: 0.30,          // 30% deuda/ingreso = atención
}
```

Sin IA externa. Sin envío de datos. 100% local.

---

## Personalización white-label

### Colores
En `src/styles/globals.css`:
```css
:root {
  --grn:  #tu-color-primario;
  --grn2: #version-oscura;
  --grn3: #version-brillante;
}
```

### Logo y nombre
En `src/config.js` → `app.name`

Ver guía completa: https://financeos-landing-omega.vercel.app/docs/white-label.html

---

## Backups — importante

Los datos de cada cliente se guardan en SU dispositivo.
Vos no tenés acceso a los datos de tus clientes.
Instruí a cada cliente para exportar un backup mensual desde Ajustes.

Ver guía: https://financeos-landing-omega.vercel.app/docs/backups.html

---

## Soporte técnico

Email: maxnovaluciglobal@gmail.com
Asunto: [FinanceOS Pro - Soporte] + descripción
Tiempo de respuesta: 48 horas hábiles
Vigencia: 60 días desde la fecha de compra

---

## Links

Ver LINKS.txt incluido en este paquete.

---

## Aviso legal

FinanceOS es una herramienta de organización y seguimiento financiero.
No constituye asesoría financiera, tributaria, contable ni de inversión.
El Diagnóstico financiero genera señales orientativas basadas en datos registrados.
No reemplaza la consulta con profesionales certificados.
Los asesores que redistribuyen FinanceOS son responsables de publicar
su propia política de privacidad adaptada a su jurisdicción.

© 2026 MAXNOVA & LUCI Global LLC — Licencia comercial incluida en LICENSE-PRO.txt
