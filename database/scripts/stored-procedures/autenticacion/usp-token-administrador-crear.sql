USE [BD-LHVR];
GO

CREATE OR ALTER PROCEDURE dbo.usp_TokenAdministrador_Crear
    @id_administrador INT,
    @tipo_token NVARCHAR(50),
    @token_hash NVARCHAR(255),
    @minutos_vigencia INT,
    @direccion_ip NVARCHAR(45) = NULL,
    @user_agent NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @tipo_normalizado NVARCHAR(50);
    DECLARE @ahora DATETIME2(6);
    DECLARE @fecha_expiracion DATETIME2(6);

    SET @tipo_normalizado = UPPER(
        LTRIM(RTRIM(@tipo_token))
    );

    IF @id_administrador IS NULL OR @id_administrador <= 0
        THROW 50015, N'El administrador indicado no es válido.', 1;

    IF NOT EXISTS (
        SELECT 1
        FROM dbo.administradores
        WHERE id_administrador = @id_administrador
    )
        THROW 50016, N'No se encontró el administrador.', 1;

    IF NULLIF(@tipo_normalizado, N'') IS NULL
        THROW 50017, N'El tipo de token es obligatorio.', 1;

    IF NULLIF(LTRIM(RTRIM(@token_hash)), N'') IS NULL
        THROW 50018, N'El hash del token es obligatorio.', 1;

    IF @minutos_vigencia < 1 OR @minutos_vigencia > 43200
        THROW 50019, N'La vigencia indicada para el token no es válida.', 1;

    SET @ahora = SYSUTCDATETIME();

    SET @fecha_expiracion = DATEADD(
        MINUTE,
        @minutos_vigencia,
        @ahora
    );

    INSERT INTO dbo.tokens_administrador (
        id_administrador,
        tipo_token,
        token_hash,
        fecha_emision,
        fecha_expiracion,
        usado,
        direccion_ip,
        user_agent
    )
    OUTPUT
        INSERTED.id_token_administrador,
        INSERTED.id_administrador,
        INSERTED.tipo_token,
        INSERTED.fecha_emision,
        INSERTED.fecha_expiracion,
        INSERTED.fecha_revocacion,
        INSERTED.usado
    VALUES (
        @id_administrador,
        @tipo_normalizado,
        @token_hash,
        @ahora,
        @fecha_expiracion,
        0,
        NULLIF(LTRIM(RTRIM(@direccion_ip)), N''),
        NULLIF(LTRIM(RTRIM(@user_agent)), N'')
    );
END;
GO