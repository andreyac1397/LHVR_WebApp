USE [BD-LHVR];
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

/*
 * Contenido inicial de la página y del módulo Trámites.
 * Puede ejecutarse nuevamente sin duplicar la página, colección o tarjetas.
 */
BEGIN TRY
  BEGIN TRANSACTION;

  IF OBJECT_ID(N'dbo.paginas', N'U') IS NULL
    THROW 51400, N'No existe la tabla dbo.paginas.', 1;

  IF OBJECT_ID(N'dbo.cms_colecciones', N'U') IS NULL
    THROW 51401, N'No existe la tabla dbo.cms_colecciones. Ejecute primero la migración 006.', 1;

  IF OBJECT_ID(N'dbo.cms_elementos', N'U') IS NULL
    THROW 51402, N'No existe la tabla dbo.cms_elementos. Ejecute primero la migración 006.', 1;

  DECLARE @id_estado_publicado INT;
  DECLARE @id_administrador INT;
  DECLARE @id_coleccion INT;

  SELECT TOP (1)
    @id_estado_publicado = id_estado_publicacion
  FROM dbo.estados_publicacion
  WHERE nombre = N'Publicado'
    AND activo = 1
  ORDER BY id_estado_publicacion;

  SELECT TOP (1)
    @id_administrador = id_administrador
  FROM dbo.administradores
  ORDER BY id_administrador;

  IF @id_estado_publicado IS NULL
    THROW 51403, N'No existe un estado Publicado activo.', 1;

  IF @id_administrador IS NULL
    THROW 51404, N'No existe un administrador para registrar el contenido.', 1;

  /* Página utilizada para editar el encabezado desde el panel. */
  IF NOT EXISTS (
    SELECT 1
    FROM dbo.paginas
    WHERE slug = N'tramites'
  )
  BEGIN
    INSERT INTO dbo.paginas (
      nombre,
      slug,
      titulo,
      descripcion,
      ruta,
      orden_menu,
      mostrar_menu,
      id_estado_publicacion,
      fecha_publicacion,
      id_administrador_ultima_modificacion
    )
    VALUES (
      N'Trámites',
      N'tramites',
      N'Horarios y trámites',
      N'Consulte horarios, requisitos, formularios y documentos importantes de la institución.',
      N'pages/documentos-importantes.html',
      13,
      1,
      @id_estado_publicado,
      SYSUTCDATETIME(),
      @id_administrador
    );
  END
  ELSE
  BEGIN
    UPDATE dbo.paginas
    SET
      nombre = N'Trámites',
      titulo = N'Horarios y trámites',
      descripcion = N'Consulte horarios, requisitos, formularios y documentos importantes de la institución.',
      ruta = N'pages/documentos-importantes.html',
      id_estado_publicacion = @id_estado_publicado,
      fecha_publicacion = COALESCE(fecha_publicacion, SYSUTCDATETIME()),
      id_administrador_ultima_modificacion = @id_administrador,
      fecha_actualizacion = SYSUTCDATETIME()
    WHERE slug = N'tramites';
  END;

  /* Una sola colección inicial y pública para los documentos entregados. */
  SELECT
    @id_coleccion = id_coleccion
  FROM dbo.cms_colecciones
  WHERE modulo = N'TRAMITES'
    AND clave = N'tramites-documentos-iniciales-2026';

  IF @id_coleccion IS NULL
  BEGIN
    INSERT INTO dbo.cms_colecciones (
      modulo,
      clave,
      nombre,
      anio,
      estado,
      publicada,
      metadatos_json,
      id_administrador_ultima_modificacion
    )
    VALUES (
      N'TRAMITES',
      N'tramites-documentos-iniciales-2026',
      N'Trámites y documentos iniciales',
      2026,
      N'PUBLICADO',
      1,
      N'{"origen":"documentos.json","cantidad":6}',
      @id_administrador
    );

    SET @id_coleccion = SCOPE_IDENTITY();
  END
  ELSE
  BEGIN
    UPDATE dbo.cms_colecciones
    SET
      nombre = N'Trámites y documentos iniciales',
      anio = 2026,
      estado = N'PUBLICADO',
      publicada = 1,
      metadatos_json = N'{"origen":"documentos.json","cantidad":6}',
      id_administrador_ultima_modificacion = @id_administrador,
      fecha_actualizacion = SYSUTCDATETIME()
    WHERE id_coleccion = @id_coleccion;
  END;

  UPDATE dbo.cms_colecciones
  SET
    publicada = 0,
    estado = CASE WHEN estado = N'PUBLICADO' THEN N'BORRADOR' ELSE estado END,
    fecha_actualizacion = SYSUTCDATETIME()
  WHERE modulo = N'TRAMITES'
    AND id_coleccion <> @id_coleccion
    AND publicada = 1;

  DECLARE @tramites TABLE (
    clave_externa NVARCHAR(180) NOT NULL,
    titulo NVARCHAR(500) NOT NULL,
    categoria NVARCHAR(80) NOT NULL,
    descripcion NVARCHAR(MAX) NOT NULL,
    url NVARCHAR(2048) NOT NULL,
    orden INT NOT NULL
  );

  INSERT INTO @tramites (
    clave_externa, titulo, categoria, descripcion, url, orden
  )
  VALUES
    (
      N'tramite-1',
      N'Información de prematrícula y matrícula',
      N'matricula',
      N'Documento informativo con requisitos generales, pasos y recomendaciones para el proceso de prematrícula y matrícula estudiantil.',
      N'https://drive.google.com/file/d/198PCAwLvzvUAwCvCmfZFZY8t0G7Q_t89/view?usp=sharing',
      1
    ),
    (
      N'tramite-2',
      N'Solicitud de traslado estudiantil',
      N'solicitud',
      N'Información para estudiantes que requieren trasladarse desde o hacia otra institución educativa.',
      N'https://drive.google.com/file/d/1mop2YWrSUa9AXOJdZ_uxfbYrCQf7cAdn/view?usp=sharing',
      2
    ),
    (
      N'tramite-3',
      N'Guía de justificación de ausencias',
      N'solicitud',
      N'Formulario o guía para presentar la justificación de una ausencia estudiantil.',
      N'https://drive.google.com/file/d/1xeRjM4SpjW_iNiEjxEHzJdYRI5AucG3-/view?usp=drive_link',
      3
    ),
    (
      N'tramite-4',
      N'Avancemos - IMAS',
      N'beneficio',
      N'Información sobre el beneficio económico Avancemos, dirigido a apoyar la permanencia de estudiantes en el sistema educativo.',
      N'https://drive.google.com/file/d/1C8G-6xJxzCNudtODUFf2UMl7EfmPWgE3/view?usp=drive_link',
      4
    ),
    (
      N'tramite-5',
      N'Transporte estudiantil - MEP',
      N'beneficio',
      N'Información sobre el programa de transporte estudiantil para estudiantes que requieren apoyo de traslado al centro educativo.',
      N'https://drive.google.com/file/d/1VSxxeAV31CM1XWN61hG5G66ukJNmbWJp/view?usp=drive_link',
      5
    ),
    (
      N'tramite-6',
      N'Comedor estudiantil - PANEA',
      N'beneficio',
      N'Información sobre el servicio de alimentación estudiantil del Programa de Alimentación y Nutrición del Escolar y del Adolescente.',
      N'https://drive.google.com/file/d/1p4Eb6SPDxf7EMuZfjXHAeMMgOonFjBVc/view?usp=drive_link',
      6
    );

  UPDATE destino
  SET
    destino.titulo = origen.titulo,
    destino.descripcion = origen.descripcion,
    destino.url = origen.url,
    destino.orden = origen.orden,
    destino.estado = N'PUBLICADO',
    destino.destacado = 0,
    destino.datos_json = N'{"categoria":"' + origen.categoria + N'"}',
    destino.id_administrador_ultima_modificacion = @id_administrador,
    destino.fecha_actualizacion = SYSUTCDATETIME()
  FROM dbo.cms_elementos AS destino
  INNER JOIN @tramites AS origen
    ON origen.clave_externa = destino.clave_externa
  WHERE destino.id_coleccion = @id_coleccion
    AND destino.modulo = N'TRAMITES';

  INSERT INTO dbo.cms_elementos (
    id_coleccion,
    modulo,
    clave_externa,
    titulo,
    descripcion,
    orden,
    estado,
    destacado,
    url,
    datos_json,
    id_administrador_ultima_modificacion
  )
  SELECT
    @id_coleccion,
    N'TRAMITES',
    origen.clave_externa,
    origen.titulo,
    origen.descripcion,
    origen.orden,
    N'PUBLICADO',
    0,
    origen.url,
    N'{"categoria":"' + origen.categoria + N'"}',
    @id_administrador
  FROM @tramites AS origen
  WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.cms_elementos AS existente
    WHERE existente.id_coleccion = @id_coleccion
      AND existente.modulo = N'TRAMITES'
      AND existente.clave_externa = origen.clave_externa
  );

  COMMIT TRANSACTION;

  SELECT
    p.id_pagina,
    p.slug,
    p.titulo,
    p.ruta
  FROM dbo.paginas AS p
  WHERE p.slug = N'tramites';

  SELECT
    c.id_coleccion,
    c.nombre,
    c.estado,
    c.publicada,
    COUNT(e.id_elemento) AS cantidad_tarjetas
  FROM dbo.cms_colecciones AS c
  LEFT JOIN dbo.cms_elementos AS e
    ON e.id_coleccion = c.id_coleccion
    AND e.modulo = N'TRAMITES'
  WHERE c.id_coleccion = @id_coleccion
  GROUP BY c.id_coleccion, c.nombre, c.estado, c.publicada;
END TRY
BEGIN CATCH
  IF XACT_STATE() <> 0
    ROLLBACK TRANSACTION;
  THROW;
END CATCH;
GO
