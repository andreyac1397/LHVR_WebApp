/*
 * Cliente general para consumir la API
 * desde el panel administrativo.
 *
 * Este archivo:
 * - Centraliza las solicitudes realizadas con fetch().
 * - Envía automáticamente la cookie sesion_admin.
 * - Controla el tiempo máximo de espera.
 * - Procesa respuestas JSON.
 * - Convierte los errores del backend en errores controlados.
 */

(function configurarClienteApi(global) {
  "use strict";

  const configuracion =
    global.API_ADMIN_CONFIG;

  if (!configuracion) {
    throw new Error(
      "No se encontró API_ADMIN_CONFIG. " +
      "Debe cargar api-admin.config.js antes de api-client.js."
    );
  }

  /**
   * Error utilizado cuando una solicitud a la API falla.
   */
  class ErrorApiAdmin extends Error {
    /**
     * @param {string} mensaje
     * @param {object} opciones
     */
    constructor(
      mensaje,
      opciones = {}
    ) {
      super(mensaje);

      this.name = "ErrorApiAdmin";

      this.statusCode =
        opciones.statusCode ?? 0;

      this.codigo =
        opciones.codigo ??
        "ERROR_API";

      this.errores =
        Array.isArray(opciones.errores)
          ? opciones.errores
          : [];

      this.datos =
        opciones.datos ?? null;

      this.causa =
        opciones.causa ?? null;
    }
  }

  /**
   * Cliente reutilizable para realizar
   * solicitudes HTTP al backend.
   */
  class ApiClient {
    /**
     * Construye una URL completa.
     *
     * @param {string} ruta
     * @returns {string}
     */
    construirUrl(ruta) {
      if (
        typeof ruta !== "string" ||
        ruta.trim() === ""
      ) {
        throw new ErrorApiAdmin(
          "La ruta de la API no es válida.",
          {
            codigo: "RUTA_API_INVALIDA"
          }
        );
      }

      const urlBase =
        configuracion.urlBase.replace(
          /\/+$/,
          ""
        );

      const rutaLimpia =
        ruta.startsWith("/")
          ? ruta
          : `/${ruta}`;

      return `${urlBase}${rutaLimpia}`;
    }

    /**
     * Determina si los datos corresponden
     * a un objeto FormData.
     *
     * FormData se utiliza para enviar archivos
     * mediante multipart/form-data.
     *
     * @param {*} datos
     * @returns {boolean}
     */
    esFormData(datos) {
      return (
        typeof global.FormData !==
          "undefined" &&
        datos instanceof global.FormData
      );
    }

    /**
     * Intenta convertir la respuesta en JSON.
     *
     * @param {Response} respuesta
     * @returns {Promise<object|null>}
     */
    async leerRespuesta(respuesta) {
      if (
        respuesta.status === 204 ||
        respuesta.status === 205
      ) {
        return null;
      }

      const tipoContenido =
        respuesta.headers.get(
          "content-type"
        ) || "";

      if (
        tipoContenido.includes(
          "application/json"
        )
      ) {
        return respuesta.json();
      }

      const texto =
        await respuesta.text();

      if (!texto) {
        return null;
      }

      return {
        mensaje: texto
      };
    }

    /**
     * Crea un error usando la respuesta del backend.
     *
     * @param {Response} respuesta
     * @param {object|null} contenido
     * @returns {ErrorApiAdmin}
     */
    crearErrorRespuesta(
      respuesta,
      contenido
    ) {
      const mensaje =
        contenido?.mensaje ||
        "La solicitud no pudo completarse.";

      return new ErrorApiAdmin(
        mensaje,
        {
          statusCode:
            respuesta.status,

          codigo:
            contenido?.codigo ||
            `HTTP_${respuesta.status}`,

          errores:
            contenido?.errores,

          datos:
            contenido?.datos
        }
      );
    }

    /**
     * Realiza una solicitud al backend.
     *
     * Admite:
     * - Objetos JavaScript enviados como JSON.
     * - FormData enviado como multipart/form-data.
     *
     * Cuando se utiliza FormData, el navegador
     * genera automáticamente el encabezado
     * Content-Type con su boundary correspondiente.
     *
     * @param {string} ruta
     * @param {object} opciones
     * @param {string} opciones.metodo
     * @param {object|FormData|null} opciones.datos
     * @param {object} opciones.encabezados
     * @param {number} opciones.tiempoEsperaMs
     * @returns {Promise<object|null>}
     */
    async solicitar(
      ruta,
      opciones = {}
    ) {
      const url =
        this.construirUrl(ruta);

      const metodo = String(
        opciones.metodo || "GET"
      ).toUpperCase();

      const controlador =
        new AbortController();

      const tiempoEsperaMs =
        Number(
          opciones.tiempoEsperaMs ??
          configuracion.tiempoEsperaMs
        );

      const temporizador =
        setTimeout(
          () => controlador.abort(),
          tiempoEsperaMs
        );

      const encabezados = {
        Accept: "application/json",
        ...(opciones.encabezados || {})
      };

      const configuracionFetch = {
        method: metodo,

        /*
         * Necesario para enviar y recibir
         * la cookie HttpOnly sesion_admin.
         */
        credentials:
          configuracion.credenciales,

        headers:
          encabezados,

        signal:
          controlador.signal
      };

      if (
        opciones.datos !== undefined &&
        opciones.datos !== null
      ) {
        const datosSonFormulario =
          this.esFormData(
            opciones.datos
          );

        if (datosSonFormulario) {
          /*
           * No se debe establecer manualmente
           * Content-Type para FormData.
           *
           * El navegador agregará:
           * multipart/form-data; boundary=...
           */
          delete configuracionFetch
            .headers[
              "Content-Type"
            ];

          delete configuracionFetch
            .headers[
              "content-type"
            ];

          configuracionFetch.body =
            opciones.datos;
        } else {
          configuracionFetch.headers[
            "Content-Type"
          ] = "application/json";

          configuracionFetch.body =
            JSON.stringify(
              opciones.datos
            );
        }
      }

      try {
        const respuesta =
          await fetch(
            url,
            configuracionFetch
          );

        const contenido =
          await this.leerRespuesta(
            respuesta
          );

        if (!respuesta.ok) {
          throw this.crearErrorRespuesta(
            respuesta,
            contenido
          );
        }

        return contenido;
      } catch (error) {
        if (
          error instanceof ErrorApiAdmin
        ) {
          throw error;
        }

        if (
          error.name === "AbortError"
        ) {
          throw new ErrorApiAdmin(
            "La solicitud tardó demasiado tiempo. Intente nuevamente.",
            {
              statusCode: 408,
              codigo:
                "TIEMPO_ESPERA_AGOTADO",
              causa: error
            }
          );
        }

        throw new ErrorApiAdmin(
          "No fue posible conectar con el servidor.",
          {
            statusCode: 0,
            codigo:
              "SERVIDOR_NO_DISPONIBLE",
            causa: error
          }
        );
      } finally {
        clearTimeout(
          temporizador
        );
      }
    }

    /**
     * Realiza una solicitud GET.
     *
     * @param {string} ruta
     * @param {object} opciones
     */
    get(ruta, opciones = {}) {
      return this.solicitar(
        ruta,
        {
          ...opciones,
          metodo: "GET"
        }
      );
    }

    /**
     * Realiza una solicitud POST.
     *
     * Admite objetos JSON y FormData.
     *
     * @param {string} ruta
     * @param {object|FormData|null} datos
     * @param {object} opciones
     */
    post(
      ruta,
      datos = null,
      opciones = {}
    ) {
      return this.solicitar(
        ruta,
        {
          ...opciones,
          metodo: "POST",
          datos
        }
      );
    }

    /**
     * Realiza una solicitud POST
     * utilizando FormData.
     *
     * Se utiliza principalmente para
     * cargar imágenes y documentos.
     *
     * @param {string} ruta
     * @param {FormData} datos
     * @param {object} opciones
     */
    postFormData(
      ruta,
      datos,
      opciones = {}
    ) {
      if (!this.esFormData(datos)) {
        throw new ErrorApiAdmin(
          "Los datos de la carga deben enviarse mediante FormData.",
          {
            codigo:
              "FORM_DATA_INVALIDO"
          }
        );
      }

      return this.solicitar(
        ruta,
        {
          ...opciones,
          metodo: "POST",
          datos
        }
      );
    }

    /**
     * Realiza una solicitud PUT.
     *
     * @param {string} ruta
     * @param {object|null} datos
     * @param {object} opciones
     */
    put(
      ruta,
      datos = null,
      opciones = {}
    ) {
      return this.solicitar(
        ruta,
        {
          ...opciones,
          metodo: "PUT",
          datos
        }
      );
    }

    /**
     * Realiza una solicitud PATCH.
     *
     * @param {string} ruta
     * @param {object|null} datos
     * @param {object} opciones
     */
    patch(
      ruta,
      datos = null,
      opciones = {}
    ) {
      return this.solicitar(
        ruta,
        {
          ...opciones,
          metodo: "PATCH",
          datos
        }
      );
    }

    /**
     * Realiza una solicitud DELETE.
     *
     * @param {string} ruta
     * @param {object|null} datos
     * @param {object} opciones
     */
    delete(
      ruta,
      datos = null,
      opciones = {}
    ) {
      return this.solicitar(
        ruta,
        {
          ...opciones,
          metodo: "DELETE",
          datos
        }
      );
    }
  }

  const apiClient =
    new ApiClient();

  /*
   * Elementos disponibles para los demás
   * archivos JavaScript del panel.
   */
  global.ErrorApiAdmin =
    ErrorApiAdmin;

  global.ApiClient =
    ApiClient;

  global.API_ADMIN_CLIENT =
    apiClient;
})(window);