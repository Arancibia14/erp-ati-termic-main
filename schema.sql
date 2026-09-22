-- ============================================================
-- ERP ATI TERMIC SpA — Definición de la base de datos (MySQL 8.0+)
--
-- Estructura correspondiente al Modelo Entidad-Relación y al Modelo
-- Relacional del proyecto: 36 tablas, con sus llaves primarias,
-- llaves foráneas y restricciones de unicidad.
--
-- La colación es utf8mb4_general_ci en toda la base. MySQL exige que las
-- dos columnas de una llave foránea compartan colación, y mezclarla con la
-- colación por defecto de MySQL 8 (utf8mb4_0900_ai_ci) impide crear las
-- restricciones.
-- ============================================================

CREATE DATABASE IF NOT EXISTS erp_ati_termic
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;

USE erp_ati_termic;

-- ESPECIALIDAD
CREATE TABLE IF NOT EXISTS ESPECIALIDAD (
    especialidad_id      INT           NOT NULL AUTO_INCREMENT,
    especialidad_nombre  VARCHAR(100)  NOT NULL,
    PRIMARY KEY (especialidad_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ESTADO_PROYECTO
CREATE TABLE IF NOT EXISTS ESTADO_PROYECTO (
    estado_proyecto_id      INT           NOT NULL AUTO_INCREMENT,
    estado_proyecto_nombre  VARCHAR(100)  NOT NULL,
    PRIMARY KEY (estado_proyecto_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- MODELO_HVAC
CREATE TABLE IF NOT EXISTS MODELO_HVAC (
    modelo_hvac_id          INT           NOT NULL AUTO_INCREMENT,
    modelo_hvac_nombre      VARCHAR(255)  NOT NULL,
    modelo_hvac_url_ficha   TEXT          NULL,
    modelo_hvac_url_manual  TEXT          NULL,
    PRIMARY KEY (modelo_hvac_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- PARAMETRO_SISTEMA
CREATE TABLE IF NOT EXISTS PARAMETRO_SISTEMA (
    parametro_sistema_clave_parametro  VARCHAR(100)   NOT NULL,
    parametro_sistema_valor_numerico   DECIMAL(15,2)  NOT NULL,
    parametro_sistema_fecha_vigencia   DATE           NOT NULL,
    PRIMARY KEY (parametro_sistema_clave_parametro)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- PROVEEDOR
CREATE TABLE IF NOT EXISTS PROVEEDOR (
    proveedor_rut           VARCHAR(20)   NOT NULL,
    proveedor_razon_social  VARCHAR(255)  NOT NULL,
    proveedor_correo        VARCHAR(150)  NOT NULL,
    proveedor_telefono      VARCHAR(20)   NULL,
    PRIMARY KEY (proveedor_rut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- PROYECTO
CREATE TABLE IF NOT EXISTS PROYECTO (
    proyecto_codigo_correlativo      VARCHAR(50)    NOT NULL,
    proyecto_nombre_obra             VARCHAR(255)   NOT NULL,
    proyecto_porcentaje_avance       DECIMAL(5,2)   NOT NULL DEFAULT 0,
    proyecto_presupuesto_asignado    DECIMAL(15,2)  NOT NULL,
    proyecto_correo_contacto         VARCHAR(150)   NOT NULL,
    estado_proyecto_id               INT            NOT NULL,
    proveedor_rut                    VARCHAR(20)    NULL,
    proyecto_descripcion_tecnica     TEXT           NULL,
    proyecto_ubicacion               VARCHAR(255)   NULL,
    proyecto_latitud                 DECIMAL(10,7)  NULL,
    proyecto_longitud                DECIMAL(10,7)  NULL,
    proyecto_fecha_inicio            DATE           NULL,
    proyecto_fecha_termino           DATE           NULL,
    proyecto_presupuesto_caja_chica  DECIMAL(15,2)  NOT NULL DEFAULT 0,
    PRIMARY KEY (proyecto_codigo_correlativo),
    CONSTRAINT fk_proyecto_estado_proyecto_id
        FOREIGN KEY (estado_proyecto_id) REFERENCES ESTADO_PROYECTO (estado_proyecto_id),
    CONSTRAINT fk_proyecto_proveedor_rut
        FOREIGN KEY (proveedor_rut) REFERENCES PROVEEDOR (proveedor_rut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- TRABAJADOR
CREATE TABLE IF NOT EXISTS TRABAJADOR (
    trabajador_rut               VARCHAR(20)   NOT NULL,
    trabajador_telefono          VARCHAR(20)   NULL,
    trabajador_nombres           VARCHAR(150)  NOT NULL,
    trabajador_apellidos         VARCHAR(150)  NULL,
    trabajador_correo            VARCHAR(150)  NULL,
    especialidad_id              INT           NOT NULL,
    trabajador_activo            TINYINT(1)    NOT NULL DEFAULT 1,
    proyecto_codigo_correlativo  VARCHAR(50)   NULL,
    PRIMARY KEY (trabajador_rut),
    CONSTRAINT fk_trabajador_especialidad_id
        FOREIGN KEY (especialidad_id) REFERENCES ESPECIALIDAD (especialidad_id),
    CONSTRAINT fk_trabajador_proyecto_codigo_correlativo
        FOREIGN KEY (proyecto_codigo_correlativo) REFERENCES PROYECTO (proyecto_codigo_correlativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- USUARIO
CREATE TABLE IF NOT EXISTS USUARIO (
    usuario_rut                   VARCHAR(20)   NOT NULL,
    usuario_nombre                VARCHAR(100)  NOT NULL,
    usuario_correo_institucional  VARCHAR(150)  NOT NULL,
    usuario_password_hash         VARCHAR(255)  NOT NULL,
    PRIMARY KEY (usuario_rut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ADMINISTRADOR
CREATE TABLE IF NOT EXISTS ADMINISTRADOR (
    administrador_id                INT          NOT NULL AUTO_INCREMENT,
    administrador_nivel_acceso      VARCHAR(50)  NOT NULL,
    administrador_fecha_asignacion  DATETIME     NOT NULL,
    usuario_rut                     VARCHAR(20)  NOT NULL,
    PRIMARY KEY (administrador_id),
    CONSTRAINT fk_administrador_usuario_rut
        FOREIGN KEY (usuario_rut) REFERENCES USUARIO (usuario_rut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- BITACORA_COMUNICACION
CREATE TABLE IF NOT EXISTS BITACORA_COMUNICACION (
    bitacora_comunicacion_id             INT           NOT NULL AUTO_INCREMENT,
    bitacora_comunicacion_descripcion    TEXT          NOT NULL,
    bitacora_comunicacion_fecha          DATE          NOT NULL,
    bitacora_comunicacion_tipo           VARCHAR(100)  NOT NULL,
    bitacora_comunicacion_participantes  TEXT          NULL,
    bitacora_comunicacion_url_adjunto    TEXT          NULL,
    proyecto_codigo_correlativo          VARCHAR(50)   NOT NULL,
    usuario_rut                          VARCHAR(20)   NOT NULL,
    PRIMARY KEY (bitacora_comunicacion_id),
    CONSTRAINT fk_bitacora_comunicacion_proyecto_codigo_correlativo
        FOREIGN KEY (proyecto_codigo_correlativo) REFERENCES PROYECTO (proyecto_codigo_correlativo),
    CONSTRAINT fk_bitacora_comunicacion_usuario_rut
        FOREIGN KEY (usuario_rut) REFERENCES USUARIO (usuario_rut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- BITACORA_DIARIA
CREATE TABLE IF NOT EXISTS BITACORA_DIARIA (
    bitacora_diaria_id                     INT          NOT NULL AUTO_INCREMENT,
    bitacora_diaria_fecha                  DATE         NOT NULL,
    bitacora_diaria_descripcion_actividad  TEXT         NOT NULL,
    usuario_rut                            VARCHAR(20)  NOT NULL,
    proyecto_codigo_correlativo            VARCHAR(50)  NOT NULL,
    PRIMARY KEY (bitacora_diaria_id),
    CONSTRAINT fk_bitacora_diaria_usuario_rut
        FOREIGN KEY (usuario_rut) REFERENCES USUARIO (usuario_rut),
    CONSTRAINT fk_bitacora_diaria_proyecto_codigo_correlativo
        FOREIGN KEY (proyecto_codigo_correlativo) REFERENCES PROYECTO (proyecto_codigo_correlativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- CERTIFICADO_LABORAL
CREATE TABLE IF NOT EXISTS CERTIFICADO_LABORAL (
    certificado_laboral_id           INT          NOT NULL AUTO_INCREMENT,
    proyecto_codigo_correlativo      VARCHAR(50)  NOT NULL,
    certificado_laboral_periodo      VARCHAR(7)   NOT NULL,
    certificado_laboral_url_f30      TEXT         NULL,
    certificado_laboral_url_f30_1    TEXT         NULL,
    certificado_laboral_fecha_carga  DATE         NOT NULL,
    PRIMARY KEY (certificado_laboral_id),
    CONSTRAINT fk_certificado_laboral_proyecto_codigo_correlativo
        FOREIGN KEY (proyecto_codigo_correlativo) REFERENCES PROYECTO (proyecto_codigo_correlativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- CONTRATO_LABORAL
CREATE TABLE IF NOT EXISTS CONTRATO_LABORAL (
    contrato_laboral_id_contrato     INT            NOT NULL AUTO_INCREMENT,
    contrato_laboral_sueldo_base     DECIMAL(15,2)  NOT NULL,
    contrato_laboral_leyes_sociales  DECIMAL(15,2)  NOT NULL DEFAULT 0,
    contrato_laboral_fecha_inicio    DATE           NOT NULL,
    contrato_laboral_fecha_termino   DATE           NULL,
    trabajador_rut                   VARCHAR(20)    NOT NULL,
    proyecto_codigo_correlativo      VARCHAR(50)    NULL,
    PRIMARY KEY (contrato_laboral_id_contrato),
    CONSTRAINT fk_contrato_laboral_trabajador_rut
        FOREIGN KEY (trabajador_rut) REFERENCES TRABAJADOR (trabajador_rut),
    CONSTRAINT fk_contrato_laboral_proyecto_codigo_correlativo
        FOREIGN KEY (proyecto_codigo_correlativo) REFERENCES PROYECTO (proyecto_codigo_correlativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- CONTROL_CAMBIO_PPTO
CREATE TABLE IF NOT EXISTS CONTROL_CAMBIO_PPTO (
    control_cambio_ppto_id              INT            NOT NULL AUTO_INCREMENT,
    control_cambio_ppto_fecha           DATE           NOT NULL,
    control_cambio_ppto_monto_anterior  DECIMAL(15,2)  NOT NULL,
    control_cambio_ppto_monto_nuevo     DECIMAL(15,2)  NOT NULL,
    control_cambio_ppto_motivo          TEXT           NOT NULL,
    proyecto_codigo_correlativo         VARCHAR(50)    NOT NULL,
    usuario_rut                         VARCHAR(20)    NOT NULL,
    PRIMARY KEY (control_cambio_ppto_id),
    CONSTRAINT fk_control_cambio_ppto_proyecto_codigo_correlativo
        FOREIGN KEY (proyecto_codigo_correlativo) REFERENCES PROYECTO (proyecto_codigo_correlativo),
    CONSTRAINT fk_control_cambio_ppto_usuario_rut
        FOREIGN KEY (usuario_rut) REFERENCES USUARIO (usuario_rut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- DOCUMENTO_EQUIPO
CREATE TABLE IF NOT EXISTS DOCUMENTO_EQUIPO (
    documento_equipo_id        INT           NOT NULL AUTO_INCREMENT,
    modelo_hvac_id             INT           NOT NULL,
    documento_equipo_etiqueta  VARCHAR(150)  NOT NULL,
    documento_equipo_url       TEXT          NOT NULL,
    documento_equipo_formato   VARCHAR(10)   NULL,
    documento_equipo_fecha     DATE          NULL,
    PRIMARY KEY (documento_equipo_id),
    CONSTRAINT fk_documento_equipo_modelo_hvac_id
        FOREIGN KEY (modelo_hvac_id) REFERENCES MODELO_HVAC (modelo_hvac_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- DOCUMENTO_LEGAL
CREATE TABLE IF NOT EXISTS DOCUMENTO_LEGAL (
    documento_legal_id                 INT           NOT NULL AUTO_INCREMENT,
    documento_legal_tipo               VARCHAR(100)  NOT NULL,
    documento_legal_url_pdf            TEXT          NOT NULL,
    documento_legal_fecha_emision      DATE          NOT NULL,
    documento_legal_fecha_vencimiento  DATE          NULL,
    documento_legal_estado             VARCHAR(50)   NOT NULL DEFAULT 'Vigente',
    trabajador_rut                     VARCHAR(20)   NULL,
    proyecto_codigo_correlativo        VARCHAR(50)   NULL,
    PRIMARY KEY (documento_legal_id),
    CONSTRAINT fk_documento_legal_trabajador_rut
        FOREIGN KEY (trabajador_rut) REFERENCES TRABAJADOR (trabajador_rut),
    CONSTRAINT fk_documento_legal_proyecto_codigo_correlativo
        FOREIGN KEY (proyecto_codigo_correlativo) REFERENCES PROYECTO (proyecto_codigo_correlativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- EGRESO_CAJA_CHICA
CREATE TABLE IF NOT EXISTS EGRESO_CAJA_CHICA (
    egreso_caja_chica_id         INT            NOT NULL AUTO_INCREMENT,
    egreso_caja_chica_monto      DECIMAL(15,2)  NOT NULL,
    egreso_caja_chica_fecha      DATE           NOT NULL,
    egreso_caja_chica_concepto   TEXT           NOT NULL,
    proyecto_codigo_correlativo  VARCHAR(50)    NOT NULL,
    usuario_rut                  VARCHAR(20)    NULL,
    PRIMARY KEY (egreso_caja_chica_id),
    CONSTRAINT fk_egreso_caja_chica_proyecto_codigo_correlativo
        FOREIGN KEY (proyecto_codigo_correlativo) REFERENCES PROYECTO (proyecto_codigo_correlativo),
    CONSTRAINT fk_egreso_caja_chica_usuario_rut
        FOREIGN KEY (usuario_rut) REFERENCES USUARIO (usuario_rut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- EQUIPO_HVAC
CREATE TABLE IF NOT EXISTS EQUIPO_HVAC (
    equipo_hvac_numero_serie       VARCHAR(100)  NOT NULL,
    equipo_hvac_fecha_instalacion  DATE          NOT NULL,
    equipo_hvac_estado_operativo   VARCHAR(50)   NOT NULL DEFAULT 'Operativo',
    modelo_hvac_id                 INT           NOT NULL,
    proyecto_codigo_correlativo    VARCHAR(50)   NOT NULL,
    PRIMARY KEY (equipo_hvac_numero_serie),
    CONSTRAINT fk_equipo_hvac_modelo_hvac_id
        FOREIGN KEY (modelo_hvac_id) REFERENCES MODELO_HVAC (modelo_hvac_id),
    CONSTRAINT fk_equipo_hvac_proyecto_codigo_correlativo
        FOREIGN KEY (proyecto_codigo_correlativo) REFERENCES PROYECTO (proyecto_codigo_correlativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- HERRAMIENTA
CREATE TABLE IF NOT EXISTS HERRAMIENTA (
    herramienta_id           INT           NOT NULL AUTO_INCREMENT,
    herramienta_codigo       VARCHAR(50)   NOT NULL,
    herramienta_nombre       VARCHAR(150)  NOT NULL,
    herramienta_estado       VARCHAR(30)   NOT NULL DEFAULT 'Disponible',
    herramienta_tecnico_rut  VARCHAR(20)   NULL,
    PRIMARY KEY (herramienta_id),
    UNIQUE KEY uq_herramienta_herramienta_codigo (herramienta_codigo),
    CONSTRAINT fk_herramienta_herramienta_tecnico_rut
        FOREIGN KEY (herramienta_tecnico_rut) REFERENCES TRABAJADOR (trabajador_rut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- HITO_TECNICO
CREATE TABLE IF NOT EXISTS HITO_TECNICO (
    hito_tecnico_id              INT           NOT NULL AUTO_INCREMENT,
    hito_tecnico_nombre_hito     VARCHAR(255)  NOT NULL,
    hito_tecnico_avance_fisico   DECIMAL(5,2)  NOT NULL DEFAULT 0,
    proyecto_codigo_correlativo  VARCHAR(50)   NOT NULL,
    PRIMARY KEY (hito_tecnico_id),
    CONSTRAINT fk_hito_tecnico_proyecto_codigo_correlativo
        FOREIGN KEY (proyecto_codigo_correlativo) REFERENCES PROYECTO (proyecto_codigo_correlativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- INCIDENTE_SSO
CREATE TABLE IF NOT EXISTS INCIDENTE_SSO (
    incidente_sso_id             INT           NOT NULL AUTO_INCREMENT,
    incidente_sso_descripcion    TEXT          NOT NULL,
    incidente_sso_fecha_hora     DATETIME      NOT NULL,
    incidente_sso_gravedad       VARCHAR(50)   NOT NULL,
    incidente_sso_tipo           VARCHAR(50)   NULL,
    incidente_sso_lugar          VARCHAR(255)  NULL,
    incidente_sso_url_fotos      TEXT          NULL,
    proyecto_codigo_correlativo  VARCHAR(50)   NOT NULL,
    PRIMARY KEY (incidente_sso_id),
    CONSTRAINT fk_incidente_sso_proyecto_codigo_correlativo
        FOREIGN KEY (proyecto_codigo_correlativo) REFERENCES PROYECTO (proyecto_codigo_correlativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- LIQUIDACION_SUELDO
CREATE TABLE IF NOT EXISTS LIQUIDACION_SUELDO (
    liquidacion_sueldo_id           INT          NOT NULL AUTO_INCREMENT,
    trabajador_rut                  VARCHAR(20)  NOT NULL,
    liquidacion_sueldo_periodo      VARCHAR(7)   NOT NULL,
    liquidacion_sueldo_url_pdf      TEXT         NOT NULL,
    liquidacion_sueldo_fecha_carga  DATE         NOT NULL,
    PRIMARY KEY (liquidacion_sueldo_id),
    CONSTRAINT fk_liquidacion_sueldo_trabajador_rut
        FOREIGN KEY (trabajador_rut) REFERENCES TRABAJADOR (trabajador_rut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- LOG_AUDITORIA
CREATE TABLE IF NOT EXISTS LOG_AUDITORIA (
    log_auditoria_id          INT           NOT NULL AUTO_INCREMENT,
    log_auditoria_fecha_hora  DATETIME      NOT NULL,
    log_auditoria_accion      VARCHAR(255)  NOT NULL,
    log_auditoria_modulo      VARCHAR(100)  NOT NULL,
    usuario_rut               VARCHAR(20)   NOT NULL,
    PRIMARY KEY (log_auditoria_id),
    CONSTRAINT fk_log_auditoria_usuario_rut
        FOREIGN KEY (usuario_rut) REFERENCES USUARIO (usuario_rut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- MATERIAL
CREATE TABLE IF NOT EXISTS MATERIAL (
    material_id             INT            NOT NULL AUTO_INCREMENT,
    material_sku            VARCHAR(100)   NOT NULL,
    material_nombre         VARCHAR(255)   NOT NULL,
    material_descripcion    TEXT           NULL,
    material_unidad_medida  VARCHAR(50)    NOT NULL,
    material_categoria      VARCHAR(100)   NULL,
    material_stock_actual   DECIMAL(15,2)  NOT NULL DEFAULT 0,
    material_activo         TINYINT(1)     NOT NULL DEFAULT 1,
    material_proveedor_rut  VARCHAR(20)    NULL,
    PRIMARY KEY (material_id),
    UNIQUE KEY uq_material_material_sku (material_sku),
    CONSTRAINT fk_material_material_proveedor_rut
        FOREIGN KEY (material_proveedor_rut) REFERENCES PROVEEDOR (proveedor_rut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- SOLICITUD_MATERIAL
CREATE TABLE IF NOT EXISTS SOLICITUD_MATERIAL (
    solicitud_material_id           INT          NOT NULL AUTO_INCREMENT,
    solicitud_material_descripcion  TEXT         NOT NULL,
    solicitud_material_cantidad     INT          NOT NULL,
    solicitud_material_estado       VARCHAR(50)  NOT NULL DEFAULT 'pendiente',
    solicitud_material_fecha        DATE         NOT NULL,
    proyecto_codigo_correlativo     VARCHAR(50)  NOT NULL,
    usuario_rut                     VARCHAR(20)  NULL,
    material_id                     INT          NULL,
    PRIMARY KEY (solicitud_material_id),
    CONSTRAINT fk_solicitud_material_proyecto_codigo_correlativo
        FOREIGN KEY (proyecto_codigo_correlativo) REFERENCES PROYECTO (proyecto_codigo_correlativo),
    CONSTRAINT fk_solicitud_material_usuario_rut
        FOREIGN KEY (usuario_rut) REFERENCES USUARIO (usuario_rut),
    CONSTRAINT fk_solicitud_material_material_id
        FOREIGN KEY (material_id) REFERENCES MATERIAL (material_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- SUPERVISOR_TERRENO
CREATE TABLE IF NOT EXISTS SUPERVISOR_TERRENO (
    supervisor_terreno_id                      INT           NOT NULL AUTO_INCREMENT,
    supervisor_terreno_registro_certificacion  VARCHAR(100)  NOT NULL,
    supervisor_terreno_telefono_emergencia     VARCHAR(20)   NOT NULL,
    usuario_rut                                VARCHAR(20)   NOT NULL,
    PRIMARY KEY (supervisor_terreno_id),
    CONSTRAINT fk_supervisor_terreno_usuario_rut
        FOREIGN KEY (usuario_rut) REFERENCES USUARIO (usuario_rut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ACCIDENTE
CREATE TABLE IF NOT EXISTS ACCIDENTE (
    accidente_id                 INT          NOT NULL AUTO_INCREMENT,
    accidente_dias_perdidos      INT          NOT NULL,
    accidente_riesgo_potencial   TEXT         NOT NULL,
    incidente_sso_id             INT          NOT NULL,
    trabajador_rut               VARCHAR(20)  NOT NULL,
    proyecto_codigo_correlativo  VARCHAR(50)  NOT NULL,
    PRIMARY KEY (accidente_id),
    CONSTRAINT fk_accidente_incidente_sso_id
        FOREIGN KEY (incidente_sso_id) REFERENCES INCIDENTE_SSO (incidente_sso_id),
    CONSTRAINT fk_accidente_trabajador_rut
        FOREIGN KEY (trabajador_rut) REFERENCES TRABAJADOR (trabajador_rut),
    CONSTRAINT fk_accidente_proyecto_codigo_correlativo
        FOREIGN KEY (proyecto_codigo_correlativo) REFERENCES PROYECTO (proyecto_codigo_correlativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ASIGNACION_HERRAMIENTA
CREATE TABLE IF NOT EXISTS ASIGNACION_HERRAMIENTA (
    asignacion_herramienta_id                 INT           NOT NULL AUTO_INCREMENT,
    herramienta_id                            INT           NOT NULL,
    trabajador_rut                            VARCHAR(20)   NOT NULL,
    asignacion_herramienta_fecha_entrega      DATE          NOT NULL,
    asignacion_herramienta_fecha_devolucion   DATE          NULL,
    asignacion_herramienta_estado_entrega     VARCHAR(120)  NULL,
    asignacion_herramienta_estado_devolucion  VARCHAR(120)  NULL,
    asignacion_herramienta_usuario_rut        VARCHAR(20)   NULL,
    PRIMARY KEY (asignacion_herramienta_id),
    CONSTRAINT fk_asignacion_herramienta_herramienta_id
        FOREIGN KEY (herramienta_id) REFERENCES HERRAMIENTA (herramienta_id),
    CONSTRAINT fk_asignacion_herramienta_trabajador_rut
        FOREIGN KEY (trabajador_rut) REFERENCES TRABAJADOR (trabajador_rut),
    CONSTRAINT fk_asignacion_herramienta_asignacion_herramienta_usuario_rut
        FOREIGN KEY (asignacion_herramienta_usuario_rut) REFERENCES USUARIO (usuario_rut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- DEVOLUCION_OBRA
CREATE TABLE IF NOT EXISTS DEVOLUCION_OBRA (
    devolucion_obra_id               INT            NOT NULL AUTO_INCREMENT,
    proyecto_codigo_correlativo      VARCHAR(50)    NOT NULL,
    devolucion_obra_fase             VARCHAR(150)   NULL,
    material_id                      INT            NOT NULL,
    devolucion_obra_cantidad         INT            NOT NULL,
    devolucion_obra_estado_fisico    VARCHAR(50)    NULL,
    devolucion_obra_observacion      TEXT           NULL,
    devolucion_obra_vale             VARCHAR(50)    NULL,
    devolucion_obra_fecha            DATE           NOT NULL,
    devolucion_obra_precio_unitario  DECIMAL(15,2)  NOT NULL DEFAULT 0,
    devolucion_obra_monto_rebajado   DECIMAL(15,2)  NOT NULL DEFAULT 0,
    usuario_rut                      VARCHAR(20)    NULL,
    PRIMARY KEY (devolucion_obra_id),
    CONSTRAINT fk_devolucion_obra_proyecto_codigo_correlativo
        FOREIGN KEY (proyecto_codigo_correlativo) REFERENCES PROYECTO (proyecto_codigo_correlativo),
    CONSTRAINT fk_devolucion_obra_material_id
        FOREIGN KEY (material_id) REFERENCES MATERIAL (material_id),
    CONSTRAINT fk_devolucion_obra_usuario_rut
        FOREIGN KEY (usuario_rut) REFERENCES USUARIO (usuario_rut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ENTREGA_EPP
CREATE TABLE IF NOT EXISTS ENTREGA_EPP (
    entrega_epp_id                     INT          NOT NULL AUTO_INCREMENT,
    entrega_epp_cantidad               INT          NOT NULL,
    entrega_epp_fecha_entrega          DATE         NOT NULL,
    entrega_epp_estado                 VARCHAR(50)  NOT NULL DEFAULT 'Pendiente',
    entrega_epp_lote                   VARCHAR(50)  NULL,
    entrega_epp_firma                  LONGTEXT     NULL,
    entrega_epp_fecha_hora_validacion  DATETIME     NULL,
    entrega_epp_url_comprobante        TEXT         NULL,
    material_id                        INT          NOT NULL,
    trabajador_rut                     VARCHAR(20)  NOT NULL,
    usuario_rut                        VARCHAR(20)  NOT NULL,
    PRIMARY KEY (entrega_epp_id),
    CONSTRAINT fk_entrega_epp_material_id
        FOREIGN KEY (material_id) REFERENCES MATERIAL (material_id),
    CONSTRAINT fk_entrega_epp_trabajador_rut
        FOREIGN KEY (trabajador_rut) REFERENCES TRABAJADOR (trabajador_rut),
    CONSTRAINT fk_entrega_epp_usuario_rut
        FOREIGN KEY (usuario_rut) REFERENCES USUARIO (usuario_rut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- EVIDENCIA_FOTOGRAFICA
CREATE TABLE IF NOT EXISTS EVIDENCIA_FOTOGRAFICA (
    evidencia_fotografica_nro                INT            NOT NULL AUTO_INCREMENT,
    evidencia_fotografica_url_foto           TEXT           NOT NULL,
    evidencia_fotografica_fecha_captura      DATETIME       NOT NULL,
    evidencia_fotografica_latitud            DECIMAL(10,7)  NOT NULL,
    evidencia_fotografica_longitud           DECIMAL(10,7)  NOT NULL,
    evidencia_fotografica_estado_aprobacion  VARCHAR(50)    NOT NULL DEFAULT 'pendiente',
    hito_tecnico_id                          INT            NOT NULL,
    PRIMARY KEY (evidencia_fotografica_nro),
    CONSTRAINT fk_evidencia_fotografica_hito_tecnico_id
        FOREIGN KEY (hito_tecnico_id) REFERENCES HITO_TECNICO (hito_tecnico_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ORDEN_COMPRA
CREATE TABLE IF NOT EXISTS ORDEN_COMPRA (
    orden_compra_id              INT          NOT NULL AUTO_INCREMENT,
    orden_compra_folio           VARCHAR(50)  NOT NULL,
    orden_compra_fecha           DATE         NOT NULL,
    orden_compra_estado          VARCHAR(50)  NOT NULL DEFAULT 'Pendiente',
    proveedor_rut                VARCHAR(20)  NOT NULL,
    proyecto_codigo_correlativo  VARCHAR(50)  NOT NULL,
    solicitud_material_id        INT          NOT NULL,
    PRIMARY KEY (orden_compra_id),
    UNIQUE KEY uq_orden_compra_orden_compra_folio (orden_compra_folio),
    CONSTRAINT fk_orden_compra_proveedor_rut
        FOREIGN KEY (proveedor_rut) REFERENCES PROVEEDOR (proveedor_rut),
    CONSTRAINT fk_orden_compra_proyecto_codigo_correlativo
        FOREIGN KEY (proyecto_codigo_correlativo) REFERENCES PROYECTO (proyecto_codigo_correlativo),
    CONSTRAINT fk_orden_compra_solicitud_material_id
        FOREIGN KEY (solicitud_material_id) REFERENCES SOLICITUD_MATERIAL (solicitud_material_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- DETALLE_ORDEN_COMPRA
CREATE TABLE IF NOT EXISTS DETALLE_ORDEN_COMPRA (
    detalle_orden_compra_id                    INT            NOT NULL AUTO_INCREMENT,
    detalle_orden_compra_descripcion_material  VARCHAR(255)   NOT NULL,
    detalle_orden_compra_cantidad              INT            NOT NULL,
    detalle_orden_compra_precio_unitario       DECIMAL(15,2)  NOT NULL,
    orden_compra_id                            INT            NOT NULL,
    material_id                                INT            NULL,
    PRIMARY KEY (detalle_orden_compra_id),
    CONSTRAINT fk_detalle_orden_compra_orden_compra_id
        FOREIGN KEY (orden_compra_id) REFERENCES ORDEN_COMPRA (orden_compra_id),
    CONSTRAINT fk_detalle_orden_compra_material_id
        FOREIGN KEY (material_id) REFERENCES MATERIAL (material_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- FACTURA
CREATE TABLE IF NOT EXISTS FACTURA (
    factura_id           INT            NOT NULL AUTO_INCREMENT,
    factura_folio        VARCHAR(50)    NOT NULL,
    factura_monto_total  DECIMAL(15,2)  NOT NULL,
    factura_fecha        DATE           NOT NULL,
    factura_url_pdf      TEXT           NULL,
    orden_compra_id      INT            NOT NULL,
    PRIMARY KEY (factura_id),
    UNIQUE KEY uq_factura_factura_folio (factura_folio),
    CONSTRAINT fk_factura_orden_compra_id
        FOREIGN KEY (orden_compra_id) REFERENCES ORDEN_COMPRA (orden_compra_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- GUIA_DESPACHO
CREATE TABLE IF NOT EXISTS GUIA_DESPACHO (
    guia_despacho_id                    INT            NOT NULL AUTO_INCREMENT,
    guia_despacho_numero                VARCHAR(50)    NOT NULL,
    guia_despacho_fecha                 DATE           NOT NULL,
    guia_despacho_estado                VARCHAR(50)    NOT NULL DEFAULT 'Pendiente',
    guia_despacho_ubicacion_verificada  TINYINT(1)     NOT NULL DEFAULT 0,
    guia_despacho_latitud_recepcion     DECIMAL(10,7)  NULL,
    guia_despacho_longitud_recepcion    DECIMAL(10,7)  NULL,
    guia_despacho_cantidad_recibida     INT            NULL,
    orden_compra_id                     INT            NULL,
    proveedor_rut                       VARCHAR(20)    NULL,
    material_id                         INT            NULL,
    PRIMARY KEY (guia_despacho_id),
    UNIQUE KEY uq_guia_despacho_guia_despacho_numero (guia_despacho_numero),
    CONSTRAINT fk_guia_despacho_orden_compra_id
        FOREIGN KEY (orden_compra_id) REFERENCES ORDEN_COMPRA (orden_compra_id),
    CONSTRAINT fk_guia_despacho_proveedor_rut
        FOREIGN KEY (proveedor_rut) REFERENCES PROVEEDOR (proveedor_rut),
    CONSTRAINT fk_guia_despacho_material_id
        FOREIGN KEY (material_id) REFERENCES MATERIAL (material_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- CERTIFICADO_CALIDAD
CREATE TABLE IF NOT EXISTS CERTIFICADO_CALIDAD (
    certificado_calidad_id             INT           NOT NULL AUTO_INCREMENT,
    guia_despacho_id                   INT           NOT NULL,
    material_id                        INT           NULL,
    certificado_calidad_numero         VARCHAR(100)  NOT NULL,
    certificado_calidad_url            TEXT          NOT NULL,
    certificado_calidad_fecha_emision  DATE          NULL,
    certificado_calidad_fecha_carga    DATE          NOT NULL,
    usuario_rut                        VARCHAR(20)   NULL,
    PRIMARY KEY (certificado_calidad_id),
    CONSTRAINT fk_certificado_calidad_guia_despacho_id
        FOREIGN KEY (guia_despacho_id) REFERENCES GUIA_DESPACHO (guia_despacho_id),
    CONSTRAINT fk_certificado_calidad_material_id
        FOREIGN KEY (material_id) REFERENCES MATERIAL (material_id),
    CONSTRAINT fk_certificado_calidad_usuario_rut
        FOREIGN KEY (usuario_rut) REFERENCES USUARIO (usuario_rut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
