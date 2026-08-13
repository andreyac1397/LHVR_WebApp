USE [BD-LHVR];
GO

CREATE OR ALTER PROCEDURE dbo.usp_IntentoInicioSesion_Registrar
    @id_administrador INT = NULL,
    @correo_ingresado NVARCHAR(254),
    @exitoso BIT,
    @motivo_resultado NVARCHAR(250) = NULL,
    @direccion_ip NVARCHAR(45) = NULL,
    @user_agent NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @correo_normalizado NVARCHAR(254);

    SET @correo_normalizado = LOWER(
        LTRIM(RTRIM(@correo_ingresado))
    );

    IF NULLIF(@correo_normalizado, N'') IS NULL
        THROW 50001, N'El correo ingresado es obligatorio.', 1;

    IF LEN(@correo_normalizado) > 254
        THROW 50002, N'El correo supera la longitud permitida.', 1;

    INSERT INTO dbo.intentos_inicio_sesion (
        id_administrador,
        correo_ingresado,
        exitoso,
        motivo_resultado,
        direccion_ip,
        user_agent
    )
    OUTPUT
        INSERTED.id_intento_inicio_sesion,
        INSERTED.id_administrador,
        INSERTED.correo_ingresado,
        INSERTED.exitoso,
        INSERTED.motivo_resultado,
        INSERTED.fecha_intento
    VALUES (
        @id_administrador,
        @correo_normalizado,
        @exitoso,
        NULLIF(LTRIM(RTRIM(@motivo_resultado)), N''),
        NULLIF(LTRIM(RTRIM(@direccion_ip)), N''),
        NULLIF(LTRIM(RTRIM(@user_agent)), N'')
    );
END;
GO