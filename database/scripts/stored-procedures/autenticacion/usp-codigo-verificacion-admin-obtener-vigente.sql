USE [BD-LHVR];
GO

CREATE OR ALTER PROCEDURE dbo.usp_CodigoVerificacionAdmin_ObtenerVigente
    @id_administrador INT,
    @tipo_codigo NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @tipo_normalizado NVARCHAR(50);

    SET @tipo_normalizado = UPPER(
        LTRIM(RTRIM(@tipo_codigo))
    );

    SELECT TOP 1
        id_codigo_verificacion_admin,
        id_administrador,
        tipo_codigo,
        codigo_hash,
        fecha_creacion,
        fecha_expiracion,
        cantidad_intentos,
        maximo_intentos,
        usado,
        direccion_ip
    FROM dbo.codigos_verificacion_admin
    WHERE id_administrador = @id_administrador
      AND tipo_codigo = @tipo_normalizado
      AND usado = 0
      AND fecha_expiracion > SYSUTCDATETIME()
      AND cantidad_intentos < maximo_intentos
    ORDER BY
        fecha_creacion DESC,
        id_codigo_verificacion_admin DESC;
END;
GO