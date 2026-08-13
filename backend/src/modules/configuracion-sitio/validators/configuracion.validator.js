/* ============================================================
   CONFIGURACION.VALIDATOR.JS
   Liceo Hernán Vargas Ramírez
   ------------------------------------------------------------
   Validador de datos para la configuración general del sitio.

   Responsabilidades:
   - Validar la clave de configuración.
   - Validar el valor recibido.
   - Aplicar validaciones específicas cuando corresponda.
   - Evitar que datos inválidos lleguen a la capa de servicio.

   Este validador NO decide si una clave existe en la BD.
   Esa responsabilidad permanece en la base de datos y
   en la capa de repositorio/servicio.
   ============================================================ */


/* ============================================================
   VALIDADOR
   ============================================================ */

class ConfiguracionValidator {

  /* ==========================================================
     UTILIDADES
     ========================================================== */

  /**
   * Normaliza una clave de configuración.
   *
   * @param {*} valor
   * @returns {string}
   */
  normalizarClave(valor) {
    return String(valor ?? "")
      .trim()
      .toLowerCase();
  }


  /**
   * Normaliza el valor recibido.
   *
   * @param {*} valor
   * @returns {string|null}
   */
  normalizarValor(valor) {
    if (
      valor === null ||
      valor === undefined
    ) {
      return null;
    }

    const texto =
      String(valor).trim();

    return texto === ""
      ? null
      : texto;
  }


  /**
   * Crea un resultado de validación.
   *
   * @param {boolean} valido
   * @param {Array<string>} errores
   * @returns {object}
   */
  crearResultado(
    valido,
    errores = []
  ) {
    return {
      valido,
      errores
    };
  }


  /* ==========================================================
     VALIDACIONES GENERALES
     ========================================================== */

  /**
   * Valida una clave de configuración.
   *
   * Formato esperado:
   *
   * direccion_institucional
   * telefonos_institucionales
   * correo_institucional
   * horario_atencion
   * facebook_url
   * google_maps_url
   *
   * @param {*} clave
   * @returns {object}
   */
  validarClave(clave) {

    const errores = [];

    const claveNormalizada =
      this.normalizarClave(clave);


    if (!claveNormalizada) {
      errores.push(
        "La clave de configuración es obligatoria."
      );

      return this.crearResultado(
        false,
        errores
      );
    }


    if (
      claveNormalizada.length > 120
    ) {
      errores.push(
        "La clave de configuración supera la longitud permitida."
      );
    }


    if (
      !/^[a-z0-9_]+$/.test(
        claveNormalizada
      )
    ) {
      errores.push(
        "La clave de configuración contiene caracteres no permitidos."
      );
    }


    return this.crearResultado(
      errores.length === 0,
      errores
    );
  }


  /**
   * Valida que el valor pueda ser procesado.
   *
   * Se permite null porque algunas configuraciones
   * pueden estar vacías.
   *
   * @param {*} valor
   * @returns {object}
   */
  validarValor(valor) {

    const errores = [];


    if (
      valor !== null &&
      valor !== undefined &&
      typeof valor === "object"
    ) {
      errores.push(
        "El valor de configuración debe ser texto o nulo."
      );
    }


    return this.crearResultado(
      errores.length === 0,
      errores
    );
  }


  /* ==========================================================
     VALIDACIONES ESPECÍFICAS
     ========================================================== */

  /**
   * Valida un correo electrónico.
   *
   * @param {string|null} correo
   * @returns {boolean}
   */
  esCorreoValido(correo) {

    if (!correo) {
      return true;
    }

    const expresion =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return expresion.test(
      correo
    );
  }


  /**
   * Valida una URL HTTP o HTTPS.
   *
   * @param {string|null} url
   * @returns {boolean}
   */
  esUrlValida(url) {

    if (!url) {
      return true;
    }

    try {

      const urlProcesada =
        new URL(url);

      return (
        urlProcesada.protocol === "http:" ||
        urlProcesada.protocol === "https:"
      );

    } catch {
      return false;
    }
  }


  /**
   * Aplica validaciones específicas según
   * la clave de configuración.
   *
   * @param {string} clave
   * @param {string|null} valor
   * @returns {Array<string>}
   */
  validarSegunClave(
    clave,
    valor
  ) {

    const errores = [];


    /* --------------------------------------------------------
       CORREO INSTITUCIONAL
       -------------------------------------------------------- */

    if (
      clave ===
      "correo_institucional"
    ) {
      if (
        valor &&
        !this.esCorreoValido(valor)
      ) {
        errores.push(
          "El correo institucional no tiene un formato válido."
        );
      }
    }


    /* --------------------------------------------------------
       FACEBOOK
       -------------------------------------------------------- */

    if (
      clave ===
      "facebook_url"
    ) {
      if (
        valor &&
        !this.esUrlValida(valor)
      ) {
        errores.push(
          "El enlace de Facebook no es una URL válida."
        );
      }
    }


    /* --------------------------------------------------------
       GOOGLE MAPS
       -------------------------------------------------------- */

    if (
      clave ===
      "google_maps_url"
    ) {
      if (
        valor &&
        !this.esUrlValida(valor)
      ) {
        errores.push(
          "El enlace de Google Maps no es una URL válida."
        );
      }
    }


    return errores;
  }


  /* ==========================================================
     VALIDACIÓN COMPLETA
     ========================================================== */

  /**
   * Valida una solicitud de actualización.
   *
   * Datos esperados:
   *
   * {
   *   clave: "...",
   *   valor: "..."
   * }
   *
   * @param {object} datos
   * @returns {object}
   */
  validarActualizacion(datos) {

    const errores = [];


    if (
      !datos ||
      typeof datos !== "object" ||
      Array.isArray(datos)
    ) {
      return this.crearResultado(
        false,
        [
          "Los datos de configuración no son válidos."
        ]
      );
    }


    /* --------------------------------------------------------
       CLAVE
       -------------------------------------------------------- */

    const resultadoClave =
      this.validarClave(
        datos.clave
      );

    errores.push(
      ...resultadoClave.errores
    );


    /* --------------------------------------------------------
       VALOR
       -------------------------------------------------------- */

    const resultadoValor =
      this.validarValor(
        datos.valor
      );

    errores.push(
      ...resultadoValor.errores
    );


    /*
     * Si la clave básica es inválida no ejecutamos
     * validaciones específicas.
     */
    if (
      resultadoClave.valido &&
      resultadoValor.valido
    ) {

      const clave =
        this.normalizarClave(
          datos.clave
        );

      const valor =
        this.normalizarValor(
          datos.valor
        );


      errores.push(
        ...this.validarSegunClave(
          clave,
          valor
        )
      );
    }


    return this.crearResultado(
      errores.length === 0,
      errores
    );
  }
}


/* ============================================================
   INSTANCIA
   ============================================================ */

const configuracionValidator =
  new ConfiguracionValidator();


/* ============================================================
   EXPORTACIÓN
   ============================================================ */

module.exports =
  configuracionValidator;