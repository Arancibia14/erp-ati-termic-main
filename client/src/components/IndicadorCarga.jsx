import { useEffect, useState, useSyncExternalStore } from 'react';
import { suscribir, leerEstado } from '../utils/cargaGlobal';

export function CargaPagina() {
  return (
    <div className="carga-pagina" role="status" aria-live="polite">
      <span className="spinner" />
      <span>Cargando...</span>
    </div>
  );
}

export default function IndicadorCarga() {
  const { total, lecturas } = useSyncExternalStore(suscribir, leerEstado);
  const [barra, setBarra] = useState(false);
  const [velo, setVelo] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setBarra(total > 0), total > 0 ? 100 : 300);
    return () => clearTimeout(t);
  }, [total]);

  useEffect(() => {
    const t = setTimeout(() => {
      const activo = document.activeElement;
      const escribiendo = Boolean(activo) && ['INPUT', 'TEXTAREA', 'SELECT'].includes(activo.tagName);
      setVelo(lecturas > 0 && !escribiendo);
    }, lecturas > 0 ? 300 : 220);
    return () => clearTimeout(t);
  }, [lecturas]);

  return (
    <>
      {barra && <div className="carga-barra" />}
      {velo && (
        <div className="carga-velo" role="status" aria-live="polite">
          <div className="carga-tarjeta">
            <span className="spinner" />
            <span>Cargando información...</span>
          </div>
        </div>
      )}
    </>
  );
}
