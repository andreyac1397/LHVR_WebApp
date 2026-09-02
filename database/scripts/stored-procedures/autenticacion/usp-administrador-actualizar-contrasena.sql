USE [BD-LHVR];
GO

/*
============================================================
 Procedimiento: usp_Administrador_ActualizarContrasena

 Descripción:
 Actualiza el hash de la contraseña de un administrador.

 Al cambiar la contraseña:
 - Revoca todos los tokens activos del administrador.
 - Invalida todos los códigos de verificación pendientes.
 - Actualiza la fecha de modificación.

 Importante:
 La comprobación de la contraseña actual se realiza
 previamente en Node.js utilizando bcrypt.
============================================================
*/

CREATE OR ALTER PROCEDURE dbo.usp_Administrador_ActualizarContrasena
    @id_administrador INT,
    @contrasena_hash_nueva NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @ahora DATETIME2(6);
    DECLARE @tokens_revocados INT = 0;
    DECLARE @codigos_invalidados INT = 0;

    IF @id_administrador IS NULL
       OR @id_administrador <= 0
    BEGIN
        THROW 50020,
              N'El administrador indicado no es válido.',
              1;
    END;

    IF NULLIF(
        LTRIM(RTRIM(@contrasena_hash_nueva)),
        N''
    ) IS NULL
    BEGIN
        THROW 50021,
              N'El nuevo hash de la contraseña es obligatorio.',
              1;
    END;

    IF NOT EXISTS (
        SELECT 1
        FROM dbo.administradores
        WHERE id_administrador = @id_administrador
    )
    BEGIN
        THROW 50022,
              N'No se encontró el administrador.',
              1;
    END;

    SET @ahora = SYSUTCDATETIME();

    BEGIN TRY
        BEGIN TRANSACTION;

        /*
         * Actualizar el hash de la contraseña.
         */
        UPDATE dbo.administradores
        SET
            contrasena_hash =
                @contrasena_hash_nueva,

            requiere_cambio_contrasena = 0,

            fecha_actualizacion =
                @ahora
        WHERE id_administrador =
              @id_administrador;

        IF @@ROWCOUNT = 0
        BEGIN
            THROW 50023,
                  N'No fue posible actualizar la contraseña.',
                  1;
        END;

        /*
         * Revocar todos los tokens activos:
         * - Sesiones.
         * - Tokens temporales de verificación.
         * - Tokens de recuperación.
         */
        UPDATE dbo.tokens_administrador
        SET
            fecha_revocacion = @ahora
        WHERE id_administrador =
              @id_administrador
          AND fecha_revocacion IS NULL
          AND usado = 0;

        SET @tokens_revocados = @@ROWCOUNT;

        /*
         * Invalidar códigos pendientes.
         */
        UPDATE dbo.codigos_verificacion_admin
        SET
            usado = 1,

            fecha_uso = COALESCE(
                fecha_uso,
                @ahora
            )
        WHERE id_administrador =
              @id_administrador
          AND usado = 0;

        SET @codigos_invalidados = @@ROWCOUNT;

        COMMIT TRANSACTION;

        SELECT
            a.id_administrador,
            a.correo,
            a.fecha_actualizacion,
            @tokens_revocados
                AS tokens_revocados,
            @codigos_invalidados
                AS codigos_invalidados
        FROM dbo.administradores AS a
        WHERE a.id_administrador =
              @id_administrador;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;
    END CATCH;
END;
GO
