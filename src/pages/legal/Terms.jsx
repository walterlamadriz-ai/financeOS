// src/pages/legal/Terms.jsx
// Términos de Uso — FinanceOS
// AVISO: Revisar con abogado antes de uso comercial definitivo.

import { PageHeader } from '../../components/ui/index.jsx'
import s from './legal.module.css'

export default function Terms() {
  return (
    <div className="stack">
      <PageHeader
        title="Términos de Uso"
        sub="Última actualización: 2025 · MAXNOVA & LUCI Global LLC"
      />

      <div className={s.legalWrap}>

        <div className={s.highlight}>
          <strong>Importante:</strong> FinanceOS es una herramienta de organización y
          seguimiento financiero personal. No es un asesor financiero, tributario ni de
          inversión. No reemplaza la consulta con profesionales certificados.
        </div>

        <div className={s.section}>
          <h2>1. Aceptación de los términos</h2>
          <p>
            Al acceder y usar FinanceOS, el usuario acepta estos Términos de Uso en su
            totalidad. Si no está de acuerdo con alguna parte de estos términos, debe
            dejar de usar la herramienta.
          </p>
        </div>

        <div className={s.section}>
          <h2>2. Naturaleza del servicio</h2>
          <p>
            FinanceOS es una herramienta de software para <strong>organización,
            diagnóstico y seguimiento financiero personal</strong>. Su propósito es
            ayudar a los usuarios a registrar, visualizar y comprender sus finanzas
            personales.
          </p>
          <p>FinanceOS <strong>no es</strong> y no debe interpretarse como:</p>
          <ul className={s.list}>
            <li>Asesor financiero, tributario, contable ni de inversión</li>
            <li>Institución bancaria, financiera ni entidad regulada</li>
            <li>Proveedor de recomendaciones de inversión</li>
            <li>Sustituto de asesoría profesional certificada</li>
            <li>Herramienta de planificación fiscal o tributaria</li>
          </ul>
          <p>
            Las proyecciones, cálculos y sugerencias generadas por FinanceOS son
            orientativas y se basan exclusivamente en los datos ingresados por el
            usuario. No constituyen recomendaciones financieras.
          </p>
        </div>

        <div className={s.section}>
          <h2>3. Responsabilidad del usuario</h2>
          <p>El usuario es el único responsable de:</p>
          <ul className={s.list}>
            <li>La exactitud de los datos que ingresa en la herramienta</li>
            <li>Las decisiones financieras que tome basándose en la información mostrada</li>
            <li>Exportar y respaldar sus datos periódicamente</li>
            <li>La seguridad de su dispositivo y del acceso a la herramienta</li>
          </ul>
        </div>

        <div className={s.section}>
          <h2>4. Almacenamiento local y pérdida de datos</h2>
          <p>
            FinanceOS almacena todos los datos localmente en el navegador del usuario.
            <strong> MAXNOVA & LUCI Global LLC no almacena ni puede recuperar los datos del usuario.</strong>
          </p>
          <div className={s.warnBox}>
            <strong>Advertencia sobre pérdida de datos:</strong> Los datos pueden perderse
            permanentemente si el usuario borra los datos del navegador, limpia la caché,
            cambia de dispositivo sin exportar un respaldo, desinstala la aplicación o
            reinstala el sistema operativo. Se recomienda exportar respaldos JSON
            regularmente desde el módulo de Ajustes.
          </div>
        </div>

        <div className={s.section}>
          <h2>5. Limitación de responsabilidad</h2>
          <p>
            En la máxima medida permitida por la ley aplicable, MAXNOVA & LUCI Global LLC no será
            responsable por:
          </p>
          <ul className={s.list}>
            <li>Pérdida de datos debido a borrado del navegador u otras causas locales</li>
            <li>Decisiones financieras tomadas con base en la información de la herramienta</li>
            <li>Daños directos, indirectos, incidentales o consecuentes derivados del uso</li>
            <li>Interrupciones del servicio por causas de terceros (hosting, navegador, etc.)</li>
            <li>Inexactitudes en los cálculos derivadas de datos incorrectos ingresados por el usuario</li>
          </ul>
        </div>

        <div className={s.section}>
          <h2>6. Propiedad intelectual</h2>
          <p>
            El código fuente, diseño y contenido de FinanceOS son propiedad de MAXNOVA & LUCI Global LLC
            y están protegidos por derechos de autor. El uso de FinanceOS está sujeto a los
            términos de la licencia adquirida (Starter, Pro o Enterprise), detallados en el
            documento de Licencia correspondiente.
          </p>
        </div>

        <div className={s.section}>
          <h2>7. Uso permitido</h2>
          <p>El usuario se compromete a no utilizar FinanceOS para:</p>
          <ul className={s.list}>
            <li>Actividades ilegales o fraudulentas</li>
            <li>Evadir obligaciones fiscales o legales</li>
            <li>Propósitos distintos a la gestión financiera personal legítima</li>
            <li>Redistribuir el software sin la licencia correspondiente</li>
          </ul>
        </div>

        <div className={s.section}>
          <h2>8. Disponibilidad del servicio</h2>
          <p>
            FinanceOS es una PWA (Progressive Web App) que funciona offline una vez cargada.
            La disponibilidad inicial depende de la plataforma de hosting utilizada.
            MAXNOVA & LUCI Global LLC no garantiza disponibilidad ininterrumpida del servicio de hosting.
          </p>
        </div>

        <div className={s.section}>
          <h2>9. Modificaciones</h2>
          <p>
            MAXNOVA & LUCI Global LLC se reserva el derecho de modificar estos términos en cualquier
            momento. Las modificaciones entran en vigencia al publicarse en esta página.
            El uso continuado implica aceptación de los términos actualizados.
          </p>
        </div>

        <div className={s.section}>
          <h2>10. Ley aplicable</h2>
          <p>
            Estos términos se rigen por las leyes aplicables a MAXNOVA & LUCI Global LLC. Cualquier
            disputa se resolverá en la jurisdicción competente correspondiente.
          </p>
        </div>

        <div className={s.section}>
          <h2>11. Contacto</h2>
          <p>Para consultas sobre estos términos: <strong>support@financeospro.com</strong></p>
        </div>

        <div className={s.section}>
          <h2>12. Consecuencias del incumplimiento</h2>
          <p>
            El incumplimiento de estos términos o de los términos de licencia puede resultar
            en la revocación del derecho de uso sin reembolso. Para regularizar situaciones
            fuera de los límites del plan adquirido, contactar <strong>support@financeospro.com</strong>{' '}
            antes de que ocurra el incumplimiento.
          </p>
        </div>

        <div className={s.legalNotice}>
          ⚠ Este documento fue redactado como punto de partida informativo. No constituye
          asesoría legal. Se recomienda revisión por un abogado especializado antes de
          uso comercial definitivo.
        </div>

      </div>
    </div>
  )
}
