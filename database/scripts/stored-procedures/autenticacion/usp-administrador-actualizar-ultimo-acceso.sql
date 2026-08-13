USE [BD-LHVR];
GO

CREATE OR ALTER PROCEDURE dbo.usp_Administrador_ActualizarUltimoAcceso
    @id_administrador INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @ahora DATETIME2(6);

    IF @id_administrador IS NULL OR @id_administrador <= 0
        THROW 50005, N'El administrador indicado no es válido.', 1;

    SET @ahora = SYSUTCDATETIME();

    UPDATE dbo.administradores
    SET
        ultimo_acceso = @ahora,
        fecha_actualizacion = @ahora
    WHERE id_administrador = @id_administrador;

    IF @@ROWCOUNT = 0
        THROW 50006, N'No se encontró el administrador.', 1;

    SELECT
        id_administrador,
        ultimo_acceso,
        fecha_actualizacion
    FROM dbo.administradores
    WHERE id_administrador = @id_administrador;
END;
GO