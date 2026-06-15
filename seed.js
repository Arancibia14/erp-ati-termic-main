require('dotenv').config();
const bcrypt = require('bcryptjs');
const sequelize = require('./config/database');

// Models
require('./models/EstadoProyecto');
require('./models/Proyecto');
require('./models/Especialidad');
require('./models/Trabajador');
require('./models/HitoTecnico');
const Usuario = require('./models/Usuario');
const Administrador = require('./models/Administrador');
const SupervisorTerreno = require('./models/SupervisorTerreno');
const EstadoProyecto = require('./models/EstadoProyecto');
const Proyecto = require('./models/Proyecto');
const Especialidad = require('./models/Especialidad');
const Trabajador = require('./models/Trabajador');
const HitoTecnico = require('./models/HitoTecnico');

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Conectado a MySQL.');

    // Estado Proyecto
    const [enEjecucion] = await EstadoProyecto.findOrCreate({
      where: { estado_proyecto_nombre: 'En Ejecución' },
      defaults: { estado_proyecto_nombre: 'En Ejecución' }
    });
    await EstadoProyecto.findOrCreate({
      where: { estado_proyecto_nombre: 'Planificación' },
      defaults: { estado_proyecto_nombre: 'Planificación' }
    });
    await EstadoProyecto.findOrCreate({
      where: { estado_proyecto_nombre: 'Finalizado' },
      defaults: { estado_proyecto_nombre: 'Finalizado' }
    });
    console.log('Estados de proyecto creados.');

    // Usuarios
    const passAdmin = await bcrypt.hash('Admin1234!', 10);
    const passSuper = await bcrypt.hash('Super1234!', 10);

    await Usuario.findOrCreate({
      where: { usuario_rut: '11111111-1' },
      defaults: {
        usuario_nombre: 'Administrador Sistema',
        usuario_correo_institucional: 'admin@atitermic.cl',
        usuario_password_hash: passAdmin
      }
    });

    await Usuario.findOrCreate({
      where: { usuario_rut: '22222222-2' },
      defaults: {
        usuario_nombre: 'Supervisor Terreno',
        usuario_correo_institucional: 'supervisor@atitermic.cl',
        usuario_password_hash: passSuper
      }
    });
    console.log('Usuarios creados.');

    // Administrador
    await Administrador.findOrCreate({
      where: { usuario_rut: '11111111-1' },
      defaults: {
        administrador_nivel_acceso: 'total',
        administrador_fecha_asignacion: new Date(),
        usuario_rut: '11111111-1'
      }
    });

    // Supervisor Terreno
    await SupervisorTerreno.findOrCreate({
      where: { usuario_rut: '22222222-2' },
      defaults: {
        supervisor_terreno_registro_certificacion: 'CERT-2024-001',
        supervisor_terreno_telefono_emergencia: '+56912345678',
        usuario_rut: '22222222-2'
      }
    });
    console.log('Roles asignados.');

    // Proyectos
    await Proyecto.findOrCreate({
      where: { proyecto_codigo_correlativo: 'PROY-2024-001' },
      defaults: {
        proyecto_nombre_obra: 'Climatización Centro Comercial Norte',
        proyecto_porcentaje_avance: 35.00,
        proyecto_presupuesto_asignado: 15000000.00,
        proyecto_correo_contacto: 'contacto@centronorte.cl',
        estado_proyecto_id: enEjecucion.estado_proyecto_id
      }
    });

    await Proyecto.findOrCreate({
      where: { proyecto_codigo_correlativo: 'PROY-2024-002' },
      defaults: {
        proyecto_nombre_obra: 'Sistema HVAC Edificio Corporativo Sur',
        proyecto_porcentaje_avance: 60.00,
        proyecto_presupuesto_asignado: 8500000.00,
        proyecto_correo_contacto: 'contacto@edificiosur.cl',
        estado_proyecto_id: enEjecucion.estado_proyecto_id
      }
    });
    console.log('Proyectos creados.');

    // Especialidades
    const [esp1] = await Especialidad.findOrCreate({
      where: { especialidad_nombre: 'Técnico HVAC' },
      defaults: { especialidad_nombre: 'Técnico HVAC' }
    });
    const [esp2] = await Especialidad.findOrCreate({
      where: { especialidad_nombre: 'Electricista Industrial' },
      defaults: { especialidad_nombre: 'Electricista Industrial' }
    });
    const [esp3] = await Especialidad.findOrCreate({
      where: { especialidad_nombre: 'Instalador de Ductos' },
      defaults: { especialidad_nombre: 'Instalador de Ductos' }
    });

    // Trabajadores
    await Trabajador.findOrCreate({
      where: { trabajador_rut: '33333333-3' },
      defaults: {
        trabajador_telefono: '+56911111111',
        trabajador_nombres: 'Carlos Mendoza Ríos',
        trabajador_correo: 'cmendoza@atitermic.cl',
        especialidad_id: esp1.especialidad_id,
        proyecto_codigo_correlativo: 'PROY-2024-001'
      }
    });

    await Trabajador.findOrCreate({
      where: { trabajador_rut: '44444444-4' },
      defaults: {
        trabajador_telefono: '+56922222222',
        trabajador_nombres: 'María González López',
        trabajador_correo: 'mgonzalez@atitermic.cl',
        especialidad_id: esp2.especialidad_id,
        proyecto_codigo_correlativo: 'PROY-2024-001'
      }
    });

    await Trabajador.findOrCreate({
      where: { trabajador_rut: '55555555-5' },
      defaults: {
        trabajador_telefono: '+56933333333',
        trabajador_nombres: 'Pedro Fuentes Silva',
        trabajador_correo: 'pfuentes@atitermic.cl',
        especialidad_id: esp3.especialidad_id,
        proyecto_codigo_correlativo: 'PROY-2024-002'
      }
    });
    console.log('Trabajadores creados.');

    // Hitos Técnicos
    await HitoTecnico.findOrCreate({
      where: { hito_tecnico_nombre_hito: 'Instalación de ductos principal', proyecto_codigo_correlativo: 'PROY-2024-001' },
      defaults: {
        hito_tecnico_nombre_hito: 'Instalación de ductos principal',
        hito_tecnico_avance_fisico: 0.00,
        proyecto_codigo_correlativo: 'PROY-2024-001'
      }
    });

    await HitoTecnico.findOrCreate({
      where: { hito_tecnico_nombre_hito: 'Conexión unidades exteriores', proyecto_codigo_correlativo: 'PROY-2024-002' },
      defaults: {
        hito_tecnico_nombre_hito: 'Conexión unidades exteriores',
        hito_tecnico_avance_fisico: 0.00,
        proyecto_codigo_correlativo: 'PROY-2024-002'
      }
    });
    console.log('Hitos técnicos creados.');

    console.log('\nSeed completado exitosamente.');
    process.exit(0);
  } catch (err) {
    console.error('Error en seed:', err);
    process.exit(1);
  }
}

seed();
