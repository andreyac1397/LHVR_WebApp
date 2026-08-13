const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const SqlAutenticacionRepository = require(
  "../repositories/sql-autenticacion.repository"
);

const AuditoriaService = require(
  "../../auditoria/services/auditoria.service"
);

const TIPO_CODIGO_RECUPERACION =
  "RECUPERAR_CONTRASENA";

const TIPO_TOKEN_RECUPERACION =
  "RECUPERACION_CONTRASENA";

const TIPO_TOKEN_RESTABLECIMIENTO =
  "RESTABLECER_CONTRASENA";

const MINUTOS_CODIGO_RECUPERACION = 10;
const MINUTOS_TOKEN_RECUPERACION = 10;
const MINUTOS_TOKEN_RESTABLECIMIENTO = 15;

const MAXIMO_INTENTOS_CODIGO = 5;

const RONDAS_HASH_CODIGO = 10;
const RONDAS_HASH_CONTRASENA = 12;

const LONGITUD_MINIMA_CONTRASENA = 12;
const LONGITUD_MAXIMA_CONTRASENA = 128;

const VENTANA_SOLICITUDES_MINUTOS = 15;
const SEGUNDOS_ENTRE_SOLICITUDES = 60;

const MAXIMO_SOLICITUDES_POR_CORREO = 3;
const MAXIMO_SOLICITUDES_POR_IP = 10;

const MODULO_SEGURIDAD = "SEGURIDAD";

const ACCION_SOLICITAR_RECUPERACION =
  "SOLICITAR_RECUPERACION";

const ACCION_VERIFICAR_CODIGO =
  "VERIFICAR_CODIGO";

const ACCION_CODIGO_VERIFICACION_FALLIDO =
  "CODIGO_VERIFICACION_FALLIDO";

const ACCION_RECUPERAR_CONTRASENA =
  "RECUPERAR_CONTRASENA";

class RecuperacionContrasenaService {
  /**
   * @param {object} repositorio
   * @param {Function|null} enviarCodigo
   * @param {object|null} auditoriaService
   */
  constructor(
    repositorio = new SqlAutenticacionRepository(),
    enviarCodigo = null,
    auditoriaService = new AuditoriaService()
  ) {
    this.repositorio = repositorio;
    this.enviarCodigo = enviarCodigo;
    this.auditoriaService = auditoriaService;
  }

  /**
   * Crea un error controlado.
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
        "No se pudo registrar la auditoría de recuperación:",
        error.message
      );

      return null;
    }
  }

  /**
   * Genera el hash SHA-256 del correo normalizado.
   *
   * El correo real no se almacena dentro
   * de la auditoría utilizada para los límites.
   *
   * @param {string} correo
   * @returns {string}
   */
  generarHashCorreo(correo) {
    return crypto
      .createHash("sha256")
      .update(correo)
      .digest("hex");
  }

  /**
   * Registra una solicitud de recuperación
   * dentro de la auditoría.
   *
   * @param {object} datos
   * @returns {Promise<object|null>}
   */
  async registrarSolicitudRecuperacion(
    datos
  ) {
    return this.registrarAuditoriaSegura({
      idAdministrador:
        datos.idAdministrador ?? null,

      codigoAccion:
        ACCION_SOLICITAR_RECUPERACION,

      codigoModulo:
        MODULO_SEGURIDAD,

      tablaAfectada:
        "administradores",

      idRegistroAfectado:
        datos.correoHash,

      datosAnteriores:
        null,

      datosNuevos: {
        resultado:
          datos.resultado,

        motivo:
          datos.motivo ?? null,

        cuentaDisponible:
          datos.cuentaDisponible ?? null,

        segundosRestantes:
          datos.segundosRestantes ?? 0,

        solicitudesPorCorreo:
          datos.solicitudesPorCorreo ?? 0,

        solicitudesPorIp:
          datos.solicitudesPorIp ?? 0
      },

      descripcion:
        datos.descripcion,

      direccionIp:
        datos.direccionIp ?? null,

      userAgent:
        datos.userAgent ?? null
    });
  }

