const crypto = require("node:crypto");
const bcrypt = require("bcryptjs");

const SqlAutenticacionRepository = require(
  "../repositories/sql-autenticacion.repository"
);

const AuditoriaService = require(
  "../../auditoria/services/auditoria.service"
);

const TIPO_CODIGO_INICIO_SESION = "INICIO_SESION";

const TIPO_TOKEN_VERIFICACION =
  "VERIFICACION_INICIO_SESION";

const TIPO_TOKEN_SESION = "SESION";

const VIGENCIA_CODIGO_MINUTOS = 10;
const MAXIMO_INTENTOS_CODIGO = 5;

const VIGENCIA_TOKEN_VERIFICACION_MINUTOS = 10;
const VIGENCIA_TOKEN_SESION_MINUTOS = 480;

const MODULO_SEGURIDAD = "SEGURIDAD";

const ACCION_VERIFICAR_CODIGO =
  "VERIFICAR_CODIGO";

const ACCION_CODIGO_VERIFICACION_FALLIDO =
  "CODIGO_VERIFICACION_FALLIDO";

const ACCION_INICIAR_SESION =
  "INICIAR_SESION";

class VerificacionAdministradorService {
  /**
   * @param {object} repositorio
   * @param {object|null} auditoriaService
   */
  constructor(
    repositorio = new SqlAutenticacionRepository(),
    auditoriaService = new AuditoriaService()
  ) {
    this.repositorio = repositorio;
    this.auditoriaService = auditoriaService;
  }

