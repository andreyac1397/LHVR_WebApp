const GuardarSeccionPaginaDto = require(
  "../dto/guardar-seccion-pagina.dto"
);

const GuardarPaginaDto = require(
  "../dto/guardar-pagina.dto"
);

/*
 * Validador de solicitudes HTTP del módulo
 * de páginas y contenido.
 *
 * Responsabilidades:
 * - Validar parámetros de ruta.
 * - Validar parámetros de consulta.
 * - Verificar la estructura básica del body.
 * - Crear el DTO para guardar una sección.
 *
 * Las reglas de negocio definitivas permanecen
 * dentro de los servicios del módulo.
 */
class PaginaValidator {
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
   * Determina si un valor es un objeto válido
   * y no un arreglo.
   *
   * @param {*} valor
   * @returns {boolean}
   */
  esObjetoValido(valor) {
    return (
      valor !== null &&
      typeof valor === "object" &&
      !Array.isArray(valor)
    );
  }

  /**
   * Valida y normaliza el slug recibido
   * como parámetro de ruta.
   *
   * Ejemplos válidos:
   * - inicio
   * - nosotros
   * - oferta-academica
   *
   * @param {*} slug
   * @returns {string}
   */
  validarSlug(slug) {
    if (typeof slug !== "string") {
      throw this.crearError(
        "El slug de la página es obligatorio.",
        400,
        "SLUG_PAGINA_REQUERIDO"
      );
    }

    const slugNormalizado =
      slug
        .trim()
        .toLowerCase();

    if (!slugNormalizado) {
      throw this.crearError(
        "El slug de la página es obligatorio.",
        400,
        "SLUG_PAGINA_REQUERIDO"
      );
    }

    if (slugNormalizado.length > 160) {
      throw this.crearError(
        "El slug de la página supera la longitud permitida.",
        400,
        "SLUG_PAGINA_DEMASIADO_LARGO"
      );
    }

    const formatoValido =
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/
        .test(slugNormalizado);

    if (!formatoValido) {
      throw this.crearError(
        "El formato del slug de la página no es válido.",
        400,
        "SLUG_PAGINA_INVALIDO"
      );
    }

    return slugNormalizado;
  }

  /**
   * Valida el parámetro de consulta utilizado
   * para indicar si deben devolverse únicamente
   * contenidos visibles.
   *
   * Valores aceptados:
   * - true
   * - false
   * - 1
   * - 0
   *
   * Cuando no se envía, devuelve el valor
   * predeterminado indicado.
   *
   * @param {*} valor
   * @param {boolean} valorPredeterminado
   * @returns {boolean}
   */
  validarBooleanoConsulta(
    valor,
    valorPredeterminado = false
  ) {
    if (
      valor === undefined ||
      valor === null ||
      valor === ""
    ) {
      return Boolean(valorPredeterminado);
    }

    if (typeof valor === "boolean") {
      return valor;
    }

    if (valor === 1 || valor === "1") {
      return true;
    }

    if (valor === 0 || valor === "0") {
      return false;
    }

    if (typeof valor === "string") {
      const valorNormalizado =
        valor
          .trim()
          .toLowerCase();

      if (valorNormalizado === "true") {
        return true;
      }

      if (valorNormalizado === "false") {
        return false;
      }
    }

    throw this.crearError(
      "El parámetro de visibilidad no es válido.",
      400,
      "PARAMETRO_VISIBILIDAD_INVALIDO"
    );
  }

  /**
   * Valida que un identificador obligatorio
   * esté presente en el body.
   *
   * La validación numérica definitiva se realiza
   * posteriormente dentro del servicio.
   *
   * @param {*} valor
   * @param {string} nombreCampo
   */
  validarCampoObligatorio(
    valor,
    nombreCampo
  ) {
    if (
      valor === undefined ||
      valor === null ||
      (
        typeof valor === "string" &&
        !valor.trim()
      )
    ) {
      throw this.crearError(
        `El campo ${nombreCampo} es obligatorio.`,
        400,
        "CAMPO_OBLIGATORIO"
      );
    }
  }

  /**
   * Verifica que el cuerpo de la solicitud
   * contenga los campos mínimos necesarios
   * para guardar una sección.
   *
   * @param {*} body
   */
  validarCuerpoGuardarSeccion(body) {
    if (!this.esObjetoValido(body)) {
      throw this.crearError(
        "Los datos de la sección no son válidos.",
        400,
        "DATOS_SECCION_INVALIDOS"
      );
    }

    this.validarCampoObligatorio(
      body.idPagina,
      "idPagina"
    );

    this.validarCampoObligatorio(
      body.clave,
      "clave"
    );

    this.validarCampoObligatorio(
      body.idEstadoPublicacion,
      "idEstadoPublicacion"
    );
  }

  /**
   * Crea el DTO utilizado para crear
   * o actualizar una sección de página.
   *
   * El identificador del administrador no se
   * recibe desde el body. Se obtiene después
   * desde la sesión autenticada.
   *
   * @param {*} body
   * @returns {GuardarSeccionPaginaDto}
   */
  crearGuardarSeccionPaginaDto(body) {
    this.validarCuerpoGuardarSeccion(
      body
    );

    return new GuardarSeccionPaginaDto({
      idSeccionPagina:
        body.idSeccionPagina ?? null,

      idPagina:
        body.idPagina,

      clave:
        body.clave,

      etiqueta:
        body.etiqueta ?? null,

      titulo:
        body.titulo ?? null,

      subtitulo:
        body.subtitulo ?? null,

      contenido:
        body.contenido ?? null,

      idArchivo:
        body.idArchivo ?? null,

      textoAlternativo:
        body.textoAlternativo ?? null,

      textoBoton:
        body.textoBoton ?? null,

      urlBoton:
        body.urlBoton ?? null,

      tipoEnlace:
        body.tipoEnlace ?? null,

      tipoDiseno:
        body.tipoDiseno ?? null,

      posicionImagen:
        body.posicionImagen ?? null,

      orden:
        body.orden ?? 0,

      idEstadoPublicacion:
        body.idEstadoPublicacion
    });
  }

  /**
   * Valida y crea el DTO para actualizar el encabezado y el
   * estado general de una página existente.
   *
   * @param {*} idPagina
   * @param {*} body
   * @returns {GuardarPaginaDto}
   */
  crearGuardarPaginaDto(
    idPagina,
    body
  ) {
    if (!this.esObjetoValido(body)) {
      throw this.crearError(
        "Los datos de la página no son válidos.",
        400,
        "DATOS_PAGINA_INVALIDOS"
      );
    }

    this.validarCampoObligatorio(
      idPagina,
      "idPagina"
    );

    this.validarCampoObligatorio(
      body.titulo,
      "titulo"
    );

    this.validarCampoObligatorio(
      body.idEstadoPublicacion,
      "idEstadoPublicacion"
    );

    return new GuardarPaginaDto({
      idPagina,
      titulo: body.titulo,
      descripcion:
        body.descripcion ?? null,
      idEstadoPublicacion:
        body.idEstadoPublicacion
    });
  }
}

module.exports = PaginaValidator;
