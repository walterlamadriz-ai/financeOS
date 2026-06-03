// src/components/LicenseGate.jsx
import { useState } from 'react'
import { validateLicense, saveLicense } from '../utils/licenseValidator.js'

export default function LicenseGate({ onActivate }) {
  const [key, setKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleActivate() {
    if (!key.trim()) return
    setLoading(true)
    setError('')
    try {
      const valid = await validateLicense(key)
      if (valid) {
        saveLicense(key)
        onActivate()
      } else {
        setError('Clave inválida. Verifica que la copiaste correctamente desde Gumroad.')
      }
    } catch(e) {
      setError('Error al validar. Intenta nuevamente.')
    }
    setLoading(false)
  }

  function handleKey(e) {
    if (e.key === 'Enter') handleActivate()
  }

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px',fontFamily:'var(--body)'}}>
      <div style={{background:'var(--card,#fff)',border:'1px solid var(--brd)',borderRadius:'16px',padding:'40px 36px',maxWidth:'420px',width:'100%'}}>

        <div style={{fontFamily:'var(--head)',fontSize:'22px',color:'var(--ink)',marginBottom:'4px',fontWeight:'600'}}>FinanceOS</div>
        <div style={{fontFamily:'var(--mono)',fontSize:'11px',color:'var(--ink3)',marginBottom:'32px'}}>v1.2 · MAXNOVA &amp; LUCI Global LLC</div>

        <div style={{fontSize:'18px',fontWeight:'600',color:'var(--ink)',marginBottom:'8px',fontFamily:'var(--head)'}}>Activa tu licencia</div>
        <div style={{fontSize:'13px',color:'var(--ink2)',marginBottom:'24px',lineHeight:'1.5',fontFamily:'var(--body)'}}>
          Ingresa la clave que recibiste al comprar en Gumroad. La encontrarás en tu email de confirmación.
        </div>

        <input
          style={{width:'100%',padding:'11px 14px',border:'1px solid var(--brd)',borderRadius:'8px',fontSize:'14px',fontFamily:'var(--mono)',background:'var(--bg)',color:'var(--ink)',letterSpacing:'1px',marginBottom:'12px',boxSizing:'border-box',outline:'none'}}
          type="text"
          placeholder="FNOS-XXXX-XXXX-XXXX"
          value={key}
          onChange={e => setKey(e.target.value.toUpperCase())}
          onKeyDown={handleKey}
          autoFocus
          spellCheck={false}
        />

        {error && (
          <div style={{fontSize:'12px',color:'#e84142',marginBottom:'12px',fontFamily:'var(--mono)',padding:'8px 12px',background:'rgba(232,65,66,.08)',borderRadius:'6px'}}>
            {error}
          </div>
        )}

        <button
          style={{width:'100%',padding:'12px',background: loading || !key.trim() ? 'var(--grn2,#0d7a52)' : 'var(--grn)',opacity: loading || !key.trim() ? 0.6 : 1,color:'#fff',border:'none',borderRadius:'8px',fontSize:'14px',fontWeight:'500',cursor: loading || !key.trim() ? 'not-allowed' : 'pointer',fontFamily:'var(--body)',marginBottom:'16px'}}
          onClick={handleActivate}
          disabled={loading || !key.trim()}
        >
          {loading ? 'Verificando...' : 'Activar FinanceOS →'}
        </button>

        <div style={{textAlign:'center',fontSize:'12px',color:'var(--ink3)',fontFamily:'var(--mono)'}}>
          ¿Quieres probar antes de comprar?{' '}
          <a href="https://demo.financeospro.com/app/?demo=true" target="_blank" rel="noopener noreferrer" style={{color:'var(--grn)',textDecoration:'none',fontWeight:'500'}}>
            Ver demo gratuito →
          </a>
        </div>

        <div style={{marginTop:'24px',padding:'12px',background:'rgba(0,0,0,.04)',borderRadius:'8px',fontSize:'11px',color:'var(--ink3)',lineHeight:'1.5',fontFamily:'var(--mono)'}}>
          Esta clave es personal e intransferible. No la compartas. Cada compra incluye una clave única de acceso. ¿Problemas? maxnovaluciglobal@gmail.com
        </div>

      </div>
    </div>
  )
}
