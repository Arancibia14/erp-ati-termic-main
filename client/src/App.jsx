import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './styles/index.css';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Bitacora from './pages/Bitacora';
import CajaChica from './pages/CajaChica';
import SSO from './pages/SSO';
import Evidencia from './pages/Evidencia';
import ValidarEvidencias from './pages/ValidarEvidencias';
import OrdenCompra from './pages/OrdenCompra';
import VincularFactura from './pages/VincularFactura';
import ControlCostos from './pages/ControlCostos';
import Comunicacion from './pages/Comunicacion';
import RecepcionInsumos from './pages/RecepcionInsumos';
import SubcontratistasProyecto from './pages/SubcontratistasProyecto';
import ManoObra from './pages/ManoObra';
import Portafolio from './pages/Portafolio';
import BuscadorDocumentos from './pages/BuscadorDocumentos';
import ControlPresupuesto from './pages/ControlPresupuesto';
import Polizas from './pages/Polizas';
import CertificadoTecnico from './pages/CertificadoTecnico';
import Configuracion from './pages/Configuracion';

function PrivateLayout({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {children}
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
        <Route path="/bitacora" element={<PrivateLayout><Bitacora /></PrivateLayout>} />
        <Route path="/caja-chica" element={<PrivateLayout><CajaChica /></PrivateLayout>} />
        <Route path="/sso" element={<PrivateLayout><SSO /></PrivateLayout>} />
        <Route path="/evidencia" element={<PrivateLayout><Evidencia /></PrivateLayout>} />
        <Route path="/comunicacion" element={<PrivateLayout><Comunicacion /></PrivateLayout>} />
        <Route path="/recepcion-insumos" element={<PrivateLayout><RecepcionInsumos /></PrivateLayout>} />
        <Route path="/certificado" element={<PrivateLayout><CertificadoTecnico /></PrivateLayout>} />

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

        <Route path="/" element={<Navigate to="/bitacora" replace />} />
        <Route path="*" element={<Navigate to="/bitacora" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
