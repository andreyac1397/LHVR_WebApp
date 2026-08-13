USE [BD-LHVR];
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

BEGIN TRY
  BEGIN TRANSACTION;

  IF OBJECT_ID(N'dbo.acciones_auditoria', N'U') IS NULL
  BEGIN
    CREATE TABLE dbo.acciones_auditoria (
      id_accion_auditoria INT IDENTITY(1, 1) NOT NULL,
      codigo NVARCHAR(50) NOT NULL,
      nombre NVARCHAR(120) NOT NULL,
      descripcion NVARCHAR(500) NULL,
      activo BIT NOT NULL DEFAULT 1,
      CONSTRAINT PK_acciones_auditoria
        PRIMARY KEY (id_accion_auditoria),
      CONSTRAINT UQ_acciones_auditoria_codigo
        UNIQUE (codigo)
    );
  END;

  IF OBJECT_ID(N'dbo.modulos_sistema', N'U') IS NULL
  BEGIN
    CREATE TABLE dbo.modulos_sistema (
      id_modulo_sistema INT IDENTITY(1, 1) NOT NULL,
      codigo NVARCHAR(60) NOT NULL,
      nombre NVARCHAR(120) NOT NULL,
      descripcion NVARCHAR(500) NULL,
      activo BIT NOT NULL DEFAULT 1,
      CONSTRAINT PK_modulos_sistema
        PRIMARY KEY (id_modulo_sistema),
      CONSTRAINT UQ_modulos_sistema_codigo
        UNIQUE (codigo)
    );
  END;

  IF OBJECT_ID(N'dbo.auditoria', N'U') IS NULL
  BEGIN
    CREATE TABLE dbo.auditoria (
      id_auditoria BIGINT IDENTITY(1, 1) NOT NULL,
      id_administrador INT NULL,
      id_accion_auditoria INT NOT NULL,
      id_modulo_sistema INT NOT NULL,
      tabla_afectada NVARCHAR(128) NULL,
      id_registro_afectado NVARCHAR(100) NULL,
      datos_anteriores NVARCHAR(MAX) NULL,
      datos_nuevos NVARCHAR(MAX) NULL,
      descripcion NVARCHAR(500) NULL,
      direccion_ip NVARCHAR(45) NULL,
      user_agent NVARCHAR(500) NULL,
      fecha_accion DATETIME2(0) NOT NULL
        DEFAULT SYSUTCDATETIME(),
      CONSTRAINT PK_auditoria
        PRIMARY KEY (id_auditoria),
      CONSTRAINT FK_auditoria_accion
        FOREIGN KEY (id_accion_auditoria)
        REFERENCES dbo.acciones_auditoria(id_accion_auditoria),
      CONSTRAINT FK_auditoria_modulo
        FOREIGN KEY (id_modulo_sistema)
        REFERENCES dbo.modulos_sistema(id_modulo_sistema),
      CONSTRAINT CK_auditoria_datos_anteriores_json
        CHECK (
          datos_anteriores IS NULL OR
          ISJSON(datos_anteriores) = 1
        ),
      CONSTRAINT CK_auditoria_datos_nuevos_json
        CHECK (
          datos_nuevos IS NULL OR
          ISJSON(datos_nuevos) = 1
        )
    );
  END;

  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0
  BEGIN
    ROLLBACK TRANSACTION;
  END;

  THROW;
END CATCH;
GO

CREATE OR ALTER PROCEDURE dbo.sp_registrar_auditoria
  @id_administrador INT = NULL,
  @codigo_accion NVARCHAR(50),
  @codigo_modulo NVARCHAR(60),
  @tabla_afectada NVARCHAR(128) = NULL,
  @id_registro_afectado NVARCHAR(100) = NULL,
  @datos_anteriores NVARCHAR(MAX) = NULL,
  @datos_nuevos NVARCHAR(MAX) = NULL,
  @descripcion NVARCHAR(500) = NULL,
  @direccion_ip NVARCHAR(45) = NULL,
  @user_agent NVARCHAR(500) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;

  DECLARE @id_accion_auditoria INT;
  DECLARE @id_modulo_sistema INT;
  DECLARE @id_auditoria BIGINT;

  BEGIN TRY
    BEGIN TRANSACTION;

    SELECT
      @id_accion_auditoria = id_accion_auditoria
    FROM dbo.acciones_auditoria
    WHERE codigo = @codigo_accion;

    IF @id_accion_auditoria IS NULL
    BEGIN
      INSERT INTO dbo.acciones_auditoria (
        codigo,
        nombre,
        descripcion,
        activo
      )
      VALUES (
        @codigo_accion,
        REPLACE(@codigo_accion, N'_', N' '),
        N'Acción registrada automáticamente.',
        1
      );

      SET @id_accion_auditoria = SCOPE_IDENTITY();
    END;

    SELECT
      @id_modulo_sistema = id_modulo_sistema
    FROM dbo.modulos_sistema
    WHERE codigo = @codigo_modulo;

    IF @id_modulo_sistema IS NULL
    BEGIN
      INSERT INTO dbo.modulos_sistema (
        codigo,
        nombre,
        descripcion,
        activo
      )
      VALUES (
        @codigo_modulo,
        REPLACE(@codigo_modulo, N'_', N' '),
        N'Módulo registrado automáticamente.',
        1
      );

      SET @id_modulo_sistema = SCOPE_IDENTITY();
    END;

    INSERT INTO dbo.auditoria (
      id_administrador,
      id_accion_auditoria,
      id_modulo_sistema,
      tabla_afectada,
      id_registro_afectado,
      datos_anteriores,
      datos_nuevos,
      descripcion,
      direccion_ip,
      user_agent
    )
    VALUES (
      @id_administrador,
      @id_accion_auditoria,
      @id_modulo_sistema,
      @tabla_afectada,
      @id_registro_afectado,
      @datos_anteriores,
      @datos_nuevos,
      @descripcion,
      @direccion_ip,
      @user_agent
    );

    SET @id_auditoria = SCOPE_IDENTITY();

    COMMIT TRANSACTION;

    SELECT
      au.id_auditoria,
      au.id_administrador,
      ac.codigo AS codigo_accion,
      ac.nombre AS nombre_accion,
      mo.codigo AS codigo_modulo,
      mo.nombre AS nombre_modulo,
      au.tabla_afectada,
      au.id_registro_afectado,
      au.datos_anteriores,
      au.datos_nuevos,
      au.descripcion,
      au.direccion_ip,
      au.user_agent,
      au.fecha_accion
    FROM dbo.auditoria AS au
    INNER JOIN dbo.acciones_auditoria AS ac
      ON au.id_accion_auditoria = ac.id_accion_auditoria
    INNER JOIN dbo.modulos_sistema AS mo
      ON au.id_modulo_sistema = mo.id_modulo_sistema
    WHERE au.id_auditoria = @id_auditoria;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0
    BEGIN
      ROLLBACK TRANSACTION;
    END;

    THROW;
  END CATCH;
END;
GO
