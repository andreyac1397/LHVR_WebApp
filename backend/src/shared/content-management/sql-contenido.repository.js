const {
  sql,
  obtenerConexion
} = require("../../config/database");

class SqlContenidoRepository {
  convertirNumero(valor) {
    if (valor === null || valor === undefined) {
      return null;
    }

    return Number(valor);
  }

  convertirBooleano(valor) {
    return Boolean(valor);
  }

  convertirJson(valor) {
    if (valor === null || valor === undefined || valor === "") {
      return null;
    }

    if (typeof valor === "string") {
      return valor;
    }

    return JSON.stringify(valor);
  }

  leerJson(valor, predeterminado = {}) {
    if (!valor) {
      return predeterminado;
    }

    if (typeof valor === "object") {
      return valor;
    }

    try {
      return JSON.parse(valor);
    } catch (_error) {
      return predeterminado;
    }
  }

  normalizarColeccion(fila) {
    if (!fila) {
      return null;
    }

    return {
      idColeccion: this.convertirNumero(fila.id_coleccion),
      modulo: fila.modulo,
      clave: fila.clave,
      nombre: fila.nombre,
      anio: this.convertirNumero(fila.anio),
      estado: fila.estado,
      publicada: this.convertirBooleano(fila.publicada),
      metadatos: this.leerJson(fila.metadatos_json),
      idAdministradorUltimaModificacion:
        this.convertirNumero(
          fila.id_administrador_ultima_modificacion
        ),
      fechaCreacion: fila.fecha_creacion,
      fechaActualizacion: fila.fecha_actualizacion
    };
  }

  normalizarElemento(fila) {
    const datos = this.leerJson(fila.datos_json);

    return {
      idElemento: this.convertirNumero(fila.id_elemento),
      idColeccion: this.convertirNumero(fila.id_coleccion),
      modulo: fila.modulo,
      claveExterna: fila.clave_externa,
      titulo: fila.titulo,
      subtitulo: fila.subtitulo,
      descripcion: fila.descripcion,
      fechaInicio: fila.fecha_inicio,
      fechaFin: fila.fecha_fin,
      orden: this.convertirNumero(fila.orden) ?? 0,
      estado: fila.estado,
      destacado: this.convertirBooleano(fila.destacado),
      url: fila.url,
      urlSecundaria: fila.url_secundaria,
      idArchivo: this.convertirNumero(fila.id_archivo),
      datos,
      idAdministradorUltimaModificacion:
        this.convertirNumero(
          fila.id_administrador_ultima_modificacion
        ),
      fechaCreacion: fila.fecha_creacion,
      fechaActualizacion: fila.fecha_actualizacion
    };
  }

  async listarColecciones(modulo) {
    const conexion = await obtenerConexion();

    const resultado = await conexion
      .request()
      .input("modulo", sql.NVarChar(60), modulo)
      .query(`
        SELECT
          id_coleccion,
          modulo,
          clave,
          nombre,
          anio,
          estado,
          publicada,
          metadatos_json,
          id_administrador_ultima_modificacion,
          fecha_creacion,
          fecha_actualizacion
        FROM dbo.cms_colecciones
        WHERE modulo = @modulo
        ORDER BY
          publicada DESC,
          anio DESC,
          fecha_actualizacion DESC,
          id_coleccion DESC;
      `);

    return resultado.recordset.map(
      (fila) => this.normalizarColeccion(fila)
    );
  }

  async obtenerColeccionPublicada(modulo, anio = null) {
    const conexion = await obtenerConexion();

    const resultado = await conexion
      .request()
      .input("modulo", sql.NVarChar(60), modulo)
      .input("anio", sql.SmallInt, anio)
      .query(`
        SELECT TOP 1
          id_coleccion,
          modulo,
          clave,
          nombre,
          anio,
          estado,
          publicada,
          metadatos_json,
          id_administrador_ultima_modificacion,
          fecha_creacion,
          fecha_actualizacion
        FROM dbo.cms_colecciones
        WHERE modulo = @modulo
          AND publicada = 1
          AND estado = N'PUBLICADO'
          AND (@anio IS NULL OR anio = @anio)
        ORDER BY
          CASE WHEN @anio IS NOT NULL THEN 0 ELSE 1 END,
          anio DESC,
          fecha_actualizacion DESC;
      `);

    return this.normalizarColeccion(
      resultado.recordset[0]
    );
  }

  async obtenerColeccionPorId(idColeccion, modulo) {
    const conexion = await obtenerConexion();

    const resultado = await conexion
      .request()
      .input("id_coleccion", sql.Int, idColeccion)
      .input("modulo", sql.NVarChar(60), modulo)
      .query(`
        SELECT TOP 1
          id_coleccion,
          modulo,
          clave,
          nombre,
          anio,
          estado,
          publicada,
          metadatos_json,
          id_administrador_ultima_modificacion,
          fecha_creacion,
          fecha_actualizacion
        FROM dbo.cms_colecciones
        WHERE id_coleccion = @id_coleccion
          AND modulo = @modulo;
      `);

    return this.normalizarColeccion(
      resultado.recordset[0]
    );
  }

