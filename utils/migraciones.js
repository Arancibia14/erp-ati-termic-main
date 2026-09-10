// Las migraciones corren en cada arranque sobre bases que cada integrante armó
// distinto, así que algunas fallan de forma esperable. Solo esos casos se
// ignoran; cualquier otro error se reporta.
function noAplica(sentencia, codigo) {
  switch (codigo) {
    case 'ER_DUP_FIELDNAME':          // ADD COLUMN: la columna ya existe
    case 'ER_CANT_DROP_FIELD_OR_KEY': // DROP: la FK o columna ya no existe
      return true;
    case 'ER_WRONG_AUTO_KEY':         // la tabla ya tiene su nueva llave autoincremental
      return /DROP PRIMARY KEY/i.test(sentencia);
    case 'ER_BAD_FIELD_ERROR':        // columna heredada de schema.sql que una base creada desde los modelos no tiene
      return /\bMODIFY\b/i.test(sentencia);
    default:
      return false;
  }
}

function crearMigrador(sequelize) {
  const qi = sequelize.getQueryInterface();
  const fallidas = [];
  const opcionalesPreexistentes = [];

  function reportar(descripcion, motivo) {
    fallidas.push({ descripcion, motivo });
    console.error(`[MIGRACIÓN FALLIDA] ${descripcion}\n    ${motivo}`);
  }

  async function sql(sentencia) {
    try {
      await sequelize.query(sentencia);
      // MODIFY no falla aunque ya esté aplicado, así que anunciarlo sería ruido en cada arranque
      if (!/\bMODIFY\b/i.test(sentencia)) console.log(`Migración aplicada: ${sentencia}`);
    } catch (err) {
      if (noAplica(sentencia, err.parent?.code)) return;
      reportar(sentencia, err.parent?.sqlMessage || err.message);
    }
  }

  async function agregarColumna(tabla, columna, definicion) {
    try {
      await qi.addColumn(tabla, columna, definicion);
      console.log(`Columna ${tabla}.${columna} agregada.`);
    } catch (err) {
      if (err.parent?.code !== 'ER_DUP_FIELDNAME') {
        return reportar(`agregar columna ${tabla}.${columna}`, err.parent?.sqlMessage || err.message);
      }
      if (definicion.allowNull) opcionalesPreexistentes.push({ tabla, columna });
    }
  }

  // addColumn no modifica una columna que ya existe. Se verifica al final, porque
  // un MODIFY posterior puede ser el que la deja opcional.
  async function finalizar() {
    for (const { tabla, columna } of opcionalesPreexistentes) {
      const actual = (await qi.describeTable(tabla))[columna];
      if (actual && !actual.allowNull) {
        reportar(`columna ${tabla}.${columna}`,
          'Quedó NOT NULL pero la migración la espera opcional, así que todo insert que no la envíe va a fallar. addColumn no modifica columnas existentes: agrega un ALTER TABLE ... MODIFY.');
      }
    }

    if (fallidas.length === 0) {
      console.log('Migraciones verificadas sin errores.');
      return;
    }
    const linea = '='.repeat(72);
    console.error(`\n${linea}`);
    console.error(`ATENCIÓN: ${fallidas.length} migración(es) fallaron al arrancar.`);
    console.error('El backend sigue funcionando, pero la base puede no coincidir con los modelos:');
    for (const f of fallidas) console.error(`  - ${f.descripcion}`);
    console.error('Revisa el detalle de cada error más arriba.');
    console.error(`${linea}\n`);
  }

  return { sql, agregarColumna, finalizar, fallidas };
}

module.exports = { crearMigrador };
