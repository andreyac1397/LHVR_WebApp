/*
 * Módulo de recuperación de contraseña.
 *
 * Controla tres etapas:
 * 1. Solicitar el código mediante correo.
 * 2. Verificar el código recibido.
 * 3. Crear una contraseña nueva.
 *
 * Los tokens temporales se guardan únicamente
 * en sessionStorage. Las contraseñas nunca se almacenan.
 */

(function configurarRecuperacionContrasena(global) {
  "use strict";

  const apiClient =
    global.API_ADMIN_CLIENT;

  const configuracion =
    global.API_ADMIN_CONFIG;

  if (!apiClient || !configuracion) {
    throw new Error(
      "No se pudo cargar la configuración de recuperación. " +
      "Verifique que api-admin.config.js y api-client.js " +
      "se carguen antes de recuperar-contrasena.js."
    );
  }

  const endpoints =
    configuracion.endpoints.autenticacion;

  const CLAVE_TOKEN_RECUPERACION =
    "lhvr_token_recuperacion";

  const CLAVE_CORREO_RECUPERACION =
    "lhvr_correo_recuperacion";

  const CLAVE_EXPIRACION_RECUPERACION =
    "lhvr_expiracion_recuperacion";

  const CLAVE_TOKEN_RESTABLECIMIENTO =
    "lhvr_token_restablecimiento";

  const CLAVE_EXPIRACION_RESTABLECIMIENTO =
    "lhvr_expiracion_restablecimiento";

  const RUTA_INICIAR_SESION =
    "iniciar-sesion.html";

  /**
   * Solicita el envío del código.
   *
   * @param {object} datos
   * @returns {Promise<object>}
   */
  async function solicitarRecuperacion(datos) {
    return apiClient.post(
      endpoints.solicitarRecuperacion,
      datos
    );
  }

  /**
   * Verifica el código recibido.
   *
   * @param {object} datos
   * @returns {Promise<object>}
   */
  async function verificarCodigoRecuperacion(
    datos
  ) {
    return apiClient.post(
      endpoints.verificarCodigoRecuperacion,
      datos
    );
  }

  /**
   * Establece la contraseña nueva.
   *
   * @param {object} datos
   * @returns {Promise<object>}
   */
  async function restablecerContrasena(datos) {
    return apiClient.post(
      endpoints.restablecerContrasena,
      datos
    );
  }

  /**
   * Guarda los datos de la primera etapa.
   *
   * @param {object} datos
   */
  function guardarSolicitudRecuperacion(datos) {
    if (!datos?.tokenRecuperacion) {
      throw new Error(
        "El servidor no devolvió el token de recuperación."
      );
    }

    sessionStorage.setItem(
      CLAVE_TOKEN_RECUPERACION,
      datos.tokenRecuperacion
    );

    sessionStorage.setItem(
      CLAVE_CORREO_RECUPERACION,
      datos.correoDestino || ""
    );

    sessionStorage.setItem(
      CLAVE_EXPIRACION_RECUPERACION,
      datos.fechaExpiracion || ""
    );
  }

  function cargarSolicitudDesdeEnlace() {
    const parametros = new URLSearchParams(global.location.search);
    const tokenRecuperacion = String(parametros.get("tokenRecuperacion") || "").trim();
    if (!tokenRecuperacion) return;
    const correo = normalizarCorreo(parametros.get("correo") || "");
    sessionStorage.setItem(CLAVE_TOKEN_RECUPERACION, tokenRecuperacion);
    sessionStorage.setItem(CLAVE_CORREO_RECUPERACION, correo);
    sessionStorage.setItem(CLAVE_EXPIRACION_RECUPERACION, "");
    global.history.replaceState({}, document.title, global.location.pathname);
  }

  /**
   * Guarda el token autorizado para
   * crear la contraseña nueva.
   *
   * @param {object} datos
   */
  function guardarTokenRestablecimiento(
    datos
  ) {
    if (!datos?.tokenRestablecimiento) {
      throw new Error(
        "El servidor no devolvió el token de restablecimiento."
      );
    }

    sessionStorage.setItem(
      CLAVE_TOKEN_RESTABLECIMIENTO,
      datos.tokenRestablecimiento
    );

    sessionStorage.setItem(
      CLAVE_EXPIRACION_RESTABLECIMIENTO,
      datos.fechaExpiracion || ""
    );
  }

  function obtenerTokenRecuperacion() {
    return sessionStorage.getItem(
      CLAVE_TOKEN_RECUPERACION
    );
  }

  function obtenerCorreoRecuperacion() {
    return (
      sessionStorage.getItem(
        CLAVE_CORREO_RECUPERACION
      ) || ""
    );
  }

  function obtenerTokenRestablecimiento() {
    return sessionStorage.getItem(
      CLAVE_TOKEN_RESTABLECIMIENTO
    );
  }

  /**
   * Elimina todos los datos temporales
   * del proceso de recuperación.
   */
  function limpiarDatosRecuperacion() {
    sessionStorage.removeItem(
      CLAVE_TOKEN_RECUPERACION
    );

    sessionStorage.removeItem(
      CLAVE_CORREO_RECUPERACION
    );

    sessionStorage.removeItem(
      CLAVE_EXPIRACION_RECUPERACION
    );

    sessionStorage.removeItem(
      CLAVE_TOKEN_RESTABLECIMIENTO
    );

    sessionStorage.removeItem(
      CLAVE_EXPIRACION_RESTABLECIMIENTO
    );
  }

  /**
   * Normaliza el correo.
   *
   * @param {*} correo
   * @returns {string}
   */
  function normalizarCorreo(correo) {
    return String(correo || "")
      .trim()
      .toLowerCase();
  }

  /**
   * Comprueba el formato del correo.
   *
   * @param {string} correo
   * @returns {boolean}
   */
  function correoTieneFormatoValido(correo) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      correo
    );
  }

  /**
   * Muestra un mensaje general.
   *
   * @param {HTMLElement|null} elemento
   * @param {string} mensaje
   * @param {"error"|"exito"|"informacion"} tipo
   */
  function mostrarMensaje(
    elemento,
    mensaje,
    tipo = "error"
  ) {
    if (!elemento) {
      return;
    }

    elemento.textContent = mensaje;

    elemento.className =
      `autenticacion__mensaje ` +
      `autenticacion__mensaje--${tipo}`;

    elemento.hidden = false;
  }

  /**
   * Oculta el mensaje general.
   *
   * @param {HTMLElement|null} elemento
   */
  function ocultarMensaje(elemento) {
    if (!elemento) {
      return;
    }

    elemento.textContent = "";
    elemento.className =
      "autenticacion__mensaje";
    elemento.hidden = true;
  }

  /**
   * Muestra el error de un campo.
   *
   * @param {HTMLInputElement|null} entrada
   * @param {HTMLElement|null} elementoError
   * @param {string} mensaje
   */
  function mostrarErrorCampo(
    entrada,
    elementoError,
    mensaje
  ) {
    entrada?.setAttribute(
      "aria-invalid",
      "true"
    );

    if (elementoError) {
      elementoError.textContent =
        mensaje;
    }
  }

  /**
   * Limpia el error de un campo.
   *
   * @param {HTMLInputElement|null} entrada
   * @param {HTMLElement|null} elementoError
   */
  function limpiarErrorCampo(
    entrada,
    elementoError
  ) {
    entrada?.removeAttribute(
      "aria-invalid"
    );

    if (elementoError) {
      elementoError.textContent = "";
    }
  }

  /**
   * Configura el botón para mostrar
   * u ocultar una contraseña.
   *
   * @param {HTMLInputElement|null} entrada
   * @param {HTMLButtonElement|null} boton
   */
  function configurarMostrarContrasena(
    entrada,
    boton
  ) {
    if (!entrada || !boton) {
      return;
    }

    boton.addEventListener(
      "click",
      () => {
        const estaOculta =
          entrada.type === "password";

        entrada.type =
          estaOculta
            ? "text"
            : "password";

        boton.textContent =
          estaOculta
            ? "Ocultar"
            : "Mostrar";

        boton.setAttribute(
          "aria-pressed",
          String(estaOculta)
        );

        boton.setAttribute(
          "aria-label",
          estaOculta
            ? "Ocultar contraseña"
            : "Mostrar contraseña"
        );

        entrada.focus();
      }
    );
  }

  /**
   * Activa o desactiva un formulario
   * mientras se realiza una solicitud.
   *
   * @param {object} elementos
   * @param {boolean} cargando
   * @param {string} textoCargando
   * @param {string} textoNormal
   */
  function establecerCargando(
    elementos,
    cargando,
    textoCargando,
    textoNormal
  ) {
    elementos.formulario?.setAttribute(
      "aria-busy",
      String(cargando)
    );

    if (elementos.boton) {
      elementos.boton.disabled =
        cargando;
    }

    for (
      const entrada of
      elementos.entradas || []
    ) {
      if (entrada) {
        entrada.disabled =
          cargando;
      }
    }

    for (
      const botonSecundario of
      elementos.botonesSecundarios || []
    ) {
      if (botonSecundario) {
        botonSecundario.disabled =
          cargando;
      }
    }

    if (elementos.cargador) {
      elementos.cargador.hidden =
        !cargando;
    }

    if (elementos.textoBoton) {
      elementos.textoBoton.textContent =
        cargando
          ? textoCargando
          : textoNormal;
    }
  }

  /**
   * Cambia la etapa visible.
   *
   * @param {number} numeroPaso
   * @param {object} elementos
   */
  function mostrarPaso(
    numeroPaso,
    elementos
  ) {
    if (elementos.pasoCorreo) {
      elementos.pasoCorreo.hidden =
        numeroPaso !== 1;
    }

    if (elementos.pasoCodigo) {
      elementos.pasoCodigo.hidden =
        numeroPaso !== 2;
    }

    if (elementos.pasoContrasena) {
      elementos.pasoContrasena.hidden =
        numeroPaso !== 3;
    }

    if (elementos.descripcion) {
      if (numeroPaso === 1) {
        elementos.descripcion.textContent =
          "Ingrese el correo asociado a su cuenta administrativa.";
      }

      if (numeroPaso === 2) {
        elementos.descripcion.textContent =
          "Ingrese el código de recuperación enviado a su correo.";
      }

      if (numeroPaso === 3) {
        elementos.descripcion.textContent =
          "Cree una contraseña nueva para recuperar el acceso.";
      }
    }

    if (numeroPaso === 1) {
      elementos.correo?.focus();
    }

    if (numeroPaso === 2) {
      elementos.codigo?.focus();
    }

    if (numeroPaso === 3) {
      elementos.contrasenaNueva?.focus();
    }
  }

  /**
   * Valida el formulario del correo.
   *
   * @param {object} elementos
   * @returns {object|null}
   */
  function validarSolicitud(elementos) {
    limpiarErrorCampo(
      elementos.correo,
      elementos.errorCorreo
    );

    const correo =
      normalizarCorreo(
        elementos.correo?.value
      );

    if (!correo) {
      mostrarErrorCampo(
        elementos.correo,
        elementos.errorCorreo,
        "Ingrese el correo electrónico."
      );

      return null;
    }

    if (!correoTieneFormatoValido(correo)) {
      mostrarErrorCampo(
        elementos.correo,
        elementos.errorCorreo,
        "Ingrese un correo electrónico válido."
      );

      return null;
    }

    return {
      correo
    };
  }

  /**
   * Valida el código de recuperación.
   *
   * @param {object} elementos
   * @returns {string|null}
   */
  function validarCodigo(elementos) {
    limpiarErrorCampo(
      elementos.codigo,
      elementos.errorCodigo
    );

    const codigo =
      String(
        elementos.codigo?.value || ""
      ).trim();

    if (!codigo) {
      mostrarErrorCampo(
        elementos.codigo,
        elementos.errorCodigo,
        "Ingrese el código recibido."
      );

      return null;
    }

    if (!/^\d{6}$/.test(codigo)) {
      mostrarErrorCampo(
        elementos.codigo,
        elementos.errorCodigo,
        "El código debe contener exactamente seis números."
      );

      return null;
    }

    return codigo;
  }

  /**
   * Valida las contraseñas nuevas.
   *
   * @param {object} elementos
   * @returns {object|null}
   */
  function validarContrasenas(elementos) {
    limpiarErrorCampo(
      elementos.contrasenaNueva,
      elementos.errorContrasenaNueva
    );

    limpiarErrorCampo(
      elementos.confirmacion,
      elementos.errorConfirmacion
    );

    const contrasenaNueva =
      elementos.contrasenaNueva?.value ?? "";

    const confirmarContrasenaNueva =
      elementos.confirmacion?.value ?? "";

    let formularioValido = true;

    if (!contrasenaNueva) {
      mostrarErrorCampo(
        elementos.contrasenaNueva,
        elementos.errorContrasenaNueva,
        "Ingrese la contraseña nueva."
      );

      formularioValido = false;
    } else {
      if (contrasenaNueva.length < 12) {
        mostrarErrorCampo(
          elementos.contrasenaNueva,
          elementos.errorContrasenaNueva,
          "La contraseña debe contener al menos 12 caracteres."
        );

        formularioValido = false;
      } else if (
        contrasenaNueva.length > 128
      ) {
        mostrarErrorCampo(
          elementos.contrasenaNueva,
          elementos.errorContrasenaNueva,
          "La contraseña no puede superar los 128 caracteres."
        );

        formularioValido = false;
      } else if (
        !/[a-z]/.test(contrasenaNueva)
      ) {
        mostrarErrorCampo(
          elementos.contrasenaNueva,
          elementos.errorContrasenaNueva,
          "Debe incluir al menos una letra minúscula."
        );

        formularioValido = false;
      } else if (
        !/[A-Z]/.test(contrasenaNueva)
      ) {
        mostrarErrorCampo(
          elementos.contrasenaNueva,
          elementos.errorContrasenaNueva,
          "Debe incluir al menos una letra mayúscula."
        );

        formularioValido = false;
      } else if (
        !/[0-9]/.test(contrasenaNueva)
      ) {
        mostrarErrorCampo(
          elementos.contrasenaNueva,
          elementos.errorContrasenaNueva,
          "Debe incluir al menos un número."
        );

        formularioValido = false;
      } else if (
        !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(
          contrasenaNueva
        )
      ) {
        mostrarErrorCampo(
          elementos.contrasenaNueva,
          elementos.errorContrasenaNueva,
          "Debe incluir al menos un carácter especial."
        );

        formularioValido = false;
      }
    }

    if (!confirmarContrasenaNueva) {
      mostrarErrorCampo(
        elementos.confirmacion,
        elementos.errorConfirmacion,
        "Confirme la contraseña nueva."
      );

      formularioValido = false;
    } else if (
      contrasenaNueva !==
      confirmarContrasenaNueva
    ) {
      mostrarErrorCampo(
        elementos.confirmacion,
        elementos.errorConfirmacion,
        "Las contraseñas no coinciden."
      );

      formularioValido = false;
    }

    if (!formularioValido) {
      return null;
    }

    return {
      contrasenaNueva,
      confirmarContrasenaNueva
    };
  }

  /**
   * Muestra los errores enviados
   * por el backend debajo de cada campo.
   *
   * @param {object} error
   * @param {object} elementos
   */
  function mostrarErroresBackend(
    error,
    elementos
  ) {
    if (!Array.isArray(error.errores)) {
      return;
    }

    for (const detalle of error.errores) {
      if (detalle.campo === "correo") {
        mostrarErrorCampo(
          elementos.correo,
          elementos.errorCorreo,
          detalle.mensaje
        );
      }

      if (detalle.campo === "codigo") {
        mostrarErrorCampo(
          elementos.codigo,
          elementos.errorCodigo,
          detalle.mensaje
        );
      }

      if (
        detalle.campo ===
        "contrasenaNueva"
      ) {
        mostrarErrorCampo(
          elementos.contrasenaNueva,
          elementos.errorContrasenaNueva,
          detalle.mensaje
        );
      }

      if (
        detalle.campo ===
        "confirmarContrasenaNueva"
      ) {
        mostrarErrorCampo(
          elementos.confirmacion,
          elementos.errorConfirmacion,
          detalle.mensaje
        );
      }
    }
  }

  /**
   * Configura los tres formularios
   * de recuperación.
   */
  function configurarFormularios() {
    cargarSolicitudDesdeEnlace();
    const formularioCorreo =
      document.getElementById(
        "formularioSolicitarRecuperacion"
      );

    if (!formularioCorreo) {
      return;
    }

    const elementos = {
      mensaje:
        document.getElementById(
          "mensajeRecuperacion"
        ),

      descripcion:
        document.getElementById(
          "descripcionRecuperacion"
        ),

      pasoCorreo:
        document.getElementById(
          "pasoSolicitarCodigo"
        ),

      pasoCodigo:
        document.getElementById(
          "pasoVerificarRecuperacion"
        ),

      pasoContrasena:
        document.getElementById(
          "pasoNuevaContrasena"
        ),

      formularioCorreo,

      correo:
        document.getElementById(
          "correoRecuperacion"
        ),

      errorCorreo:
        document.getElementById(
          "errorCorreoRecuperacion"
        ),

      botonCorreo:
        document.getElementById(
          "botonSolicitarCodigo"
        ),

      cargadorCorreo:
        document.getElementById(
          "cargadorSolicitarCodigo"
        ),

      textoBotonCorreo:
        document.querySelector(
          "#botonSolicitarCodigo " +
          ".boton-autenticacion__texto"
        ),

      formularioCodigo:
        document.getElementById(
          "formularioVerificarRecuperacion"
        ),

      codigo:
        document.getElementById(
          "codigoRecuperacion"
        ),

      errorCodigo:
        document.getElementById(
          "errorCodigoRecuperacion"
        ),

      correoDestino:
        document.getElementById(
          "correoDestinoRecuperacion"
        ),

      botonCodigo:
        document.getElementById(
          "botonVerificarRecuperacion"
        ),

      cargadorCodigo:
        document.getElementById(
          "cargadorVerificarRecuperacion"
        ),

      textoBotonCodigo:
        document.querySelector(
          "#botonVerificarRecuperacion " +
          ".boton-autenticacion__texto"
        ),

      formularioContrasena:
        document.getElementById(
          "formularioRestablecerContrasena"
        ),

      contrasenaNueva:
        document.getElementById(
          "contrasenaNuevaRecuperacion"
        ),

      errorContrasenaNueva:
        document.getElementById(
          "errorNuevaContrasena"
        ),

      confirmacion:
        document.getElementById(
          "confirmarContrasenaRecuperacion"
        ),

      errorConfirmacion:
        document.getElementById(
          "errorConfirmarContrasenaRecuperacion"
        ),

      botonContrasena:
        document.getElementById(
          "botonRestablecerContrasena"
        ),

      cargadorContrasena:
        document.getElementById(
          "cargadorRestablecerContrasena"
        ),

      textoBotonContrasena:
        document.querySelector(
          "#botonRestablecerContrasena " +
          ".boton-autenticacion__texto"
        ),

      botonMostrarContrasena:
        document.getElementById(
          "botonMostrarNuevaContrasena"
        ),

      botonMostrarConfirmacion:
        document.getElementById(
          "botonMostrarConfirmacionRecuperacion"
        ),

      enlaceVolver:
        document.getElementById(
          "enlaceVolverInicioSesion"
        )
    };

    configurarMostrarContrasena(
      elementos.contrasenaNueva,
      elementos.botonMostrarContrasena
    );

    configurarMostrarContrasena(
      elementos.confirmacion,
      elementos.botonMostrarConfirmacion
    );

    elementos.correo?.addEventListener(
      "input",
      () => {
        limpiarErrorCampo(
          elementos.correo,
          elementos.errorCorreo
        );

        ocultarMensaje(
          elementos.mensaje
        );
      }
    );

    elementos.codigo?.addEventListener(
      "input",
      () => {
        elementos.codigo.value =
          elementos.codigo.value
            .replace(/\D/g, "")
            .slice(0, 6);

        limpiarErrorCampo(
          elementos.codigo,
          elementos.errorCodigo
        );

        ocultarMensaje(
          elementos.mensaje
        );
      }
    );

    elementos.contrasenaNueva?.addEventListener(
      "input",
      () => {
        limpiarErrorCampo(
          elementos.contrasenaNueva,
          elementos.errorContrasenaNueva
        );

        ocultarMensaje(
          elementos.mensaje
        );
      }
    );

    elementos.confirmacion?.addEventListener(
      "input",
      () => {
        limpiarErrorCampo(
          elementos.confirmacion,
          elementos.errorConfirmacion
        );

        ocultarMensaje(
          elementos.mensaje
        );
      }
    );

    elementos.enlaceVolver?.addEventListener(
      "click",
      () => {
        limpiarDatosRecuperacion();
      }
    );

    formularioCorreo.addEventListener(
      "submit",
      async (evento) => {
        evento.preventDefault();

        ocultarMensaje(
          elementos.mensaje
        );

        const datos =
          validarSolicitud(elementos);

        if (!datos) {
          mostrarMensaje(
            elementos.mensaje,
            "Revise el correo indicado.",
            "error"
          );

          return;
        }

        establecerCargando(
          {
            formulario:
              formularioCorreo,

            boton:
              elementos.botonCorreo,

            cargador:
              elementos.cargadorCorreo,

            textoBoton:
              elementos.textoBotonCorreo,

            entradas: [
              elementos.correo
            ]
          },
          true,
          "Enviando...",
          "Enviar código"
        );

        try {
          const respuesta =
            await solicitarRecuperacion(
              datos
            );

          guardarSolicitudRecuperacion(
            respuesta.datos
          );

          if (elementos.correoDestino) {
            elementos.correoDestino.textContent =
              respuesta.datos
                ?.correoDestino ||
              "Correo del administrador";
          }

          mostrarMensaje(
            elementos.mensaje,
            respuesta.mensaje ||
            "El código fue enviado correctamente.",
            "exito"
          );

          mostrarPaso(
            2,
            elementos
          );
        } catch (error) {
          mostrarErroresBackend(
            error,
            elementos
          );

          let mensaje =
            error.message ||
            "No fue posible enviar el código.";

          if (error.statusCode === 0) {
            mensaje =
              "No fue posible conectar con el servidor. Verifique que el backend esté encendido.";
          }

          mostrarMensaje(
            elementos.mensaje,
            mensaje,
            "error"
          );
        } finally {
          establecerCargando(
            {
              formulario:
                formularioCorreo,

              boton:
                elementos.botonCorreo,

              cargador:
                elementos.cargadorCorreo,

              textoBoton:
                elementos.textoBotonCorreo,

              entradas: [
                elementos.correo
              ]
            },
            false,
            "Enviando...",
            "Enviar código"
          );
        }
      }
    );

    elementos.formularioCodigo?.addEventListener(
      "submit",
      async (evento) => {
        evento.preventDefault();

        ocultarMensaje(
          elementos.mensaje
        );

        const codigo =
          validarCodigo(elementos);

        if (!codigo) {
          mostrarMensaje(
            elementos.mensaje,
            "Revise el código indicado.",
            "error"
          );

          return;
        }

        const tokenRecuperacion =
          obtenerTokenRecuperacion();

        if (!tokenRecuperacion) {
          mostrarMensaje(
            elementos.mensaje,
            "La solicitud de recuperación venció. Solicite un código nuevo.",
            "error"
          );

          limpiarDatosRecuperacion();

          mostrarPaso(
            1,
            elementos
          );

          return;
        }

        establecerCargando(
          {
            formulario:
              elementos.formularioCodigo,

            boton:
              elementos.botonCodigo,

            cargador:
              elementos.cargadorCodigo,

            textoBoton:
              elementos.textoBotonCodigo,

            entradas: [
              elementos.codigo
            ]
          },
          true,
          "Verificando...",
          "Verificar código"
        );

        try {
          const respuesta =
            await verificarCodigoRecuperacion({
              tokenRecuperacion,
              codigo
            });

          guardarTokenRestablecimiento(
            respuesta.datos
          );

          mostrarMensaje(
            elementos.mensaje,
            respuesta.mensaje ||
            "Código verificado correctamente.",
            "exito"
          );

          mostrarPaso(
            3,
            elementos
          );
        } catch (error) {
          mostrarErroresBackend(
            error,
            elementos
          );

          let mensaje =
            error.message ||
            "No fue posible verificar el código.";

          if (error.statusCode === 0) {
            mensaje =
              "No fue posible conectar con el servidor. Verifique que el backend esté encendido.";
          }

          if (
            error.codigo ===
              "TOKEN_RECUPERACION_INVALIDO" ||
            error.codigo ===
              "CODIGO_RECUPERACION_EXPIRADO" ||
            error.codigo ===
              "MAXIMO_INTENTOS_CODIGO"
          ) {
            limpiarDatosRecuperacion();

            mostrarPaso(
              1,
              elementos
            );
          }

          mostrarMensaje(
            elementos.mensaje,
            mensaje,
            "error"
          );

          if (elementos.codigo) {
            elementos.codigo.value = "";
          }
        } finally {
          establecerCargando(
            {
              formulario:
                elementos.formularioCodigo,

              boton:
                elementos.botonCodigo,

              cargador:
                elementos.cargadorCodigo,

              textoBoton:
                elementos.textoBotonCodigo,

              entradas: [
                elementos.codigo
              ]
            },
            false,
            "Verificando...",
            "Verificar código"
          );
        }
      }
    );

    elementos.formularioContrasena?.addEventListener(
      "submit",
      async (evento) => {
        evento.preventDefault();

        ocultarMensaje(
          elementos.mensaje
        );

        const contrasenas =
          validarContrasenas(
            elementos
          );

        if (!contrasenas) {
          mostrarMensaje(
            elementos.mensaje,
            "Revise las contraseñas indicadas.",
            "error"
          );

          return;
        }

        const tokenRestablecimiento =
          obtenerTokenRestablecimiento();

        if (!tokenRestablecimiento) {
          mostrarMensaje(
            elementos.mensaje,
            "La autorización para cambiar la contraseña venció. Inicie nuevamente la recuperación.",
            "error"
          );

          limpiarDatosRecuperacion();

          mostrarPaso(
            1,
            elementos
          );

          return;
        }

        establecerCargando(
          {
            formulario:
              elementos.formularioContrasena,

            boton:
              elementos.botonContrasena,

            cargador:
              elementos.cargadorContrasena,

            textoBoton:
              elementos.textoBotonContrasena,

            entradas: [
              elementos.contrasenaNueva,
              elementos.confirmacion
            ],

            botonesSecundarios: [
              elementos.botonMostrarContrasena,
              elementos.botonMostrarConfirmacion
            ]
          },
          true,
          "Restableciendo...",
          "Restablecer contraseña"
        );

        let procesoCompletado = false;

        try {
          const respuesta =
            await restablecerContrasena({
              tokenRestablecimiento,
              ...contrasenas
            });

          procesoCompletado = true;

          limpiarDatosRecuperacion();

          if (elementos.contrasenaNueva) {
            elementos.contrasenaNueva.value =
              "";
          }

          if (elementos.confirmacion) {
            elementos.confirmacion.value =
              "";
          }

          mostrarMensaje(
            elementos.mensaje,
            respuesta.mensaje ||
            "La contraseña fue restablecida correctamente.",
            "exito"
          );

          setTimeout(
            () => {
              global.location.replace(
                RUTA_INICIAR_SESION
              );
            },
            1800
          );
        } catch (error) {
          mostrarErroresBackend(
            error,
            elementos
          );

          let mensaje =
            error.message ||
            "No fue posible restablecer la contraseña.";

          if (error.statusCode === 0) {
            mensaje =
              "No fue posible conectar con el servidor. Verifique que el backend esté encendido.";
          }

          if (
            error.codigo ===
            "TOKEN_RESTABLECIMIENTO_INVALIDO"
          ) {
            limpiarDatosRecuperacion();

            mostrarPaso(
              1,
              elementos
            );
          }

          mostrarMensaje(
            elementos.mensaje,
            mensaje,
            "error"
          );

          if (elementos.contrasenaNueva) {
            elementos.contrasenaNueva.value =
              "";
          }

          if (elementos.confirmacion) {
            elementos.confirmacion.value =
              "";
          }
        } finally {
          if (!procesoCompletado) {
            establecerCargando(
              {
                formulario:
                  elementos.formularioContrasena,

                boton:
                  elementos.botonContrasena,

                cargador:
                  elementos.cargadorContrasena,

                textoBoton:
                  elementos.textoBotonContrasena,

                entradas: [
                  elementos.contrasenaNueva,
                  elementos.confirmacion
                ],

                botonesSecundarios: [
                  elementos.botonMostrarContrasena,
                  elementos.botonMostrarConfirmacion
                ]
              },
              false,
              "Restableciendo...",
              "Restablecer contraseña"
            );
          }
        }
      }
    );

    /*
     * Recupera la etapa correcta cuando
     * la página se recarga accidentalmente.
     */
    const tokenRestablecimiento =
      obtenerTokenRestablecimiento();

    const tokenRecuperacion =
      obtenerTokenRecuperacion();

    if (tokenRestablecimiento) {
      mostrarPaso(
        3,
        elementos
      );
    } else if (tokenRecuperacion) {
      if (elementos.correoDestino) {
        elementos.correoDestino.textContent =
          obtenerCorreoRecuperacion() ||
          "Correo del administrador";
      }

      mostrarPaso(
        2,
        elementos
      );
    } else {
      mostrarPaso(
        1,
        elementos
      );
    }
  }

  global.RECUPERACION_CONTRASENA_ADMIN =
    Object.freeze({
      solicitarRecuperacion,
      verificarCodigoRecuperacion,
      restablecerContrasena,
      obtenerTokenRecuperacion,
      obtenerTokenRestablecimiento,
      limpiarDatosRecuperacion
    });

  if (
    document.readyState === "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      configurarFormularios
    );
  } else {
    configurarFormularios();
  }
})(window);
