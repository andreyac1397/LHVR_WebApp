/* ============================================================
   CONFIGURACIÓN PÚBLICA - LICEO HERNÁN VARGAS RAMÍREZ
   ------------------------------------------------------------
   Aplica los datos públicos administrados desde el panel.

   Si la API no está disponible, conserva los datos estáticos
   definidos en el HTML / main.js sin interrumpir el sitio.

   Endpoint:
   GET /api/configuracion-sitio/publica
   ============================================================ */

(function aplicarConfiguracionPublica(global) {
  "use strict";

  const apiBase = String(
    global.API_PUBLICA_URL ||
    "http://127.0.0.1:3001/api"
  ).replace(/\/+$/, "");

  /*
   * ==========================================================
   * 1. EQUIVALENCIAS
   * ==========================================================
   *
   * Clave de la BD -> nombre utilizado en el frontend.
   */

  const equivalencias = Object.freeze({
    nombre_institucion:
      "nombre",

    sigla_institucion:
      "siglas",

    lema_institucional:
      "lema",

    modalidad_institucional:
      "modalidad",

    jornada_institucional:
      "jornada",

    niveles_institucionales:
      "niveles",

    direccion_institucional:
      "direccion",

    telefonos_institucionales:
      "telefono",

    correo_institucional:
      "correo",

    horario_atencion:
      "horario",

    google_maps_url:
      "maps",

    facebook_url:
      "facebook"
  });

  /*
   * ==========================================================
   * 2. UTILIDADES
   * ==========================================================
   */

  function texto(valor) {
    return valor === null ||
      valor === undefined
      ? ""
      : String(valor).trim();
  }

  function urlPublicaSegura(
    valor,
    protocolos = [
      "http:",
      "https:"
    ]
  ) {
    const url =
      texto(valor);

    if (
      !url ||
      /^(javascript|data|vbscript):/i.test(
        url
      )
    ) {
      return "";
    }

    try {
      const resultado =
        new URL(
          url,
          global.location.href
        );

      return protocolos.includes(
        resultado.protocol
      )
        ? resultado.href
        : "";
    } catch (_error) {
      return "";
    }
  }

  function correoSeguro(
    valor
  ) {
    const correo =
      texto(valor);

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      .test(correo)
      ? correo
      : "";
  }

  /*
   * ==========================================================
   * 3. NORMALIZACIÓN DE RESPUESTA
   * ==========================================================
   */

  function extraerListaConfiguraciones(
    respuesta
  ) {
    const datos =
      respuesta?.datos;

    if (
      Array.isArray(datos)
    ) {
      return datos;
    }

    if (
      Array.isArray(
        datos?.configuraciones
      )
    ) {
      return datos.configuraciones;
    }

    if (
      Array.isArray(
        datos?.items
      )
    ) {
      return datos.items;
    }

    return [];
  }

  function normalizar(
    respuesta
  ) {
    const lista =
      extraerListaConfiguraciones(
        respuesta
      );

    const resultado =
      Object.create(null);

    lista.forEach(
      (item) => {
        const clave =
          texto(
            item?.clave
          ).toLowerCase();

        const valor =
          texto(
            item?.valor
          );

        const claveSitio =
          equivalencias[clave];

        if (
          !claveSitio ||
          !valor
        ) {
          return;
        }

        resultado[
          claveSitio
        ] =
          valor;
      }
    );

    return resultado;
  }

  /*
   * ==========================================================
   * 4. ELEMENTOS MARCADOS CON data-dato
   * ==========================================================
   */

  function actualizarDatosMarcados(
    datos
  ) {
    document
      .querySelectorAll(
        "[data-dato]"
      )
      .forEach(
        (elemento) => {
          const clave =
            elemento
              .dataset
              .dato;

          const valor =
            datos[clave];

          /*
           * Si no existe un valor válido proveniente
           * de la API se conserva el contenido estático.
           */
          if (valor) {
            elemento.textContent =
              valor;
          }
        }
      );

    document
      .querySelectorAll(
        "[data-dato-link]"
      )
      .forEach(
        (elemento) => {
          const clave =
            elemento
              .dataset
              .datoLink;

          const valor =
            urlPublicaSegura(
              datos[clave]
            );

          /*
           * Si la API no tiene una URL válida,
           * se conserva el href original.
           */
          if (valor) {
            elemento.href =
              valor;
          }
        }
      );
  }

  /*
   * ==========================================================
   * 5. CORREOS MARCADOS
   * ==========================================================
   */

  function actualizarCorreos(
    datos
  ) {
    const correo =
      correoSeguro(
        datos.correo
      );

    if (!correo) {
      return;
    }

    /*
     * Actualiza cualquier elemento de texto marcado
     * como correo.
     */
    document
      .querySelectorAll(
        '[data-dato="correo"]'
      )
      .forEach(
        (elemento) => {
          elemento.textContent =
            correo;
        }
      );

    /*
     * Actualiza enlaces mailto existentes.
     */
    document
      .querySelectorAll(
        'a[href^="mailto:"]'
      )
      .forEach(
        (enlace) => {
          enlace.href =
            `mailto:${correo}`;

          /*
           * Solo reemplaza el texto cuando el enlace
           * actualmente muestra un correo.
           */
          if (
            enlace.textContent
              .trim()
              .includes("@")
          ) {
            enlace.textContent =
              correo;
          }
        }
      );
  }

  /*
   * ==========================================================
   * 6. ENCABEZADO
   * ==========================================================
   */

  function actualizarEncabezado(
    datos
  ) {
    const siglas =
      document.querySelector(
        ".marca__nombre"
      );

    const nombre =
      document.querySelector(
        ".marca__lema"
      );

    if (
      siglas &&
      datos.siglas
    ) {
      siglas.textContent =
        datos.siglas;
    }

    if (
      nombre &&
      datos.nombre
    ) {
      nombre.textContent =
        datos.nombre;
    }

    document
      .querySelectorAll(
        ".marca__logo"
      )
      .forEach(
        (imagen) => {
          if (
            datos.nombre
          ) {
            imagen.alt =
              `Logo del ${datos.nombre}`;
          }
        }
      );
  }

  /*
   * ==========================================================
   * 7. PIE DE PÁGINA
   * ==========================================================
   */

  function actualizarPie(
    datos
  ) {
    const nombre =
      document.querySelector(
        ".pie__nombre"
      );

    const lema =
      document.querySelector(
        ".pie__texto"
      );

    if (
      nombre &&
      datos.nombre
    ) {
      nombre.textContent =
        datos.nombre;
    }

    if (
      lema &&
      datos.lema
    ) {
      lema.textContent =
        datos.lema;
    }

    /*
     * Este bloque se mantiene compatible con la estructura
     * actual del footer.
     *
     * Lo revisaremos cuando veamos el archivo real del pie.
     */
    const grupos =
      document.querySelectorAll(
        "#pie .pie__grid > div"
      );

    const contacto =
      grupos[2]
        ?.querySelectorAll(
          ".pie__lista > li"
        );

    if (
      contacto?.[0] &&
      datos.direccion
    ) {
      contacto[0].textContent =
        datos.direccion;
    }

    if (
      contacto?.[1] &&
      datos.telefono
    ) {
      contacto[1].textContent =
        `Tel: ${datos.telefono}`;
    }

    const enlaceCorreo =
      contacto?.[2]
        ?.querySelector(
          "a"
        );

    const correo =
      correoSeguro(
        datos.correo
      );

    if (
      enlaceCorreo &&
      correo
    ) {
      enlaceCorreo.textContent =
        correo;

      enlaceCorreo.href =
        `mailto:${correo}`;
    }

    if (
      contacto?.[3] &&
      datos.horario
    ) {
      contacto[3].textContent =
        datos.horario;
    }

    const enlaceFacebook =
      contacto?.[4]
        ?.querySelector(
          "a"
        );

    const facebook =
      urlPublicaSegura(
        datos.facebook
      );

    if (
      enlaceFacebook &&
      facebook
    ) {
      enlaceFacebook.href =
        facebook;
    }

    const derechos =
      document.querySelector(
        ".pie__base p"
      );

    if (
      derechos &&
      datos.nombre
    ) {
      derechos.textContent =
        `© ${new Date().getFullYear()} ${datos.nombre}. ` +
        "Todos los derechos reservados.";
    }
  }

  /*
   * ==========================================================
   * 8. CARGAR CONFIGURACIÓN PÚBLICA
   * ==========================================================
   */

  async function cargar() {
    try {
      const respuesta =
        await fetch(
          `${apiBase}/configuracion-sitio/publica`,
          {
            method:
              "GET",

            headers: {
              Accept:
                "application/json"
            }
          }
        );

      if (
        !respuesta.ok
      ) {
        return;
      }

      const contenido =
        await respuesta.json();

      const datos =
        normalizar(
          contenido
        );

      /*
       * Si el backend responde pero no devuelve
       * configuraciones válidas, no se modifica el sitio.
       */
      if (
        !Object.keys(
          datos
        ).length
      ) {
        return;
      }

      actualizarDatosMarcados(
        datos
      );

      actualizarCorreos(
        datos
      );

      actualizarEncabezado(
        datos
      );

      actualizarPie(
        datos
      );

      /*
       * Dejamos disponibles los datos para otros módulos,
       * por ejemplo nosotros.js o contacto.js.
       */
      global.CONFIGURACION_PUBLICA =
        Object.freeze({
          ...datos
        });

      /*
       * Avisamos a otros módulos que la configuración
       * ya fue obtenida.
       */
      document.dispatchEvent(
        new CustomEvent(
          "configuracionpublicacargada",
          {
            detail: {
              ...datos
            }
          }
        )
      );
    } catch (_error) {
      /*
       * No mostramos errores al visitante.
       *
       * Si el backend está apagado o no responde,
       * el sitio conserva sus valores estáticos.
       */
    }
  }

  /*
   * ==========================================================
   * 9. INICIO
   * ==========================================================
   */

  document.addEventListener(
    "DOMContentLoaded",
    cargar
  );

  global.CONFIGURACION_PUBLICA_API =
    Object.freeze({
      cargar
    });

})(window);