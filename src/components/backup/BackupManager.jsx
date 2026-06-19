// src/components/backup/BackupManager.jsx
// Sistema de respaldo y restauración — FinanceOS Fase 6
// Principio: el usuario debe entender que sus datos viven en su dispositivo.
// FinanceOS no puede recuperar datos si no existe un respaldo previo.

import { useState, useRef, useEffect } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { CLOUD_ENABLED } from '../../core/supabase.js'
import { cloudPush, cloudPull, cloudStatus } from '../../core/cloudSync.js'

// ── HELPERS ───────────────────────────────────────────────────────────────────
function daysSince(isoDate) {
  if (!isoDate) return null
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24))
}

function formatDate(isoDate) {
  if (!isoDate) return null
  return new Date(isoDate).toLocaleDateString('es-CL', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

// ── VALIDACIÓN DEL ARCHIVO JSON ───────────────────────────────────────────────
export function validateBackupFile(data) {
  const errors = []

  // Debe ser un objeto
  if (!data || typeof data !== 'object' || Array.isArray(data))
    return { valid: false, errors: ['El archivo no tiene el formato correcto.'] }

  // Debe tener al menos una colección conocida
  const knownKeys = ['incomes', 'expenses', 'budgets', 'debts', 'goals']
  const hasKnownKey = knownKeys.some(k => k in data)
  if (!hasKnownKey)
    errors.push('El archivo no parece ser un respaldo válido de FinanceOS.')

  // Las colecciones deben ser arrays
  knownKeys.forEach(k => {
    if (k in data && !Array.isArray(data[k]))
      errors.push(`La sección "${k}" no tiene el formato esperado.`)
  })

  // Detectar si es archivo demo — tiene IDs que empiezan con "demo-"
  const allIds = [
    ...(data.incomes  || []).map(r => r.id),
    ...(data.expenses || []).map(r => r.id),
  ]
  const isDemoBackup = allIds.some(id => String(id).startsWith('demo-'))
  if (isDemoBackup)
    errors.push('Este archivo contiene datos de demostración. No se puede restaurar como datos reales.')

  // Verificar versión si existe
  if (data._meta?.version && !data._meta.version.startsWith('1.'))
    errors.push('Este respaldo fue creado con una versión diferente de FinanceOS. Puede tener problemas de compatibilidad.')

  return { valid: errors.length === 0, errors, isDemoBackup }
}

// ── MODAL DE CONFIRMACIÓN ─────────────────────────────────────────────────────
function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, danger = false }) {
  if (!isOpen) return null
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,.45)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: 'var(--sur)', borderRadius: 12, padding: '24px 24px 20px',
        maxWidth: 400, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,.2)',
        border: '0.5px solid var(--brd2)',
      }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx)', marginBottom: 10 }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--tm)', lineHeight: 1.7, marginBottom: 20 }}>{message}</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{
            background: 'var(--sur2)', border: '0.5px solid var(--brd2)',
            borderRadius: 6, padding: '8px 16px', fontSize: 12,
            cursor: 'pointer', color: 'var(--tm)', fontFamily: 'var(--syne, sans-serif)',
          }}>Cancelar</button>
          <button onClick={onConfirm} style={{
            background: danger ? '#8a2020' : 'var(--grn)', color: '#fff',
            border: 'none', borderRadius: 6, padding: '8px 18px',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'var(--syne, sans-serif)',
          }}>Confirmar</button>
        </div>
      </div>
    </div>
  )
}

