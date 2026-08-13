USE [BD-LHVR];
GO

CREATE OR ALTER PROCEDURE dbo.sp_listar_estados_publicacion
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        id_estado_publicacion
            AS idEstadoPublicacion,

        nombre,
        descripcion,
        es_visible AS esVisible,
        orden,
        activo
    FROM dbo.estados_publicacion
    WHERE activo = 1
    ORDER BY
        orden ASC,
        id_estado_publicacion ASC;
END;
GO