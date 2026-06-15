import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  BookOpen, DollarSign, AlertTriangle, Camera, CheckSquare,
  ShoppingCart, FileText, BarChart2, LogOut, Menu, X,
  MessageSquare, Package, Award, Users, Briefcase, Image,
  Search, TrendingUp, Shield, Settings, ChevronDown, ChevronRight
} from 'lucide-react';
import logo from '../assets/logo.png';

const NAV_ITEMS = [
  { to: '/bitacora',          icon: BookOpen,       label: 'Bitácora Diaria' },
  { to: '/caja-chica',        icon: DollarSign,     label: 'Caja Chica' },
  { to: '/sso',               icon: AlertTriangle,  label: 'Incidentes SSO' },
  { to: '/evidencia',         icon: Camera,         label: 'Evidencias' },
  { to: '/comunicacion',      icon: MessageSquare,  label: 'Comunicaciones' },
  { to: '/recepcion-insumos', icon: Package,        label: 'Recepción Insumos' },
  { to: '/certificado',       icon: Award,          label: 'Certificado Técnico' }
];

const ADMIN_ITEMS = [
  { to: '/validar',             icon: CheckSquare,  label: 'Revisiones Pendientes' },
  { to: '/orden-compra',        icon: ShoppingCart, label: 'Órdenes de Compra' },
  { to: '/vincular-factura',    icon: FileText,     label: 'Vincular Facturas' },
  { to: '/control-costos',      icon: BarChart2,    label: 'Control de Costos' },
  { to: '/subcontratistas',     icon: Users,        label: 'Subcontratistas' },
  { to: '/mano-obra',           icon: Briefcase,    label: 'Mano de Obra' },
  { to: '/portafolio',          icon: Image,        label: 'Portafolio de Obras' },
  { to: '/documentos',          icon: Search,       label: 'Buscador Documentos' },
  { to: '/control-presupuesto', icon: TrendingUp,   label: 'Control Presupuesto' },
  { to: '/polizas',             icon: Shield,       label: 'Pólizas de Seguro' },
  { to: '/configuracion',       icon: Settings,     label: 'Configuración' }
];

function NavItem({ to, icon: Icon, label, onClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <NavLink
      to={to}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 14px 8px 16px',
        marginInline: 8,
        borderRadius: 7,
        color: isActive ? '#E8EFFE' : hovered ? '#C8D8F0' : '#8B9FBB',
        background: isActive
          ? 'linear-gradient(90deg, rgba(37,99,235,0.20) 0%, rgba(37,99,235,0.05) 100%)'
          : hovered ? 'rgba(30,46,74,0.7)' : 'transparent',
        borderLeft: isActive ? '2px solid #2563EB' : '2px solid transparent',
        textDecoration: 'none',
        fontSize: 13.5,
        fontWeight: isActive ? 600 : 400,
        transition: 'background 0.15s, color 0.15s',
        userSelect: 'none',
      })}
    >
      <Icon size={15} strokeWidth={1.8} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{label}</span>
    </NavLink>
  );
}

