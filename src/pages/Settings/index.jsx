// src/pages/Settings/index.jsx — v1.5
import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { Card, CardHeader, Btn, PageHeader } from '../../components/ui/index.jsx'
import { BackupWarning } from '../../components/legal/MicroCopy.jsx'
import BackupManager from '../../components/backup/BackupManager.jsx'
import TemplateSelector from '../../components/templates/TemplateSelector.jsx'
import { CURRENCY_OPTIONS, DEFAULT_USD_RATES } from '../shared/constants.js'
import { clearLicense, getLicensePlan, getLicenseKey } from '../../utils/licenseValidator.js'
import { isSyncEnabled, syncMeta, syncAvailable } from '../../core/sync.js'

export default function Settings() {
  const { settings, updateSettings, clearAll, loadDemo, exportCSV, enableSync, disableSync } = useApp()
  const [installPrompt, setInstallPrompt] = useState(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    function onBeforeInstall(e) { e.preventDefault(); setInstallPrompt(e) }
    function onAppInstalled() { setInstalled(true); setInstallPrompt(null) }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onAppInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onAppInstalled)
    }
  }, [])

  async function handleInstall() {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') setInstalled(true)
    setInstallPrompt(null)
  }

  async function handleClear() {
    if (window.confirm('¿Borrar TODOS los datos? Esta acción no se puede deshacer.')) {
      await clearAll()
    }
  }

  const isDemo = typeof window !== 'undefined' && window.location.search.includes('demo=true')
  function handleDeactivate() {
    if (window.confirm('¿Desactivar la licencia en este dispositivo?\n\nTendrás que volver a ingresar tu clave para entrar.\nTus datos financieros NO se borran.')) {
      clearLicense()
      window.location.reload()
    }
  }

  const srow = { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 0', borderBottom:'0.5px solid var(--brd)' }
  const slbl = { fontSize:13, fontWeight:500, color:'var(--tx)' }
  const ssub = { fontSize:10, color:'var(--th)', fontFamily:'var(--mono)', marginTop:1 }

  return (
    <div className="stack">
      <PageHeader title="Ajustes" sub="Personalización y gestión de datos" />
      <Card>
        <CardHeader title="Preferencias" />
        <div style={srow}>
          <div><div style={slbl}>Moneda</div><div style={ssub}>Símbolo y formato</div></div>
          <select style={{width:'auto'}} value={settings.currency||'CLP'} onChange={e=>updateSettings({...settings,currency:e.target.value})}>
            {CURRENCY_OPTIONS.map(c=><option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
        </div>
        <div style={srow}>
          <div><div style={slbl}>Idioma</div><div style={ssub}>Español / English</div></div>
          <select style={{width:'auto'}} value={settings.language||'es'} onChange={e=>updateSettings({...settings,language:e.target.value})}>
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </div>
        <div style={srow}>
          <div><div style={slbl}>País</div><div style={ssub}>Activa funciones regionales</div></div>
          <select style={{width:'auto'}} value={settings.country||'CL'} onChange={e=>updateSettings({...settings,country:e.target.value})}>
            <option value="CL">🇨🇱 Chile</option>
            <option value="MX">🇲🇽 México</option>
            <option value="AR">🇦🇷 Argentina</option>
            <option value="CO">🇨🇴 Colombia</option>
            <option value="EC">🇪🇨 Ecuador</option>
            <option value="PE">🇵🇪 Perú</option>
            <option value="VE">🇻🇪 Venezuela</option>
            <option value="US">🇺🇸 USA</option>
            <option value="ES">🇪🇸 España</option>
            <option value="PT">🇵🇹 Portugal</option>
            <option value="OTHER">🌎 Otro</option>
          </select>
        </div>
        <div style={srow}>
          <div><div style={slbl}>Tema visual</div><div style={ssub}>Claro u oscuro</div></div>
          <div style={{display:'flex',gap:6}}>
            <Btn variant={settings.theme==='light'?'primary':'ghost'} size="sm" onClick={()=>updateSettings({...settings,theme:'light'})}>Claro</Btn>
            <Btn variant={settings.theme==='dark' ?'primary':'ghost'} size="sm" onClick={()=>updateSettings({...settings,theme:'dark' })}>Oscuro</Btn>
          </div>
        </div>

        {/* Moneda secundaria */}
        <div style={srow}>
          <div>
            <div style={slbl}>Mostrar equivalente en USD</div>
            <div style={ssub}>KPIs del Dashboard muestran tu moneda + US$ simultáneamente</div>
          </div>
          <button
            onClick={() => {
              const next = !settings.showDualCurrency
              const rate = settings.usdRate || DEFAULT_USD_RATES[settings.currency || 'CLP'] || 1
              updateSettings({ ...settings, showDualCurrency: next, usdRate: rate })
            }}
            style={{
              width:44, height:24, borderRadius:12, position:'relative', flexShrink:0, cursor:'pointer',
              background: settings.showDualCurrency ? 'var(--grn)' : 'var(--brd2)',
              border: 'none', transition:'.2s', padding:0,
            }}
          >
            <span style={{
              position:'absolute', top:3, left: settings.showDualCurrency ? 23 : 3,
              width:18, height:18, borderRadius:'50%', background:'#fff', transition:'.2s',
              display:'block',
            }}/>
          </button>
        </div>

        {settings.showDualCurrency && settings.currency !== 'USD' && (
          <div style={{...srow, borderBottom:'none', flexDirection:'column', alignItems:'flex-start', gap:10}}>
            <div>
              <div style={slbl}>Tipo de cambio — 1 USD = ? {settings.currency || 'CLP'}</div>
              <div style={ssub}>Actualiza el valor manualmente cuando cambie. Orientativo, no para uso financiero formal.</div>
            </div>
            <div style={{display:'flex', alignItems:'center', gap:8, width:'100%'}}>
              <input
                type="number" min="0" step="any"
                value={settings.usdRate || DEFAULT_USD_RATES[settings.currency] || ''}
                placeholder={String(DEFAULT_USD_RATES[settings.currency] || '')}
                onChange={e => updateSettings({...settings, usdRate: parseFloat(e.target.value) || 0})}
                style={{flex:1, padding:'7px 10px', borderRadius:6, border:'.5px solid var(--brd2)',
                  background:'var(--sur2)', color:'var(--tx)', fontSize:13, fontFamily:'var(--mono)'}}
              />
              <span style={{fontSize:12, color:'var(--th)', fontFamily:'var(--mono)', whiteSpace:'nowrap'}}>
                {settings.currency || 'CLP'} por 1 USD
              </span>
              <Btn variant="ghost" size="sm"
                onClick={() => updateSettings({...settings, usdRate: DEFAULT_USD_RATES[settings.currency] || 1})}>
                Restablecer
              </Btn>
            </div>
            {settings.usdRate > 0 && (
              <div style={{fontSize:10, color:'var(--accent)', fontFamily:'var(--mono)'}}>
                → US$1 = {Number(settings.usdRate).toLocaleString('es-CL')} {settings.currency} · US$100 = {(settings.usdRate * 100).toLocaleString('es-CL')} {settings.currency}
              </div>
            )}
          </div>
        )}
        {settings.showDualCurrency && settings.currency === 'USD' && (
          <div style={{...srow, borderBottom:'none'}}>
            <div style={{fontSize:11, color:'var(--th)', fontFamily:'var(--mono)'}}>
              Tu moneda principal ya es USD — el equivalente dual no aplica.
            </div>
          </div>
        )}
      </Card>
      <Card>
        <CardHeader title="Plantillas por perfil" />
        <div style={{fontSize:11,color:'var(--th)',fontFamily:'var(--mono)',marginBottom:12,lineHeight:1.5}}>
          Selecciona un perfil para configurar categorías y presupuestos sugeridos. Tus datos registrados no se modifican.
        </div>
        <TemplateSelector />
      </Card>
      <Card>
        <CardHeader title="Respaldo y restauración" />
        <BackupManager />
      </Card>
      <Card>
        <CardHeader title="Sincronización entre dispositivos" />
        <SyncSection enableSync={enableSync} disableSync={disableSync} />
      </Card>
      <Card>
        <CardHeader title="Otras acciones" />
        <div style={srow}>
          <div><div style={slbl}>Exportar CSV</div><div style={ssub}>Ingresos y gastos · compatible Excel</div></div>
          <Btn variant="ghost" size="sm" onClick={exportCSV}>Descargar CSV</Btn>
        </div>
        <div style={srow}>
          <div><div style={slbl}>Cargar datos demo</div><div style={ssub}>Sobrescribe con datos de ejemplo</div></div>
          <Btn variant="ghost" size="sm" onClick={loadDemo}>Cargar demo</Btn>
        </div>
        <div style={srow}>
          <div><div style={slbl}>Reiniciar onboarding</div><div style={ssub}>Volver al asistente de configuración inicial</div></div>
          <Btn variant="ghost" size="sm" onClick={()=>updateSettings({...settings,onboardingDone:false})}>Reiniciar</Btn>
        </div>
        {!isDemo && (
          <div style={srow}>
            <div><div style={slbl}>Licencia · plan {getLicensePlan() === 'pro' ? 'Pro' : 'Personal'}</div><div style={ssub}>Desactivar en este dispositivo · tus datos NO se borran</div></div>
            <Btn variant="ghost" size="sm" onClick={handleDeactivate}>Desactivar licencia</Btn>
          </div>
        )}
        <div style={{...srow,borderBottom:'none'}}>
          <div><div style={slbl}>Borrar todos los datos</div><div style={ssub}>Acción irreversible · sin recuperación posible</div></div>
          <Btn variant="danger" size="sm" onClick={handleClear}>Borrar todo</Btn>
        </div>
      </Card>
      <Card>
        <CardHeader title="¿Dónde se guardan tus datos?" />
        <div style={{fontSize:12,color:'var(--tm)',lineHeight:1.8,display:'flex',flexDirection:'column',gap:8}}>
          <div><span style={{fontWeight:600,color:'var(--tx)'}}>IndexedDB del navegador</span> — todos tus ingresos, gastos, presupuestos, metas y deudas se guardan localmente en este dispositivo usando la base de datos interna del navegador.</div>
          <div><span style={{fontWeight:600,color:'var(--tx)'}}>Sin servidor</span> — FinanceOS no envía tus datos a ningún servidor externo. No existe una cuenta de usuario, no hay sincronización en la nube.</div>
          <div><span style={{fontWeight:600,color:'var(--tx)'}}>Respaldo manual</span> — si cambiás de dispositivo o reinstalás el navegador, usá "Respaldo y restauración" para exportar e importar tu archivo JSON.</div>
          <div style={{fontSize:10,fontFamily:'var(--mono)',color:'var(--th)',marginTop:4}}>🔒 Datos 100% privados · sin telemetría · sin cookies de seguimiento</div>
        </div>
      </Card>
      {(installPrompt || installed) && (
        <Card>
          <CardHeader title="Instalar como app" />
          <div style={{...srow, borderBottom:'none'}}>
            <div>
              <div style={slbl}>{installed ? '✓ App instalada' : 'Agregar a pantalla de inicio'}</div>
              <div style={ssub}>{installed ? 'FinanceOS funciona como app nativa en este dispositivo.' : 'Instalá FinanceOS como PWA para acceso sin navegador y modo offline total.'}</div>
            </div>
            {!installed && <Btn variant="ghost" size="sm" onClick={handleInstall}>Instalar →</Btn>}
          </div>
        </Card>
      )}
      <BackupWarning />
      <div style={{padding:'10px 12px',background:'var(--sur2)',borderRadius:'var(--r)',border:'0.5px solid var(--brd)',fontSize:10,color:'var(--th)',fontFamily:'var(--mono)',lineHeight:1.7,marginTop:8}}>
        FinanceOS v1.5 · MAXNOVA & LUCI Global LLC · Datos locales · Sin servidor · No asesoría financiera certificada
      </div>
    </div>
  )
}

// ── Sincronización entre dispositivos (opt-in, ligada a la licencia, cifrada) ──
function SyncSection({ enableSync, disableSync }) {
  const [on, setOn]       = useState(isSyncEnabled())
  const [busy, setBusy]   = useState(false)
  const [tick, setTick]   = useState(0) // refresca el estado tras acciones
  const available = syncAvailable()
  const hasKey    = !!getLicenseKey()
  const meta      = syncMeta()
  const lastSync  = meta.lastPushedAt || meta.lastPulledAt || meta.lastLocalChange
  const lastTxt   = lastSync ? new Date(lastSync).toLocaleString() : '—'

  async function toggle() {
    if (busy) return
    setBusy(true)
    try {
      if (on) { disableSync(); setOn(false) }
      else {
        const r = await enableSync()
        setOn(!!(r && r.ok))
      }
    } finally { setBusy(false); setTick(t => t + 1) }
  }

  const lbl = { fontSize: 13, color: 'var(--tx)', fontWeight: 500 }
  const sub = { fontSize: 11, color: 'var(--th)', fontFamily: 'var(--mono)', lineHeight: 1.6, marginTop: 4 }

  return (
    <div>
      {!hasKey ? (
        <div style={sub}>La sincronización requiere una licencia activa. Activá tu clave para usarla.</div>
      ) : !available ? (
        <div style={sub}>La sincronización no está disponible en este entorno.</div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={lbl}>{on ? '✓ Sincronización activada' : 'Sincronizar PC ↔ teléfono'}</div>
              <div style={sub}>
                {on
                  ? `Última sincronización: ${lastTxt}`
                  : 'Mantené tus datos iguales en todos tus dispositivos con la misma licencia.'}
              </div>
            </div>
            <Btn variant={on ? 'ghost' : 'primary'} onClick={toggle} disabled={busy}>
              {busy ? '…' : on ? 'Desactivar' : 'Activar'}
            </Btn>
          </div>
          <div style={{ ...sub, marginTop: 10, padding: '8px 10px', background: 'var(--sur2)', borderRadius: 'var(--r)', border: '0.5px solid var(--brd)' }}>
            🔒 Cifrado de extremo a extremo: tus datos se guardan cifrados con una llave derivada de tu clave; el servidor no puede leerlos. Ligado a tu licencia, sin cuenta ni contraseña. Última edición gana entre dispositivos.
          </div>
        </>
      )}
    </div>
  )
}
