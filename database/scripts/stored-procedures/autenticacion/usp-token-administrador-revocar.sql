USE [BD-LHVR];
GO

CREATE OR ALTER PROCEDURE dbo.usp_TokenAdministrador_Revocar
    @tipo_token NVARCHAR(50),
    @token_hash NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @tipo_normalizado NVARCHAR(50);
    DECLARE @ahora DATETIME2(6);
    DECLARE @resultado TABLE (
        id_token_administrador BIGINT,
        id_administrador INT,
        tipo_token NVARCHAR(50),
        fecha_revocacion DATETIME2(6)
    );

    SET @tipo_normalizado = UPPER(
        LTRIM(RTRIM(@tipo_token))
    );

    SET @ahora = SYSUTCDATETIME();

    UPDATE dbo.tokens_administrador
    SET fecha_revocacion = @ahora
    OUTPUT
        INSERTED.id_token_administrador,
        INSERTED.id_administrador,
        INSERTED.tipo_token,
        INSERTED.fecha_revocacion
    INTO @resultado
    WHERE tipo_token = @tipo_normalizado
      AND token_hash = @token_hash
      AND fecha_revocacion IS NULL;

    IF EXISTS (SELECT 1 FROM @resultado)
    BEGIN
        SELECT
            CAST(1 AS BIT) AS revocado,
            id_token_administrador,
            id_administrador,
            tipo_token,
            fecha_revocacion
        FROM @resultado;

        RETURN;
    END;

    SELECT
        CAST(0 AS BIT) AS revocado,
        CAST(NULL AS BIGINT) AS id_token_administrador,
        CAST(NULL AS INT) AS id_administrador,
        CAST(NULL AS NVARCHAR(50)) AS tipo_token,
        CAST(NULL AS DATETIME2(6)) AS fecha_revocacion;
END;
GO