  /**
   * Crea un error controlado para el middleware.
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
        "No se pudo registrar la auditoría de verificación:",
        error.message
      );

      return null;
    }
  }

  /**
   * Registra un intento fallido de verificación
   * sin exponer el código ni el token recibidos.
   *
   * @param {object} datos
   * @param {number|null} datos.idAdministrador
   * @param {number|null} datos.idCodigoVerificacionAdmin
   * @param {string} datos.motivo
   * @param {number|null} datos.cantidadIntentos
   * @param {number|null} datos.maximoIntentos
   * @param {string|null} datos.direccionIp
   * @param {string|null} datos.userAgent
   * @returns {Promise<object|null>}
   */
  async registrarVerificacionFallida(
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
        motivo: datos.motivo,

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
   * Genera un código aleatorio de seis dígitos.
   *
   * @returns {string}
   */
  generarCodigo() {
    return crypto
      .randomInt(100000, 1000000)
      .toString();
  }

  /**
   * Genera un token aleatorio seguro.
   *
   * @returns {string}
   */
  generarToken() {
    return crypto
      .randomBytes(48)
      .toString("base64url");
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
   * Crea una sesión administrativa definitiva.
   *
   * Se reutiliza tanto después de validar el segundo factor
   * como para las cuentas que no lo requieren.
   *
   * @param {object} administrador
   * @param {object} contexto
   * @returns {Promise<object>}
   */
  async crearSesionAdministrador(
    administrador,
    contexto = {}
  ) {
    const idAdministrador = Number(
      administrador?.idAdministrador
    );

    if (
      !Number.isInteger(idAdministrador) ||
      idAdministrador <= 0
    ) {
      throw this.crearError(
        "No fue posible identificar al administrador para crear la sesión.",
        401,
        "ADMINISTRADOR_SESION_INVALIDO"
      );
    }

    const tokenSesion =
      this.generarToken();

    const tokenSesionHash =
      this.generarHashToken(
        tokenSesion
      );

    const sesionCreada =
      await this.repositorio
        .crearTokenAdministrador({
          idAdministrador,
          tipoToken:
            TIPO_TOKEN_SESION,
          tokenHash:
            tokenSesionHash,
          minutosVigencia:
            VIGENCIA_TOKEN_SESION_MINUTOS,
          direccionIp:
            contexto.direccionIp ?? null,
          userAgent:
            contexto.userAgent ?? null
        });

    return {
      tokenSesion,
      fechaExpiracion:
        sesionCreada.fechaExpiracion
    };
  }

  /**
   * Oculta una parte del correo para mostrarlo
   * de manera segura en el panel.
   *
   * @param {string} correo
   * @returns {string}
   */
  ocultarCorreo(correo) {
    const partes = correo.split("@");

    if (partes.length !== 2) {
      return correo;
    }

    const [usuario, dominio] = partes;

    if (usuario.length <= 2) {
      return `${usuario[0] ?? "*"}***@${dominio}`;
    }

    return (
      `${usuario.slice(0, 2)}` +
      `${"*".repeat(Math.max(usuario.length - 2, 3))}` +
      `@${dominio}`
    );
  }

  /**
   * Devuelve datos seguros del administrador.
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

      requiereCambioContrasena:
        Boolean(administrador.requiereCambioContrasena)
    };
  }

  /**
   * Crea el código y el token temporal necesarios
   * para la segunda etapa del inicio de sesión.
   *
   * La función enviarCodigo debe enviar el código
   * al correo del administrador.
   *
   * @param {object} administrador
   * @param {number} administrador.idAdministrador
   * @param {string} administrador.correo
   *
   * @param {object} contexto
   * @param {string|null} contexto.direccionIp
   * @param {string|null} contexto.userAgent
   *
   * @param {Function} enviarCodigo
   *
   * @returns {Promise<object>}
   */
  async iniciarVerificacion(
    administrador,
    contexto = {},
    enviarCodigo
  ) {
    if (
      !administrador ||
      !Number.isInteger(
        Number(administrador.idAdministrador)
      ) ||
      Number(administrador.idAdministrador) <= 0
    ) {
      throw this.crearError(
        "El administrador indicado no es válido.",
        400,
        "ADMINISTRADOR_INVALIDO"
      );
    }

    if (
      typeof administrador.correo !== "string" ||
      administrador.correo.trim() === ""
    ) {
      throw this.crearError(
        "El correo del administrador no es válido.",
        400,
        "CORREO_ADMINISTRADOR_INVALIDO"
      );
    }

    if (typeof enviarCodigo !== "function") {
      throw this.crearError(
        "El servicio de envío de correos no está disponible.",
        503,
        "SERVICIO_CORREO_NO_DISPONIBLE"
      );
    }

    const idAdministrador = Number(
      administrador.idAdministrador
    );

    const correo = administrador.correo
      .trim()
      .toLowerCase();

    const direccionIp =
      contexto.direccionIp ?? null;

    const userAgent =
      contexto.userAgent ?? null;

    /*
     * Código enviado al correo.
     */
    const codigo = this.generarCodigo();

    const codigoHash = await bcrypt.hash(
      codigo,
      10
    );

    /*
     * Token temporal que identifica la verificación.
     * Este token sí puede viajar al navegador.
     */
    const tokenVerificacion =
      this.generarToken();

    const tokenVerificacionHash =
      this.generarHashToken(
        tokenVerificacion
      );

    /*
     * Guardar el código protegido.
     */
    const codigoCreado =
      await this.repositorio
        .crearCodigoVerificacion({
          idAdministrador,
          tipoCodigo:
            TIPO_CODIGO_INICIO_SESION,
          codigoHash,
          minutosVigencia:
            VIGENCIA_CODIGO_MINUTOS,
          maximoIntentos:
            MAXIMO_INTENTOS_CODIGO,
          direccionIp
        });

    /*
     * Guardar el token temporal protegido.
     */
    await this.repositorio
      .crearTokenAdministrador({
        idAdministrador,
        tipoToken:
          TIPO_TOKEN_VERIFICACION,
        tokenHash:
          tokenVerificacionHash,
        minutosVigencia:
          VIGENCIA_TOKEN_VERIFICACION_MINUTOS,
        direccionIp,
        userAgent
      });

    /*
     * El código real solamente se entrega
     * a la función encargada de enviarlo.
     */
    try {
      await enviarCodigo({
        destinatario: correo,
        codigo,
        minutosVigencia:
          VIGENCIA_CODIGO_MINUTOS
      });
    } catch (error) {
      /*
       * Si el correo falla, el token temporal
       * deja de ser válido.
       */
      await this.repositorio
        .revocarTokenAdministrador(
          TIPO_TOKEN_VERIFICACION,
          tokenVerificacionHash
        )
        .catch(() => null);

      await this.registrarVerificacionFallida({
        idAdministrador,

        idCodigoVerificacionAdmin:
          codigoCreado
            .idCodigoVerificacionAdmin,

        motivo:
          "No fue posible enviar el código de verificación.",

        cantidadIntentos: 0,

        maximoIntentos:
          MAXIMO_INTENTOS_CODIGO,

        direccionIp,
        userAgent
      });

      throw this.crearError(
        "No fue posible enviar el código de verificación.",
        503,
        "ERROR_ENVIO_CODIGO"
      );
    }

    return {
      autenticado: false,
      requiereVerificacion: true,
      estado: "CODIGO_ENVIADO",

      mensaje:
        "Se envió un código de verificación al correo registrado.",

      tokenVerificacion,

      correoDestino:
        this.ocultarCorreo(correo),

      expiraEnMinutos:
        VIGENCIA_CODIGO_MINUTOS
    };
  }

  /**
   * Valida el código recibido y crea la sesión.
   *
   * @param {object} datos
   * @param {string} datos.tokenVerificacion
   * @param {string} datos.codigo
   *
   * @param {object} contexto
   * @param {string|null} contexto.direccionIp
   * @param {string|null} contexto.userAgent
   *
   * @returns {Promise<object>}
   */
  async verificarCodigo(
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
      await this.registrarVerificacionFallida({
        idAdministrador: null,
        idCodigoVerificacionAdmin: null,

        motivo:
          "Los datos de verificación no son válidos.",

        cantidadIntentos: null,
        maximoIntentos: null,
        direccionIp,
        userAgent
      });

      throw this.crearError(
        "Los datos de verificación no son válidos.",
        400,
        "DATOS_VERIFICACION_INVALIDOS"
      );
    }

    const tokenVerificacion =
      typeof datos.tokenVerificacion ===
      "string"
        ? datos.tokenVerificacion.trim()
        : "";

    const codigo =
      typeof datos.codigo === "string"
        ? datos.codigo.trim()
        : "";

    if (!tokenVerificacion) {
      await this.registrarVerificacionFallida({
        idAdministrador: null,
        idCodigoVerificacionAdmin: null,

        motivo:
          "El token de verificación es obligatorio.",

        cantidadIntentos: null,
        maximoIntentos: null,
        direccionIp,
        userAgent
      });

      throw this.crearError(
        "El token de verificación es obligatorio.",
        400,
        "TOKEN_VERIFICACION_OBLIGATORIO"
      );
    }

    if (!/^\d{6}$/.test(codigo)) {
      await this.registrarVerificacionFallida({
        idAdministrador: null,
        idCodigoVerificacionAdmin: null,

        motivo:
          "El código no tiene el formato requerido.",

        cantidadIntentos: null,
        maximoIntentos: null,
        direccionIp,
        userAgent
      });

      throw this.crearError(
        "El código debe contener seis dígitos.",
        400,
        "FORMATO_CODIGO_INVALIDO"
      );
    }

    const tokenVerificacionHash =
      this.generarHashToken(
        tokenVerificacion
      );

    /*
     * Buscar el token temporal activo.
     */
    const verificacion =
      await this.repositorio
        .buscarTokenActivo(
          TIPO_TOKEN_VERIFICACION,
          tokenVerificacionHash
        );

    if (!verificacion) {
      await this.registrarVerificacionFallida({
        idAdministrador: null,
        idCodigoVerificacionAdmin: null,

        motivo:
          "La verificación expiró o ya no es válida.",

        cantidadIntentos: null,
        maximoIntentos: null,
        direccionIp,
        userAgent
      });

      throw this.crearError(
        "La verificación expiró o ya no es válida.",
        401,
        "VERIFICACION_INVALIDA"
      );
    }

    const idAdministrador = Number(
      verificacion.idAdministrador
    );

    /*
     * Obtener el código vigente.
     */
    const codigoGuardado =
  await this.repositorio
    .obtenerCodigoVerificacionVigente(
      idAdministrador,
      TIPO_CODIGO_INICIO_SESION
    );

if (!codigoGuardado) {
  await this.registrarVerificacionFallida({
    idAdministrador,
    idCodigoVerificacionAdmin: null,

    motivo:
      "El código expiró o ya no es válido.",

    cantidadIntentos: null,
    maximoIntentos: null,
    direccionIp,
    userAgent
  });

  throw this.crearError(
    "El código expiró o ya no es válido.",
    401,
    "CODIGO_INVALIDO_O_EXPIRADO"
  );
}

/*
 * Comparar el código con bcrypt.
 */
  const codigoCorrecto =
    await bcrypt.compare(
      codigo,
      codigoGuardado.codigoHash
    );

  if (!codigoCorrecto) {
    const intentoFallido =
      await this.repositorio
        .registrarIntentoFallidoCodigo(
          Number(
            codigoGuardado
              .idCodigoVerificacionAdmin
          )
        );

    const cantidadIntentos =
      Number(
        intentoFallido.cantidadIntentos
      );

    const maximoIntentos =
      Number(
        intentoFallido.maximoIntentos
      );

    const alcanzoMaximoIntentos =
      Boolean(intentoFallido.usado) ||
      cantidadIntentos >= maximoIntentos;

    await this.registrarVerificacionFallida({
      idAdministrador,

      idCodigoVerificacionAdmin:
        codigoGuardado
          .idCodigoVerificacionAdmin,

      motivo:
        alcanzoMaximoIntentos
          ? "Se alcanzó el máximo de intentos permitidos para el código."
          : "El código ingresado es incorrecto.",

      cantidadIntentos,
      maximoIntentos,
      direccionIp,
      userAgent
    });

    if (alcanzoMaximoIntentos) {
      await this.repositorio
        .revocarTokenAdministrador(
          TIPO_TOKEN_VERIFICACION,
          tokenVerificacionHash
        );

      throw this.crearError(
        "Se alcanzó el máximo de intentos. Inicie sesión nuevamente.",
        429,
        "MAXIMO_INTENTOS_CODIGO"
      );
    }

    throw this.crearError(
      "El código ingresado es incorrecto.",
      401,
      "CODIGO_INCORRECTO"
    );
  }

  /*
  * Marcar el código como utilizado.
  */
    await this.repositorio
      .marcarCodigoVerificacionUsado(
        Number(
          codigoGuardado
            .idCodigoVerificacionAdmin
        )
      );

    /*
     * Revocar el token temporal.
     */
    await this.repositorio
      .revocarTokenAdministrador(
        TIPO_TOKEN_VERIFICACION,
        tokenVerificacionHash
      );

    /*
     * Crear el token definitivo de sesión.
     */
    const sesionCreada =
      await this.crearSesionAdministrador(
        verificacion,
        {
          direccionIp,
          userAgent
        }
      );

    /*
     * Registrar el acceso exitoso.
     */
    await this.repositorio
      .registrarIntentoInicioSesion({
        idAdministrador,

        correoIngresado:
          verificacion.correo,

        exitoso: true,

        motivoResultado:
          "Inicio de sesión completado con verificación por código.",

        direccionIp,
        userAgent
      });

    await this.repositorio
      .actualizarUltimoAcceso(
        idAdministrador
      );

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
          codigoGuardado
            .idCodigoVerificacionAdmin
        ),

      datosAnteriores: {
        usado: false
      },

      datosNuevos: {
        usado: true,
        resultado: "EXITOSO"
      },

      descripcion:
        "El código de verificación fue validado correctamente.",

      direccionIp,
      userAgent
    });

    await this.registrarAuditoriaSegura({
      idAdministrador,

      codigoAccion:
        ACCION_INICIAR_SESION,

      codigoModulo:
        MODULO_SEGURIDAD,

      tablaAfectada:
        "administradores",

      idRegistroAfectado:
        String(idAdministrador),

      datosAnteriores:
        null,

      datosNuevos: {
        resultado: "EXITOSO",
        requiereVerificacion: true,
        segundoFactorCompletado: true
      },

      descripcion:
        "Inicio de sesión completado con verificación por código.",

      direccionIp,
      userAgent
    });

    return {
      autenticado: true,
      requiereVerificacion: false,
      estado: "SESION_INICIADA",

      mensaje:
        "Inicio de sesión realizado correctamente.",

      tokenSesion:
        sesionCreada.tokenSesion,

      fechaExpiracion:
        sesionCreada.fechaExpiracion,

      administrador:
        this.obtenerAdministradorSeguro(
          verificacion
        )
    };
  }
}

module.exports =
  VerificacionAdministradorService;
