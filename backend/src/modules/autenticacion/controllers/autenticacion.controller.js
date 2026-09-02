const {
  servicioVerificacion,
  autenticacionService,
  recuperacionContrasenaService
} = require(
  "../../../container/dependency-container"
);

const {
  validarCambioContrasena
} = require(
  "../validators/cambiar-contrasena.validator"
);

const {
  validarSolicitudRecuperacion,
  validarVerificacionRecuperacion,
  validarRestablecimientoContrasena
} = require(
  "../validators/recuperar-contrasena.validator"
);

const {
  crearCambiarContrasenaDTO
} = require(
  "../dto/cambiar-contrasena.dto"
);

const {
  SolicitarRecuperacionDto,
  VerificarRecuperacionDto,
  RestablecerContrasenaDto
} = require(
  "../dto/recuperar-contrasena.dto"
);

const NOMBRE_COOKIE_SESION = "sesion_admin";
const DURACION_SESION_MS = 8 * 60 * 60 * 1000;

class AutenticacionController {
  /**
   * Crea un error controlado para el middleware
   * centralizado de errores.
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
   * Obtiene la dirección IP del cliente.
   *
   * @param {object} req
   * @returns {string|null}
   */
  obtenerDireccionIp(req) {
    const direccionIp =
      req.ip ||
      req.socket?.remoteAddress ||
      null;

    if (!direccionIp) {
      return null;
    }

    return String(direccionIp)
      .replace(/^::ffff:/, "")
      .slice(0, 45);
  }

  /**
   * Obtiene la información del navegador.
   *
   * @param {object} req
   * @returns {string|null}
   */
  obtenerUserAgent(req) {
    const userAgent = req.get("user-agent");

    if (!userAgent) {
      return null;
    }

    return userAgent.slice(0, 500);
  }

  /**
   * Define las opciones de la cookie de sesión.
   *
   * En desarrollo funciona mediante HTTP.
   * En producción exige HTTPS.
   *
   * @returns {object}
   */
  obtenerOpcionesCookieSesion() {
    const esProduccion =
      process.env.NODE_ENV === "production";

    return {
      httpOnly: true,
      secure: esProduccion,

      /*
       * En producción permite que el panel y la API
       * funcionen desde dominios distintos mediante HTTPS.
       */
      sameSite: esProduccion
        ? "none"
        : "lax",

      maxAge: DURACION_SESION_MS,
      path: "/"
    };
  }

  /**
   * Define las opciones necesarias para eliminar
   * correctamente la cookie.
   *
   * @returns {object}
   */
  obtenerOpcionesEliminarCookie() {
    const esProduccion =
      process.env.NODE_ENV === "production";

    return {
      httpOnly: true,
      secure: esProduccion,

      sameSite: esProduccion
        ? "none"
        : "lax",

      path: "/"
    };
  }

  /**
   * Elimina la cookie de sesión administrativa.
   *
   * @param {object} res
   */
  eliminarCookieSesion(res) {
    res.clearCookie(
      NOMBRE_COOKIE_SESION,
      this.obtenerOpcionesEliminarCookie()
    );
  }