  async listarElementos({
    modulo,
    idColeccion = null,
    soloPublicados = false
  }) {
    const conexion = await obtenerConexion();

    const resultado = await conexion
      .request()
      .input("modulo", sql.NVarChar(60), modulo)
      .input("id_coleccion", sql.Int, idColeccion)
      .input("solo_publicados", sql.Bit, soloPublicados)
      .query(`
        SELECT
          e.id_elemento,
          e.id_coleccion,
          e.modulo,
          e.clave_externa,
          e.titulo,
          e.subtitulo,
          e.descripcion,
          e.fecha_inicio,
          e.fecha_fin,
          e.orden,
          e.estado,
          e.destacado,
          COALESCE(a.ruta_relativa, e.url) AS url,
          e.url_secundaria,
          e.id_archivo,
          e.datos_json,
          e.id_administrador_ultima_modificacion,
          e.fecha_creacion,
          e.fecha_actualizacion
        FROM dbo.cms_elementos AS e
        LEFT JOIN dbo.archivos AS a
          ON a.id_archivo = e.id_archivo
          AND a.activo = 1
        WHERE e.modulo = @modulo
          AND (
            @id_coleccion IS NULL OR
            e.id_coleccion = @id_coleccion
          )
          AND (
            @solo_publicados = 0 OR
            e.estado = N'PUBLICADO'
          )
          AND (
            e.estado <> N'ARCHIVADO' OR
            (
              @solo_publicados = 0 AND
              @modulo IN (N'HORARIOS', N'BIBLIOTECA')
            )
          )
        ORDER BY
          e.orden,
          e.fecha_inicio,
          e.titulo,
          e.id_elemento;
      `);

    return resultado.recordset.map(
      (fila) => this.normalizarElemento(fila)
    );
  }

  async guardarColeccion(datos) {
    const conexion = await obtenerConexion();

    const resultado = await conexion
      .request()
      .input(
        "id_coleccion",
        sql.Int,
        datos.idColeccion ?? null
      )
      .input("modulo", sql.NVarChar(60), datos.modulo)
      .input("clave", sql.NVarChar(120), datos.clave)
      .input("nombre", sql.NVarChar(250), datos.nombre)
      .input("anio", sql.SmallInt, datos.anio ?? null)
      .input("estado", sql.NVarChar(20), datos.estado)
      .input("publicada", sql.Bit, datos.publicada)
      .input(
        "metadatos_json",
        sql.NVarChar(sql.MAX),
        this.convertirJson(datos.metadatos)
      )
      .input(
        "id_administrador",
        sql.Int,
        datos.idAdministrador ?? null
      )
      .query(`
        DECLARE @id_resultado INT;

        IF @id_coleccion IS NOT NULL
        BEGIN
          UPDATE dbo.cms_colecciones
          SET
            clave = @clave,
            nombre = @nombre,
            anio = @anio,
            estado = @estado,
            publicada = @publicada,
            metadatos_json = @metadatos_json,
            id_administrador_ultima_modificacion =
              @id_administrador,
            fecha_actualizacion = SYSUTCDATETIME()
          WHERE id_coleccion = @id_coleccion
            AND modulo = @modulo;

          IF @@ROWCOUNT = 0
          BEGIN
            THROW 51001,
              N'No se encontró la colección indicada.',
              1;
          END;

          SET @id_resultado = @id_coleccion;
        END;
        ELSE
        BEGIN
          SELECT
            @id_resultado = id_coleccion
          FROM dbo.cms_colecciones
          WHERE modulo = @modulo
            AND clave = @clave;

          IF @id_resultado IS NULL
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
              @modulo,
              @clave,
              @nombre,
              @anio,
              @estado,
              @publicada,
              @metadatos_json,
              @id_administrador
            );

            SET @id_resultado = SCOPE_IDENTITY();
          END;
          ELSE
          BEGIN
            UPDATE dbo.cms_colecciones
            SET
              nombre = @nombre,
              anio = @anio,
              estado = @estado,
              publicada = @publicada,
              metadatos_json = @metadatos_json,
              id_administrador_ultima_modificacion =
                @id_administrador,
              fecha_actualizacion = SYSUTCDATETIME()
            WHERE id_coleccion = @id_resultado;
          END;
        END;

        SELECT
          id_coleccion,
          modulo,
          clave,
          nombre,
          anio,
          estado,
          publicada,
          metadatos_json,
          id_administrador_ultima_modificacion,
          fecha_creacion,
          fecha_actualizacion
        FROM dbo.cms_colecciones
        WHERE id_coleccion = @id_resultado;
      `);

    return this.normalizarColeccion(
      resultado.recordset[0]
    );
  }

