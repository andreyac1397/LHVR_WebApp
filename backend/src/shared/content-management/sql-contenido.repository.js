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
        WHERE modulo = @modulo
          AND (
            @id_coleccion IS NULL OR
            id_coleccion = @id_coleccion
          )
          AND (
            @solo_publicados = 0 OR
            estado = N'PUBLICADO'
          )
          AND estado <> N'ARCHIVADO'
        ORDER BY
          orden,
          fecha_inicio,
          titulo,
          id_elemento;
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
          DECLARE @id_coleccion INT;

          SELECT
            @id_coleccion = id_coleccion
          FROM dbo.cms_colecciones
          WHERE modulo = @modulo
            AND clave = @clave;

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
              @modulo,
              @clave,
              @nombre,
              @anio,
              N'BORRADOR',
              0,
              @metadatos_json,
              @id_administrador
            );

            SET @id_coleccion = SCOPE_IDENTITY();
          END;
          ELSE
          BEGIN
            UPDATE dbo.cms_colecciones
            SET
              nombre = @nombre,
              anio = @anio,
              estado = N'BORRADOR',
              metadatos_json = @metadatos_json,
              id_administrador_ultima_modificacion =
                @id_administrador,
              fecha_actualizacion = SYSUTCDATETIME()
            WHERE id_coleccion = @id_coleccion;
          END;

          SELECT @id_coleccion AS id_coleccion;
        `);

      const idColeccion = Number(
        resultadoColeccion.recordset[0].id_coleccion
      );

      if (datos.reemplazar) {
        await new sql.Request(transaccion)
          .input("id_coleccion", sql.Int, idColeccion)
          .query(`
            DELETE FROM dbo.cms_elementos
            WHERE id_coleccion = @id_coleccion;
          `);
      }

      for (const elemento of datos.elementos) {
        await new sql.Request(transaccion)
          .input("id_coleccion", sql.Int, idColeccion)
          .input("modulo", sql.NVarChar(60), datos.modulo)
          .input(
            "clave_externa",
            sql.NVarChar(180),
            elemento.claveExterna ?? null
          )
          .input(
            "titulo",
            sql.NVarChar(500),
            elemento.titulo ?? null
          )
          .input(
            "subtitulo",
            sql.NVarChar(500),
            elemento.subtitulo ?? null
          )
          .input(
            "descripcion",
            sql.NVarChar(sql.MAX),
            elemento.descripcion ?? null
          )
          .input(
            "fecha_inicio",
            sql.DateTime2,
            elemento.fechaInicio ?? null
          )
          .input(
            "fecha_fin",
            sql.DateTime2,
            elemento.fechaFin ?? null
          )
          .input("orden", sql.Int, elemento.orden ?? 0)
          .input("estado", sql.NVarChar(20), elemento.estado)
          .input("destacado", sql.Bit, elemento.destacado)
          .input(
            "url",
            sql.NVarChar(2048),
            elemento.url ?? null
          )
          .input(
            "url_secundaria",
            sql.NVarChar(2048),
            elemento.urlSecundaria ?? null
          )
          .input(
            "id_archivo",
            sql.Int,
            elemento.idArchivo ?? null
          )
          .input(
            "datos_json",
            sql.NVarChar(sql.MAX),
            this.convertirJson(elemento.datos)
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
          `);
      }

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
