/*
 * Configuración general para consumir la API
 * desde el panel administrativo.
 *
 * Este archivo:
 *
 * - No realiza solicitudes HTTP.
 * - No controla formularios.
 * - No almacena contraseñas ni tokens.
 * - Solo contiene direcciones y opciones compartidas.
 */

(function configurarApiAdministrativa(global) {
  "use strict";

  /*
   * Dirección base del backend.
   *
   * Durante el desarrollo:
   * http://127.0.0.1:3001/api
   *
   * Cuando el backend sea publicado, esta dirección
   * deberá cambiarse por la URL de producción.
   */
  const URL_BASE_DESARROLLO = String(
    global.API_ADMIN_URL ||
    "http://127.0.0.1:3001/api"
  ).replace(/\/+$/, "");

  /*
   * Tiempo máximo permitido para una solicitud.
   */
  const TIEMPO_ESPERA_MS =
    15000;


  /*
   * Normaliza un slug antes de colocarlo
   * dentro de una dirección de la API.
   *
   * @param {string} slug
   * @returns {string}
   */
  function codificarSlug(slug) {
    return encodeURIComponent(
      String(slug || "").trim()
    );
  }


  /*
   * Normaliza un identificador numérico
   * antes de colocarlo en una ruta.
   *
   * @param {number|string} id
   * @returns {string}
   */
  function codificarId(id) {
    return encodeURIComponent(
      String(id ?? "").trim()
    );
  }


  /*
   * =========================================================
   * AUTENTICACIÓN
   * =========================================================
   */

  const ENDPOINTS_AUTENTICACION =
    Object.freeze({
      iniciarSesion:
        "/autenticacion/iniciar-sesion",

      verificarCodigo:
        "/autenticacion/verificar-codigo",

      solicitarRecuperacion:
        "/autenticacion/recuperar-contrasena/solicitar",

      verificarCodigoRecuperacion:
        "/autenticacion/recuperar-contrasena/verificar",

      restablecerContrasena:
        "/autenticacion/recuperar-contrasena/restablecer",

      obtenerSesion:
        "/autenticacion/sesion",

      cambiarContrasena:
        "/autenticacion/cambiar-contrasena",

      cambiarContrasenaObligatoria:
        "/autenticacion/cambiar-contrasena-obligatoria",

      cerrarSesion:
        "/autenticacion/cerrar-sesion"
    });


  /*
   * =========================================================
   * PÁGINAS Y CONTENIDO
   * =========================================================
   *
   * Incluye:
   *
   * - Consulta pública de una página.
   * - Consulta administrativa de una página.
   * - Lista de estados de publicación.
   * - Creación y actualización de secciones.
   */

  const ENDPOINTS_PAGINAS =
    Object.freeze({

      /*
       * GET /api/paginas/publicas/:slug
       *
       * No requiere sesión administrativa.
       */
      contenidoPublico(slug) {
        return (
          "/paginas/publicas/" +
          codificarSlug(slug)
        );
      },


      /*
       * GET /api/paginas/administracion/:slug
       *
       * Requiere la cookie HttpOnly sesion_admin.
       */
      contenidoAdministrativo(slug) {
        return (
          "/paginas/administracion/" +
          codificarSlug(slug)
        );
      },


      /*
       * GET /api/paginas/estados-publicacion
       *
       * Requiere la cookie HttpOnly sesion_admin.
       */
      estadosPublicacion:
        "/paginas/estados-publicacion",


      /*
       * POST /api/paginas/secciones
       *
       * Crea o actualiza una sección.
       *
       * Requiere la cookie HttpOnly sesion_admin.
       */
      guardarSeccion:
        "/paginas/secciones",


      /*
       * PUT /api/paginas/administracion/:idPagina
       *
       * Actualiza el encabezado y el estado general.
       */
      guardarPagina(idPagina) {
        return (
          "/paginas/administracion/" +
          encodeURIComponent(idPagina)
        );
      }
    });


  /*
   * =========================================================
   * ARCHIVOS
   * =========================================================
   */

  const ENDPOINTS_ARCHIVOS =
    Object.freeze({

      /*
       * POST /api/archivos/imagenes/paginas
       *
       * Recibe multipart/form-data.
       *
       * Campos:
       * - imagen
       * - textoAlternativo
       *
       * Requiere la cookie HttpOnly sesion_admin.
       */
      subirImagenPagina:
        "/archivos/imagenes/paginas"
    });


  /*
   * =========================================================
   * OFERTA ACADÉMICA
   * =========================================================
   */

  const ENDPOINTS_OFERTA_ACADEMICA =
    Object.freeze({

      /*
       * GET /api/oferta-academica/publica
       *
       * Obtiene únicamente el contenido
       * publicado de Oferta académica.
       *
       * No requiere sesión administrativa.
       */
      publica:
        "/oferta-academica/publica",


      /*
       * GET /api/oferta-academica/administracion
       *
       * Obtiene:
       *
       * - secciones
       * - ciclos educativos
       * - materias
       * - relaciones materia-ciclo
       *
       * Requiere sesión administrativa.
       */
      administracion:
        "/oferta-academica/administracion",


      /*
       * GET /api/oferta-academica/ciclos
       *
       * Obtiene los ciclos educativos
       * disponibles para el panel.
       *
       * Requiere sesión administrativa.
       */
      ciclos:
        "/oferta-academica/ciclos",


      /*
       * POST /api/oferta-academica/materias
       *
       * Crea una nueva materia.
       *
       * Requiere sesión administrativa.
       */
      crearMateria:
        "/oferta-academica/materias",


      /*
       * PUT /api/oferta-academica/materias/:idMateria
       *
       * Actualiza una materia existente.
       *
       * Requiere sesión administrativa.
       */
      actualizarMateria(idMateria) {
        return (
          "/oferta-academica/materias/" +
          codificarId(idMateria)
        );
      },


      /*
       * DELETE /api/oferta-academica/materias/:idMateria
       *
       * Retira una materia de Oferta académica
       * sin eliminarla físicamente de la BD.
       *
       * Requiere sesión administrativa.
       */
      retirarMateria(idMateria) {
        return (
          "/oferta-academica/materias/" +
          codificarId(idMateria)
        );
      }
    });


  /*
   * =========================================================
   * COMUNIDAD
   * =========================================================
   */

  const ENDPOINTS_COMUNIDAD =
    Object.freeze({

      /*
       * GET /api/comunidad/publica
       *
       * Obtiene únicamente las secciones
       * publicadas de la página Comunidad.
       *
       * No requiere sesión administrativa.
       */
      publica:
        "/comunidad/publica",


      /*
       * GET /api/comunidad/administracion
       *
       * Obtiene:
       *
       * - información general de la página
       * - todas las secciones de Comunidad
       *
       * Requiere sesión administrativa.
       */
      administracion:
        "/comunidad/administracion"
    });


  /*
   * =========================================================
   * CONFIGURACIÓN DEL SITIO
   * =========================================================
   *
   * Esta información se utiliza de forma centralizada
   * en distintas partes del sitio.
   *
   * Ejemplos:
   *
   * - Contacto
   * - Nosotros
   * - Footer
   *
   * Datos compartidos:
   *
   * - dirección institucional
   * - teléfonos
   * - correo
   * - horario
   * - Facebook
   * - Google Maps
   */

  const ENDPOINTS_CONFIGURACION_SITIO =
    Object.freeze({

      /*
       * GET /api/configuracion-sitio/publica
       *
       * Obtiene únicamente las configuraciones
       * marcadas como públicas.
       *
       * No requiere sesión administrativa.
       */
      publica:
        "/configuracion-sitio/publica",


      /*
       * GET /api/configuracion-sitio/administracion
       *
       * Obtiene todas las configuraciones disponibles
       * para el panel administrativo.
       *
       * Requiere sesión administrativa.
       */
      administracion:
        "/configuracion-sitio/administracion",


      /*
       * PUT /api/configuracion-sitio/administracion
       *
       * Actualiza una configuración existente.
       *
       * Body esperado:
       *
       * {
       *   clave: "correo_institucional",
       *   valor: "correo@mep.go.cr"
       * }
       *
       * Requiere sesión administrativa.
       */
      guardar:
        "/configuracion-sitio/administracion"
    });


  /*
   * =========================================================
   * CONFIGURACIÓN PÚBLICA
   * =========================================================
   *
   * Utilizada por:
   *
   * - api-client.js
   * - módulos del panel administrativo
   */

  const API_ADMIN_CONFIG =
    Object.freeze({

      urlBase:
        URL_BASE_DESARROLLO,

      tiempoEsperaMs:
        TIEMPO_ESPERA_MS,


      /*
       * Permite que fetch envíe y reciba
       * la cookie HttpOnly sesion_admin.
       */
      credenciales:
        "include",


      encabezadosJson:
        Object.freeze({
          Accept:
            "application/json",

          "Content-Type":
            "application/json"
        }),


      endpoints:
        Object.freeze({

          autenticacion:
            ENDPOINTS_AUTENTICACION,

          paginas:
            ENDPOINTS_PAGINAS,

          archivos:
            ENDPOINTS_ARCHIVOS,

          ofertaAcademica:
            ENDPOINTS_OFERTA_ACADEMICA,

          comunidad:
            ENDPOINTS_COMUNIDAD,

          configuracionSitio:
            ENDPOINTS_CONFIGURACION_SITIO
        })
    });


  /*
   * Se expone en window para que pueda utilizarse
   * desde otros archivos JavaScript cargados después.
   */
  global.API_ADMIN_CONFIG =
    API_ADMIN_CONFIG;

})(window);