  async guardarElemento(datos) {
    const conexion = await obtenerConexion();

    const resultado = await conexion
      .request()
      .input(
        "id_elemento",
        sql.Int,
        datos.idElemento ?? null
      )
      .input(
        "id_coleccion",
        sql.Int,
        datos.idColeccion ?? null
      )
      .input("modulo", sql.NVarChar(60), datos.modulo)
      .input(
        "clave_externa",
        sql.NVarChar(180),
        datos.claveExterna ?? null
      )
      .input(
        "titulo",
        sql.NVarChar(500),
        datos.titulo ?? null
      )
      .input(
        "subtitulo",
        sql.NVarChar(500),
        datos.subtitulo ?? null
      )
      .input(
        "descripcion",
        sql.NVarChar(sql.MAX),
        datos.descripcion ?? null
      )
      .input(
        "fecha_inicio",
        sql.DateTime2,
        datos.fechaInicio ?? null
      )
      .input(
        "fecha_fin",
        sql.DateTime2,
        datos.fechaFin ?? null
      )
      .input("orden", sql.Int, datos.orden ?? 0)
      .input("estado", sql.NVarChar(20), datos.estado)
      .input("destacado", sql.Bit, datos.destacado)
      .input(
        "url",
        sql.NVarChar(2048),
        datos.url ?? null
      )
      .input(
        "url_secundaria",
        sql.NVarChar(2048),
        datos.urlSecundaria ?? null
      )
      .input(
        "id_archivo",
        sql.Int,
        datos.idArchivo ?? null
      )
      .input(
        "datos_json",
        sql.NVarChar(sql.MAX),
        this.convertirJson(datos.datos)
      )
      .input(
        "id_administrador",
        sql.Int,
        datos.idAdministrador ?? null
      )
      .query(`
        DECLARE @id_resultado INT;

        IF @id_elemento IS NULL
        BEGIN
          INSERT INTO dbo.cms_elementos (
            id_coleccion,
            modulo,
            clave_externa,
            titulo,
            subtitulo,
            descripcion,
            fecha_inicio,
            fecha_fin,
            orden,
            estado,
            destacado,
            url,
            url_secundaria,
            id_archivo,
            datos_json,
            id_administrador_ultima_modificacion
          )
          VALUES (
            @id_coleccion,
            @modulo,
            @clave_externa,
            @titulo,
            @subtitulo,
            @descripcion,
            @fecha_inicio,
            @fecha_fin,
            @orden,
            @estado,
            @destacado,
            @url,
            @url_secundaria,
            @id_archivo,
            @datos_json,
            @id_administrador
          );

          SET @id_resultado = SCOPE_IDENTITY();
        END;
        ELSE
        BEGIN
          UPDATE dbo.cms_elementos
          SET
            id_coleccion = @id_coleccion,
            clave_externa = @clave_externa,
            titulo = @titulo,
            subtitulo = @subtitulo,
            descripcion = @descripcion,
            fecha_inicio = @fecha_inicio,
            fecha_fin = @fecha_fin,
            orden = @orden,
            estado = @estado,
            destacado = @destacado,
            url = @url,
            url_secundaria = @url_secundaria,
            id_archivo = @id_archivo,
            datos_json = @datos_json,
            id_administrador_ultima_modificacion =
              @id_administrador,
            fecha_actualizacion = SYSUTCDATETIME()
          WHERE id_elemento = @id_elemento
            AND modulo = @modulo;

          IF @@ROWCOUNT = 0
          BEGIN
            THROW 51002,
              N'No se encontró el elemento indicado.',
              1;
          END;

          SET @id_resultado = @id_elemento;
        END;

        SELECT
          id_elemento,
          id_coleccion,
          modulo,
          clave_externa,
          titulo,
          subtitulo,
          descripcion,
          fecha_inicio,
          fecha_fin,
          orden,
          estado,
          destacado,
          url,
          url_secundaria,
          id_archivo,
          datos_json,
          id_administrador_ultima_modificacion,
          fecha_creacion,
          fecha_actualizacion
        FROM dbo.cms_elementos
        WHERE id_elemento = @id_resultado;
      `);

    return this.normalizarElemento(
      resultado.recordset[0]
    );
  }

  async archivarElemento(
    modulo,
    idElemento,
    idAdministrador
  ) {
    const conexion = await obtenerConexion();

    const resultado = await conexion
      .request()
      .input("modulo", sql.NVarChar(60), modulo)
      .input("id_elemento", sql.Int, idElemento)
      .input(
        "id_administrador",
        sql.Int,
        idAdministrador ?? null
      )
      .query(`
        UPDATE dbo.cms_elementos
        SET
          estado = N'ARCHIVADO',
          id_administrador_ultima_modificacion =
            @id_administrador,
          fecha_actualizacion = SYSUTCDATETIME()
        WHERE id_elemento = @id_elemento
          AND modulo = @modulo;

        SELECT @@ROWCOUNT AS filas_afectadas;
      `);

    return Number(
      resultado.recordset[0]?.filas_afectadas || 0
    ) > 0;
  }

