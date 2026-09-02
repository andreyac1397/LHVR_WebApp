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

  obtenerUrlPanel(ruta = "") {
    const base = String(
      process.env.PANEL_ADMIN_URL ||
      "http://127.0.0.1:5500/panel-administrativo"
    ).replace(/\/+$/, "");

    return `${base}/${String(ruta).replace(/^\/+/, "")}`;
  }

  async enviarAccesoTemporalAdministrador(datos) {
    const destinatario = String(
      datos?.destinatario || ""
    )
      .trim()
      .toLowerCase();

    const nombreCompleto = String(
      datos?.nombreCompleto ||
      "Administrador"
    ).trim();

    const contrasenaTemporal = String(
      datos?.contrasenaTemporal || ""
    );

    if (
      !this.correoEsValido(destinatario) ||
      !contrasenaTemporal
    ) {
      throw this.crearError(
        "Los datos del acceso temporal no son válidos.",
        400,
        "ACCESO_TEMPORAL_INVALIDO"
      );
    }

    const urlIngreso =
      this.obtenerUrlPanel(
        "pages/autenticacion/iniciar-sesion.html"
      );

    const asunto =
      "Acceso temporal al panel administrativo LHVR";

    const texto = [
      `Hola ${nombreCompleto},`,
      "",
      "Se creó un acceso administrativo para usted.",
      `Correo: ${destinatario}`,
      `Contraseña temporal: ${contrasenaTemporal}`,
      "",
      "Después de ingresar y completar la verificación de dos pasos deberá crear una contraseña personal.",
      `Ingresar: ${urlIngreso}`,
      "",
      "No comparta esta contraseña. Si no esperaba este acceso, comuníquelo al liceo."
    ].join("\n");

    const html = `
      <!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Acceso temporal</title></head>
      <body style="margin:0;padding:24px;background:#f3f5f4;font-family:Arial,Helvetica,sans-serif;color:#26332d;">
        <div style="max-width:620px;margin:auto;background:#fff;border:1px solid #dfe6e2;border-radius:12px;overflow:hidden;">
          <div style="padding:24px;background:#185c37;color:#fff;text-align:center;"><h1 style="margin:0;font-size:22px;">Liceo Hernán Vargas Ramírez</h1><p style="margin:8px 0 0;">Panel administrativo</p></div>
          <div style="padding:30px;"><h2 style="margin-top:0;">Bienvenido al panel administrativo</h2>
            <p style="line-height:1.6;">Hola <strong>${this.escaparHtml(nombreCompleto)}</strong>. Utilice estas credenciales temporales para su primer ingreso:</p>
            <div style="padding:18px;background:#f4f8f5;border:1px solid #bdd1c4;border-radius:10px;">
              <p style="margin:0 0 12px;"><strong>Correo:</strong> ${this.escaparHtml(destinatario)}</p>
              <p style="margin:0;"><strong>Contraseña temporal:</strong> <code style="font-size:16px;">${this.escaparHtml(contrasenaTemporal)}</code></p>
            </div>
            <p style="line-height:1.6;">Después de completar la verificación de dos pasos, el sistema le exigirá reemplazarla por una contraseña personal.</p>
            <p style="text-align:center;margin:26px 0;"><a href="${this.escaparHtml(urlIngreso)}" style="display:inline-block;padding:12px 20px;border-radius:8px;background:#185c37;color:#fff;text-decoration:none;font-weight:bold;">Ingresar al panel</a></p>
            <p style="padding:14px;background:#fff8e5;border-radius:8px;font-size:14px;line-height:1.5;">No comparta esta contraseña. Si no esperaba este acceso, comuníquelo al liceo.</p>
          </div>
        </div>
      </body></html>
    `;

    return this.enviarCorreo({
      destinatario,
      asunto,
      texto,
      html
    });
  }

  async enviarCodigoRecuperacion(datos) {
    const destinatario = String(
      datos?.destinatario || ""
    )
      .trim()
      .toLowerCase();

    const codigo = String(
      datos?.codigo || ""
    ).trim();

    const tokenRecuperacion = String(
      datos?.tokenRecuperacion || ""
    ).trim();

    const minutosVigencia = Number(
      datos?.minutosVigencia
    );

    if (
      !this.correoEsValido(destinatario) ||
      !/^\d{6}$/.test(codigo) ||
      !tokenRecuperacion
    ) {
      throw this.crearError(
        "Los datos de recuperación no son válidos.",
        400,
        "CORREO_RECUPERACION_INVALIDO"
      );
    }

    const asunto =
      "Código para recuperar su contraseña";

    const texto = [
      "Liceo Hernán Vargas Ramírez",
      "",
      "Recuperación de acceso",
      "",
      `Código de recuperación: ${codigo}`,
      "",
      `Este código vence en ${minutosVigencia} minutos.`,
      "",
      "No comparta este código con ninguna persona.",
      "",
      "Si usted no solicitó este cambio, ignore este mensaje."
    ].join("\n");

    /*
     * Los correos institucionales @cuc.cr se envían
     * únicamente como texto plano para mejorar la
     * compatibilidad con el filtrado de Microsoft 365.
     */
    if (
      destinatario.endsWith(
        "@cuc.cr"
      )
    ) {
      return this.enviarCorreo({
        destinatario,
        asunto,
        texto,
        html: ""
      });
    }

    /*
     * Para los demás dominios se conserva
     * la plantilla HTML original.
     */
    const url =
      new URL(
        this.obtenerUrlPanel(
          "pages/autenticacion/recuperar-contrasena.html"
        )
      );

    url.searchParams.set(
      "tokenRecuperacion",
      tokenRecuperacion
    );

    url.searchParams.set(
      "correo",
      destinatario
    );

    const textoConEnlace = [
      "Liceo Hernán Vargas Ramírez",
      "",
      `Código de recuperación: ${codigo}`,
      `Vigencia: ${minutosVigencia} minutos.`,
      `Continuar recuperación: ${url.href}`,
      "",
      "Si no solicitó este cambio, ignore el mensaje."
    ].join("\n");

    const html = `
      <!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Recuperar contraseña</title></head>
      <body style="margin:0;padding:24px;background:#f3f5f4;font-family:Arial,Helvetica,sans-serif;color:#26332d;">
        <div style="max-width:600px;margin:auto;background:#fff;border:1px solid #dfe6e2;border-radius:12px;overflow:hidden;">
          <div style="padding:24px;background:#185c37;color:#fff;text-align:center;"><h1 style="margin:0;font-size:22px;">Liceo Hernán Vargas Ramírez</h1><p style="margin:8px 0 0;">Recuperación de acceso</p></div>
          <div style="padding:30px;"><p>Utilice este código para crear una contraseña nueva:</p>
            <div style="margin:24px 0;padding:18px;background:#f4f8f5;border:2px solid #d0a93b;border-radius:10px;text-align:center;font-size:34px;font-weight:bold;letter-spacing:8px;color:#185c37;">${this.escaparHtml(codigo)}</div>
            <p style="text-align:center;">Vence en <strong>${minutosVigencia} minutos</strong>.</p>
            <p style="text-align:center;margin:26px 0;"><a href="${this.escaparHtml(url.href)}" style="display:inline-block;padding:12px 20px;border-radius:8px;background:#185c37;color:#fff;text-decoration:none;font-weight:bold;">Continuar recuperación</a></p>
            <p style="font-size:13px;color:#66736d;">Si no solicitó este cambio, ignore el mensaje.</p>
          </div>
        </div>
      </body></html>
    `;

    return this.enviarCorreo({
      destinatario,
      asunto,
      texto: textoConEnlace,
      html
    });
  }

  /** Convierte contenido administrativo en texto HTML seguro. */
  escaparHtml(valor) {
    return String(valor ?? "").replace(
      /[&<>'"]/g,
      (caracter) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        "\"": "&quot;"
      })[caracter]
    );
  }

  /** Acepta exclusivamente enlaces web aptos para el botón del mensaje. */
  normalizarUrlWeb(valor) {
    try {
      const url =
        new URL(
          String(valor ?? "").trim()
        );

      return [
        "http:",
        "https:"
      ].includes(url.protocol)
        ? url.href
        : null;
    } catch (_error) {
      return null;
    }
  }

  /**
   * Compone un boletín institucional y lo entrega mediante enviarCorreo().
   * No crea transportadores ni lee una configuración SMTP diferente.
   */
  async enviarBoletin(datos) {
    if (
      !datos ||
      typeof datos !== "object" ||
      !datos.boletin
    ) {
      throw this.crearError(
        "Los datos del boletín no son válidos.",
        400,
        "DATOS_BOLETIN_INVALIDOS"
      );
    }

    const boletin =
      datos.boletin;

    const titulo =
      String(
        boletin.titulo ?? ""
      ).trim();

    const tipo =
      String(
        boletin.tipo ?? "Boletín"
      ).trim() ||
      "Boletín";

    const descripcion =
      String(
        boletin.descripcion ?? ""
      ).trim();

    const fecha =
      boletin.fechaInicio
        ? new Intl.DateTimeFormat(
            "es-CR",
            {
              dateStyle: "long",
              timeZone:
                "America/Costa_Rica"
            }
          ).format(
            new Date(
              boletin.fechaInicio
            )
          )
        : "Fecha no indicada";

    const url =
      this.normalizarUrlWeb(
        boletin.url
      );

    if (!titulo) {
      throw this.crearError(
        "El título del boletín es obligatorio.",
        400,
        "TITULO_BOLETIN_OBLIGATORIO"
      );
    }

    const texto = [
      "Liceo Hernán Vargas Ramírez",
      "",
      titulo,
      `Tipo: ${tipo}`,
      `Fecha: ${fecha}`,
      "",
      descripcion ||
        "Consulte la información completa del boletín institucional.",
      ...(
        url
          ? [
              "",
              `Más información: ${url}`
            ]
          : []
      )
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
          <title>${this.escaparHtml(titulo)}</title>
        </head>

        <body
          style="
            margin:0;
            padding:24px;
            background:#f3f5f4;
            font-family:Arial,Helvetica,sans-serif;
            color:#26332d;
          "
        >
          <div
            style="
              max-width:640px;
              margin:0 auto;
              background:#fff;
              border:1px solid #dfe6e2;
              border-radius:12px;
              overflow:hidden;
            "
          >
            <div
              style="
                padding:24px;
                background:#185c37;
                color:#fff;
                text-align:center;
              "
            >
              <h1
                style="
                  margin:0;
                  font-size:22px;
                "
              >
                Liceo Hernán Vargas Ramírez
              </h1>

              <p
                style="
                  margin:8px 0 0;
                  font-size:14px;
                "
              >
                Boletín institucional
              </p>
            </div>

            <div
              style="
                padding:30px;
              "
            >
              <p
                style="
                  margin:0 0 10px;
                  color:#185c37;
                  font-size:14px;
                  font-weight:bold;
                  text-transform:uppercase;
                "
              >
                ${this.escaparHtml(tipo)}
              </p>

              <h2
                style="
                  margin:0 0 18px;
                  font-size:25px;
                  line-height:1.25;
                "
              >
                ${this.escaparHtml(titulo)}
              </h2>

              <p
                style="
                  margin:0 0 22px;
                  color:#66736d;
                  font-size:14px;
                "
              >
                ${this.escaparHtml(fecha)}
              </p>

              <p
                style="
                  margin:0;
                  line-height:1.7;
                  white-space:pre-line;
                "
              >
                ${this.escaparHtml(
                  descripcion ||
                  "Consulte la información completa del boletín institucional."
                )}
              </p>

              ${
                url
                  ? `
                    <p
                      style="
                        margin:28px 0 0;
                        text-align:center;
                      "
                    >
                      <a
                        href="${this.escaparHtml(url)}"
                        style="
                          display:inline-block;
                          padding:12px 20px;
                          border-radius:8px;
                          background:#185c37;
                          color:#fff;
                          text-decoration:none;
                          font-weight:bold;
                        "
                      >
                        Ver boletín / Más información
                      </a>
                    </p>
                  `
                  : ""
              }
            </div>
          </div>
        </body>
      </html>
    `;

    return this.enviarCorreo({
      destinatario:
        datos.destinatario,

      asunto:
        datos.asunto,

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

const correoService =
  new CorreoService();

module.exports =
  correoService;