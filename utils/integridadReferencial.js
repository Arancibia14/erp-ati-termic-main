// CU 49 - Validando integridad referencial en eliminaciones.
// La base solo tiene dos claves foráneas declaradas (contrato → trabajador y
// orden de compra → proveedor), así que el sistema rastrea aquí, tabla por
// tabla, dónde se usa cada registro maestro antes de permitir su borrado.
const { Op } = require('sequelize');
const Trabajador = require('../models/Trabajador');
const Material = require('../models/Material');
const Proveedor = require('../models/Proveedor');
const ContratoLaboral = require('../models/ContratoLaboral');
const LiquidacionSueldo = require('../models/LiquidacionSueldo');
const Accidente = require('../models/Accidente');
const EntregaEpp = require('../models/EntregaEpp');
const AsignacionHerramienta = require('../models/AsignacionHerramienta');
const DocumentoLegal = require('../models/DocumentoLegal');
const Herramienta = require('../models/Herramienta');
const SolicitudMaterial = require('../models/SolicitudMaterial');
const DetalleOrdenCompra = require('../models/DetalleOrdenCompra');
const GuiaDespacho = require('../models/GuiaDespacho');
const DevolucionObra = require('../models/DevolucionObra');
const CertificadoCalidad = require('../models/CertificadoCalidad');
const OrdenCompra = require('../models/OrdenCompra');
const Proyecto = require('../models/Proyecto');
const { normalizarRut } = require('./rut');

// Cada vínculo indica la tabla, la columna que apunta al registro maestro y
// cómo nombrarlo en singular y plural dentro del mensaje de bloqueo.
const MAESTROS = {
  trabajador: {
    modelo: Trabajador,
    modulo: 'TRABAJADOR',
    articulo: 'el trabajador',
    nombre: t => [t.trabajador_nombres, t.trabajador_apellidos].filter(Boolean).join(' '),
    vinculos: [
      { modelo: ContratoLaboral, campo: 'trabajador_rut', uno: 'contrato laboral', varios: 'contratos laborales' },
      { modelo: LiquidacionSueldo, campo: 'trabajador_rut', uno: 'liquidación de sueldo', varios: 'liquidaciones de sueldo' },
      { modelo: Accidente, campo: 'trabajador_rut', uno: 'accidente registrado', varios: 'accidentes registrados' },
      { modelo: EntregaEpp, campo: 'trabajador_rut', uno: 'entrega de EPP', varios: 'entregas de EPP' },
      { modelo: AsignacionHerramienta, campo: 'trabajador_rut', uno: 'asignación de herramienta', varios: 'asignaciones de herramientas' },
      { modelo: DocumentoLegal, campo: 'trabajador_rut', uno: 'documento legal', varios: 'documentos legales' },
      { modelo: Herramienta, campo: 'herramienta_tecnico_rut', uno: 'herramienta en su poder', varios: 'herramientas en su poder' }
    ]
  },
  material: {
    modelo: Material,
    modulo: 'MATERIAL',
    articulo: 'el material',
    nombre: m => m.material_nombre,
    vinculos: [
      { modelo: SolicitudMaterial, campo: 'material_id', uno: 'solicitud de material', varios: 'solicitudes de material' },
      { modelo: DetalleOrdenCompra, campo: 'material_id', uno: 'detalle de orden de compra', varios: 'detalles de órdenes de compra' },
      { modelo: GuiaDespacho, campo: 'material_id', uno: 'guía de despacho', varios: 'guías de despacho' },
      { modelo: DevolucionObra, campo: 'material_id', uno: 'devolución de obra', varios: 'devoluciones de obra' },
      { modelo: CertificadoCalidad, campo: 'material_id', uno: 'certificado de calidad', varios: 'certificados de calidad' },
      { modelo: EntregaEpp, campo: 'material_id', uno: 'entrega de EPP', varios: 'entregas de EPP' }
    ]
  },
  proveedor: {
    modelo: Proveedor,
    modulo: 'PROVEEDOR',
    articulo: 'el proveedor',
    nombre: p => p.proveedor_razon_social,
    vinculos: [
      { modelo: OrdenCompra, campo: 'proveedor_rut', uno: 'orden de compra', varios: 'órdenes de compra' },
      { modelo: GuiaDespacho, campo: 'proveedor_rut', uno: 'guía de despacho', varios: 'guías de despacho' },
      { modelo: Material, campo: 'material_proveedor_rut', uno: 'material del catálogo', varios: 'materiales del catálogo' },
      { modelo: Proyecto, campo: 'proveedor_rut', uno: 'proyecto', varios: 'proyectos' }
    ]
  }
};

// Los trabajadores antiguos pueden tener el RUT guardado con puntos: se busca
// primero tal cual y después normalizado, igual que en el módulo Trabajadores.
async function buscarMaestro(tipo, id, opciones = {}) {
  const { modelo } = MAESTROS[tipo];
  const exacto = await modelo.findByPk(id, opciones);
  if (exacto || tipo === 'material') return exacto;
  const normalizado = normalizarRut(id);
  return normalizado && normalizado !== id ? modelo.findByPk(normalizado, opciones) : null;
}

// CU 49 paso 3 - Rastrea el ID en todas las tablas relacionadas.
async function rastrearDependencias(tipo, registro, transaction) {
  const { modelo, vinculos } = MAESTROS[tipo];
  const id = registro.get(modelo.primaryKeyAttribute);
  const encontradas = [];
  for (const v of vinculos) {
    const cantidad = await v.modelo.count({ where: { [v.campo]: { [Op.eq]: id } }, transaction });
    if (cantidad > 0) encontradas.push({ cantidad, texto: `${cantidad} ${cantidad === 1 ? v.uno : v.varios}` });
  }
  return encontradas;
}

// CU 49 Excepción 1 - Mensaje que informa la restricción
function mensajeBloqueo(tipo, registro, dependencias) {
  const { articulo, nombre } = MAESTROS[tipo];
  const textos = dependencias.map(d => d.texto);
  const lista = textos.length > 1 ? `${textos.slice(0, -1).join(', ')} y ${textos[textos.length - 1]}` : textos[0];
  return `No se puede eliminar ${articulo} "${nombre(registro)}" porque tiene registros asociados: ${lista}. Puedes desactivarlo en su lugar.`;
}

module.exports = { MAESTROS, buscarMaestro, rastrearDependencias, mensajeBloqueo };
