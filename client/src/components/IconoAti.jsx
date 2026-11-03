// Íconos dibujados de ATI Termic: piezas del rubro (unidad HVAC, ducto, casco,
// válvula...) en verde y azul marino. Las clases pintan cada parte:
// f = verde, g = verde oscuro, d = trazo principal, h = hueco del fondo,
// l y c = líneas, y = advertencia, k = signo sobre la advertencia.
const FORMAS = {
  unidad: <><rect className="f" x="2.5" y="3.5" width="19" height="16" rx="2" /><circle className="h" cx="12" cy="11.5" r="5.4" /><path className="d" d="M12 11.5c-.7-2.2.1-3.7 2-4.3.7 1.9 0 3.4-2 4.3zM12 11.5c2.1-.9 3.7-.3 4.5 1.4-1.8.9-3.4.4-4.5-1.4zM12 11.5c-1.6 1.7-3.4 1.8-4.8.7 1.2-1.5 3-1.8 4.8-.7z" /><path className="d" d="M6 19.5h2.5V22H6zM15.5 19.5H18V22h-2.5z" /></>,
  ducto: <><path className="f" d="M5 6.5h7a10 10 0 0 1 10 10V19h-9v-2a2.5 2.5 0 0 0-2.5-2.5H5z" /><path className="d" d="M2 4.5h3v12H2zM11.5 19h12v3h-12z" /></>,
  casco: <><path className="f" d="M3.5 15.5a8.5 8.5 0 0 1 17 0z" /><path className="h" d="M9.6 7.3h1.4v8.2H9.6zM13 7.3h1.4v8.2H13z" /><path className="d" d="M1.5 15.5h21V18a1.5 1.5 0 0 1-1.5 1.5H3A1.5 1.5 0 0 1 1.5 18z" /></>,
  valvula: <><path className="d" d="M1.5 9h2.5v10H1.5zM20 9h2.5v10H20zM4 13h3v2H4zM17 13h3v2h-3zM11 7h2v7h-2zM7.5 4h9v3h-9z" /><path className="f" d="M6 9.5l6 4.5-6 4.5zM18 9.5L12 14l6 4.5z" /></>,
  caja: <><rect className="f" x="1.5" y="5.5" width="21" height="13" rx="2" /><circle className="h" cx="12" cy="12" r="3.7" /><circle className="d" cx="12" cy="12" r="1.5" /><path className="h" d="M4.5 11h2v2h-2zM17.5 11h2v2h-2z" /></>,
  termostato: <><rect className="f" x="3.5" y="2.5" width="17" height="19" rx="2.5" /><circle className="h" cx="12" cy="10.5" r="5.2" /><path className="l" d="M12 10.5l2.4-2.6" /><path className="d" d="M8 17.5h8v1.6H8z" /></>,
  firma: <><path className="f" d="M5 2h9.5L19.5 7v15H5z" /><path className="g" d="M14.5 2v5h5z" /><path className="c" d="M8.5 14l2.5 2.5 4.8-5.2" /></>,
  revisa: <><path className="d" d="M14.8 16.9l2.1-2.1 5.6 5.6-2.1 2.1z" /><circle className="f" cx="10" cy="10" r="8" /><circle className="h" cx="10" cy="10" r="5.2" /><path className="l" d="M7.6 10l1.8 1.8 3.1-3.3" /></>,
  contrato: <><path className="d" d="M4 2h9.5L18 6.5V10a7 7 0 0 0-6.6 12H4z" /><circle className="f" cx="17" cy="17" r="5.5" /><path className="c" d="M17 14.2V17l1.9 1.2" /></>,
  camion: <><path className="f" d="M1 5.5h13.5v12H1z" /><path className="d" d="M15.5 9.5h4l3.5 4v4h-7.5z" /><circle className="d" cx="6" cy="18.5" r="2.8" /><circle className="h" cx="6" cy="18.5" r="1.1" /><circle className="d" cx="18" cy="18.5" r="2.8" /><circle className="h" cx="18" cy="18.5" r="1.1" /></>,
  foto: <><path className="f" d="M2 8a1.5 1.5 0 0 1 1.5-1.5h3.7L9 4h6l1.8 2.5h3.7A1.5 1.5 0 0 1 22 8v11a1.5 1.5 0 0 1-1.5 1.5h-17A1.5 1.5 0 0 1 2 19z" /><circle className="h" cx="12" cy="13.5" r="4.4" /><circle className="d" cx="12" cy="13.5" r="2" /></>,
  bitacora: <><path className="f" d="M8 2.5h12v19H8z" /><path className="d" d="M4 2.5h3v19H4z" /><path className="c" d="M11 8h6M11 12h6M11 16h3.5" /></>,
  recepcion: <><path className="f" d="M12 2l9.5 5.2L12 12.4 2.5 7.2z" /><path className="g" d="M2.5 8.8l8.8 4.8V22l-8.8-4.8z" /><path className="d" d="M21.5 8.8l-8.8 4.8V22l8.8-4.8z" /></>,
  sso: <><path className="y" d="M12 2.5l10.5 18.5h-21z" /><path className="k" d="M12 9.5v5.5M12 18h.01" /></>,
  orden: <><path className="f" d="M6.5 7h15.5l-2.4 8.5H8.2z" /><path className="l" d="M2 3.5h3.2l2.6 12" /><circle className="d" cx="9.5" cy="19.5" r="2" /><circle className="d" cx="17.5" cy="19.5" r="2" /></>,
  curva: <><path className="f" d="M5 20V15l4.5-5 4 3.2L20 6.5 22 8v12z" /><path className="d" d="M2 2.5h2V20h18v2H2z" /></>,
  guia: <><path className="d" d="M5 2h14v20H5z" /><path className="f" d="M5 2h14v6H5z" /><path className="c" d="M8.5 12.5h7M8.5 16.5h4.5" /></>
};

export default function IconoAti({ nombre, size = 24, className = '' }) {
  const forma = FORMAS[nombre];
  if (!forma) return null;
  return (
    <svg className={`ico-ati${className ? ' ' + className : ''}`} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {forma}
    </svg>
  );
}
