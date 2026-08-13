USE [BD-LHVR]
GO
/****** Objeto: StoredProcedure [dbo].[sp_obtener_contenido_pagina_por_slug] Fecha de script: 31/7/2026 10:39:13 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER   PROCEDURE [dbo].[sp_obtener_contenido_pagina_por_slug]
    @slug NVARCHAR(160),
    @soloVisibles BIT = 0
AS
BEGIN
    SET NOCOUNT ON;

    SET @slug = NULLIF(
        LOWER(LTRIM(RTRIM(@slug))),
        N''
    );

    IF @slug IS NULL
    BEGIN
        THROW 50001,
              N'El slug de la página es obligatorio.',
              1;
    END;

    DECLARE @idPagina INT;

    SELECT
        @idPagina = p.id_pagina
    FROM dbo.paginas AS p
    WHERE LOWER(p.slug) = @slug;

    IF @idPagina IS NULL
    BEGIN
        THROW 50002,
              N'La página solicitada no existe.',
              1;
    END;

    /*
     * Primer resultado:
     * información general de la página.
     */
    SELECT
        p.id_pagina AS idPagina,
        p.nombre,
        p.slug,
        p.titulo,
        p.descripcion,
        p.ruta,
        p.orden_menu AS ordenMenu,
        p.mostrar_menu AS mostrarMenu,

        p.id_estado_publicacion
            AS idEstadoPublicacion,

        ep.nombre AS nombreEstado,
        ep.es_visible AS estadoVisible,

        p.fecha_publicacion
            AS fechaPublicacion,

        p.fecha_creacion
            AS fechaCreacion,

        p.fecha_actualizacion
            AS fechaActualizacion,

        p.id_administrador_ultima_modificacion
            AS idAdministradorUltimaModificacion
    FROM dbo.paginas AS p
    INNER JOIN dbo.estados_publicacion AS ep
        ON ep.id_estado_publicacion =
           p.id_estado_publicacion
    WHERE
        p.id_pagina = @idPagina
        AND
        (
            @soloVisibles = 0
            OR
            (
                ep.es_visible = 1
                AND ep.activo = 1
            )
        );

    /*
     * Segundo resultado:
     * secciones pertenecientes a la página.
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
        sp.posicion_imagen AS posicionImagen,
        sp.orden,

        sp.id_estado_publicacion
            AS idEstadoPublicacion,

        esp.nombre AS nombreEstado,
        esp.es_visible AS estadoVisible,

        a.nombre_original AS nombreArchivoOriginal,
        a.nombre_almacenado AS nombreArchivoAlmacenado,
        a.ruta_relativa AS rutaArchivo,
        a.mime_type AS mimeTypeArchivo,
        a.tipo_archivo AS tipoArchivo,
        a.activo AS archivoActivo,

        sp.fecha_creacion AS fechaCreacion,
        sp.fecha_actualizacion AS fechaActualizacion,

        sp.id_administrador_ultima_modificacion
            AS idAdministradorUltimaModificacion
    FROM dbo.secciones_pagina AS sp
    INNER JOIN dbo.estados_publicacion AS esp
        ON esp.id_estado_publicacion =
           sp.id_estado_publicacion
    LEFT JOIN dbo.archivos AS a
        ON a.id_archivo = sp.id_archivo
        AND
        (
            @soloVisibles = 0
            OR a.activo = 1
        )
    WHERE
        sp.id_pagina = @idPagina
        AND
        (
            @soloVisibles = 0
            OR
            (
                esp.es_visible = 1
                AND esp.activo = 1

                AND EXISTS
                (
                    SELECT 1
                    FROM dbo.paginas AS p2
                    INNER JOIN dbo.estados_publicacion AS ep2
                        ON ep2.id_estado_publicacion =
                           p2.id_estado_publicacion
                    WHERE
                        p2.id_pagina = @idPagina
                        AND ep2.es_visible = 1
                        AND ep2.activo = 1
                )
            )
        )
    ORDER BY
        sp.orden ASC,
        sp.id_seccion_pagina ASC;
END;
