USE [BD-LHVR];
GO

/*
============================================================
 Procedimiento: usp_Administrador_BuscarPorCorreo
 Descripción:
 Busca un administrador por su correo y devuelve los datos
 necesarios para evaluar el inicio de sesión.

 Importante:
 - No compara la contraseña.
 - No genera tokens.
 - No registra intentos.
 - La comparación del hash se hará en Node.js con bcrypt.
============================================================
*/

CREATE OR ALTER PROCEDURE dbo.usp_Administrador_BuscarPorCorreo
    @correo NVARCHAR(254)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @correo_normalizado NVARCHAR(254);

    SET @correo_normalizado = LOWER(
        LTRIM(
            RTRIM(@correo)
        )
    );

    SELECT
        a.id_administrador,
        a.nombre_completo,
        a.correo,
        a.contrasena_hash,
        a.id_estado_administrador,
        ea.nombre AS nombre_estado,
        ea.descripcion AS descripcion_estado,
        ea.permite_acceso,
        ea.activo AS estado_activo,
        a.correo_verificado,
        a.requiere_verificacion,
        a.ultimo_acceso,
        a.fecha_creacion,
        a.fecha_actualizacion
    FROM dbo.administradores AS a
    INNER JOIN dbo.estados_administrador AS ea
        ON a.id_estado_administrador =
           ea.id_estado_administrador
    WHERE a.correo = @correo_normalizado;
END;
GO