/*
 * Módulo de autenticación del panel administrativo.
 *
 * Responsabilidades:
 * - Controlar el formulario de inicio de sesión.
 * - Controlar la verificación del código por correo.
 * - Comunicarse con la API mediante api-client.js.
 * - Guardar temporalmente el token de verificación.
 * - Consultar y cerrar la sesión administrativa.
 *
 * La cookie sesion_admin nunca se manipula aquí.
 * El navegador la administra como cookie HttpOnly.
 */

(function configurarAutenticacionAdmin(global) {
  "use strict";

  const apiClient =
    global.API_ADMIN_CLIENT;

  const configuracion =
    global.API_ADMIN_CONFIG;

  if (!apiClient || !configuracion) {
    throw new Error(
      "No se pudo cargar la configuración de autenticación. " +
      "Verifique el orden de los archivos JavaScript."
    );
  }

  const endpoints =
    configuracion.endpoints.autenticacion;

  const CLAVE_TOKEN_VERIFICACION =
    "lhvr_token_verificacion";

  const CLAVE_CORREO_DESTINO =
    "lhvr_correo_destino";

  const CLAVE_EXPIRACION_VERIFICACION =
    "lhvr_expiracion_verificacion";

  const RUTA_INICIAR_SESION =
    "iniciar-sesion.html";

  const RUTA_VERIFICAR_CODIGO =
    "verificar-codigo.html";

  const RUTA_DASHBOARD =
    "../dashboard/dashboard.html";

  const RUTA_CAMBIO_OBLIGATORIO =
    "cambiar-contrasena.html?obligatorio=1";

  /**
   * Guarda los datos temporales necesarios
   * para completar la verificación en dos pasos.
   *
   * @param {object} datos
   */
  function guardarDatosVerificacion(datos) {
    if (!datos?.tokenVerificacion) {
      throw new Error(
        "La API no devolvió el token de verificación."
      );
    }

    sessionStorage.setItem(
      CLAVE_TOKEN_VERIFICACION,
      datos.tokenVerificacion
    );

    sessionStorage.setItem(
      CLAVE_CORREO_DESTINO,
      datos.correoDestino || ""
    );

    sessionStorage.setItem(
      CLAVE_EXPIRACION_VERIFICACION,
      datos.fechaExpiracion || ""
    );
  }

  /**
   * Obtiene el token temporal utilizado
   * para verificar el código.
   *
   * @returns {string|null}
   */
  function obtenerTokenVerificacion() {
    return sessionStorage.getItem(
      CLAVE_TOKEN_VERIFICACION
    );
  }

  /**
   * Obtiene el correo parcialmente oculto
   * devuelto por el backend.
   *
   * @returns {string}
   */
  function obtenerCorreoDestino() {
    return (
      sessionStorage.getItem(
        CLAVE_CORREO_DESTINO
      ) || ""
    );
  }

  /**
   * Obtiene la fecha de vencimiento
   * del proceso de verificación.
   *
   * @returns {string}
   */
  function obtenerExpiracionVerificacion() {
    return (
      sessionStorage.getItem(
        CLAVE_EXPIRACION_VERIFICACION
      ) || ""
    );
  }

  /**
   * Elimina los datos temporales después
   * de completar o cancelar la verificación.
   */
  function limpiarDatosVerificacion() {
    sessionStorage.removeItem(
      CLAVE_TOKEN_VERIFICACION
    );

    sessionStorage.removeItem(
      CLAVE_CORREO_DESTINO
    );

    sessionStorage.removeItem(
      CLAVE_EXPIRACION_VERIFICACION
    );
  }

  /**
   * Inicia la primera etapa del acceso.
   *
   * @param {object} credenciales
   * @param {string} credenciales.correo
   * @param {string} credenciales.contrasena
   * @returns {Promise<object>}
   */
  async function iniciarSesion(credenciales) {
    return apiClient.post(
      endpoints.iniciarSesion,
      credenciales
    );
  }

  /**
   * Verifica el código enviado al correo.
   *
   * @param {object} datos
   * @param {string} datos.tokenVerificacion
   * @param {string} datos.codigo
   * @returns {Promise<object>}
   */
  async function verificarCodigo(datos) {
    return apiClient.post(
      endpoints.verificarCodigo,
      datos
    );
  }

  /**
   * Consulta si existe una sesión activa.
   *
   * @returns {Promise<object>}
   */
  async function obtenerSesion() {
    return apiClient.get(
      endpoints.obtenerSesion
    );
  }

  /**
   * Cierra la sesión administrativa.
   *
   * @returns {Promise<object>}
   */
  async function cerrarSesion() {
    const respuesta =
      await apiClient.post(
        endpoints.cerrarSesion
      );

    limpiarDatosVerificacion();

    return respuesta;
  }

  /**
   * Cambia la contraseña del administrador.
   *
   * @param {object} datos
   * @returns {Promise<object>}
   */
  async function cambiarContrasena(datos) {
    return apiClient.patch(
      endpoints.cambiarContrasena,
      datos
    );
  }

  async function cambiarContrasenaObligatoria(datos) {
    return apiClient.patch(
      endpoints.cambiarContrasenaObligatoria,
      datos
    );
  }

  /**
   * Normaliza el correo antes de enviarlo.
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
   * Comprueba el formato básico del correo.
   *
   * @param {string} correo
   * @returns {boolean}
   */
  function correoTieneFormatoValido(correo) {
    const formatoCorreo =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return formatoCorreo.test(correo);
  }

  /**
   * Cambia el mensaje general del formulario.
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
   * Muestra un mensaje debajo de un campo.
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
    if (entrada) {
      entrada.setAttribute(
        "aria-invalid",
        "true"
      );
    }

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
    if (entrada) {
      entrada.removeAttribute(
        "aria-invalid"
      );
    }

    if (elementoError) {
      elementoError.textContent = "";
    }
  }

  /**
   * Configura el estado de carga del formulario
   * de inicio de sesión.
   *
   * @param {object} elementos
   * @param {boolean} cargando
   */
  function establecerCargandoInicioSesion(
    elementos,
    cargando
  ) {
    if (elementos.formulario) {
      elementos.formulario.setAttribute(
        "aria-busy",
        String(cargando)
      );
    }

    if (elementos.boton) {
      elementos.boton.disabled =
        cargando;
    }

    if (elementos.correo) {
      elementos.correo.disabled =
        cargando;
    }

    if (elementos.contrasena) {
      elementos.contrasena.disabled =
        cargando;
    }

    if (elementos.cargador) {
      elementos.cargador.hidden =
        !cargando;
    }

    if (elementos.textoBoton) {
      elementos.textoBoton.textContent =
        cargando
          ? "Verificando..."
          : "Iniciar sesión";
    }
  }

  /**
   * Configura el estado de carga del formulario
   * de verificación del código.
   *
   * @param {object} elementos
   * @param {boolean} cargando
   */
  function establecerCargandoVerificacion(
    elementos,
    cargando
  ) {
    if (elementos.formulario) {
      elementos.formulario.setAttribute(
        "aria-busy",
        String(cargando)
      );
    }

    if (elementos.boton) {
      elementos.boton.disabled =
        cargando;
    }

    if (elementos.codigo) {
      elementos.codigo.disabled =
        cargando;
    }

    if (elementos.cargador) {
      elementos.cargador.hidden =
        !cargando;
    }

    if (elementos.textoBoton) {
      elementos.textoBoton.textContent =
        cargando
          ? "Verificando..."
          : "Verificar código";
    }
  }

  /**
   * Valida los datos del formulario
   * de inicio de sesión.
   *
   * @param {object} elementos
   * @returns {object|null}
   */
  function validarFormularioInicioSesion(
    elementos
  ) {
    limpiarErrorCampo(
      elementos.correo,
      elementos.errorCorreo
    );

    limpiarErrorCampo(
      elementos.contrasena,
      elementos.errorContrasena
    );

    const correoNormalizado =
      normalizarCorreo(
        elementos.correo?.value
      );

    const valorContrasena =
      elementos.contrasena?.value ?? "";

    let formularioValido = true;

    if (!correoNormalizado) {
      mostrarErrorCampo(
        elementos.correo,
        elementos.errorCorreo,
        "Ingrese el correo electrónico."
      );

      formularioValido = false;
    } else if (
      !correoTieneFormatoValido(
        correoNormalizado
      )
    ) {
      mostrarErrorCampo(
        elementos.correo,
        elementos.errorCorreo,
        "Ingrese un correo electrónico válido."
      );

      formularioValido = false;
    }

    if (!valorContrasena) {
      mostrarErrorCampo(
        elementos.contrasena,
        elementos.errorContrasena,
        "Ingrese la contraseña."
      );

      formularioValido = false;
    } else if (
      valorContrasena.trim().length === 0
    ) {
      mostrarErrorCampo(
        elementos.contrasena,
        elementos.errorContrasena,
        "La contraseña no puede contener únicamente espacios."
      );

      formularioValido = false;
    }

    if (!formularioValido) {
      return null;
    }

    return {
      correo: correoNormalizado,
      contrasena: valorContrasena
    };
  }

  /**
   * Valida el código de seis dígitos.
   *
   * @param {object} elementos
   * @returns {string|null}
   */
  function validarFormularioCodigo(
    elementos
  ) {
    limpiarErrorCampo(
      elementos.codigo,
      elementos.errorCodigo
    );

    const codigo = String(
      elementos.codigo?.value || ""
    ).trim();

    if (!codigo) {
      mostrarErrorCampo(
        elementos.codigo,
        elementos.errorCodigo,
        "Ingrese el código recibido por correo."
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
   * Muestra los errores específicos
   * enviados por el backend.
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
      if (
        detalle.campo === "correo" &&
        elementos.correo
      ) {
        mostrarErrorCampo(
          elementos.correo,
          elementos.errorCorreo,
          detalle.mensaje
        );
      }

      if (
        detalle.campo === "contrasena" &&
        elementos.contrasena
      ) {
        mostrarErrorCampo(
          elementos.contrasena,
          elementos.errorContrasena,
          detalle.mensaje
        );
      }

      if (
        detalle.campo === "codigo" &&
        elementos.codigo
      ) {
        mostrarErrorCampo(
          elementos.codigo,
          elementos.errorCodigo,
          detalle.mensaje
        );
      }
    }
  }

  /**
   * Configura el botón que muestra u oculta
   * la contraseña.
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
          "aria-label",
          estaOculta
            ? "Ocultar contraseña"
            : "Mostrar contraseña"
        );

        boton.setAttribute(
          "aria-pressed",
          String(estaOculta)
        );

        entrada.focus();
      }
    );
  }

  /**
   * Comprueba si ya existe una sesión activa.
   *
   * Cuando existe, redirige directamente
   * al dashboard.
   */
  async function comprobarSesionExistente() {
    try {
      const respuesta =
        await obtenerSesion();

      if (
        respuesta?.datos?.autenticado
      ) {
        if (respuesta.datos.administrador?.requiereCambioContrasena) {
          global.location.replace(RUTA_CAMBIO_OBLIGATORIO);
          return;
        }
        global.location.replace(
          RUTA_DASHBOARD
        );
      }
    } catch (error) {
      /*
       * 401 y 403 son normales cuando
       * todavía no existe una sesión.
       */
      if (
        error.statusCode !== 401 &&
        error.statusCode !== 403 &&
        error.statusCode !== 0
      ) {
        console.warn(
          "No se pudo comprobar la sesión:",
          error.message
        );
      }
    }
  }

  /**
   * Configura el formulario de inicio
   * de sesión.
   */
  function configurarFormularioInicioSesion() {
    const formulario =
      document.getElementById(
        "formularioInicioSesion"
      );

    if (!formulario) {
      return;
    }

    const elementos = {
      formulario,

      correo:
        document.getElementById(
          "correo"
        ),

      contrasena:
        document.getElementById(
          "contrasena"
        ),

      errorCorreo:
        document.getElementById(
          "errorCorreo"
        ),

      errorContrasena:
        document.getElementById(
          "errorContrasena"
        ),

      mensaje:
        document.getElementById(
          "mensajeAutenticacion"
        ),

      boton:
        document.getElementById(
          "botonIniciarSesion"
        ),

      cargador:
        document.getElementById(
          "cargadorInicioSesion"
        ),

      textoBoton:
        document.querySelector(
          "#botonIniciarSesion " +
          ".boton-autenticacion__texto"
        ),

      botonMostrarContrasena:
        document.getElementById(
          "botonMostrarContrasena"
        )
    };

    configurarMostrarContrasena(
      elementos.contrasena,
      elementos.botonMostrarContrasena
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

    elementos.contrasena?.addEventListener(
      "input",
      () => {
        limpiarErrorCampo(
          elementos.contrasena,
          elementos.errorContrasena
        );

        ocultarMensaje(
          elementos.mensaje
        );
      }
    );

    formulario.addEventListener(
      "submit",
      async (evento) => {
        evento.preventDefault();

        ocultarMensaje(
          elementos.mensaje
        );

        const credenciales =
          validarFormularioInicioSesion(
            elementos
          );

        if (!credenciales) {
          mostrarMensaje(
            elementos.mensaje,
            "Revise los datos indicados en el formulario.",
            "error"
          );

          return;
        }

        establecerCargandoInicioSesion(
          elementos,
          true
        );

        try {
          const respuesta =
            await iniciarSesion(
              credenciales
            );

          const datos =
            respuesta?.datos;

          /*
           * Flujo normal con segundo factor.
           */
          if (datos?.tokenVerificacion) {
            guardarDatosVerificacion(
              datos
            );

            global.location.assign(
              RUTA_VERIFICAR_CODIGO
            );

            return;
          }

          /*
           * Flujo alternativo para cuentas
           * sin segundo factor.
           */
          if (datos?.autenticado) {
            limpiarDatosVerificacion();

            if (datos.administrador?.requiereCambioContrasena) {
              global.location.replace(RUTA_CAMBIO_OBLIGATORIO);
              return;
            }

            global.location.replace(
              RUTA_DASHBOARD
            );

            return;
          }

          throw new Error(
            "La respuesta del servidor no contiene los datos esperados."
          );
        } catch (error) {
          mostrarErroresBackend(
            error,
            elementos
          );

          let mensaje =
            error.message ||
            "No fue posible iniciar sesión.";

          if (error.statusCode === 429) {
            mensaje =
              "Se realizaron demasiados intentos. Espere 15 minutos antes de volver a intentarlo.";
          }

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
          establecerCargandoInicioSesion(
            elementos,
            false
          );

          if (elementos.contrasena) {
            elementos.contrasena.value =
              "";
          }
        }
      }
    );

    comprobarSesionExistente();
  }

  /**
   * Configura el formulario de verificación
   * del código recibido por correo.
   */
  function configurarFormularioVerificarCodigo() {
    const formulario =
      document.getElementById(
        "formularioVerificarCodigo"
      );

    if (!formulario) {
      return;
    }

    const elementos = {
      formulario,

      codigo:
        document.getElementById(
          "codigoVerificacion"
        ),

      errorCodigo:
        document.getElementById(
          "errorCodigo"
        ),

      correoDestino:
        document.getElementById(
          "correoDestino"
        ),

      mensaje:
        document.getElementById(
          "mensajeAutenticacion"
        ),

      boton:
        document.getElementById(
          "botonVerificarCodigo"
        ),

      cargador:
        document.getElementById(
          "cargadorVerificarCodigo"
        ),

      textoBoton:
        document.querySelector(
          "#botonVerificarCodigo " +
          ".boton-autenticacion__texto"
        ),

      enlaceVolver:
        document.getElementById(
          "enlaceVolverInicioSesion"
        )
    };

    const tokenVerificacion =
      obtenerTokenVerificacion();

    const correoDestino =
      obtenerCorreoDestino();

    if (elementos.correoDestino) {
      elementos.correoDestino.textContent =
        correoDestino ||
        "Correo del administrador";
    }

    /*
     * Si alguien intenta abrir esta página
     * sin iniciar primero el login.
     */
    if (!tokenVerificacion) {
      mostrarMensaje(
        elementos.mensaje,
        "No existe una verificación pendiente. Inicie sesión nuevamente.",
        "error"
      );

      if (elementos.codigo) {
        elementos.codigo.disabled = true;
      }

      if (elementos.boton) {
        elementos.boton.disabled = true;
      }

      return;
    }

    /*
     * Solo permite números y máximo seis caracteres.
     */
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

    elementos.enlaceVolver?.addEventListener(
      "click",
      () => {
        limpiarDatosVerificacion();
      }
    );

    formulario.addEventListener(
      "submit",
      async (evento) => {
        evento.preventDefault();

        ocultarMensaje(
          elementos.mensaje
        );

        const codigo =
          validarFormularioCodigo(
            elementos
          );

        if (!codigo) {
          mostrarMensaje(
            elementos.mensaje,
            "Revise el código indicado.",
            "error"
          );

          return;
        }

        establecerCargandoVerificacion(
          elementos,
          true
        );

        try {
          const respuesta =
            await verificarCodigo({
              tokenVerificacion,
              codigo
            });

          if (
            !respuesta?.datos?.autenticado
          ) {
            throw new Error(
              "No fue posible crear la sesión administrativa."
            );
          }

          limpiarDatosVerificacion();

          if (respuesta.datos.administrador?.requiereCambioContrasena) {
            global.location.replace(RUTA_CAMBIO_OBLIGATORIO);
            return;
          }

          mostrarMensaje(
            elementos.mensaje,
            respuesta.mensaje ||
            "Inicio de sesión realizado correctamente.",
            "exito"
          );

          global.location.replace(
            RUTA_DASHBOARD
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
              "CODIGO_EXPIRADO" ||
            error.codigo ===
              "TOKEN_VERIFICACION_INVALIDO"
          ) {
            limpiarDatosVerificacion();

            mensaje =
              "La verificación venció. Vuelva a iniciar sesión para recibir un código nuevo.";

            if (elementos.codigo) {
              elementos.codigo.disabled =
                true;
            }

            if (elementos.boton) {
              elementos.boton.disabled =
                true;
            }
          }

          mostrarMensaje(
            elementos.mensaje,
            mensaje,
            "error"
          );

          if (elementos.codigo) {
            elementos.codigo.value = "";
            elementos.codigo.focus();
          }
        } finally {
          /*
           * Solo rehabilita el formulario cuando
           * todavía existe un token temporal.
           */
          if (
            obtenerTokenVerificacion()
          ) {
            establecerCargandoVerificacion(
              elementos,
              false
            );
          }
        }
      }
    );

    elementos.codigo?.focus();
  }

  /**
   * Inicializa los formularios disponibles
   * en la página actual.
   */
  function inicializar() {
    configurarFormularioInicioSesion();
    configurarFormularioVerificarCodigo();
  }

  /*
   * Funciones públicas utilizadas por
   * otras páginas del panel.
   */
  global.AUTENTICACION_ADMIN =
    Object.freeze({
      iniciarSesion,
      verificarCodigo,
      obtenerSesion,
      cerrarSesion,
      cambiarContrasena,
      cambiarContrasenaObligatoria,
      guardarDatosVerificacion,
      obtenerTokenVerificacion,
      obtenerCorreoDestino,
      obtenerExpiracionVerificacion,
      limpiarDatosVerificacion
    });

  if (
    document.readyState === "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      inicializar
    );
  } else {
    inicializar();
  }
})(window);
