USE [BD-LHVR];
GO

IF COL_LENGTH(N'dbo.administradores', N'requiere_cambio_contrasena') IS NULL
BEGIN
    ALTER TABLE dbo.administradores
    ADD requiere_cambio_contrasena BIT NOT NULL
        CONSTRAINT DF_administradores_requiere_cambio_contrasena DEFAULT (0);
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Administrador_BuscarPorCorreo
    @correo NVARCHAR(254)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @correo_normalizado NVARCHAR(254) =
        LOWER(LTRIM(RTRIM(@correo)));

    SELECT
        a.id_administrador,
        a.nombre_completo,
        a.correo,
        a.contrasena_hash,
        a.id_estado_administrador,
        ea.nombre AS nombre_estado,
        ea.descripcion AS descripcion_estado,
        ea.permite_acceso,
        ea.activo AS estado_activo,
        a.correo_verificado,
        a.requiere_verificacion,
        a.requiere_cambio_contrasena,
        a.ultimo_acceso,
        a.fecha_creacion,
        a.fecha_actualizacion
    FROM dbo.administradores AS a
    INNER JOIN dbo.estados_administrador AS ea
        ON a.id_estado_administrador = ea.id_estado_administrador
    WHERE a.correo = @correo_normalizado;
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_TokenAdministrador_BuscarActivo
    @tipo_token NVARCHAR(50),
    @token_hash NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @tipo_normalizado NVARCHAR(50) =
        UPPER(LTRIM(RTRIM(@tipo_token)));

    SELECT TOP 1
        t.id_token_administrador,
        t.id_administrador,
        t.tipo_token,
        t.fecha_emision,
        t.fecha_expiracion,
        t.fecha_revocacion,
        t.usado,
        t.direccion_ip,
        t.user_agent,
        a.nombre_completo,
        a.correo,
        a.correo_verificado,
        a.requiere_verificacion,
        a.requiere_cambio_contrasena,
        a.id_estado_administrador,
        ea.nombre AS nombre_estado,
        ea.permite_acceso,
        ea.activo AS estado_activo
    FROM dbo.tokens_administrador AS t
    INNER JOIN dbo.administradores AS a
        ON t.id_administrador = a.id_administrador
    INNER JOIN dbo.estados_administrador AS ea
        ON a.id_estado_administrador = ea.id_estado_administrador
    WHERE t.tipo_token = @tipo_normalizado
      AND t.token_hash = @token_hash
      AND t.fecha_revocacion IS NULL
      AND t.fecha_expiracion > SYSUTCDATETIME()
      AND t.usado = 0
      AND ea.permite_acceso = 1
      AND ea.activo = 1
    ORDER BY t.id_token_administrador DESC;
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Administrador_ActualizarContrasena
    @id_administrador INT,
    @contrasena_hash_nueva NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @ahora DATETIME2(6) = SYSUTCDATETIME();
    DECLARE @tokens_revocados INT = 0;
    DECLARE @codigos_invalidados INT = 0;

    IF @id_administrador IS NULL OR @id_administrador <= 0
        THROW 50020, N'El administrador indicado no es válido.', 1;

    IF NULLIF(LTRIM(RTRIM(@contrasena_hash_nueva)), N'') IS NULL
        THROW 50021, N'El nuevo hash de la contraseña es obligatorio.', 1;

    IF NOT EXISTS (
        SELECT 1 FROM dbo.administradores
        WHERE id_administrador = @id_administrador
    )
        THROW 50022, N'No se encontró el administrador.', 1;

    BEGIN TRY
        BEGIN TRANSACTION;

        UPDATE dbo.administradores
        SET contrasena_hash = @contrasena_hash_nueva,
            requiere_cambio_contrasena = 0,
            fecha_actualizacion = @ahora
        WHERE id_administrador = @id_administrador;

        UPDATE dbo.tokens_administrador
        SET fecha_revocacion = @ahora
        WHERE id_administrador = @id_administrador
          AND fecha_revocacion IS NULL
          AND usado = 0;
        SET @tokens_revocados = @@ROWCOUNT;

        UPDATE dbo.codigos_verificacion_admin
        SET usado = 1,
            fecha_uso = COALESCE(fecha_uso, @ahora)
        WHERE id_administrador = @id_administrador
          AND usado = 0;
        SET @codigos_invalidados = @@ROWCOUNT;

        COMMIT TRANSACTION;

        SELECT
            a.id_administrador,
            a.correo,
            a.fecha_actualizacion,
            @tokens_revocados AS tokens_revocados,
            @codigos_invalidados AS codigos_invalidados
        FROM dbo.administradores AS a
        WHERE a.id_administrador = @id_administrador;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO
