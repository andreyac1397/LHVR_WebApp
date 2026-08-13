USE [BD-LHVR];
GO

CREATE OR ALTER PROCEDURE dbo.usp_CodigoVerificacionAdmin_MarcarUsado
    @id_codigo_verificacion_admin BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @ahora DATETIME2(6);
    DECLARE @resultado TABLE (
        id_codigo_verificacion_admin BIGINT,
        id_administrador INT,
        tipo_codigo NVARCHAR(50),
        usado BIT,
        fecha_uso DATETIME2(6)
    );

    SET @ahora = SYSUTCDATETIME();

    UPDATE dbo.codigos_verificacion_admin
    SET
        usado = 1,
        fecha_uso = @ahora
    OUTPUT
        INSERTED.id_codigo_verificacion_admin,
        INSERTED.id_administrador,
        INSERTED.tipo_codigo,
        INSERTED.usado,
        INSERTED.fecha_uso
    INTO @resultado
    WHERE id_codigo_verificacion_admin =
          @id_codigo_verificacion_admin
      AND usado = 0
      AND fecha_expiracion > @ahora
      AND cantidad_intentos < maximo_intentos;

    IF NOT EXISTS (SELECT 1 FROM @resultado)
        THROW 50014, N'El código no es válido, ya fue usado o expiró.', 1;

    SELECT *
    FROM @resultado;
END;
GO