// ── BACKUP STATUS BADGE ───────────────────────────────────────────────────────
export function BackupStatusBadge({ compact = false }) {
  const { settings } = useApp()
  const lastBackup = settings.lastBackupAt
  const days = daysSince(lastBackup)

  if (!lastBackup) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: compact ? '4px 10px' : '10px 12px',
        background: '#faeeda', borderRadius: compact ? 20 : 8,
        border: '0.5px solid rgba(133,79,11,.2)',
        fontSize: compact ? 10 : 11, color: '#854f0b',
        fontFamily: 'var(--mono)',
      }}>
        <span>⚠</span>
        <span>{compact ? 'Sin respaldo' : 'Sin respaldo creado todavía — crea uno ahora desde Ajustes'}</span>
      </div>
    )
  }

  if (days > 30) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: compact ? '4px 10px' : '10px 12px',
        background: '#fdf0ee', borderRadius: compact ? 20 : 8,
        border: '0.5px solid rgba(138,32,32,.2)',
        fontSize: compact ? 10 : 11, color: '#8a2020',
        fontFamily: 'var(--mono)',
      }}>
        <span>⚠</span>
        <span>{compact ? `Respaldo hace ${days}d` : `Último respaldo hace ${days} días — se recomienda crear uno nuevo`}</span>
      </div>
    )
  }

  if (days > 14) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: compact ? '4px 10px' : '10px 12px',
        background: '#faeeda', borderRadius: compact ? 20 : 8,
        border: '0.5px solid rgba(133,79,11,.2)',
        fontSize: compact ? 10 : 11, color: '#854f0b',
        fontFamily: 'var(--mono)',
      }}>
        <span>◑</span>
        <span>{compact ? `Respaldo hace ${days}d` : `Último respaldo hace ${days} días — considera actualizarlo`}</span>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 7,
      padding: compact ? '4px 10px' : '10px 12px',
      background: 'var(--grn-bg)', borderRadius: compact ? 20 : 8,
      border: '0.5px solid rgba(26,163,104,.2)',
      fontSize: compact ? 10 : 11, color: 'var(--grn)',
      fontFamily: 'var(--mono)',
    }}>
      <span>✓</span>
      <span>{compact ? `Respaldo al día` : `Último respaldo: ${formatDate(lastBackup)}`}</span>
    </div>
  )
}

