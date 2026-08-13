USE [BD-LHVR];
GO

CREATE OR ALTER PROCEDURE dbo.usp_CodigoVerificacionAdmin_Crear
    @id_administrador INT,
    @tipo_codigo NVARCHAR(50),
    @codigo_hash NVARCHAR(255),
    @minutos_vigencia INT = 10,
    @maximo_intentos INT = 5,
    @direccion_ip NVARCHAR(45) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @tipo_normalizado NVARCHAR(50);
    DECLARE @ahora DATETIME2(6);
    DECLARE @fecha_expiracion DATETIME2(6);

    SET @tipo_normalizado = UPPER(
        LTRIM(RTRIM(@tipo_codigo))
    );

    IF @id_administrador IS NULL OR @id_administrador <= 0
        THROW 50007, N'El administrador indicado no es válido.', 1;

    IF NOT EXISTS (
        SELECT 1
        FROM dbo.administradores
        WHERE id_administrador = @id_administrador
    )
        THROW 50008, N'No se encontró el administrador.', 1;

    IF NULLIF(@tipo_normalizado, N'') IS NULL
        THROW 50009, N'El tipo de código es obligatorio.', 1;

    IF NULLIF(LTRIM(RTRIM(@codigo_hash)), N'') IS NULL
        THROW 50010, N'El hash del código es obligatorio.', 1;

    IF @minutos_vigencia < 1 OR @minutos_vigencia > 30
        THROW 50011, N'La vigencia del código debe estar entre 1 y 30 minutos.', 1;

    IF @maximo_intentos < 1 OR @maximo_intentos > 10
        THROW 50012, N'La cantidad máxima de intentos debe estar entre 1 y 10.', 1;

    SET @ahora = SYSUTCDATETIME();

    SET @fecha_expiracion = DATEADD(
        MINUTE,
        @minutos_vigencia,
        @ahora
    );

    BEGIN TRY
        BEGIN TRANSACTION;

        UPDATE dbo.codigos_verificacion_admin
        SET
            usado = 1,
            fecha_uso = @ahora
        WHERE id_administrador = @id_administrador
          AND tipo_codigo = @tipo_normalizado
          AND usado = 0;

        INSERT INTO dbo.codigos_verificacion_admin (
            id_administrador,
            tipo_codigo,
            codigo_hash,
            fecha_creacion,
            fecha_expiracion,
            cantidad_intentos,
            maximo_intentos,
            usado,
            direccion_ip
        )
        OUTPUT
            INSERTED.id_codigo_verificacion_admin,
            INSERTED.id_administrador,
            INSERTED.tipo_codigo,
            INSERTED.fecha_creacion,
            INSERTED.fecha_expiracion,
            INSERTED.maximo_intentos,
            INSERTED.usado
        VALUES (
            @id_administrador,
            @tipo_normalizado,
            @codigo_hash,
            @ahora,
            @fecha_expiracion,
            0,
            @maximo_intentos,
            0,
            NULLIF(LTRIM(RTRIM(@direccion_ip)), N'')
        );

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;
    END CATCH;
END;
GO