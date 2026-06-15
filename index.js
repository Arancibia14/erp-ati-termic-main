// Punto de entrada del backend ERP ATI Termic
// Carga variables de entorno, conecta a MySQL, aplica migraciones y levanta el servidor Express

require('dotenv').config(); // carga las variables del archivo .env (DB_NAME, JWT_SECRET, PORT, etc.)
const express = require('express');
const cors = require('cors');   // permite que el frontend (puerto 5173) llame al backend (puerto 3000)
const path = require('path');
const sequelize = require('./config/database'); // instancia de conexión Sequelize a MySQL

// Models
const Usuario = require('./models/Usuario');
const Administrador = require('./models/Administrador');
const SupervisorTerreno = require('./models/SupervisorTerreno');
const EstadoProyecto = require('./models/EstadoProyecto');
const Proyecto = require('./models/Proyecto');
const Especialidad = require('./models/Especialidad');
const Trabajador = require('./models/Trabajador');
const BitacoraDiaria = require('./models/BitacoraDiaria');
const EgresoCajaChica = require('./models/EgresoCajaChica');
const IncidenteSSO = require('./models/IncidenteSSO');
const Accidente = require('./models/Accidente');
const HitoTecnico = require('./models/HitoTecnico');
const EvidenciaFotografica = require('./models/EvidenciaFotografica');
const LogAuditoria = require('./models/LogAuditoria');
const Proveedor = require('./models/Proveedor');
const SolicitudMaterial = require('./models/SolicitudMaterial');
const OrdenCompra = require('./models/OrdenCompra');
const DetalleOrdenCompra = require('./models/DetalleOrdenCompra');
const GuiaDespacho = require('./models/GuiaDespacho');
const Factura = require('./models/Factura');
const ParametroSistema = require('./models/ParametroSistema');
const ContratoLaboral = require('./models/ContratoLaboral');
const BitacoraComunicacion = require('./models/BitacoraComunicacion');
const ControlCambioPpto = require('./models/ControlCambioPpto');
const DocumentoLegal = require('./models/DocumentoLegal');
const EquipoHVAC = require('./models/EquipoHVAC');

// Associations
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

Proyecto.hasMany(OrdenCompra, { foreignKey: 'proyecto_codigo_correlativo' });
OrdenCompra.belongsTo(Proyecto, { foreignKey: 'proyecto_codigo_correlativo' });

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

const app = express();

app.use(cors());                              // habilita CORS para todas las rutas
app.use(express.json());                      // parsea cuerpos JSON en las peticiones POST/PUT
app.use(express.urlencoded({ extended: true })); // parsea formularios HTML
// Sirve los archivos subidos (fotos, PDFs) como recursos estáticos accesibles por URL
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Registro de rutas: cada módulo del ERP tiene su propio router
app.use('/api/auth', require('./routes/auth'));
app.use('/api/bitacora', require('./routes/bitacora'));
app.use('/api/caja-chica', require('./routes/cajaChica'));
app.use('/api/sso', require('./routes/incidente'));
app.use('/api/evidencia', require('./routes/evidencia'));
app.use('/api/proyecto', require('./routes/proyecto'));
app.use('/api/portafolio', require('./routes/portafolio'));
app.use('/api/orden-compra', require('./routes/ordenCompra'));
app.use('/api/factura', require('./routes/factura'));
app.use('/api/control-costos', require('./routes/costos'));
app.use('/api/mano-obra', require('./routes/consolidacion'));
app.use('/api/comunicacion', require('./routes/comunicacion'));
app.use('/api/documentos', require('./routes/documentos'));
app.use('/api/poliza', require('./routes/poliza'));
app.use('/api/certificado', require('./routes/certificado'));
app.use('/api/presupuesto', require('./routes/presupuesto'));
app.use('/api/recepcion', require('./routes/recepcion'));
app.use('/api/validacion', require('./routes/validacion'));
app.use('/api/setup',    require('./routes/setup'));

app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date() } });
});

const PORT = process.env.PORT || 3000;

const { DataTypes } = require('sequelize');

