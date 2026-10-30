const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const Trabajador = require('../models/Trabajador');
const Especialidad = require('../models/Especialidad');
const DocumentoLegal = require('../models/DocumentoLegal');
const EntregaEpp = require('../models/EntregaEpp');
const Material = require('../models/Material');
const Accidente = require('../models/Accidente');
const IncidenteSSO = require('../models/IncidenteSSO');
const AsignacionHerramienta = require('../models/AsignacionHerramienta');
const Herramienta = require('../models/Herramienta');
const ContratoLaboral = require('../models/ContratoLaboral');
const LiquidacionSueldo = require('../models/LiquidacionSueldo');
const LogAuditoria = require('../models/LogAuditoria');
const { fechaHoy } = require('../utils/fecha');

// CU 67 - Visualizar documentación del trabajador
// Solo lee lo que el sistema ya registra por trabajador_rut y lo agrupa en
// cuatro áreas. Los F30 y F30 1 son de la empresa y no entran aquí.

const TIPOS_EXAMEN = {
  ExamenAlturaFisica: 'Altura Física',
  ExamenAlturaGeografica: 'Altura Geográfica'
};

// Excepción 2: el registro existe pero su archivo ya no está en uploads
function archivoDisponible(urlRelativa) {
  if (!urlRelativa) return false;
  return fs.existsSync(path.join(__dirname, '..', urlRelativa));
}

function calcularEstadoVencimiento(fechaVencimiento, hoy) {
  if (!fechaVencimiento) return 'Sin vencimiento';
  return fechaVencimiento < hoy ? 'Vencido' : 'Vigente';
}

async function obtenerSalud(rut, hoy) {
  const examenes = await DocumentoLegal.findAll({
    where: { trabajador_rut: rut, documento_legal_tipo: { [Op.in]: Object.keys(TIPOS_EXAMEN) } },
    order: [['documento_legal_fecha_emision', 'DESC']]
  });

  return {
    examenes: examenes.map(e => ({
      id: e.documento_legal_id,
      tipo: TIPOS_EXAMEN[e.documento_legal_tipo],
      fecha_emision: e.documento_legal_fecha_emision,
      fecha_vencimiento: e.documento_legal_fecha_vencimiento,
      estado: calcularEstadoVencimiento(e.documento_legal_fecha_vencimiento, hoy),
      url: e.documento_legal_url_pdf,
      archivo_disponible: archivoDisponible(e.documento_legal_url_pdf)
    }))
  };
}

async function obtenerSeguridad(rut) {
  const [entregas, accidentes] = await Promise.all([
    EntregaEpp.findAll({
      where: { trabajador_rut: rut },
      include: [{ model: Material, attributes: ['material_nombre'] }],
      order: [['entrega_epp_fecha', 'DESC']]
    }),
    Accidente.findAll({ where: { trabajador_rut: rut } })
  ]);

  const incidentes = accidentes.length
    ? await IncidenteSSO.findAll({ where: { incidente_sso_id: accidentes.map(a => a.incidente_sso_id) } })
    : [];
  const incidentePorId = new Map(incidentes.map(i => [i.incidente_sso_id, i]));

  return {
    entregas_epp: entregas.map(e => ({
      id: e.entrega_epp_id,
      epp: e.Material?.material_nombre || 'EPP',
      cantidad: e.entrega_epp_cantidad,
      fecha: e.entrega_epp_fecha,
      firmado: !!e.entrega_epp_firma,
      url: e.entrega_epp_url_comprobante,
      archivo_disponible: archivoDisponible(e.entrega_epp_url_comprobante)
    })),
    accidentes: accidentes
      .map(a => {
        const inc = incidentePorId.get(a.incidente_sso_id);
        return {
          id: a.accidente_id,
          fecha: inc?.incidente_sso_fecha_hora || null,
          descripcion: inc?.incidente_sso_descripcion || '',
          gravedad: inc?.incidente_sso_gravedad || '',
          dias_perdidos: a.accidente_dias_perdidos,
          proyecto: a.proyecto_codigo_correlativo
        };
      })
      .sort((x, y) => new Date(y.fecha) - new Date(x.fecha))
  };
}

async function obtenerOperaciones(trabajador) {
  const asignaciones = await AsignacionHerramienta.findAll({
    where: { trabajador_rut: trabajador.trabajador_rut },
    order: [['asignacion_herramienta_fecha_entrega', 'DESC']]
  });

  const herramientas = asignaciones.length
    ? await Herramienta.findAll({ where: { herramienta_id: asignaciones.map(a => a.herramienta_id) } })
    : [];
  const herramientaPorId = new Map(herramientas.map(h => [h.herramienta_id, h]));

  return {
    especialidad: trabajador.Especialidad?.especialidad_nombre || null,
    herramientas: asignaciones.map(a => {
      const h = herramientaPorId.get(a.herramienta_id);
      return {
        id: a.asignacion_herramienta_id,
        codigo: h?.herramienta_codigo || '',
        nombre: h?.herramienta_nombre || '',
        fecha_entrega: a.asignacion_herramienta_fecha_entrega,
        fecha_devolucion: a.asignacion_herramienta_fecha_devolucion,
        estado_entrega: a.asignacion_herramienta_estado_entrega,
        estado_devolucion: a.asignacion_herramienta_estado_devolucion
      };
    })
  };
}

