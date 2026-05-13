// src/components/ui/Toast.jsx
import { useApp } from '../../context/AppContext.jsx'

export default function Toast() {
  const { toast } = useApp()
  if (!toast) return null

  const isError = toast.type === 'error'
  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      padding: '10px 18px',
      borderRadius: 8,
      fontSize: 12,
      fontFamily: 'var(--mono)',
      fontWeight: 500,
      background: isError ? 'var(--red)' : 'var(--grn)',
      color: '#fff',
      boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
      maxWidth: 400,
      textAlign: 'center',
      animation: 'fadeInUp 0.2s ease',
    }}>
      {isError ? '⚠ ' : '✓ '}{toast.msg}
      <style>{`@keyframes fadeInUp { from { opacity:0; transform:translateX(-50%) translateY(8px) } to { opacity:1; transform:translateX(-50%) translateY(0) } }`}</style>
    </div>
  )
}
