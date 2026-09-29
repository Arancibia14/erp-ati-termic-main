import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock } from 'lucide-react';
import api from '../api/axios';

const fechaCorta = f => (f ? f.split('-').reverse().join('-') : '');

// CU 18 / UR-F-20 - Alerta visual en Inicio de los contratos laborales que vencen
// dentro de los próximos 30 días. Solo la ve el Administrador Total y, si no hay
// contratos por vencer, la sección no aparece.
export default function ContratosPorVencer() {
  const [contratos, setContratos] = useState([]);

  useEffect(() => {
    api.get('/setup/contratos/por-vencer')
      .then(r => setContratos(r.data.data))
      .catch(() => {});
  }, []);

  if (contratos.length === 0) return null;

  return (
    <>
      <div className="dash-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <CalendarClock size={14} /> Contratos por vencer ({contratos.length})
      </div>
      <div className="contratos-por-vencer" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {contratos.map(c => (
          <article key={c.contrato_laboral_id_contrato} style={{
            display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap',
            padding: '12px 14px', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)',
            borderLeft: '4px solid var(--color-warning)', borderRadius: 12, minWidth: 0
          }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{c.trabajador}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', overflowWrap: 'anywhere' }}>
                {c.trabajador_rut}{c.proyecto_nombre_obra ? ` · ${c.proyecto_nombre_obra}` : ''} · termina el {fechaCorta(c.contrato_laboral_fecha_termino)}
              </div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-warning)', whiteSpace: 'nowrap' }}>
              {c.dias_restantes === 0 ? 'Vence hoy' : c.dias_restantes === 1 ? 'Vence en 1 día' : `Vence en ${c.dias_restantes} días`}
            </span>
          </article>
        ))}
        <Link to="/configuracion" style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
          Revisa o renueva los contratos en Configuración, pestaña Contratos
        </Link>
      </div>
    </>
  );
}
