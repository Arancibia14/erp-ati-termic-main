-- ============================================================
-- ERP ATI TERMIC SpA - Script DDL (Data Definition Language)
-- Crea la base de datos erp_ati_termic y sus 47 tablas con
-- llaves primarias, llaves foráneas, índices y restricciones de unicidad.
-- Motor InnoDB, MySQL 8.0 o superior, colación utf8mb4_general_ci.
-- Generado el 2026-11-16 desde una base creada por el propio sistema
-- (reset-db.js + migraciones de index.js), por lo que coincide con los modelos.
-- Ejecutar antes que DML_erp_ati_termic.sql.
-- ============================================================

CREATE DATABASE IF NOT EXISTS erp_ati_termic
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;

USE erp_ati_termic;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. ACCIDENTE
DROP TABLE IF EXISTS `ACCIDENTE`;
CREATE TABLE `ACCIDENTE` (
  `accidente_id` int NOT NULL AUTO_INCREMENT,
  `accidente_dias_perdidos` int NOT NULL,
  `accidente_riesgo_potencial` text COLLATE utf8mb4_general_ci NOT NULL,
  `incidente_sso_id` int NOT NULL,
  `trabajador_rut` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `proyecto_codigo_correlativo` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`accidente_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 2. ESTADO_PROYECTO
DROP TABLE IF EXISTS `ESTADO_PROYECTO`;
CREATE TABLE `ESTADO_PROYECTO` (
  `estado_proyecto_id` int NOT NULL AUTO_INCREMENT,
  `estado_proyecto_nombre` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`estado_proyecto_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 3. PROYECTO
DROP TABLE IF EXISTS `PROYECTO`;
CREATE TABLE `PROYECTO` (
  `proyecto_codigo_correlativo` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `proyecto_nombre_obra` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `proyecto_porcentaje_avance` decimal(5,2) NOT NULL DEFAULT '0.00',
  `proyecto_presupuesto_asignado` decimal(15,2) NOT NULL,
  `proyecto_correo_contacto` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `estado_proyecto_id` int NOT NULL,
  `proyecto_descripcion_tecnica` text COLLATE utf8mb4_general_ci,
  `proyecto_tipo_sistema` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `proyecto_ubicacion` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `proyecto_latitud` decimal(10,7) DEFAULT NULL,
  `proyecto_longitud` decimal(10,7) DEFAULT NULL,
  `proyecto_fecha_inicio` date DEFAULT NULL,
  `proyecto_fecha_termino` date DEFAULT NULL,
  `proyecto_presupuesto_caja_chica` decimal(15,2) NOT NULL DEFAULT '0.00',
  `proyecto_archivado` tinyint(1) NOT NULL DEFAULT '0',
  `proyecto_fecha_archivado` date DEFAULT NULL,
  PRIMARY KEY (`proyecto_codigo_correlativo`),
  KEY `estado_proyecto_id` (`estado_proyecto_id`),
  CONSTRAINT `proyecto_ibfk_1` FOREIGN KEY (`estado_proyecto_id`) REFERENCES `ESTADO_PROYECTO` (`estado_proyecto_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 4. USUARIO
DROP TABLE IF EXISTS `USUARIO`;
CREATE TABLE `USUARIO` (
  `usuario_rut` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `usuario_nombre` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `usuario_correo_institucional` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `usuario_password_hash` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`usuario_rut`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 5. ACTA_RECEPCION
DROP TABLE IF EXISTS `ACTA_RECEPCION`;
CREATE TABLE `ACTA_RECEPCION` (
  `acta_recepcion_id` int NOT NULL AUTO_INCREMENT,
  `proyecto_codigo_correlativo` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `acta_recepcion_fecha_hora` datetime NOT NULL,
  `acta_recepcion_cliente_nombre` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `acta_recepcion_cliente_rut` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `acta_recepcion_cliente_cargo` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `acta_recepcion_cliente_correo` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `acta_recepcion_trabajos` text COLLATE utf8mb4_general_ci NOT NULL,
  `acta_recepcion_conformidad` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `acta_recepcion_observaciones` text COLLATE utf8mb4_general_ci,
  `acta_recepcion_firma_cliente` longtext COLLATE utf8mb4_general_ci NOT NULL,
  `acta_recepcion_url_pdf` text COLLATE utf8mb4_general_ci,
  `acta_recepcion_estado` varchar(20) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'Firmada',
  `acta_recepcion_motivo_anulacion` text COLLATE utf8mb4_general_ci,
  `acta_recepcion_fecha_anulacion` datetime DEFAULT NULL,
  `usuario_rut` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`acta_recepcion_id`),
  KEY `proyecto_codigo_correlativo` (`proyecto_codigo_correlativo`),
  KEY `usuario_rut` (`usuario_rut`),
  CONSTRAINT `acta_recepcion_ibfk_1` FOREIGN KEY (`proyecto_codigo_correlativo`) REFERENCES `PROYECTO` (`proyecto_codigo_correlativo`),
  CONSTRAINT `acta_recepcion_ibfk_2` FOREIGN KEY (`usuario_rut`) REFERENCES `USUARIO` (`usuario_rut`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 6. MATERIAL
DROP TABLE IF EXISTS `MATERIAL`;
CREATE TABLE `MATERIAL` (
  `material_id` int NOT NULL AUTO_INCREMENT,
  `material_sku` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `material_nombre` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `material_descripcion` text COLLATE utf8mb4_general_ci,
  `material_unidad_medida` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `material_categoria` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `material_stock_actual` decimal(15,2) NOT NULL DEFAULT '0.00',
  `material_activo` tinyint(1) NOT NULL DEFAULT '1',
  `material_proveedor_rut` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`material_id`),
  UNIQUE KEY `material_sku` (`material_sku`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 7. ACTA_RECEPCION_MATERIAL
DROP TABLE IF EXISTS `ACTA_RECEPCION_MATERIAL`;
CREATE TABLE `ACTA_RECEPCION_MATERIAL` (
  `acta_recepcion_material_id` int NOT NULL AUTO_INCREMENT,
  `acta_recepcion_id` int NOT NULL,
  `material_id` int NOT NULL,
  `acta_recepcion_material_cantidad` decimal(15,2) NOT NULL,
  PRIMARY KEY (`acta_recepcion_material_id`),
  KEY `acta_recepcion_id` (`acta_recepcion_id`),
  KEY `material_id` (`material_id`),
  CONSTRAINT `acta_recepcion_material_ibfk_1` FOREIGN KEY (`acta_recepcion_id`) REFERENCES `ACTA_RECEPCION` (`acta_recepcion_id`),
  CONSTRAINT `acta_recepcion_material_ibfk_2` FOREIGN KEY (`material_id`) REFERENCES `MATERIAL` (`material_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 8. ADMINISTRADOR
DROP TABLE IF EXISTS `ADMINISTRADOR`;
CREATE TABLE `ADMINISTRADOR` (
  `administrador_id` int NOT NULL AUTO_INCREMENT,
  `administrador_nivel_acceso` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `administrador_fecha_asignacion` datetime NOT NULL,
  `usuario_rut` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`administrador_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 9. ASIGNACION_HERRAMIENTA
DROP TABLE IF EXISTS `ASIGNACION_HERRAMIENTA`;
CREATE TABLE `ASIGNACION_HERRAMIENTA` (
  `asignacion_herramienta_id` int NOT NULL AUTO_INCREMENT,
  `herramienta_id` int NOT NULL,
  `trabajador_rut` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `asignacion_herramienta_fecha_entrega` date NOT NULL,
  `asignacion_herramienta_fecha_devolucion` date DEFAULT NULL,
  `asignacion_herramienta_estado_entrega` varchar(120) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `asignacion_herramienta_estado_devolucion` varchar(120) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `asignacion_herramienta_usuario_rut` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`asignacion_herramienta_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 10. AVISO
DROP TABLE IF EXISTS `AVISO`;
CREATE TABLE `AVISO` (
  `aviso_id` int NOT NULL AUTO_INCREMENT,
  `aviso_titulo` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `aviso_texto` varchar(500) COLLATE utf8mb4_general_ci NOT NULL,
  `aviso_url_imagen` text COLLATE utf8mb4_general_ci,
  `aviso_estado` varchar(30) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'Borrador',
  `aviso_fecha_inicio` date NOT NULL,
  `aviso_fecha_termino` date NOT NULL,
  `aviso_fecha_creacion` datetime NOT NULL,
  `usuario_rut` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`aviso_id`),
  KEY `usuario_rut` (`usuario_rut`),
  CONSTRAINT `aviso_ibfk_1` FOREIGN KEY (`usuario_rut`) REFERENCES `USUARIO` (`usuario_rut`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 11. BITACORA_COMUNICACION
DROP TABLE IF EXISTS `BITACORA_COMUNICACION`;
CREATE TABLE `BITACORA_COMUNICACION` (
  `bitacora_comunicacion_id` int NOT NULL AUTO_INCREMENT,
  `bitacora_comunicacion_descripcion` text COLLATE utf8mb4_general_ci NOT NULL,
  `bitacora_comunicacion_fecha` date NOT NULL,
  `bitacora_comunicacion_tipo` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `bitacora_comunicacion_participantes` text COLLATE utf8mb4_general_ci,
  `bitacora_comunicacion_url_adjunto` text COLLATE utf8mb4_general_ci,
  `proyecto_codigo_correlativo` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `usuario_rut` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`bitacora_comunicacion_id`),
  KEY `proyecto_codigo_correlativo` (`proyecto_codigo_correlativo`),
  CONSTRAINT `bitacora_comunicacion_ibfk_1` FOREIGN KEY (`proyecto_codigo_correlativo`) REFERENCES `PROYECTO` (`proyecto_codigo_correlativo`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 12. BITACORA_DIARIA
DROP TABLE IF EXISTS `BITACORA_DIARIA`;
CREATE TABLE `BITACORA_DIARIA` (
  `bitacora_diaria_id` int NOT NULL AUTO_INCREMENT,
  `bitacora_diaria_fecha` date NOT NULL,
  `bitacora_diaria_descripcion_actividad` text COLLATE utf8mb4_general_ci NOT NULL,
  `usuario_rut` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `proyecto_codigo_correlativo` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`bitacora_diaria_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 13. CERTIFICADO_CALIDAD
DROP TABLE IF EXISTS `CERTIFICADO_CALIDAD`;
CREATE TABLE `CERTIFICADO_CALIDAD` (
  `certificado_calidad_id` int NOT NULL AUTO_INCREMENT,
  `guia_despacho_id` int NOT NULL,
  `material_id` int DEFAULT NULL,
  `certificado_calidad_numero` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `certificado_calidad_url` text COLLATE utf8mb4_general_ci NOT NULL,
  `certificado_calidad_fecha_emision` date DEFAULT NULL,
  `certificado_calidad_fecha_carga` date NOT NULL,
  `usuario_rut` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`certificado_calidad_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 14. CERTIFICADO_LABORAL
DROP TABLE IF EXISTS `CERTIFICADO_LABORAL`;
CREATE TABLE `CERTIFICADO_LABORAL` (
  `certificado_laboral_id` int NOT NULL AUTO_INCREMENT,
  `proyecto_codigo_correlativo` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `certificado_laboral_periodo` varchar(7) COLLATE utf8mb4_general_ci NOT NULL,
  `certificado_laboral_url_f30` text COLLATE utf8mb4_general_ci,
  `certificado_laboral_url_f30_1` text COLLATE utf8mb4_general_ci,
  `certificado_laboral_fecha_carga` date NOT NULL,
  PRIMARY KEY (`certificado_laboral_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 15. TRABAJADOR
DROP TABLE IF EXISTS `TRABAJADOR`;
CREATE TABLE `TRABAJADOR` (
  `trabajador_rut` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `trabajador_telefono` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `trabajador_nombres` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `trabajador_apellidos` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `trabajador_correo` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `especialidad_id` int NOT NULL,
  `trabajador_activo` tinyint(1) NOT NULL DEFAULT '1',
  `proyecto_codigo_correlativo` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`trabajador_rut`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 16. CONTRATO_LABORAL
DROP TABLE IF EXISTS `CONTRATO_LABORAL`;
CREATE TABLE `CONTRATO_LABORAL` (
  `contrato_laboral_id_contrato` int NOT NULL AUTO_INCREMENT,
  `contrato_laboral_sueldo_base` decimal(15,2) NOT NULL,
  `contrato_laboral_leyes_sociales` decimal(15,2) NOT NULL DEFAULT '0.00',
  `contrato_laboral_fecha_inicio` date NOT NULL,
  `contrato_laboral_fecha_termino` date DEFAULT NULL,
  `trabajador_rut` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `proyecto_codigo_correlativo` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`contrato_laboral_id_contrato`),
  KEY `trabajador_rut` (`trabajador_rut`),
  CONSTRAINT `contrato_laboral_ibfk_1` FOREIGN KEY (`trabajador_rut`) REFERENCES `TRABAJADOR` (`trabajador_rut`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 17. CONTROL_CAMBIO_PPTO
DROP TABLE IF EXISTS `CONTROL_CAMBIO_PPTO`;
CREATE TABLE `CONTROL_CAMBIO_PPTO` (
  `control_cambio_ppto_id` int NOT NULL AUTO_INCREMENT,
  `control_cambio_ppto_fecha` date NOT NULL,
  `control_cambio_ppto_monto_anterior` decimal(15,2) NOT NULL,
  `control_cambio_ppto_monto_nuevo` decimal(15,2) NOT NULL,
  `control_cambio_ppto_motivo` text COLLATE utf8mb4_general_ci NOT NULL,
  `proyecto_codigo_correlativo` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `usuario_rut` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`control_cambio_ppto_id`),
  KEY `proyecto_codigo_correlativo` (`proyecto_codigo_correlativo`),
  CONSTRAINT `control_cambio_ppto_ibfk_1` FOREIGN KEY (`proyecto_codigo_correlativo`) REFERENCES `PROYECTO` (`proyecto_codigo_correlativo`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 18. PROVEEDOR
DROP TABLE IF EXISTS `PROVEEDOR`;
CREATE TABLE `PROVEEDOR` (
  `proveedor_rut` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `proveedor_razon_social` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `proveedor_correo` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `proveedor_telefono` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `proveedor_activo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`proveedor_rut`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 19. SOLICITUD_MATERIAL
DROP TABLE IF EXISTS `SOLICITUD_MATERIAL`;
CREATE TABLE `SOLICITUD_MATERIAL` (
  `solicitud_material_id` int NOT NULL AUTO_INCREMENT,
  `solicitud_material_descripcion` text COLLATE utf8mb4_general_ci NOT NULL,
  `solicitud_material_cantidad` int NOT NULL,
  `solicitud_material_estado` varchar(50) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'pendiente',
  `solicitud_material_fecha` date NOT NULL,
  `proyecto_codigo_correlativo` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `usuario_rut` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `material_id` int DEFAULT NULL,
  PRIMARY KEY (`solicitud_material_id`),
  KEY `proyecto_codigo_correlativo` (`proyecto_codigo_correlativo`),
  CONSTRAINT `solicitud_material_ibfk_1` FOREIGN KEY (`proyecto_codigo_correlativo`) REFERENCES `PROYECTO` (`proyecto_codigo_correlativo`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 20. ORDEN_COMPRA
DROP TABLE IF EXISTS `ORDEN_COMPRA`;
CREATE TABLE `ORDEN_COMPRA` (
  `orden_compra_id` int NOT NULL AUTO_INCREMENT,
  `orden_compra_folio` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `orden_compra_fecha` date NOT NULL,
  `orden_compra_estado` varchar(50) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'Pendiente',
  `proveedor_rut` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `proyecto_codigo_correlativo` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `solicitud_material_id` int NOT NULL,
  `orden_compra_iva_porcentaje` decimal(5,2) DEFAULT NULL,
  PRIMARY KEY (`orden_compra_id`),
  UNIQUE KEY `orden_compra_folio` (`orden_compra_folio`),
  KEY `proveedor_rut` (`proveedor_rut`),
  KEY `solicitud_material_id` (`solicitud_material_id`),
  CONSTRAINT `orden_compra_ibfk_1` FOREIGN KEY (`proveedor_rut`) REFERENCES `PROVEEDOR` (`proveedor_rut`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `orden_compra_ibfk_2` FOREIGN KEY (`solicitud_material_id`) REFERENCES `SOLICITUD_MATERIAL` (`solicitud_material_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 21. DETALLE_ORDEN_COMPRA
DROP TABLE IF EXISTS `DETALLE_ORDEN_COMPRA`;
CREATE TABLE `DETALLE_ORDEN_COMPRA` (
  `detalle_orden_compra_id` int NOT NULL AUTO_INCREMENT,
  `detalle_orden_compra_descripcion_material` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `detalle_orden_compra_cantidad` int NOT NULL,
  `detalle_orden_compra_precio_unitario` decimal(15,2) NOT NULL,
  `orden_compra_id` int NOT NULL,
  `material_id` int DEFAULT NULL,
  PRIMARY KEY (`detalle_orden_compra_id`),
  KEY `orden_compra_id` (`orden_compra_id`),
  CONSTRAINT `detalle_orden_compra_ibfk_1` FOREIGN KEY (`orden_compra_id`) REFERENCES `ORDEN_COMPRA` (`orden_compra_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 22. DETENCION_PROYECTO
DROP TABLE IF EXISTS `DETENCION_PROYECTO`;
CREATE TABLE `DETENCION_PROYECTO` (
  `detencion_proyecto_id` int NOT NULL AUTO_INCREMENT,
  `detencion_proyecto_fecha` date NOT NULL,
  `detencion_proyecto_motivo` text COLLATE utf8mb4_general_ci NOT NULL,
  `proyecto_codigo_correlativo` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `usuario_rut` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`detencion_proyecto_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 23. DEVOLUCION_OBRA
DROP TABLE IF EXISTS `DEVOLUCION_OBRA`;
CREATE TABLE `DEVOLUCION_OBRA` (
  `devolucion_obra_id` int NOT NULL AUTO_INCREMENT,
  `proyecto_codigo_correlativo` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `devolucion_obra_fase` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `material_id` int NOT NULL,
  `devolucion_obra_cantidad` int NOT NULL,
  `devolucion_obra_estado_fisico` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `devolucion_obra_observacion` text COLLATE utf8mb4_general_ci,
  `devolucion_obra_vale` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `devolucion_obra_fecha` date NOT NULL,
  `devolucion_obra_precio_unitario` decimal(15,2) NOT NULL DEFAULT '0.00',
  `devolucion_obra_monto_rebajado` decimal(15,2) NOT NULL DEFAULT '0.00',
  `usuario_rut` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`devolucion_obra_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 24. DOCUMENTO_EQUIPO
DROP TABLE IF EXISTS `DOCUMENTO_EQUIPO`;
CREATE TABLE `DOCUMENTO_EQUIPO` (
  `documento_equipo_id` int NOT NULL AUTO_INCREMENT,
  `modelo_hvac_id` int NOT NULL,
  `documento_equipo_etiqueta` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `documento_equipo_url` text COLLATE utf8mb4_general_ci NOT NULL,
  `documento_equipo_formato` varchar(10) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `documento_equipo_fecha` date DEFAULT NULL,
  PRIMARY KEY (`documento_equipo_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 25. DOCUMENTO_HERRAMIENTA
DROP TABLE IF EXISTS `DOCUMENTO_HERRAMIENTA`;
CREATE TABLE `DOCUMENTO_HERRAMIENTA` (
  `documento_herramienta_id` int NOT NULL AUTO_INCREMENT,
  `herramienta_id` int NOT NULL,
  `documento_herramienta_etiqueta` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `documento_herramienta_url` text COLLATE utf8mb4_general_ci NOT NULL,
  `documento_herramienta_formato` varchar(10) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `documento_herramienta_fecha` date DEFAULT NULL,
  PRIMARY KEY (`documento_herramienta_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 26. DOCUMENTO_LEGAL
DROP TABLE IF EXISTS `DOCUMENTO_LEGAL`;
CREATE TABLE `DOCUMENTO_LEGAL` (
  `documento_legal_id` int NOT NULL AUTO_INCREMENT,
  `documento_legal_tipo` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `documento_legal_url_pdf` text COLLATE utf8mb4_general_ci NOT NULL,
  `documento_legal_fecha_emision` date NOT NULL,
  `documento_legal_fecha_vencimiento` date DEFAULT NULL,
  `documento_legal_estado` varchar(50) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'Vigente',
  `trabajador_rut` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `proyecto_codigo_correlativo` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `equipo_hvac_numero_serie` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`documento_legal_id`),
  KEY `proyecto_codigo_correlativo` (`proyecto_codigo_correlativo`),
  CONSTRAINT `documento_legal_ibfk_1` FOREIGN KEY (`proyecto_codigo_correlativo`) REFERENCES `PROYECTO` (`proyecto_codigo_correlativo`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 27. EGRESO_CAJA_CHICA
DROP TABLE IF EXISTS `EGRESO_CAJA_CHICA`;
CREATE TABLE `EGRESO_CAJA_CHICA` (
  `egreso_caja_chica_id` int NOT NULL AUTO_INCREMENT,
  `egreso_caja_chica_monto` decimal(15,2) NOT NULL,
  `egreso_caja_chica_fecha` date NOT NULL,
  `egreso_caja_chica_concepto` text COLLATE utf8mb4_general_ci NOT NULL,
  `proyecto_codigo_correlativo` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `usuario_rut` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `egreso_caja_chica_monto_neto` decimal(15,2) DEFAULT NULL,
  `egreso_caja_chica_iva_porcentaje` decimal(5,2) DEFAULT NULL,
  `egreso_caja_chica_url_comprobante` text COLLATE utf8mb4_general_ci,
  PRIMARY KEY (`egreso_caja_chica_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 28. ENTREGA_EPP
DROP TABLE IF EXISTS `ENTREGA_EPP`;
CREATE TABLE `ENTREGA_EPP` (
  `entrega_epp_id` int NOT NULL AUTO_INCREMENT,
  `entrega_epp_cantidad` int NOT NULL,
  `entrega_epp_fecha_entrega` date NOT NULL,
  `entrega_epp_estado` varchar(50) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'Pendiente',
  `entrega_epp_lote` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `entrega_epp_firma` longtext COLLATE utf8mb4_general_ci,
  `entrega_epp_fecha_hora_validacion` datetime DEFAULT NULL,
  `entrega_epp_url_comprobante` text COLLATE utf8mb4_general_ci,
  `material_id` int NOT NULL,
  `trabajador_rut` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `usuario_rut` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`entrega_epp_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 29. EQUIPO_HVAC
DROP TABLE IF EXISTS `EQUIPO_HVAC`;
CREATE TABLE `EQUIPO_HVAC` (
  `equipo_hvac_numero_serie` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `equipo_hvac_fecha_instalacion` date NOT NULL,
  `equipo_hvac_estado_operativo` varchar(50) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'Operativo',
  `modelo_hvac_id` int NOT NULL,
  `proyecto_codigo_correlativo` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`equipo_hvac_numero_serie`),
  KEY `proyecto_codigo_correlativo` (`proyecto_codigo_correlativo`),
  CONSTRAINT `equipo_hvac_ibfk_1` FOREIGN KEY (`proyecto_codigo_correlativo`) REFERENCES `PROYECTO` (`proyecto_codigo_correlativo`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 30. ESPECIALIDAD
DROP TABLE IF EXISTS `ESPECIALIDAD`;
CREATE TABLE `ESPECIALIDAD` (
  `especialidad_id` int NOT NULL AUTO_INCREMENT,
  `especialidad_nombre` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`especialidad_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 31. HITO_TECNICO
DROP TABLE IF EXISTS `HITO_TECNICO`;
CREATE TABLE `HITO_TECNICO` (
  `hito_tecnico_id` int NOT NULL AUTO_INCREMENT,
  `hito_tecnico_nombre_hito` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `hito_tecnico_avance_fisico` decimal(5,2) NOT NULL DEFAULT '0.00',
  `hito_tecnico_fecha_inicio_estimada` date DEFAULT NULL,
  `hito_tecnico_fecha_termino_estimada` date DEFAULT NULL,
  `proyecto_codigo_correlativo` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`hito_tecnico_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 32. EVIDENCIA_FOTOGRAFICA
DROP TABLE IF EXISTS `EVIDENCIA_FOTOGRAFICA`;
CREATE TABLE `EVIDENCIA_FOTOGRAFICA` (
  `evidencia_fotografica_nro` int NOT NULL AUTO_INCREMENT,
  `evidencia_fotografica_url_foto` text COLLATE utf8mb4_general_ci NOT NULL,
  `evidencia_fotografica_fecha_captura` datetime NOT NULL,
  `evidencia_fotografica_latitud` decimal(10,7) NOT NULL,
  `evidencia_fotografica_longitud` decimal(10,7) NOT NULL,
  `evidencia_fotografica_estado_aprobacion` varchar(50) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'pendiente',
  `hito_tecnico_id` int NOT NULL,
  `evidencia_fotografica_usuario_rut` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`evidencia_fotografica_nro`),
  KEY `hito_tecnico_id` (`hito_tecnico_id`),
  CONSTRAINT `evidencia_fotografica_ibfk_1` FOREIGN KEY (`hito_tecnico_id`) REFERENCES `HITO_TECNICO` (`hito_tecnico_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 33. FACTURA
DROP TABLE IF EXISTS `FACTURA`;
CREATE TABLE `FACTURA` (
  `factura_id` int NOT NULL AUTO_INCREMENT,
  `factura_folio` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `factura_monto_total` decimal(15,2) NOT NULL,
  `factura_fecha` date NOT NULL,
  `factura_url_pdf` text COLLATE utf8mb4_general_ci,
  `orden_compra_id` int NOT NULL,
  PRIMARY KEY (`factura_id`),
  UNIQUE KEY `factura_folio` (`factura_folio`),
  KEY `orden_compra_id` (`orden_compra_id`),
  CONSTRAINT `factura_ibfk_1` FOREIGN KEY (`orden_compra_id`) REFERENCES `ORDEN_COMPRA` (`orden_compra_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 34. GUIA_DESPACHO
DROP TABLE IF EXISTS `GUIA_DESPACHO`;
CREATE TABLE `GUIA_DESPACHO` (
  `guia_despacho_id` int NOT NULL AUTO_INCREMENT,
  `guia_despacho_numero` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `guia_despacho_fecha` date NOT NULL,
  `guia_despacho_estado` varchar(50) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'Pendiente',
  `guia_despacho_ubicacion_verificada` tinyint(1) NOT NULL DEFAULT '0',
  `guia_despacho_latitud_recepcion` decimal(10,7) DEFAULT NULL,
  `guia_despacho_longitud_recepcion` decimal(10,7) DEFAULT NULL,
  `guia_despacho_cantidad_recibida` int DEFAULT NULL,
  `orden_compra_id` int DEFAULT NULL,
  `proveedor_rut` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `material_id` int DEFAULT NULL,
  `factura_id` int DEFAULT NULL,
  PRIMARY KEY (`guia_despacho_id`),
  UNIQUE KEY `guia_despacho_numero` (`guia_despacho_numero`),
  KEY `orden_compra_id` (`orden_compra_id`),
  KEY `factura_id` (`factura_id`),
  CONSTRAINT `guia_despacho_ibfk_1` FOREIGN KEY (`orden_compra_id`) REFERENCES `ORDEN_COMPRA` (`orden_compra_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `guia_despacho_ibfk_2` FOREIGN KEY (`factura_id`) REFERENCES `FACTURA` (`factura_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 35. HERRAMIENTA
DROP TABLE IF EXISTS `HERRAMIENTA`;
CREATE TABLE `HERRAMIENTA` (
  `herramienta_id` int NOT NULL AUTO_INCREMENT,
  `herramienta_codigo` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `herramienta_nombre` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `herramienta_estado` varchar(30) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'Disponible',
  `herramienta_tecnico_rut` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`herramienta_id`),
  UNIQUE KEY `herramienta_codigo` (`herramienta_codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 36. INCIDENTE_SSO
DROP TABLE IF EXISTS `INCIDENTE_SSO`;
CREATE TABLE `INCIDENTE_SSO` (
  `incidente_sso_id` int NOT NULL AUTO_INCREMENT,
  `incidente_sso_descripcion` text COLLATE utf8mb4_general_ci NOT NULL,
  `incidente_sso_fecha_hora` datetime NOT NULL,
  `incidente_sso_gravedad` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `incidente_sso_tipo` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `incidente_sso_lugar` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `incidente_sso_url_fotos` text COLLATE utf8mb4_general_ci,
  `proyecto_codigo_correlativo` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`incidente_sso_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 37. LIQUIDACION_SUELDO
DROP TABLE IF EXISTS `LIQUIDACION_SUELDO`;
CREATE TABLE `LIQUIDACION_SUELDO` (
  `liquidacion_sueldo_id` int NOT NULL AUTO_INCREMENT,
  `trabajador_rut` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `liquidacion_sueldo_periodo` varchar(7) COLLATE utf8mb4_general_ci NOT NULL,
  `liquidacion_sueldo_url_pdf` text COLLATE utf8mb4_general_ci NOT NULL,
  `liquidacion_sueldo_fecha_carga` date NOT NULL,
  PRIMARY KEY (`liquidacion_sueldo_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 38. LOG_AUDITORIA
DROP TABLE IF EXISTS `LOG_AUDITORIA`;
CREATE TABLE `LOG_AUDITORIA` (
  `log_auditoria_id` int NOT NULL AUTO_INCREMENT,
  `log_auditoria_fecha_hora` datetime NOT NULL,
  `log_auditoria_accion` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `log_auditoria_modulo` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `usuario_rut` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `log_auditoria_hash` varchar(64) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`log_auditoria_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 39. LOTE_MATERIAL
DROP TABLE IF EXISTS `LOTE_MATERIAL`;
CREATE TABLE `LOTE_MATERIAL` (
  `lote_material_id` int NOT NULL AUTO_INCREMENT,
  `material_id` int NOT NULL,
  `lote_material_fecha_ingreso` datetime NOT NULL,
  `lote_material_origen` varchar(40) COLLATE utf8mb4_general_ci NOT NULL,
  `lote_material_cantidad_inicial` decimal(15,2) NOT NULL,
  `lote_material_cantidad_disponible` decimal(15,2) NOT NULL,
  `lote_material_costo_unitario` decimal(15,2) NOT NULL DEFAULT '0.00',
  `guia_despacho_id` int DEFAULT NULL,
  `devolucion_obra_id` int DEFAULT NULL,
  PRIMARY KEY (`lote_material_id`),
  KEY `material_id` (`material_id`),
  KEY `guia_despacho_id` (`guia_despacho_id`),
  KEY `devolucion_obra_id` (`devolucion_obra_id`),
  CONSTRAINT `lote_material_ibfk_1` FOREIGN KEY (`material_id`) REFERENCES `MATERIAL` (`material_id`),
  CONSTRAINT `lote_material_ibfk_2` FOREIGN KEY (`guia_despacho_id`) REFERENCES `GUIA_DESPACHO` (`guia_despacho_id`),
  CONSTRAINT `lote_material_ibfk_3` FOREIGN KEY (`devolucion_obra_id`) REFERENCES `DEVOLUCION_OBRA` (`devolucion_obra_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 40. MODELO_HVAC
DROP TABLE IF EXISTS `MODELO_HVAC`;
CREATE TABLE `MODELO_HVAC` (
  `modelo_hvac_id` int NOT NULL AUTO_INCREMENT,
  `modelo_hvac_nombre` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `modelo_hvac_url_ficha` text COLLATE utf8mb4_general_ci,
  `modelo_hvac_url_manual` text COLLATE utf8mb4_general_ci,
  PRIMARY KEY (`modelo_hvac_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 41. NOTIFICACION
DROP TABLE IF EXISTS `NOTIFICACION`;
CREATE TABLE `NOTIFICACION` (
  `notificacion_id` int NOT NULL AUTO_INCREMENT,
  `usuario_rut` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `notificacion_tipo` varchar(30) COLLATE utf8mb4_general_ci NOT NULL,
  `notificacion_titulo` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `notificacion_mensaje` varchar(500) COLLATE utf8mb4_general_ci NOT NULL,
  `notificacion_fecha` datetime NOT NULL,
  `notificacion_leida` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`notificacion_id`),
  KEY `usuario_rut` (`usuario_rut`),
  CONSTRAINT `notificacion_ibfk_1` FOREIGN KEY (`usuario_rut`) REFERENCES `USUARIO` (`usuario_rut`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 42. PARAMETRO_SISTEMA
DROP TABLE IF EXISTS `PARAMETRO_SISTEMA`;
CREATE TABLE `PARAMETRO_SISTEMA` (
  `parametro_sistema_clave_parametro` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `parametro_sistema_valor_numerico` decimal(15,2) NOT NULL,
  `parametro_sistema_fecha_vigencia` date NOT NULL,
  PRIMARY KEY (`parametro_sistema_clave_parametro`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 43. PLANTILLA_CORREO
DROP TABLE IF EXISTS `PLANTILLA_CORREO`;
CREATE TABLE `PLANTILLA_CORREO` (
  `plantilla_correo_evento` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `plantilla_correo_nombre` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `plantilla_correo_asunto` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `plantilla_correo_contenido_html` text COLLATE utf8mb4_general_ci NOT NULL,
  `plantilla_correo_contenido_texto` text COLLATE utf8mb4_general_ci,
  `plantilla_correo_fecha_actualizacion` datetime NOT NULL,
  `usuario_rut` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`plantilla_correo_evento`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 44. PROYECTO_SUBCONTRATISTA
DROP TABLE IF EXISTS `PROYECTO_SUBCONTRATISTA`;
CREATE TABLE `PROYECTO_SUBCONTRATISTA` (
  `proyecto_subcontratista_id` int NOT NULL AUTO_INCREMENT,
  `proyecto_codigo_correlativo` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `proveedor_rut` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `proyecto_subcontratista_rol` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `proyecto_subcontratista_fecha` date NOT NULL,
  PRIMARY KEY (`proyecto_subcontratista_id`),
  UNIQUE KEY `uq_proyecto_subcontratista` (`proyecto_codigo_correlativo`,`proveedor_rut`),
  KEY `proveedor_rut` (`proveedor_rut`),
  CONSTRAINT `proyecto_subcontratista_ibfk_1` FOREIGN KEY (`proyecto_codigo_correlativo`) REFERENCES `PROYECTO` (`proyecto_codigo_correlativo`),
  CONSTRAINT `proyecto_subcontratista_ibfk_2` FOREIGN KEY (`proveedor_rut`) REFERENCES `PROVEEDOR` (`proveedor_rut`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 45. SESION
DROP TABLE IF EXISTS `SESION`;
CREATE TABLE `SESION` (
  `sesion_id` int NOT NULL AUTO_INCREMENT,
  `sesion_fecha_inicio` datetime NOT NULL,
  `sesion_ultima_actividad` datetime NOT NULL,
  `sesion_estado` varchar(20) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'activa',
  `usuario_rut` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`sesion_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 46. SUPERVISOR_TERRENO
DROP TABLE IF EXISTS `SUPERVISOR_TERRENO`;
CREATE TABLE `SUPERVISOR_TERRENO` (
  `supervisor_terreno_id` int NOT NULL AUTO_INCREMENT,
  `supervisor_terreno_registro_certificacion` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `supervisor_terreno_telefono_emergencia` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `usuario_rut` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`supervisor_terreno_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 47. TOKEN_RECUPERACION
DROP TABLE IF EXISTS `TOKEN_RECUPERACION`;
CREATE TABLE `TOKEN_RECUPERACION` (
  `token_recuperacion_id` int NOT NULL AUTO_INCREMENT,
  `token_recuperacion_codigo_hash` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `token_recuperacion_fecha_expiracion` datetime NOT NULL,
  `usuario_rut` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`token_recuperacion_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

SET FOREIGN_KEY_CHECKS = 1;
