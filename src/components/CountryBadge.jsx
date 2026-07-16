// src/components/CountryBadge.jsx
// Badge de país estilo sello de pasaporte — reemplaza las banderas emoji
// (que renderizan distinto en cada OS y no respetan el tema) por una marca
// monocroma consistente. Parte del lenguaje de "El Sello".
export default function CountryBadge({ code = '', size = 15, title }) {
  const cc = String(code).slice(0, 2).toUpperCase()
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} role="img"
      aria-label={title || cc} style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}>
      <circle cx="10" cy="10" r="9" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.9" />
      <text x="10" y="10.6" textAnchor="middle" dominantBaseline="middle"
        fontFamily="var(--mono, monospace)" fontSize="7.5" fontWeight="700"
        letterSpacing="0.3" fill="currentColor">{cc}</text>
    </svg>
  )
}
