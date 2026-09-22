import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './styles/index.css';
import Sidebar from './components/Sidebar';
import { CargaPagina } from './components/IndicadorCarga';
import EstadoConexion from './components/EstadoConexion';
import './styles/theme.css';
import Login from './pages/Login';
const Inicio = lazy(() => import('./pages/Inicio'));
const Bitacora = lazy(() => import('./pages/Bitacora'));
const PlanificacionHitos = lazy(() => import('./pages/PlanificacionHitos'));
const CajaChica = lazy(() => import('./pages/CajaChica'));
const SSO = lazy(() => import('./pages/SSO'));
const Evidencia = lazy(() => import('./pages/Evidencia'));
const ValidarEvidencias = lazy(() => import('./pages/ValidarEvidencias'));
const OrdenCompra = lazy(() => import('./pages/OrdenCompra'));
const VincularFactura = lazy(() => import('./pages/VincularFactura'));
const ControlCostos = lazy(() => import('./pages/ControlCostos'));
const Comunicacion = lazy(() => import('./pages/Comunicacion'));
const RecepcionInsumos = lazy(() => import('./pages/RecepcionInsumos'));
const SubcontratistasProyecto = lazy(() => import('./pages/SubcontratistasProyecto'));
const ManoObra = lazy(() => import('./pages/ManoObra'));
const Portafolio = lazy(() => import('./pages/Portafolio'));
const BuscadorDocumentos = lazy(() => import('./pages/BuscadorDocumentos'));
const ControlPresupuesto = lazy(() => import('./pages/ControlPresupuesto'));
const Polizas = lazy(() => import('./pages/Polizas'));
const CertificadoTecnico = lazy(() => import('./pages/CertificadoTecnico'));
const Configuracion = lazy(() => import('./pages/Configuracion'));
const Catalogo = lazy(() => import('./pages/Catalogo'));
const SolicitudMateriales = lazy(() => import('./pages/SolicitudMateriales'));
const AprobacionesPendientes = lazy(() => import('./pages/AprobacionesPendientes'));
const Trabajadores = lazy(() => import('./pages/Trabajadores'));
const IngresoGuia = lazy(() => import('./pages/IngresoGuia'));
const DocumentacionLaboral = lazy(() => import('./pages/DocumentacionLaboral'));
const Liquidaciones = lazy(() => import('./pages/Liquidaciones'));
const AnexoContrato = lazy(() => import('./pages/AnexoContrato'));
const EntregaEpp = lazy(() => import('./pages/EntregaEpp'));
const HistorialEntregasEpp = lazy(() => import('./pages/HistorialEntregasEpp'));
const CatalogoEquipos = lazy(() => import('./pages/CatalogoEquipos'));
const Herramientas = lazy(() => import('./pages/Herramientas'));
const MaterialesTransito = lazy(() => import('./pages/MaterialesTransito'));
const CertificadosCalidad = lazy(() => import('./pages/CertificadosCalidad'));
const DevolucionObra = lazy(() => import('./pages/DevolucionObra'));
const HistorialOrdenesCompra = lazy(() => import('./pages/HistorialOrdenesCompra'));
const Usuarios = lazy(() => import('./pages/Usuarios'));

function PrivateLayout({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return (
    <div className="app-layout">
      <Sidebar />
      <EstadoConexion />
      <main className="main-content">
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

        {/* Rutas accesibles por todos los roles */}
        <Route path="/inicio" element={<PrivateLayout><Inicio /></PrivateLayout>} />
        <Route path="/bitacora" element={<PrivateLayout><Bitacora /></PrivateLayout>} />
        <Route path="/hitos" element={<PrivateLayout><PlanificacionHitos /></PrivateLayout>} />
        <Route path="/caja-chica" element={<PrivateLayout><CajaChica /></PrivateLayout>} />
        <Route path="/sso" element={<PrivateLayout><SSO /></PrivateLayout>} />
        <Route path="/evidencia" element={<PrivateLayout><Evidencia /></PrivateLayout>} />
        <Route path="/comunicacion" element={<PrivateLayout><Comunicacion /></PrivateLayout>} />
        <Route path="/recepcion-insumos" element={<PrivateLayout><RecepcionInsumos /></PrivateLayout>} />
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
        <Route path="/catalogo" element={<PrivateLayout><AdminRoute><Catalogo /></AdminRoute></PrivateLayout>} />
        <Route path="/aprobaciones" element={<PrivateLayout><AdminRoute><AprobacionesPendientes /></AdminRoute></PrivateLayout>} />
        <Route path="/trabajadores" element={<PrivateLayout><AdminRoute><Trabajadores /></AdminRoute></PrivateLayout>} />
        <Route path="/liquidaciones" element={<PrivateLayout><AdminRoute><Liquidaciones /></AdminRoute></PrivateLayout>} />
        <Route path="/anexo-contrato" element={<PrivateLayout><AdminRoute><AnexoContrato /></AdminRoute></PrivateLayout>} />
        <Route path="/catalogo-equipos" element={<PrivateLayout><AdminRoute><CatalogoEquipos /></AdminRoute></PrivateLayout>} />
        <Route path="/historial-oc" element={<PrivateLayout><AdminRoute><HistorialOrdenesCompra /></AdminRoute></PrivateLayout>} />
        <Route path="/usuarios" element={<PrivateLayout><AdminRoute><Usuarios /></AdminRoute></PrivateLayout>} />

        <Route path="/" element={<Navigate to="/inicio" replace />} />
        <Route path="*" element={<Navigate to="/inicio" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