  async eliminarElemento(modulo, idElemento) {
    const conexion = await obtenerConexion();

    const resultado = await conexion
      .request()
      .input("modulo", sql.NVarChar(60), modulo)
      .input("id_elemento", sql.Int, idElemento)
      .query(`
        DELETE FROM dbo.cms_elementos
        WHERE id_elemento = @id_elemento
          AND modulo = @modulo;

        SELECT @@ROWCOUNT AS filas_afectadas;
      `);

    return Number(
      resultado.recordset[0]?.filas_afectadas || 0
    ) > 0;
  }

  async eliminarColeccion(modulo, idColeccion) {
    const conexion = await obtenerConexion();
    const transaccion = new sql.Transaction(conexion);

    await transaccion.begin();

    try {
      const resultado = await new sql.Request(transaccion)
        .input("modulo", sql.NVarChar(60), modulo)
        .input("id_coleccion", sql.Int, idColeccion)
        .query(`
          DECLARE @publicada BIT;

          SELECT @publicada = publicada
          FROM dbo.cms_colecciones
          WHERE id_coleccion = @id_coleccion
            AND modulo = @modulo;

          IF @publicada IS NULL
          BEGIN
            SELECT
              CAST(0 AS BIT) AS eliminada,
              CAST(0 AS BIT) AS publicada;
            RETURN;
          END;

          DELETE FROM dbo.cms_importaciones
          WHERE id_coleccion = @id_coleccion
            AND modulo = @modulo;

          DELETE FROM dbo.cms_elementos
          WHERE id_coleccion = @id_coleccion
            AND modulo = @modulo;

          DELETE FROM dbo.cms_colecciones
          WHERE id_coleccion = @id_coleccion
            AND modulo = @modulo;

          SELECT
            CAST(1 AS BIT) AS eliminada,
            @publicada AS publicada;
        `);

      await transaccion.commit();

      return {
        eliminada: Boolean(resultado.recordset[0]?.eliminada),
        publicada: Boolean(resultado.recordset[0]?.publicada)
      };
    } catch (error) {
      await transaccion.rollback();
      throw error;
    }
  }

