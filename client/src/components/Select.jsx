import { useEffect, useId, useRef, useState, Children, isValidElement } from 'react';
import { ChevronDown, Check } from 'lucide-react';

// Combobox propio con la identidad visual de ATI Termic, en reemplazo del
// <select> nativo (cuya lista de opciones la dibuja el sistema operativo y
// no puede llevar nuestros colores). Se usa exactamente igual que un
// <select>: recibe value/onChange/className/disabled y sus <option> como
// hijos, y dispara onChange con un evento sintético { target: { value } }
// para no tocar ninguna lógica de los formularios que ya lo usan.
export default function Select({ value, onChange, className = '', disabled, id, name, style, children }) {
  const opciones = Children.toArray(children)
    .filter(isValidElement)
    .map(el => ({
      value: el.props.value ?? '',
      label: el.props.children,
      disabled: !!el.props.disabled,
    }));

  const [abierto, setAbierto] = useState(false);
  const [resaltado, setResaltado] = useState(-1);
  const raizRef = useRef(null);
  const listaRef = useRef(null);
  const listboxId = `sel-${useId()}`;

  const indiceActual = opciones.findIndex(o => o.value === value);
  const actual = indiceActual >= 0 ? opciones[indiceActual] : opciones[0];

  useEffect(() => {
    if (!abierto) return;
    const alClicFuera = e => {
      if (raizRef.current && !raizRef.current.contains(e.target)) setAbierto(false);
    };
    document.addEventListener('mousedown', alClicFuera);
    return () => document.removeEventListener('mousedown', alClicFuera);
  }, [abierto]);

  useEffect(() => {
    if (abierto) setResaltado(indiceActual >= 0 ? indiceActual : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);

  useEffect(() => {
    if (abierto) listaRef.current?.querySelector('.sel-opt.active')?.scrollIntoView({ block: 'nearest' });
  }, [resaltado, abierto]);

  const siguienteHabilitado = (desde, paso) => {
    if (opciones.length === 0) return -1;
    let i = desde;
    for (let n = 0; n < opciones.length; n++) {
      i = (i + paso + opciones.length) % opciones.length;
      if (!opciones[i].disabled) return i;
    }
    return desde;
  };

  const elegir = opcion => {
    if (!opcion || opcion.disabled) return;
    setAbierto(false);
    if (opcion.value !== value) onChange?.({ target: { value: opcion.value, name } });
  };

  const alTeclear = e => {
    if (disabled) return;
    if (!abierto) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        setAbierto(true);
      }
      return;
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setResaltado(i => siguienteHabilitado(i, 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setResaltado(i => siguienteHabilitado(i, -1)); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); elegir(opciones[resaltado]); }
    else if (e.key === 'Escape') { e.preventDefault(); setAbierto(false); }
    else if (e.key === 'Tab') setAbierto(false);
  };

  return (
    <div className={`sel ${className}`.trim()} style={style} ref={raizRef} data-disabled={disabled || undefined}>
      <button
        type="button"
        id={id}
        className="sel-control"
        onClick={() => !disabled && setAbierto(a => !a)}
        onKeyDown={alTeclear}
        disabled={disabled}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-controls={listboxId}
      >
        <span className={`sel-valor${!actual?.value ? ' placeholder' : ''}`}>{actual?.label ?? ''}</span>
        <ChevronDown size={15} className="sel-flecha" strokeWidth={2.2} />
      </button>
      {abierto && (
        <ul className="sel-lista" role="listbox" id={listboxId} ref={listaRef}>
          {opciones.map((o, i) => (
            <li
              key={`${o.value}-${i}`}
              role="option"
              aria-selected={o.value === value}
              className={`sel-opt${i === resaltado ? ' active' : ''}${o.disabled ? ' disabled' : ''}`}
              onMouseEnter={() => !o.disabled && setResaltado(i)}
              onMouseDown={e => { e.preventDefault(); elegir(o); }}
            >
              <span>{o.label}</span>
              {o.value === value && <Check size={14} className="sel-check" strokeWidth={2.5} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
