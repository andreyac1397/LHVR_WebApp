USE [BD-LHVR];
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

/*
 * ============================================================
 * MIGRACIÓN 006
 * CONTENIDO INICIAL DE LA PÁGINA INICIO
 * Liceo Hernán Vargas Ramírez
 * ============================================================
 *
 * Esta migración:
 * - Conserva el HERO_INICIO existente.
 * - Actualiza sus textos sin eliminar su futura imagen.
 * - Crea o actualiza los dos botones principales.
 * - Crea o actualiza el encabezado de accesos rápidos.
 * - Crea o actualiza los cuatro accesos actuales.
 * - Puede ejecutarse nuevamente sin duplicar registros.
 * ============================================================
 */

BEGIN TRY
  BEGIN TRANSACTION;

  DECLARE @id_pagina INT;

  DECLARE @id_estado_publicado INT;

  DECLARE @id_administrador INT;

  /*
   * Obtener la página Inicio.
   */
  SELECT
    @id_pagina =
      p.id_pagina,

    @id_administrador =
      p.id_administrador_ultima_modificacion
  FROM dbo.paginas AS p
  WHERE p.slug = N'inicio';

  IF @id_pagina IS NULL
  BEGIN
    THROW 50001,
      N'No existe la página con slug inicio.',
      1;
  END;

  /*
   * Obtener el estado Publicado.
   */
  SELECT
    @id_estado_publicado =
      ep.id_estado_publicacion
  FROM dbo.estados_publicacion AS ep
  WHERE ep.nombre = N'Publicado'
    AND ep.activo = 1;

  IF @id_estado_publicado IS NULL
  BEGIN
    THROW 50002,
      N'No existe un estado Publicado activo.',
      1;
  END;

  /*
   * Utilizar el administrador que modificó
   * actualmente la página Inicio.
   *
   * Según los datos actuales corresponde
   * al administrador con identificador 1.
   */
  SET @id_administrador =
    COALESCE(
      @id_administrador,
      1
    );

  IF NOT EXISTS (
    SELECT 1
    FROM dbo.administradores
    WHERE id_administrador =
      @id_administrador
  )
  BEGIN
    THROW 50003,
      N'No existe el administrador utilizado para la migración.',
      1;
  END;

  /*
   * ==========================================================
   * 1. HERO EXISTENTE
   * ==========================================================
   *
   * No se cambia id_archivo.
   * Cuando implementemos la carga visual,
   * el logo se registrará correctamente
   * en la tabla archivos.
   */

  UPDATE dbo.secciones_pagina
  SET
    etiqueta =
      N'Sección principal del Inicio',

    titulo =
      N'Liceo Hernán Vargas Ramírez',

    subtitulo =
      N'Formación integral con valores, conocimiento y comunidad.',

    texto_alternativo =
      N'Logo del Liceo Hernán Vargas Ramírez',

    texto_boton =
      NULL,

    url_boton =
      NULL,

    tipo_enlace =
      NULL,

    tipo_diseno =
      N'HERO',

    posicion_imagen =
      N'IZQUIERDA',

    orden =
      1,

    id_estado_publicacion =
      @id_estado_publicado,

    fecha_actualizacion =
      SYSUTCDATETIME(),

    id_administrador_ultima_modificacion =
      @id_administrador
  WHERE id_pagina =
      @id_pagina
    AND clave =
      N'HERO_INICIO';

  IF @@ROWCOUNT = 0
  BEGIN
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
    VALUES (
      @id_pagina,
      N'HERO_INICIO',
      N'Sección principal del Inicio',
      N'Liceo Hernán Vargas Ramírez',
      N'Formación integral con valores, conocimiento y comunidad.',
      NULL,
      NULL,
      N'Logo del Liceo Hernán Vargas Ramírez',
      NULL,
      NULL,
      NULL,
      N'HERO',
      N'IZQUIERDA',
      1,
      @id_estado_publicado,
      SYSUTCDATETIME(),
      SYSUTCDATETIME(),
      @id_administrador
    );
  END;

  /*
   * ==========================================================
   * 2. CONTENIDO RESTANTE DEL INICIO
   * ==========================================================
   */

  DECLARE @secciones_inicio TABLE (
    clave NVARCHAR(120) NOT NULL,
    etiqueta NVARCHAR(120) NULL,
    titulo NVARCHAR(250) NULL,
    subtitulo NVARCHAR(300) NULL,
    contenido NVARCHAR(MAX) NULL,
    texto_alternativo NVARCHAR(300) NULL,
    texto_boton NVARCHAR(120) NULL,
    url_boton NVARCHAR(1000) NULL,
    tipo_enlace NVARCHAR(30) NULL,
    tipo_diseno NVARCHAR(50) NULL,
    posicion_imagen NVARCHAR(20) NULL,
    orden INT NOT NULL
  );

  INSERT INTO @secciones_inicio (
    clave,
    etiqueta,
    titulo,
    subtitulo,
    contenido,
    texto_alternativo,
    texto_boton,
    url_boton,
    tipo_enlace,
    tipo_diseno,
    posicion_imagen,
    orden
  )
  VALUES
  (
    N'BOTON_CONOCE_LICEO',
    N'Botón Conoce el liceo',
    NULL,
    NULL,
    NULL,
    NULL,
    N'Conoce el liceo',
    N'pages/nosotros.html',
    N'INTERNO',
    N'BOTON_HERO',
    NULL,
    2
  ),
  (
    N'BOTON_CONTACTO',
    N'Botón Contáctanos',
    NULL,
    NULL,
    NULL,
    NULL,
    N'Contáctanos',
    N'pages/contacto-ubicacion.html',
    N'INTERNO',
    N'BOTON_HERO',
    NULL,
    3
  ),
  (
    N'ENCABEZADO_ACCESOS_RAPIDOS',
    N'Encabezado de accesos rápidos',
    N'Accesos rápidos',
    N'Encuentra fácilmente lo más importante para nuestra comunidad.',
    NULL,
    NULL,
    NULL,
    NULL,
    N'NINGUNO',
    N'ENCABEZADO_SECCION',
    NULL,
    10
  ),
  (
    N'ACCESO_RAPIDO_BOLETINES',
    N'Acceso rápido Boletines',
    N'Boletines',
    N'Comunicados y avisos importantes del liceo.',
    N'ACCESO_BOLETINES',
    NULL,
    N'Boletines',
    N'pages/boletines.html',
    N'INTERNO',
    N'ACCESO_RAPIDO',
    NULL,
    11
  ),
  (
    N'ACCESO_RAPIDO_CALENDARIO',
    N'Acceso rápido Calendario',
    N'Calendario',
    N'Actividades y fechas institucionales.',
    N'ACCESO_CALENDARIO',
    NULL,
    N'Calendario',
    N'pages/calendario.html',
    N'INTERNO',
    N'ACCESO_RAPIDO',
    NULL,
    12
  ),
  (
    N'ACCESO_RAPIDO_DOCUMENTOS',
    N'Acceso rápido Documentos',
    N'Documentos',
    N'Circulares, reglamentos y formularios.',
    N'ACCESO_DOCUMENTOS',
    NULL,
    N'Documentos',
    N'pages/documentos-importantes.html',
    N'INTERNO',
    N'ACCESO_RAPIDO',
    NULL,
    13
  ),
  (
    N'ACCESO_RAPIDO_CONTACTO',
    N'Acceso rápido Contacto',
    N'Contacto',
    N'Ubicación, horarios y datos de contacto.',
    N'ACCESO_CONTACTO',
    NULL,
    N'Contacto',
    N'pages/contacto-ubicacion.html',
    N'INTERNO',
    N'ACCESO_RAPIDO',
    NULL,
    14
  );

  /*
   * Actualizar las secciones que ya existen.
   */
  UPDATE destino
  SET
    destino.etiqueta =
      origen.etiqueta,

    destino.titulo =
      origen.titulo,

    destino.subtitulo =
      origen.subtitulo,

    destino.contenido =
      origen.contenido,

    destino.id_archivo =
      NULL,

    destino.texto_alternativo =
      origen.texto_alternativo,

    destino.texto_boton =
      origen.texto_boton,

    destino.url_boton =
      origen.url_boton,

    destino.tipo_enlace =
      origen.tipo_enlace,

    destino.tipo_diseno =
      origen.tipo_diseno,

    destino.posicion_imagen =
      origen.posicion_imagen,

    destino.orden =
      origen.orden,

    destino.id_estado_publicacion =
      @id_estado_publicado,

    destino.fecha_actualizacion =
      SYSUTCDATETIME(),

    destino.id_administrador_ultima_modificacion =
      @id_administrador
  FROM dbo.secciones_pagina AS destino
  INNER JOIN @secciones_inicio AS origen
    ON origen.clave =
      destino.clave
  WHERE destino.id_pagina =
    @id_pagina;

  /*
   * Insertar únicamente las secciones
   * que todavía no existen.
   */
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
    @id_pagina,
    origen.clave,
    origen.etiqueta,
    origen.titulo,
    origen.subtitulo,
    origen.contenido,
    NULL,
    origen.texto_alternativo,
    origen.texto_boton,
    origen.url_boton,
    origen.tipo_enlace,
    origen.tipo_diseno,
    origen.posicion_imagen,
    origen.orden,
    @id_estado_publicado,
    SYSUTCDATETIME(),
    SYSUTCDATETIME(),
    @id_administrador
  FROM @secciones_inicio AS origen
  WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.secciones_pagina AS existente
    WHERE existente.id_pagina =
        @id_pagina
      AND existente.clave =
        origen.clave
  );

  /*
   * Actualizar la fecha general de la página.
   */
  UPDATE dbo.paginas
  SET
    fecha_actualizacion =
      SYSUTCDATETIME(),

    id_administrador_ultima_modificacion =
      @id_administrador
  WHERE id_pagina =
    @id_pagina;

  COMMIT TRANSACTION;

  /*
   * ==========================================================
   * VERIFICACIÓN
   * ==========================================================
   */

  SELECT
    sp.id_seccion_pagina,
    sp.clave,
    sp.etiqueta,
    sp.titulo,
    sp.subtitulo,
    sp.contenido,
    sp.texto_boton,
    sp.url_boton,
    sp.tipo_enlace,
    sp.tipo_diseno,
    sp.posicion_imagen,
    sp.orden,
    ep.nombre AS estado_publicacion,
    sp.id_archivo
  FROM dbo.secciones_pagina AS sp
  INNER JOIN dbo.estados_publicacion AS ep
    ON ep.id_estado_publicacion =
      sp.id_estado_publicacion
  WHERE sp.id_pagina =
    @id_pagina
  ORDER BY
    sp.orden,
    sp.id_seccion_pagina;

  PRINT N'Migración 006 ejecutada correctamente.';
END TRY
BEGIN CATCH
  IF XACT_STATE() <> 0
  BEGIN
    ROLLBACK TRANSACTION;
  END;

  THROW;
END CATCH;
GO
