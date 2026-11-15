const { Sequelize } = require('sequelize');
const demoLog = require('../utils/demoLog');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    // Apagado en uso normal; con el log de demo se imprimen las consultas SQL
    logging: demoLog.activo ? demoLog.logSql : false,
    benchmark: demoLog.activo,
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci'
    }
  }
);

module.exports = sequelize;