  /**
   * Registra un intento fallido de verificación
   * del código de recuperación.
   *
   * @param {object} datos
   * @returns {Promise<object|null>}
   */
  async registrarCodigoRecuperacionFallido(
    datos
  ) {
    return this.registrarAuditoriaSegura({
      idAdministrador:
        datos.idAdministrador ?? null,

      codigoAccion:
        ACCION_CODIGO_VERIFICACION_FALLIDO,

      codigoModulo:
        MODULO_SEGURIDAD,

      tablaAfectada:
        "codigos_verificacion_admin",

      idRegistroAfectado:
        datos.idCodigoVerificacionAdmin
          ? String(
              datos.idCodigoVerificacionAdmin
            )
          : null,

      datosAnteriores:
        null,

      datosNuevos: {
        resultado: "FALLIDO",
        tipoCodigo:
          TIPO_CODIGO_RECUPERACION,

        motivo:
          datos.motivo,

        cantidadIntentos:
          datos.cantidadIntentos ?? null,

        maximoIntentos:
          datos.maximoIntentos ?? null
      },

      descripcion:
        datos.motivo,

      direccionIp:
        datos.direccionIp ?? null,

      userAgent:
        datos.userAgent ?? null
    });
  }

  /**
   * Configura la función encargada
   * de enviar el código por correo.
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
   * Normaliza un correo electrónico.
   *
   * @param {*} correo
   * @returns {string}
   */
  normalizarCorreo(correo) {
    return String(correo || "")
      .trim()
      .toLowerCase();
  }

