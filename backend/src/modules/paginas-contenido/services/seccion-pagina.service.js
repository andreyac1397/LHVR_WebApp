const SqlPaginaRepository = require(
  "../repositories/sql-pagina.repository"
);

const AuditoriaService = require(
  "../../auditoria/services/auditoria.service"
);

const TIPOS_ENLACE_VALIDOS = [
  "INTERNO",
  "EXTERNO",
  "ARCHIVO",
  "NINGUNO"
];

const POSICIONES_IMAGEN_VALIDAS = [
  "IZQUIERDA",
  "DERECHA",
  "ARRIBA",
  "ABAJO",
  "FONDO"
];

/*
 * Servicio encargado de crear, actualizar
 * y retirar las secciones editables
 * de las páginas públicas.
 *
 * Responsabilidades:
 * - Validar la sesión administrativa.
 * - Validar y normalizar los datos recibidos.
 * - Ejecutar el repositorio correspondiente.
 * - Convertir errores SQL en errores de la API.
 * - Registrar la acción en auditoría.
 */
class SeccionPaginaService {
  /**
   * @param {object} repositorio
   * @param {object} auditoriaService
   */
  constructor(
    repositorio = new SqlPaginaRepository(),
    auditoriaService = new AuditoriaService()
  ) {
    this.repositorio = repositorio;
    this.auditoriaService = auditoriaService;
  }

  /**
   * Crea un error controlado para el middleware
   * centralizado de errores.
   *
   * @param {string} mensaje
   * @param {number} statusCode
   * @param {string} codigo
   * @returns {Error}
   */
  crearError(
    mensaje,
    statusCode,
    codigo
  ) {
    const error = new Error(mensaje);

    error.statusCode = statusCode;
    error.codigo = codigo;

    return error;
  }

  /**
   * Obtiene el número de error generado
   * por SQL Server.
   *
   * @param {Error} error
   * @returns {number|null}
   */
  obtenerNumeroErrorSql(error) {
    const numero =
      error?.number ??
      error?.originalError?.info?.number ??
      error?.precedingErrors?.[0]?.number ??
      null;

    if (numero === null) {
      return null;
    }

    const numeroConvertido = Number(numero);

    return Number.isFinite(numeroConvertido)
      ? numeroConvertido
      : null;
  }

  /**
   * Valida la sesión administrativa y devuelve
   * el identificador del administrador.
   *
   * @param {object} sesionAdministrador
   * @returns {number}
   */
  obtenerIdAdministrador(
    sesionAdministrador
  ) {
    const idAdministrador = Number(
      sesionAdministrador?.idAdministrador
    );

    if (
      !Number.isInteger(idAdministrador) ||
      idAdministrador <= 0
    ) {
      throw this.crearError(
        "No existe una sesión administrativa válida.",
        401,
        "SESION_ADMINISTRATIVA_INVALIDA"
      );
    }

    return idAdministrador;
  }

  /**
   * Normaliza un identificador obligatorio.
   *
   * @param {*} valor
   * @param {string} nombreCampo
   * @returns {number}
   */
  normalizarIdObligatorio(
    valor,
    nombreCampo
  ) {
    const id = Number(valor);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      throw this.crearError(
        `El campo ${nombreCampo} no es válido.`,
        400,
        "IDENTIFICADOR_INVALIDO"
      );
    }