  async guardarCambiosHorario(datos) {
    const conexion = await obtenerConexion();
    const transaccion = new sql.Transaction(conexion);

    await transaccion.begin();

    try {
      const resultado = await new sql.Request(transaccion)
        .input("modulo", sql.NVarChar(60), datos.modulo)
        .input("id_coleccion", sql.Int, datos.idColeccion)
        .input(
          "elementos_json",
          sql.NVarChar(sql.MAX),
          JSON.stringify(datos.elementos)
        )
        .input(
          "id_administrador",
          sql.Int,
          datos.idAdministrador ?? null
        )
        .query(`
          IF NOT EXISTS (
            SELECT 1
            FROM dbo.cms_colecciones
            WHERE id_coleccion = @id_coleccion
              AND modulo = @modulo
          )
          BEGIN
            THROW 51010, N'No se encontró la versión indicada.', 1;
          END;

          DECLARE @elementos TABLE (
            indice INT NOT NULL,
            id_elemento INT NULL,
            clave_externa NVARCHAR(180) NULL,
            titulo NVARCHAR(500) NOT NULL,
            subtitulo NVARCHAR(500) NULL,
            descripcion NVARCHAR(MAX) NULL,
            fecha_inicio DATETIME2(0) NULL,
            fecha_fin DATETIME2(0) NULL,
            orden INT NOT NULL,
            estado NVARCHAR(20) NOT NULL,
            destacado BIT NOT NULL,
            url NVARCHAR(2048) NULL,
            url_secundaria NVARCHAR(2048) NULL,
            id_archivo INT NULL,
            datos_json NVARCHAR(MAX) NOT NULL
          );

          INSERT INTO @elementos (
            indice,
            id_elemento,
            clave_externa,
            titulo,
            subtitulo,
            descripcion,
            fecha_inicio,
            fecha_fin,
            orden,
            estado,
            destacado,
            url,
            url_secundaria,
            id_archivo,
            datos_json
          )
          SELECT
            TRY_CONVERT(INT, fuente.[key]),
            TRY_CONVERT(
              INT,
              JSON_VALUE(fuente.[value], '$.idElemento')
            ),
            JSON_VALUE(fuente.[value], '$.claveExterna'),
            JSON_VALUE(fuente.[value], '$.titulo'),
            JSON_VALUE(fuente.[value], '$.subtitulo'),
            JSON_VALUE(fuente.[value], '$.descripcion'),
            TRY_CONVERT(
              DATETIME2(0),
              JSON_VALUE(fuente.[value], '$.fechaInicio')
            ),
            TRY_CONVERT(
              DATETIME2(0),
              JSON_VALUE(fuente.[value], '$.fechaFin')
            ),
            COALESCE(
              TRY_CONVERT(
                INT,
                JSON_VALUE(fuente.[value], '$.orden')
              ),
              0
            ),
            COALESCE(
              JSON_VALUE(fuente.[value], '$.estado'),
              N'PUBLICADO'
            ),
            CASE LOWER(
              COALESCE(
                JSON_VALUE(fuente.[value], '$.destacado'),
                N'false'
              )
            )
              WHEN N'true' THEN 1
              WHEN N'1' THEN 1
              ELSE 0
            END,
            JSON_VALUE(fuente.[value], '$.url'),
            JSON_VALUE(fuente.[value], '$.urlSecundaria'),
            TRY_CONVERT(
              INT,
              JSON_VALUE(fuente.[value], '$.idArchivo')
            ),
            COALESCE(
              JSON_QUERY(fuente.[value], '$.datos'),
              N'{}'
            )
          FROM OPENJSON(@elementos_json) AS fuente;

          IF EXISTS (
            SELECT 1
            FROM @elementos AS elemento
            WHERE elemento.id_elemento > 0
              AND NOT EXISTS (
                SELECT 1
                FROM dbo.cms_elementos AS actual
                WHERE actual.id_elemento = elemento.id_elemento
                  AND actual.id_coleccion = @id_coleccion
                  AND actual.modulo = @modulo
              )
          )
          BEGIN
            THROW 51012,
              N'Una de las filas ya no pertenece a esta versión.',
              1;
          END;

          DELETE actual
          FROM dbo.cms_elementos AS actual
          WHERE actual.id_coleccion = @id_coleccion
            AND actual.modulo = @modulo
            AND NOT EXISTS (
              SELECT 1
              FROM @elementos AS elemento
              WHERE elemento.id_elemento = actual.id_elemento
                AND elemento.id_elemento > 0
            );

          DECLARE @filas_eliminadas INT = @@ROWCOUNT;

          UPDATE actual
          SET
            clave_externa = elemento.clave_externa,
            titulo = elemento.titulo,
            subtitulo = elemento.subtitulo,
            descripcion = elemento.descripcion,
            fecha_inicio = elemento.fecha_inicio,
            fecha_fin = elemento.fecha_fin,
            orden = elemento.orden,
            estado = elemento.estado,
            destacado = elemento.destacado,
            url = elemento.url,
            url_secundaria = elemento.url_secundaria,
            id_archivo = elemento.id_archivo,
            datos_json = elemento.datos_json,
            id_administrador_ultima_modificacion =
              @id_administrador,
            fecha_actualizacion = SYSUTCDATETIME()
          FROM dbo.cms_elementos AS actual
          INNER JOIN @elementos AS elemento
            ON elemento.id_elemento = actual.id_elemento
          WHERE actual.id_coleccion = @id_coleccion
            AND actual.modulo = @modulo
            AND elemento.id_elemento > 0;

          DECLARE @filas_actualizadas INT = @@ROWCOUNT;

          INSERT INTO dbo.cms_elementos (
            id_coleccion,
            modulo,
            clave_externa,
            titulo,
            subtitulo,
            descripcion,
            fecha_inicio,
            fecha_fin,
            orden,
            estado,
            destacado,
            url,
            url_secundaria,
            id_archivo,
            datos_json,
            id_administrador_ultima_modificacion,
            fecha_creacion,
            fecha_actualizacion
          )
          SELECT
            @id_coleccion,
            @modulo,
            elemento.clave_externa,
            elemento.titulo,
            elemento.subtitulo,
            elemento.descripcion,
            elemento.fecha_inicio,
            elemento.fecha_fin,
            elemento.orden,
            elemento.estado,
            elemento.destacado,
            elemento.url,
            elemento.url_secundaria,
            elemento.id_archivo,
            elemento.datos_json,
            @id_administrador,
            SYSUTCDATETIME(),
            SYSUTCDATETIME()
          FROM @elementos AS elemento
          WHERE elemento.id_elemento IS NULL
            OR elemento.id_elemento <= 0;

          DECLARE @filas_creadas INT = @@ROWCOUNT;

          UPDATE dbo.cms_colecciones
          SET
            id_administrador_ultima_modificacion = @id_administrador,
            fecha_actualizacion = SYSUTCDATETIME()
          WHERE id_coleccion = @id_coleccion
            AND modulo = @modulo;

          SELECT
            @filas_creadas AS filas_creadas,
            @filas_actualizadas AS filas_actualizadas,
            @filas_eliminadas AS filas_eliminadas;
        `);

      await transaccion.commit();

      return {
        filasCreadas: Number(
          resultado.recordset[0]?.filas_creadas || 0
        ),
        filasActualizadas: Number(
          resultado.recordset[0]?.filas_actualizadas || 0
        ),
        filasEliminadas: Number(
          resultado.recordset[0]?.filas_eliminadas || 0
        )
      };
    } catch (error) {
      await transaccion.rollback();
      throw error;
    }
  }

