USE [BD-LHVR];
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

/*
 * ============================================================
 * MIGRACIÓN 006 - GESTIÓN DEL CONTENIDO PENDIENTE
 * ============================================================
 *
 * Esta migración agrega una infraestructura reutilizable para
 * los módulos administrativos que todavía no tenían backend.
 * No modifica las tablas de autenticación ni las páginas que
 * ya funcionan.
 *
 * Puede ejecutarse varias veces sin duplicar objetos.
 * ============================================================
 */

BEGIN TRY
  BEGIN TRANSACTION;

  IF OBJECT_ID(N'dbo.cms_colecciones', N'U') IS NULL
  BEGIN
    CREATE TABLE dbo.cms_colecciones (
      id_coleccion INT IDENTITY(1, 1) NOT NULL,
      modulo NVARCHAR(60) NOT NULL,
      clave NVARCHAR(120) NOT NULL,
      nombre NVARCHAR(250) NOT NULL,
      anio SMALLINT NULL,
      estado NVARCHAR(20) NOT NULL
        CONSTRAINT DF_cms_colecciones_estado
        DEFAULT N'BORRADOR',
      publicada BIT NOT NULL
        CONSTRAINT DF_cms_colecciones_publicada
        DEFAULT 0,
      metadatos_json NVARCHAR(MAX) NULL,
      id_administrador_ultima_modificacion INT NULL,
      fecha_creacion DATETIME2(0) NOT NULL
        CONSTRAINT DF_cms_colecciones_fecha_creacion
        DEFAULT SYSUTCDATETIME(),
      fecha_actualizacion DATETIME2(0) NOT NULL
        CONSTRAINT DF_cms_colecciones_fecha_actualizacion
        DEFAULT SYSUTCDATETIME(),
      CONSTRAINT PK_cms_colecciones
        PRIMARY KEY (id_coleccion),
      CONSTRAINT UQ_cms_colecciones_modulo_clave
        UNIQUE (modulo, clave),
      CONSTRAINT CK_cms_colecciones_estado
        CHECK (estado IN (
          N'BORRADOR',
          N'PUBLICADO',
          N'INACTIVO',
          N'ARCHIVADO'
        )),
      CONSTRAINT CK_cms_colecciones_metadatos_json
        CHECK (
          metadatos_json IS NULL OR
          ISJSON(metadatos_json) = 1
        )
    );
  END;

  IF OBJECT_ID(N'dbo.cms_elementos', N'U') IS NULL
  BEGIN
    CREATE TABLE dbo.cms_elementos (
      id_elemento INT IDENTITY(1, 1) NOT NULL,
      id_coleccion INT NULL,
      modulo NVARCHAR(60) NOT NULL,
      clave_externa NVARCHAR(180) NULL,
      titulo NVARCHAR(500) NULL,
      subtitulo NVARCHAR(500) NULL,
      descripcion NVARCHAR(MAX) NULL,
      fecha_inicio DATETIME2(0) NULL,
      fecha_fin DATETIME2(0) NULL,
      orden INT NOT NULL
        CONSTRAINT DF_cms_elementos_orden
        DEFAULT 0,
      estado NVARCHAR(20) NOT NULL
        CONSTRAINT DF_cms_elementos_estado
        DEFAULT N'PUBLICADO',
      destacado BIT NOT NULL
        CONSTRAINT DF_cms_elementos_destacado
        DEFAULT 0,
      url NVARCHAR(2048) NULL,
      url_secundaria NVARCHAR(2048) NULL,
      id_archivo INT NULL,
      datos_json NVARCHAR(MAX) NULL,
      id_administrador_ultima_modificacion INT NULL,
      fecha_creacion DATETIME2(0) NOT NULL
        CONSTRAINT DF_cms_elementos_fecha_creacion
        DEFAULT SYSUTCDATETIME(),
      fecha_actualizacion DATETIME2(0) NOT NULL
        CONSTRAINT DF_cms_elementos_fecha_actualizacion
        DEFAULT SYSUTCDATETIME(),
      CONSTRAINT PK_cms_elementos
        PRIMARY KEY (id_elemento),
      CONSTRAINT FK_cms_elementos_colecciones
        FOREIGN KEY (id_coleccion)
        REFERENCES dbo.cms_colecciones(id_coleccion),
      CONSTRAINT CK_cms_elementos_estado
        CHECK (estado IN (
          N'BORRADOR',
          N'PUBLICADO',
          N'INACTIVO',
          N'ARCHIVADO'
        )),
      CONSTRAINT CK_cms_elementos_datos_json
        CHECK (
          datos_json IS NULL OR
          ISJSON(datos_json) = 1
        )
    );
  END;

  IF OBJECT_ID(N'dbo.cms_importaciones', N'U') IS NULL
  BEGIN
    CREATE TABLE dbo.cms_importaciones (
      id_importacion INT IDENTITY(1, 1) NOT NULL,
      id_coleccion INT NULL,
      modulo NVARCHAR(60) NOT NULL,
      tipo_origen NVARCHAR(30) NOT NULL,
      nombre_origen NVARCHAR(260) NULL,
      cantidad_recibida INT NOT NULL DEFAULT 0,
      cantidad_guardada INT NOT NULL DEFAULT 0,
      estado NVARCHAR(20) NOT NULL DEFAULT N'COMPLETADA',
      errores_json NVARCHAR(MAX) NULL,
      id_administrador INT NULL,
      fecha_importacion DATETIME2(0) NOT NULL
        DEFAULT SYSUTCDATETIME(),
      CONSTRAINT PK_cms_importaciones
        PRIMARY KEY (id_importacion),
      CONSTRAINT FK_cms_importaciones_colecciones
        FOREIGN KEY (id_coleccion)
        REFERENCES dbo.cms_colecciones(id_coleccion),
      CONSTRAINT CK_cms_importaciones_errores_json
        CHECK (
          errores_json IS NULL OR
          ISJSON(errores_json) = 1
        )
    );
  END;

  IF OBJECT_ID(N'dbo.cms_solicitudes', N'U') IS NULL
  BEGIN
    CREATE TABLE dbo.cms_solicitudes (
      id_solicitud INT IDENTITY(1, 1) NOT NULL,
      modulo NVARCHAR(60) NOT NULL,
      nombre_completo NVARCHAR(180) NOT NULL,
      correo NVARCHAR(254) NOT NULL,
      telefono NVARCHAR(40) NULL,
      asunto NVARCHAR(250) NULL,
      mensaje NVARCHAR(MAX) NULL,
      estado NVARCHAR(30) NOT NULL DEFAULT N'PENDIENTE',
      datos_json NVARCHAR(MAX) NULL,
      respuesta NVARCHAR(MAX) NULL,
      id_administrador_ultima_modificacion INT NULL,
      fecha_creacion DATETIME2(0) NOT NULL
        DEFAULT SYSUTCDATETIME(),
      fecha_actualizacion DATETIME2(0) NOT NULL
        DEFAULT SYSUTCDATETIME(),
      CONSTRAINT PK_cms_solicitudes
        PRIMARY KEY (id_solicitud),
      CONSTRAINT CK_cms_solicitudes_datos_json
        CHECK (
          datos_json IS NULL OR
          ISJSON(datos_json) = 1
        )
    );
  END;

  IF OBJECT_ID(N'dbo.cms_configuracion', N'U') IS NULL
  BEGIN
    CREATE TABLE dbo.cms_configuracion (
      id_configuracion INT IDENTITY(1, 1) NOT NULL,
      clave NVARCHAR(120) NOT NULL,
      valor NVARCHAR(MAX) NULL,
      tipo NVARCHAR(30) NOT NULL DEFAULT N'TEXTO',
      descripcion NVARCHAR(500) NULL,
      publica BIT NOT NULL DEFAULT 1,
      activa BIT NOT NULL DEFAULT 1,
      id_administrador_ultima_modificacion INT NULL,
      fecha_creacion DATETIME2(0) NOT NULL
        DEFAULT SYSUTCDATETIME(),
      fecha_actualizacion DATETIME2(0) NOT NULL
        DEFAULT SYSUTCDATETIME(),
      CONSTRAINT PK_cms_configuracion
        PRIMARY KEY (id_configuracion),
      CONSTRAINT UQ_cms_configuracion_clave
        UNIQUE (clave)
    );
  END;

  IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_cms_elementos_modulo_estado'
      AND object_id = OBJECT_ID(N'dbo.cms_elementos')
  )
  BEGIN
    CREATE INDEX IX_cms_elementos_modulo_estado
      ON dbo.cms_elementos (
        modulo,
        estado,
        id_coleccion,
        orden
      );
  END;

  IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_cms_colecciones_modulo_publicada'
      AND object_id = OBJECT_ID(N'dbo.cms_colecciones')
  )
  BEGIN
    CREATE INDEX IX_cms_colecciones_modulo_publicada
      ON dbo.cms_colecciones (
        modulo,
        publicada,
        anio
      );
  END;

  DECLARE @configuracion_inicial TABLE (
    clave NVARCHAR(120) NOT NULL,
    valor NVARCHAR(MAX) NULL,
    descripcion NVARCHAR(500) NULL
  );

  INSERT INTO @configuracion_inicial (
    clave,
    valor,
    descripcion
  )
  VALUES
    (
      N'NOMBRE_INSTITUCION',
      N'Liceo Hernán Vargas Ramírez',
      N'Nombre oficial mostrado en el sitio público.'
    ),
    (
      N'SIGLAS_INSTITUCION',
      N'LHVR',
      N'Siglas mostradas en el encabezado.'
    ),
    (
      N'LEMA_INSTITUCION',
      N'Formación integral con valores, conocimiento y comunidad.',
      N'Lema mostrado en el pie de página.'
    ),
    (
      N'DIRECCION_INSTITUCION',
      N'Calle 3, Juan Viñas, Jiménez, Cartago, Costa Rica. 120 metros este de la Parroquia de Juan Viñas, frente al supermercado La Canasta.',
      N'Dirección física institucional.'
    ),
    (
      N'TELEFONO_INSTITUCION',
      N'2532-2274 / 8644-6240',
      N'Teléfonos institucionales.'
    ),
    (
      N'CORREO_INSTITUCION',
      N'lic.hernanvargasramirez@mep.go.cr',
      N'Correo institucional público.'
    ),
    (
      N'MAPS_INSTITUCION',
      N'https://maps.app.goo.gl/haUwDr5NaYrQTdSYA',
      N'Enlace de ubicación en mapas.'
    ),
    (
      N'FACEBOOK_INSTITUCION',
      N'https://www.facebook.com/liceohernanvargasramirez/?locale=es_LA',
      N'Página oficial de Facebook.'
    ),
    (
      N'HORARIO_INSTITUCION',
      N'Lunes a viernes, 7:00 a.m. - 4:10 p.m.',
      N'Horario institucional público.'
    );

  INSERT INTO dbo.cms_configuracion (
    clave,
    valor,
    tipo,
    descripcion,
    publica
  )
  SELECT
    origen.clave,
    origen.valor,
    N'TEXTO',
    origen.descripcion,
    1
  FROM @configuracion_inicial AS origen
  WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.cms_configuracion AS destino
    WHERE destino.clave = origen.clave
  );

  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0
  BEGIN
    ROLLBACK TRANSACTION;
  END;

  THROW;
END CATCH;
GO
