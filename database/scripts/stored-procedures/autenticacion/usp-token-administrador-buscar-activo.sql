USE [BD-LHVR];
GO

CREATE OR ALTER PROCEDURE dbo.usp_TokenAdministrador_BuscarActivo
    @tipo_token NVARCHAR(50),
    @token_hash NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @tipo_normalizado NVARCHAR(50);

    SET @tipo_normalizado = UPPER(
        LTRIM(RTRIM(@tipo_token))
    );

    SELECT TOP 1
        t.id_token_administrador,
        t.id_administrador,
        t.tipo_token,
        t.fecha_emision,
        t.fecha_expiracion,
        t.fecha_revocacion,
        t.usado,
        t.direccion_ip,
        t.user_agent,

        a.nombre_completo,
        a.correo,
        a.correo_verificado,
        a.requiere_verificacion,
        a.id_estado_administrador,

        ea.nombre AS nombre_estado,
        ea.permite_acceso,
        ea.activo AS estado_activo
    FROM dbo.tokens_administrador AS t
    INNER JOIN dbo.administradores AS a
        ON t.id_administrador = a.id_administrador
    INNER JOIN dbo.estados_administrador AS ea
        ON a.id_estado_administrador =
           ea.id_estado_administrador
    WHERE t.tipo_token = @tipo_normalizado
      AND t.token_hash = @token_hash
      AND t.fecha_revocacion IS NULL
      AND t.fecha_expiracion > SYSUTCDATETIME()
      AND t.usado = 0
      AND ea.permite_acceso = 1
      AND ea.activo = 1
    ORDER BY t.id_token_administrador DESC;
END;
GO