// Secuencia de arranque: 1) autenticar conexión → 2) sincronizar modelos → 3) aplicar migraciones → 4) iniciar servidor
sequelize.authenticate()
  .then(() => {
    console.log('Conexion a MySQL establecida.');
    // sync({ alter: false }): crea las tablas si no existen pero NO modifica columnas ya existentes
    return sequelize.sync({ alter: false });
  })
  .then(async () => {
    // Migraciones puntuales: agregan columnas nuevas que el modelo requiere sin borrar datos existentes
    const qi = sequelize.queryInterface;
    const migraciones = [
      { tabla: 'PROYECTO',   columna: 'proveedor_rut',              tipo: { type: DataTypes.STRING(20),  allowNull: true } },
      { tabla: 'TRABAJADOR', columna: 'proyecto_codigo_correlativo', tipo: { type: DataTypes.STRING(50),  allowNull: true } },
      { tabla: 'CONTRATO_LABORAL', columna: 'proyecto_codigo_correlativo', tipo: { type: DataTypes.STRING(50), allowNull: true } },
      { tabla: 'INCIDENTE_SSO', columna: 'incidente_sso_url_fotos', tipo: { type: DataTypes.TEXT, allowNull: true } },
      { tabla: 'INCIDENTE_SSO', columna: 'incidente_sso_tipo', tipo: { type: DataTypes.STRING(50), allowNull: true } },
      { tabla: 'INCIDENTE_SSO', columna: 'incidente_sso_lugar', tipo: { type: DataTypes.STRING(255), allowNull: true } },
      { tabla: 'PROYECTO', columna: 'proyecto_descripcion_tecnica', tipo: { type: DataTypes.TEXT, allowNull: true } },
      { tabla: 'PROYECTO', columna: 'proyecto_ubicacion', tipo: { type: DataTypes.STRING(255), allowNull: true } },
      { tabla: 'PROYECTO', columna: 'proyecto_latitud',  tipo: { type: DataTypes.DECIMAL(10, 7), allowNull: true } },
      { tabla: 'PROYECTO', columna: 'proyecto_longitud', tipo: { type: DataTypes.DECIMAL(10, 7), allowNull: true } },
    ];
    for (const m of migraciones) {
      try {
        await qi.addColumn(m.tabla, m.columna, m.tipo);
        console.log(`Columna ${m.tabla}.${m.columna} agregada.`);
      } catch (_) { /* ya existe, ignorar */ }
    }

    // Quitar FKs que bloquean inserts y hacer columnas nullable
    const fkMigs = [
      "ALTER TABLE LOG_AUDITORIA DROP FOREIGN KEY fk_log_usuario",
      "ALTER TABLE LOG_AUDITORIA MODIFY usuario_rut VARCHAR(20) NULL",
      "ALTER TABLE SOLICITUD_MATERIAL DROP FOREIGN KEY fk_sm_usuario",
      "ALTER TABLE SOLICITUD_MATERIAL MODIFY usuario_rut VARCHAR(20) NULL",
    ];
    for (const sql of fkMigs) {
      try { await sequelize.query(sql); } catch (_) { /* ignorar si ya no existe */ }
    }

    // Arreglar tabla SOLICITUD_MATERIAL: schema tiene columnas distintas al modelo
    const smMigs = [
      "ALTER TABLE SOLICITUD_MATERIAL MODIFY solicitud_material_fecha_emision DATE NULL",
      "ALTER TABLE SOLICITUD_MATERIAL MODIFY solicitud_material_cantidad_pedida DECIMAL(15,2) NULL",
      "ALTER TABLE SOLICITUD_MATERIAL ADD COLUMN solicitud_material_descripcion TEXT NULL",
      "ALTER TABLE SOLICITUD_MATERIAL ADD COLUMN solicitud_material_cantidad INT NULL",
      "ALTER TABLE SOLICITUD_MATERIAL ADD COLUMN solicitud_material_estado VARCHAR(50) NULL DEFAULT 'pendiente'",
      "ALTER TABLE SOLICITUD_MATERIAL ADD COLUMN solicitud_material_fecha DATE NULL",
      "ALTER TABLE SOLICITUD_MATERIAL ADD COLUMN proyecto_codigo_correlativo VARCHAR(50) NULL",
      "ALTER TABLE SOLICITUD_MATERIAL ADD COLUMN usuario_rut VARCHAR(20) NULL",
    ];
    for (const sql of smMigs) {
      try { await sequelize.query(sql); } catch (_) { /* ya existe, ignorar */ }
    }

    // Arreglar tabla GUIA_DESPACHO: columnas distintas al modelo
    const gdMigs = [
      "ALTER TABLE GUIA_DESPACHO DROP FOREIGN KEY fk_guia_proveedor",
      "ALTER TABLE GUIA_DESPACHO MODIFY guia_despacho_folio VARCHAR(50) NULL",
      "ALTER TABLE GUIA_DESPACHO MODIFY guia_despacho_fecha_emision DATE NULL",
      "ALTER TABLE GUIA_DESPACHO MODIFY guia_despacho_transportista VARCHAR(150) NULL",
      "ALTER TABLE GUIA_DESPACHO MODIFY proveedor_rut VARCHAR(20) NULL",
      "ALTER TABLE GUIA_DESPACHO ADD COLUMN guia_despacho_numero VARCHAR(50) NULL",
      "ALTER TABLE GUIA_DESPACHO ADD COLUMN guia_despacho_fecha DATE NULL",
      "ALTER TABLE GUIA_DESPACHO ADD COLUMN guia_despacho_ubicacion_verificada TINYINT(1) NULL DEFAULT 0",
      "ALTER TABLE GUIA_DESPACHO ADD COLUMN guia_despacho_latitud_recepcion DECIMAL(10,7) NULL",
      "ALTER TABLE GUIA_DESPACHO ADD COLUMN guia_despacho_longitud_recepcion DECIMAL(10,7) NULL",
      "ALTER TABLE GUIA_DESPACHO ADD COLUMN orden_compra_id INT NULL",
    ];
    for (const sql of gdMigs) {
      try { await sequelize.query(sql); } catch (_) { /* ignorar */ }
    }

    // Arreglar tabla ORDEN_COMPRA: columnas distintas al modelo
    const ocMigs = [
      "ALTER TABLE ORDEN_COMPRA DROP FOREIGN KEY fk_oc_proyecto",
      "ALTER TABLE ORDEN_COMPRA DROP FOREIGN KEY fk_oc_proveedor",
      "ALTER TABLE ORDEN_COMPRA MODIFY orden_compra_fecha_generacion DATE NULL",
      "ALTER TABLE ORDEN_COMPRA MODIFY orden_compra_fecha_entrega_pactada DATE NULL",
      "ALTER TABLE ORDEN_COMPRA ADD COLUMN orden_compra_fecha DATE NULL",
      "ALTER TABLE ORDEN_COMPRA ADD COLUMN solicitud_material_id INT NULL",
    ];
    for (const sql of ocMigs) {
      try { await sequelize.query(sql); } catch (_) { /* ignorar */ }
    }

    // Arreglar tabla DETALLE_ORDEN_COMPRA: estructura completamente distinta al modelo
    const docMigs = [
      "ALTER TABLE DETALLE_ORDEN_COMPRA DROP FOREIGN KEY fk_doc_orden",
      "ALTER TABLE DETALLE_ORDEN_COMPRA DROP FOREIGN KEY fk_doc_material",
      "ALTER TABLE DETALLE_ORDEN_COMPRA DROP PRIMARY KEY",
      "ALTER TABLE DETALLE_ORDEN_COMPRA MODIFY material_id INT NULL",
      "ALTER TABLE DETALLE_ORDEN_COMPRA MODIFY detalle_cantidad_pedida DECIMAL(15,2) NULL",
      "ALTER TABLE DETALLE_ORDEN_COMPRA MODIFY detalle_precio_unitario DECIMAL(15,2) NULL",
      "ALTER TABLE DETALLE_ORDEN_COMPRA ADD COLUMN detalle_orden_compra_id INT AUTO_INCREMENT PRIMARY KEY FIRST",
      "ALTER TABLE DETALLE_ORDEN_COMPRA ADD COLUMN detalle_orden_compra_descripcion_material VARCHAR(255) NULL",
      "ALTER TABLE DETALLE_ORDEN_COMPRA ADD COLUMN detalle_orden_compra_cantidad INT NULL",
      "ALTER TABLE DETALLE_ORDEN_COMPRA ADD COLUMN detalle_orden_compra_precio_unitario DECIMAL(15,2) NULL",
    ];
    for (const sql of docMigs) {
      try { await sequelize.query(sql); } catch (_) { /* ignorar */ }
    }

    // Arreglar tabla FACTURA
    const facMigs = [
      "ALTER TABLE FACTURA DROP FOREIGN KEY fk_factura_orden",
      "ALTER TABLE FACTURA MODIFY factura_proveedor_folio VARCHAR(50) NULL",
      "ALTER TABLE FACTURA MODIFY factura_proveedor_fecha_facturacion DATE NULL",
      "ALTER TABLE FACTURA MODIFY factura_proveedor_monto_total DECIMAL(15,2) NULL",
      "ALTER TABLE FACTURA ADD COLUMN factura_folio VARCHAR(50) NULL",
      "ALTER TABLE FACTURA ADD COLUMN factura_fecha DATE NULL",
      "ALTER TABLE FACTURA ADD COLUMN factura_monto_total DECIMAL(15,2) NULL",
      "ALTER TABLE FACTURA ADD COLUMN factura_url_pdf TEXT NULL",
    ];
    for (const sql of facMigs) {
      try { await sequelize.query(sql); } catch (_) { /* ignorar */ }
    }

    // Arreglar tabla CONTRATO_LABORAL
    const clMigs = [
      "ALTER TABLE CONTRATO_LABORAL DROP FOREIGN KEY fk_contrato_trabajador",
      "ALTER TABLE CONTRATO_LABORAL MODIFY contrato_laboral_fecha_termino DATE NULL",
      "ALTER TABLE CONTRATO_LABORAL ADD COLUMN contrato_laboral_sueldo_base DECIMAL(15,2) NULL",
      "ALTER TABLE CONTRATO_LABORAL ADD COLUMN contrato_laboral_leyes_sociales DECIMAL(15,2) NULL DEFAULT 0",
      "ALTER TABLE CONTRATO_LABORAL ADD COLUMN proyecto_codigo_correlativo VARCHAR(50) NULL",
    ];
    for (const sql of clMigs) {
      try { await sequelize.query(sql); } catch (_) { /* ignorar */ }
    }

    // Arreglar tabla DOCUMENTO_LEGAL
    const dlMigs = [
      "ALTER TABLE DOCUMENTO_LEGAL DROP FOREIGN KEY fk_documento_trabajador",
      "ALTER TABLE DOCUMENTO_LEGAL MODIFY documento_legal_tipo_documento VARCHAR(100) NULL",
      "ALTER TABLE DOCUMENTO_LEGAL MODIFY trabajador_rut VARCHAR(20) NULL",
      "ALTER TABLE DOCUMENTO_LEGAL ADD COLUMN documento_legal_tipo VARCHAR(100) NULL",
      "ALTER TABLE DOCUMENTO_LEGAL ADD COLUMN documento_legal_estado VARCHAR(50) NULL",
      "ALTER TABLE DOCUMENTO_LEGAL ADD COLUMN documento_legal_fecha_emision DATE NULL",
      "ALTER TABLE DOCUMENTO_LEGAL ADD COLUMN documento_legal_fecha_vencimiento DATE NULL",
      "ALTER TABLE DOCUMENTO_LEGAL ADD COLUMN documento_legal_url_pdf TEXT NULL",
      "ALTER TABLE DOCUMENTO_LEGAL ADD COLUMN proyecto_codigo_correlativo VARCHAR(50) NULL",
    ];
    for (const sql of dlMigs) {
      try { await sequelize.query(sql); } catch (_) { /* ignorar */ }
    }

    // Arreglar tabla PROVEEDOR: schema.sql tiene columnas distintas a las del modelo
    const rawMigs = [
      "ALTER TABLE PROVEEDOR MODIFY proveedor_giro TEXT NULL",
      "ALTER TABLE PROVEEDOR MODIFY proveedor_contacto VARCHAR(150) NULL",
      "ALTER TABLE PROVEEDOR ADD COLUMN proveedor_razon_social TEXT NULL",
      "ALTER TABLE PROVEEDOR ADD COLUMN proveedor_correo VARCHAR(150) NULL",
      "ALTER TABLE PROVEEDOR ADD COLUMN proveedor_telefono VARCHAR(20) NULL",
    ];
    for (const sql of rawMigs) {
      try {
        await sequelize.query(sql);
        console.log(`SQL OK: ${sql.substring(0, 60)}`);
      } catch (e) { console.log(`SQL skip: ${e.message.substring(0, 80)}`); }
    }
  })
  .then(() => {
    // Solo levanta el servidor si la conexión y las migraciones fueron exitosas
    app.listen(PORT, () => {
      console.log(`Backend ERP ATI Termic corriendo en http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    // Si MySQL no está disponible el proceso termina con código de error 1
    console.error('Error al conectar a la base de datos:', err.message);
    process.exit(1);
  });
