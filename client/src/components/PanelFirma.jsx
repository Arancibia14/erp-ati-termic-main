import { useRef, useEffect, useCallback } from 'react';
import { Eraser } from 'lucide-react';

// CU 68 - Panel de firma con dedo o mouse. Escala el trazo al tamaño real del
// canvas, porque en el celular se muestra más angosto que su resolución.
export default function PanelFirma({ onReady, onTrazo }) {
  const canvasRef = useRef(null);
  const dibujando = useRef(false);
  const tieneTrazo = useRef(false);
  const ultimo = useRef({ x: 0, y: 0 });

  const posicion = e => {
    const c = canvasRef.current;
    const rect = c.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return {
      x: (t.clientX - rect.left) * (c.width / rect.width),
      y: (t.clientY - rect.top) * (c.height / rect.height)
    };
  };

  const iniciar = e => {
    e.preventDefault();
    dibujando.current = true;
    ultimo.current = posicion(e);
  };

  const mover = e => {
    if (!dibujando.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const p = posicion(e);
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(ultimo.current.x, ultimo.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ultimo.current = p;
    if (!tieneTrazo.current) {
      tieneTrazo.current = true;
      onTrazo?.(true);
    }
  };

  const terminar = () => { dibujando.current = false; };

  const limpiar = useCallback(() => {
    const c = canvasRef.current;
    c.getContext('2d').clearRect(0, 0, c.width, c.height);
    tieneTrazo.current = false;
    onTrazo?.(false);
  }, [onTrazo]);

  useEffect(() => {
    onReady({
      isEmpty: () => !tieneTrazo.current,
      toDataURL: () => canvasRef.current.toDataURL('image/png'),
      clear: limpiar
    });
  }, [onReady, limpiar]);

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={520}
        height={200}
        style={{
          border: '1px dashed var(--color-border)',
          borderRadius: 6,
          background: '#fff',
          touchAction: 'none',
          width: '100%',
          maxWidth: 520,
          cursor: 'crosshair',
          display: 'block'
        }}
        onMouseDown={iniciar}
        onMouseMove={mover}
        onMouseUp={terminar}
        onMouseLeave={terminar}
        onTouchStart={iniciar}
        onTouchMove={mover}
        onTouchEnd={terminar}
      />
      <button type="button" className="btn btn-secondary" style={{ marginTop: 8 }} onClick={limpiar}>
        <Eraser size={14} /> Limpiar
      </button>
    </div>
  );
}
