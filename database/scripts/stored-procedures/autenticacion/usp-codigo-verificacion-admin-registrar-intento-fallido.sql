USE [BD-LHVR];
GO

CREATE OR ALTER PROCEDURE dbo.usp_CodigoVerificacionAdmin_RegistrarIntentoFallido
    @id_codigo_verificacion_admin BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @ahora DATETIME2(6);
    DECLARE @resultado TABLE (
        id_codigo_verificacion_admin BIGINT,
        cantidad_intentos INT,
        maximo_intentos INT,
        usado BIT,
        fecha_uso DATETIME2(6)
    );

    SET @ahora = SYSUTCDATETIME();

    UPDATE dbo.codigos_verificacion_admin
    SET
        cantidad_intentos = cantidad_intentos + 1,

        usado = CASE
            WHEN cantidad_intentos + 1 >= maximo_intentos
                THEN 1
            ELSE usado
        END,

        fecha_uso = CASE
            WHEN cantidad_intentos + 1 >= maximo_intentos
                THEN @ahora
            ELSE fecha_uso
        END
    OUTPUT
        INSERTED.id_codigo_verificacion_admin,
        INSERTED.cantidad_intentos,
        INSERTED.maximo_intentos,
        INSERTED.usado,
        INSERTED.fecha_uso
    INTO @resultado
    WHERE id_codigo_verificacion_admin =
          @id_codigo_verificacion_admin
      AND usado = 0
      AND fecha_expiracion > @ahora
      AND cantidad_intentos < maximo_intentos;

    IF NOT EXISTS (SELECT 1 FROM @resultado)
        THROW 50013, N'El código no está disponible para nuevos intentos.', 1;

    SELECT *
    FROM @resultado;
END;
GO