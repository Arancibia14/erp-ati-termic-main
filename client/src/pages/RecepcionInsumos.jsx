import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Package, CheckCircle2, AlertTriangle, Navigation, XCircle, Crosshair } from 'lucide-react';
import api from '../api/axios';
import Toast, { useToast } from '../components/Toast';
import Badge from '../components/Badge';

export default function RecepcionInsumos() {
  const { toasts, addToast, removeToast } = useToast();
  const navigate = useNavigate();
  const [guias, setGuias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmando, setConfirmando] = useState(null);
  const [obteniendo, setObteniendo] = useState(false);
  const [gpsSupervisor, setGpsSupervisor] = useState(null); // { lat, lon } capturado, solo lectura
  const [resultado, setResultado] = useState(null); // { guia, distancia, verificada }

  useEffect(() => {
    cargarGuias();
  }, []);

  const cargarGuias = () => {
    setLoading(true);
    api.get('/recepcion/guias-pendientes')
      .then(r => setGuias(r.data.data))
      .catch(() => addToast('Error al cargar guías pendientes', 'error'))
      .finally(() => setLoading(false));
  };

  const iniciarConfirmacion = guia => {
    setConfirmando(guia);
    setResultado(null);
    setGpsSupervisor(null);
  };

  const cancelarConfirmacion = () => {
    setConfirmando(null);
    setCoordsObra({ lat: '', lon: '' });
  };

  const detectarGPS = () => {
    if (!navigator.geolocation) {
      addToast('Tu dispositivo no soporta geolocalización', 'error'); return;
    }
    setObteniendo(true);
    setGpsSupervisor(null);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setObteniendo(false);
        setGpsSupervisor({ lat: pos.coords.latitude, lon: pos.coords.longitude, precision: Math.round(pos.coords.accuracy) });
      },
      err => {
        setObteniendo(false);
        if (err.code === 1) addToast('Permiso de ubicación denegado. Habilítalo en la configuración del navegador.', 'error');
        else addToast('No se pudo obtener el GPS. Verifica que la ubicación esté activa en el dispositivo.', 'error');
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const confirmarConGPS = () => {
    if (!gpsSupervisor) { addToast('Primero detecta tu ubicación GPS', 'error'); return; }
    enviarRecepcion(confirmando, gpsSupervisor.lat, gpsSupervisor.lon);
  };

  const enviarRecepcion = async (guia, latSupervisor, lonSupervisor) => {
    try {
      const r = await api.post(`/recepcion/${guia.guia_despacho_id}/confirmar`, {
        latitud_supervisor: latSupervisor,
        longitud_supervisor: lonSupervisor
      });
      const data = r.data.data;
      setResultado({ guia, distancia: data.distancia_metros, verificada: data.ubicacion_verificada, fueraDeRango: data.fuera_de_rango });
      setConfirmando(null);
      cargarGuias();
    } catch (err) {
      addToast(err.response?.data?.error || 'Error al confirmar recepción', 'error');
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Package size={20} />
        Recepción de Insumos en Obra
      </h1>

      <p style={{ color: 'var(--color-text-secondary)', fontSize: 13, marginBottom: 24, maxWidth: 600 }}>
        Confirma la recepción de insumos desde el sitio de la obra. El sistema verifica que tu ubicación GPS
        esté dentro de los 500m del radio de la obra.
      </p>

      {/* Panel de resultado */}
      {resultado && (
        <div style={{
          maxWidth: 700, marginBottom: 20, borderRadius: 8,
          border: `2px solid ${resultado.verificada ? 'var(--color-green)' : 'var(--color-warning)'}`,
          overflow: 'hidden'
        }}>
          <div style={{
            background: resultado.verificada ? 'rgba(34,197,94,0.08)' : 'rgba(212,147,10,0.08)',
            padding: '16px 20px',
            display: 'flex', alignItems: 'flex-start', gap: 14
          }}>
            {resultado.verificada
              ? <CheckCircle2 size={22} color="var(--color-green)" style={{ flexShrink: 0, marginTop: 1 }} />
              : <AlertTriangle size={22} color="var(--color-warning)" style={{ flexShrink: 0, marginTop: 1 }} />
            }
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4,
                color: resultado.verificada ? 'var(--color-green)' : 'var(--color-warning)' }}>
                {resultado.verificada
                  ? 'Recepción confirmada — Ubicación Verificada'
                  : 'Excepción 1: Fuera de rango — Recepción guardada sin verificación de ubicación'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                Guía N° {resultado.guia.guia_despacho_numero} · Distancia registrada: <strong>{resultado.distancia}m</strong>
                {resultado.fueraDeRango && ` (máx. permitido: 5000m)`}
              </div>
              {resultado.fueraDeRango && (
                <div style={{ fontSize: 12, marginTop: 8, color: 'var(--color-text-muted)' }}>
                  La recepción fue guardada con el estado "Recibido" pero <strong>sin</strong> la etiqueta de Ubicación Verificada,
                  ya que el supervisor se encontraba fuera del radio de 500m de la obra.
                </div>
              )}
            </div>
            <button
              onClick={() => setResultado(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4 }}
            >
              <XCircle size={16} />
            </button>
          </div>
          {resultado.verificada && (
            <div style={{
              background: 'rgba(34,197,94,0.04)', padding: '10px 20px',
              borderTop: '1px solid var(--color-border)',
              display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--color-green)'
            }}>
              <CheckCircle2 size={13} />
              Este registro ha sido guardado con la etiqueta <strong>Ubicación Verificada</strong>
            </div>
          )}
        </div>
      )}

      {loading && <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Cargando guías pendientes...</p>}

      {!loading && guias.length === 0 && !resultado && (
        <div className="card" style={{ maxWidth: 500, textAlign: 'center', padding: 40 }}>
          <CheckCircle2 size={32} color="var(--color-green)" style={{ marginBottom: 12 }} />
          <p style={{ fontWeight: 600, marginBottom: 4 }}>Todo al día</p>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>No hay guías de despacho pendientes de recepción.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 700 }}>
        {guias.map(g => (
          <div key={g.guia_despacho_id} className="card" style={{ padding: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <Package size={18} color="var(--color-text-muted)" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Guía N° {g.guia_despacho_numero}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                    Fecha: {g.guia_despacho_fecha} · OC #{g.orden_compra_id}
                    {g.OrdenCompra?.Proyecto && (
                      <span style={{ marginLeft: 8, color: 'var(--color-text-secondary)' }}>
                        · {g.OrdenCompra.proyecto_codigo_correlativo} — {g.OrdenCompra.Proyecto.proyecto_nombre_obra}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Badge value={g.guia_despacho_estado} />
                {confirmando?.guia_despacho_id !== g.guia_despacho_id && (
                  <button
                    className="btn btn-primary"
                    style={{ height: 34, fontSize: 13 }}
                    onClick={() => iniciarConfirmacion(g)}
                  >
                    <MapPin size={13} />
                    Confirmar Recepción
                  </button>
                )}
              </div>
            </div>

            {/* Panel de confirmación GPS */}
            {confirmando?.guia_despacho_id === g.guia_despacho_id && (() => {
              const proyecto = g.OrdenCompra?.Proyecto;
              const tieneCoords = proyecto?.proyecto_latitud && proyecto?.proyecto_longitud;
              return (
                <div style={{ borderTop: '1px solid var(--color-border)', padding: 20 }}>
                  {tieneCoords && (
                    <div style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      background: 'rgba(212, 147, 10, 0.08)',
                      border: '1px solid var(--color-warning)',
                      borderRadius: 4, padding: '10px 14px', marginBottom: 16,
                      fontSize: 12, color: 'var(--color-warning)'
                    }}>
                      <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                      El sistema verificará que estés dentro de 5000m del sitio de la obra.
                      Si estás fuera de rango, la recepción igual se guardará pero sin la etiqueta de ubicación verificada.
                    </div>
                  )}

                  {tieneCoords ? (
                    <div style={{
                      background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
                      borderRadius: 4, padding: '10px 14px', marginBottom: 16,
                      fontSize: 12, color: 'var(--color-text-secondary)'
                    }}>
                      <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--color-text-primary)' }}>
                        Ubicación de la Obra (configurada por el administrador)
                      </div>
                      <div style={{ fontFamily: 'monospace' }}>
                        {parseFloat(proyecto.proyecto_latitud).toFixed(6)}, {parseFloat(proyecto.proyecto_longitud).toFixed(6)}
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      background: 'rgba(220,38,38,0.07)', border: '1px solid var(--color-danger)',
                      borderRadius: 6, padding: '14px 16px', marginBottom: 16
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-danger)', marginBottom: 6 }}>
                        Sin coordenadas GPS configuradas
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
                        El proyecto <strong style={{ color: 'var(--color-text-primary)' }}>
                          {g.OrdenCompra?.proyecto_codigo_correlativo} — {g.OrdenCompra?.Proyecto?.proyecto_nombre_obra ?? 'desconocido'}
                        </strong> no tiene las coordenadas del sitio de obra registradas.
                        Configúralas y vuelve aquí.
                      </div>
                      <button
                        className="btn btn-secondary"
                        style={{ fontSize: 12, height: 30, padding: '0 12px' }}
                        onClick={() => navigate('/configuracion')}
                      >
                        Ir a Configuración → Proyectos
                      </button>
                    </div>
                  )}

                  {/* Sección GPS del supervisor */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 8 }}>
                      Tu ubicación actual (GPS del dispositivo)
                    </div>

                    {!gpsSupervisor ? (
                      <button
                        className="btn btn-secondary"
                        onClick={detectarGPS}
                        disabled={obteniendo || !tieneCoords}
                        style={{ fontSize: 13 }}
                      >
                        <Navigation size={14} />
                        {obteniendo ? 'Detectando GPS...' : 'Detectar mi ubicación GPS'}
                      </button>
                    ) : (
                      <div style={{
                        background: 'var(--color-bg-elevated)',
                        border: '1px solid var(--color-green)',
                        borderRadius: 4, padding: '10px 14px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                      }}>
                        <div>
                          <div style={{ fontSize: 12, color: 'var(--color-green)', fontWeight: 600, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <CheckCircle2 size={13} /> Ubicación detectada
                          </div>
                          <div style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--color-text-primary)' }}>
                            {gpsSupervisor.lat.toFixed(6)}, {gpsSupervisor.lon.toFixed(6)}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                            Precisión aproximada: ±{gpsSupervisor.precision}m
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={detectarGPS}
                          disabled={obteniendo}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--color-text-muted)', textDecoration: 'underline' }}
                        >
                          {obteniendo ? 'Detectando...' : 'Volver a detectar'}
                        </button>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      className="btn btn-primary"
                      onClick={confirmarConGPS}
                      disabled={obteniendo || !tieneCoords || !gpsSupervisor}
                    >
                      <CheckCircle2 size={14} />
                      Confirmar Recepción Final
                    </button>
                    <button className="btn btn-secondary" onClick={cancelarConfirmacion}>
                      Cancelar
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        ))}
      </div>

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