  async crearSeccionHorario(datos) {
    const conexion = await obtenerConexion();
    const transaccion = new sql.Transaction(conexion);

    await transaccion.begin();

    try {
      const resultado = await new sql.Request(transaccion)
        .input("modulo", sql.NVarChar(60), datos.modulo)
        .input("id_coleccion", sql.Int, datos.idColeccion)
        .input("seccion", sql.NVarChar(60), datos.seccion)
        .input(
          "elementos_json",
          sql.NVarChar(sql.MAX),
          JSON.stringify(datos.elementos)
        )
        .input(
          "id_administrador",
          sql.Int,
          datos.idAdministrador ?? null
        )
        .query(`
          IF NOT EXISTS (
            SELECT 1
            FROM dbo.cms_colecciones
            WHERE id_coleccion = @id_coleccion
              AND modulo = @modulo
          )
          BEGIN
            THROW 51010, N'No se encontró la versión indicada.', 1;
          END;

          IF EXISTS (
            SELECT 1
            FROM dbo.cms_elementos
            WHERE id_coleccion = @id_coleccion
              AND modulo = @modulo
              AND JSON_VALUE(datos_json, '$.seccion') = @seccion
          )
          BEGIN
            THROW 51011, N'La sección indicada ya existe en esta versión.', 1;
          END;

          INSERT INTO dbo.cms_elementos (
            id_coleccion,
            modulo,
            clave_externa,
            titulo,
            descripcion,
            orden,
            estado,
            destacado,
            datos_json,
            id_administrador_ultima_modificacion,
            fecha_creacion,
            fecha_actualizacion
          )
          SELECT
            @id_coleccion,
            @modulo,
            elemento.clave_externa,
            elemento.titulo,
            elemento.descripcion,
            elemento.orden,
            elemento.estado,
            0,
            elemento.datos_json,
            @id_administrador,
            SYSUTCDATETIME(),
            SYSUTCDATETIME()
          FROM OPENJSON(@elementos_json)
          WITH (
            clave_externa NVARCHAR(180) '$.claveExterna',
            titulo NVARCHAR(500) '$.titulo',
            descripcion NVARCHAR(MAX) '$.descripcion',
            orden INT '$.orden',
            estado NVARCHAR(20) '$.estado',
            datos_json NVARCHAR(MAX) '$.datos' AS JSON
          ) AS elemento;

          DECLARE @filas_creadas INT = @@ROWCOUNT;

          UPDATE dbo.cms_colecciones
          SET
            id_administrador_ultima_modificacion = @id_administrador,
            fecha_actualizacion = SYSUTCDATETIME()
          WHERE id_coleccion = @id_coleccion
            AND modulo = @modulo;

          SELECT @filas_creadas AS filas_creadas;
        `);

      await transaccion.commit();

      return Number(
        resultado.recordset[0]?.filas_creadas || 0
      );
    } catch (error) {
      await transaccion.rollback();
      throw error;
    }
  }

  async eliminarSeccionHorario(modulo, idColeccion, seccion) {
    const conexion = await obtenerConexion();

    const resultado = await conexion
      .request()
      .input("modulo", sql.NVarChar(60), modulo)
      .input("id_coleccion", sql.Int, idColeccion)
      .input("seccion", sql.NVarChar(60), seccion)
      .query(`
        DELETE FROM dbo.cms_elementos
        WHERE id_coleccion = @id_coleccion
          AND modulo = @modulo
          AND JSON_VALUE(datos_json, '$.seccion') = @seccion;

        DECLARE @filas_afectadas INT = @@ROWCOUNT;

        IF @filas_afectadas > 0
        BEGIN
          UPDATE dbo.cms_colecciones
          SET fecha_actualizacion = SYSUTCDATETIME()
          WHERE id_coleccion = @id_coleccion
            AND modulo = @modulo;
        END;

        SELECT @filas_afectadas AS filas_afectadas;
      `);

    return Number(
      resultado.recordset[0]?.filas_afectadas || 0
    );
  }

  async publicarColeccion(
    modulo,
    idColeccion,
    idAdministrador
  ) {
    const conexion = await obtenerConexion();
    const transaccion = new sql.Transaction(conexion);

    await transaccion.begin();

    try {
      await new sql.Request(transaccion)
        .input("modulo", sql.NVarChar(60), modulo)
        .input("id_coleccion", sql.Int, idColeccion)
        .input(
          "id_administrador",
          sql.Int,
          idAdministrador ?? null
        )
        .query(`
          IF NOT EXISTS (
            SELECT 1
            FROM dbo.cms_colecciones
            WHERE id_coleccion = @id_coleccion
              AND modulo = @modulo
          )
          BEGIN
            THROW 51003,
              N'No se encontró la colección indicada.',
              1;
          END;

          UPDATE dbo.cms_colecciones
          SET
            publicada = 0,
            estado = CASE
              WHEN estado = N'PUBLICADO'
                THEN N'ARCHIVADO'
              ELSE estado
            END,
            fecha_actualizacion = SYSUTCDATETIME()
          WHERE modulo = @modulo
            AND id_coleccion <> @id_coleccion
            AND publicada = 1;

          UPDATE dbo.cms_colecciones
          SET
            publicada = 1,
            estado = N'PUBLICADO',
            id_administrador_ultima_modificacion =
              @id_administrador,
            fecha_actualizacion = SYSUTCDATETIME()
          WHERE id_coleccion = @id_coleccion
            AND modulo = @modulo;
        `);

      await transaccion.commit();
    } catch (error) {
      await transaccion.rollback();
      throw error;
    }

    return this.obtenerColeccionPorId(
      idColeccion,
      modulo
    );
  }

  async importarColeccion(datos) {
    const conexion = await obtenerConexion();
    const transaccion = new sql.Transaction(conexion);

    await transaccion.begin();

    try {
      const solicitudColeccion = new sql.Request(transaccion);

      const resultadoColeccion = await solicitudColeccion
        .input("modulo", sql.NVarChar(60), datos.modulo)
        .input("clave", sql.NVarChar(120), datos.clave)
        .input("nombre", sql.NVarChar(250), datos.nombre)
        .input("anio", sql.SmallInt, datos.anio ?? null)
        .input(
          "metadatos_json",
          sql.NVarChar(sql.MAX),
          this.convertirJson(datos.metadatos)
        )
        .input(
          "id_administrador",
          sql.Int,
          datos.idAdministrador ?? null
        )
        .query(`
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
            @modulo,
            @clave,
            @nombre,
            @anio,
            N'BORRADOR',
            0,
            @metadatos_json,
            @id_administrador
          );

          SELECT CAST(SCOPE_IDENTITY() AS INT) AS id_coleccion;
        `);

      const idColeccion = Number(
        resultadoColeccion.recordset[0].id_coleccion
      );

      const alcance = String(datos.alcance || "TOTAL").toUpperCase();
      const idColeccionBase = Number(datos.idColeccionBase);

      if (
        alcance !== "TOTAL" &&
        Number.isInteger(idColeccionBase) &&
        idColeccionBase > 0
      ) {
        await new sql.Request(transaccion)
          .input("id_coleccion_nueva", sql.Int, idColeccion)
          .input("id_coleccion_base", sql.Int, idColeccionBase)
          .input("modulo", sql.NVarChar(60), datos.modulo)
          .input("id_administrador", sql.Int, datos.idAdministrador ?? null)
          .query(`
            INSERT INTO dbo.cms_elementos (
              id_coleccion, modulo, clave_externa, titulo, subtitulo,
              descripcion, fecha_inicio, fecha_fin, orden, estado,
              destacado, url, url_secundaria, id_archivo, datos_json,
              id_administrador_ultima_modificacion
            )
            SELECT
              @id_coleccion_nueva, modulo, clave_externa, titulo, subtitulo,
              descripcion, fecha_inicio, fecha_fin, orden, estado,
              destacado, url, url_secundaria, id_archivo, datos_json,
              @id_administrador
            FROM dbo.cms_elementos
            WHERE id_coleccion = @id_coleccion_base
              AND modulo = @modulo;
          `);
      }

      if (alcance !== "TOTAL") {
        const claves = datos.elementos
          .map((elemento) => elemento.claveExterna)
          .filter(Boolean);
        const secciones = datos.elementos
          .map((elemento) => elemento.datos?.seccion)
          .filter(Boolean);

        await new sql.Request(transaccion)
          .input("id_coleccion", sql.Int, idColeccion)
          .input("claves", sql.NVarChar(sql.MAX), JSON.stringify(claves))
          .input("secciones", sql.NVarChar(sql.MAX), JSON.stringify(secciones))
          .query(`
            DELETE elemento
            FROM dbo.cms_elementos AS elemento
            WHERE elemento.id_coleccion = @id_coleccion
              AND (
                elemento.clave_externa IN (
                  SELECT CONVERT(NVARCHAR(180), [value]) FROM OPENJSON(@claves)
                )
                OR JSON_VALUE(elemento.datos_json, '$.seccion') IN (
                  SELECT CONVERT(NVARCHAR(60), [value]) FROM OPENJSON(@secciones)
                )
              );
          `);
      }

      await new sql.Request(transaccion)
        .input("id_coleccion", sql.Int, idColeccion)
        .input("modulo", sql.NVarChar(60), datos.modulo)
        .input(
          "elementos_json",
          sql.NVarChar(sql.MAX),
          JSON.stringify(datos.elementos)
        )
        .input(
          "id_administrador",
          sql.Int,
          datos.idAdministrador ?? null
        )
        .query(`
          INSERT INTO dbo.cms_elementos (
            id_coleccion,
            modulo,
            clave_externa,
            titulo,
            subtitulo,
            descripcion,
            fecha_inicio,
            fecha_fin,
            orden,
            estado,
            destacado,
            url,
            url_secundaria,
            id_archivo,
            datos_json,
            id_administrador_ultima_modificacion,
            fecha_creacion,
            fecha_actualizacion
          )
          SELECT
            @id_coleccion,
            @modulo,
            elemento.clave_externa,
            elemento.titulo,
            elemento.subtitulo,
            elemento.descripcion,
            elemento.fecha_inicio,
            elemento.fecha_fin,
            elemento.orden,
            elemento.estado,
            elemento.destacado,
            elemento.url,
            elemento.url_secundaria,
            elemento.id_archivo,
            elemento.datos_json,
            @id_administrador,
            SYSUTCDATETIME(),
            SYSUTCDATETIME()
          FROM OPENJSON(@elementos_json)
          WITH (
            clave_externa NVARCHAR(180) '$.claveExterna',
            titulo NVARCHAR(500) '$.titulo',
            subtitulo NVARCHAR(500) '$.subtitulo',
            descripcion NVARCHAR(MAX) '$.descripcion',
            fecha_inicio DATETIME2(0) '$.fechaInicio',
            fecha_fin DATETIME2(0) '$.fechaFin',
            orden INT '$.orden',
            estado NVARCHAR(20) '$.estado',
            destacado BIT '$.destacado',
            url NVARCHAR(2048) '$.url',
            url_secundaria NVARCHAR(2048) '$.urlSecundaria',
            id_archivo INT '$.idArchivo',
            datos_json NVARCHAR(MAX) '$.datos' AS JSON
          ) AS elemento;
        `);

      await new sql.Request(transaccion)
        .input("id_coleccion", sql.Int, idColeccion)
        .input("modulo", sql.NVarChar(60), datos.modulo)
        .input("tipo_origen", sql.NVarChar(30), datos.tipoOrigen)
        .input(
          "nombre_origen",
          sql.NVarChar(260),
          datos.nombreOrigen ?? null
        )
        .input(
          "cantidad_recibida",
          sql.Int,
          datos.elementos.length
        )
        .input(
          "cantidad_guardada",
          sql.Int,
          datos.elementos.length
        )
        .input(
          "id_administrador",
          sql.Int,
          datos.idAdministrador ?? null
        )
        .query(`
          INSERT INTO dbo.cms_importaciones (
            id_coleccion,
            modulo,
            tipo_origen,
            nombre_origen,
            cantidad_recibida,
            cantidad_guardada,
            estado,
            id_administrador
          )
          VALUES (
            @id_coleccion,
            @modulo,
            @tipo_origen,
            @nombre_origen,
            @cantidad_recibida,
            @cantidad_guardada,
            N'COMPLETADA',
            @id_administrador
          );
        `);

      if (datos.publicar) {
        await new sql.Request(transaccion)
          .input("modulo", sql.NVarChar(60), datos.modulo)
          .input("id_coleccion", sql.Int, idColeccion)
          .input(
            "id_administrador",
            sql.Int,
            datos.idAdministrador ?? null
          )
          .query(`
            UPDATE dbo.cms_colecciones
            SET
              publicada = 0,
              estado = CASE
                WHEN estado = N'PUBLICADO'
                  THEN N'ARCHIVADO'
                ELSE estado
              END,
              fecha_actualizacion = SYSUTCDATETIME()
            WHERE modulo = @modulo
              AND id_coleccion <> @id_coleccion
              AND publicada = 1;

            UPDATE dbo.cms_colecciones
            SET
              publicada = 1,
              estado = N'PUBLICADO',
              id_administrador_ultima_modificacion =
                @id_administrador,
              fecha_actualizacion = SYSUTCDATETIME()
            WHERE id_coleccion = @id_coleccion;
          `);
      }

      await transaccion.commit();

      return {
        idColeccion,
        cantidadGuardada: datos.elementos.length,
        publicada: Boolean(datos.publicar)
      };
    } catch (error) {
      await transaccion.rollback();
      throw error;
    }
  }

  async listarImportaciones(modulo) {
    const conexion = await obtenerConexion();

    const resultado = await conexion
      .request()
      .input("modulo", sql.NVarChar(60), modulo)
      .query(`
        SELECT TOP 100
          id_importacion,
          id_coleccion,
          modulo,
          tipo_origen,
          nombre_origen,
          cantidad_recibida,
          cantidad_guardada,
          estado,
          errores_json,
          id_administrador,
          fecha_importacion
        FROM dbo.cms_importaciones
        WHERE modulo = @modulo
        ORDER BY
          fecha_importacion DESC,
          id_importacion DESC;
      `);

    return resultado.recordset.map((fila) => ({
      idImportacion: Number(fila.id_importacion),
      idColeccion: this.convertirNumero(fila.id_coleccion),
      modulo: fila.modulo,
      tipoOrigen: fila.tipo_origen,
      nombreOrigen: fila.nombre_origen,
      cantidadRecibida: Number(fila.cantidad_recibida || 0),
      cantidadGuardada: Number(fila.cantidad_guardada || 0),
      estado: fila.estado,
      errores: this.leerJson(fila.errores_json, []),
      idAdministrador: this.convertirNumero(
        fila.id_administrador
      ),
      fechaImportacion: fila.fecha_importacion
    }));
  }
}

module.exports = SqlContenidoRepository;
