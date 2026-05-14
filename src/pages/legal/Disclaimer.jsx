// src/pages/legal/Disclaimer.jsx
// Disclaimer financiero completo — página dentro de la app

import { PageHeader } from '../../components/ui/index.jsx'
import s from './legal.module.css'

export default function Disclaimer() {
  return (
    <div className="stack">
      <PageHeader
        title="Aviso Legal y Disclaimer"
        sub="Naturaleza de la herramienta · Limitaciones · Uso responsable"
      />

      <div className={s.legalWrap}>

        <div className={s.warnBox} style={{ marginBottom: 0 }}>
          <strong>FinanceOS es una herramienta de organización financiera personal.</strong>{' '}
          No es un asesor financiero, tributario, de inversión ni una entidad regulada.
          Los datos y análisis que muestra se basan exclusivamente en la información
          que el usuario ingresa y no constituyen recomendaciones profesionales.
        </div>

        <div className={s.section}>
          <h2>Qué es FinanceOS</h2>
          <p>FinanceOS es una herramienta de software que permite a los usuarios:</p>
          <ul className={s.list}>
            <li>Registrar y categorizar ingresos y gastos</li>
            <li>Establecer presupuestos mensuales por categoría</li>
            <li>Hacer seguimiento de deudas y metas de ahorro</li>
            <li>Visualizar su situación financiera de forma organizada</li>
            <li>Exportar sus datos para análisis externos</li>
          </ul>
        </div>

        <div className={s.section}>
          <h2>Qué NO es FinanceOS</h2>
          <ul className={s.listWarn}>
            <li>No es un asesor financiero ni reemplaza la consulta con uno</li>
            <li>No es un asesor tributario ni fiscal</li>
            <li>No es un broker ni intermediario de inversiones</li>
            <li>No es un banco ni entidad financiera regulada</li>
            <li>No garantiza resultados financieros específicos</li>
            <li>No predice comportamientos futuros del mercado</li>
          </ul>
        </div>

        <div className={s.section}>
          <h2>Sobre las proyecciones y cálculos</h2>
          <p>
            Las proyecciones de flujo de caja, estimaciones de ahorro y análisis que
            muestra FinanceOS son <strong>cálculos matemáticos basados en los datos
            históricos que el usuario ingresó</strong>. No consideran factores externos,
            cambios en el mercado, inflación futura, cambios laborales ni ningún otro
            evento impredecible.
          </p>
          <p>
            Estas proyecciones son orientativas y no deben usarse como base única para
            decisiones financieras importantes sin consultar a un profesional certificado.
          </p>
        </div>

        <div className={s.section}>
          <h2>Responsabilidad del usuario</h2>
          <p>
            El usuario es responsable de la exactitud de los datos que ingresa y de las
            decisiones que toma basándose en la información que muestra la herramienta.
            MAGNOVA LLC no asume responsabilidad por pérdidas o perjuicios derivados del
            uso de FinanceOS.
          </p>
        </div>

        <div className={s.section}>
          <h2>Para asesores y profesionales que redistribuyen FinanceOS</h2>
          <p>
            Si eres un asesor financiero, coach, contador o educador que utiliza FinanceOS
            como herramienta complementaria a tu servicio profesional, es tu responsabilidad:
          </p>
          <ul className={s.list}>
            <li>Comunicar claramente a tus clientes la naturaleza de la herramienta</li>
            <li>No presentar FinanceOS como sustituto de asesoría profesional</li>
            <li>Publicar tu propia política de privacidad si redistribuís la herramienta</li>
            <li>Cumplir con las regulaciones aplicables en tu jurisdicción</li>
          </ul>
        </div>

        <div className={s.legalNotice}>
          Para consultas: <strong>hola@magnova.io</strong> ·
          Revisado por MAGNOVA LLC · 2025
        </div>

      </div>
    </div>
  )
}
