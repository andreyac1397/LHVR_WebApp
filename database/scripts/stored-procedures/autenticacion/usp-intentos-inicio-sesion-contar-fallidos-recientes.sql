USE [BD-LHVR];
GO

CREATE OR ALTER PROCEDURE dbo.usp_IntentosInicioSesion_ContarFallidosRecientes
    @correo NVARCHAR(254),
    @direccion_ip NVARCHAR(45) = NULL,
    @ventana_minutos INT = 15
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @correo_normalizado NVARCHAR(254);
    DECLARE @fecha_limite DATETIME2(6);

    SET @correo_normalizado = LOWER(
        LTRIM(RTRIM(@correo))
    );

    IF NULLIF(@correo_normalizado, N'') IS NULL
        THROW 50003, N'El correo es obligatorio.', 1;

    IF @ventana_minutos < 1 OR @ventana_minutos > 1440
        THROW 50004, N'La ventana de tiempo no es válida.', 1;

    SET @fecha_limite = DATEADD(
        MINUTE,
        -@ventana_minutos,
        SYSUTCDATETIME()
    );

    SELECT
        (
            SELECT COUNT(*)
            FROM dbo.intentos_inicio_sesion
            WHERE correo_ingresado = @correo_normalizado
              AND exitoso = 0
              AND fecha_intento >= @fecha_limite
        ) AS fallidos_por_correo,

        (
            SELECT COUNT(*)
            FROM dbo.intentos_inicio_sesion
            WHERE @direccion_ip IS NOT NULL
              AND direccion_ip = @direccion_ip
              AND exitoso = 0
              AND fecha_intento >= @fecha_limite
        ) AS fallidos_por_ip,

        @ventana_minutos AS ventana_minutos;
END;
GO