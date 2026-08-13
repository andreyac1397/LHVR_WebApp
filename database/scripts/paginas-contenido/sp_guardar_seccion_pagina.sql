USE [BD-LHVR]
GO
/****** Objeto: StoredProcedure [dbo].[sp_guardar_seccion_pagina] Fecha de script: 31/7/2026 10:39:00 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER   PROCEDURE [dbo].[sp_guardar_seccion_pagina]
    @idSeccionPagina BIGINT = NULL,
    @idPagina INT,
    @clave NVARCHAR(120),
    @etiqueta NVARCHAR(120) = NULL,
    @titulo NVARCHAR(250) = NULL,
    @subtitulo NVARCHAR(300) = NULL,
    @contenido NVARCHAR(MAX) = NULL,
    @idArchivo BIGINT = NULL,
    @textoAlternativo NVARCHAR(300) = NULL,
    @textoBoton NVARCHAR(120) = NULL,
    @urlBoton NVARCHAR(1000) = NULL,
    @tipoEnlace NVARCHAR(30) = NULL,
    @tipoDiseno NVARCHAR(50) = NULL,
    @posicionImagen NVARCHAR(20) = NULL,
    @orden INT = 0,
    @idEstadoPublicacion INT,
    @idAdministradorUltimaModificacion INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @clave = NULLIF(
        UPPER(LTRIM(RTRIM(@clave))),
        N''
    );

    SET @etiqueta =
        NULLIF(LTRIM(RTRIM(@etiqueta)), N'');

    SET @titulo =
        NULLIF(LTRIM(RTRIM(@titulo)), N'');

    SET @subtitulo =
        NULLIF(LTRIM(RTRIM(@subtitulo)), N'');

    SET @textoAlternativo =
        NULLIF(
            LTRIM(RTRIM(@textoAlternativo)),
            N''
        );

    SET @textoBoton =
        NULLIF(LTRIM(RTRIM(@textoBoton)), N'');

    SET @urlBoton =
        NULLIF(LTRIM(RTRIM(@urlBoton)), N'');

    SET @tipoEnlace =
        NULLIF(
            UPPER(LTRIM(RTRIM(@tipoEnlace))),
            N''
        );

    SET @tipoDiseno =
        NULLIF(
            UPPER(LTRIM(RTRIM(@tipoDiseno))),
            N''
        );

    SET @posicionImagen =
        NULLIF(
            UPPER(LTRIM(RTRIM(@posicionImagen))),
            N''
        );

    IF @idSeccionPagina IS NOT NULL
       AND @idSeccionPagina <= 0
    BEGIN
        THROW 50010,
              N'El identificador de la sección no es válido.',
              1;
    END;

    IF @idPagina IS NULL OR @idPagina <= 0
    BEGIN
        THROW 50011,
              N'La página indicada no es válida.',
              1;
    END;

    IF @clave IS NULL
    BEGIN
        THROW 50012,
              N'La clave de la sección es obligatoria.',
              1;
    END;

    IF @orden < 0
    BEGIN
        THROW 50013,
              N'El orden de la sección no puede ser negativo.',
              1;
    END;

    IF @idEstadoPublicacion IS NULL
       OR @idEstadoPublicacion <= 0
    BEGIN
        THROW 50014,
              N'El estado de publicación no es válido.',
              1;
    END;

    IF @idAdministradorUltimaModificacion IS NULL
       OR @idAdministradorUltimaModificacion <= 0
    BEGIN
        THROW 50015,
              N'El administrador indicado no es válido.',
              1;
    END;

    IF @tipoEnlace IS NOT NULL
       AND @tipoEnlace NOT IN
       (
           N'INTERNO',
           N'EXTERNO',
           N'ARCHIVO',
           N'NINGUNO'
       )
    BEGIN
        THROW 50016,
              N'El tipo de enlace no es válido.',
              1;
    END;

    IF @posicionImagen IS NOT NULL
       AND @posicionImagen NOT IN
       (
           N'IZQUIERDA',
           N'DERECHA',
           N'ARRIBA',
           N'ABAJO',
           N'FONDO'
       )
    BEGIN
        THROW 50017,
              N'La posición de la imagen no es válida.',
              1;
    END;

    IF NOT EXISTS
    (
        SELECT 1
        FROM dbo.paginas
        WHERE id_pagina = @idPagina
    )
    BEGIN
        THROW 50018,
              N'La página indicada no existe.',
              1;
    END;

    IF NOT EXISTS
    (
        SELECT 1
        FROM dbo.estados_publicacion
        WHERE
            id_estado_publicacion =
                @idEstadoPublicacion
            AND activo = 1
    )
    BEGIN
        THROW 50019,
              N'El estado de publicación no existe o está inactivo.',
              1;
    END;

    IF NOT EXISTS
    (
        SELECT 1
        FROM dbo.administradores
        WHERE
            id_administrador =
                @idAdministradorUltimaModificacion
    )
    BEGIN
        THROW 50020,
              N'El administrador indicado no existe.',
              1;
    END;

    IF @idArchivo IS NOT NULL
       AND NOT EXISTS
       (
           SELECT 1
           FROM dbo.archivos
           WHERE
               id_archivo = @idArchivo
               AND activo = 1
       )
    BEGIN
        THROW 50021,
              N'El archivo indicado no existe o está inactivo.',
              1;
    END;

    BEGIN TRY
        BEGIN TRANSACTION;

        /*
         * Crear una sección nueva.
         */
        IF @idSeccionPagina IS NULL
        BEGIN
            IF EXISTS
            (
                SELECT 1
                FROM dbo.secciones_pagina
                WHERE
                    id_pagina = @idPagina
                    AND clave = @clave
            )
            BEGIN
                THROW 50022,
                      N'Ya existe una sección con esa clave dentro de la página.',
                      1;
            END;

            INSERT INTO dbo.secciones_pagina
            (
                id_pagina,
                clave,
                etiqueta,
                titulo,
                subtitulo,
                contenido,
                id_archivo,
                texto_alternativo,
                texto_boton,
                url_boton,
                tipo_enlace,
                tipo_diseno,
                posicion_imagen,
                orden,
                id_estado_publicacion,
                fecha_creacion,
                fecha_actualizacion,
                id_administrador_ultima_modificacion
            )
            VALUES
            (
                @idPagina,
                @clave,
                @etiqueta,
                @titulo,
                @subtitulo,
                @contenido,
                @idArchivo,
                @textoAlternativo,
                @textoBoton,
                @urlBoton,
                @tipoEnlace,
                @tipoDiseno,
                @posicionImagen,
                @orden,
                @idEstadoPublicacion,
                SYSUTCDATETIME(),
                SYSUTCDATETIME(),
                @idAdministradorUltimaModificacion
            );

            SET @idSeccionPagina =
                CONVERT(BIGINT, SCOPE_IDENTITY());
        END;
        ELSE
        BEGIN
            /*
             * Actualizar una sección existente.
             */
            IF NOT EXISTS
            (
                SELECT 1
                FROM dbo.secciones_pagina
                WHERE
                    id_seccion_pagina =
                        @idSeccionPagina
                    AND id_pagina = @idPagina
            )
            BEGIN
                THROW 50023,
                      N'La sección indicada no existe dentro de la página.',
                      1;
            END;

            IF EXISTS
            (
                SELECT 1
                FROM dbo.secciones_pagina
                WHERE
                    id_pagina = @idPagina
                    AND clave = @clave
                    AND id_seccion_pagina <>
                        @idSeccionPagina
            )
            BEGIN
                THROW 50024,
                      N'Ya existe otra sección con esa clave dentro de la página.',
                      1;
            END;

            UPDATE dbo.secciones_pagina
            SET
                clave = @clave,
                etiqueta = @etiqueta,
                titulo = @titulo,
                subtitulo = @subtitulo,
                contenido = @contenido,
                id_archivo = @idArchivo,
                texto_alternativo =
                    @textoAlternativo,
                texto_boton = @textoBoton,
                url_boton = @urlBoton,
                tipo_enlace = @tipoEnlace,
                tipo_diseno = @tipoDiseno,
                posicion_imagen =
                    @posicionImagen,
                orden = @orden,
                id_estado_publicacion =
                    @idEstadoPublicacion,
                fecha_actualizacion =
                    SYSUTCDATETIME(),
                id_administrador_ultima_modificacion =
                    @idAdministradorUltimaModificacion
            WHERE
                id_seccion_pagina =
                    @idSeccionPagina;
        END;

        /*
         * Actualizar también la fecha general
         * de modificación de la página.
         */
        UPDATE dbo.paginas
        SET
            fecha_actualizacion =
                SYSUTCDATETIME(),

            id_administrador_ultima_modificacion =
                @idAdministradorUltimaModificacion
        WHERE
            id_pagina = @idPagina;

        COMMIT TRANSACTION;

        /*
         * Devolver la sección guardada.
         */
        SELECT
            sp.id_seccion_pagina
                AS idSeccionPagina,

            sp.id_pagina AS idPagina,
            sp.clave,
            sp.etiqueta,
            sp.titulo,
            sp.subtitulo,
            sp.contenido,

            sp.id_archivo AS idArchivo,

            sp.texto_alternativo
                AS textoAlternativo,

            sp.texto_boton AS textoBoton,
            sp.url_boton AS urlBoton,
            sp.tipo_enlace AS tipoEnlace,
            sp.tipo_diseno AS tipoDiseno,
            sp.posicion_imagen
                AS posicionImagen,

            sp.orden,

            sp.id_estado_publicacion
                AS idEstadoPublicacion,

            ep.nombre AS nombreEstado,
            ep.es_visible AS estadoVisible,

            a.nombre_original
                AS nombreArchivoOriginal,

            a.nombre_almacenado
                AS nombreArchivoAlmacenado,

            a.ruta_relativa AS rutaArchivo,

            sp.fecha_creacion AS fechaCreacion,
            sp.fecha_actualizacion
                AS fechaActualizacion,

            sp.id_administrador_ultima_modificacion
                AS idAdministradorUltimaModificacion
        FROM dbo.secciones_pagina AS sp
        INNER JOIN dbo.estados_publicacion AS ep
            ON ep.id_estado_publicacion =
               sp.id_estado_publicacion
        LEFT JOIN dbo.archivos AS a
            ON a.id_archivo = sp.id_archivo
        WHERE
            sp.id_seccion_pagina =
                @idSeccionPagina;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
        BEGIN
            ROLLBACK TRANSACTION;
        END;

        THROW;
    END CATCH;
END;
