import { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Save, Crosshair, TriangleAlert } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../api/axios';
import Toast, { useToast } from '../components/Toast';
import Badge from '../components/Badge';

// CU10 - Registrando geolocalización de la obra
const CENTRO_CHILE = [-33.4489, -70.6693]; // Santiago, cuando el proyecto aún no tiene punto
const ZOOM_PAIS = 11;
const ZOOM_PUNTO = 17;

// El icono por defecto de Leaflet depende de imágenes que el bundler no resuelve;
// un divIcon evita ese problema y se estiliza con CSS propio.
const ICONO_OBRA = L.divIcon({
  className: 'marcador-obra',
  html: '<span class="marcador-obra-punto"></span>',
  iconSize: [26, 26],
  iconAnchor: [13, 13]
});

const numero = v => (v === null || v === undefined || v === '' ? null : Number(v));

export default function UbicacionObra() {
  const { toasts, addToast, removeToast } = useToast();
  const [proyectos, setProyectos] = useState([]);
  const [codigo, setCodigo] = useState('');
  const [proyecto, setProyecto] = useState(null);
  const [direccion, setDireccion] = useState('');
  const [punto, setPunto] = useState(null); // { lat, lon }
  const [buscando, setBuscando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mapaCaido, setMapaCaido] = useState(false); // CU10 Excepción 2
  const [manual, setManual] = useState({ lat: '', lon: '' });

  const contenedorRef = useRef(null);
  const mapaRef = useRef(null);
  const marcadorRef = useRef(null);
  const fallosTeselas = useRef(0);

  useEffect(() => {
    api.get('/bitacora/proyectos')
      .then(r => setProyectos(r.data.data))
      .catch(() => addToast('Error al cargar los proyectos', 'error'));
  }, []);

  // CU10 paso 2 - Se carga el componente de mapa interactivo
  useEffect(() => {
    if (!proyecto || mapaRef.current || !contenedorRef.current) return;

    // Arranca centrado en la región y, si el proyecto ya tiene punto, el efecto
    // de abajo lo reposiciona: así el mapa se crea una sola vez por proyecto.
    const mapa = L.map(contenedorRef.current).setView(CENTRO_CHILE, ZOOM_PAIS);

    const teselas = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    });
    // CU10 Excepción 2 - Si las teselas no cargan, el mapa no está disponible
    teselas.on('tileerror', () => {
      fallosTeselas.current += 1;
      if (fallosTeselas.current >= 3) setMapaCaido(true);
    });
    teselas.addTo(mapa);

    const marcador = L.marker(CENTRO_CHILE, { draggable: true, icon: ICONO_OBRA }).addTo(mapa);
    // CU10 paso 3 - El actor desplaza el marcador manualmente
    marcador.on('dragend', () => {
      const { lat, lng } = marcador.getLatLng();
      setPunto({ lat, lon: lng });
    });
    // Un clic en el mapa también reposiciona la obra
    mapa.on('click', e => {
      marcador.setLatLng(e.latlng);
      setPunto({ lat: e.latlng.lat, lon: e.latlng.lng });
    });

    mapaRef.current = mapa;
    marcadorRef.current = marcador;
    // El contenedor recién montado puede medir 0px hasta el siguiente repintado
    setTimeout(() => mapa.invalidateSize(), 120);

    return () => { mapa.remove(); mapaRef.current = null; marcadorRef.current = null; };
  }, [proyecto]);

  // CU10 paso 4 - El mapa se centra en el punto elegido
  useEffect(() => {
    if (!punto || !mapaRef.current || !marcadorRef.current) return;
    marcadorRef.current.setLatLng([punto.lat, punto.lon]);
    mapaRef.current.setView([punto.lat, punto.lon], ZOOM_PUNTO);
  }, [punto]);

  const elegirProyecto = cod => {
    setCodigo(cod);
    setMapaCaido(false);
    fallosTeselas.current = 0;
    if (!cod) { setProyecto(null); setPunto(null); setDireccion(''); return; }

    api.get(`/ubicacion/${cod}`)
      .then(r => {
        const p = r.data.data.proyecto;
        setProyecto(p);
        setDireccion(p.proyecto_ubicacion || '');
        const lat = numero(p.proyecto_latitud), lon = numero(p.proyecto_longitud);
        const tiene = lat !== null && lon !== null;
        setPunto(tiene ? { lat, lon } : null);
        setManual(tiene ? { lat: String(lat), lon: String(lon) } : { lat: '', lon: '' });
      })
      .catch(() => addToast('Error al cargar la ubicación del proyecto', 'error'));
  };

  // CU10 pasos 3 y 4 - Buscar la dirección y convertirla en coordenadas
  const buscar = e => {
    e.preventDefault();
    if (!direccion.trim()) return addToast('Escribe la dirección de la obra', 'error');
    setBuscando(true);
    api.post('/ubicacion/buscar', { direccion: direccion.trim() })
      .then(r => {
        const { latitud, longitud, direccion_encontrada } = r.data.data;
        setPunto({ lat: latitud, lon: longitud });
        setManual({ lat: String(latitud), lon: String(longitud) });
        addToast(`Dirección encontrada: ${direccion_encontrada}`, 'success');
      })
      .catch(err => {
        const d = err.response?.data;
        addToast(d?.error || 'No se pudo buscar la dirección', 'error');
        // CU10 Excepción 1 y 2 - Se ofrece marcar el punto a mano
        if (d?.sugerir_manual) {
          setMapaCaido(m => m || d.causa === 'SIN_CONEXION' || d.causa === 'SERVICIO');
          addToast('Marca el punto en el mapa o escribe las coordenadas a mano', 'warning');
        }
      })
      .finally(() => setBuscando(false));
  };

  const aplicarManual = () => {
    const lat = parseFloat(manual.lat), lon = parseFloat(manual.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return addToast('Escribe la latitud y la longitud', 'error');
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return addToast('Latitud entre -90 y 90, longitud entre -180 y 180', 'error');
    setPunto({ lat, lon });
    addToast('Punto ubicado según las coordenadas ingresadas', 'success');
  };

  // CU10 pasos 5 y 6 - Confirmar la ubicación
  const guardar = () => {
    if (!punto) return addToast('Marca la posición de la obra en el mapa antes de guardarla', 'error');
    setGuardando(true);
    api.put(`/ubicacion/${codigo}`, {
      latitud: punto.lat,
      longitud: punto.lon,
      direccion: direccion.trim() || undefined
    })
      .then(r => {
        addToast(r.data?.mensaje || 'Ubicación guardada', 'success');
        setProyecto(p => ({ ...p, proyecto_latitud: punto.lat, proyecto_longitud: punto.lon,
          proyecto_ubicacion: direccion.trim() || p.proyecto_ubicacion }));
      })
      .catch(err => addToast(err.response?.data?.error || 'Error al guardar la ubicación', 'error'))
      .finally(() => setGuardando(false));
  };

  const yaTenia = proyecto && numero(proyecto.proyecto_latitud) !== null;

  return (
    <div className="page-container">
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <MapPin size={20} />
        Ubicación de la Obra
      </h1>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Proyecto</label>
          <select className="form-select" value={codigo} onChange={e => elegirProyecto(e.target.value)}>
            <option value="">Selecciona un proyecto...</option>
            {proyectos.map(p => (
              <option key={p.proyecto_codigo_correlativo} value={p.proyecto_codigo_correlativo}>
                {p.proyecto_codigo_correlativo} — {p.proyecto_nombre_obra}
                {p.proyecto_latitud ? ' ✓' : ' (sin ubicar)'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {proyecto && (
        <>
          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{proyecto.proyecto_nombre_obra}</h2>
              <Badge value={proyecto.EstadoProyecto?.estado_proyecto_nombre} />
              <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--color-text-muted)' }}>
                {proyecto.proyecto_codigo_correlativo}
              </span>
              <span style={{ fontSize: 12, color: yaTenia ? 'var(--color-green)' : 'var(--color-text-muted)' }}>
                {yaTenia
                  ? `Ubicada en ${Number(proyecto.proyecto_latitud).toFixed(6)}, ${Number(proyecto.proyecto_longitud).toFixed(6)}`
                  : 'Todavía sin ubicación registrada'}
              </span>
            </div>

            {/* CU10 paso 3 - Buscador de dirección */}
            <form onSubmit={buscar}>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Dirección de la Obra</label>
                <input className="form-input" placeholder="Av. Américo Vespucio 1737, Huechuraba, Santiago"
                  value={direccion} onChange={e => setDireccion(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-secondary" disabled={buscando}>
                <Search size={15} /> {buscando ? 'Buscando...' : 'Buscar en el mapa'}
              </button>
            </form>
          </div>

          {/* CU10 Excepción 2 - El mapa no está disponible */}
          {mapaCaido && (
            <div className="card" style={{ marginBottom: 24, borderLeft: '3px solid var(--color-warning)' }}>
              <p style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--color-warning)', margin: 0 }}>
                <TriangleAlert size={16} />
                El servicio de mapas no está disponible. Ingresa las coordenadas de la obra a mano.
              </p>
            </div>
          )}

          {/* CU10 paso 2 - Mapa interactivo */}
          <div className="card" style={{ padding: 0, marginBottom: 24, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border)' }}>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>
                Arrastra el marcador o haz clic en el mapa para ajustar la posición exacta de la obra.
              </p>
            </div>
            <div ref={contenedorRef} className="mapa-obra" />
            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--color-border)', display: 'flex',
              alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontFamily: 'monospace' }}>
                <Crosshair size={15} />
                {punto ? `${punto.lat.toFixed(6)}, ${punto.lon.toFixed(6)}` : 'Sin punto marcado'}
              </span>
              <button type="button" className="btn btn-primary" onClick={guardar} disabled={guardando || !punto}>
                <Save size={15} /> {guardando ? 'Guardando...' : 'Guardar posición'}
              </button>
            </div>
          </div>

          {/* Ingreso manual, siempre disponible como respaldo */}
          <div className="card">
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 0, marginBottom: 6 }}>
              Coordenadas a mano
            </h3>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 0, marginBottom: 16 }}>
              Útil si el mapa no carga o si ya tienes el punto medido en terreno.
            </p>
            <div className="form-grid-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Latitud</label>
                <input className="form-input" placeholder="-33.456789" value={manual.lat}
                  onChange={e => setManual(m => ({ ...m, lat: e.target.value }))} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Longitud</label>
                <input className="form-input" placeholder="-70.648300" value={manual.lon}
                  onChange={e => setManual(m => ({ ...m, lon: e.target.value }))} />
              </div>
            </div>
            <button type="button" className="btn btn-secondary" style={{ marginTop: 16 }} onClick={aplicarManual}>
              <Crosshair size={15} /> Ubicar en el mapa
            </button>
          </div>
        </>
      )}

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
