// Avance como el ciclo del logo: la flecha azul recorre el porcentaje y la gris
// el resto del camino, separadas por un espacio fijo.
const R = 26;
const C = 32;
const LARGO_PUNTA = 17;
const ESPACIO = 7;
const ANCHO_PUNTA = 5.5;

function punto(grados, radio = R) {
  const rad = (grados * Math.PI) / 180;
  return [C + radio * Math.sin(rad), C - radio * Math.cos(rad)].map(n => n.toFixed(2));
}

function arco(desde, hasta) {
  return `M${punto(desde).join(' ')}A${R} ${R} 0 ${hasta - desde > 180 ? 1 : 0} 1 ${punto(hasta).join(' ')}`;
}

function punta(base, tip) {
  return `${punto(base, R - ANCHO_PUNTA).join(',')} ${punto(base, R + ANCHO_PUNTA).join(',')} ${punto(tip).join(',')}`;
}

export default function CicloAvance({ porcentaje, size = 72 }) {
  const p = Math.max(0, Math.min(100, Math.round(Number(porcentaje) || 0)));
  const tip = Math.max(LARGO_PUNTA + 6, 3.6 * p);
  const base = tip - LARGO_PUNTA;
  const finGris = 360 - ESPACIO;
  const baseGris = finGris - LARGO_PUNTA;
  const inicioGris = tip + ESPACIO;

  return (
    <svg className="ciclo" width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={`Avance ${p}%`}>
      {inicioGris < baseGris - 2 && (
        <g className="ciclo-resto">
          <path d={arco(inicioGris, baseGris)} />
          <polygon points={punta(baseGris, finGris)} />
        </g>
      )}
      <g className="ciclo-avance">
        <path d={arco(0, base)} />
        <polygon points={punta(base, tip)} />
      </g>
      <text x="32" y="37.5" textAnchor="middle">{p}%</text>
    </svg>
  );
}
