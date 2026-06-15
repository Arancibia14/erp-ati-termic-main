require('dotenv').config();
const bcrypt = require('bcryptjs');
const sequelize = require('./config/database');

const Usuario           = require('./models/Usuario');
const Administrador     = require('./models/Administrador');
const SupervisorTerreno = require('./models/SupervisorTerreno');
const EstadoProyecto    = require('./models/EstadoProyecto');
const Proyecto          = require('./models/Proyecto');
const Especialidad      = require('./models/Especialidad');
const Trabajador        = require('./models/Trabajador');
const HitoTecnico       = require('./models/HitoTecnico');
const EvidenciaFotografica = require('./models/EvidenciaFotografica');
const Proveedor         = require('./models/Proveedor');
const SolicitudMaterial = require('./models/SolicitudMaterial');
const OrdenCompra       = require('./models/OrdenCompra');
const DetalleOrdenCompra = require('./models/DetalleOrdenCompra');
const GuiaDespacho      = require('./models/GuiaDespacho');
const Factura           = require('./models/Factura');
const BitacoraDiaria    = require('./models/BitacoraDiaria');
const EgresoCajaChica   = require('./models/EgresoCajaChica');
const IncidenteSSO      = require('./models/IncidenteSSO');
const Accidente         = require('./models/Accidente');
const LogAuditoria      = require('./models/LogAuditoria');
const ParametroSistema  = require('./models/ParametroSistema');
const ContratoLaboral   = require('./models/ContratoLaboral');
const BitacoraComunicacion = require('./models/BitacoraComunicacion');
const ControlCambioPpto = require('./models/ControlCambioPpto');
const DocumentoLegal    = require('./models/DocumentoLegal');
const EquipoHVAC        = require('./models/EquipoHVAC');

// Associations (mismas que index.js)
EstadoProyecto.hasMany(Proyecto, { foreignKey: 'estado_proyecto_id' });
Proyecto.belongsTo(EstadoProyecto, { foreignKey: 'estado_proyecto_id' });
HitoTecnico.hasMany(EvidenciaFotografica, { foreignKey: 'hito_tecnico_id' });
EvidenciaFotografica.belongsTo(HitoTecnico, { foreignKey: 'hito_tecnico_id' });
Proyecto.hasMany(SolicitudMaterial, { foreignKey: 'proyecto_codigo_correlativo' });
SolicitudMaterial.belongsTo(Proyecto, { foreignKey: 'proyecto_codigo_correlativo' });
SolicitudMaterial.hasOne(OrdenCompra, { foreignKey: 'solicitud_material_id' });
OrdenCompra.belongsTo(SolicitudMaterial, { foreignKey: 'solicitud_material_id' });
Proveedor.hasMany(OrdenCompra, { foreignKey: 'proveedor_rut' });
OrdenCompra.belongsTo(Proveedor, { foreignKey: 'proveedor_rut' });
OrdenCompra.hasMany(DetalleOrdenCompra, { foreignKey: 'orden_compra_id' });
DetalleOrdenCompra.belongsTo(OrdenCompra, { foreignKey: 'orden_compra_id' });
OrdenCompra.hasMany(GuiaDespacho, { foreignKey: 'orden_compra_id' });
GuiaDespacho.belongsTo(OrdenCompra, { foreignKey: 'orden_compra_id' });
OrdenCompra.hasMany(Factura, { foreignKey: 'orden_compra_id' });
Factura.belongsTo(OrdenCompra, { foreignKey: 'orden_compra_id' });
Trabajador.hasMany(ContratoLaboral, { foreignKey: 'trabajador_rut' });
ContratoLaboral.belongsTo(Trabajador, { foreignKey: 'trabajador_rut' });
Proyecto.hasMany(BitacoraComunicacion, { foreignKey: 'proyecto_codigo_correlativo' });
BitacoraComunicacion.belongsTo(Proyecto, { foreignKey: 'proyecto_codigo_correlativo' });
Proyecto.hasMany(ControlCambioPpto, { foreignKey: 'proyecto_codigo_correlativo' });
ControlCambioPpto.belongsTo(Proyecto, { foreignKey: 'proyecto_codigo_correlativo' });
Proyecto.hasMany(DocumentoLegal, { foreignKey: 'proyecto_codigo_correlativo' });
DocumentoLegal.belongsTo(Proyecto, { foreignKey: 'proyecto_codigo_correlativo' });
Proyecto.hasMany(EquipoHVAC, { foreignKey: 'proyecto_codigo_correlativo' });
EquipoHVAC.belongsTo(Proyecto, { foreignKey: 'proyecto_codigo_correlativo' });

