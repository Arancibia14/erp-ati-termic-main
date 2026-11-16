import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './styles/index.css';
import Sidebar from './components/Sidebar';
import Migas from './components/Migas';
import { CargaPagina } from './components/IndicadorCarga';
import EstadoConexion from './components/EstadoConexion';
import { iniciarVigilanciaInactividad } from './utils/inactividad';
import './styles/theme.css';
import Login from './pages/acceso/Login';
import RestablecerContrasena from './pages/acceso/RestablecerContrasena';
const Inicio = lazy(() => import('./pages/inicio/Inicio'));
const Bitacora = lazy(() => import('./pages/proyectos/Bitacora'));
const PlanificacionHitos = lazy(() => import('./pages/proyectos/PlanificacionHitos'));
const UbicacionObra = lazy(() => import('./pages/proyectos/UbicacionObra'));
const EspecificacionesTecnicas = lazy(() => import('./pages/proyectos/EspecificacionesTecnicas'));
const CatalogoProveedores = lazy(() => import('./pages/materiales/CatalogoProveedores'));
const CajaChica = lazy(() => import('./pages/finanzas/CajaChica'));
const SSO = lazy(() => import('./pages/proyectos/SSO'));
const Evidencia = lazy(() => import('./pages/proyectos/Evidencia'));
const ValidarEvidencias = lazy(() => import('./pages/proyectos/ValidarEvidencias'));
const OrdenCompra = lazy(() => import('./pages/materiales/OrdenCompra'));
const VincularFactura = lazy(() => import('./pages/finanzas/VincularFactura'));
const ControlCostos = lazy(() => import('./pages/finanzas/ControlCostos'));
const Comunicacion = lazy(() => import('./pages/proyectos/Comunicacion'));
const RecepcionInsumos = lazy(() => import('./pages/proyectos/RecepcionInsumos'));
const SubcontratistasProyecto = lazy(() => import('./pages/proyectos/SubcontratistasProyecto'));
const ManoObra = lazy(() => import('./pages/finanzas/ManoObra'));
const Portafolio = lazy(() => import('./pages/proyectos/Portafolio'));
const EstadoProyecto = lazy(() => import('./pages/proyectos/EstadoProyecto'));
const BuscadorDocumentos = lazy(() => import('./pages/sistema/BuscadorDocumentos'));
const ControlPresupuesto = lazy(() => import('./pages/finanzas/ControlPresupuesto'));
const Polizas = lazy(() => import('./pages/proyectos/Polizas'));
const CertificadoTecnico = lazy(() => import('./pages/proyectos/CertificadoTecnico'));
const Configuracion = lazy(() => import('./pages/sistema/Configuracion'));
const AvisosInternos = lazy(() => import('./pages/sistema/AvisosInternos'));
const Catalogo = lazy(() => import('./pages/materiales/Catalogo'));
const SolicitudMateriales = lazy(() => import('./pages/materiales/SolicitudMateriales'));
const AprobacionesPendientes = lazy(() => import('./pages/materiales/AprobacionesPendientes'));
const Trabajadores = lazy(() => import('./pages/personal/Trabajadores'));
const DocumentacionTrabajador = lazy(() => import('./pages/personal/DocumentacionTrabajador'));
const ActaRecepcion = lazy(() => import('./pages/proyectos/ActaRecepcion'));
const IngresoGuia = lazy(() => import('./pages/materiales/IngresoGuia'));
const DocumentacionLaboral = lazy(() => import('./pages/personal/DocumentacionLaboral'));
const Liquidaciones = lazy(() => import('./pages/personal/Liquidaciones'));
const AnexoContrato = lazy(() => import('./pages/personal/AnexoContrato'));
const EntregaEpp = lazy(() => import('./pages/personal/EntregaEpp'));
const HistorialEntregasEpp = lazy(() => import('./pages/personal/HistorialEntregasEpp'));
const CatalogoEquipos = lazy(() => import('./pages/materiales/CatalogoEquipos'));
const CargarGarantia = lazy(() => import('./pages/materiales/CargarGarantia'));
const DescargarGarantia = lazy(() => import('./pages/materiales/DescargarGarantia'));
const Herramientas = lazy(() => import('./pages/materiales/Herramientas'));
const MaterialesTransito = lazy(() => import('./pages/materiales/MaterialesTransito'));
const CertificadosCalidad = lazy(() => import('./pages/materiales/CertificadosCalidad'));
const DevolucionObra = lazy(() => import('./pages/materiales/DevolucionObra'));
const HistorialOrdenesCompra = lazy(() => import('./pages/materiales/HistorialOrdenesCompra'));
const Usuarios = lazy(() => import('./pages/sistema/Usuarios'));
const ReporteAuditoria = lazy(() => import('./pages/sistema/ReporteAuditoria'));

