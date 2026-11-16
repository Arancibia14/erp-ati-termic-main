-- ============================================================
-- ERP ATI TERMIC SpA - Script DML (Data Manipulation Language)
-- Carga los datos iniciales del sistema: roles y usuarios (Administrador
-- Total 11111111-1 / Admin1234! y Supervisor de Obra 22222222-2 /
-- Super1234!, contraseñas guardadas con hash bcrypt), estados, parámetros,
-- proyectos, trabajadores, materiales, proveedores y demás datos de ejemplo.
-- Son los mismos datos que carga reset-db.js. Generado el 2026-11-16.
-- Ejecutar después de DDL_erp_ati_termic.sql.
-- ============================================================

USE erp_ati_termic;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ESTADO_PROYECTO (3 registros)
INSERT INTO `ESTADO_PROYECTO` (`estado_proyecto_id`, `estado_proyecto_nombre`) VALUES
  (1, 'En Ejecución'),
  (2, 'Planificación'),
  (3, 'Finalizado');

-- PROYECTO (2 registros)
INSERT INTO `PROYECTO` (`proyecto_codigo_correlativo`, `proyecto_nombre_obra`, `proyecto_porcentaje_avance`, `proyecto_presupuesto_asignado`, `proyecto_correo_contacto`, `estado_proyecto_id`, `proyecto_descripcion_tecnica`, `proyecto_tipo_sistema`, `proyecto_ubicacion`, `proyecto_latitud`, `proyecto_longitud`, `proyecto_fecha_inicio`, `proyecto_fecha_termino`, `proyecto_presupuesto_caja_chica`, `proyecto_archivado`, `proyecto_fecha_archivado`) VALUES
  ('PROY-2024-001', 'Climatización Centro Comercial Norte', '35.00', '15000000.00', 'contacto@centronorte.cl', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '500000.00', 0, NULL),
  ('PROY-2024-002', 'Sistema HVAC Edificio Corporativo Sur', '60.00', '8500000.00', 'contacto@edificiosur.cl', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '300000.00', 0, NULL);

-- USUARIO (2 registros)
INSERT INTO `USUARIO` (`usuario_rut`, `usuario_nombre`, `usuario_correo_institucional`, `usuario_password_hash`) VALUES
  ('11111111-1', 'Administrador Sistema', 'admin@atitermic.cl', '$2a$10$jxFy1BRxi9K/UQJutlxnIOgWIjcOaOpPg9NCcKxGHvLyrgc/7LIFq'),
  ('22222222-2', 'Supervisor Terreno', 'supervisor@atitermic.cl', '$2a$10$gCKuoEtyqGfPUFByBF.VJ.PAFT/ebUVI3oSubAaY1HIV0Lun9KRAi');

-- ADMINISTRADOR (1 registro)
INSERT INTO `ADMINISTRADOR` (`administrador_id`, `administrador_nivel_acceso`, `administrador_fecha_asignacion`, `usuario_rut`) VALUES
  (1, 'total', '2026-11-16 02:08:55', '11111111-1');

-- TRABAJADOR (3 registros)
INSERT INTO `TRABAJADOR` (`trabajador_rut`, `trabajador_telefono`, `trabajador_nombres`, `trabajador_apellidos`, `trabajador_correo`, `especialidad_id`, `trabajador_activo`, `proyecto_codigo_correlativo`) VALUES
  ('33333333-3', '+56911111111', 'Carlos Mendoza Ríos', NULL, 'cmendoza@atitermic.cl', 1, 1, 'PROY-2024-001'),
  ('44444444-4', '+56922222222', 'María González López', NULL, 'mgonzalez@atitermic.cl', 2, 1, 'PROY-2024-001'),
  ('55555555-5', '+56933333333', 'Pedro Fuentes Silva', NULL, 'pfuentes@atitermic.cl', 3, 1, 'PROY-2024-002');

