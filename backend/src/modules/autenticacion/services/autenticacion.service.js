const bcrypt = require("bcryptjs");

const SqlAutenticacionRepository = require(
  "../repositories/sql-autenticacion.repository"
);

const VerificacionAdministradorService = require(
  "./verificacion-administrador.service"
);

const AuditoriaService = require(
  "../../auditoria/services/auditoria.service"
);

const MAXIMO_INTENTOS_FALLIDOS = 5;
const VENTANA_INTENTOS_MINUTOS = 15;
const RONDAS_HASH_CONTRASENA = 12;

const TIPO_TOKEN_SESION = "SESION";

const MODULO_SEGURIDAD = "SEGURIDAD";

const ACCION_INICIAR_SESION =
  "INICIAR_SESION";

const ACCION_INICIO_SESION_FALLIDO =
  "INICIO_SESION_FALLIDO";

const ACCION_CAMBIAR_CONTRASENA =
  "CAMBIAR_CONTRASENA";

const ACCION_REVOCAR_SESION =
  "REVOCAR_SESION";

class AutenticacionService {
  /**
   * @param {object} repositorio
   * @param {object|null} servicioVerificacion
   * @param {Function|null} enviarCodigo
   * @param {object|null} auditoriaService
   */
  constructor(
    repositorio = new SqlAutenticacionRepository(),
    servicioVerificacion = null,
    enviarCodigo = null,
    auditoriaService = new AuditoriaService()
  ) {
    this.repositorio = repositorio;

    this.auditoriaService =
      auditoriaService;

    this.servicioVerificacion =
      servicioVerificacion ??
      new VerificacionAdministradorService(
        repositorio,
        auditoriaService
      );

    /*
     * Más adelante recibirá la función real
     * encargada de enviar correos.
     */
    this.enviarCodigo = enviarCodigo;
  }

  /**
   * Crea un error controlado.
   *
   * @param {string} mensaje
   * @param {number} statusCode
   * @param {string} codigo
   * @returns {Error}
   */
  crearError(mensaje, statusCode, codigo) {
    const error = new Error(mensaje);

    error.statusCode = statusCode;
    error.codigo = codigo;

    return error;
  }

  /**
   * Permite configurar posteriormente el servicio
   * encargado de enviar el código por correo.
   *
   * @param {Function} enviarCodigo
   */
  configurarEnvioCodigo(enviarCodigo) {
    if (typeof enviarCodigo !== "function") {
      throw this.crearError(
        "La función para enviar códigos no es válida.",
        500,
        "FUNCION_ENVIO_CODIGO_INVALIDA"
      );
    }

    this.enviarCodigo = enviarCodigo;
  }

  /**
   * Registra una acción de auditoría sin interrumpir
   * la operación principal.
   *
   * @param {object} datosAuditoria
   * @returns {Promise<object|null>}
   */
  async registrarAuditoriaSegura(
    datosAuditoria
  ) {
    if (
      !this.auditoriaService ||
      typeof this.auditoriaService
        .registrarAuditoriaSegura !== "function"
    ) {
      return null;
    }

    try {
      return await this.auditoriaService
        .registrarAuditoriaSegura(
          datosAuditoria
        );
    } catch (error) {
      console.error(
        "No se pudo registrar la auditoría de autenticación:",
        error.message
      );

      return null;
    }
  }

  /**
   * Devuelve únicamente datos seguros.
   *
   * @param {object} administrador
   * @returns {object}
   */
  obtenerAdministradorSeguro(administrador) {
    return {
      idAdministrador:
        Number(administrador.idAdministrador),

      nombreCompleto:
        administrador.nombreCompleto,

      correo:
        administrador.correo,

      idEstadoAdministrador:
        Number(
          administrador.idEstadoAdministrador
        ),

      nombreEstado:
        administrador.nombreEstado,

      correoVerificado:
        administrador.correoVerificado,

      requiereVerificacion:
        administrador.requiereVerificacion
    };
  }

