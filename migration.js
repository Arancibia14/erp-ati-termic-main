require('dotenv').config();
const sequelize = require('./config/database');

// Agrega una columna solo si no existe
async function addColumn(table, column, definition) {
  const [rows] = await sequelize.query(
    `SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME  = :table
       AND COLUMN_NAME = :column
     LIMIT 1`,
    { replacements: { table, column }, type: sequelize.QueryTypes.SELECT }
  );
  if (!rows) {
    await sequelize.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
    console.log(`  + ${table}.${column}`);
  }
}

// Modifica una columna solo si existe
async function modifyColumn(table, column, definition) {
  const [rows] = await sequelize.query(
    `SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME  = :table
       AND COLUMN_NAME = :column
     LIMIT 1`,
    { replacements: { table, column }, type: sequelize.QueryTypes.SELECT }
  );
  if (rows) {
    await sequelize.query(`ALTER TABLE \`${table}\` MODIFY COLUMN \`${column}\` ${definition}`);
    console.log(`  ~ ${table}.${column}`);
  }
}

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log('Conectado a MySQL.\n');
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    // 1. PROVEEDOR
    await addColumn('PROVEEDOR', 'proveedor_correo', 'VARCHAR(150) NULL');
    await addColumn('PROVEEDOR', 'proveedor_telefono', 'VARCHAR(20) NULL');
    console.log('✓ PROVEEDOR');

    // 2. SOLICITUD_MATERIAL
    await modifyColumn('SOLICITUD_MATERIAL', 'solicitud_material_fecha_emision', 'DATE NULL');
    await modifyColumn('SOLICITUD_MATERIAL', 'solicitud_material_cantidad_pedida', 'DECIMAL(15,2) NULL');
    await addColumn('SOLICITUD_MATERIAL', 'solicitud_material_descripcion', "VARCHAR(500) NOT NULL DEFAULT ''");
    await addColumn('SOLICITUD_MATERIAL', 'solicitud_material_cantidad', 'INT NOT NULL DEFAULT 0');
    await addColumn('SOLICITUD_MATERIAL', 'solicitud_material_estado', "VARCHAR(50) NOT NULL DEFAULT 'pendiente'");
    await addColumn('SOLICITUD_MATERIAL', 'solicitud_material_fecha', 'DATE NULL');
    await addColumn('SOLICITUD_MATERIAL', 'usuario_rut', 'VARCHAR(20) NULL');
    console.log('✓ SOLICITUD_MATERIAL');

    // 3. ORDEN_COMPRA
    await modifyColumn('ORDEN_COMPRA', 'orden_compra_fecha_generacion', 'DATE NULL');
    await modifyColumn('ORDEN_COMPRA', 'orden_compra_fecha_entrega_pactada', 'DATE NULL');
    await addColumn('ORDEN_COMPRA', 'orden_compra_fecha', 'DATE NULL');
    await addColumn('ORDEN_COMPRA', 'solicitud_material_id', 'INT NULL');
    console.log('✓ ORDEN_COMPRA');

    // 4. DETALLE_ORDEN_COMPRA — recrear con estructura del modelo
    await sequelize.query('DROP TABLE IF EXISTS DETALLE_ORDEN_COMPRA');
    await sequelize.query(`
      CREATE TABLE DETALLE_ORDEN_COMPRA (
        detalle_orden_compra_id               INT            NOT NULL AUTO_INCREMENT,
        detalle_orden_compra_descripcion_material VARCHAR(255) NOT NULL,
        detalle_orden_compra_cantidad         INT            NOT NULL,
        detalle_orden_compra_precio_unitario  DECIMAL(15,2)  NOT NULL,
        orden_compra_id                       INT            NOT NULL,
        PRIMARY KEY (detalle_orden_compra_id),
        CONSTRAINT fk_doc_orden_v2
          FOREIGN KEY (orden_compra_id) REFERENCES ORDEN_COMPRA (orden_compra_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✓ DETALLE_ORDEN_COMPRA');

    // 5. FACTURA
    await modifyColumn('FACTURA', 'factura_proveedor_folio', 'VARCHAR(50) NULL');
    await modifyColumn('FACTURA', 'factura_proveedor_fecha_facturacion', 'DATE NULL');
    await modifyColumn('FACTURA', 'factura_proveedor_monto_total', 'DECIMAL(15,2) NULL');
    await addColumn('FACTURA', 'factura_folio', 'VARCHAR(50) NULL');
    await addColumn('FACTURA', 'factura_fecha', 'DATE NULL');
    await addColumn('FACTURA', 'factura_monto_total', 'DECIMAL(15,2) NULL');
    await addColumn('FACTURA', 'factura_url_pdf', 'TEXT NULL');
    console.log('✓ FACTURA');

    // 6. PARAMETRO_SISTEMA — el modelo usa columnas distintas a las del schema
    await addColumn('PARAMETRO_SISTEMA', 'parametro_sistema_id', 'INT NOT NULL AUTO_INCREMENT UNIQUE');
    await addColumn('PARAMETRO_SISTEMA', 'parametro_sistema_clave', 'VARCHAR(100) NULL');
    await addColumn('PARAMETRO_SISTEMA', 'parametro_sistema_valor', 'VARCHAR(255) NULL');
    await addColumn('PARAMETRO_SISTEMA', 'parametro_sistema_descripcion', 'TEXT NULL');
    console.log('✓ PARAMETRO_SISTEMA');

    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('\n✅ Migración completada. Reinicia el servidor Node.js.');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error en migración:', err.message);
    process.exit(1);
  }
}

migrate();
