import { useState, useSyncExternalStore } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { suscribirConexion, leerConexion } from '../utils/conexion';

export default function EstadoConexion() {
  const enLinea = useSyncExternalStore(suscribirConexion, leerConexion, () => true);
  const [ultimoEstado, setUltimoEstado] = useState(enLinea);
  const [mostrarVuelta, setMostrarVuelta] = useState(false);

  if (enLinea !== ultimoEstado) {
    setUltimoEstado(enLinea);
    if (enLinea) {
      setMostrarVuelta(true);
      setTimeout(() => setMostrarVuelta(false), 3200);
    }
  }

  if (!enLinea) {
    return (
      <div className="conexion-banda offline" role="status">
        <WifiOff size={14} strokeWidth={2} />
        Sin conexión — los cambios que hagas podrían no guardarse hasta reconectar
      </div>
    );
  }

  if (mostrarVuelta) {
    return (
      <div className="conexion-banda online" role="status">
        <Wifi size={14} strokeWidth={2} />
        Conexión restablecida
      </div>
    );
  }

  return null;
}
