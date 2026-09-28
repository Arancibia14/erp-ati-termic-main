import { Inbox } from 'lucide-react';

// Estado vacío estándar para listados/tablas sin datos. Antes cada página
// escribía su propio texto centrado con estilos inline distintos; este
// componente unifica el contenedor y el ícono, pero el mensaje que recibe
// como children es siempre el mismo texto que ya mostraba cada pantalla.
export default function EstadoVacio({ icon: Icono = Inbox, children, hint }) {
  return (
    <div className="estado-vacio">
      <Icono size={26} strokeWidth={1.5} className="vacio-icono" />
      <p>{children}</p>
      {hint && <p className="vacio-hint">{hint}</p>}
    </div>
  );
}
