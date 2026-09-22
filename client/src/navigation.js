import {
  BookOpen, Flag, MapPin, FileStack, Camera, ScanSearch, MessagesSquare, TriangleAlert, PackageCheck,
  Award, Images, Handshake, ShieldCheck, IdCard, FolderCheck, ReceiptText,
  ArrowRightLeft, HardHat, History, ClipboardPlus, ClipboardCheck, ShoppingCart,
  FileClock, FileInput, Truck, BadgeCheck, Undo2, Warehouse, AirVent, Wrench,
  Wallet, Paperclip, ChartLine, Calculator, HandCoins, FolderSearch, UserCog,
  SlidersHorizontal, Building2, UsersRound, Boxes, Banknote, Settings
} from 'lucide-react';

export const MODULOS = [
  {
    id: 'terreno',
    label: 'Proyectos y Terreno',
    icon: Building2,
    items: [
      { to: '/bitacora', icon: BookOpen, label: 'Bitácora Diaria', short: 'Bitácora' },
      { to: '/hitos', icon: Flag, label: 'Planificación de Hitos', short: 'Hitos' },
      { to: '/ubicacion', icon: MapPin, label: 'Ubicación de la Obra', short: 'Ubicación' },
      { to: '/especificaciones', icon: FileStack, label: 'Especificaciones Técnicas', short: 'Especificaciones' },
      { to: '/evidencia', icon: Camera, label: 'Evidencias', short: 'Evidencias' },
      { to: '/validar', icon: ScanSearch, label: 'Revisiones Pendientes', short: 'Revisiones', admin: true },
      { to: '/comunicacion', icon: MessagesSquare, label: 'Comunicaciones', short: 'Comunicaciones' },
      { to: '/sso', icon: TriangleAlert, label: 'Incidentes SSO', short: 'SSO' },
      { to: '/recepcion-insumos', icon: PackageCheck, label: 'Recepción Insumos', short: 'Recepción' },
      { to: '/certificado', icon: Award, label: 'Certificado Técnico', short: 'Certificado' },
      { to: '/portafolio', icon: Images, label: 'Portafolio de Obras', short: 'Portafolio', admin: true },
      { to: '/subcontratistas', icon: Handshake, label: 'Subcontratistas', short: 'Subcontratistas', admin: true },
      { to: '/polizas', icon: ShieldCheck, label: 'Pólizas de Seguro', short: 'Pólizas', admin: true }
    ]
  },
  {
    id: 'personal',
    label: 'Personal',
    icon: UsersRound,
    items: [
      { to: '/trabajadores', icon: IdCard, label: 'Trabajadores', short: 'Trabajadores', admin: true },
      { to: '/documentacion-laboral', icon: FolderCheck, label: 'Documentación Laboral', short: 'Doc. Laboral' },
      { to: '/liquidaciones', icon: ReceiptText, label: 'Liquidaciones de Sueldo', short: 'Liquidaciones', admin: true },
      { to: '/anexo-contrato', icon: ArrowRightLeft, label: 'Anexo de Contrato', short: 'Anexo', admin: true },
      { to: '/entrega-epp', icon: HardHat, label: 'Entrega de EPP', short: 'EPP' },
      { to: '/historial-epp', icon: History, label: 'Historial Entregas EPP', short: 'Historial EPP' }
    ]
  },
  {
    id: 'materiales',
    label: 'Materiales y Compras',
    icon: Boxes,
    items: [
      { to: '/solicitud-materiales', icon: ClipboardPlus, label: 'Nueva Solicitud de Materiales', short: 'Solicitud' },
      { to: '/aprobaciones', icon: ClipboardCheck, label: 'Aprobaciones Pendientes', short: 'Aprobar', admin: true },
      { to: '/orden-compra', icon: ShoppingCart, label: 'Órdenes de Compra', short: 'Órdenes', admin: true },
      { to: '/historial-oc', icon: FileClock, label: 'Historial Órdenes de Compra', short: 'Historial OC', admin: true },
      { to: '/ingreso-guia', icon: FileInput, label: 'Ingreso por Guía', short: 'Ingreso Guía' },
      { to: '/materiales-transito', icon: Truck, label: 'Materiales en Tránsito', short: 'Tránsito' },
      { to: '/certificados-calidad', icon: BadgeCheck, label: 'Certificados de Calidad', short: 'Calidad' },
      { to: '/devolucion-obra', icon: Undo2, label: 'Devolución de Obra', short: 'Devolución' },
      { to: '/catalogo', icon: Warehouse, label: 'Catálogo Maestro', short: 'Catálogo', admin: true },
      { to: '/catalogo-equipos', icon: AirVent, label: 'Catálogo de Equipos', short: 'Equipos', admin: true },
      { to: '/herramientas', icon: Wrench, label: 'Herramientas', short: 'Herramientas' }
    ]
  },
  {
    id: 'finanzas',
    label: 'Finanzas',
    icon: Banknote,
    items: [
      { to: '/caja-chica', icon: Wallet, label: 'Caja Chica', short: 'Caja Chica' },
      { to: '/vincular-factura', icon: Paperclip, label: 'Vincular Facturas', short: 'Facturas', admin: true },
      { to: '/control-costos', icon: ChartLine, label: 'Control de Costos', short: 'Costos', admin: true },
      { to: '/control-presupuesto', icon: Calculator, label: 'Control Presupuesto', short: 'Presupuesto', admin: true },
      { to: '/mano-obra', icon: HandCoins, label: 'Mano de Obra', short: 'Mano de Obra', admin: true }
    ]
  },
  {
    id: 'sistema',
    label: 'Sistema',
    icon: Settings,
    items: [
      { to: '/documentos', icon: FolderSearch, label: 'Buscador Documentos', short: 'Documentos', admin: true },
      { to: '/usuarios', icon: UserCog, label: 'Usuarios del Sistema', short: 'Usuarios', admin: true },
      { to: '/configuracion', icon: SlidersHorizontal, label: 'Configuración', short: 'Configuración', admin: true }
    ]
  }
];

export const ATAJOS_ADMIN = [
  '/aprobaciones',
  '/validar',
  '/orden-compra',
  '/control-costos'
];

export const ATAJOS_SUPERVISOR = [
  '/bitacora',
  '/evidencia',
  '/entrega-epp',
  '/sso'
];

export const BARRA_ADMIN = ['/validar', '/aprobaciones', '/trabajadores'];

export const BARRA_SUPERVISOR = ['/bitacora', '/evidencia', '/entrega-epp'];

export function modulosVisibles(esAdmin) {
  return MODULOS
    .map(m => ({ ...m, items: m.items.filter(i => esAdmin || !i.admin) }))
    .filter(m => m.items.length > 0);
}

export function buscarItem(ruta) {
  for (const m of MODULOS) {
    const item = m.items.find(i => i.to === ruta);
    if (item) return item;
  }
  return null;
}

export function moduloDeRuta(ruta) {
  const m = MODULOS.find(mod => mod.items.some(i => i.to === ruta));
  return m ? m.id : null;
}

const CLAVE_RECIENTES = 'ati_recientes';

export function leerRecientes() {
  try {
    const lista = JSON.parse(localStorage.getItem(CLAVE_RECIENTES) || '[]');
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

export function registrarReciente(ruta) {
  if (!buscarItem(ruta)) return;
  try {
    const lista = [ruta, ...leerRecientes().filter(r => r !== ruta)].slice(0, 6);
    localStorage.setItem(CLAVE_RECIENTES, JSON.stringify(lista));
  } catch {
    return;
  }
}

export function normalizar(texto) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}
