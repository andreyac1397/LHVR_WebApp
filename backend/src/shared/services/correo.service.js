const nodemailer = require("nodemailer");

/*
 * Servicio compartido para enviar correos electrónicos.
 *
 * Puede utilizarse desde:
 * - Autenticación.
 * - Recuperación de contraseña.
 * - Solicitudes de biblioteca.
 * - Notificaciones administrativas.
 *
 * Las credenciales SMTP se obtienen desde el archivo .env.
 */

class CorreoService {
  constructor() {
    this.transportador = null;
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
   * Convierte una variable de entorno a booleano.
   *
   * @param {string|undefined} valor
   * @returns {boolean}
   */
  convertirBooleano(valor) {
    return String(valor).trim().toLowerCase() === "true";
  }

  /**
   * Valida que la configuración SMTP esté completa.
   *
   * @returns {object}
   */
  obtenerConfiguracion() {
    const host = process.env.SMTP_HOST;
    const puerto = Number(process.env.SMTP_PORT);
    const seguro = this.convertirBooleano(
      process.env.SMTP_SECURE
    );

    const usuario = process.env.SMTP_USER;
    const contrasena = process.env.SMTP_PASSWORD;

    const nombreRemitente =
      process.env.SMTP_FROM_NAME ||
      "Liceo Hernán Vargas Ramírez";

    const correoRemitente =
      process.env.SMTP_FROM_EMAIL ||
      usuario;

    const variablesFaltantes = [];

    if (!host) {
      variablesFaltantes.push("SMTP_HOST");
    }

    if (
      !Number.isInteger(puerto) ||
      puerto <= 0 ||
      puerto > 65535
    ) {
      variablesFaltantes.push("SMTP_PORT");
    }

    if (!usuario) {
      variablesFaltantes.push("SMTP_USER");
    }

    if (!contrasena) {
      variablesFaltantes.push("SMTP_PASSWORD");
    }

    if (!correoRemitente) {
      variablesFaltantes.push("SMTP_FROM_EMAIL");
    }

    if (variablesFaltantes.length > 0) {
      throw this.crearError(
        `Falta configurar: ${variablesFaltantes.join(", ")}.`,
        500,
        "CONFIGURACION_SMTP_INCOMPLETA"
      );
    }

    return {
      host,
      puerto,
      seguro,
      usuario,
      contrasena,
      nombreRemitente,
      correoRemitente
    };
  }

  /**
   * Crea una sola conexión reutilizable con el servidor SMTP.
   *
   * @returns {object}
   */
  obtenerTransportador() {
    if (this.transportador) {
      return this.transportador;
    }

    const configuracion =
      this.obtenerConfiguracion();

    this.transportador =
      nodemailer.createTransport({
        host: configuracion.host,
        port: configuracion.puerto,
        secure: configuracion.seguro,

        auth: {
          user: configuracion.usuario,
          pass: configuracion.contrasena
        },

        pool: true,
        maxConnections: 3,
        maxMessages: 100,

        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 20000
      });

    return this.transportador;
  }

  /**
   * Comprueba la conexión con el servidor SMTP.
   *
   * @returns {Promise<boolean>}
   */
  async verificarConexion() {
    try {
      const transportador =
        this.obtenerTransportador();

      await transportador.verify();

      return true;
    } catch (error) {
      throw this.crearError(
        `No fue posible conectar con el servidor de correo: ${error.message}`,
        503,
        "ERROR_CONEXION_SMTP"
      );
    }
  }

  /**
   * Valida una dirección de correo básica.
   *
   * @param {string} correo
   * @returns {boolean}
   */
  correoEsValido(correo) {
    if (typeof correo !== "string") {
      return false;
    }

    const expresion =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return expresion.test(
      correo.trim().toLowerCase()
    );
  }

  /**
   * Envía un correo electrónico.
   *
   * @param {object} datosCorreo
   * @param {string} datosCorreo.destinatario
   * @param {string} datosCorreo.asunto
   * @param {string} datosCorreo.texto
   * @param {string} datosCorreo.html
   *
   * @returns {Promise<object>}
   */
  async enviarCorreo(datosCorreo) {
    if (
      !datosCorreo ||
      typeof datosCorreo !== "object"
    ) {
      throw this.crearError(
        "Los datos del correo no son válidos.",
        400,
        "DATOS_CORREO_INVALIDOS"
      );
    }

    const destinatario = String(
      datosCorreo.destinatario ?? ""
    )
      .trim()
      .toLowerCase();

    const asunto = String(
      datosCorreo.asunto ?? ""
    ).trim();

    const texto = String(
      datosCorreo.texto ?? ""
    );

    const html = String(
      datosCorreo.html ?? ""
    );

    if (!this.correoEsValido(destinatario)) {
      throw this.crearError(
        "El correo del destinatario no es válido.",
        400,
        "DESTINATARIO_INVALIDO"
      );
    }

    if (!asunto) {
      throw this.crearError(
        "El asunto del correo es obligatorio.",
        400,
        "ASUNTO_CORREO_OBLIGATORIO"
      );
    }

    if (!texto && !html) {
      throw this.crearError(
        "El contenido del correo es obligatorio.",
        400,
        "CONTENIDO_CORREO_OBLIGATORIO"
      );
    }

    const configuracion =
      this.obtenerConfiguracion();

    const transportador =
      this.obtenerTransportador();

    try {
      const resultado =
        await transportador.sendMail({
          from: {
            name:
              configuracion.nombreRemitente,

            address:
              configuracion.correoRemitente
          },

          to: destinatario,
          subject: asunto,
          text: texto,
          html
        });

      return {
        enviado: true,
        messageId: resultado.messageId,
        destinatario
      };
    } catch (error) {
      console.error(
        "Error al enviar el correo:",
        error.message
      );

      throw this.crearError(
        "No fue posible enviar el correo electrónico.",
        503,
        "ERROR_ENVIO_CORREO"
      );
    }
  }

  /**
   * Envía el código para verificar un inicio de sesión.
   *
   * Esta función coincide con la que espera:
   * VerificacionAdministradorService.iniciarVerificacion()
   *
   * @param {object} datos
   * @param {string} datos.destinatario
   * @param {string} datos.codigo
   * @param {number} datos.minutosVigencia
   *
   * @returns {Promise<object>}
   */
  async enviarCodigoVerificacion(datos) {
    if (
      !datos ||
      typeof datos !== "object"
    ) {
      throw this.crearError(
        "Los datos del código no son válidos.",
        400,
        "DATOS_CODIGO_INVALIDOS"
      );
    }

    const destinatario = String(
      datos.destinatario ?? ""
    )
      .trim()
      .toLowerCase();

    const codigo = String(
      datos.codigo ?? ""
    ).trim();

    const minutosVigencia = Number(
      datos.minutosVigencia
    );

    if (!/^\d{6}$/.test(codigo)) {
      throw this.crearError(
        "El código de verificación debe tener seis dígitos.",
        400,
        "CODIGO_VERIFICACION_INVALIDO"
      );
    }

    if (
      !Number.isInteger(minutosVigencia) ||
      minutosVigencia <= 0
    ) {
      throw this.crearError(
        "La vigencia del código no es válida.",
        400,
        "VIGENCIA_CODIGO_INVALIDA"
      );
    }

    const asunto =
      "Código de verificación para el panel administrativo";

    const texto = [
      "Liceo Hernán Vargas Ramírez",
      "",
      "Se solicitó iniciar sesión en el panel administrativo.",
      "",
      `Su código de verificación es: ${codigo}`,
      "",
      `El código vence en ${minutosVigencia} minutos.`,
      "",
      "No comparta este código con ninguna persona.",
      "",
      "Si usted no realizó esta solicitud, puede ignorar este correo."
    ].join("\n");

    const html = `
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          >
          <title>Código de verificación</title>
        </head>

        <body
          style="
            margin: 0;
            padding: 24px;
            background-color: #f3f5f4;
            font-family: Arial, Helvetica, sans-serif;
            color: #26332d;
          "
        >
          <div
            style="
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              border: 1px solid #dfe6e2;
            "
          >
            <div
              style="
                padding: 24px;
                background-color: #185c37;
                color: #ffffff;
                text-align: center;
              "
            >
              <h1
                style="
                  margin: 0;
                  font-size: 22px;
                "
              >
                Liceo Hernán Vargas Ramírez
              </h1>

              <p
                style="
                  margin: 8px 0 0;
                  font-size: 14px;
                "
              >
                Panel administrativo
              </p>
            </div>

            <div style="padding: 30px;">
              <h2
                style="
                  margin-top: 0;
                  text-align: center;
                  font-size: 21px;
                "
              >
                Código de verificación
              </h2>

              <p
                style="
                  margin: 18px 0;
                  line-height: 1.6;
                "
              >
                Se solicitó iniciar sesión en el panel
                administrativo. Utilice el siguiente código
                para continuar:
              </p>

              <div
                style="
                  margin: 28px 0;
                  padding: 18px;
                  background-color: #f4f8f5;
                  border: 2px solid #d0a93b;
                  border-radius: 10px;
                  text-align: center;
                  font-size: 34px;
                  font-weight: bold;
                  letter-spacing: 8px;
                  color: #185c37;
                "
              >
                ${codigo}
              </div>

              <p
                style="
                  text-align: center;
                  line-height: 1.6;
                "
              >
                Este código vence en
                <strong>
                  ${minutosVigencia} minutos
                </strong>.
              </p>

              <p
                style="
                  margin-top: 24px;
                  padding: 14px;
                  background-color: #fff8e5;
                  border-radius: 8px;
                  line-height: 1.5;
                  font-size: 14px;
                "
              >
                No comparta este código. El personal del liceo
                nunca le solicitará su código de verificación.
              </p>

              <p
                style="
                  margin-bottom: 0;
                  color: #66736d;
                  font-size: 13px;
                  line-height: 1.5;
                "
              >
                Si usted no intentó iniciar sesión, puede
                ignorar este mensaje.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.enviarCorreo({
      destinatario,
      asunto,
      texto,
      html
    });
  }

  /**
   * Cierra las conexiones SMTP abiertas.
   *
   * @returns {void}
   */
  cerrarConexion() {
    if (
      this.transportador &&
      typeof this.transportador.close ===
        "function"
    ) {
      this.transportador.close();
    }

    this.transportador = null;
  }
}

const correoService = new CorreoService();

module.exports = correoService;