  /**
   * Primera etapa del inicio de sesión.
   *
   * Valida:
   * - Correo.
   * - Contraseña.
   * - Estado de la cuenta.
   * - Intentos fallidos.
   *
   * Cuando todo es correcto, envía el código
   * de verificación al correo.
   *
   * POST /api/autenticacion/iniciar-sesion
   */
  async iniciarSesion(req, res, next) {
    try {
      const resultado =
        await autenticacionService.iniciarSesion(
          {
            correo: req.body?.correo,
            contrasena: req.body?.contrasena
          },
          {
            direccionIp:
              this.obtenerDireccionIp(req),

            userAgent:
              this.obtenerUserAgent(req)
          }
        );

      if (resultado.tokenSesion) {
        res.cookie(
          NOMBRE_COOKIE_SESION,
          resultado.tokenSesion,
          this.obtenerOpcionesCookieSesion()
        );
      }

      const {
        tokenSesion,
        ...resultadoSeguro
      } = resultado;

      return res.status(200).json({
        exito: true,
        mensaje: resultadoSeguro.mensaje,
        datos: resultadoSeguro
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Segunda etapa del inicio de sesión.
   *
   * Valida el código recibido por correo,
   * crea el token de sesión y guarda el token
   * real dentro de una cookie HttpOnly.
   *
   * POST /api/autenticacion/verificar-codigo
   */
  async verificarCodigo(req, res, next) {
    try {
      const resultado =
        await servicioVerificacion
          .verificarCodigo(
            {
              tokenVerificacion:
                req.body?.tokenVerificacion,

              codigo:
                req.body?.codigo
            },
            {
              direccionIp:
                this.obtenerDireccionIp(req),

              userAgent:
                this.obtenerUserAgent(req)
            }
          );

      /*
       * El token real se guarda en una cookie HttpOnly.
       * JavaScript del navegador no podrá leerlo.
       */
      res.cookie(
        NOMBRE_COOKIE_SESION,
        resultado.tokenSesion,
        this.obtenerOpcionesCookieSesion()
      );

      /*
       * El token nunca se devuelve dentro del JSON.
       */
      const {
        tokenSesion,
        ...resultadoSeguro
      } = resultado;

      return res.status(200).json({
        exito: true,
        mensaje: resultadoSeguro.mensaje,
        datos: resultadoSeguro
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Solicita un código para recuperar la contraseña.
   *
   * No requiere una sesión iniciada.
   *
   * La respuesta es general para no revelar
   * si el correo pertenece a un administrador.
   *
   * POST /api/autenticacion/recuperar-contrasena/solicitar
   */
  async solicitarRecuperacionContrasena(
    req,
    res,
    next
  ) {
    try {
      const datosValidados =
        validarSolicitudRecuperacion(
          req.body
        );

      const dto =
        new SolicitarRecuperacionDto(
          datosValidados
        );

      const resultado =
        await recuperacionContrasenaService
          .solicitarRecuperacion(
            dto,
            {
              direccionIp:
                this.obtenerDireccionIp(req),

              userAgent:
                this.obtenerUserAgent(req)
            }
          );

      return res.status(200).json({
        exito: true,
        mensaje: resultado.mensaje,

        datos: {
          solicitudAceptada:
            resultado.solicitudAceptada,

          tokenRecuperacion:
            resultado.tokenRecuperacion,

          correoDestino:
            resultado.correoDestino,

          fechaExpiracion:
            resultado.fechaExpiracion,

          minutosVigencia:
            resultado.minutosVigencia
        }
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Verifica el código recibido durante
   * la recuperación de contraseña.
   *
   * No crea una sesión administrativa.
   * Devuelve un token temporal que únicamente
   * permite restablecer la contraseña.
   *
   * POST /api/autenticacion/recuperar-contrasena/verificar
   */
  async verificarCodigoRecuperacion(
    req,
    res,
    next
  ) {
    try {
      const datosValidados =
        validarVerificacionRecuperacion(
          req.body
        );

      const dto =
        new VerificarRecuperacionDto(
          datosValidados
        );

      const resultado =
        await recuperacionContrasenaService
          .verificarCodigoRecuperacion(
            dto,
            {
              direccionIp:
                this.obtenerDireccionIp(req),

              userAgent:
                this.obtenerUserAgent(req)
            }
          );

      return res.status(200).json({
        exito: true,
        mensaje: resultado.mensaje,

        datos: {
          codigoVerificado:
            resultado.codigoVerificado,

          tokenRestablecimiento:
            resultado.tokenRestablecimiento,

          fechaExpiracion:
            resultado.fechaExpiracion,

          minutosVigencia:
            resultado.minutosVigencia
        }
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Establece la contraseña nueva después
   * de verificar el código de recuperación.
   *
   * No requiere una sesión iniciada.
   *
   * Al finalizar:
   * - Actualiza la contraseña.
   * - Revoca todas las sesiones.
   * - Invalida códigos pendientes.
   * - Elimina cualquier cookie de sesión existente.
   *
   * POST /api/autenticacion/recuperar-contrasena/restablecer
   */
  async restablecerContrasena(
    req,
    res,
    next
  ) {
    try {
      const datosValidados =
        validarRestablecimientoContrasena(
          req.body
        );

      const dto =
        new RestablecerContrasenaDto(
          datosValidados
        );

      const resultado =
        await recuperacionContrasenaService
          .restablecerContrasena(
            dto,
            {
              direccionIp:
                this.obtenerDireccionIp(req),

              userAgent:
                this.obtenerUserAgent(req)
            }
          );

      /*
       * La contraseña fue modificada y todas las
       * sesiones administrativas fueron revocadas.
       */
      this.eliminarCookieSesion(res);

      return res.status(200).json({
        exito: true,
        mensaje: resultado.mensaje,

        datos: {
          contrasenaRestablecida:
            resultado.contrasenaRestablecida,

          idAdministrador:
            resultado.idAdministrador,

          fechaActualizacion:
            resultado.fechaActualizacion,

          sesionesRevocadas:
            resultado.sesionesRevocadas,

          codigosInvalidados:
            resultado.codigosInvalidados,

          requiereNuevoInicioSesion: true
        }
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Devuelve los datos del administrador autenticado.
   *
   * Esta ruta utiliza primero:
   * authentication.middleware.js
   *
   * GET /api/autenticacion/sesion
   */
  async obtenerSesion(req, res, next) {
    try {
      const sesion =
        req.sesionAdministrador;

      if (!sesion) {
        throw this.crearError(
          "No existe una sesión administrativa válida.",
          401,
          "SESION_REQUERIDA"
        );
      }

      return res.status(200).json({
        exito: true,
        mensaje:
          "La sesión administrativa está activa.",

        datos: {
          autenticado: true,

          administrador: {
            idAdministrador:
              sesion.idAdministrador,

            nombreCompleto:
              sesion.nombreCompleto,

            correo:
              sesion.correo,

            idEstadoAdministrador:
              sesion.idEstadoAdministrador,

            nombreEstado:
              sesion.nombreEstado,

            requiereCambioContrasena:
              Boolean(sesion.requiereCambioContrasena)
          },

          fechaEmision:
            sesion.fechaEmision,

          fechaExpiracion:
            sesion.fechaExpiracion
        }
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Cambia la contraseña del administrador autenticado.
   *
   * Flujo:
   * 1. Valida los datos recibidos.
   * 2. Crea el DTO.
   * 3. Comprueba la contraseña actual.
   * 4. Actualiza el hash.
   * 5. Revoca todas las sesiones.
   * 6. Elimina la cookie actual.
   *
   * Esta ruta utiliza primero:
   * authentication.middleware.js
   *
   * PATCH /api/autenticacion/cambiar-contrasena
   */
  async cambiarContrasena(req, res, next) {
    try {
      const datosValidados =
        validarCambioContrasena(
          req.body
        );

      const dto =
        crearCambiarContrasenaDTO(
          datosValidados
        );

      const resultado =
        await autenticacionService
          .cambiarContrasena(
            req.sesionAdministrador,
            dto,
            {
              direccionIp:
                this.obtenerDireccionIp(req),

              userAgent:
                this.obtenerUserAgent(req)
            }
          );

      /*
       * El procedimiento almacenado revocó todas
       * las sesiones, incluida la sesión actual.
       */
      this.eliminarCookieSesion(res);

      return res.status(200).json({
        exito: true,
        mensaje: resultado.mensaje,

        datos: {
          contrasenaActualizada:
            resultado.contrasenaActualizada,

          idAdministrador:
            resultado.idAdministrador,

          fechaActualizacion:
            resultado.fechaActualizacion,

          sesionesRevocadas:
            resultado.sesionesRevocadas,

          codigosInvalidados:
            resultado.codigosInvalidados,

          requiereNuevoInicioSesion: true
        }
      });
    } catch (error) {
      return next(error);
    }
  }

  async cambiarContrasenaObligatoria(req, res, next) {
    try {
      if (!req.sesionAdministrador?.requiereCambioContrasena) {
        throw this.crearError(
          "La cuenta no tiene un cambio obligatorio pendiente.",
          409,
          "CAMBIO_CONTRASENA_NO_REQUERIDO"
        );
      }
      const datosValidados = validarCambioContrasena(req.body);
      const dto = crearCambiarContrasenaDTO(datosValidados);
      const contexto = {
        direccionIp: this.obtenerDireccionIp(req),
        userAgent: this.obtenerUserAgent(req)
      };
      const resultado = await autenticacionService.cambiarContrasena(
        req.sesionAdministrador,
        dto,
        contexto
      );
      const sesionCreada = await servicioVerificacion.crearSesionAdministrador(
        req.sesionAdministrador,
        contexto
      );
      res.cookie(
        NOMBRE_COOKIE_SESION,
        sesionCreada.tokenSesion,
        this.obtenerOpcionesCookieSesion()
      );
      return res.status(200).json({
        exito: true,
        mensaje: "La contraseña fue actualizada correctamente.",
        datos: {
          contrasenaActualizada: resultado.contrasenaActualizada,
          requiereCambioContrasena: false,
          requiereNuevoInicioSesion: false
        }
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Cierra la sesión administrativa.
   *
   * La lógica de revocación y auditoría pertenece
   * al servicio de autenticación.
   *
   * El controlador únicamente:
   * - Envía los datos de sesión al servicio.
   * - Elimina la cookie.
   * - Devuelve la respuesta HTTP.
   *
   * Esta ruta utiliza primero:
   * authentication.middleware.js
   *
   * POST /api/autenticacion/cerrar-sesion
   */
  async cerrarSesion(req, res, next) {
    try {
      const resultado =
        await autenticacionService
          .cerrarSesion(
            req.sesionAdministrador,
            {
              direccionIp:
                this.obtenerDireccionIp(req),

              userAgent:
                this.obtenerUserAgent(req)
            }
          );

      /*
       * El servicio revocó el token en SQL Server.
       * El controlador elimina la cookie porque
       * pertenece a la capa HTTP.
       */
      this.eliminarCookieSesion(res);

      return res.status(200).json({
        exito: true,
        mensaje: resultado.mensaje,
        datos: null
      });
    } catch (error) {
      /*
       * Aunque ocurra un error durante la revocación,
       * la cookie se elimina del navegador.
       */
      this.eliminarCookieSesion(res);

      return next(error);
    }
  }
}

const autenticacionController =
  new AutenticacionController();

module.exports =
  autenticacionController;