  /**
   * Registra un intento fallido sin reemplazar
   * el error principal del inicio de sesión.
   *
   * @param {object} datos
   * @returns {Promise<void>}
   */
  async registrarIntentoFallido(datos) {
    try {
      await this.repositorio
        .registrarIntentoInicioSesion({
          idAdministrador:
            datos.idAdministrador ?? null,

          correoIngresado:
            datos.correoIngresado,

          exitoso: false,

          motivoResultado:
            datos.motivoResultado,

          direccionIp:
            datos.direccionIp ?? null,

          userAgent:
            datos.userAgent ?? null
        });
    } catch (error) {
      console.error(
        "No se pudo registrar el intento fallido:",
        error.message
      );
    }

    await this.registrarAuditoriaSegura({
      idAdministrador:
        datos.idAdministrador ?? null,

      codigoAccion:
        ACCION_INICIO_SESION_FALLIDO,

      codigoModulo:
        MODULO_SEGURIDAD,

      tablaAfectada:
        "administradores",

      idRegistroAfectado:
        datos.idAdministrador
          ? String(datos.idAdministrador)
          : null,

      datosAnteriores:
        null,

      datosNuevos: {
        resultado: "FALLIDO",
        motivo:
          datos.motivoResultado
      },

      descripcion:
        datos.motivoResultado,

      direccionIp:
        datos.direccionIp ?? null,

      userAgent:
        datos.userAgent ?? null
    });
  }