function PrivateLayout({ children }) {
  const token = localStorage.getItem('token');

  // CU05 - Vigilante de inactividad, activo en todas las páginas privadas
  useEffect(() => {
    if (!token) return;
    return iniciarVigilanciaInactividad();
  }, [token]);

  if (!token) return <Navigate to="/login" replace />;
  return (
    <div className="app-layout">
      <Sidebar />
      <EstadoConexion />
      <main className="main-content">
        <Migas />
        <Suspense fallback={<CargaPagina />}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}

function AdminRoute({ children }) {
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  if (usuario.rol !== 'admin') return <Navigate to="/bitacora" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/restablecer" element={<RestablecerContrasena />} />

        {/* Rutas accesibles por todos los roles */}
        <Route path="/inicio" element={<PrivateLayout><Inicio /></PrivateLayout>} />
        <Route path="/bitacora" element={<PrivateLayout><Bitacora /></PrivateLayout>} />
        <Route path="/hitos" element={<PrivateLayout><PlanificacionHitos /></PrivateLayout>} />
        <Route path="/ubicacion" element={<PrivateLayout><UbicacionObra /></PrivateLayout>} />
        <Route path="/especificaciones" element={<PrivateLayout><EspecificacionesTecnicas /></PrivateLayout>} />
        <Route path="/caja-chica" element={<PrivateLayout><CajaChica /></PrivateLayout>} />
        <Route path="/sso" element={<PrivateLayout><SSO /></PrivateLayout>} />
        <Route path="/evidencia" element={<PrivateLayout><Evidencia /></PrivateLayout>} />
        <Route path="/comunicacion" element={<PrivateLayout><Comunicacion /></PrivateLayout>} />
        <Route path="/recepcion-insumos" element={<PrivateLayout><RecepcionInsumos /></PrivateLayout>} />
        <Route path="/acta-recepcion" element={<PrivateLayout><ActaRecepcion /></PrivateLayout>} />
        <Route path="/certificado" element={<PrivateLayout><CertificadoTecnico /></PrivateLayout>} />
        <Route path="/solicitud-materiales" element={<PrivateLayout><SolicitudMateriales /></PrivateLayout>} />
        <Route path="/ingreso-guia" element={<PrivateLayout><IngresoGuia /></PrivateLayout>} />
        <Route path="/documentacion-laboral" element={<PrivateLayout><DocumentacionLaboral /></PrivateLayout>} />
        <Route path="/entrega-epp" element={<PrivateLayout><EntregaEpp /></PrivateLayout>} />
        <Route path="/historial-epp" element={<PrivateLayout><HistorialEntregasEpp /></PrivateLayout>} />
        <Route path="/herramientas" element={<PrivateLayout><Herramientas /></PrivateLayout>} />
        <Route path="/materiales-transito" element={<PrivateLayout><MaterialesTransito /></PrivateLayout>} />
        <Route path="/certificados-calidad" element={<PrivateLayout><CertificadosCalidad /></PrivateLayout>} />
        <Route path="/devolucion-obra" element={<PrivateLayout><DevolucionObra /></PrivateLayout>} />
        <Route path="/estado-proyecto" element={<PrivateLayout><EstadoProyecto /></PrivateLayout>} />

        {/* Rutas solo para administrador */}
        <Route path="/validar" element={<PrivateLayout><AdminRoute><ValidarEvidencias /></AdminRoute></PrivateLayout>} />
        <Route path="/orden-compra" element={<PrivateLayout><AdminRoute><OrdenCompra /></AdminRoute></PrivateLayout>} />
        <Route path="/vincular-factura" element={<PrivateLayout><AdminRoute><VincularFactura /></AdminRoute></PrivateLayout>} />
        <Route path="/control-costos" element={<PrivateLayout><AdminRoute><ControlCostos /></AdminRoute></PrivateLayout>} />
        <Route path="/subcontratistas" element={<PrivateLayout><AdminRoute><SubcontratistasProyecto /></AdminRoute></PrivateLayout>} />
        <Route path="/mano-obra" element={<PrivateLayout><AdminRoute><ManoObra /></AdminRoute></PrivateLayout>} />
        <Route path="/portafolio" element={<PrivateLayout><AdminRoute><Portafolio /></AdminRoute></PrivateLayout>} />
        <Route path="/documentos" element={<PrivateLayout><AdminRoute><BuscadorDocumentos /></AdminRoute></PrivateLayout>} />
        <Route path="/control-presupuesto" element={<PrivateLayout><AdminRoute><ControlPresupuesto /></AdminRoute></PrivateLayout>} />
        <Route path="/polizas" element={<PrivateLayout><AdminRoute><Polizas /></AdminRoute></PrivateLayout>} />
        <Route path="/configuracion" element={<PrivateLayout><AdminRoute><Configuracion /></AdminRoute></PrivateLayout>} />
        <Route path="/avisos-internos" element={<PrivateLayout><AdminRoute><AvisosInternos /></AdminRoute></PrivateLayout>} />
        <Route path="/catalogo" element={<PrivateLayout><AdminRoute><Catalogo /></AdminRoute></PrivateLayout>} />
        <Route path="/proveedores" element={<PrivateLayout><AdminRoute><CatalogoProveedores /></AdminRoute></PrivateLayout>} />
        <Route path="/aprobaciones" element={<PrivateLayout><AdminRoute><AprobacionesPendientes /></AdminRoute></PrivateLayout>} />
        <Route path="/trabajadores" element={<PrivateLayout><AdminRoute><Trabajadores /></AdminRoute></PrivateLayout>} />
        <Route path="/trabajadores/:rut/documentacion" element={<PrivateLayout><AdminRoute><DocumentacionTrabajador /></AdminRoute></PrivateLayout>} />
        <Route path="/liquidaciones" element={<PrivateLayout><AdminRoute><Liquidaciones /></AdminRoute></PrivateLayout>} />
        <Route path="/anexo-contrato" element={<PrivateLayout><AdminRoute><AnexoContrato /></AdminRoute></PrivateLayout>} />
        <Route path="/catalogo-equipos" element={<PrivateLayout><AdminRoute><CatalogoEquipos /></AdminRoute></PrivateLayout>} />
        <Route path="/garantias/cargar" element={<PrivateLayout><AdminRoute><CargarGarantia /></AdminRoute></PrivateLayout>} />
        <Route path="/garantias/descargar" element={<PrivateLayout><AdminRoute><DescargarGarantia /></AdminRoute></PrivateLayout>} />
        <Route path="/historial-oc" element={<PrivateLayout><AdminRoute><HistorialOrdenesCompra /></AdminRoute></PrivateLayout>} />
        <Route path="/usuarios" element={<PrivateLayout><AdminRoute><Usuarios /></AdminRoute></PrivateLayout>} />
        <Route path="/auditoria" element={<PrivateLayout><AdminRoute><ReporteAuditoria /></AdminRoute></PrivateLayout>} />

        <Route path="/" element={<Navigate to="/inicio" replace />} />
        <Route path="*" element={<Navigate to="/inicio" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