// ── MAIN BACKUP MANAGER ───────────────────────────────────────────────────────
export default function BackupManager() {
  const { settings, updateSettings, exportData, importData, incomes, expenses, budgets, debts, goals } = useApp()
  const [status, setStatus]           = useState(null)
  const [importing, setImporting]     = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingFile, setPendingFile] = useState(null)
  const [pendingData, setPendingData] = useState(null)
  const [cloudSyncing, setCloudSyncing] = useState(false)
  const [cloudInfo, setCloudInfo]     = useState(null)
  const fileRef = useRef()

  useEffect(() => {
    if (CLOUD_ENABLED) cloudStatus().then(setCloudInfo)
  }, [])

  const lastBackup = settings.lastBackupAt
  const days = daysSince(lastBackup)
  const hasRealData = incomes.length > 0 || expenses.length > 0 || debts.length > 0 || goals.length > 0

  // Cuenta registros totales para mostrar en el respaldo
  const totalRecords = incomes.length + expenses.length + budgets.length + debts.length + goals.length

  // ── EXPORTAR ────────────────────────────────────────────────────────────────
  async function handleExport() {
    try {
      await exportData()
      // Guardar fecha del último respaldo
      await updateSettings({ ...settings, lastBackupAt: new Date().toISOString() })
      setStatus({ type: 'ok', msg: `Respaldo descargado correctamente. Guárdalo en un lugar seguro (Google Drive, iCloud, email).` })
      setTimeout(() => setStatus(null), 5000)
    } catch (e) {
      setStatus({ type: 'error', msg: 'Error al crear el respaldo. Intenta de nuevo.' })
    }
  }

  // ── CLOUD PUSH ──────────────────────────────────────────────────────────────
  async function handleCloudPush() {
    setCloudSyncing(true)
    setStatus(null)
    try {
      const result = await cloudPush()
      await updateSettings({ ...settings, lastCloudSyncAt: result.savedAt })
      setCloudInfo(await cloudStatus())
      setStatus({ type: 'ok', msg: '☁ Datos sincronizados en la nube correctamente.' })
    } catch (e) {
      setStatus({ type: 'error', msg: 'Error al sincronizar: ' + (e.message || 'verifica tu conexión.') })
    } finally {
      setCloudSyncing(false)
      setTimeout(() => setStatus(null), 5000)
    }
  }

  // ── CLOUD PULL ──────────────────────────────────────────────────────────────
  async function handleCloudPull() {
    setCloudSyncing(true)
    setStatus(null)
    try {
      const result = await cloudPull()
      if (!result) {
        setStatus({ type: 'warn', msg: 'No hay datos en la nube para este dispositivo todavía.' })
        return
      }
      await importData(new File(
        [JSON.stringify(result.payload)],
        'cloud-backup.json',
        { type: 'application/json' }
      ))
      setStatus({ type: 'ok', msg: `☁ Datos restaurados desde la nube (guardado: ${formatDate(result.savedAt)}).` })
    } catch (e) {
      setStatus({ type: 'error', msg: 'Error al restaurar desde la nube: ' + (e.message || 'verifica tu conexión.') })
    } finally {
      setCloudSyncing(false)
      setTimeout(() => setStatus(null), 6000)
    }
  }

  // ── SELECCIONAR ARCHIVO ─────────────────────────────────────────────────────
  async function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    setImporting(true)
    setStatus(null)

    try {
      // Leer y parsear
      const text = await file.text()
      let data
      try {
        data = JSON.parse(text)
      } catch {
        setStatus({ type: 'error', msg: 'El archivo no es un JSON válido. Verifica que sea un respaldo de FinanceOS.' })
        setImporting(false)
        return
      }

      // Validar
      const { valid, errors, isDemoBackup } = validateBackupFile(data)
      if (!valid) {
        setStatus({ type: 'error', msg: errors.join(' ') })
        setImporting(false)
        return
      }

      // Guardar para confirmar
      setPendingFile(file.name)
      setPendingData(data)

      // Si hay datos reales, pedir confirmación
      if (hasRealData) {
        setConfirmOpen(true)
      } else {
        await doImport(data)
      }
    } catch (e) {
      setStatus({ type: 'error', msg: 'Error al leer el archivo. Verifica que sea un respaldo válido de FinanceOS.' })
    } finally {
      setImporting(false)
    }
  }

  // ── CONFIRMAR E IMPORTAR ────────────────────────────────────────────────────
  async function doImport(data) {
    setConfirmOpen(false)
    setImporting(true)
    try {
      await importData(new File(
        [JSON.stringify(data)],
        pendingFile || 'backup.json',
        { type: 'application/json' }
      ))
      // Actualizar fecha de respaldo si el archivo la tenía
      if (data._meta?.createdAt) {
        await updateSettings({ ...settings, lastBackupAt: data._meta.createdAt })
      }
      setStatus({ type: 'ok', msg: 'Datos restaurados correctamente. Tu información está actualizada.' })
      setPendingFile(null)
      setPendingData(null)
    } catch (e) {
      setStatus({ type: 'error', msg: 'Error al restaurar los datos. El archivo puede estar incompleto o dañado.' })
    } finally {
      setImporting(false)
      setTimeout(() => setStatus(null), 5000)
    }
  }

  const srow = {
    display: 'flex', alignItems: 'flex-start',
    justifyContent: 'space-between', padding: '14px 0',
    borderBottom: '0.5px solid var(--brd)', gap: 12,
  }
  const slbl = { fontSize: 13, fontWeight: 500, color: 'var(--tx)' }
  const ssub = { fontSize: 10, color: 'var(--th)', fontFamily: 'var(--mono)', marginTop: 2, lineHeight: 1.5 }
  const btn = (variant = 'default') => ({
    padding: '8px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600,
    cursor: 'pointer', border: 'none', fontFamily: 'var(--syne, sans-serif)',
    flexShrink: 0, transition: 'all .15s',
    ...(variant === 'primary' ? { background: 'var(--grn)', color: '#fff' } : {}),
    ...(variant === 'default' ? { background: 'var(--sur2)', color: 'var(--tx)', border: '0.5px solid var(--brd2)' } : {}),
    ...(variant === 'danger'  ? { background: 'transparent', color: '#8a2020', border: '0.5px solid #c8a0a0' } : {}),
  })

  return (
    <>
      {/* Modal de confirmación de restauración */}
      <ConfirmModal
        isOpen={confirmOpen}
        title="¿Restaurar datos desde respaldo?"
        message={`Esto reemplazará todos tus datos actuales (${totalRecords} registros) con el contenido del archivo "${pendingFile}". Esta acción no se puede deshacer.\n\nSi quieres conservar los datos actuales, cancela y crea un respaldo primero.`}
        onConfirm={() => doImport(pendingData)}
        onCancel={() => { setConfirmOpen(false); setPendingFile(null); setPendingData(null) }}
        danger
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Estado del respaldo */}
        <BackupStatusBadge />

        {/* Alerta si no hay datos */}
        {!hasRealData && (
          <div style={{
            padding: '10px 14px', background: 'var(--sur2)',
            border: '0.5px solid var(--brd)', borderRadius: 8,
            fontSize: 11, color: 'var(--th)', fontFamily: 'var(--mono)', lineHeight: 1.5,
          }}>
            No hay datos reales para respaldar. Registra ingresos o gastos primero.
          </div>
        )}

        {/* Explicación educativa */}
        <div style={{
          padding: '14px 16px', background: 'var(--sur2)',
          border: '0.5px solid var(--brd)', borderRadius: 8,
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx)', marginBottom: 6 }}>
            🔒 ¿Dónde viven tus datos?
          </div>
          <div style={{ fontSize: 11, color: 'var(--tm)', lineHeight: 1.7, fontFamily: 'var(--mono)' }}>
            Tus datos se guardan en este navegador, en este dispositivo. FinanceOS no tiene servidor
            — nada sale de tu dispositivo. Si borrás el navegador, limpiás la caché o cambiás de
            dispositivo <strong style={{ color: 'var(--tx)' }}>sin un respaldo previo, los datos se perderán permanentemente</strong>.
            FinanceOS no puede recuperarlos.
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--th)', fontFamily: 'var(--mono)' }}>
            Recomendación: crear un respaldo mensual y guardarlo en Google Drive, iCloud o enviarlo por email.
          </div>
        </div>

        {/* Crear respaldo */}
        <div style={srow}>
          <div style={{ flex: 1 }}>
            <div style={slbl}>Crear respaldo</div>
            <div style={ssub}>
              Descarga un archivo JSON con todos tus datos · {totalRecords} registros
              {lastBackup && <><br />Último respaldo: {formatDate(lastBackup)}{days !== null && days > 0 ? ` (hace ${days} día${days !== 1 ? 's' : ''})` : ' (hoy)'}</>}
            </div>
          </div>
          <button
            onClick={handleExport}
            disabled={!hasRealData}
            style={{ ...btn('primary'), opacity: hasRealData ? 1 : 0.5, cursor: hasRealData ? 'pointer' : 'not-allowed' }}
          >
            ↓ Crear respaldo
          </button>
        </div>

        {/* Restaurar respaldo */}
        <div style={{ ...srow, borderBottom: 'none' }}>
          <div style={{ flex: 1 }}>
            <div style={slbl}>Restaurar respaldo</div>
            <div style={ssub}>
              Importa un archivo JSON de respaldo previo<br />
              <span style={{ color: '#854f0b' }}>⚠ Esto reemplazará todos los datos actuales</span>
            </div>
          </div>
          <label style={{ flexShrink: 0 }}>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={importing}
              style={{ ...btn('default'), opacity: importing ? 0.6 : 1 }}
            >
              {importing ? 'Importando…' : '↑ Restaurar'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
              disabled={importing}
            />
          </label>
        </div>

        {/* ── CLOUD SYNC ── */}
        {CLOUD_ENABLED && (
          <div style={{ marginTop: 8, padding: '16px', background: 'var(--sur2)', border: '0.5px solid var(--brd)', borderRadius: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx)', marginBottom: 2 }}>☁ Respaldo en la nube</div>
                <div style={{ fontSize: 10, color: 'var(--th)', fontFamily: 'var(--mono)' }}>
                  {cloudInfo?.connected
                    ? `Conectado · ID ${cloudInfo.userId}${cloudInfo.lastSync ? ' · Último sync: ' + formatDate(cloudInfo.lastSync) : ''}`
                    : 'Sin sesión activa · se crea automáticamente al sincronizar'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleCloudPull}
                  disabled={cloudSyncing}
                  title="Restaurar desde la nube"
                  style={{ ...btn('default'), fontSize: 11, padding: '6px 12px', opacity: cloudSyncing ? 0.5 : 1 }}
                >
                  ↓ Restaurar
                </button>
                <button
                  onClick={handleCloudPush}
                  disabled={cloudSyncing || !hasRealData}
                  title="Subir datos a la nube"
                  style={{ ...btn('primary'), fontSize: 11, padding: '6px 12px', opacity: (cloudSyncing || !hasRealData) ? 0.5 : 1 }}
                >
                  {cloudSyncing ? 'Sincronizando…' : '↑ Sincronizar'}
                </button>
              </div>
            </div>
            <div style={{ fontSize: 10, color: 'var(--th)', fontFamily: 'var(--mono)', lineHeight: 1.5 }}>
              Tu backup se guarda cifrado en un servidor privado vinculado a este dispositivo. No requiere contraseña.
              Para acceder desde otro dispositivo usa el backup local (JSON).
            </div>
          </div>
        )}

        {/* Mensaje de estado */}
        {status && (
          <div style={{
            padding: '10px 14px', borderRadius: 8, fontSize: 11,
            fontFamily: 'var(--mono)', lineHeight: 1.5,
            background: status.type === 'ok' ? 'var(--grn-bg)' : status.type === 'error' ? '#fdf0ee' : '#faeeda',
            color: status.type === 'ok' ? 'var(--grn)' : status.type === 'error' ? '#8a2020' : '#854f0b',
            border: `0.5px solid ${status.type === 'ok' ? 'rgba(26,163,104,.2)' : status.type === 'error' ? 'rgba(138,32,32,.2)' : 'rgba(133,79,11,.2)'}`,
          }}>
            {status.type === 'ok' ? '✓' : '⚠'} {status.msg}
          </div>
        )}

      </div>
    </>
  )
}
