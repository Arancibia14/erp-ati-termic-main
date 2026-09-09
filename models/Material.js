const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Los nombres de dos atributos no coinciden con los de la tabla, por lo que se
// mapean con "field". Se conservan los nombres del modelo para no tener que
// modificar los controladores ni el frontend, que ya los usan asi:
//   material_codigo_sku   -> columna material_sku
//   material_stock_minimo -> columna material_stock_actual (es el stock vigente:
//                            el catalogo lo descuenta y lo repone en cada movimiento)
// La columna material_nivel_minimo queda sin uso: representa el umbral de
// reposicion (UR-F-32), que aun no esta implementado.
const Material = sequelize.define('Material', {
  material_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  material_codigo_sku: { type: DataTypes.STRING(100), field: 'material_sku', allowNull: false, unique: true },
  material_nombre: { type: DataTypes.STRING(255), allowNull: false },
  material_descripcion: { type: DataTypes.TEXT, allowNull: true },
  material_unidad_medida: { type: DataTypes.STRING(50), allowNull: false },
  material_categoria: { type: DataTypes.STRING(100), allowNull: true },
  material_stock_minimo: {
    type: DataTypes.DECIMAL(15, 2),
    field: 'material_stock_actual',
    allowNull: false,
    defaultValue: 0,
    // DECIMAL llega como string desde MySQL; se devuelve numerico para que las
    // comparaciones y descuentos de stock operen sobre numeros.
    get() {
      const valor = this.getDataValue('material_stock_minimo');
      return valor === null || valor === undefined ? 0 : parseFloat(valor);
    }
  },
  material_activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  material_proveedor_rut: { type: DataTypes.STRING(20), allowNull: true }
}, {
  tableName: 'MATERIAL',
  timestamps: false
});

module.exports = Material;