  /**
   * Valida correo y contraseña.
   *
   * Cuando la cuenta requiere verificación,
   * llama a VerificacionAdministradorService
   * para generar y enviar el código.
   *
   * @param {object} datosInicioSesion
   * @param {string} datosInicioSesion.correo
   * @param {string} datosInicioSesion.contrasena
   *
   * @param {object} contexto
   * @param {string|null} contexto.direccionIp
   * @param {string|null} contexto.userAgent
   *
   * @returns {Promise<object>}
   */
  async iniciarSesion(
    datosInicioSesion,
    contexto = {}
  ) {
    if (
      !datosInicioSesion ||
      typeof datosInicioSesion !== "object"
    ) {
      throw this.crearError(
        "Los datos de inicio de sesión no son válidos.",
        400,
        "DATOS_INICIO_SESION_INVALIDOS"
      );
    }

    const correo = String(
      datosInicioSesion.correo ?? ""
    )
      .trim()
      .toLowerCase();

    const contrasena =
      datosInicioSesion.contrasena;

    const direccionIp =
      contexto.direccionIp ?? null;

    const userAgent =
      contexto.userAgent ?? null;

    if (
      !correo ||
      typeof contrasena !== "string" ||
      contrasena.length === 0
    ) {
      throw this.crearError(
        "El correo y la contraseña son obligatorios.",
        400,
        "CREDENCIALES_INCOMPLETAS"
      );
    }

    /*
     * 1. Revisar intentos fallidos recientes.
     */
    const intentos =
      await this.repositorio
        .contarIntentosFallidosRecientes({
          correo,
          direccionIp,
          ventanaMinutos:
            VENTANA_INTENTOS_MINUTOS
        });

    const limitePorCorreo =
      intentos.fallidosPorCorreo >=
      MAXIMO_INTENTOS_FALLIDOS;

    const limitePorIp =
      Boolean(direccionIp) &&
      intentos.fallidosPorIp >=
        MAXIMO_INTENTOS_FALLIDOS;

    if (limitePorCorreo || limitePorIp) {
      await this.registrarIntentoFallido({
        idAdministrador: null,
        correoIngresado: correo,

        motivoResultado:
          "Inicio de sesión bloqueado temporalmente por exceso de intentos.",

        direccionIp,
        userAgent
      });

      throw this.crearError(
        "Se realizaron demasiados intentos. Intente nuevamente en 15 minutos.",
        429,
        "DEMASIADOS_INTENTOS"
      );
    }

    /*
     * 2. Buscar administrador.
     */
    const administrador =
      await this.repositorio
        .buscarAdministradorPorCorreo(correo);

    if (!administrador) {
      await this.registrarIntentoFallido({
        idAdministrador: null,
        correoIngresado: correo,

        motivoResultado:
          "Administrador no encontrado.",

        direccionIp,
        userAgent
      });

      throw this.crearError(
        "El correo o la contraseña son incorrectos.",
        401,
        "CREDENCIALES_INVALIDAS"
      );
    }

    /*
     * 3. Comparar contraseña mediante bcrypt.
     */
    const contrasenaCorrecta =
      await bcrypt.compare(
        contrasena,
        administrador.contrasenaHash
      );

    if (!contrasenaCorrecta) {
      await this.registrarIntentoFallido({
        idAdministrador:
          administrador.idAdministrador,

        correoIngresado: correo,

        motivoResultado:
          "Contraseña incorrecta.",

        direccionIp,
        userAgent
      });

      throw this.crearError(
        "El correo o la contraseña son incorrectos.",
        401,
        "CREDENCIALES_INVALIDAS"
      );
    }

    /*
     * 4. Validar el estado de la cuenta.
     */
    if (
      !administrador.estadoActivo ||
      !administrador.permiteAcceso
    ) {
      await this.registrarIntentoFallido({
        idAdministrador:
          administrador.idAdministrador,

        correoIngresado: correo,

        motivoResultado:
          `Acceso rechazado. Estado: ${administrador.nombreEstado}.`,

        direccionIp,
        userAgent
      });

      throw this.crearError(
        "La cuenta no está habilitada para ingresar al panel.",
        403,
        "CUENTA_SIN_ACCESO"
      );
    }

    /*
     * 5. Validar el correo.
     */
    if (!administrador.correoVerificado) {
      await this.registrarIntentoFallido({
        idAdministrador:
          administrador.idAdministrador,

        correoIngresado: correo,

        motivoResultado:
          "El correo del administrador no está verificado.",

        direccionIp,
        userAgent
      });

      throw this.crearError(
        "El correo de la cuenta todavía no está verificado.",
        403,
        "CORREO_NO_VERIFICADO"
      );
    }

    /*
     * 6. Iniciar la verificación de dos pasos.
     *
     * Aquí se genera el código, se guarda su hash,
     * se crea el token temporal y se envía el correo.
     */
    if (administrador.requiereVerificacion) {
      return this.servicioVerificacion
        .iniciarVerificacion(
          administrador,
          {
            direccionIp,
            userAgent
          },
          this.enviarCodigo
        );
    }

    const sesionCreada =
      await this.servicioVerificacion
        .crearSesionAdministrador(
          administrador,
          {
            direccionIp,
            userAgent
          }
        );

    /*
     * Flujo temporal del administrador inicial.
     *
     * Actualmente requiere_verificacion está en 0
     * para evitar bloquear el acceso antes de
     * configurar el envío real de correos.
     */
    await this.repositorio
      .registrarIntentoInicioSesion({
        idAdministrador:
          administrador.idAdministrador,

        correoIngresado: correo,
        exitoso: true,

        motivoResultado:
          "Credenciales verificadas sin segundo factor temporalmente.",

        direccionIp,
        userAgent
      });

    await this.repositorio
      .actualizarUltimoAcceso(
        administrador.idAdministrador
      );

    await this.registrarAuditoriaSegura({
      idAdministrador:
        administrador.idAdministrador,

      codigoAccion:
        ACCION_INICIAR_SESION,

      codigoModulo:
        MODULO_SEGURIDAD,

      tablaAfectada:
        "administradores",

      idRegistroAfectado:
        String(
          administrador.idAdministrador
        ),

      datosAnteriores:
        null,

      datosNuevos: {
        resultado: "EXITOSO",
        requiereVerificacion: false
      },

      descripcion:
        "Inicio de sesión realizado correctamente sin segundo factor.",

      direccionIp,
      userAgent
    });

    return {
      autenticado: true,
      requiereVerificacion: false,
      estado:
        "CREDENCIALES_VALIDAS_TEMPORALMENTE",

      mensaje:
        "Las credenciales fueron verificadas correctamente.",

      tokenSesion:
        sesionCreada.tokenSesion,

      fechaExpiracion:
        sesionCreada.fechaExpiracion,

      administrador:
        this.obtenerAdministradorSeguro(
          administrador
        )
    };
  }