async function reset() {
  try {
    await sequelize.authenticate();
    console.log('Conectado a MySQL.');

    console.log('Recreando tablas desde modelos...');
    await sequelize.sync({ force: true });
    console.log('Tablas recreadas.\n');

    // ── ESTADOS ──────────────────────────────────────────────────────────────
    const [enEjecucion] = await EstadoProyecto.findOrCreate({ where: { estado_proyecto_nombre: 'En Ejecución' }, defaults: { estado_proyecto_nombre: 'En Ejecución' } });
    await EstadoProyecto.findOrCreate({ where: { estado_proyecto_nombre: 'Planificación' }, defaults: { estado_proyecto_nombre: 'Planificación' } });
    await EstadoProyecto.findOrCreate({ where: { estado_proyecto_nombre: 'Finalizado' },    defaults: { estado_proyecto_nombre: 'Finalizado' } });
    console.log('✓ Estados de proyecto');

    // ── PARÁMETROS DEL SISTEMA ────────────────────────────────────────────────
    await ParametroSistema.findOrCreate({
      where: { parametro_sistema_clave: 'umbral_desviacion' },
      defaults: { parametro_sistema_clave: 'umbral_desviacion', parametro_sistema_valor: '10', parametro_sistema_descripcion: 'Porcentaje de desviación presupuestaria que activa alerta (default: 10%)' }
    });
    await ParametroSistema.findOrCreate({
      where: { parametro_sistema_clave: 'radio_recepcion_metros' },
      defaults: { parametro_sistema_clave: 'radio_recepcion_metros', parametro_sistema_valor: '500', parametro_sistema_descripcion: 'Radio máximo en metros para confirmar recepción de insumos' }
    });
    console.log('✓ Parámetros del sistema');

    // ── USUARIOS ──────────────────────────────────────────────────────────────
    const passAdmin = await bcrypt.hash('Admin1234!', 10);
    const passSuper = await bcrypt.hash('Super1234!', 10);
    await Usuario.findOrCreate({
      where: { usuario_rut: '11111111-1' },
      defaults: { usuario_nombre: 'Administrador Sistema', usuario_correo_institucional: 'admin@atitermic.cl', usuario_password_hash: passAdmin }
    });
    await Usuario.findOrCreate({
      where: { usuario_rut: '22222222-2' },
      defaults: { usuario_nombre: 'Supervisor Terreno', usuario_correo_institucional: 'supervisor@atitermic.cl', usuario_password_hash: passSuper }
    });
    console.log('✓ Usuarios');

    await Administrador.findOrCreate({
      where: { usuario_rut: '11111111-1' },
      defaults: { administrador_nivel_acceso: 'total', administrador_fecha_asignacion: new Date(), usuario_rut: '11111111-1' }
    });
    await SupervisorTerreno.findOrCreate({
      where: { usuario_rut: '22222222-2' },
      defaults: { supervisor_terreno_registro_certificacion: 'CERT-2024-001', supervisor_terreno_telefono_emergencia: '+56912345678', usuario_rut: '22222222-2' }
    });
    console.log('✓ Roles');

    // ── PROYECTOS ─────────────────────────────────────────────────────────────
    await Proyecto.findOrCreate({
      where: { proyecto_codigo_correlativo: 'PROY-2024-001' },
      defaults: { proyecto_nombre_obra: 'Climatización Centro Comercial Norte', proyecto_porcentaje_avance: 35.00, proyecto_presupuesto_asignado: 15000000.00, proyecto_correo_contacto: 'contacto@centronorte.cl', estado_proyecto_id: enEjecucion.estado_proyecto_id }
    });
    await Proyecto.findOrCreate({
      where: { proyecto_codigo_correlativo: 'PROY-2024-002' },
      defaults: { proyecto_nombre_obra: 'Sistema HVAC Edificio Corporativo Sur', proyecto_porcentaje_avance: 60.00, proyecto_presupuesto_asignado: 8500000.00, proyecto_correo_contacto: 'contacto@edificiosur.cl', estado_proyecto_id: enEjecucion.estado_proyecto_id }
    });
    console.log('✓ Proyectos');

    // ── ESPECIALIDADES ────────────────────────────────────────────────────────
    const [esp1] = await Especialidad.findOrCreate({ where: { especialidad_nombre: 'Técnico HVAC' },          defaults: { especialidad_nombre: 'Técnico HVAC' } });
    const [esp2] = await Especialidad.findOrCreate({ where: { especialidad_nombre: 'Electricista Industrial' }, defaults: { especialidad_nombre: 'Electricista Industrial' } });
    const [esp3] = await Especialidad.findOrCreate({ where: { especialidad_nombre: 'Instalador de Ductos' },   defaults: { especialidad_nombre: 'Instalador de Ductos' } });
    await Especialidad.findOrCreate({ where: { especialidad_nombre: 'Gasfiter' },  defaults: { especialidad_nombre: 'Gasfiter' } });
    await Especialidad.findOrCreate({ where: { especialidad_nombre: 'Supervisor' }, defaults: { especialidad_nombre: 'Supervisor' } });
    await Especialidad.findOrCreate({ where: { especialidad_nombre: 'Bodeguero' }, defaults: { especialidad_nombre: 'Bodeguero' } });
    console.log('✓ Especialidades');

    // ── TRABAJADORES ──────────────────────────────────────────────────────────
    await Trabajador.findOrCreate({ where: { trabajador_rut: '33333333-3' }, defaults: { trabajador_nombres: 'Carlos Mendoza Ríos',    trabajador_correo: 'cmendoza@atitermic.cl',   trabajador_telefono: '+56911111111', especialidad_id: esp1.especialidad_id, proyecto_codigo_correlativo: 'PROY-2024-001' } });
    await Trabajador.findOrCreate({ where: { trabajador_rut: '44444444-4' }, defaults: { trabajador_nombres: 'María González López',   trabajador_correo: 'mgonzalez@atitermic.cl',  trabajador_telefono: '+56922222222', especialidad_id: esp2.especialidad_id, proyecto_codigo_correlativo: 'PROY-2024-001' } });
    await Trabajador.findOrCreate({ where: { trabajador_rut: '55555555-5' }, defaults: { trabajador_nombres: 'Pedro Fuentes Silva',    trabajador_correo: 'pfuentes@atitermic.cl',   trabajador_telefono: '+56933333333', especialidad_id: esp3.especialidad_id, proyecto_codigo_correlativo: 'PROY-2024-002' } });
    console.log('✓ Trabajadores');

    // ── CONTRATOS LABORALES ───────────────────────────────────────────────────
    await ContratoLaboral.findOrCreate({
      where: { trabajador_rut: '33333333-3', contrato_laboral_fecha_inicio: '2024-01-15' },
      defaults: { trabajador_rut: '33333333-3', contrato_laboral_sueldo_base: 850000, contrato_laboral_leyes_sociales: 180000, contrato_laboral_fecha_inicio: '2024-01-15', proyecto_codigo_correlativo: 'PROY-2024-001' }
    });
    await ContratoLaboral.findOrCreate({
      where: { trabajador_rut: '44444444-4', contrato_laboral_fecha_inicio: '2024-02-01' },
      defaults: { trabajador_rut: '44444444-4', contrato_laboral_sueldo_base: 920000, contrato_laboral_leyes_sociales: 195000, contrato_laboral_fecha_inicio: '2024-02-01', proyecto_codigo_correlativo: 'PROY-2024-001' }
    });
    await ContratoLaboral.findOrCreate({
      where: { trabajador_rut: '55555555-5', contrato_laboral_fecha_inicio: '2024-03-01' },
      defaults: { trabajador_rut: '55555555-5', contrato_laboral_sueldo_base: 780000, contrato_laboral_leyes_sociales: 165000, contrato_laboral_fecha_inicio: '2024-03-01', proyecto_codigo_correlativo: 'PROY-2024-002' }
    });
    console.log('✓ Contratos laborales');

    // ── HITOS TÉCNICOS ────────────────────────────────────────────────────────
    await HitoTecnico.findOrCreate({ where: { hito_tecnico_nombre_hito: 'Instalación de ductos principal',  proyecto_codigo_correlativo: 'PROY-2024-001' }, defaults: { hito_tecnico_nombre_hito: 'Instalación de ductos principal',  hito_tecnico_avance_fisico: 40.00, proyecto_codigo_correlativo: 'PROY-2024-001' } });
    await HitoTecnico.findOrCreate({ where: { hito_tecnico_nombre_hito: 'Montaje de equipos HVAC',          proyecto_codigo_correlativo: 'PROY-2024-001' }, defaults: { hito_tecnico_nombre_hito: 'Montaje de equipos HVAC',          hito_tecnico_avance_fisico: 20.00, proyecto_codigo_correlativo: 'PROY-2024-001' } });
    await HitoTecnico.findOrCreate({ where: { hito_tecnico_nombre_hito: 'Conexión unidades exteriores',     proyecto_codigo_correlativo: 'PROY-2024-002' }, defaults: { hito_tecnico_nombre_hito: 'Conexión unidades exteriores',     hito_tecnico_avance_fisico: 60.00, proyecto_codigo_correlativo: 'PROY-2024-002' } });
    await HitoTecnico.findOrCreate({ where: { hito_tecnico_nombre_hito: 'Pruebas de presión y hermeticidad', proyecto_codigo_correlativo: 'PROY-2024-002' }, defaults: { hito_tecnico_nombre_hito: 'Pruebas de presión y hermeticidad', hito_tecnico_avance_fisico: 0.00,  proyecto_codigo_correlativo: 'PROY-2024-002' } });
    console.log('✓ Hitos técnicos');

    // ── PROVEEDORES ───────────────────────────────────────────────────────────
    await Proveedor.findOrCreate({ where: { proveedor_rut: '76543210-K' }, defaults: { proveedor_razon_social: 'Distribuidora Clima Norte SpA',    proveedor_correo: 'ventas@climanorte.cl',      proveedor_telefono: '+56221234567' } });
    await Proveedor.findOrCreate({ where: { proveedor_rut: '87654321-1' }, defaults: { proveedor_razon_social: 'Insumos HVAC Chile Ltda.',          proveedor_correo: 'contacto@insumoschile.cl',  proveedor_telefono: '+56229876543' } });
    await Proveedor.findOrCreate({ where: { proveedor_rut: '98765432-2' }, defaults: { proveedor_razon_social: 'Materiales Técnicos del Sur S.A.',  proveedor_correo: 'pedidos@mattecnicos.cl',    proveedor_telefono: '+56412222333' } });
    console.log('✓ Proveedores');

    // ── SOLICITUDES DE MATERIAL ───────────────────────────────────────────────
    const [sol1] = await SolicitudMaterial.findOrCreate({
      where: { solicitud_material_descripcion: 'Filtros de aire tipo G4 - 50 unidades', proyecto_codigo_correlativo: 'PROY-2024-001' },
      defaults: { solicitud_material_descripcion: 'Filtros de aire tipo G4 - 50 unidades', solicitud_material_cantidad: 50, solicitud_material_estado: 'pendiente', solicitud_material_fecha: '2024-06-01', proyecto_codigo_correlativo: 'PROY-2024-001', usuario_rut: '11111111-1' }
    });
    const [sol2] = await SolicitudMaterial.findOrCreate({
      where: { solicitud_material_descripcion: 'Cañería cobre 3/4 - 100 metros', proyecto_codigo_correlativo: 'PROY-2024-002' },
      defaults: { solicitud_material_descripcion: 'Cañería cobre 3/4 - 100 metros', solicitud_material_cantidad: 100, solicitud_material_estado: 'pendiente', solicitud_material_fecha: '2024-06-05', proyecto_codigo_correlativo: 'PROY-2024-002', usuario_rut: '11111111-1' }
    });
    console.log('✓ Solicitudes de material');

    // ── ÓRDENES DE COMPRA ─────────────────────────────────────────────────────
    const [oc1] = await OrdenCompra.findOrCreate({
      where: { orden_compra_folio: 'OC-2024-001' },
      defaults: { orden_compra_folio: 'OC-2024-001', orden_compra_fecha: '2024-06-10', orden_compra_estado: 'Pendiente', proveedor_rut: '76543210-K', proyecto_codigo_correlativo: 'PROY-2024-001', solicitud_material_id: sol1.solicitud_material_id }
    });
    await DetalleOrdenCompra.findOrCreate({
      where: { orden_compra_id: oc1.orden_compra_id, detalle_orden_compra_descripcion_material: 'Filtro de aire G4 estándar' },
      defaults: { detalle_orden_compra_descripcion_material: 'Filtro de aire G4 estándar', detalle_orden_compra_cantidad: 50, detalle_orden_compra_precio_unitario: 4500, orden_compra_id: oc1.orden_compra_id }
    });

    const [oc2] = await OrdenCompra.findOrCreate({
      where: { orden_compra_folio: 'OC-2024-002' },
      defaults: { orden_compra_folio: 'OC-2024-002', orden_compra_fecha: '2024-06-12', orden_compra_estado: 'Pendiente', proveedor_rut: '87654321-1', proyecto_codigo_correlativo: 'PROY-2024-002', solicitud_material_id: sol2.solicitud_material_id }
    });
    await DetalleOrdenCompra.findOrCreate({
      where: { orden_compra_id: oc2.orden_compra_id, detalle_orden_compra_descripcion_material: 'Cañería de cobre 3/4 pulgada' },
      defaults: { detalle_orden_compra_descripcion_material: 'Cañería de cobre 3/4 pulgada', detalle_orden_compra_cantidad: 100, detalle_orden_compra_precio_unitario: 3200, orden_compra_id: oc2.orden_compra_id }
    });
    console.log('✓ Órdenes de compra');

    // ── GUÍAS DE DESPACHO ─────────────────────────────────────────────────────
    await GuiaDespacho.findOrCreate({
      where: { guia_despacho_numero: 'GD-2024-001' },
      defaults: { guia_despacho_numero: 'GD-2024-001', guia_despacho_fecha: '2024-06-15', guia_despacho_estado: 'Pendiente', guia_despacho_ubicacion_verificada: false, orden_compra_id: oc1.orden_compra_id }
    });
    await GuiaDespacho.findOrCreate({
      where: { guia_despacho_numero: 'GD-2024-002' },
      defaults: { guia_despacho_numero: 'GD-2024-002', guia_despacho_fecha: '2024-06-16', guia_despacho_estado: 'Pendiente', guia_despacho_ubicacion_verificada: false, orden_compra_id: oc2.orden_compra_id }
    });
    console.log('✓ Guías de despacho');

    // Marcar solicitudes como aprobadas (ya tienen OC)
    await sol1.update({ solicitud_material_estado: 'aprobada' });
    await sol2.update({ solicitud_material_estado: 'aprobada' });

    console.log('\n================================================');
    console.log('Reset completado.');
    console.log('  Admin      → RUT: 11111111-1  |  Pass: Admin1234!');
    console.log('  Supervisor → RUT: 22222222-2  |  Pass: Super1234!');
    console.log('================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('Error en reset:', err.message);
    process.exit(1);
  }
}

reset();