    return id;
  }

  /**
   * Normaliza un identificador opcional.
   *
   * @param {*} valor
   * @param {string} nombreCampo
   * @returns {number|null}
   */
  normalizarIdOpcional(
    valor,
    nombreCampo
  ) {
    if (
      valor === null ||
      valor === undefined ||
      valor === ""
    ) {
      return null;
    }

    return this.normalizarIdObligatorio(
      valor,
      nombreCampo
    );
  }

  /**
   * Normaliza un texto obligatorio.
   *
   * @param {*} valor
   * @param {string} nombreCampo
   * @param {number} longitudMaxima
   * @returns {string}
   */
  normalizarTextoObligatorio(
    valor,
    nombreCampo,
    longitudMaxima
  ) {
    if (typeof valor !== "string") {
      throw this.crearError(
        `El campo ${nombreCampo} es obligatorio.`,
        400,
        "CAMPO_OBLIGATORIO"
      );
    }

    const texto = valor.trim();

    if (!texto) {
      throw this.crearError(
        `El campo ${nombreCampo} es obligatorio.`,
        400,
        "CAMPO_OBLIGATORIO"
      );
    }

    if (texto.length > longitudMaxima) {
      throw this.crearError(
        `El campo ${nombreCampo} supera la longitud permitida.`,
        400,
        "LONGITUD_CAMPO_INVALIDA"
      );
    }

    return texto;
  }

  /**
   * Normaliza un texto opcional.
   *
   * @param {*} valor
   * @param {string} nombreCampo
   * @param {number} longitudMaxima
   * @returns {string|null}
   */
  normalizarTextoOpcional(
    valor,
    nombreCampo,
    longitudMaxima
  ) {
    if (
      valor === null ||
      valor === undefined ||
      valor === ""
    ) {
      return null;
    }

    if (typeof valor !== "string") {
      throw this.crearError(
        `El campo ${nombreCampo} no es válido.`,
        400,
        "TIPO_CAMPO_INVALIDO"
      );
    }

    const texto = valor.trim();

    if (!texto) {
      return null;
    }

    if (texto.length > longitudMaxima) {
      throw this.crearError(
        `El campo ${nombreCampo} supera la longitud permitida.`,
        400,
        "LONGITUD_CAMPO_INVALIDA"
      );
    }

    return texto;
  }

  /**
   * Normaliza el contenido principal de una sección.
   *
   * @param {*} valor
   * @returns {string|null}
   */
  normalizarContenido(valor) {
    if (
      valor === null ||
      valor === undefined ||
      valor === ""
    ) {
      return null;
    }

    if (typeof valor !== "string") {
      throw this.crearError(
        "El contenido de la sección no es válido.",
        400,
        "CONTENIDO_SECCION_INVALIDO"
      );
    }

    const contenido = valor.trim();

    return contenido || null;
  }

  /**
   * Normaliza la clave única de una sección.
   *
   * Ejemplos:
   * - HERO_INICIO
   * - ACCESO_BOLETINES
   * - ACCESO_CALENDARIO
   *
   * @param {*} valor
   * @returns {string}
   */
  normalizarClave(valor) {
    const clave =
      this.normalizarTextoObligatorio(
        valor,
        "clave",
        120
      ).toUpperCase();

    if (!/^[A-Z0-9_]+$/.test(clave)) {
      throw this.crearError(
        "La clave solamente puede contener letras, números y guiones bajos.",
        400,
        "CLAVE_SECCION_INVALIDA"
      );
    }

    return clave;
  }

  /**
   * Normaliza el tipo de enlace.
   *
   * @param {*} valor
   * @returns {string|null}
   */
  normalizarTipoEnlace(valor) {
    if (
      valor === null ||
      valor === undefined ||
      valor === ""
    ) {
      return null;
    }

    if (typeof valor !== "string") {
      throw this.crearError(
        "El tipo de enlace no es válido.",
        400,
        "TIPO_ENLACE_INVALIDO"
      );
    }

    const tipoEnlace =
      valor.trim().toUpperCase();

    if (
      !TIPOS_ENLACE_VALIDOS.includes(
        tipoEnlace
      )
    ) {
      throw this.crearError(
        "El tipo de enlace no es válido.",
        400,
        "TIPO_ENLACE_INVALIDO"
      );
    }

    return tipoEnlace;
  }

  /**
   * Normaliza el tipo de diseño.
   *
   * @param {*} valor
   * @returns {string|null}
   */
  normalizarTipoDiseno(valor) {
    const tipoDiseno =
      this.normalizarTextoOpcional(
        valor,
        "tipo de diseño",
        50
      );

    return tipoDiseno
      ? tipoDiseno.toUpperCase()
      : null;
  }

  /**
   * Normaliza la posición de una imagen.
   *
   * @param {*} valor
   * @returns {string|null}
   */
  normalizarPosicionImagen(valor) {
    if (
      valor === null ||
      valor === undefined ||
      valor === ""
    ) {
      return null;
    }

    if (typeof valor !== "string") {
      throw this.crearError(
        "La posición de la imagen no es válida.",
        400,
        "POSICION_IMAGEN_INVALIDA"
      );
    }

    const posicion =
      valor.trim().toUpperCase();

    if (
      !POSICIONES_IMAGEN_VALIDAS.includes(
        posicion
      )
    ) {
      throw this.crearError(
        "La posición de la imagen no es válida.",
        400,
        "POSICION_IMAGEN_INVALIDA"
      );
    }

    return posicion;
  }

  /**
   * Normaliza el orden de aparición.
   *
   * @param {*} valor
   * @returns {number}
   */
  normalizarOrden(valor) {
    if (
      valor === null ||
      valor === undefined ||
      valor === ""
    ) {
      return 0;
    }

    const orden = Number(valor);

    if (
      !Number.isInteger(orden) ||
      orden < 0
    ) {
      throw this.crearError(
        "El orden debe ser un número entero igual o mayor que cero.",
        400,
        "ORDEN_SECCION_INVALIDO"
      );
    }

    return orden;
  }

  /**
   * Valida la relación entre el texto,
   * la URL y el tipo de enlace del botón.
   *
   * @param {string|null} textoBoton
   * @param {string|null} urlBoton
   * @param {string|null} tipoEnlace
   */
  validarDatosBoton(
    textoBoton,
    urlBoton,
    tipoEnlace
  ) {
    const existeTexto = Boolean(textoBoton);
    const existeUrl = Boolean(urlBoton);

    if (existeTexto !== existeUrl) {
      throw this.crearError(
        "El texto y el enlace del botón deben completarse juntos.",
        400,
        "DATOS_BOTON_INCOMPLETOS"
      );
    }

    if (
      existeUrl &&
      (
        !tipoEnlace ||
        tipoEnlace === "NINGUNO"
      )
    ) {
      throw this.crearError(
        "Debe indicar el tipo de enlace del botón.",
        400,
        "TIPO_ENLACE_REQUERIDO"
      );
    }

    if (
      !existeUrl &&
      tipoEnlace &&
      tipoEnlace !== "NINGUNO"
    ) {
      throw this.crearError(
        "No puede indicar un tipo de enlace sin configurar el botón.",
        400,
        "TIPO_ENLACE_SIN_BOTON"
      );
    }

    if (
      urlBoton &&
      /^javascript:/i.test(urlBoton)
    ) {
      throw this.crearError(
        "La dirección del botón no es segura.",
        400,
        "URL_BOTON_INVALIDA"
      );
    }

    if (
      urlBoton &&
      tipoEnlace === "EXTERNO"
    ) {
      let url;

      try {
        url = new URL(urlBoton);
      } catch (error) {
        throw this.crearError(
          "El enlace externo no tiene un formato válido.",
          400,
          "URL_EXTERNA_INVALIDA"
        );
      }

      if (
        !["http:", "https:"].includes(
          url.protocol
        )
      ) {
        throw this.crearError(
          "El enlace externo debe utilizar HTTP o HTTPS.",
          400,
          "PROTOCOLO_URL_INVALIDO"
        );
      }
    }
  }

  /**
   * Prepara todos los datos necesarios para
   * guardar una sección.
   *
   * El identificador del administrador se obtiene
   * exclusivamente desde la sesión autenticada.
   *
   * @param {object} datos
   * @param {object} sesionAdministrador
   * @returns {object}
   */
  prepararDatos(
    datos,
    sesionAdministrador
  ) {
    if (
      !datos ||
      typeof datos !== "object" ||
      Array.isArray(datos)
    ) {
      throw this.crearError(
        "Los datos de la sección no son válidos.",
        400,
        "DATOS_SECCION_INVALIDOS"
      );
    }

    const idAdministrador =
      this.obtenerIdAdministrador(
        sesionAdministrador
      );

    const idSeccionPagina =
      this.normalizarIdOpcional(
        datos.idSeccionPagina,
        "idSeccionPagina"
      );

    const idPagina =
      this.normalizarIdObligatorio(
        datos.idPagina,
        "idPagina"
      );

    const clave =
      this.normalizarClave(
        datos.clave
      );

    const etiqueta =
      this.normalizarTextoOpcional(
        datos.etiqueta,
        "etiqueta",
        120
      );

    const titulo =
      this.normalizarTextoOpcional(
        datos.titulo,
        "título",
        250
      );

    const subtitulo =
      this.normalizarTextoOpcional(
        datos.subtitulo,
        "subtítulo",
        300
      );

    const contenido =
      this.normalizarContenido(
        datos.contenido
      );

    const idArchivo =
      this.normalizarIdOpcional(
        datos.idArchivo,
        "idArchivo"
      );

    const textoAlternativo =
      this.normalizarTextoOpcional(
        datos.textoAlternativo,
        "texto alternativo",
        300
      );

    const textoBoton =
      this.normalizarTextoOpcional(
        datos.textoBoton,
        "texto del botón",
        120
      );

    const urlBoton =
      this.normalizarTextoOpcional(
        datos.urlBoton,
        "enlace del botón",
        1000
      );

    const tipoEnlace =
      this.normalizarTipoEnlace(
        datos.tipoEnlace
      );

    const tipoDiseno =
      this.normalizarTipoDiseno(
        datos.tipoDiseno
      );

    const posicionImagen =
      this.normalizarPosicionImagen(
        datos.posicionImagen
      );

    const orden =
      this.normalizarOrden(
        datos.orden
      );

    const idEstadoPublicacion =
      this.normalizarIdObligatorio(
        datos.idEstadoPublicacion,
        "idEstadoPublicacion"
      );

    this.validarDatosBoton(
      textoBoton,
      urlBoton,
      tipoEnlace
    );

    return {
      idSeccionPagina,
      idPagina,
      clave,
      etiqueta,
      titulo,
      subtitulo,
      contenido,
      idArchivo,
      textoAlternativo,
      textoBoton,
      urlBoton,
      tipoEnlace,
      tipoDiseno,
      posicionImagen,
      orden,
      idEstadoPublicacion,

      idAdministradorUltimaModificacion:
        idAdministrador
    };
  }

  /**
   * Prepara los datos necesarios para retirar
   * una sección de una página.
   *
   * @param {*} idSeccionPagina
   * @param {object} sesionAdministrador
   * @returns {{
   *   idSeccionPagina: number,
   *   idAdministradorUltimaModificacion: number
   * }}
   */
  prepararDatosRetiro(
    idSeccionPagina,
    sesionAdministrador
  ) {
    const idAdministrador =
      this.obtenerIdAdministrador(
        sesionAdministrador
      );

    const idSeccion =
      this.normalizarIdObligatorio(
        idSeccionPagina,
        "idSeccionPagina"
      );

    return {
      idSeccionPagina:
        idSeccion,

      idAdministradorUltimaModificacion:
        idAdministrador
    };
  }

  /**
   * Convierte los errores conocidos de los
   * procedimientos almacenados de secciones
   * en errores controlados por la API.
   *
   * Procedimientos:
   * - dbo.sp_guardar_seccion_pagina
   * - dbo.sp_retirar_seccion_pagina
   *
   * @param {Error} error
   * @returns {Error}
   */
  transformarErrorRepositorio(error) {
    if (error?.statusCode) {
      return error;
    }

    const numeroError =
      this.obtenerNumeroErrorSql(error);

    const errores = {
      /*
       * ============================================
       * sp_retirar_seccion_pagina
       * ============================================
       */

      50001: {
        mensaje:
          "El identificador de la sección no es válido.",
        statusCode: 400,
        codigo:
          "ID_SECCION_INVALIDO"
      },

      50002: {
        mensaje:
          "La sesión administrativa no es válida.",
        statusCode: 401,
        codigo:
          "SESION_ADMINISTRATIVA_INVALIDA"
      },

      50003: {
        mensaje:
          "La sección indicada no existe.",
        statusCode: 404,
        codigo:
          "SECCION_PAGINA_NO_ENCONTRADA"
      },

      50004: {
        mensaje:
          "El administrador de la sesión no existe.",
        statusCode: 401,
        codigo:
          "ADMINISTRADOR_SESION_NO_ENCONTRADO"
      },

      50005: {
        mensaje:
          "No se encuentra configurado el estado Archivado.",
        statusCode: 500,
        codigo:
          "ESTADO_ARCHIVADO_NO_CONFIGURADO"
      },

      /*
       * ============================================
       * sp_guardar_seccion_pagina
       * ============================================
       */

      50010: {
        mensaje:
          "El identificador de la sección no es válido.",
        statusCode: 400,
        codigo:
          "ID_SECCION_INVALIDO"
      },

      50011: {
        mensaje:
          "La página indicada no es válida.",
        statusCode: 400,
        codigo:
          "ID_PAGINA_INVALIDO"
      },

      50012: {
        mensaje:
          "La clave de la sección es obligatoria.",
        statusCode: 400,
        codigo:
          "CLAVE_SECCION_REQUERIDA"
      },

      50013: {
        mensaje:
          "El orden de la sección no puede ser negativo.",
        statusCode: 400,
        codigo:
          "ORDEN_SECCION_INVALIDO"
      },

      50014: {
        mensaje:
          "El estado de publicación no es válido.",
        statusCode: 400,
        codigo:
          "ESTADO_PUBLICACION_INVALIDO"
      },

      50015: {
        mensaje:
          "La sesión administrativa no es válida.",
        statusCode: 401,
        codigo:
          "SESION_ADMINISTRATIVA_INVALIDA"
      },

      50016: {
        mensaje:
          "El tipo de enlace no es válido.",
        statusCode: 400,
        codigo:
          "TIPO_ENLACE_INVALIDO"
      },

      50017: {
        mensaje:
          "La posición de la imagen no es válida.",
        statusCode: 400,
        codigo:
          "POSICION_IMAGEN_INVALIDA"
      },

      50018: {
        mensaje:
          "La página indicada no existe.",
        statusCode: 404,
        codigo:
          "PAGINA_NO_ENCONTRADA"
      },

      50019: {
        mensaje:
          "El estado de publicación no existe o está inactivo.",
        statusCode: 400,
        codigo:
          "ESTADO_PUBLICACION_NO_DISPONIBLE"
      },

      50020: {
        mensaje:
          "El administrador de la sesión no existe.",
        statusCode: 401,
        codigo:
          "ADMINISTRADOR_SESION_NO_ENCONTRADO"
      },

      50021: {
        mensaje:
          "El archivo indicado no existe o está inactivo.",
        statusCode: 404,
        codigo:
          "ARCHIVO_NO_ENCONTRADO"
      },

      50022: {
        mensaje:
          "Ya existe una sección con esa clave dentro de la página.",
        statusCode: 409,
        codigo:
          "CLAVE_SECCION_DUPLICADA"
      },

      50023: {
        mensaje:
          "La sección indicada no existe dentro de la página.",
        statusCode: 404,
        codigo:
          "SECCION_PAGINA_NO_ENCONTRADA"
      },

      50024: {
        mensaje:
          "Ya existe otra sección con esa clave dentro de la página.",
        statusCode: 409,
        codigo:
          "CLAVE_SECCION_DUPLICADA"
      }
    };

    const errorConocido =
      errores[numeroError];

    if (!errorConocido) {
      return error;
    }

    return this.crearError(
      errorConocido.mensaje,
      errorConocido.statusCode,
      errorConocido.codigo
    );
  }

  /**
   * Crea o actualiza una sección de página.
   *
   * Cuando idSeccionPagina es null:
   * - Crea una sección.
   *
   * Cuando idSeccionPagina contiene un valor:
   * - Actualiza la sección existente.
   *
   * @param {object} datos
   * @param {object} sesionAdministrador
   * @param {object} contexto
   * @param {string|null} contexto.direccionIp
   * @param {string|null} contexto.userAgent
   *
   * @returns {Promise<{
   *   guardado: boolean,
   *   operacion: string,
   *   mensaje: string,
   *   seccion: object
   * }>}
   */
  async guardarSeccion(
    datos,
    sesionAdministrador,
    contexto = {}
  ) {
    const datosPreparados =
      this.prepararDatos(
        datos,
        sesionAdministrador
      );

    const esCreacion =
      datosPreparados
        .idSeccionPagina === null;

    let seccionGuardada;

    try {
      seccionGuardada =
        await this.repositorio
          .guardarSeccionPagina(
            datosPreparados
          );
    } catch (error) {
      throw this.transformarErrorRepositorio(
        error
      );
    }

    if (
      !seccionGuardada ||
      typeof seccionGuardada !== "object"
    ) {
      throw this.crearError(
        "No fue posible obtener la sección guardada.",
        500,
        "RESULTADO_SECCION_INVALIDO"
      );
    }

    await this.auditoriaService
      .registrarSinInterrumpir({
        idAdministrador:
          datosPreparados
            .idAdministradorUltimaModificacion,

        codigoAccion:
          esCreacion
            ? "CREAR"
            : "EDITAR",

        codigoModulo:
          "PAGINAS",

        tablaAfectada:
          "secciones_pagina",

        idRegistroAfectado:
          seccionGuardada
            .idSeccionPagina,

        datosNuevos: {
          idSeccionPagina:
            seccionGuardada
              .idSeccionPagina,

          idPagina:
            seccionGuardada.idPagina,

          clave:
            seccionGuardada.clave,

          etiqueta:
            seccionGuardada.etiqueta,

          titulo:
            seccionGuardada.titulo,

          subtitulo:
            seccionGuardada.subtitulo,

          contenido:
            seccionGuardada.contenido,

          idArchivo:
            seccionGuardada.idArchivo,

          textoAlternativo:
            seccionGuardada
              .textoAlternativo,

          textoBoton:
            seccionGuardada.textoBoton,

          urlBoton:
            seccionGuardada.urlBoton,

          tipoEnlace:
            seccionGuardada.tipoEnlace,

          tipoDiseno:
            seccionGuardada.tipoDiseno,

          posicionImagen:
            seccionGuardada
              .posicionImagen,

          orden:
            seccionGuardada.orden,

          idEstadoPublicacion:
            seccionGuardada
              .idEstadoPublicacion
        },

        descripcion:
          esCreacion
            ? `Se creó la sección ${seccionGuardada.clave} de la página ${seccionGuardada.idPagina}.`
            : `Se actualizó la sección ${seccionGuardada.clave} de la página ${seccionGuardada.idPagina}.`,

        direccionIp:
          contexto.direccionIp ?? null,

        userAgent:
          contexto.userAgent ?? null
      });

    return {
      guardado: true,

      operacion:
        esCreacion
          ? "CREACION"
          : "ACTUALIZACION",

      mensaje:
        esCreacion
          ? "La sección fue creada correctamente."
          : "La sección fue actualizada correctamente.",

      seccion:
        seccionGuardada
    };
  }

  /**
   * Retira lógicamente una sección.
   *
   * La sección no se elimina físicamente.
   * El procedimiento almacenado cambia su
   * estado de publicación a Archivado.
   *
   * @param {*} idSeccionPagina
   * @param {object} sesionAdministrador
   * @param {object} contexto
   * @param {string|null} contexto.direccionIp
   * @param {string|null} contexto.userAgent
   *
   * @returns {Promise<{
   *   retirado: boolean,
   *   yaRetirada: boolean,
   *   mensaje: string,
   *   seccion: object
   * }>}
   */
  async retirarSeccion(
    idSeccionPagina,
    sesionAdministrador,
    contexto = {}
  ) {
    const datosPreparados =
      this.prepararDatosRetiro(
        idSeccionPagina,
        sesionAdministrador
      );

    let seccionRetirada;

    try {
      seccionRetirada =
        await this.repositorio
          .retirarSeccionPagina(
            datosPreparados
          );
    } catch (error) {
      throw this.transformarErrorRepositorio(
        error
      );
    }

    if (
      !seccionRetirada ||
      typeof seccionRetirada !== "object"
    ) {
      throw this.crearError(
        "No fue posible obtener la sección retirada.",
        500,
        "RESULTADO_RETIRO_SECCION_INVALIDO"
      );
    }

    const yaRetirada =
      seccionRetirada.yaRetirada === true;

    /*
     * Si el SP indica que ya estaba archivada,
     * no registramos una segunda eliminación
     * en auditoría.
     */
    if (!yaRetirada) {
      await this.auditoriaService
        .registrarSinInterrumpir({
          idAdministrador:
            datosPreparados
              .idAdministradorUltimaModificacion,

          codigoAccion:
            "ELIMINAR",

          codigoModulo:
            "PAGINAS",

          tablaAfectada:
            "secciones_pagina",

          idRegistroAfectado:
            seccionRetirada
              .idSeccionPagina,

          datosAnteriores: {
            idEstadoPublicacion:
              seccionRetirada
                .idEstadoPublicacionAnterior
          },

          datosNuevos: {
            idEstadoPublicacion:
              seccionRetirada
                .idEstadoPublicacion,

            estadoPublicacion:
              seccionRetirada
                .estadoPublicacion
          },

          descripcion:
            `Se retiró la sección ${seccionRetirada.clave} de la página ${seccionRetirada.idPagina}.`,

          direccionIp:
            contexto.direccionIp ?? null,

          userAgent:
            contexto.userAgent ?? null
        });
    }

    return {
      retirado:
        true,

      yaRetirada,

      mensaje:
        yaRetirada
          ? "La sección ya se encontraba retirada."
          : "La sección fue retirada correctamente.",

      seccion:
        seccionRetirada
    };
  }
}

module.exports = SeccionPaginaService;