-- CONTRATO_LABORAL (3 registros)
INSERT INTO `CONTRATO_LABORAL` (`contrato_laboral_id_contrato`, `contrato_laboral_sueldo_base`, `contrato_laboral_leyes_sociales`, `contrato_laboral_fecha_inicio`, `contrato_laboral_fecha_termino`, `trabajador_rut`, `proyecto_codigo_correlativo`) VALUES
  (1, '850000.00', '180000.00', '2024-01-15', NULL, '33333333-3', 'PROY-2024-001'),
  (2, '920000.00', '195000.00', '2024-02-01', NULL, '44444444-4', 'PROY-2024-001'),
  (3, '780000.00', '165000.00', '2024-03-01', NULL, '55555555-5', 'PROY-2024-002');

-- PROVEEDOR (3 registros)
INSERT INTO `PROVEEDOR` (`proveedor_rut`, `proveedor_razon_social`, `proveedor_correo`, `proveedor_telefono`, `proveedor_activo`) VALUES
  ('76543210-K', 'Distribuidora Clima Norte SpA', 'ventas@climanorte.cl', '+56221234567', 1),
  ('87654321-1', 'Insumos HVAC Chile Ltda.', 'contacto@insumoschile.cl', '+56229876543', 1),
  ('98765432-2', 'Materiales Técnicos del Sur S.A.', 'pedidos@mattecnicos.cl', '+56412222333', 1);

-- SOLICITUD_MATERIAL (2 registros)
INSERT INTO `SOLICITUD_MATERIAL` (`solicitud_material_id`, `solicitud_material_descripcion`, `solicitud_material_cantidad`, `solicitud_material_estado`, `solicitud_material_fecha`, `proyecto_codigo_correlativo`, `usuario_rut`, `material_id`) VALUES
  (1, 'Filtros de aire tipo G4 - 50 unidades', 50, 'aprobada', '2024-06-01', 'PROY-2024-001', '11111111-1', NULL),
  (2, 'Cañería cobre 3/4 - 100 metros', 100, 'aprobada', '2024-06-05', 'PROY-2024-002', '11111111-1', NULL);

-- ORDEN_COMPRA (2 registros)
INSERT INTO `ORDEN_COMPRA` (`orden_compra_id`, `orden_compra_folio`, `orden_compra_fecha`, `orden_compra_estado`, `proveedor_rut`, `proyecto_codigo_correlativo`, `solicitud_material_id`, `orden_compra_iva_porcentaje`) VALUES
  (1, 'OC-2024-001', '2024-06-10', 'Pendiente', '76543210-K', 'PROY-2024-001', 1, NULL),
  (2, 'OC-2024-002', '2024-06-12', 'Pendiente', '87654321-1', 'PROY-2024-002', 2, NULL);

-- DETALLE_ORDEN_COMPRA (2 registros)
INSERT INTO `DETALLE_ORDEN_COMPRA` (`detalle_orden_compra_id`, `detalle_orden_compra_descripcion_material`, `detalle_orden_compra_cantidad`, `detalle_orden_compra_precio_unitario`, `orden_compra_id`, `material_id`) VALUES
  (1, 'Filtro de aire G4 estándar', 50, '4500.00', 1, NULL),
  (2, 'Cañería de cobre 3/4 pulgada', 100, '3200.00', 2, NULL);

-- ESPECIALIDAD (6 registros)
INSERT INTO `ESPECIALIDAD` (`especialidad_id`, `especialidad_nombre`) VALUES
  (1, 'Técnico HVAC'),
  (2, 'Electricista Industrial'),
  (3, 'Instalador de Ductos'),
  (4, 'Gasfiter'),
  (5, 'Supervisor'),
  (6, 'Bodeguero');

-- HITO_TECNICO (4 registros)
INSERT INTO `HITO_TECNICO` (`hito_tecnico_id`, `hito_tecnico_nombre_hito`, `hito_tecnico_avance_fisico`, `hito_tecnico_fecha_inicio_estimada`, `hito_tecnico_fecha_termino_estimada`, `proyecto_codigo_correlativo`) VALUES
  (1, 'Instalación de ductos principal', '40.00', NULL, NULL, 'PROY-2024-001'),
  (2, 'Montaje de equipos HVAC', '20.00', NULL, NULL, 'PROY-2024-001'),
  (3, 'Conexión unidades exteriores', '60.00', NULL, NULL, 'PROY-2024-002'),
  (4, 'Pruebas de presión y hermeticidad', '0.00', NULL, NULL, 'PROY-2024-002');