  /**
   * Cambia la contraseña de un administrador autenticado.
   *
   * Flujo:
   * 1. Busca al administrador.
   * 2. Comprueba la contraseña actual con bcrypt.
   * 3. Verifica que la contraseña nueva sea diferente.
   * 4. Genera el nuevo hash.
   * 5. Actualiza la contraseña mediante el repositorio.
   * 6. El procedimiento revoca todas las sesiones activas.
   *
   * @param {object} sesionAdministrador
   * @param {number} sesionAdministrador.idAdministrador
   * @param {string} sesionAdministrador.correo
   *
   * @param {object} datosCambio
   * @param {string} datosCambio.contrasenaActual
   * @param {string} datosCambio.contrasenaNueva
   *
   * @param {object} contexto
   * @param {string|null} contexto.direccionIp
   * @param {string|null} contexto.userAgent
   *
   * @returns {Promise<object>}
   */
  async cambiarContrasena(
    sesionAdministrador,
    datosCambio,
    contexto = {}
  ) {
    if (
      !sesionAdministrador ||
      !Number.isInteger(
        Number(
          sesionAdministrador.idAdministrador
        )
      ) ||
      Number(
        sesionAdministrador.idAdministrador
      ) <= 0
    ) {
      throw this.crearError(
        "No existe una sesión administrativa válida.",
        401,
        "SESION_INVALIDA"
      );
    }

    if (
      typeof sesionAdministrador.correo !==
        "string" ||
      sesionAdministrador.correo.trim() === ""
    ) {
      throw this.crearError(
        "La sesión no contiene un correo válido.",
        401,
        "SESION_INVALIDA"
      );
    }

    if (
      !datosCambio ||
      typeof datosCambio !== "object"
    ) {
      throw this.crearError(
        "Los datos para cambiar la contraseña no son válidos.",
        400,
        "DATOS_CAMBIO_CONTRASENA_INVALIDOS"
      );
    }

    const idAdministrador = Number(
      sesionAdministrador.idAdministrador
    );

    const correo =
      sesionAdministrador.correo
        .trim()
        .toLowerCase();

    const contrasenaActual =
      datosCambio.contrasenaActual;

    const contrasenaNueva =
      datosCambio.contrasenaNueva;

    const direccionIp =
      contexto.direccionIp ?? null;

    const userAgent =
      contexto.userAgent ?? null;

    /*
     * Buscar nuevamente al administrador para
     * obtener el hash actual de la contraseña.
     */
    const administrador =
      await this.repositorio
        .buscarAdministradorPorCorreo(correo);

    if (
      !administrador ||
      Number(administrador.idAdministrador) !==
        idAdministrador
    ) {
      throw this.crearError(
        "No fue posible identificar al administrador.",
        401,
        "ADMINISTRADOR_NO_ENCONTRADO"
      );
    }

    /*
     * Comprobar que la contraseña actual sea correcta.
     */
    const contrasenaActualCorrecta =
      await bcrypt.compare(
        contrasenaActual,
        administrador.contrasenaHash
      );

    if (!contrasenaActualCorrecta) {
      await this.registrarAuditoriaSegura({
        idAdministrador,

        codigoAccion:
          ACCION_CAMBIAR_CONTRASENA,

        codigoModulo:
          MODULO_SEGURIDAD,

        tablaAfectada:
          "administradores",

        idRegistroAfectado:
          String(idAdministrador),

        datosAnteriores:
          null,

        datosNuevos: {
          resultado: "FALLIDO",
          motivo:
            "La contraseña actual es incorrecta."
        },

        descripcion:
          "Intento fallido de cambio de contraseña.",

        direccionIp,
        userAgent
      });

      throw this.crearError(
        "La contraseña actual es incorrecta.",
        401,
        "CONTRASENA_ACTUAL_INCORRECTA"
      );
    }

    /*
     * Evitar reutilizar la contraseña actual.
     */
    const nuevaCoincideConActual =
      await bcrypt.compare(
        contrasenaNueva,
        administrador.contrasenaHash
      );

    if (nuevaCoincideConActual) {
      await this.registrarAuditoriaSegura({
        idAdministrador,

        codigoAccion:
          ACCION_CAMBIAR_CONTRASENA,

        codigoModulo:
          MODULO_SEGURIDAD,

        tablaAfectada:
          "administradores",

        idRegistroAfectado:
          String(idAdministrador),

        datosAnteriores:
          null,

        datosNuevos: {
          resultado: "FALLIDO",
          motivo:
            "La contraseña nueva coincide con la contraseña actual."
        },

        descripcion:
          "Intento rechazado de reutilización de contraseña.",

        direccionIp,
        userAgent
      });

      throw this.crearError(
        "La contraseña nueva debe ser diferente de la contraseña actual.",
        400,
        "CONTRASENA_NUEVA_IGUAL_ACTUAL"
      );
    }

    /*
     * Generar el nuevo hash.
     * La contraseña real nunca se envía a SQL Server.
     */
    const contrasenaHashNueva =
      await bcrypt.hash(
        contrasenaNueva,
        RONDAS_HASH_CONTRASENA
      );

    const resultado =
      await this.repositorio
        .actualizarContrasenaAdministrador(
          idAdministrador,
          contrasenaHashNueva
        );

    await this.registrarAuditoriaSegura({
      idAdministrador,

      codigoAccion:
        ACCION_CAMBIAR_CONTRASENA,

      codigoModulo:
        MODULO_SEGURIDAD,

      tablaAfectada:
        "administradores",

      idRegistroAfectado:
        String(idAdministrador),

      datosAnteriores: {
        sesionesActivas: true
      },

      datosNuevos: {
        resultado: "EXITOSO",

        sesionesRevocadas:
          resultado.tokensRevocados,

        codigosInvalidados:
          resultado.codigosInvalidados
      },

      descripcion:
        "La contraseña administrativa fue actualizada correctamente.",

      direccionIp,
      userAgent
    });

    return {
      contrasenaActualizada: true,

      mensaje:
        "La contraseña fue actualizada correctamente. Debe iniciar sesión nuevamente.",

      idAdministrador:
        resultado.idAdministrador,

      fechaActualizacion:
        resultado.fechaActualizacion,

      sesionesRevocadas:
        resultado.tokensRevocados,

      codigosInvalidados:
        resultado.codigosInvalidados
    };
  }

