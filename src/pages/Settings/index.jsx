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
import { pushSupported, isPushEnabled, enablePush, disablePush } from '../../core/push.js'
import { useT } from '../../i18n/useT.js'
import { moneyLocale } from '../../utils/index.js'
import { validateTaxId, TAX_ID_COUNTRIES, TAX_ID_LABEL } from '../../utils/taxIdValidation.js'

export default function Settings() {
  const { settings, updateSettings, clearAll, loadDemo, exportCSV, enableSync, disableSync } = useApp()
  const { t } = useT()
  const [installPrompt, setInstallPrompt] = useState(null)
  const [installed, setInstalled] = useState(false)
  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
  const isStandalone = typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true)

  useEffect(() => {
    function onBeforeInstall(e) { e.preventDefault(); setInstallPrompt(e) }
    function onAppInstalled() { setInstalled(true); setInstallPrompt(null) }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onAppInstalled)
    if (isStandalone) setInstalled(true)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onAppInstalled)
    }
  }, [isStandalone])

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
      <PageHeader title={t('settings.title')} sub={t('settings.sub')} />
      <Card>
        <CardHeader title={t('settings.preferences')} />
        <div style={srow}>
          <div><div style={slbl}>{t('settings.currency.label')}</div><div style={ssub}>{t('settings.currency.sub')}</div></div>
          <select style={{width:'auto'}} value={settings.currency||'CLP'} onChange={e=>updateSettings({...settings,currency:e.target.value})}>
            {CURRENCY_OPTIONS.map(c=><option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
        </div>
        <div style={srow}>
          <div><div style={slbl}>{t('settings.language.label')}</div><div style={ssub}>{t('settings.language.sub')}</div></div>
          <select style={{width:'auto'}} value={settings.language||'es'} onChange={e=>updateSettings({...settings,language:e.target.value})}>
            <option value="es">Español</option>
            <option value="en">English</option>
            <option value="pt">Português</option>
            <option value="de">Deutsch</option>
          </select>
        </div>
        <div style={srow}>
          <div><div style={slbl}>{t('settings.country.label')}</div><div style={ssub}>{t('settings.country.sub')}</div></div>
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
            <option value="DE">🇩🇪 Alemania</option>
            <option value="OTHER">🌎 Otro</option>
          </select>
        </div>
        <TaxIdField country={settings.country} taxId={settings.taxId} updateSettings={updateSettings} settings={settings} />
        <div style={srow}>
          <div><div style={slbl}>{t('settings.theme.label')}</div><div style={ssub}>{t('settings.theme.sub')}</div></div>
          <div style={{display:'flex',gap:6}}>
            <Btn variant={settings.theme==='light'?'primary':'ghost'} size="sm" onClick={()=>updateSettings({...settings,theme:'light'})}>{t('settings.theme.light')}</Btn>
            <Btn variant={settings.theme==='dark' ?'primary':'ghost'} size="sm" onClick={()=>updateSettings({...settings,theme:'dark' })}>{t('settings.theme.dark')}</Btn>
          </div>
        </div>

        {/* Moneda secundaria */}
        <div style={srow}>
          <div>
            <div style={slbl}>{t('settings.dualCurrency.label')}</div>
            <div style={ssub}>{t('settings.dualCurrency.sub')}</div>
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
              border: 'none', transition:'background .2s', padding:0,
            }}
          >
            <span style={{
              position:'absolute', top:3, left:3,
              width:18, height:18, borderRadius:'50%', background:'#fff',
              transform: settings.showDualCurrency ? 'translateX(20px)' : 'translateX(0)',
              transition:'transform .2s', display:'block',
            }}/>
          </button>
        </div>

        {settings.showDualCurrency && settings.currency !== 'USD' && (
          <div style={{...srow, borderBottom:'none', flexDirection:'column', alignItems:'flex-start', gap:10}}>
            <div>
              <div style={slbl}>{t('settings.exchangeRate.label', { currency: settings.currency || 'CLP' })}</div>
              <div style={ssub}>{t('settings.exchangeRate.sub')}</div>
            </div>
            <div style={{display:'flex', alignItems:'center', gap:8, width:'100%'}}>
              <input
                type="number" inputMode="decimal" min="0" step="any"
                value={settings.usdRate || DEFAULT_USD_RATES[settings.currency] || ''}
                placeholder={String(DEFAULT_USD_RATES[settings.currency] || '')}
                onChange={e => updateSettings({...settings, usdRate: parseFloat(e.target.value) || 0})}
                style={{flex:1, padding:'7px 10px', borderRadius:6, border:'.5px solid var(--brd2)',
                  background:'var(--sur2)', color:'var(--tx)', fontSize:13, fontFamily:'var(--mono)'}}
              />
              <span style={{fontSize:12, color:'var(--th)', fontFamily:'var(--mono)', whiteSpace:'nowrap'}}>
                {t('settings.exchangeRate.perUsd', { currency: settings.currency || 'CLP' })}
              </span>
              <Btn variant="ghost" size="sm"
                onClick={() => updateSettings({...settings, usdRate: DEFAULT_USD_RATES[settings.currency] || 1})}>
                {t('settings.exchangeRate.reset')}
              </Btn>
            </div>
            {settings.usdRate > 0 && (
              <div style={{fontSize:10, color:'var(--accent)', fontFamily:'var(--mono)'}}>
                → US$1 = {Number(settings.usdRate).toLocaleString(moneyLocale())} {settings.currency} · US$100 = {(settings.usdRate * 100).toLocaleString(moneyLocale())} {settings.currency}
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
        <CardHeader title={t('settings.templates.title')} />
        <div style={{fontSize:11,color:'var(--th)',fontFamily:'var(--mono)',marginBottom:12,lineHeight:1.5}}>
          {t('settings.templates.sub')}
        </div>
        <TemplateSelector />
      </Card>
      <Card>
        <CardHeader title={t('settings.backup.title')} />
        <BackupManager />
      </Card>
      <Card>
        <CardHeader title={t('settings.sync.title')} />
        <SyncSection enableSync={enableSync} disableSync={disableSync} />
      </Card>
      <Card>
        <CardHeader title={t('settings.push.title')} />
        <PushSection />
      </Card>
      <Card>
        <CardHeader title={t('settings.otherActions.title')} />
        <div style={srow}>
          <div><div style={slbl}>{t('settings.exportCsv.label')}</div><div style={ssub}>{t('settings.exportCsv.sub')}</div></div>
          <Btn variant="ghost" size="sm" onClick={exportCSV}>{t('settings.exportCsv.btn')}</Btn>
        </div>
        <div style={srow}>
          <div><div style={slbl}>{t('settings.loadDemo.label')}</div><div style={ssub}>{t('settings.loadDemo.sub')}</div></div>
          <Btn variant="ghost" size="sm" onClick={loadDemo}>{t('settings.loadDemo.btn')}</Btn>
        </div>
        <div style={srow}>
          <div><div style={slbl}>{t('settings.resetOnboarding.label')}</div><div style={ssub}>{t('settings.resetOnboarding.sub')}</div></div>
          <Btn variant="ghost" size="sm" onClick={()=>updateSettings({...settings,onboardingDone:false})}>{t('settings.resetOnboarding.btn')}</Btn>
        </div>
        {!isDemo && (
          <div style={srow}>
            <div><div style={slbl}>{t('settings.license.label', { plan: getLicensePlan() === 'pro' ? 'Pro' : 'Personal' })}</div><div style={ssub}>{t('settings.license.sub')}</div></div>
            <Btn variant="ghost" size="sm" onClick={handleDeactivate}>{t('settings.license.btn')}</Btn>
          </div>
        )}
        <div style={{...srow,borderBottom:'none'}}>
          <div><div style={slbl}>{t('settings.clearAll.label')}</div><div style={ssub}>{t('settings.clearAll.sub')}</div></div>
          <Btn variant="danger" size="sm" onClick={handleClear}>{t('settings.clearAll.btn')}</Btn>
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
      {(installPrompt || installed || (isIOS && !isStandalone)) && (
        <Card>
          <CardHeader title={t('settings.install.title')} />
          <div style={{...srow, borderBottom:'none'}}>
            <div>
              <div style={slbl}>{installed ? t('settings.install.installed.label') : t('settings.install.pending.label')}</div>
              <div style={ssub}>
                {installed ? t('settings.install.installed.sub')
                  : isIOS ? 'En Safari: tocá el ícono de compartir ⬆ → "Añadir a pantalla de inicio".'
                  : t('settings.install.pending.sub')}
              </div>
            </div>
            {!installed && !isIOS && <Btn variant="ghost" size="sm" onClick={handleInstall}>{t('settings.install.btn')}</Btn>}
          </div>
        </Card>
      )}
      <div style={{padding:'10px 12px',background:'var(--sur2)',borderRadius:'var(--r)',border:'0.5px solid var(--brd)',fontSize:10,color:'var(--th)',fontFamily:'var(--mono)',lineHeight:1.7,marginTop:8}}>
        FinanceOS v1.5 · MAXNOVA & LUCI Global LLC · Datos locales · Sin servidor · No asesoría financiera certificada
      </div>
    </div>
  )
}

// ── Identificador fiscal (RUT/RFC/CUIT/RIF/NIF/USt-IdNr/EIN según país) ────────
// Validación 100 % local (dígito verificador real para CL/MX/AR/VE/ES/PT;
// solo formato para DE/US — ver src/utils/taxIdValidation.js para el porqué).
// No se llama a VIES desde acá: el endpoint REST de VIES no manda cabeceras
// CORS, así que un fetch() desde el navegador de la app fallaría siempre.
function TaxIdField({ country, taxId, updateSettings, settings }) {
  const { t } = useT()
  const cc = (country || '').toUpperCase()
  if (!TAX_ID_COUNTRIES.includes(cc)) return null

  const label = TAX_ID_LABEL[cc]
  const result = taxId ? validateTaxId(cc, taxId) : null

  const srow = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0', borderBottom: '0.5px solid var(--brd)' }
  const sub = { fontSize: 10, color: 'var(--th)', fontFamily: 'var(--mono)', marginTop: 1 }
  const lbl = { fontSize: 13, fontWeight: 500, color: 'var(--tx)' }

  let feedback = null
  if (result) {
    if (result.valid === true) {
      feedback = { text: t('settings.taxId.valid', { label }), color: 'var(--pos, #2e7d32)' }
    } else if (result.reason === 'checkDigit') {
      feedback = { text: t('settings.taxId.invalidCheckDigit'), color: 'var(--neg, #c0392b)' }
    } else if (result.reason === 'format') {
      feedback = { text: t('settings.taxId.invalidFormat', { label }), color: 'var(--neg, #c0392b)' }
    }
  }

  return (
    <div style={{ ...srow, flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
      <div>
        <div style={lbl}>{t('settings.taxId.title', { label })}</div>
        <div style={sub}>{t('settings.taxId.sub')}</div>
      </div>
      <input
        type="text"
        value={taxId || ''}
        placeholder={t('settings.taxId.placeholder', { label })}
        onChange={e => updateSettings({ ...settings, taxId: e.target.value })}
        style={{
          width: '100%', padding: '7px 10px', borderRadius: 6, border: '.5px solid var(--brd2)',
          background: 'var(--sur2)', color: 'var(--tx)', fontSize: 13, fontFamily: 'var(--mono)',
          textTransform: 'uppercase',
        }}
      />
      {feedback && (
        <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: feedback.color }}>{feedback.text}</div>
      )}
      {result?.checkedVia === 'format-only' && (
        <div style={{ ...sub, lineHeight: 1.5 }}>{t('settings.taxId.formatOnly', { label })}</div>
      )}
    </div>
  )
}

// ── Sincronización entre dispositivos (opt-in, ligada a la licencia, cifrada) ──
function SyncSection({ enableSync, disableSync }) {
  const { t } = useT()
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
        <div style={sub}>{t('settings.sync.noLicense')}</div>
      ) : !available ? (
        <div style={sub}>{t('settings.sync.unavailable')}</div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={lbl}>{on ? t('settings.sync.on') : t('settings.sync.off')}</div>
              <div style={sub}>
                {on ? t('settings.sync.lastSync', { time: lastTxt }) : t('settings.sync.offDesc')}
              </div>
            </div>
            <Btn variant={on ? 'ghost' : 'primary'} onClick={toggle} disabled={busy}>
              {busy ? t('settings.sync.busy') : on ? t('settings.sync.disable') : t('settings.sync.enable')}
            </Btn>
          </div>
          <div style={{ ...sub, marginTop: 10, padding: '8px 10px', background: 'var(--sur2)', borderRadius: 'var(--r)', border: '0.5px solid var(--brd)' }}>
            {t('settings.sync.e2e')}
          </div>
        </>
      )}
    </div>
  )
}

