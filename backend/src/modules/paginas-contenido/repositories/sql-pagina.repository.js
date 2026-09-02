const PaginaRepositoryContract = require(
  "../contracts/pagina.repository.contract"
);

const {
  sql,
  obtenerConexion
} = require("../../../config/database");

/*
 * Repositorio SQL del módulo de páginas y contenido.
 *
 * Es la única clase de este módulo que se comunica
 * directamente con SQL Server.
 */
class SqlPaginaRepository
  extends PaginaRepositoryContract {

  /**
   * Obtiene un recordset específico.
   *
   * @param {object} resultado
   * @param {number} indice
   * @returns {object[]}
   */
  obtenerRecordset(resultado, indice = 0) {
    if (
      !resultado ||
      !Array.isArray(resultado.recordsets) ||
      !Array.isArray(resultado.recordsets[indice])
    ) {
      if (
        indice === 0 &&
        Array.isArray(resultado?.recordset)
      ) {
        return resultado.recordset;
      }

      return [];
    }

    return resultado.recordsets[indice];
  }

  /**
   * Obtiene la primera fila del primer resultado.
   *
   * @param {object} resultado
   * @returns {object|null}
   */
  obtenerPrimeraFila(resultado) {
    const filas = this.obtenerRecordset(
      resultado,
      0
    );

    return filas.length > 0
      ? filas[0]
      : null;
  }

  /**
   * Convierte un valor numérico proveniente
   * de SQL Server.
   *
   * @param {*} valor
   * @returns {number|null}
   */
  convertirNumero(valor) {
    if (
      valor === null ||
      valor === undefined
    ) {
      return null;
    }

    return Number(valor);
  }

  /**
   * Convierte un valor BIT de SQL Server
   * a booleano.
   *
   * @param {*} valor
   * @returns {boolean|null}
   */
  convertirBooleano(valor) {
    if (
      valor === null ||
      valor === undefined
    ) {
      return null;
    }

    return Boolean(valor);
  }

  /**
   * Normaliza los datos generales de una página.
   *
   * @param {object|null} fila
   * @returns {object|null}
   */
  normalizarPagina(fila) {
    if (!fila) {
      return null;
    }

    return {
      idPagina:
        this.convertirNumero(
          fila.idPagina ??
          fila.id_pagina
        ),

      nombre:
        fila.nombre ?? null,

      slug:
        fila.slug ?? null,

      titulo:
        fila.titulo ?? null,

      descripcion:
        fila.descripcion ?? null,

      ruta:
        fila.ruta ?? null,

      ordenMenu:
        this.convertirNumero(
          fila.ordenMenu ??
          fila.orden_menu
        ),

      mostrarMenu:
        this.convertirBooleano(
          fila.mostrarMenu ??
          fila.mostrar_menu
        ),

      idEstadoPublicacion:
        this.convertirNumero(
          fila.idEstadoPublicacion ??
          fila.id_estado_publicacion
        ),

      nombreEstado:
        fila.nombreEstado ??
        fila.nombre_estado ??
        null,

      estadoVisible:
        this.convertirBooleano(
          fila.estadoVisible ??
          fila.estado_visible
        ),

      fechaPublicacion:
        fila.fechaPublicacion ??
        fila.fecha_publicacion ??
        null,

      fechaCreacion:
        fila.fechaCreacion ??
        fila.fecha_creacion ??
        null,

      fechaActualizacion:
        fila.fechaActualizacion ??
        fila.fecha_actualizacion ??
        null,

      idAdministradorUltimaModificacion:
        this.convertirNumero(
          fila.idAdministradorUltimaModificacion ??
          fila.id_administrador_ultima_modificacion
        )
    };
  }

  /**
   * Normaliza una sección de página.
   *
   * @param {object} fila
   * @returns {object}
   */
  normalizarSeccion(fila) {
    return {
      idSeccionPagina:
        this.convertirNumero(
          fila.idSeccionPagina ??
          fila.id_seccion_pagina
        ),

      idPagina:
        this.convertirNumero(
          fila.idPagina ??
          fila.id_pagina
        ),

      clave:
        fila.clave ?? null,

      etiqueta:
        fila.etiqueta ?? null,

      titulo:
        fila.titulo ?? null,

      subtitulo:
        fila.subtitulo ?? null,

      contenido:
        fila.contenido ?? null,

      idArchivo:
        this.convertirNumero(
          fila.idArchivo ??
          fila.id_archivo
        ),

      textoAlternativo:
        fila.textoAlternativo ??
        fila.texto_alternativo ??
        null,

      textoBoton:
        fila.textoBoton ??
        fila.texto_boton ??
        null,

      urlBoton:
        fila.urlBoton ??
        fila.url_boton ??
        null,

      tipoEnlace:
        fila.tipoEnlace ??
        fila.tipo_enlace ??
        null,

      tipoDiseno:
        fila.tipoDiseno ??
        fila.tipo_diseno ??
        null,

      posicionImagen:
        fila.posicionImagen ??
        fila.posicion_imagen ??
        null,

      orden:
        this.convertirNumero(
          fila.orden
        ),

      idEstadoPublicacion:
        this.convertirNumero(
          fila.idEstadoPublicacion ??
          fila.id_estado_publicacion
        ),

      nombreEstado:
        fila.nombreEstado ??
        fila.nombre_estado ??
        null,

      estadoVisible:
        this.convertirBooleano(
          fila.estadoVisible ??
          fila.estado_visible
        ),

      nombreArchivoOriginal:
        fila.nombreArchivoOriginal ??
        fila.nombre_archivo_original ??
        null,

      nombreArchivoAlmacenado:
        fila.nombreArchivoAlmacenado ??
        fila.nombre_archivo_almacenado ??
        null,

      rutaArchivo:
        fila.rutaArchivo ??
        fila.ruta_archivo ??
        null,

      mimeTypeArchivo:
        fila.mimeTypeArchivo ??
        fila.mime_type_archivo ??
        null,

      tipoArchivo:
        fila.tipoArchivo ??
        fila.tipo_archivo ??
        null,

      archivoActivo:
        this.convertirBooleano(
          fila.archivoActivo ??
          fila.archivo_activo
        ),

      fechaCreacion:
        fila.fechaCreacion ??
        fila.fecha_creacion ??
        null,

      fechaActualizacion:
        fila.fechaActualizacion ??
        fila.fecha_actualizacion ??
        null,

      idAdministradorUltimaModificacion:
        this.convertirNumero(
          fila.idAdministradorUltimaModificacion ??
          fila.id_administrador_ultima_modificacion
        )
    };
  }

  /**
   * Normaliza un estado de publicación.
   *
   * @param {object} fila
   * @returns {object}
   */
  normalizarEstadoPublicacion(fila) {
    return {
      idEstadoPublicacion:
        this.convertirNumero(
          fila.idEstadoPublicacion ??
          fila.id_estado_publicacion
        ),

      nombre:
        fila.nombre ?? null,

      descripcion:
        fila.descripcion ?? null,

      esVisible:
        this.convertirBooleano(
          fila.esVisible ??
          fila.es_visible
        ),

      orden:
        this.convertirNumero(
          fila.orden
        ),

      activo:
        this.convertirBooleano(
          fila.activo
        )
    };
  }

  /**
   * Obtiene una página y sus secciones
   * mediante el slug.
   *
   * Procedimiento:
   * dbo.sp_obtener_contenido_pagina_por_slug
   *
   * @param {string} slug
   * @param {boolean} soloVisibles
   * @returns {Promise<{
   *   pagina: object|null,
   *   secciones: object[]
   * }>}
   */
  async obtenerContenidoPaginaPorSlug(
    slug,
    soloVisibles = false
  ) {
    const conexion = await obtenerConexion();

    const resultado = await conexion
      .request()
      .input(
        "slug",
        sql.NVarChar(160),
        slug
      )
      .input(
        "soloVisibles",
        sql.Bit,
        Boolean(soloVisibles)
      )
      .execute(
        "dbo.sp_obtener_contenido_pagina_por_slug"
      );

    const filasPagina =
      this.obtenerRecordset(
        resultado,
        0
      );

    const filasSecciones =
      this.obtenerRecordset(
        resultado,
        1
      );

    return {
      pagina:
        this.normalizarPagina(
          filasPagina[0] ?? null
        ),

      secciones:
        filasSecciones.map(
          (fila) =>
            this.normalizarSeccion(fila)
        )
    };
  }

  /**
   * Actualiza la fila existente de dbo.paginas. La consulta es
   * parametrizada y no requiere cambios en el esquema ni un SP nuevo.
   *
   * @param {object} datosPagina
   * @returns {Promise<object>}
   */
  async guardarPagina(datosPagina) {
    const conexion = await obtenerConexion();

    const resultado = await conexion
      .request()
      .input(
        "idPagina",
        sql.Int,
        datosPagina.idPagina
      )
      .input(
        "titulo",
        sql.NVarChar(200),
        datosPagina.titulo
      )
      .input(
        "descripcion",
        sql.NVarChar(500),
        datosPagina.descripcion ?? null
      )
      .input(
        "idEstadoPublicacion",
        sql.Int,
        datosPagina.idEstadoPublicacion
      )
      .input(
        "idAdministrador",
        sql.Int,
        datosPagina
          .idAdministradorUltimaModificacion
      )
      .query(`
        IF NOT EXISTS (
          SELECT 1
          FROM dbo.estados_publicacion
          WHERE id_estado_publicacion = @idEstadoPublicacion
            AND activo = 1
        )
          THROW 51040, N'El estado de publicación no existe o está inactivo.', 1;

        UPDATE dbo.paginas
        SET
          titulo = @titulo,
          descripcion = @descripcion,
          id_estado_publicacion = @idEstadoPublicacion,
          fecha_publicacion = CASE
            WHEN EXISTS (
              SELECT 1
              FROM dbo.estados_publicacion
              WHERE id_estado_publicacion = @idEstadoPublicacion
                AND es_visible = 1
            )
              THEN COALESCE(fecha_publicacion, SYSUTCDATETIME())
            ELSE fecha_publicacion
          END,
          fecha_actualizacion = SYSUTCDATETIME(),
          id_administrador_ultima_modificacion = @idAdministrador
        WHERE id_pagina = @idPagina;

        IF @@ROWCOUNT = 0
          THROW 51041, N'La página indicada no existe.', 1;

        SELECT
          p.id_pagina AS idPagina,
          p.nombre,
          p.slug,
          p.titulo,
          p.descripcion,
          p.ruta,
          p.orden_menu AS ordenMenu,
          p.mostrar_menu AS mostrarMenu,
          p.id_estado_publicacion AS idEstadoPublicacion,
          ep.nombre AS nombreEstado,
          ep.es_visible AS estadoVisible,
          p.fecha_publicacion AS fechaPublicacion,
          p.fecha_creacion AS fechaCreacion,
          p.fecha_actualizacion AS fechaActualizacion,
          p.id_administrador_ultima_modificacion
            AS idAdministradorUltimaModificacion
        FROM dbo.paginas AS p
        INNER JOIN dbo.estados_publicacion AS ep
          ON ep.id_estado_publicacion = p.id_estado_publicacion
        WHERE p.id_pagina = @idPagina;
      `);

    const fila =
      this.obtenerPrimeraFila(resultado);

    if (!fila) {
      const error = new Error(
        "La actualización no devolvió la página guardada."
      );

      error.statusCode = 500;
      error.codigo = "PAGINA_NO_DEVUELTA";

      throw error;
    }

    return this.normalizarPagina(fila);
  }

  /**
   * Crea o actualiza una sección de página.
   *
   * Procedimiento:
   * dbo.sp_guardar_seccion_pagina
   *
   * @param {object} datosSeccion
   * @returns {Promise<object>}
   */
  async guardarSeccionPagina(
    datosSeccion
  ) {
    const conexion = await obtenerConexion();

    const resultado = await conexion
      .request()
      .input(
        "idSeccionPagina",
        sql.BigInt,
        datosSeccion.idSeccionPagina ??
          null
      )
      .input(
        "idPagina",
        sql.Int,
        datosSeccion.idPagina
      )
      .input(
        "clave",
        sql.NVarChar(120),
        datosSeccion.clave
      )
      .input(
        "etiqueta",
        sql.NVarChar(120),
        datosSeccion.etiqueta ?? null
      )
      .input(
        "titulo",
        sql.NVarChar(250),
        datosSeccion.titulo ?? null
      )
      .input(
        "subtitulo",
        sql.NVarChar(300),
        datosSeccion.subtitulo ?? null
      )
      .input(
        "contenido",
        sql.NVarChar(sql.MAX),
        datosSeccion.contenido ?? null
      )
      .input(
        "idArchivo",
        sql.BigInt,
        datosSeccion.idArchivo ?? null
      )
      .input(
        "textoAlternativo",
        sql.NVarChar(300),
        datosSeccion.textoAlternativo ??
          null
      )
      .input(
        "textoBoton",
        sql.NVarChar(120),
        datosSeccion.textoBoton ?? null
      )
      .input(
        "urlBoton",
        sql.NVarChar(1000),
        datosSeccion.urlBoton ?? null
      )
      .input(
        "tipoEnlace",
        sql.NVarChar(30),
        datosSeccion.tipoEnlace ?? null
      )
      .input(
        "tipoDiseno",
        sql.NVarChar(50),
        datosSeccion.tipoDiseno ?? null
      )
      .input(
        "posicionImagen",
        sql.NVarChar(20),
        datosSeccion.posicionImagen ??
          null
      )
      .input(
        "orden",
        sql.Int,
        datosSeccion.orden ?? 0
      )
      .input(
        "idEstadoPublicacion",
        sql.Int,
        datosSeccion.idEstadoPublicacion
      )
      .input(
        "idAdministradorUltimaModificacion",
        sql.Int,
        datosSeccion
          .idAdministradorUltimaModificacion
      )
      .execute(
        "dbo.sp_guardar_seccion_pagina"
      );

    const fila =
      this.obtenerPrimeraFila(resultado);

    if (!fila) {
      const error = new Error(
        "El procedimiento no devolvió la sección guardada."
      );

      error.statusCode = 500;
      error.codigo =
        "SECCION_PAGINA_NO_DEVUELTA";

      throw error;
    }

    return this.normalizarSeccion(fila);
  }

  /**
   * Retira lógicamente una sección de página.
   *
   * Procedimiento:
   * dbo.sp_retirar_seccion_pagina
   *
   * @param {object} datosRetiro
   * @param {number} datosRetiro.idSeccionPagina
   * @param {number} datosRetiro.idAdministradorUltimaModificacion
   * @returns {Promise<object>}
   */
  async retirarSeccionPagina(
    datosRetiro
  ) {
    const conexion =
      await obtenerConexion();

    const resultado =
      await conexion
        .request()
        .input(
          "id_seccion_pagina",
          sql.BigInt,
          datosRetiro.idSeccionPagina
        )
        .input(
          "id_administrador_ultima_modificacion",
          sql.Int,
          datosRetiro
            .idAdministradorUltimaModificacion
        )
        .execute(
          "dbo.sp_retirar_seccion_pagina"
        );

    const fila =
      this.obtenerPrimeraFila(
        resultado
      );

    if (!fila) {
      const error =
        new Error(
          "El procedimiento no devolvió la sección retirada."
        );

      error.statusCode =
        500;

      error.codigo =
        "SECCION_PAGINA_RETIRADA_NO_DEVUELTA";

      throw error;
    }

    const seccion =
      this.normalizarSeccion(
        fila
      );

    return {
      ...seccion,

      estadoPublicacion:
        fila.estadoPublicacion ??
        fila.estado_publicacion ??
        null,

      idEstadoPublicacionAnterior:
        this.convertirNumero(
          fila.idEstadoPublicacionAnterior ??
          fila.id_estado_publicacion_anterior
        ),

      yaRetirada:
        this.convertirBooleano(
          fila.yaRetirada ??
          fila.ya_retirada
        )
    };
  }

  /**
   * Lista los estados de publicación activos.
   *
   * Procedimiento:
   * dbo.sp_listar_estados_publicacion
   *
   * @returns {Promise<object[]>}
   */
  async listarEstadosPublicacion() {
    const conexion = await obtenerConexion();

    const resultado = await conexion
      .request()
      .execute(
        "dbo.sp_listar_estados_publicacion"
      );

    const filas =
      this.obtenerRecordset(
        resultado,
        0
      );

    return filas.map(
      (fila) =>
        this.normalizarEstadoPublicacion(
          fila
        )
    );
  }
}

module.exports = SqlPaginaRepository;
