---
name: web-design-guidelines
description: >-
  Checklist accionable de calidad de interfaz web (adaptado de las Web Interface
  Guidelines de Vercel). Invócala al construir, revisar o auditar UI: componentes,
  formularios, interacciones, accesibilidad, animación, layout, contenido y
  performance. Úsala como rúbrica antes de dar por terminada una pantalla o un PR
  de frontend. En FinanceOS aplica a la app React (PWA) y al landing.
---

# Web Interface Guidelines

Rúbrica práctica para interfaces web de alta calidad. Adaptada de las **Web
Interface Guidelines** públicas de Vercel (https://vercel.com/design/guidelines
· repo `vercel/web-interface-guidelines`). Es una lista de verificación: al
construir o revisar UI, recorre las secciones relevantes y corrige lo que falle.

> Nota de mantenimiento: esta copia es una adaptación curada. Cuando haya acceso
> web, contrástala con la fuente canónica y actualízala (WebFetch al repo/página).

## Cómo usar esta skill
1. Identifica qué tipo de trabajo es (formulario, lista, modal, gráfico, layout…).
2. Recorre las secciones que apliquen como checklist.
3. Reporta lo que incumple con archivo:línea y corrígelo o proponlo.
4. Prioriza: accesibilidad y estados (loading/empty/error) antes que estética.

---

## Interactividad
- Todo lo accionable es un control real (`<button>`/`<a>`), operable con **teclado** (Tab, Enter/Espacio) y con **foco visible** (`:focus-visible`).
- Áreas táctiles ≥ 44×44px; en móvil no dependas de hover (no existe).
- Estados de un control: default, hover, focus, active, **disabled** (y el disabled comunica *por qué*), loading.
- Feedback inmediato: al enviar, muestra progreso; al completar, confirma (toast/estado). Nada de acciones "silenciosas".
- UI optimista donde tenga sentido, con reversión clara si falla.
- Acciones destructivas: confirma o da **deshacer** (mejor undo que un `confirm()` bloqueante).
- No bloquees el hilo principal; debounce/throttle en input costoso.
- Evita saltos de layout (CLS) al cargar contenido: reserva espacio (skeletons, `min-height`).

## Accesibilidad
- **HTML semántico** primero; ARIA solo cuando no hay elemento nativo. Un `div onClick` no es un botón.
- Contraste **WCAG AA** (4.5:1 texto normal, 3:1 texto grande/íconos). Verifica pares reales de la paleta.
- Respeta `prefers-reduced-motion` (desactiva/atenúa animación) y `prefers-color-scheme` (temas claro/oscuro reales, no invertidos).
- Modales/sheets: `role="dialog"`, `aria-modal`, **focus-trap**, foco al abrir, retorno de foco al cerrar, Esc para cerrar.
- Cambios dinámicos importantes se anuncian (`aria-live="polite"` en toasts/resultados).
- Imágenes con `alt` significativo (o `alt=""` si son decorativas). Íconos-botón con `aria-label`.
- No transmitas significado **solo** por color (añade ícono/texto/forma).

## Formularios
- Cada input con `<label>` asociado (o `aria-label`). Placeholder ≠ label.
- Tipos e `inputmode` correctos: `type="email"`, `inputmode="decimal"` para montos, `enterKeyHint`, `autocomplete`.
- **font-size ≥ 16px** en inputs para evitar el auto-zoom de iOS Safari.
- Enter envía; el foco inicial va al primer campo relevante.
- Validación clara: mensaje inline junto al campo, explica **qué** y **cómo** arreglar. **No borres** lo que el usuario escribió al fallar.
- Estados de envío: deshabilita el submit mientras procesa; evita doble envío.

## Animación y movimiento
- Con propósito (orienta, da continuidad, confirma), no decorativa. El exceso lee como "auto-generado".
- Rápida: micro-interacciones ~120–260ms; transiciones de página cortas. Curvas `ease`/spring, no lineales.
- Anima **transform** y **opacity** (compositor); evita animar layout (width/height/top).
- Siempre bajo `@media (prefers-reduced-motion: reduce)`.

## Layout y espaciado
- Escala de espaciado consistente (tokens, ritmo de 4/8px), no números mágicos sueltos.
- Ancho de lectura cómodo (~60–75ch); ancho de contenido máximo coherente entre páginas.
- Sin scroll horizontal en el body: contenido ancho (tablas, código, diagramas) va en su propio contenedor `overflow-x:auto`.
- Alineación óptica > matemática cuando el ojo lo pide. Jerarquía visual clara (tamaño, peso, color).
- Números en columnas: `font-variant-numeric: tabular-nums`.
- Safe areas de iOS: `viewport-fit=cover` + `env(safe-area-inset-*)`; usa `100dvh` en vez de `100vh`.

## Contenido y copy
- Voz activa, específica, del lado del usuario (nombra las cosas como la gente las reconoce, no como el sistema las implementa).
- Un control dice exactamente qué hace ("Publicar" → toast "Publicado").
- Errores sin disculpas ni vaguedad: qué pasó y cómo seguir.
- Cubre **siempre** los estados: vacío (con CTA que enseñe para qué sirve), cargando, error, y con-datos.
- Truncar con elipsis + tooltip/título; nunca cortes un número a media cifra.

## Performance percibida
- Cuida los Core Web Vitals: **LCP** (contenido principal rápido), **CLS** (cero saltos), **INP** (respuesta a input <200ms).
- Lazy-load de lo pesado; virtualiza listas largas; imágenes con tamaño intrínseco y `loading="lazy"`.
- Precarga lo crítico, difiere lo secundario. Evita dependencias grandes por un ícono (tree-shake o SVG inline).

## Diseño y sistema
- Tokens de color/tipografía/espaciado/elevación como fuente única; nada hardcodeado que ignore el tema.
- Cada color significa **una** cosa (marca ≠ semántico ≠ categórico). El semántico (bien/alerta/crítico) es aparte del acento.
- Tipografía deliberada: par display+cuerpo con intención, escala definida, sin caer en fuentes "seguras" por defecto.
- Elevación/profundidad sutil y consistente; bordes visibles en pantallas 1x (≥1px).

---

## Notas específicas de FinanceOS
- Es **PWA mobile-first**: prioriza teclados correctos, safe-areas, targets 44px y `100dvh`.
- **Trilingüe es/en/pt**: el layout aguanta longitudes variables; toda string nueva entra ×3 (paridad i18n).
- **Service worker afinado** contra pantalla negra: NO migrar a History API con rutas reales.
- Montos grandes (COP): nunca truncar a media cifra; `tabular-nums`.
- Tokens y sistema de diseño ya existen en `src/styles/globals.css` y `src/components/ui/` — aplícalos, no reinventes.