// ── Notificaciones push (opt-in, ligadas a la licencia) ────────────────────────
function PushSection() {
  const { t } = useT()
  const [on, setOn]     = useState(isPushEnabled())
  const [busy, setBusy] = useState(false)
  const [msg, setMsg]   = useState('')
  const hasKey    = !!getLicenseKey()
  const supported = pushSupported()

  const lbl = { fontSize: 13, color: 'var(--tx)', fontWeight: 500 }
  const sub = { fontSize: 11, color: 'var(--th)', fontFamily: 'var(--mono)', lineHeight: 1.6, marginTop: 4 }

  async function toggle() {
    if (busy) return
    setBusy(true); setMsg('')
    try {
      if (on) {
        await disablePush()
        setOn(false)
      } else {
        const r = await enablePush()
        if (r.ok) { setOn(true) }
        else {
          setMsg(r.error === 'permission_denied'
            ? t('settings.push.permissionDenied')
            : t('settings.push.genericError'))
        }
      }
    } finally { setBusy(false) }
  }

  return (
    <div>
      {!hasKey ? (
        <div style={sub}>{t('settings.push.noLicense')}</div>
      ) : !supported ? (
        <div style={sub}>{t('settings.push.unsupported')}</div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={lbl}>{on ? t('settings.push.on') : t('settings.push.off')}</div>
              <div style={sub}>{t('settings.push.desc')}</div>
            </div>
            <Btn variant={on ? 'ghost' : 'primary'} onClick={toggle} disabled={busy}>
              {busy ? t('settings.sync.busy') : on ? t('settings.sync.disable') : t('settings.sync.enable')}
            </Btn>
          </div>
          {msg && <div style={{ ...sub, color: '#c0392b', marginTop: 8 }}>{msg}</div>}
        </>
      )}
    </div>
  )
}
