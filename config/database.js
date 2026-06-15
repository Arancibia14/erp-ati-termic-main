const { Sequelize } = require('sequelize');

// Crea la conexión a MySQL usando las variables del archivo .env
// Sequelize es el ORM que permite interactuar con la base de datos usando objetos JS en lugar de SQL puro
const sequelize = new Sequelize(
  process.env.DB_NAME,   // nombre de la base de datos
  process.env.DB_USER,   // usuario MySQL
  process.env.DB_PASS,   // contraseña MySQL
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',   // indica que el motor de base de datos es MySQL
    logging: false,     // desactiva los logs de consultas SQL en consola
    // Pool de conexiones: reutiliza hasta 10 conexiones simultáneas en vez de abrir una nueva por cada petición
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
    define: {
      charset: 'utf8mb4',           // soporte completo de caracteres especiales y emojis
      collate: 'utf8mb4_0900_ai_ci' // regla de comparación de texto (insensible a mayúsculas/acentos)
    }
  }
);

module.exports = sequelize;
