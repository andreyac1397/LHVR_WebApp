/* ============================================================
   CONFIGURACION.SERVICE.JS
   Liceo Hernán Vargas Ramírez
   ------------------------------------------------------------
   Servicio para administrar la configuración general del sitio.

   Responsabilidades:
   - Obtener configuración pública.
   - Obtener configuración para administración.
   - Actualizar configuraciones existentes.
   - Normalizar y validar los datos antes de enviarlos
     al repositorio.

   Los datos de configuración permiten centralizar información
   utilizada en distintas partes del sitio, por ejemplo:

   - Contacto
   - Nosotros
   - Footer
   ============================================================ */

const SqlConfiguracionRepository = require(
  "../repositories/sql-configuracion.repository"
);


/*
 * ============================================================
 * SERVICIO
 * ============================================================
 */

class ConfiguracionService {

  /**
   * @param {object} repositorio
   */
  constructor(
    repositorio =
      new SqlConfiguracionRepository()
  ) {
    this.repositorio = repositorio;
  }


  /*
   * ==========================================================
   * ERRORES
   * ==========================================================
   */

  /**
   * Crea un error controlado para que el middleware
   * global pueda devolver correctamente la respuesta HTTP.
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
    const error =
      new Error(mensaje);

    error.statusCode =
      statusCode;

    error.codigo =
      codigo;

    return error;
  }


  /*
   * ==========================================================
   * NORMALIZACIÓN
   * ==========================================================
   */

  /**
   * Normaliza una clave de configuración.
   *
   * Las claves de configuracion_sitio utilizan formato:
   *
   * direccion_institucional
   * telefonos_institucionales
   * correo_institucional
   * horario_atencion
   * facebook_url
   * google_maps_url
   *
   * @param {*} valor
   * @returns {string}
   */
  normalizarClave(valor) {
    return String(
      valor ?? ""
    )
      .trim()
      .toLowerCase();
  }


  /**
   * Normaliza el valor que será almacenado.
   *
   * Se permite null porque algunas configuraciones,
   * como Facebook, pueden no estar definidas todavía.
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
   * Valida el identificador del administrador.
   *
   * Puede ser null para operaciones que legítimamente
   * no tengan administrador asociado.
   *
   * @param {*} valor
   * @returns {number|null}
   */
  normalizarIdAdministrador(
    valor
  ) {
    if (
      valor === null ||
      valor === undefined ||
      valor === ""
    ) {
      return null;
    }

    const idAdministrador =
      Number(valor);

    if (
      !Number.isInteger(
        idAdministrador
      ) ||
      idAdministrador <= 0
    ) {
      throw this.crearError(
        "El administrador indicado no es válido.",
        400,
        "ADMINISTRADOR_INVALIDO"
      );
    }

    return idAdministrador;
  }


  /*
   * ==========================================================
   * CONSULTAS
   * ==========================================================
   */

  /**
   * Obtiene únicamente la configuración marcada como pública.
   *
   * Esta información puede utilizarse sin autenticación
   * en el frontend público.
   *
   * @returns {Promise<Array>}
   */
  async obtenerConfiguracionPublica() {
    const configuraciones =
      await this.repositorio
        .obtenerConfiguracionPublica();

    return Array.isArray(
      configuraciones
    )
      ? configuraciones
      : [];
  }


  /**
   * Obtiene todas las configuraciones para el panel
   * administrativo.
   *
   * @returns {Promise<Array>}
   */
  async obtenerConfiguracionAdministracion() {
    const configuraciones =
      await this.repositorio
        .obtenerConfiguracionAdministracion();

    return Array.isArray(
      configuraciones
    )
      ? configuraciones
      : [];
  }


  /*
   * ==========================================================
   * ACTUALIZACIÓN
   * ==========================================================
   */

  /**
   * Actualiza una configuración existente.
   *
   * No permite crear configuraciones nuevas desde la API.
   * Las claves válidas deben existir previamente en
   * dbo.configuracion_sitio.
   *
   * @param {object} datos
   * @param {number|null} idAdministrador
   *
   * @returns {Promise<object>}
   */
  async guardarConfiguracion(
    datos,
    idAdministrador = null
  ) {
    if (
      !datos ||
      typeof datos !== "object" ||
      Array.isArray(datos)
    ) {
      throw this.crearError(
        "Los datos de configuración no son válidos.",
        400,
        "DATOS_CONFIGURACION_INVALIDOS"
      );
    }


    const clave =
      this.normalizarClave(
        datos.clave
      );

    if (!clave) {
      throw this.crearError(
        "La clave de configuración es obligatoria.",
        400,
        "CLAVE_CONFIGURACION_OBLIGATORIA"
      );
    }


    if (
      clave.length > 120
    ) {
      throw this.crearError(
        "La clave de configuración supera la longitud permitida.",
        400,
        "CLAVE_CONFIGURACION_INVALIDA"
      );
    }


    /*
     * Se permite únicamente:
     *
     * letras minúsculas
     * números
     * guion bajo
     *
     * Esto evita recibir claves con caracteres inesperados.
     */
    if (
      !/^[a-z0-9_]+$/.test(
        clave
      )
    ) {
      throw this.crearError(
        "La clave de configuración contiene caracteres no permitidos.",
        400,
        "CLAVE_CONFIGURACION_INVALIDA"
      );
    }


    const valor =
      this.normalizarValor(
        datos.valor
      );


    const administrador =
      this.normalizarIdAdministrador(
        idAdministrador
      );


    const configuracionGuardada =
      await this.repositorio
        .guardarConfiguracion(
          clave,
          valor,
          administrador
        );


    if (
      !configuracionGuardada
    ) {
      throw this.crearError(
        "No fue posible guardar la configuración.",
        500,
        "CONFIGURACION_NO_GUARDADA"
      );
    }


    return configuracionGuardada;
  }


  /*
   * ==========================================================
   * UTILIDAD PARA FRONTEND
   * ==========================================================
   */

  /**
   * Convierte una lista de configuraciones en un objeto
   * indexado por clave.
   *
   * Ejemplo:
   *
   * {
   *   direccion_institucional: "...",
   *   telefonos_institucionales: "...",
   *   correo_institucional: "...",
   *   horario_atencion: "...",
   *   facebook_url: "...",
   *   google_maps_url: "..."
   * }
   *
   * @param {Array} configuraciones
   * @returns {object}
   */
  convertirAObjeto(
    configuraciones
  ) {
    if (
      !Array.isArray(
        configuraciones
      )
    ) {
      return {};
    }

    return configuraciones.reduce(
      (
        resultado,
        configuracion
      ) => {
        const clave =
          this.normalizarClave(
            configuracion?.clave
          );

        if (!clave) {
          return resultado;
        }

        resultado[clave] =
          configuracion?.valor ??
          null;

        return resultado;
      },
      {}
    );
  }
}


module.exports =
  ConfiguracionService;