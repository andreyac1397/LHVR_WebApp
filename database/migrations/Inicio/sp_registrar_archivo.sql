USE [BD-LHVR];
GO

SET ANSI_NULLS ON;
GO

SET QUOTED_IDENTIFIER ON;
GO

/*
 * ============================================================
 * PROCEDIMIENTO: sp_registrar_archivo
 * MÓDULO: Archivos
 * ============================================================
 *
 * Registra en SQL Server los metadatos de una imagen
 * o documento almacenado físicamente en el servidor.
 *
 * Si ya existe un archivo con el mismo hash:
 * - No crea un duplicado.
 * - Devuelve el archivo existente.
 * ============================================================
 */

CREATE OR ALTER PROCEDURE dbo.sp_registrar_archivo
  @nombre_original
    NVARCHAR(260),

  @nombre_almacenado
    NVARCHAR(260),

  @ruta_relativa
    NVARCHAR(500),

  @extension
    NVARCHAR(20),

  @mime_type
    NVARCHAR(120),

  @tamano_bytes
    BIGINT,

  @ancho_pixeles
    INT = NULL,

  @alto_pixeles
    INT = NULL,

  @hash_archivo
    CHAR(64) = NULL,

  @texto_alternativo
    NVARCHAR(300) = NULL,

  @tipo_archivo
    NVARCHAR(50),

  @id_administrador_carga
    INT
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;

  /*
   * ==========================================================
   * 1. NORMALIZACIÓN
   * ==========================================================
   */

  SET @nombre_original =
    NULLIF(
      LTRIM(
        RTRIM(
          @nombre_original
        )
      ),
      N''
    );

  SET @nombre_almacenado =
    NULLIF(
      LTRIM(
        RTRIM(
          @nombre_almacenado
        )
      ),
      N''
    );

  SET @ruta_relativa =
    NULLIF(
      LTRIM(
        RTRIM(
          @ruta_relativa
        )
      ),
      N''
    );

  SET @extension =
    LOWER(
      NULLIF(
        LTRIM(
          RTRIM(
            @extension
          )
        ),
        N''
      )
    );

  SET @mime_type =
    LOWER(
      NULLIF(
        LTRIM(
          RTRIM(
            @mime_type
          )
        ),
        N''
      )
    );

  SET @hash_archivo =
    LOWER(
      NULLIF(
        LTRIM(
          RTRIM(
            @hash_archivo
          )
        ),
        ''
      )
    );

  SET @texto_alternativo =
    NULLIF(
      LTRIM(
        RTRIM(
          @texto_alternativo
        )
      ),
      N''
    );

  SET @tipo_archivo =
    UPPER(
      NULLIF(
        LTRIM(
          RTRIM(
            @tipo_archivo
          )
        ),
        N''
      )
    );

  /*
   * ==========================================================
   * 2. VALIDACIONES
   * ==========================================================
   */

  IF @nombre_original IS NULL
  BEGIN
    THROW 51001,
      N'El nombre original del archivo es obligatorio.',
      1;
  END;

  IF @nombre_almacenado IS NULL
  BEGIN
    THROW 51002,
      N'El nombre almacenado del archivo es obligatorio.',
      1;
  END;

  IF @ruta_relativa IS NULL
  BEGIN
    THROW 51003,
      N'La ruta relativa del archivo es obligatoria.',
      1;
  END;

  IF @extension IS NULL
  BEGIN
    THROW 51004,
      N'La extensión del archivo es obligatoria.',
      1;
  END;

  IF @mime_type IS NULL
  BEGIN
    THROW 51005,
      N'El tipo MIME del archivo es obligatorio.',
      1;
  END;

  IF @tamano_bytes IS NULL
    OR @tamano_bytes <= 0
  BEGIN
    THROW 51006,
      N'El tamaño del archivo debe ser mayor que cero.',
      1;
  END;

  IF @tipo_archivo IS NULL
  BEGIN
    THROW 51007,
      N'El tipo de archivo es obligatorio.',
      1;
  END;

  IF @id_administrador_carga IS NULL
    OR @id_administrador_carga <= 0
  BEGIN
    THROW 51008,
      N'El administrador que carga el archivo no es válido.',
      1;
  END;

  IF NOT EXISTS (
    SELECT 1
    FROM dbo.administradores
    WHERE id_administrador =
      @id_administrador_carga
  )
  BEGIN
    THROW 51009,
      N'El administrador indicado no existe.',
      1;
  END;

  IF (
    @ancho_pixeles IS NULL
    AND @alto_pixeles IS NOT NULL
  )
  OR (
    @ancho_pixeles IS NOT NULL
    AND @alto_pixeles IS NULL
  )
  BEGIN
    THROW 51010,
      N'El ancho y el alto deben registrarse juntos.',
      1;
  END;

  IF (
    @ancho_pixeles IS NOT NULL
    AND @ancho_pixeles <= 0
  )
  OR (
    @alto_pixeles IS NOT NULL
    AND @alto_pixeles <= 0
  )
  BEGIN
    THROW 51011,
      N'Las dimensiones de la imagen deben ser mayores que cero.',
      1;
  END;

  IF @hash_archivo IS NOT NULL
    AND LEN(@hash_archivo) <> 64
  BEGIN
    THROW 51012,
      N'El hash SHA-256 del archivo no es válido.',
      1;
  END;

  /*
   * ==========================================================
   * 3. EVITAR ARCHIVOS DUPLICADOS POR CONTENIDO
   * ==========================================================
   */

  IF @hash_archivo IS NOT NULL
  BEGIN
    DECLARE @id_archivo_existente
      BIGINT;

    SELECT TOP (1)
      @id_archivo_existente =
        a.id_archivo
    FROM dbo.archivos AS a
    WHERE a.hash_archivo =
      @hash_archivo;

    IF @id_archivo_existente IS NOT NULL
    BEGIN
      SELECT
        a.id_archivo,
        a.nombre_original,
        a.nombre_almacenado,
        a.ruta_relativa,
        a.extension,
        a.mime_type,
        a.tamano_bytes,
        a.ancho_pixeles,
        a.alto_pixeles,
        a.hash_archivo,
        a.texto_alternativo,
        a.tipo_archivo,
        a.activo,
        a.fecha_carga,
        a.id_administrador_carga,

        CAST(
          1 AS BIT
        ) AS archivo_existente
      FROM dbo.archivos AS a
      WHERE a.id_archivo =
        @id_archivo_existente;

      RETURN;
    END;
  END;

  /*
   * ==========================================================
   * 4. EVITAR COLISIONES DE NOMBRE O RUTA
   * ==========================================================
   */

  IF EXISTS (
    SELECT 1
    FROM dbo.archivos
    WHERE nombre_almacenado =
      @nombre_almacenado
  )
  BEGIN
    THROW 51013,
      N'Ya existe un archivo con el mismo nombre almacenado.',
      1;
  END;

  IF EXISTS (
    SELECT 1
    FROM dbo.archivos
    WHERE ruta_relativa =
      @ruta_relativa
  )
  BEGIN
    THROW 51014,
      N'Ya existe un archivo con la misma ruta relativa.',
      1;
  END;

  /*
   * ==========================================================
   * 5. REGISTRO DEL ARCHIVO
   * ==========================================================
   */

  BEGIN TRY
    BEGIN TRANSACTION;

    INSERT INTO dbo.archivos (
      nombre_original,
      nombre_almacenado,
      ruta_relativa,
      extension,
      mime_type,
      tamano_bytes,
      ancho_pixeles,
      alto_pixeles,
      hash_archivo,
      texto_alternativo,
      tipo_archivo,
      activo,
      fecha_carga,
      id_administrador_carga
    )
    VALUES (
      @nombre_original,
      @nombre_almacenado,
      @ruta_relativa,
      @extension,
      @mime_type,
      @tamano_bytes,
      @ancho_pixeles,
      @alto_pixeles,
      @hash_archivo,
      @texto_alternativo,
      @tipo_archivo,
      1,
      SYSUTCDATETIME(),
      @id_administrador_carga
    );

    DECLARE @id_archivo
      BIGINT =
        CONVERT(
          BIGINT,
          SCOPE_IDENTITY()
        );

    COMMIT TRANSACTION;

    /*
     * ========================================================
     * 6. RESULTADO
     * ========================================================
     */

    SELECT
      a.id_archivo,
      a.nombre_original,
      a.nombre_almacenado,
      a.ruta_relativa,
      a.extension,
      a.mime_type,
      a.tamano_bytes,
      a.ancho_pixeles,
      a.alto_pixeles,
      a.hash_archivo,
      a.texto_alternativo,
      a.tipo_archivo,
      a.activo,
      a.fecha_carga,
      a.id_administrador_carga,

      CAST(
        0 AS BIT
      ) AS archivo_existente
    FROM dbo.archivos AS a
    WHERE a.id_archivo =
      @id_archivo;
  END TRY
  BEGIN CATCH
    IF XACT_STATE() <> 0
    BEGIN
      ROLLBACK TRANSACTION;
    END;

    THROW;
  END CATCH;
END;
GO