  /**
   * Cierra una sesión administrativa.
   *
   * Flujo:
   * 1. Valida los datos de la sesión.
   * 2. Revoca el token mediante el repositorio.
   * 3. Registra la auditoría del cierre.
   *
   * La eliminación de la cookie continúa siendo
   * responsabilidad del controlador porque pertenece
   * a la capa HTTP.
   *
   * @param {object} sesionAdministrador
   * @param {number} sesionAdministrador.idAdministrador
   * @param {number} sesionAdministrador.idTokenAdministrador
   * @param {string} sesionAdministrador.tokenHash
   *
   * @param {object} contexto
   * @param {string|null} contexto.direccionIp
   * @param {string|null} contexto.userAgent
   *
   * @returns {Promise<object>}
   */
  async cerrarSesion(
    sesionAdministrador,
    contexto = {}
  ) {
    const direccionIp =
      contexto.direccionIp ?? null;

    const userAgent =
      contexto.userAgent ?? null;

    const idAdministradorRecibido =
      Number(
        sesionAdministrador?.idAdministrador
      );

    const idAdministrador =
      Number.isInteger(
        idAdministradorRecibido
      ) &&
      idAdministradorRecibido > 0
        ? idAdministradorRecibido
        : null;

    const idTokenRecibido =
      Number(
        sesionAdministrador
          ?.idTokenAdministrador
      );

    const idTokenAdministrador =
      Number.isInteger(idTokenRecibido) &&
      idTokenRecibido > 0
        ? idTokenRecibido
        : null;

    const tokenHash =
      typeof sesionAdministrador?.tokenHash ===
        "string"
        ? sesionAdministrador.tokenHash.trim()
        : "";

    if (!tokenHash) {
      await this.registrarAuditoriaSegura({
        idAdministrador,

        codigoAccion:
          ACCION_REVOCAR_SESION,

        codigoModulo:
          MODULO_SEGURIDAD,

        tablaAfectada:
          "tokens_administrador",

        idRegistroAfectado:
          idTokenAdministrador
            ? String(idTokenAdministrador)
            : null,

        datosAnteriores:
          null,

        datosNuevos: {
          resultado: "FALLIDO",
          motivo:
            "La sesión no contiene un token válido."
        },

        descripcion:
          "No fue posible cerrar la sesión administrativa.",

        direccionIp,
        userAgent
      });

      throw this.crearError(
        "No existe una sesión administrativa válida.",
        401,
        "SESION_REQUERIDA"
      );
    }

    try {
      const resultadoRevocacion =
        await this.repositorio
          .revocarTokenAdministrador(
            TIPO_TOKEN_SESION,
            tokenHash
          );

      const idAdministradorAuditoria =
        idAdministrador ??
        resultadoRevocacion
          .idAdministrador ??
        null;

      const idTokenAuditoria =
        idTokenAdministrador ??
        resultadoRevocacion
          .idTokenAdministrador ??
        null;

      await this.registrarAuditoriaSegura({
        idAdministrador:
          idAdministradorAuditoria,

        codigoAccion:
          ACCION_REVOCAR_SESION,

        codigoModulo:
          MODULO_SEGURIDAD,

        tablaAfectada:
          "tokens_administrador",

        idRegistroAfectado:
          idTokenAuditoria
            ? String(idTokenAuditoria)
            : null,

        datosAnteriores: {
          revocado: false
        },

        datosNuevos: {
          revocado:
            Boolean(
              resultadoRevocacion.revocado
            ),

          resultado:
            resultadoRevocacion.revocado
              ? "EXITOSO"
              : "SIN_CAMBIOS"
        },

        descripcion:
          "La sesión administrativa fue cerrada y su token fue revocado.",

        direccionIp,
        userAgent
      });

      return {
        sesionCerrada: true,

        mensaje:
          "La sesión se cerró correctamente.",

        revocado:
          Boolean(
            resultadoRevocacion.revocado
          ),

        idTokenAdministrador:
          resultadoRevocacion
            .idTokenAdministrador,

        idAdministrador:
          resultadoRevocacion
            .idAdministrador,

        fechaRevocacion:
          resultadoRevocacion
            .fechaRevocacion
      };
    } catch (error) {
      await this.registrarAuditoriaSegura({
        idAdministrador,

        codigoAccion:
          ACCION_REVOCAR_SESION,

        codigoModulo:
          MODULO_SEGURIDAD,

        tablaAfectada:
          "tokens_administrador",

        idRegistroAfectado:
          idTokenAdministrador
            ? String(idTokenAdministrador)
            : null,

        datosAnteriores:
          null,

        datosNuevos: {
          resultado: "FALLIDO",
          motivo: error.message
        },

        descripcion:
          "No fue posible revocar correctamente la sesión administrativa.",

        direccionIp,
        userAgent
      });

      throw error;
    }
  }
}

module.exports = AutenticacionService;