function Section({ label, open, onToggle, children }) {
  return (
    <div>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 20px 5px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#4B5E78',
        }}
      >
        <span style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>
          {label}
        </span>
        {open
          ? <ChevronDown size={12} strokeWidth={2.5} />
          : <ChevronRight size={12} strokeWidth={2.5} />
        }
      </button>
      {open && (
        <div style={{ paddingBottom: 4 }}>
          {children}
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [operOpen, setOperOpen] = useState(true);
  const [adminOpen, setAdminOpen] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/login');
  };

  const initials = (usuario.nombre || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const rolLabel = usuario.rol === 'admin' ? 'Administrador' : 'Supervisor';

  const sidebarContent = (
    <div style={{
      width: 252,
      height: '100vh',
      background: 'linear-gradient(180deg, #0C1322 0%, #080E1A 100%)',
      borderRight: '1px solid #1A2840',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }}>

      {/* LOGO */}
      <div style={{ padding: '18px 20px 16px', borderBottom: '1px solid #1A2840' }}>
        <div style={{
          background: '#ffffff',
          borderRadius: 8,
          padding: '8px 14px',
          display: 'inline-block',
          boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
        }}>
          <img src={logo} alt="ATI Termic" style={{ maxWidth: 148, height: 'auto', display: 'block' }} />
        </div>
      </div>

      {/* NAV */}
      <nav style={{ flex: 1, paddingTop: 8, paddingBottom: 8, overflowY: 'auto' }}>
        <Section label="Operaciones" open={operOpen} onToggle={() => setOperOpen(v => !v)}>
          {NAV_ITEMS.map(item => (
            <NavItem key={item.to} {...item} onClick={() => setMobileOpen(false)} />
          ))}
        </Section>

        {usuario.rol === 'admin' && (
          <>
            <div style={{ height: 1, background: '#1A2840', margin: '6px 16px' }} />
            <Section label="Administración" open={adminOpen} onToggle={() => setAdminOpen(v => !v)}>
              {ADMIN_ITEMS.map(item => (
                <NavItem key={item.to} {...item} onClick={() => setMobileOpen(false)} />
              ))}
            </Section>
          </>
        )}
      </nav>

      {/* USER */}
      <div style={{
        borderTop: '1px solid #1A2840',
        padding: '14px 16px',
        background: 'rgba(6,11,20,0.5)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8, flexShrink: 0,
            background: 'linear-gradient(135deg, #2563EB 0%, #5DB835 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: 0.5,
          }}>
            {initials}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#E8EFFE', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {usuario.nombre || 'Usuario'}
            </div>
            <div style={{ fontSize: 11, color: '#5DB835', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              {rolLabel}
            </div>
          </div>
        </div>

        <LogoutBtn onClick={handleLogout} />
      </div>
    </div>
  );

  return (
    <>
      {/* Sidebar — visible en desktop */}
      <div className="sidebar-desktop" style={{ display: 'flex' }}>
        {sidebarContent}
      </div>

      {/* Header top bar — solo en móvil */}
      <div className="mobile-header">
        <button
          onClick={() => setMobileOpen(true)}
          style={{
            background: 'none', border: '1px solid #1A2840', borderRadius: 7,
            padding: '6px 9px', cursor: 'pointer', color: '#E8EFFE',
            display: 'flex', alignItems: 'center', flexShrink: 0,
          }}
        >
          <Menu size={19} />
        </button>

        <div style={{
          background: '#ffffff', borderRadius: 6, padding: '5px 10px',
          display: 'flex', alignItems: 'center',
        }}>
          <img src={logo} alt="ATI Termic" style={{ height: 22, display: 'block' }} />
        </div>

        <div style={{
          width: 32, height: 32, borderRadius: 7, flexShrink: 0,
          background: 'linear-gradient(135deg, #2563EB 0%, #5DB835 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, color: '#fff', letterSpacing: 0.5,
        }}>
          {initials}
        </div>
      </div>

      {/* Drawer móvil */}
      {mobileOpen && (
        <>
          <div
            onClick={() => setMobileOpen(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
              zIndex: 200, backdropFilter: 'blur(3px)',
            }}
          />
          <div style={{ position: 'fixed', top: 0, left: 0, zIndex: 300, animation: 'slideRight 0.2s ease' }}>
            {sidebarContent}
            <button
              onClick={() => setMobileOpen(false)}
              style={{
                position: 'absolute', top: 14, right: -42,
                background: '#0C1322', border: '1px solid #1A2840',
                borderRadius: 7, padding: '6px 8px', cursor: 'pointer', color: '#E8EFFE',
                display: 'flex', alignItems: 'center',
              }}
            >
              <X size={17} />
            </button>
          </div>
        </>
      )}

      <style>{`
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
        }
        @keyframes slideRight {
          from { transform: translateX(-100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}

function LogoutBtn({ onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 12px',
        background: hovered ? 'rgba(239,68,68,0.08)' : 'transparent',
        border: hovered ? '1px solid rgba(239,68,68,0.3)' : '1px solid #1A2840',
        borderRadius: 7,
        color: hovered ? '#EF4444' : '#7D8FA8',
        fontSize: 13, fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.15s',
        justifyContent: 'center',
      }}
    >
      <LogOut size={14} />
      Cerrar sesión
    </button>
  );
}
