// src/pages/legal/Privacy.jsx
// Política de Privacidad — FinanceOS
// AVISO: Este texto fue redactado como punto de partida.
// Debe ser revisado por un abogado antes de uso comercial definitivo.

import { PageHeader } from '../../components/ui/index.jsx'
import s from './legal.module.css'

export default function Privacy() {
  return (
    <div className="stack">
      <PageHeader
        title="Política de Privacidad"
        sub="Última actualización: 2025 · MAXNOVA & LUCI Global LLC"
      />

      <div className={s.legalWrap}>

        <div className={s.highlight}>
          <strong>Resumen ejecutivo:</strong> FinanceOS no recopila, almacena ni transmite
          ningún dato financiero a servidores externos. Todo queda en tu dispositivo.
          No hay cuentas de usuario, no hay base de datos en la nube, no hay tracking.
        </div>

        <div className={s.section}>
          <h2>1. Quién opera esta herramienta</h2>
          <p>
            FinanceOS es desarrollado y distribuido por MAXNOVA & LUCI Global LLC. Esta política describe
            cómo funciona el almacenamiento de datos dentro de la herramienta y qué información,
            si alguna, puede ser recopilada en relación con su uso.
          </p>
        </div>

        <div className={s.section}>
          <h2>2. Datos financieros — almacenamiento local exclusivo</h2>
          <p>
            Todos los datos financieros que el usuario ingresa en FinanceOS — incluyendo
            ingresos, gastos, presupuestos, deudas, metas y configuraciones — se almacenan
            únicamente en el navegador del dispositivo del usuario mediante la tecnología
            IndexedDB, un estándar de almacenamiento local del navegador.
          </p>
          <p>
            Estos datos <strong>no se transmiten a ningún servidor externo</strong>, no se
            sincronizan con la nube y no son accesibles por MAXNOVA & LUCI Global LLC ni por ningún tercero
            a través de la infraestructura de FinanceOS.
          </p>
          <div className={s.infoBox}>
            <strong>Implicación práctica:</strong> Si el usuario borra los datos del navegador,
            desinstala la app o cambia de dispositivo sin haber exportado un respaldo, sus datos
            se perderán de forma permanente. FinanceOS no puede recuperarlos porque nunca
            los tuvo en sus servidores.
          </div>
          <div className={s.warnBox} style={{ marginTop: 8 }}>
            <strong>Atención — modo incógnito o privado:</strong> Si el usuario accede a
            FinanceOS desde una ventana de incógnito o modo privado del navegador, los datos
            se borran automáticamente al cerrar esa sesión. Para uso regular, recomendamos
            acceder desde una ventana normal del navegador o desde la app instalada
            (Agregar a pantalla de inicio).
          </div>
        </div>

        <div className={s.section}>
          <h2>3. Datos de uso y analítica</h2>
          <p>
            FinanceOS <strong>no incluye</strong> Google Analytics, Mixpanel, Hotjar ni ningún
            sistema de seguimiento de comportamiento del usuario. No se registran eventos,
            sesiones, clics ni patrones de uso.
          </p>
          <p>
            La plataforma de hosting (Vercel o Netlify, según la instancia) puede registrar
            datos técnicos estándar como direcciones IP y tiempos de carga a efectos de
            operación del servicio. Estos datos son gestionados por el proveedor de hosting
            según sus propias políticas de privacidad, independientes de FinanceOS.
          </p>
        </div>

        <div className={s.section}>
          <h2>4. Cookies y almacenamiento del navegador</h2>
          <p>
            FinanceOS utiliza IndexedDB y, como fallback, localStorage para persistir los
            datos del usuario localmente. No utiliza cookies de seguimiento ni cookies de
            terceros. El único almacenamiento utilizado es el estrictamente necesario para
            el funcionamiento de la aplicación.
          </p>
        </div>

        <div className={s.section}>
          <h2>5. Exportación e importación de datos</h2>
          <p>
            El usuario puede exportar todos sus datos en formato JSON o CSV desde el módulo
            de Ajustes. Esta exportación queda bajo el control exclusivo del usuario —
            FinanceOS no recibe ni almacena una copia de esa exportación.
          </p>
          <p>
            El usuario también puede importar un respaldo JSON previamente exportado. Este
            proceso ocurre íntegramente en el dispositivo del usuario.
          </p>
        </div>

        <div className={s.section}>
          <h2>6. Licencias white-label</h2>
          <p>
            Los compradores de licencias Pro o Enterprise pueden personalizar y redistribuir
            FinanceOS bajo su propia marca. En esos casos, la política de privacidad aplicable
            a los usuarios finales es responsabilidad del licenciatario (el asesor, coach o
            empresa que redistribuye la herramienta), quien debe redactar y publicar su propia
            política de privacidad adaptada a su contexto legal y jurisdicción.
          </p>
        </div>

        <div className={s.section}>
          <h2>7. Seguridad</h2>
          <p>
            Dado que los datos no se transmiten a servidores externos, no existen riesgos de
            filtraciones desde la infraestructura de FinanceOS. Sin embargo, la seguridad de
            los datos locales depende de la seguridad del dispositivo del usuario. Si el
            dispositivo es comprometido, los datos locales pueden estar en riesgo.
          </p>
          <p>
            Recomendamos exportar respaldos JSON periódicamente y almacenarlos en un lugar
            seguro fuera del dispositivo.
          </p>
        </div>

        <div className={s.section}>
          <h2>8. Menores de edad</h2>
          <p>
            FinanceOS no está dirigido a menores de 18 años. No recopilamos intencionalmente
            información de menores. Si un menor utiliza la herramienta bajo la supervisión
            de un adulto, la responsabilidad recae en ese adulto.
          </p>
        </div>

        <div className={s.section}>
          <h2>9. Cambios a esta política</h2>
          <p>
            MAXNOVA & LUCI Global LLC puede actualizar esta política en cualquier momento. Los cambios
            se publicarán en esta página con la fecha de actualización. El uso continuado
            de la herramienta implica aceptación de la política vigente.
          </p>
        </div>

        <div className={s.section}>
          <h2>10. Contacto</h2>
          <p>
            Para consultas relacionadas con privacidad: <strong>support@financeospro.com</strong>
          </p>
        </div>

        <div className={s.legalNotice}>
          ⚠ Este documento fue redactado como punto de partida informativo. No constituye
          asesoría legal. Se recomienda revisión por un abogado especializado antes de
          uso comercial definitivo, especialmente para jurisdicciones con regulaciones
          específicas de protección de datos (GDPR, LGPD, etc.).
        </div>

      </div>
    </div>
  )
}
