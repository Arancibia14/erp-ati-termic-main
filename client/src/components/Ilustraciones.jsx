export function IlustracionCatalogoVacio(props) {
  return (
    <svg viewBox="0 0 120 100" className="ilustracion-vacia" aria-hidden="true" {...props}>
      <rect x="18" y="34" width="84" height="54" rx="6" />
      <line x1="18" y1="52" x2="102" y2="52" />
      <line x1="34" y1="34" x2="34" y2="88" />
      <line x1="58" y1="34" x2="58" y2="88" />
      <line x1="82" y1="34" x2="82" y2="88" />
      <path d="M44 34 L44 20 Q44 12 52 12 L68 12 Q76 12 76 20 L76 34" />
      <circle cx="60" cy="66" r="7" className="marca" />
      <line x1="60" y1="63" x2="60" y2="69" className="marca" />
      <line x1="57" y1="66" x2="63" y2="66" className="marca" />
    </svg>
  );
}

export function IlustracionEquipoVacio(props) {
  return (
    <svg viewBox="0 0 120 100" className="ilustracion-vacia" aria-hidden="true" {...props}>
      <path d="M30 46 Q60 14 90 46" />
      <path d="M22 46 L98 46" />
      <path d="M40 46 L36 66 Q36 74 44 74 L76 74 Q84 74 84 66 L80 46" />
      <line x1="50" y1="56" x2="70" y2="56" />
      <line x1="50" y1="64" x2="64" y2="64" />
      <circle cx="88" cy="30" r="9" className="marca" />
      <path d="M85 30 L87.5 33 L92 27" className="marca" />
    </svg>
  );
}
