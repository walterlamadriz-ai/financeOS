// src/pages/legal/License.jsx
// Términos de Licencia por Plan — FinanceOS

import { PageHeader } from '../../components/ui/index.jsx'
import s from './legal.module.css'

const plans = [
  {
    name: 'Starter — $29',
    color: 'var(--grn)',
    allowed: [
      'Uso personal ilimitado',
      'Modificación del código para uso propio',
      'Deploy en un (1) dominio propio',
      'Uso como base de aprendizaje y referencia técnica',
    ],
    notAllowed: [
      'Redistribuir o revender a terceros en cualquier forma',
      'Usar como base para productos comerciales',
      'Sublicenciar o transferir los derechos a terceros',
      'Remover avisos de copyright del código fuente',
    ],
  },
  {
    name: 'Pro — $79',
    color: 'var(--grn)',
    featured: true,
    allowed: [
      'Todo lo del plan Starter',
      'Uso como producto entregable a clientes (hasta 20 instancias)',
      'Personalización de branding: nombre, logo, colores, tipografía',
      'Cobrar a clientes por setup, personalización o soporte',
      'Incluir en servicios de consultoría financiera',
      'Remover créditos de "FinanceOS" y reemplazar por tu marca',
      'Deploy en hasta 20 dominios (uno por cliente)',
    ],
    notAllowed: [
      'Revender o redistribuir el código fuente sin modificaciones',
      'Publicar en marketplaces de templates (ThemeForest, Envato, etc.)',
      'Ofrecer como SaaS público donde múltiples usuarios paguen acceso',
      'Distribuir a más de 20 instancias sin upgrade a Enterprise',
      'Sublicenciar los derechos a otros desarrolladores o agencias',
    ],
  },
  {
    name: 'Enterprise — $299',
    color: 'var(--grn)',
    allowed: [
      'Todo lo del plan Pro sin límite de instancias',
      'Distribución ilimitada a clientes y usuarios finales',
      'Uso como SaaS comercial propio (cobrar por acceso)',
      'Integración con backend propio (Supabase, Firebase, etc.)',
      'Sublicenciamiento a clientes empresariales propios',
      'Código fuente completo y editable sin restricciones técnicas',
      'Prioridad en soporte técnico y actualizaciones',
    ],
    notAllowed: [
      'Revender la licencia Enterprise a terceros',
      'Usar el nombre "FinanceOS" o la marca sin autorización escrita',
      'Publicar en repositorios públicos o marketplaces de templates',
    ],
  },
]

export default function License() {
  return (
    <div className="stack">
      <PageHeader
        title="Términos de Licencia"
        sub="Derechos y restricciones por plan · Revisado por MAXNOVA & LUCI Global LLC · 2025"
      />

      <div className={s.legalWrap}>

        <div className={s.highlight}>
          La licencia adquirida determina cómo podés usar, modificar y redistribuir
          FinanceOS. Leé con atención el plan correspondiente a tu compra.
        </div>

        {plans.map(plan => (
          <div key={plan.name} className={s.planBlock + (plan.featured ? ' ' + s.planFeatured : '')}>
            <h2 className={s.planName}>{plan.name}</h2>

            <div className={s.planCols}>
              <div>
                <div className={s.planSectionTitle} style={{ color: 'var(--grn)' }}>✓ Permitido</div>
                <ul className={s.list}>
                  {plan.allowed.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>
              <div>
                <div className={s.planSectionTitle} style={{ color: 'var(--red)' }}>✗ No permitido</div>
                <ul className={s.listWarn}>
                  {plan.notAllowed.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            </div>
          </div>
        ))}

        <div className={s.section}>
          <h2>Garantías y limitaciones</h2>
          <p>
            El software se proporciona "tal cual", sin garantía de ningún tipo, expresa
            o implícita. En ningún caso MAXNOVA & LUCI Global LLC será responsable de daños directos,
            indirectos, incidentales o consecuentes que surjan del uso o imposibilidad
            de uso del software.
          </p>
          <p>
            Las funcionalidades de análisis financiero de FinanceOS son de orientación
            general y no constituyen asesoría financiera, tributaria ni legal certificada.
          </p>
        </div>

        <div className={s.section}>
          <h2>Contacto para licencias</h2>
          <p>
            Para consultas sobre upgrade de plan, uso no contemplado o licencias
            personalizadas: <strong>support@financeospro.com</strong>
          </p>
        </div>

        <div className={s.legalNotice}>
          ⚠ Este documento fue redactado como punto de partida informativo.
          No constituye asesoría legal. Se recomienda revisión por un abogado
          antes de uso comercial definitivo.
        </div>

      </div>
    </div>
  )
}
