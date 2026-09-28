import logoBlanco from '../assets/logo.png';
import logoTransparente from '../assets/logo-transparente.png';

// El logo real tiene fondo blanco sólido (necesario en modo oscuro: el
// subtítulo "Ingeniería Térmica" está en negro y desaparecería sobre un
// fondo oscuro). En modo claro, en cambio, la página ya es clara, así que
// se usa la versión sin fondo para que se integre en vez de quedar dentro
// de un recuadro blanco redundante.
export default function LogoMarca({ tema, variante = 'small', className = '' }) {
  const transparente = tema === 'light';
  return (
    <div className={`logo-chip ${variante}${transparente ? ' transparente' : ''}${className ? ' ' + className : ''}`}>
      <img src={transparente ? logoTransparente : logoBlanco} alt="ATI Termic" draggable="false" />
    </div>
  );
}
