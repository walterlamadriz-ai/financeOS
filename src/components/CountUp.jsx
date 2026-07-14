// src/components/CountUp.jsx
// Número que "cuenta" de 0 al valor final al montar. Tasteful, no decorativo:
// úsalo solo en cifras hero (KPIs, score, patrimonio), no en tablas densas.
// Respeta prefers-reduced-motion (muestra el valor final al instante).

import { useState, useRef, useEffect } from 'react'

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export default function CountUp({
  value,                                   // número destino
  format = (n) => Math.round(n).toLocaleString(),
  duration = 650,
  className,
  style,
}) {
  const target = Number(value) || 0
  const reduce = prefersReduced()
  const [n, setN] = useState(reduce ? target : 0)
  const raf = useRef()

  useEffect(() => {
    if (reduce) { setN(target); return }
    const start = performance.now()
    const tick = (t) => {
      const p = Math.min((t - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)   // easeOutCubic
      setN(target * eased)
      if (p < 1) raf.current = requestAnimationFrame(tick)
      else setN(target)                       // exactitud al cerrar
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
    // Re-anima solo cuando cambia el valor destino
  }, [target, duration, reduce])

  return <span className={className} style={style}>{format(n)}</span>
}