-- GUIA_DESPACHO (2 registros)
INSERT INTO `GUIA_DESPACHO` (`guia_despacho_id`, `guia_despacho_numero`, `guia_despacho_fecha`, `guia_despacho_estado`, `guia_despacho_ubicacion_verificada`, `guia_despacho_latitud_recepcion`, `guia_despacho_longitud_recepcion`, `guia_despacho_cantidad_recibida`, `orden_compra_id`, `proveedor_rut`, `material_id`, `factura_id`) VALUES
  (1, 'GD-2024-001', '2024-06-15', 'Pendiente', 0, NULL, NULL, NULL, 1, NULL, NULL, NULL),
  (2, 'GD-2024-002', '2024-06-16', 'Pendiente', 0, NULL, NULL, NULL, 2, NULL, NULL, NULL);

-- PARAMETRO_SISTEMA (4 registros)
INSERT INTO `PARAMETRO_SISTEMA` (`parametro_sistema_clave_parametro`, `parametro_sistema_valor_numerico`, `parametro_sistema_fecha_vigencia`) VALUES
  ('iva_porcentaje', '19.00', '2026-11-15'),
  ('radio_recepcion_metros', '500.00', '2026-11-15'),
  ('retencion_honorarios_porcentaje', '15.25', '2026-11-15'),
  ('umbral_desviacion', '10.00', '2026-11-15');

-- PLANTILLA_CORREO (2 registros)
INSERT INTO `PLANTILLA_CORREO` (`plantilla_correo_evento`, `plantilla_correo_nombre`, `plantilla_correo_asunto`, `plantilla_correo_contenido_html`, `plantilla_correo_contenido_texto`, `plantilla_correo_fecha_actualizacion`, `usuario_rut`) VALUES
  ('acta_recepcion', 'Acta de recepción de obra', 'Acta de recepción final — {{obra}}', '<p>Estimado/a {{cliente}}.</p><p>Adjuntamos el acta de recepción final de la obra <strong>{{obra}}</strong> ({{codigo}}), firmada el {{fecha}}.</p><p>La garantía de los equipos instalados rige desde el <strong>{{fecha_garantia}}</strong>.</p><p>Saludos cordiales,<br>ATI Termic SpA</p>', 'Estimado/a {{cliente}}.\n\nAdjuntamos el acta de recepción final de la obra {{obra}} ({{codigo}}), firmada el {{fecha}}.\n\nLa garantía de los equipos instalados rige desde el {{fecha_garantia}}.\n\nSaludos cordiales,\nATI Termic SpA', '2026-11-16 02:09:12', NULL),
  ('recuperacion_credenciales', 'Recuperación de credenciales', 'Recuperación de credenciales — ATI Termic', '<p>Hola {{nombre}}.</p><p>Tu token de recuperación es:</p><p style=\"font-size:22px;font-weight:700;letter-spacing:2px\">{{token}}</p><p><a href=\"{{link}}\">Haz clic aquí para restablecer tu contraseña</a></p><p>Este token vence en {{minutos}} minutos. Si no solicitaste este cambio, ignora este correo.</p>', 'Hola {{nombre}}.\n\nTu token de recuperación es: {{token}}\n\nPara restablecer tu contraseña, entra a: {{link}}\n\nEste token vence en {{minutos}} minutos. Si no solicitaste este cambio, ignora este correo.', '2026-11-16 02:09:12', NULL);

-- SUPERVISOR_TERRENO (1 registro)
INSERT INTO `SUPERVISOR_TERRENO` (`supervisor_terreno_id`, `supervisor_terreno_registro_certificacion`, `supervisor_terreno_telefono_emergencia`, `usuario_rut`) VALUES
  (1, 'CERT-2024-001', '+56912345678', '22222222-2');

SET FOREIGN_KEY_CHECKS = 1;
