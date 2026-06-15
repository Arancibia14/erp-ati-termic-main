-- ============================================================
-- ERP ATI TERMIC SpA — DDL MySQL 8.0+
-- Modelo normalizado 2.0
-- ============================================================

CREATE DATABASE IF NOT EXISTS erp_ati_termic
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE erp_ati_termic;

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 1. ESTADO_PROYECTO
-- ============================================================
CREATE TABLE IF NOT EXISTS ESTADO_PROYECTO (
    estado_proyecto_id   INT          NOT NULL AUTO_INCREMENT,
    estado_proyecto_nombre VARCHAR(100) NOT NULL,
    PRIMARY KEY (estado_proyecto_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 2. ESPECIALIDAD
-- ============================================================
CREATE TABLE IF NOT EXISTS ESPECIALIDAD (
    especialidad_id     INT          NOT NULL AUTO_INCREMENT,
    especialidad_nombre VARCHAR(100) NOT NULL,
    PRIMARY KEY (especialidad_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 3. USUARIO
-- ============================================================
CREATE TABLE IF NOT EXISTS USUARIO (
    usuario_rut                    VARCHAR(20)  NOT NULL,
    usuario_nombre                 VARCHAR(100) NOT NULL,
    usuario_correo_institucional   VARCHAR(150) NOT NULL,
    usuario_password_hash          VARCHAR(255) NOT NULL,
    PRIMARY KEY (usuario_rut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 4. PROVEEDOR
-- ============================================================
CREATE TABLE IF NOT EXISTS PROVEEDOR (
    proveedor_rut          VARCHAR(20)  NOT NULL,
    proveedor_razon_social TEXT         NOT NULL,
    proveedor_giro         TEXT         NOT NULL,
    proveedor_contacto     VARCHAR(150) NOT NULL,
    PRIMARY KEY (proveedor_rut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 5. MODELO_HVAC
-- ============================================================
CREATE TABLE IF NOT EXISTS MODELO_HVAC (
    modelo_hvac_id        INT          NOT NULL AUTO_INCREMENT,
    modelo_hvac_nombre    VARCHAR(255) NOT NULL,
    modelo_hvac_url_ficha TEXT,
    modelo_hvac_url_manual TEXT,
    PRIMARY KEY (modelo_hvac_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 6. PARAMETRO_SISTEMA
-- ============================================================
CREATE TABLE IF NOT EXISTS PARAMETRO_SISTEMA (
    parametro_sistema_clave_parametro VARCHAR(100)   NOT NULL,
    parametro_sistema_valor_numerico  DECIMAL(15,2)  NOT NULL,
    parametro_sistema_fecha_vigencia  DATE           NOT NULL,
    PRIMARY KEY (parametro_sistema_clave_parametro)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 7. PROYECTO
-- ============================================================
CREATE TABLE IF NOT EXISTS PROYECTO (
    proyecto_codigo_correlativo   VARCHAR(50)   NOT NULL,
    proyecto_nombre_obra          VARCHAR(255)  NOT NULL,
    proyecto_porcentaje_avance    DECIMAL(5,2)  NOT NULL DEFAULT 0.00,
    proyecto_presupuesto_asignado DECIMAL(15,2) NOT NULL,
    proyecto_correo_contacto      VARCHAR(150)  NOT NULL,
    estado_proyecto_id            INT           NOT NULL,
    PRIMARY KEY (proyecto_codigo_correlativo),
    CONSTRAINT fk_proyecto_estado
        FOREIGN KEY (estado_proyecto_id) REFERENCES ESTADO_PROYECTO (estado_proyecto_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 8. ADMINISTRADOR
-- ============================================================
CREATE TABLE IF NOT EXISTS ADMINISTRADOR (
    administrador_id              INT          NOT NULL AUTO_INCREMENT,
    administrador_nivel_acceso    VARCHAR(50)  NOT NULL,
    administrador_fecha_asignacion DATETIME    NOT NULL,
    usuario_rut                   VARCHAR(20)  NOT NULL,
    PRIMARY KEY (administrador_id),
    CONSTRAINT fk_administrador_usuario
        FOREIGN KEY (usuario_rut) REFERENCES USUARIO (usuario_rut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 9. SUPERVISOR_TERRENO
-- ============================================================
CREATE TABLE IF NOT EXISTS SUPERVISOR_TERRENO (
    supervisor_terreno_id                    INT          NOT NULL AUTO_INCREMENT,
    supervisor_terreno_registro_certificacion VARCHAR(100) NOT NULL,
    supervisor_terreno_telefono_emergencia   VARCHAR(20)  NOT NULL,
    usuario_rut                              VARCHAR(20)  NOT NULL,
    PRIMARY KEY (supervisor_terreno_id),
    CONSTRAINT fk_supervisor_usuario
        FOREIGN KEY (usuario_rut) REFERENCES USUARIO (usuario_rut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 10. TOKEN_RECUPERACION
-- ============================================================
CREATE TABLE IF NOT EXISTS TOKEN_RECUPERACION (
    token_recuperacion_codigo_hash    VARCHAR(255) NOT NULL,
    token_recuperacion_fecha_expiracion DATETIME   NOT NULL,
    usuario_rut                       VARCHAR(20)  NOT NULL,
    PRIMARY KEY (token_recuperacion_codigo_hash),
    CONSTRAINT fk_token_usuario
        FOREIGN KEY (usuario_rut) REFERENCES USUARIO (usuario_rut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 11. LOG_AUDITORIA
-- ============================================================
CREATE TABLE IF NOT EXISTS LOG_AUDITORIA (
    log_auditoria_id        INT          NOT NULL AUTO_INCREMENT,
    log_auditoria_fecha_hora DATETIME    NOT NULL,
    log_auditoria_accion    VARCHAR(255) NOT NULL,
    log_auditoria_modulo    VARCHAR(100) NOT NULL,
    usuario_rut             VARCHAR(20)  NOT NULL,
    PRIMARY KEY (log_auditoria_id),
    CONSTRAINT fk_log_usuario
        FOREIGN KEY (usuario_rut) REFERENCES USUARIO (usuario_rut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 12. SESION
-- ============================================================
CREATE TABLE IF NOT EXISTS SESION (
    sesion_id               INT          NOT NULL AUTO_INCREMENT,
    sesion_fecha_inicio     DATETIME     NOT NULL,
    sesion_ultima_actividad DATETIME     NOT NULL,
    sesion_estado           VARCHAR(50)  NOT NULL,
    usuario_rut             VARCHAR(20)  NOT NULL,
    PRIMARY KEY (sesion_id),
    CONSTRAINT fk_sesion_usuario
        FOREIGN KEY (usuario_rut) REFERENCES USUARIO (usuario_rut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 13. TRABAJADOR
-- ============================================================
CREATE TABLE IF NOT EXISTS TRABAJADOR (
    trabajador_rut              VARCHAR(20)  NOT NULL,
    trabajador_telefono         VARCHAR(20)  NOT NULL,
    trabajador_nombres          VARCHAR(150) NOT NULL,
    trabajador_correo           VARCHAR(150) NOT NULL,
    especialidad_id             INT          NOT NULL,
    proyecto_codigo_correlativo VARCHAR(50)  NOT NULL,
    PRIMARY KEY (trabajador_rut),
    CONSTRAINT fk_trabajador_especialidad
        FOREIGN KEY (especialidad_id) REFERENCES ESPECIALIDAD (especialidad_id),
    CONSTRAINT fk_trabajador_proyecto
        FOREIGN KEY (proyecto_codigo_correlativo) REFERENCES PROYECTO (proyecto_codigo_correlativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 14. BITACORA_DIARIA
-- ============================================================
CREATE TABLE IF NOT EXISTS BITACORA_DIARIA (
    bitacora_diaria_id                  INT         NOT NULL AUTO_INCREMENT,
    bitacora_diaria_fecha               DATE        NOT NULL,
    bitacora_diaria_descripcion_actividad TEXT       NOT NULL,
    usuario_rut                         VARCHAR(20) NOT NULL,
    proyecto_codigo_correlativo         VARCHAR(50) NOT NULL,
    PRIMARY KEY (bitacora_diaria_id),
    CONSTRAINT fk_bitacora_usuario
        FOREIGN KEY (usuario_rut) REFERENCES USUARIO (usuario_rut),
    CONSTRAINT fk_bitacora_proyecto
        FOREIGN KEY (proyecto_codigo_correlativo) REFERENCES PROYECTO (proyecto_codigo_correlativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 15. HITO_TECNICO
-- ============================================================
CREATE TABLE IF NOT EXISTS HITO_TECNICO (
    hito_tecnico_id             INT          NOT NULL AUTO_INCREMENT,
    hito_tecnico_nombre_hito    VARCHAR(255) NOT NULL,
    hito_tecnico_avance_fisico  DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    proyecto_codigo_correlativo VARCHAR(50)  NOT NULL,
    PRIMARY KEY (hito_tecnico_id),
    CONSTRAINT fk_hito_proyecto
        FOREIGN KEY (proyecto_codigo_correlativo) REFERENCES PROYECTO (proyecto_codigo_correlativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 16. EVIDENCIA_FOTOGRAFICA
-- ============================================================
CREATE TABLE IF NOT EXISTS EVIDENCIA_FOTOGRAFICA (
    evidencia_fotografica_nro             INT             NOT NULL AUTO_INCREMENT,
    evidencia_fotografica_url_foto        TEXT            NOT NULL,
    evidencia_fotografica_fecha_captura   DATETIME        NOT NULL,
    evidencia_fotografica_latitud         DECIMAL(10,7)   NOT NULL,
    evidencia_fotografica_longitud        DECIMAL(10,7)   NOT NULL,
    evidencia_fotografica_estado_aprobacion VARCHAR(50)   NOT NULL,
    hito_tecnico_id                       INT             NOT NULL,
    PRIMARY KEY (evidencia_fotografica_nro),
    CONSTRAINT fk_evidencia_hito
        FOREIGN KEY (hito_tecnico_id) REFERENCES HITO_TECNICO (hito_tecnico_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 17. CONTROL_CAMBIO_PPTO
-- ============================================================
CREATE TABLE IF NOT EXISTS CONTROL_CAMBIO_PPTO (
    control_cambio_ppto_id            INT           NOT NULL AUTO_INCREMENT,
    control_cambio_ppto_fecha         DATE          NOT NULL,
    control_cambio_ppto_motivo        TEXT          NOT NULL,
    control_cambio_ppto_monto_anterior DECIMAL(15,2) NOT NULL,
    control_cambio_ppto_monto_nuevo    DECIMAL(15,2) NOT NULL,
    proyecto_codigo_correlativo        VARCHAR(50)   NOT NULL,
    PRIMARY KEY (control_cambio_ppto_id),
    CONSTRAINT fk_control_proyecto
        FOREIGN KEY (proyecto_codigo_correlativo) REFERENCES PROYECTO (proyecto_codigo_correlativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 18. INCIDENTE_SSO
-- ============================================================
CREATE TABLE IF NOT EXISTS INCIDENTE_SSO (
    incidente_sso_id          INT          NOT NULL AUTO_INCREMENT,
    incidente_sso_descripcion TEXT         NOT NULL,
    incidente_sso_fecha_hora  DATETIME     NOT NULL,
    incidente_sso_gravedad    VARCHAR(50)  NOT NULL,
    proyecto_codigo_correlativo VARCHAR(50) NOT NULL,
    PRIMARY KEY (incidente_sso_id),
    CONSTRAINT fk_incidente_proyecto
        FOREIGN KEY (proyecto_codigo_correlativo) REFERENCES PROYECTO (proyecto_codigo_correlativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 19. ACCIDENTE
-- ============================================================
CREATE TABLE IF NOT EXISTS ACCIDENTE (
    accidente_id                INT          NOT NULL AUTO_INCREMENT,
    accidente_dias_perdidos     INT          NOT NULL,
    accidente_riesgo_potencial  TEXT         NOT NULL,
    incidente_sso_id            INT          NOT NULL,
    trabajador_rut              VARCHAR(20)  NOT NULL,
    proyecto_codigo_correlativo VARCHAR(50)  NOT NULL,
    PRIMARY KEY (accidente_id),
    CONSTRAINT fk_accidente_incidente
        FOREIGN KEY (incidente_sso_id) REFERENCES INCIDENTE_SSO (incidente_sso_id),
    CONSTRAINT fk_accidente_trabajador
        FOREIGN KEY (trabajador_rut) REFERENCES TRABAJADOR (trabajador_rut),
    CONSTRAINT fk_accidente_proyecto
        FOREIGN KEY (proyecto_codigo_correlativo) REFERENCES PROYECTO (proyecto_codigo_correlativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 20. CAUSA_ACCIDENTE
-- ============================================================
CREATE TABLE IF NOT EXISTS CAUSA_ACCIDENTE (
    causa_accidente_id             INT  NOT NULL AUTO_INCREMENT,
    causa_accidente_riesgo_potencial TEXT NOT NULL,
    incidente_sso_id               INT  NOT NULL,
    PRIMARY KEY (causa_accidente_id),
    CONSTRAINT fk_causa_incidente
        FOREIGN KEY (incidente_sso_id) REFERENCES INCIDENTE_SSO (incidente_sso_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 21. ORDEN_COMPRA
-- ============================================================
CREATE TABLE IF NOT EXISTS ORDEN_COMPRA (
    orden_compra_id                INT          NOT NULL AUTO_INCREMENT,
    orden_compra_folio             VARCHAR(50)  NOT NULL,
    orden_compra_fecha_generacion  DATE         NOT NULL,
    orden_compra_estado            VARCHAR(50)  NOT NULL,
    orden_compra_fecha_entrega_pactada DATE      NOT NULL,
    fecha_entrega_real             DATE,
    proyecto_codigo_correlativo    VARCHAR(50)  NOT NULL,
    proveedor_rut                  VARCHAR(20)  NOT NULL,
    PRIMARY KEY (orden_compra_id),
    CONSTRAINT fk_oc_proyecto
        FOREIGN KEY (proyecto_codigo_correlativo) REFERENCES PROYECTO (proyecto_codigo_correlativo),
    CONSTRAINT fk_oc_proveedor
        FOREIGN KEY (proveedor_rut) REFERENCES PROVEEDOR (proveedor_rut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 22. MATERIAL
-- ============================================================
CREATE TABLE IF NOT EXISTS MATERIAL (
    material_id           INT           NOT NULL AUTO_INCREMENT,
    material_nombre       VARCHAR(255)  NOT NULL,
    material_sku          VARCHAR(100)  NOT NULL,
    material_stock_actual DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    material_nivel_minimo DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    material_unidad_medida VARCHAR(50)  NOT NULL,
    PRIMARY KEY (material_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 23. DETALLE_ORDEN_COMPRA
-- ============================================================
CREATE TABLE IF NOT EXISTS DETALLE_ORDEN_COMPRA (
    orden_compra_id       INT           NOT NULL,
    material_id           INT           NOT NULL,
    detalle_cantidad_pedida DECIMAL(15,2) NOT NULL,
    detalle_precio_unitario DECIMAL(15,2) NOT NULL,
    PRIMARY KEY (orden_compra_id, material_id),
    CONSTRAINT fk_doc_orden
        FOREIGN KEY (orden_compra_id) REFERENCES ORDEN_COMPRA (orden_compra_id),
    CONSTRAINT fk_doc_material
        FOREIGN KEY (material_id) REFERENCES MATERIAL (material_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 24. LOTE_INVENTARIO
-- ============================================================
CREATE TABLE IF NOT EXISTS LOTE_INVENTARIO (
    lote_inventario_id           INT           NOT NULL AUTO_INCREMENT,
    lote_inventario_stock_total  DECIMAL(15,2) NOT NULL,
    lote_inventario_fecha_ingreso DATE          NOT NULL,
    lote_inventario_cantidad     DECIMAL(15,2) NOT NULL,
    lote_inventario_costo_unitario DECIMAL(15,2) NOT NULL,
    material_id                  INT           NOT NULL,
    PRIMARY KEY (lote_inventario_id),
    CONSTRAINT fk_lote_material
        FOREIGN KEY (material_id) REFERENCES MATERIAL (material_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 25. SOLICITUD_MATERIAL
-- ============================================================
CREATE TABLE IF NOT EXISTS SOLICITUD_MATERIAL (
    solicitud_material_id           INT           NOT NULL AUTO_INCREMENT,
    solicitud_material_fecha_emision DATE          NOT NULL,
    solicitud_material_cantidad_pedida DECIMAL(15,2) NOT NULL,
    proyecto_codigo_correlativo     VARCHAR(50)   NOT NULL,
    PRIMARY KEY (solicitud_material_id),
    CONSTRAINT fk_solicitud_proyecto
        FOREIGN KEY (proyecto_codigo_correlativo) REFERENCES PROYECTO (proyecto_codigo_correlativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 26. GUIA_DESPACHO
-- ============================================================
CREATE TABLE IF NOT EXISTS GUIA_DESPACHO (
    guia_despacho_id         INT          NOT NULL AUTO_INCREMENT,
    guia_despacho_folio      VARCHAR(50)  NOT NULL,
    guia_despacho_fecha_emision DATE       NOT NULL,
    guia_despacho_transportista VARCHAR(150) NOT NULL,
    guia_despacho_estado     VARCHAR(50)  NOT NULL,
    proveedor_rut            VARCHAR(20)  NOT NULL,
    PRIMARY KEY (guia_despacho_id),
    CONSTRAINT fk_guia_proveedor
        FOREIGN KEY (proveedor_rut) REFERENCES PROVEEDOR (proveedor_rut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 27. GENERA_GUIA
-- ============================================================
CREATE TABLE IF NOT EXISTS GENERA_GUIA (
    orden_compra_id  INT NOT NULL,
    guia_despacho_id INT NOT NULL,
    PRIMARY KEY (orden_compra_id, guia_despacho_id),
    CONSTRAINT fk_gg_orden
        FOREIGN KEY (orden_compra_id) REFERENCES ORDEN_COMPRA (orden_compra_id),
    CONSTRAINT fk_gg_guia
        FOREIGN KEY (guia_despacho_id) REFERENCES GUIA_DESPACHO (guia_despacho_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 28. DETALLE_GUIA_DESPACHO
-- ============================================================
CREATE TABLE IF NOT EXISTS DETALLE_GUIA_DESPACHO (
    orden_compra_id         INT         NOT NULL,
    guia_despacho_id        INT         NOT NULL,
    detalle_guia_estado_entrega VARCHAR(50) NOT NULL,
    PRIMARY KEY (orden_compra_id, guia_despacho_id),
    CONSTRAINT fk_dgd_orden
        FOREIGN KEY (orden_compra_id) REFERENCES ORDEN_COMPRA (orden_compra_id),
    CONSTRAINT fk_dgd_guia
        FOREIGN KEY (guia_despacho_id) REFERENCES GUIA_DESPACHO (guia_despacho_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 29. FACTURA
-- ============================================================
CREATE TABLE IF NOT EXISTS FACTURA (
    factura_id                      INT           NOT NULL AUTO_INCREMENT,
    factura_proveedor_folio         VARCHAR(50)   NOT NULL,
    factura_proveedor_fecha_facturacion DATE       NOT NULL,
    factura_proveedor_monto_total   DECIMAL(15,2) NOT NULL,
    factura_proveedor_url_pdf       TEXT,
    orden_compra_id                 INT           NOT NULL,
    PRIMARY KEY (factura_id),
    CONSTRAINT fk_factura_orden
        FOREIGN KEY (orden_compra_id) REFERENCES ORDEN_COMPRA (orden_compra_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 30. CONTRATO_LABORAL
-- ============================================================
CREATE TABLE IF NOT EXISTS CONTRATO_LABORAL (
    contrato_laboral_id_contrato  INT         NOT NULL AUTO_INCREMENT,
    contrato_laboral_fecha_inicio DATE        NOT NULL,
    contrato_laboral_fecha_termino DATE       NOT NULL,
    trabajador_rut                VARCHAR(20) NOT NULL,
    PRIMARY KEY (contrato_laboral_id_contrato),
    CONSTRAINT fk_contrato_trabajador
        FOREIGN KEY (trabajador_rut) REFERENCES TRABAJADOR (trabajador_rut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 31. DOCUMENTO_LEGAL
-- ============================================================
CREATE TABLE IF NOT EXISTS DOCUMENTO_LEGAL (
    documento_legal_id            INT          NOT NULL AUTO_INCREMENT,
    documento_legal_tipo_documento VARCHAR(100) NOT NULL,
    documento_legal_anexos        TEXT,
    documento_legal_url_pdf       TEXT,
    trabajador_rut                VARCHAR(20)  NOT NULL,
    PRIMARY KEY (documento_legal_id),
    CONSTRAINT fk_documento_trabajador
        FOREIGN KEY (trabajador_rut) REFERENCES TRABAJADOR (trabajador_rut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 32. ENTREGA_EPP
-- ============================================================
CREATE TABLE IF NOT EXISTS ENTREGA_EPP (
    entrega_epp_id            INT         NOT NULL AUTO_INCREMENT,
    entrega_epp_fecha_entrega DATE        NOT NULL,
    entrega_epp_detalle_equipos TEXT      NOT NULL,
    entrega_epp_firma_digital TEXT        NOT NULL,
    trabajador_rut            VARCHAR(20) NOT NULL,
    PRIMARY KEY (entrega_epp_id),
    CONSTRAINT fk_epp_trabajador
        FOREIGN KEY (trabajador_rut) REFERENCES TRABAJADOR (trabajador_rut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 33. HERRAMIENTA_ACTIVO
-- ============================================================
CREATE TABLE IF NOT EXISTS HERRAMIENTA_ACTIVO (
    herramienta_activo_id           INT          NOT NULL AUTO_INCREMENT,
    herramienta_activo_estado_operativo VARCHAR(50) NOT NULL,
    herramienta_activo_nombre       VARCHAR(255) NOT NULL,
    proyecto_codigo_correlativo     VARCHAR(50)  NOT NULL,
    trabajador_rut                  VARCHAR(20)  NOT NULL,
    PRIMARY KEY (herramienta_activo_id),
    CONSTRAINT fk_herramienta_proyecto
        FOREIGN KEY (proyecto_codigo_correlativo) REFERENCES PROYECTO (proyecto_codigo_correlativo),
    CONSTRAINT fk_herramienta_trabajador
        FOREIGN KEY (trabajador_rut) REFERENCES TRABAJADOR (trabajador_rut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 34. EGRESO_CAJA_CHICA
-- ============================================================
CREATE TABLE IF NOT EXISTS EGRESO_CAJA_CHICA (
    egreso_caja_chica_id            INT           NOT NULL AUTO_INCREMENT,
    egreso_caja_chica_monto         DECIMAL(15,2) NOT NULL,
    egreso_caja_chica_fecha         DATE          NOT NULL,
    egreso_caja_chica_concepto      TEXT          NOT NULL,
    proyecto_codigo_correlativo     VARCHAR(50)   NOT NULL,
    PRIMARY KEY (egreso_caja_chica_id),
    CONSTRAINT fk_egreso_proyecto
        FOREIGN KEY (proyecto_codigo_correlativo) REFERENCES PROYECTO (proyecto_codigo_correlativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 35. EQUIPO_HVAC
-- ============================================================
CREATE TABLE IF NOT EXISTS EQUIPO_HVAC (
    equipo_hvac_numero_serie    VARCHAR(100) NOT NULL,
    equipo_hvac_fecha_instalacion DATE        NOT NULL,
    equipo_hvac_estado_operativo VARCHAR(50) NOT NULL,
    modelo_hvac_id              INT          NOT NULL,
    proyecto_codigo_correlativo VARCHAR(50)  NOT NULL,
    PRIMARY KEY (equipo_hvac_numero_serie),
    CONSTRAINT fk_equipo_modelo
        FOREIGN KEY (modelo_hvac_id) REFERENCES MODELO_HVAC (modelo_hvac_id),
    CONSTRAINT fk_equipo_proyecto
        FOREIGN KEY (proyecto_codigo_correlativo) REFERENCES PROYECTO (proyecto_codigo_correlativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