  /**
   * Comprueba el formato básico del correo.
   *
   * @param {string} correo
   * @returns {boolean}
   */
  correoTieneFormatoValido(correo) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      correo
    );
  }

  /**
   * Oculta parcialmente un correo.
   *
   * @param {string} correo
   * @returns {string}
   */
  ocultarCorreo(correo) {
    const partes = String(correo).split("@");

    if (partes.length !== 2) {
      return "correo registrado";
    }

    const usuario = partes[0];
    const dominio = partes[1];

    const caracteresVisibles =
      usuario.length >= 2
        ? usuario.slice(0, 2)
        : usuario.slice(0, 1);

    const ocultos = "*".repeat(
      Math.max(
        usuario.length -
          caracteresVisibles.length,
        5
      )
    );

    return `${caracteresVisibles}${ocultos}@${dominio}`;
  }

  /**
   * Genera un código numérico de seis dígitos.
   *
   * @returns {string}
   */
  generarCodigo() {
    return crypto
      .randomInt(100000, 1000000)
      .toString();
  }

  /**
   * Genera un token aleatorio.
   *
   * @returns {string}
   */
  generarToken() {
    return crypto
      .randomBytes(48)
      .toString("hex");
  }

  /**
   * Genera el hash SHA-256 de un token.
   *
   * @param {string} token
   * @returns {string}
   */
  generarHashToken(token) {
    return crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");
  }

  /**
   * Comprueba si la cuenta puede utilizar
   * la recuperación de contraseña.
   *
   * @param {object|null} administrador
   * @returns {boolean}
   */
  cuentaDisponible(administrador) {
    return Boolean(
      administrador &&
      administrador.estadoActivo &&
      administrador.permiteAcceso &&
      administrador.correoVerificado
    );
  }

  /**
   * Devuelve la misma respuesta general sin revelar
   * si el correo está registrado.
   *
   * @param {string} correo
   * @param {string} tokenRecuperacion
   * @param {string|null} fechaExpiracion
   * @returns {object}
   */
  crearRespuestaSolicitud(
    correo,
    tokenRecuperacion,
    fechaExpiracion = null
  ) {
    return {
      solicitudAceptada: true,

      mensaje:
        "Si el correo pertenece a una cuenta habilitada, recibirá un código de recuperación.",

      tokenRecuperacion,

      correoDestino:
        this.ocultarCorreo(correo),

      fechaExpiracion,

      minutosVigencia:
        MINUTOS_CODIGO_RECUPERACION
    };
  }

  /**
   * Envía el código de recuperación.
   *
   * Se incluyen varios nombres equivalentes para facilitar
   * la conexión con correo.service.js.
   *
   * @param {object} administrador
   * @param {string} codigo
   */
  async enviarCodigoRecuperacion(
    administrador,
    codigo
  ) {
    if (
      typeof this.enviarCodigo !==
      "function"
    ) {
      throw this.crearError(
        "El servicio de correo no está configurado.",
        500,
        "SERVICIO_CORREO_NO_CONFIGURADO"
      );
    }

    await this.enviarCodigo({
      correo:
        administrador.correo,

      correoDestino:
        administrador.correo,

      destinatario:
        administrador.correo,

      nombre:
        administrador.nombreCompleto,

      nombreCompleto:
        administrador.nombreCompleto,

      nombreAdministrador:
        administrador.nombreCompleto,

      codigo,

      minutosVigencia:
        MINUTOS_CODIGO_RECUPERACION,

      tipoCodigo:
        TIPO_CODIGO_RECUPERACION,

      motivo:
        "recuperacion-contrasena",

      asunto:
        "Código para recuperar su contraseña"
    });
  }

  /**
   * Solicita el código de recuperación.
   *
   * Flujo:
   * 1. Busca el administrador.
   * 2. Genera un código de seis dígitos.
   * 3. Guarda únicamente el hash del código.
   * 4. Crea un token temporal.
   * 5. Envía el código por correo.
   *
   * @param {object} datos
   * @param {string} datos.correo
   *
   * @param {object} contexto
   * @param {string|null} contexto.direccionIp
   * @param {string|null} contexto.userAgent
   *
   * @returns {Promise<object>}
   */
  async solicitarRecuperacion(
    datos,
    contexto = {}
  ) {
    if (
      !datos ||
      typeof datos !== "object"
    ) {
      throw this.crearError(
        "Los datos de recuperación no son válidos.",
        400,
        "DATOS_RECUPERACION_INVALIDOS"
      );
    }

    const correo =
      this.normalizarCorreo(
        datos.correo
      );

    if (!correo) {
      throw this.crearError(
        "El correo es obligatorio.",
        400,
        "CORREO_OBLIGATORIO"
      );
    }

    if (
      correo.length > 254 ||
      !this.correoTieneFormatoValido(correo)
    ) {
      throw this.crearError(
        "El correo no tiene un formato válido.",
        400,
        "CORREO_FORMATO_INVALIDO"
      );
    }

    const direccionIp =
      contexto.direccionIp ?? null;

    const userAgent =
      contexto.userAgent ?? null;

    const correoHash =
      this.generarHashCorreo(correo);

    /*
     * Consultar los límites antes de buscar la cuenta.
     *
     * De esta forma las mismas reglas se aplican
     * tanto a correos existentes como inexistentes.
     */
    const limites =
      await this.repositorio
        .consultarLimitesRecuperacion({
          correoHash,
          direccionIp,

          ventanaMinutos:
            VENTANA_SOLICITUDES_MINUTOS,

          segundosEspera:
            SEGUNDOS_ENTRE_SOLICITUDES
        });

    const esperaPendiente =
      Number(
        limites.segundosRestantesEspera
      ) > 0;

    const limitePorCorreo =
      Number(
        limites.solicitudesPorCorreo
      ) >=
      MAXIMO_SOLICITUDES_POR_CORREO;

    const limitePorIp =
      Boolean(direccionIp) &&
      Number(
        limites.solicitudesPorIp
      ) >=
        MAXIMO_SOLICITUDES_POR_IP;

    if (
      esperaPendiente ||
      limitePorCorreo ||
      limitePorIp
    ) {
      let motivo =
        "Solicitud bloqueada temporalmente.";

      let codigoError =
        "LIMITE_SOLICITUDES_RECUPERACION";

      let mensajeError =
        "Se realizaron demasiadas solicitudes. Intente nuevamente más tarde.";

      if (esperaPendiente) {
        motivo =
          "No ha transcurrido el tiempo mínimo entre solicitudes.";

        codigoError =
          "ESPERA_SOLICITUD_RECUPERACION";

        mensajeError =
          `Espere ${Number(
            limites.segundosRestantesEspera
          )} segundos antes de solicitar otro código.`;
      } else if (limitePorCorreo) {
        motivo =
          "Se alcanzó el máximo de solicitudes permitidas para el correo.";

        codigoError =
          "LIMITE_RECUPERACION_CORREO";
      } else if (limitePorIp) {
        motivo =
          "Se alcanzó el máximo de solicitudes permitidas para la dirección IP.";

        codigoError =
          "LIMITE_RECUPERACION_IP";
      }

      await this.registrarSolicitudRecuperacion({
        idAdministrador: null,
        correoHash,
        resultado: "BLOQUEADA",
        motivo,
        cuentaDisponible: null,

        segundosRestantes:
          Number(
            limites.segundosRestantesEspera
          ) || 0,

        solicitudesPorCorreo:
          Number(
            limites.solicitudesPorCorreo
          ) || 0,

        solicitudesPorIp:
          Number(
            limites.solicitudesPorIp
          ) || 0,

        descripcion:
          "La solicitud de recuperación fue bloqueada por los límites de seguridad.",

        direccionIp,
        userAgent
      });

      throw this.crearError(
        mensajeError,
        429,
        codigoError
      );
    }

    /*
     * El token se genera incluso si el correo no existe.
     * De esta forma la respuesta mantiene la misma estructura
     * y no revela qué correos están registrados.
     */
    const tokenRecuperacion =
      this.generarToken();

    const tokenHash =
      this.generarHashToken(
        tokenRecuperacion
      );

    const administrador =
      await this.repositorio
        .buscarAdministradorPorCorreo(
          correo
        );

    const cuentaHabilitada =
      this.cuentaDisponible(
        administrador
      );

    /*
     * Toda solicitud permitida se registra antes
     * de devolver la respuesta o enviar el correo.
     *
     * El hash permite aplicar límites sin guardar
     * directamente el correo dentro de la auditoría.
     */
    await this.registrarSolicitudRecuperacion({
      idAdministrador:
        cuentaHabilitada
          ? administrador.idAdministrador
          : null,

      correoHash,
      resultado: "PERMITIDA",

      motivo:
        cuentaHabilitada
          ? "Cuenta habilitada para recuperación."
          : "La cuenta no existe o no está habilitada.",

      cuentaDisponible:
        cuentaHabilitada,

      segundosRestantes: 0,

      solicitudesPorCorreo:
        Number(
          limites.solicitudesPorCorreo
        ) || 0,

      solicitudesPorIp:
        Number(
          limites.solicitudesPorIp
        ) || 0,

      descripcion:
        "Se recibió una solicitud de recuperación de contraseña.",

      direccionIp,
      userAgent
    });

    /*
     * Respuesta general para cuentas inexistentes,
     * inactivas, bloqueadas o sin correo verificado.
     */
    if (!cuentaHabilitada) {
      return this.crearRespuestaSolicitud(
        correo,
        tokenRecuperacion
      );
    }

    const codigo =
      this.generarCodigo();

    const codigoHash =
      await bcrypt.hash(
        codigo,
        RONDAS_HASH_CODIGO
      );

    const codigoCreado =
      await this.repositorio
        .crearCodigoVerificacion({
          idAdministrador:
            administrador.idAdministrador,

          tipoCodigo:
            TIPO_CODIGO_RECUPERACION,

          codigoHash,

          minutosVigencia:
            MINUTOS_CODIGO_RECUPERACION,

          maximoIntentos:
            MAXIMO_INTENTOS_CODIGO,

          direccionIp
        });

    const tokenCreado =
      await this.repositorio
        .crearTokenAdministrador({
          idAdministrador:
            administrador.idAdministrador,

          tipoToken:
            TIPO_TOKEN_RECUPERACION,

          tokenHash,

          minutosVigencia:
            MINUTOS_TOKEN_RECUPERACION,

          direccionIp,
          userAgent
        });

    try {
      await this.enviarCodigoRecuperacion(
        administrador,
        codigo
      );
    } catch (error) {
      /*
       * Si el correo no pudo enviarse, se invalida
       * el código y se revoca el token temporal.
       */
      try {
        await this.repositorio
          .marcarCodigoVerificacionUsado(
            codigoCreado
              .idCodigoVerificacionAdmin
          );
      } catch (errorCodigo) {
        console.error(
          "No se pudo invalidar el código de recuperación:",
          errorCodigo.message
        );
      }

      try {
        await this.repositorio
          .revocarTokenAdministrador(
            TIPO_TOKEN_RECUPERACION,
            tokenHash
          );
      } catch (errorToken) {
        console.error(
          "No se pudo revocar el token de recuperación:",
          errorToken.message
        );
      }

      await this.registrarAuditoriaSegura({
        idAdministrador:
          administrador.idAdministrador,

        codigoAccion:
          ACCION_SOLICITAR_RECUPERACION,

        codigoModulo:
          MODULO_SEGURIDAD,

        tablaAfectada:
          "administradores",

        idRegistroAfectado:
          correoHash,

        datosAnteriores:
          null,

        datosNuevos: {
          resultado: "ERROR_ENVIO",
          cuentaDisponible: true
        },

        descripcion:
          "No fue posible enviar el código de recuperación.",

        direccionIp,
        userAgent
      });

      throw this.crearError(
        "No fue posible enviar el código de recuperación. Intente nuevamente.",
        503,
        "ERROR_ENVIO_CODIGO_RECUPERACION"
      );
    }

    return this.crearRespuestaSolicitud(
      administrador.correo,
      tokenRecuperacion,
      tokenCreado.fechaExpiracion
    );
  }

  /**
   * Verifica el código de recuperación.
   *
   * Cuando el código es correcto:
   * - Marca el código como usado.
   * - Revoca el token de solicitud.
   * - Genera un token para restablecer la contraseña.
   *
   * @param {object} datos
   * @param {string} datos.tokenRecuperacion
   * @param {string} datos.codigo
   *
   * @param {object} contexto
   * @returns {Promise<object>}
   */
  async verificarCodigoRecuperacion(
    datos,
    contexto = {}
  ) {
    const direccionIp =
      contexto.direccionIp ?? null;

    const userAgent =
      contexto.userAgent ?? null;

    if (
      !datos ||
      typeof datos !== "object"
    ) {
      await this.registrarCodigoRecuperacionFallido({
        idAdministrador: null,
        idCodigoVerificacionAdmin: null,

        motivo:
          "Los datos para verificar el código no son válidos.",

        cantidadIntentos: null,
        maximoIntentos: null,
        direccionIp,
        userAgent
      });

      throw this.crearError(
        "Los datos para verificar el código no son válidos.",
        400,
        "DATOS_VERIFICACION_INVALIDOS"
      );
    }

    const tokenRecuperacion =
      String(
        datos.tokenRecuperacion || ""
      ).trim();

    const codigo =
      String(
        datos.codigo || ""
      ).trim();

    if (!tokenRecuperacion) {
      await this.registrarCodigoRecuperacionFallido({
        idAdministrador: null,
        idCodigoVerificacionAdmin: null,

        motivo:
          "La solicitud de recuperación no contiene un token válido.",

        cantidadIntentos: null,
        maximoIntentos: null,
        direccionIp,
        userAgent
      });

      throw this.crearError(
        "La solicitud de recuperación no es válida o venció.",
        400,
        "TOKEN_RECUPERACION_INVALIDO"
      );
    }

    if (!/^\d{6}$/.test(codigo)) {
      await this.registrarCodigoRecuperacionFallido({
        idAdministrador: null,
        idCodigoVerificacionAdmin: null,

        motivo:
          "El código de recuperación no tiene el formato requerido.",

        cantidadIntentos: null,
        maximoIntentos: null,
        direccionIp,
        userAgent
      });

      throw this.crearError(
        "El código debe contener seis números.",
        400,
        "CODIGO_FORMATO_INVALIDO"
      );
    }

    const tokenHash =
      this.generarHashToken(
        tokenRecuperacion
      );

    const tokenActivo =
      await this.repositorio
        .buscarTokenActivo(
          TIPO_TOKEN_RECUPERACION,
          tokenHash
        );

    if (
      !tokenActivo ||
      !this.cuentaDisponible(
        tokenActivo
      )
    ) {
      await this.registrarCodigoRecuperacionFallido({
        idAdministrador: null,
        idCodigoVerificacionAdmin: null,

        motivo:
          "La solicitud de recuperación no es válida o venció.",

        cantidadIntentos: null,
        maximoIntentos: null,
        direccionIp,
        userAgent
      });

      throw this.crearError(
        "La solicitud de recuperación no es válida o venció.",
        400,
        "TOKEN_RECUPERACION_INVALIDO"
      );
    }

    const idAdministrador =
      Number(
        tokenActivo.idAdministrador
      );

    const codigoVigente =
      await this.repositorio
        .obtenerCodigoVerificacionVigente(
          idAdministrador,
          TIPO_CODIGO_RECUPERACION
        );

    if (!codigoVigente) {
      await this.repositorio
        .revocarTokenAdministrador(
          TIPO_TOKEN_RECUPERACION,
          tokenHash
        );

      await this.registrarCodigoRecuperacionFallido({
        idAdministrador,
        idCodigoVerificacionAdmin: null,

        motivo:
          "El código de recuperación venció o ya no es válido.",

        cantidadIntentos: null,
        maximoIntentos: null,
        direccionIp,
        userAgent
      });

      throw this.crearError(
        "El código de recuperación venció. Solicite uno nuevo.",
        400,
        "CODIGO_RECUPERACION_EXPIRADO"
      );
    }

    const codigoCorrecto =
      await bcrypt.compare(
        codigo,
        codigoVigente.codigoHash
      );

    if (!codigoCorrecto) {
      const intento =
        await this.repositorio
          .registrarIntentoFallidoCodigo(
            codigoVigente
              .idCodigoVerificacionAdmin
          );

      const cantidadIntentos =
        Number(
          intento.cantidadIntentos
        );

      const maximoIntentos =
        Number(
          intento.maximoIntentos
        );

      await this.registrarCodigoRecuperacionFallido({
        idAdministrador,

        idCodigoVerificacionAdmin:
          codigoVigente
            .idCodigoVerificacionAdmin,

        motivo:
          "El código de recuperación ingresado es incorrecto.",

        cantidadIntentos,
        maximoIntentos,
        direccionIp,
        userAgent
      });

      if (
        intento.usado ||
        cantidadIntentos >= maximoIntentos
      ) {
        await this.repositorio
          .revocarTokenAdministrador(
            TIPO_TOKEN_RECUPERACION,
            tokenHash
          );

        throw this.crearError(
          "Se alcanzó el máximo de intentos. Solicite un código nuevo.",
          429,
          "MAXIMO_INTENTOS_CODIGO"
        );
      }

      throw this.crearError(
        "El código ingresado es incorrecto.",
        400,
        "CODIGO_RECUPERACION_INCORRECTO"
      );
    }

    await this.repositorio
      .marcarCodigoVerificacionUsado(
        codigoVigente
          .idCodigoVerificacionAdmin
      );

    await this.repositorio
      .revocarTokenAdministrador(
        TIPO_TOKEN_RECUPERACION,
        tokenHash
      );

    const tokenRestablecimiento =
      this.generarToken();

    const tokenRestablecimientoHash =
      this.generarHashToken(
        tokenRestablecimiento
      );

    const tokenCreado =
      await this.repositorio
        .crearTokenAdministrador({
          idAdministrador,

          tipoToken:
            TIPO_TOKEN_RESTABLECIMIENTO,

          tokenHash:
            tokenRestablecimientoHash,

          minutosVigencia:
            MINUTOS_TOKEN_RESTABLECIMIENTO,

          direccionIp,
          userAgent
        });

    await this.registrarAuditoriaSegura({
      idAdministrador,

      codigoAccion:
        ACCION_VERIFICAR_CODIGO,

      codigoModulo:
        MODULO_SEGURIDAD,

      tablaAfectada:
        "codigos_verificacion_admin",

      idRegistroAfectado:
        String(
          codigoVigente
            .idCodigoVerificacionAdmin
        ),

      datosAnteriores: {
        usado: false
      },

      datosNuevos: {
        usado: true,
        resultado: "EXITOSO",
        tipoCodigo:
          TIPO_CODIGO_RECUPERACION
      },

      descripcion:
        "El código de recuperación fue verificado correctamente.",

      direccionIp,
      userAgent
    });

    return {
      codigoVerificado: true,

      mensaje:
        "El código fue verificado correctamente. Ahora puede crear una contraseña nueva.",

      tokenRestablecimiento,

      fechaExpiracion:
        tokenCreado.fechaExpiracion,

      minutosVigencia:
        MINUTOS_TOKEN_RESTABLECIMIENTO
    };
  }

  /**
   * Valida la seguridad de una contraseña nueva.
   *
   * @param {string} contrasena
   */
  validarSeguridadContrasena(
    contrasena
  ) {
    if (
      typeof contrasena !== "string" ||
      contrasena.length === 0
    ) {
      throw this.crearError(
        "La contraseña nueva es obligatoria.",
        400,
        "CONTRASENA_NUEVA_OBLIGATORIA"
      );
    }

    if (
      contrasena.length <
      LONGITUD_MINIMA_CONTRASENA
    ) {
      throw this.crearError(
        `La contraseña debe contener al menos ${LONGITUD_MINIMA_CONTRASENA} caracteres.`,
        400,
        "CONTRASENA_MUY_CORTA"
      );
    }

    if (
      contrasena.length >
      LONGITUD_MAXIMA_CONTRASENA
    ) {
      throw this.crearError(
        `La contraseña no puede superar los ${LONGITUD_MAXIMA_CONTRASENA} caracteres.`,
        400,
        "CONTRASENA_DEMASIADO_LARGA"
      );
    }

    if (!/[a-z]/.test(contrasena)) {
      throw this.crearError(
        "La contraseña debe contener al menos una letra minúscula.",
        400,
        "CONTRASENA_SIN_MINUSCULA"
      );
    }

    if (!/[A-Z]/.test(contrasena)) {
      throw this.crearError(
        "La contraseña debe contener al menos una letra mayúscula.",
        400,
        "CONTRASENA_SIN_MAYUSCULA"
      );
    }

    if (!/[0-9]/.test(contrasena)) {
      throw this.crearError(
        "La contraseña debe contener al menos un número.",
        400,
        "CONTRASENA_SIN_NUMERO"
      );
    }

    if (
      !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(
        contrasena
      )
    ) {
      throw this.crearError(
        "La contraseña debe contener al menos un carácter especial.",
        400,
        "CONTRASENA_SIN_CARACTER_ESPECIAL"
      );
    }
  }

  /**
   * Restablece la contraseña mediante
   * un token previamente verificado.
   *
   * @param {object} datos
   * @param {string} datos.tokenRestablecimiento
   * @param {string} datos.contrasenaNueva
   * @param {string} datos.confirmarContrasenaNueva
   *
   * @param {object} contexto
   * @param {string|null} contexto.direccionIp
   * @param {string|null} contexto.userAgent
   *
   * @returns {Promise<object>}
   */
  async restablecerContrasena(
    datos,
    contexto = {}
  ) {
    const direccionIp =
      contexto.direccionIp ?? null;

    const userAgent =
      contexto.userAgent ?? null;

    if (
      !datos ||
      typeof datos !== "object"
    ) {
      throw this.crearError(
        "Los datos para restablecer la contraseña no son válidos.",
        400,
        "DATOS_RESTABLECIMIENTO_INVALIDOS"
      );
    }

    const tokenRestablecimiento =
      String(
        datos.tokenRestablecimiento || ""
      ).trim();

    const contrasenaNueva =
      datos.contrasenaNueva;

    const confirmarContrasenaNueva =
      datos.confirmarContrasenaNueva;

    if (!tokenRestablecimiento) {
      await this.registrarAuditoriaSegura({
        idAdministrador: null,

        codigoAccion:
          ACCION_RECUPERAR_CONTRASENA,

        codigoModulo:
          MODULO_SEGURIDAD,

        tablaAfectada:
          "administradores",

        idRegistroAfectado:
          null,

        datosAnteriores:
          null,

        datosNuevos: {
          resultado: "FALLIDO",
          motivo:
            "Token de restablecimiento inválido o ausente."
        },

        descripcion:
          "Intento fallido de restablecimiento de contraseña.",

        direccionIp,
        userAgent
      });

      throw this.crearError(
        "La autorización para restablecer la contraseña no es válida o venció.",
        400,
        "TOKEN_RESTABLECIMIENTO_INVALIDO"
      );
    }

    this.validarSeguridadContrasena(
      contrasenaNueva
    );

    if (
      typeof confirmarContrasenaNueva !==
        "string" ||
      contrasenaNueva !==
        confirmarContrasenaNueva
    ) {
      throw this.crearError(
        "La confirmación no coincide con la contraseña nueva.",
        400,
        "CONFIRMACION_CONTRASENA_NO_COINCIDE"
      );
    }

    const tokenHash =
      this.generarHashToken(
        tokenRestablecimiento
      );

    const tokenActivo =
      await this.repositorio
        .buscarTokenActivo(
          TIPO_TOKEN_RESTABLECIMIENTO,
          tokenHash
        );

    if (
      !tokenActivo ||
      !this.cuentaDisponible(
        tokenActivo
      )
    ) {
      await this.registrarAuditoriaSegura({
        idAdministrador: null,

        codigoAccion:
          ACCION_RECUPERAR_CONTRASENA,

        codigoModulo:
          MODULO_SEGURIDAD,

        tablaAfectada:
          "administradores",

        idRegistroAfectado:
          null,

        datosAnteriores:
          null,

        datosNuevos: {
          resultado: "FALLIDO",
          motivo:
            "Token de restablecimiento inválido, vencido o revocado."
        },

        descripcion:
          "Intento fallido de restablecimiento de contraseña.",

        direccionIp,
        userAgent
      });

      throw this.crearError(
        "La autorización para restablecer la contraseña no es válida o venció.",
        400,
        "TOKEN_RESTABLECIMIENTO_INVALIDO"
      );
    }

    const idAdministrador =
      Number(
        tokenActivo.idAdministrador
      );

    const administrador =
      await this.repositorio
        .buscarAdministradorPorCorreo(
          tokenActivo.correo
        );

    if (
      !administrador ||
      Number(
        administrador.idAdministrador
      ) !==
        idAdministrador
    ) {
      await this.registrarAuditoriaSegura({
        idAdministrador,

        codigoAccion:
          ACCION_RECUPERAR_CONTRASENA,

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
            "No fue posible identificar la cuenta administrativa."
        },

        descripcion:
          "Intento fallido de restablecimiento de contraseña.",

        direccionIp,
        userAgent
      });

      throw this.crearError(
        "No fue posible identificar la cuenta administrativa.",
        400,
        "ADMINISTRADOR_NO_ENCONTRADO"
      );
    }

    const reutilizaContrasena =
      await bcrypt.compare(
        contrasenaNueva,
        administrador.contrasenaHash
      );

    if (reutilizaContrasena) {
      await this.registrarAuditoriaSegura({
        idAdministrador,

        codigoAccion:
          ACCION_RECUPERAR_CONTRASENA,

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
            "La contraseña nueva coincide con la contraseña anterior."
        },

        descripcion:
          "Intento rechazado de reutilización de contraseña.",

        direccionIp,
        userAgent
      });

      throw this.crearError(
        "La contraseña nueva debe ser diferente de la contraseña anterior.",
        400,
        "CONTRASENA_NUEVA_IGUAL_ANTERIOR"
      );
    }

    const contrasenaHashNueva =
      await bcrypt.hash(
        contrasenaNueva,
        RONDAS_HASH_CONTRASENA
      );

    /*
     * El procedimiento también revoca todos los tokens
     * e invalida los códigos pendientes.
     */
    const resultado =
      await this.repositorio
        .actualizarContrasenaAdministrador(
          idAdministrador,
          contrasenaHashNueva
        );

    await this.registrarAuditoriaSegura({
      idAdministrador,

      codigoAccion:
        ACCION_RECUPERAR_CONTRASENA,

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
        "La contraseña administrativa fue restablecida correctamente.",

      direccionIp,
      userAgent
    });

    return {
      contrasenaRestablecida: true,

      mensaje:
        "La contraseña fue restablecida correctamente. Ya puede iniciar sesión con la contraseña nueva.",

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
}

module.exports =
  RecuperacionContrasenaService;