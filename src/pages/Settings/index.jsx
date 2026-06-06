// src/pages/Settings/index.jsx — v1.5
import { useApp } from '../../context/AppContext.jsx'
import { Card, CardHeader, Btn, PageHeader } from '../../components/ui/index.jsx'
import { BackupWarning } from '../../components/legal/MicroCopy.jsx'
import BackupManager from '../../components/backup/BackupManager.jsx'
import TemplateSelector from '../../components/templates/TemplateSelector.jsx'
import { CURRENCY_OPTIONS } from '../shared/constants.js'

export default function Settings() {
  const { settings, updateSettings, clearAll, loadDemo, exportCSV } = useApp()

  async function handleClear() {
    if (window.confirm('¿Borrar TODOS los datos? Esta acción no se puede deshacer.')) {
      await clearAll()
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
            <option value="PE">🇵🇪 Perú</option>
            <option value="VE">🇻🇪 Venezuela</option>
            <option value="OTHER">🌎 Otro</option>
          </select>
        </div>
        <div style={{...srow,borderBottom:'none'}}>
          <div><div style={slbl}>Tema visual</div><div style={ssub}>Claro u oscuro</div></div>
          <div style={{display:'flex',gap:6}}>
            <Btn variant={settings.theme==='light'?'primary':'ghost'} size="sm" onClick={()=>updateSettings({...settings,theme:'light'})}>Claro</Btn>
            <Btn variant={settings.theme==='dark' ?'primary':'ghost'} size="sm" onClick={()=>updateSettings({...settings,theme:'dark' })}>Oscuro</Btn>
          </div>
        </div>
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
        <div style={{...srow,borderBottom:'none'}}>
          <div><div style={slbl}>Borrar todos los datos</div><div style={ssub}>Acción irreversible · sin recuperación posible</div></div>
          <Btn variant="danger" size="sm" onClick={handleClear}>Borrar todo</Btn>
        </div>
      </Card>
      <BackupWarning />
      <div style={{padding:'10px 12px',background:'var(--sur2)',borderRadius:'var(--r)',border:'0.5px solid var(--brd)',fontSize:10,color:'var(--th)',fontFamily:'var(--mono)',lineHeight:1.7,marginTop:8}}>
        FinanceOS v1.5 · MAXNOVA & LUCI Global LLC · Datos locales · Sin servidor · No asesoría financiera certificada
      </div>
    </div>
  )
}