async function obtenerLaboral(rut, hoy) {
  const [contratos, documentos, liquidaciones] = await Promise.all([
    ContratoLaboral.findAll({
      where: { trabajador_rut: rut },
      order: [['contrato_laboral_fecha_inicio', 'DESC']]
    }),
    DocumentoLegal.findAll({
      where: { trabajador_rut: rut, documento_legal_tipo: { [Op.in]: ['AnexoTraslado', 'poliza'] } },
      order: [['documento_legal_fecha_emision', 'DESC']]
    }),
    LiquidacionSueldo.findAll({
      where: { trabajador_rut: rut },
      order: [['liquidacion_sueldo_periodo', 'DESC']]
    })
  ]);

  const documento = d => ({
    id: d.documento_legal_id,
    fecha_emision: d.documento_legal_fecha_emision,
    fecha_vencimiento: d.documento_legal_fecha_vencimiento,
    proyecto: d.proyecto_codigo_correlativo,
    url: d.documento_legal_url_pdf,
    archivo_disponible: archivoDisponible(d.documento_legal_url_pdf)
  });

  return {
    contratos: contratos.map(c => ({
      id: c.contrato_laboral_id_contrato,
      sueldo_base: c.contrato_laboral_sueldo_base,
      fecha_inicio: c.contrato_laboral_fecha_inicio,
      fecha_termino: c.contrato_laboral_fecha_termino,
      proyecto: c.proyecto_codigo_correlativo,
      estado: c.contrato_laboral_fecha_termino && c.contrato_laboral_fecha_termino < hoy ? 'Terminado' : 'Vigente'
    })),
    anexos: documentos
      .filter(d => d.documento_legal_tipo === 'AnexoTraslado')
      .map(d => ({ ...documento(d), estado: d.documento_legal_estado })),
    liquidaciones: liquidaciones.map(l => ({
      id: l.liquidacion_sueldo_id,
      periodo: l.liquidacion_sueldo_periodo,
      fecha_carga: l.liquidacion_sueldo_fecha_carga,
      url: l.liquidacion_sueldo_url_pdf,
      archivo_disponible: archivoDisponible(l.liquidacion_sueldo_url_pdf)
    })),
    polizas: documentos
      .filter(d => d.documento_legal_tipo === 'poliza')
      .map(d => ({
        ...documento(d),
        // Una póliza anulada conserva su estado; solo las vigentes pueden vencer
        estado: d.documento_legal_estado === 'Vigente'
          ? calcularEstadoVencimiento(d.documento_legal_fecha_vencimiento, hoy)
          : d.documento_legal_estado
      }))
  };
}

function resumirAreas(areas) {
  const vencidos = lista => lista.filter(d => d.estado === 'Vencido').length;
  return {
    salud: {
      total: areas.salud.examenes.length,
      vencidos: vencidos(areas.salud.examenes)
    },
    seguridad: {
      total: areas.seguridad.entregas_epp.length + areas.seguridad.accidentes.length,
      vencidos: 0
    },
    operaciones: {
      total: areas.operaciones.herramientas.length,
      vencidos: 0
    },
    laboral: {
      total: areas.laboral.contratos.length + areas.laboral.anexos.length
        + areas.laboral.liquidaciones.length + areas.laboral.polizas.length,
      vencidos: vencidos(areas.laboral.polizas)
    }
  };
}

async function getDocumentacionTrabajador(req, res) {
  try {
    const { rut } = req.params;
    const trabajador = await Trabajador.findByPk(rut, {
      include: [{ model: Especialidad, attributes: ['especialidad_nombre'] }]
    });

    // Excepción 4: trabajador inexistente
    if (!trabajador) {
      return res.status(404).json({ success: false, error: 'El trabajador no existe en el sistema.' });
    }

    const hoy = fechaHoy();
    const [salud, seguridad, operaciones, laboral] = await Promise.all([
      obtenerSalud(rut, hoy),
      obtenerSeguridad(rut),
      obtenerOperaciones(trabajador),
      obtenerLaboral(rut, hoy)
    ]);
    const areas = { salud, seguridad, operaciones, laboral };

    try {
      await LogAuditoria.create({
        log_auditoria_fecha_hora: new Date(),
        log_auditoria_accion: `Consulta de documentación del trabajador ${rut}`,
        log_auditoria_modulo: 'DOCUMENTACION_TRABAJADOR',
        usuario_rut: req.user.rut
      });
    } catch (_) { /* log no crítico */ }

    return res.json({
      success: true,
      data: {
        trabajador: {
          rut: trabajador.trabajador_rut,
          nombres: trabajador.trabajador_nombres,
          apellidos: trabajador.trabajador_apellidos,
          especialidad: trabajador.Especialidad?.especialidad_nombre || null,
          activo: trabajador.trabajador_activo
        },
        areas,
        resumen: resumirAreas(areas)
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener la documentación del trabajador' });
  }
}

module.exports = { getDocumentacionTrabajador };
