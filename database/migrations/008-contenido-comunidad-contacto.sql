USE [BD-LHVR];
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

/*
 * Contenido inicial editable de Comunidad y Contacto.
 * Puede ejecutarse nuevamente sin duplicar secciones.
 */
BEGIN TRY
  BEGIN TRANSACTION;

  DECLARE @id_estado_publicado INT;
  DECLARE @id_administrador INT;

  SELECT TOP 1
    @id_estado_publicado = id_estado_publicacion
  FROM dbo.estados_publicacion
  WHERE nombre = N'Publicado'
    AND activo = 1
  ORDER BY id_estado_publicacion;

  SELECT TOP 1
    @id_administrador = id_administrador
  FROM dbo.administradores
  ORDER BY id_administrador;

  IF @id_estado_publicado IS NULL
  BEGIN
    THROW 51300,
      N'No existe un estado Publicado activo.',
      1;
  END;

  IF @id_administrador IS NULL
  BEGIN
    THROW 51301,
      N'No existe un administrador para registrar el contenido.',
      1;
  END;

  DECLARE @contenido TABLE (
    slug NVARCHAR(160) NOT NULL,
    clave NVARCHAR(120) NOT NULL,
    etiqueta NVARCHAR(120) NULL,
    titulo NVARCHAR(250) NULL,
    subtitulo NVARCHAR(300) NULL,
    contenido NVARCHAR(MAX) NULL,
    texto_alternativo NVARCHAR(300) NULL,
    texto_boton NVARCHAR(120) NULL,
    url_boton NVARCHAR(1000) NULL,
    tipo_diseno NVARCHAR(50) NULL,
    orden INT NOT NULL
  );

  INSERT INTO @contenido (
    slug,
    clave,
    etiqueta,
    titulo,
    subtitulo,
    contenido,
    texto_alternativo,
    texto_boton,
    url_boton,
    tipo_diseno,
    orden
  )
  VALUES
  (
    N'comunidad',
    N'INTRO_COMUNIDAD',
    N'Introducción',
    N'Nuestra comunidad educativa',
    N'Vida institucional',
    N'El Liceo Hernán Vargas Ramírez es una comunidad formada por estudiantes, docentes, familias y personal comprometido con la educación, la convivencia y el desarrollo integral.',
    NULL,
    NULL,
    NULL,
    N'COMUNIDAD',
    1
  ),
  (
    N'comunidad',
    N'HISTORIA_COMUNIDAD',
    N'Historia institucional',
    N'50 años de historia y comunidad',
    N'Historia institucional',
    N'La historia del liceo se construye con el esfuerzo de generaciones de estudiantes, docentes, familias y personas de la comunidad que han acompañado su crecimiento.',
    N'Imagen histórica del Liceo Hernán Vargas Ramírez',
    NULL,
    NULL,
    N'COMUNIDAD',
    2
  ),
  (
    N'comunidad',
    N'PARTICIPACION_COMUNIDAD',
    N'Participación estudiantil',
    N'Estudiantes que participan y representan al liceo',
    N'Participación estudiantil',
    N'La participación estudiantil fortalece el liderazgo, la responsabilidad y el sentido de pertenencia mediante actividades académicas, deportivas, culturales y comunitarias.',
    N'Estudiantes participando en actividades institucionales',
    NULL,
    NULL,
    N'COMUNIDAD',
    3
  ),
  (
    N'comunidad',
    N'ARTE_COMUNIDAD',
    N'Arte y cultura',
    N'Festival Estudiantil de las Artes',
    N'Arte y cultura',
    N'El arte y la cultura permiten que los estudiantes expresen sus talentos, compartan experiencias y representen al liceo en distintos espacios.',
    N'Actividad artística estudiantil',
    NULL,
    NULL,
    N'COMUNIDAD',
    4
  ),
  (
    N'comunidad',
    N'BIBLIOCRA_COMUNIDAD',
    N'BiblioCRA y comunidad',
    N'Un espacio de lectura, apoyo y aprendizaje',
    N'BiblioCRA y comunidad',
    N'La BiblioCRA acompaña los procesos educativos con recursos, actividades, orientación y espacios para investigar, leer y aprender.',
    N'Biblioteca del Liceo Hernán Vargas Ramírez',
    N'Conocer BiblioCRA',
    N'biblioteca-recursos.html',
    N'COMUNIDAD',
    5
  ),
  (
    N'comunidad',
    N'JUAN_VINAS_COMUNIDAD',
    N'LHVR y Juan Viñas',
    N'Un liceo con identidad comunitaria',
    N'LHVR y Juan Viñas',
    N'La institución mantiene una relación cercana con Juan Viñas y las comunidades vecinas, acompañando el desarrollo educativo y social de nuevas generaciones.',
    N'Vista representativa de Juan Viñas',
    NULL,
    NULL,
    N'COMUNIDAD',
    6
  ),
  (
    N'comunidad',
    N'CIERRE_COMUNIDAD',
    N'Cierre',
    N'Una comunidad que crece junta',
    NULL,
    N'La comunidad del liceo se construye con participación, respeto, compromiso y trabajo conjunto.',
    NULL,
    N'Ver galería institucional',
    N'galeria.html',
    N'COMUNIDAD',
    7
  ),
  (
    N'contacto',
    N'DATOS_CONTACTO',
    N'Datos de contacto',
    N'Datos de contacto',
    N'Liceo Hernán Vargas Ramírez',
    N'Teléfono: 2532-2274 / 8644-6240\nCorreo: lic.hernanvargasramirez@mep.go.cr\nHorario: Lunes a viernes, 7:00 a.m. - 4:10 p.m.',
    N'Juan Viñas, Jiménez, Cartago, Costa Rica',
    NULL,
    NULL,
    N'CONTACTO',
    1
  ),
  (
    N'contacto',
    N'UBICACION_CONTACTO',
    N'Ubicación y mapa',
    N'Mapa',
    N'Juan Viñas, Jiménez, Cartago',
    N'Consulte la ubicación de la institución y utilice el mapa para planificar su visita.',
    NULL,
    N'Abrir ubicación',
    N'https://www.google.com/maps/search/?api=1&query=Liceo+Hernan+Vargas+Ramirez',
    N'CONTACTO',
    2
  ),
  (
    N'contacto',
    N'FORMULARIO_CONTACTO',
    N'Formulario de contacto',
    N'Escríbenos',
    NULL,
    N'Complete el formulario y el mensaje quedará registrado para seguimiento administrativo.',
    NULL,
    N'Enviar mensaje',
    NULL,
    N'CONTACTO',
    3
  );

  IF (
    SELECT COUNT(DISTINCT slug)
    FROM dbo.paginas
    WHERE slug IN (N'comunidad', N'contacto')
  ) <> 2
  BEGIN
    THROW 51302,
      N'No se encontraron las páginas Comunidad o Contacto.',
      1;
  END;

  UPDATE destino
  SET
    destino.etiqueta = origen.etiqueta,
    destino.titulo = origen.titulo,
    destino.subtitulo = origen.subtitulo,
    destino.contenido = origen.contenido,
    destino.texto_alternativo = origen.texto_alternativo,
    destino.texto_boton = origen.texto_boton,
    destino.url_boton = origen.url_boton,
    destino.tipo_enlace = CASE
      WHEN origen.url_boton IS NULL THEN N'NINGUNO'
      ELSE N'INTERNO'
    END,
    destino.tipo_diseno = origen.tipo_diseno,
    destino.orden = origen.orden,
    destino.id_estado_publicacion = @id_estado_publicado,
    destino.fecha_actualizacion = SYSUTCDATETIME(),
    destino.id_administrador_ultima_modificacion = @id_administrador
  FROM dbo.secciones_pagina AS destino
  INNER JOIN dbo.paginas AS pagina
    ON pagina.id_pagina = destino.id_pagina
  INNER JOIN @contenido AS origen
    ON origen.slug = pagina.slug
   AND origen.clave = destino.clave;

  INSERT INTO dbo.secciones_pagina (
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
  SELECT
    pagina.id_pagina,
    origen.clave,
    origen.etiqueta,
    origen.titulo,
    origen.subtitulo,
    origen.contenido,
    NULL,
    origen.texto_alternativo,
    origen.texto_boton,
    origen.url_boton,
    CASE
      WHEN origen.url_boton IS NULL THEN N'NINGUNO'
      ELSE N'INTERNO'
    END,
    origen.tipo_diseno,
    NULL,
    origen.orden,
    @id_estado_publicado,
    SYSUTCDATETIME(),
    SYSUTCDATETIME(),
    @id_administrador
  FROM @contenido AS origen
  INNER JOIN dbo.paginas AS pagina
    ON pagina.slug = origen.slug
  WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.secciones_pagina AS existente
    WHERE existente.id_pagina = pagina.id_pagina
      AND existente.clave = origen.clave
  );

  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF XACT_STATE() <> 0
  BEGIN
    ROLLBACK TRANSACTION;
  END;

  THROW;
END CATCH;
GO
