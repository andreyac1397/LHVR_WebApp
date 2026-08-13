/* ============================================================
   PÁGINAS Y CONTENIDO - PANEL ADMINISTRATIVO LHVR
   ------------------------------------------------------------
   Contiene la lógica compartida por los editores de páginas.

   La lógica específica se encuentra en:
   - paginas-inicio.js
   - paginas-nosotros.js
   ============================================================ */

(function configurarPaginasContenido(global) {
  "use strict";

  const apiClient =
    global.API_ADMIN_CLIENT;

  const configuracion =
    global.API_ADMIN_CONFIG;

  const proteccionRutas =
    global.PROTECCION_RUTAS_ADMIN;

  if (!apiClient || !configuracion) {
    throw new Error(
      "No se pudo cargar páginas-contenido.js. " +
      "Verifique api-admin.config.js y api-client.js."
    );
  }

  const TAMANO_MAXIMO_IMAGEN =
    5 * 1024 * 1024;

  const TIPOS_IMAGEN_PERMITIDOS =
    Object.freeze([
      "image/jpeg",
      "image/png",
      "image/webp"
    ]);

  const editoresRegistrados =
    new Map();

  let inicializado = false;
  let cargaEnProceso = false;
  let guardadoEnProceso = false;
  let contenidoCargado = false;

  let paginaActual = null;
  let seccionesActuales = [];
  let estadosPublicacion = [];
  let editorActivo = null;

  /*
   * ==========================================================
   * 1. UTILIDADES BÁSICAS
   * ==========================================================
   */

  function texto(valor) {
    return (
      valor === null ||
      valor === undefined
    )
      ? ""
      : String(valor).trim();
  }

  function numeroOpcional(valor) {
    if (
      valor === null ||
      valor === undefined ||
      texto(valor) === ""
    ) {
      return null;
    }

    const numero =
      Number(valor);

    return Number.isFinite(numero)
      ? numero
      : null;
  }

  function normalizarClave(valor) {
    return texto(valor)
      .toUpperCase();
  }

  function normalizarSlug(valor) {
    const slug =
      texto(valor)
        .toLowerCase();

    if (
      !slug ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/
        .test(slug)
    ) {
      return "";
    }

    return slug;
  }

  function capitalizar(valor) {
    const contenido =
      texto(valor);

    if (!contenido) {
      return "";
    }

    return (
      contenido
        .charAt(0)
        .toUpperCase() +
      contenido.slice(1)
    );
  }

  function extraerDatos(respuesta) {
    return (
      respuesta?.datos ??
      respuesta ??
      {}
    );
  }

  function obtenerSlugPagina() {
    const nombreParametro =
      texto(
        document.body
          ?.dataset
          ?.parametroPagina
      ) ||
      "pagina";

    const parametros =
      new URLSearchParams(
        global.location.search
      );

    const slugConsulta =
      normalizarSlug(
        parametros.get(
          nombreParametro
        )
      );

    if (slugConsulta) {
      return slugConsulta;
    }

    const slugDocumento =
      normalizarSlug(
        document.body
          ?.dataset
          ?.paginaSlug
      );

    return (
      slugDocumento ||
      "inicio"
    );
  }

  const SLUG_PAGINA =
    obtenerSlugPagina();

  /*
   * ==========================================================
   * 2. ELEMENTOS GENERALES DEL DOCUMENTO
   * ==========================================================
   */

  function porId(id) {
    return document.getElementById(
      id
    );
  }

  function obtenerElementosGenerales() {
    return {
      contenido:
        porId(
          "contenidoPaginasContenido"
        ),

      mensaje:
        porId(
          "mensajePaginaContenido"
        ),

      nombrePagina:
        porId(
          "nombrePagina"
        ),

      rutaPagina:
        porId(
          "rutaPagina"
        ),

      estadoPagina:
        porId(
          "estadoPagina"
        ),

      fechaActualizacionPagina:
        porId(
          "fechaActualizacionPagina"
        ),

      botonRecargarContenido:
        porId(
          "botonRecargarContenido"
        ),

      tituloEditorPagina:
        porId(
          "tituloEditorPagina"
        ),

      descripcionEditorPagina:
        porId(
          "descripcionEditorPagina"
        ),

      descripcionResumenPagina:
        porId(
          "descripcionResumenPagina"
        ),

      enlacePaginaPublica:
        porId(
          "enlacePaginaPublica"
        ),

      textoPieGestion:
        porId(
          "textoPieGestion"
        ),

      contenidoPagina:
        porId(
          "contenidoPagina"
        )
    };
  }

  /*
   * ==========================================================
   * 3. ERRORES, SESIÓN Y MENSAJES
   * ==========================================================
   */

  function obtenerEstadoError(error) {
    const valor =
      error?.statusCode ??
      error?.status ??
      error?.codigoEstado ??
      null;

    const numero =
      Number(valor);

    return Number.isFinite(numero)
      ? numero
      : null;
  }

  function obtenerMensajeError(error) {
    if (
      obtenerEstadoError(error) === 0
    ) {
      return (
        "No fue posible conectar con el servidor. " +
        "Verifique que el backend esté encendido."
      );
    }

    return (
      error?.message ||
      error?.mensaje ||
      "Ocurrió un error al procesar la solicitud."
    );
  }

  function manejarSesionVencida(error) {
    const estado =
      obtenerEstadoError(error);

    if (
      estado !== 401 &&
      estado !== 403
    ) {
      return false;
    }

    if (
      global.SesionAdministrador &&
      typeof global
        .SesionAdministrador
        .redirigirAlLogin ===
        "function"
    ) {
      global
        .SesionAdministrador
        .redirigirAlLogin();
    } else {
      global.location.replace(
        "../autenticacion/iniciar-sesion.html"
      );
    }

    return true;
  }

  function mostrarMensaje(
    mensaje,
    tipo = "informacion"
  ) {
    const tipoNormalizado =
      texto(tipo).toLowerCase();

    if (
      global.AlertasAdmin &&
      typeof global
        .AlertasAdmin
        .mostrar ===
        "function"
    ) {
      global.AlertasAdmin.mostrar({
        tipo:
          tipoNormalizado,

        mensaje:
          texto(mensaje)
      });

      return;
    }

    const elemento =
      obtenerElementosGenerales()
        .mensaje;

    if (!elemento) {
      return;
    }

    elemento.textContent =
      texto(mensaje);

    elemento.hidden =
      false;
  }

  function ocultarMensaje() {
    if (
      global.AlertasAdmin &&
      typeof global
        .AlertasAdmin
        .cerrarTodas ===
        "function"
    ) {
      global
        .AlertasAdmin
        .cerrarTodas();
    }

    const elemento =
      obtenerElementosGenerales()
        .mensaje;

    if (!elemento) {
      return;
    }

    elemento.textContent = "";
    elemento.hidden = true;
  }

  async function confirmarAccion(
    opciones = {}
  ) {
    if (
      global.ModalAdmin &&
      typeof global
        .ModalAdmin
        .confirmar ===
        "function"
    ) {
      return global
        .ModalAdmin
        .confirmar({
          tipo:
            opciones.tipo ||
            "advertencia",

          titulo:
            opciones.titulo ||
            "Confirmar acción",

          mensaje:
            opciones.mensaje ||
            "¿Desea continuar?",

          detalle:
            opciones.detalle ||
            "",

          textoCancelar:
            opciones.textoCancelar ||
            "Cancelar",

          textoConfirmar:
            opciones.textoConfirmar ||
            "Confirmar"
        });
    }

    const mensaje =
      [
        texto(
          opciones.mensaje
        ),

        texto(
          opciones.detalle
        )
      ]
        .filter(Boolean)
        .join("\n\n");

    return global.confirm(
      mensaje ||
      "¿Desea continuar?"
    );
  }

  /*
   * ==========================================================
   * 4. ESTADOS VISUALES
   * ==========================================================
   */

  function marcarInvalido(
    elemento,
    invalido
  ) {
    if (!elemento) {
      return;
    }

    elemento.classList.toggle(
      "es-invalido",
      Boolean(invalido)
    );

    if (invalido) {
      elemento.setAttribute(
        "aria-invalid",
        "true"
      );
    } else {
      elemento.removeAttribute(
        "aria-invalid"
      );
    }
  }

  function establecerBotonCargando(
    boton,
    cargador,
    cargando
  ) {
    if (boton) {
      boton.disabled =
        Boolean(cargando);

      boton.setAttribute(
        "aria-busy",
        String(
          Boolean(cargando)
        )
      );
    }

    if (cargador) {
      cargador.hidden =
        !cargando;
    }
  }

  function bloquearFormulario(
    formulario,
    bloqueado
  ) {
    if (!formulario) {
      return;
    }

    formulario.setAttribute(
      "aria-busy",
      String(
        Boolean(bloqueado)
      )
    );

    formulario
      .querySelectorAll(
        "input, textarea, select, button"
      )
      .forEach(
        (control) => {
          control.disabled =
            Boolean(bloqueado);
        }
      );
  }

  function formatearFecha(valor) {
    if (!valor) {
      return (
        "Sin actualización registrada"
      );
    }

    const fecha =
      valor instanceof Date
        ? valor
        : new Date(valor);

    if (
      Number.isNaN(
        fecha.getTime()
      )
    ) {
      return texto(valor);
    }

    return new Intl.DateTimeFormat(
      "es-CR",
      {
        dateStyle:
          "medium",

        timeStyle:
          "short"
      }
    ).format(fecha);
  }

  /*
   * ==========================================================
   * 5. ENDPOINTS
   * ==========================================================
   */

  function construirEndpoint(
    nombre,
    valor = null
  ) {
    const endpoints =
      configuracion
        .endpoints
        ?.paginas ||
      {};

    const endpointConfigurado =
      endpoints[nombre];

    if (
      typeof endpointConfigurado ===
      "function"
    ) {
      return endpointConfigurado(
        valor
      );
    }

    if (
      typeof endpointConfigurado ===
        "string" &&
      endpointConfigurado.trim() !== ""
    ) {
      return valor === null
        ? endpointConfigurado
        : endpointConfigurado.replace(
          ":slug",
          encodeURIComponent(valor)
        );
    }

    const predeterminados = {
      contenidoAdministrativo:
        `/paginas/administracion/` +
        `${encodeURIComponent(
          valor || SLUG_PAGINA
        )}`,

      estadosPublicacion:
        "/paginas/estados-publicacion",

      guardarSeccion:
        "/paginas/secciones"
    };

    return predeterminados[nombre];
  }

  function construirEndpointArchivo(
    nombre
  ) {
    const endpoints =
      configuracion
        .endpoints
        ?.archivos ||
      {};

    const endpointConfigurado =
      endpoints[nombre];

    if (
      typeof endpointConfigurado ===
        "string" &&
      endpointConfigurado.trim() !== ""
    ) {
      return endpointConfigurado;
    }

    const predeterminados = {
      subirImagenPagina:
        "/archivos/imagenes/paginas"
    };

    return predeterminados[nombre];
  }

  /*
   * ==========================================================
   * 6. SOLICITUDES A LA API
   * ==========================================================
   */

  async function solicitarContenido(
  slug = SLUG_PAGINA
) {
  const endpoint =
    construirEndpoint(
      "contenidoAdministrativo",
      slug
    );

  const separador =
    endpoint.includes("?")
      ? "&"
      : "?";

  /*
   * Evita reutilizar una respuesta anterior después
   * de cambiar o quitar una imagen.
   */
  const endpointSinCache =
    `${endpoint}${separador}` +
    `_actualizacion=${Date.now()}`;

  return apiClient.get(
    endpointSinCache
  );
}

  async function solicitarEstados() {
    return apiClient.get(
      construirEndpoint(
        "estadosPublicacion"
      )
    );
  }

  async function guardarSeccion(datos) {
    return apiClient.post(
      construirEndpoint(
        "guardarSeccion"
      ),
      datos
    );
  }

  async function guardarSecciones(
    secciones
  ) {
    const lista =
      Array.isArray(secciones)
        ? secciones
        : [secciones];

    for (
      const seccion
      of lista
    ) {
      await guardarSeccion(
        seccion
      );
    }
  }

  async function subirImagenPagina(
    archivo,
    textoAlternativo = ""
  ) {
    const formulario =
      new FormData();

    formulario.append(
      "imagen",
      archivo
    );

    formulario.append(
      "textoAlternativo",
      texto(
        textoAlternativo
      )
    );

    const endpoint =
      construirEndpointArchivo(
        "subirImagenPagina"
      );

    if (
      typeof apiClient
        .postFormData ===
        "function"
    ) {
      return apiClient.postFormData(
        endpoint,
        formulario
      );
    }

    return apiClient.post(
      endpoint,
      formulario
    );
  }

  function obtenerIdArchivoRespuesta(
    respuesta
  ) {
    const datos =
      extraerDatos(
        respuesta
      );

    const archivo =
      datos.archivo ||
      datos.archivoRegistrado ||
      datos;

    const idArchivo =
      numeroOpcional(
        archivo?.idArchivo ??
        archivo?.id_archivo
      );

    if (
      !idArchivo ||
      !Number.isInteger(
        idArchivo
      ) ||
      idArchivo <= 0
    ) {
      return null;
    }

    return idArchivo;
  }

  /*
   * ==========================================================
   * 7. DATOS ACTUALES
   * ==========================================================
   */

  function obtenerPaginaActual() {
    return paginaActual;
  }

  function obtenerSeccionesActuales() {
    return [
      ...seccionesActuales
    ];
  }

  function obtenerEstadosPublicacion() {
    return [
      ...estadosPublicacion
    ];
  }

  function obtenerSeccion(clave) {
    const claveBuscada =
      normalizarClave(clave);

    return (
      seccionesActuales.find(
        (seccion) =>
          normalizarClave(
            seccion.clave
          ) === claveBuscada
      ) ||
      null
    );
  }

  function obtenerEstadoPorId(
    idEstadoPublicacion
  ) {
    return (
      estadosPublicacion.find(
        (estado) =>
          Number(
            estado.idEstadoPublicacion
          ) ===
          Number(
            idEstadoPublicacion
          )
      ) ||
      null
    );
  }

  function obtenerEstadoPredeterminado() {
    return (
      estadosPublicacion.find(
        (estado) =>
          normalizarClave(
            estado.nombre
          ) === "PUBLICADO"
      ) ||
      estadosPublicacion.find(
        (estado) =>
          estado.esVisible === true ||
          estado.esVisible === 1
      ) ||
      estadosPublicacion[0] ||
      null
    );
  }

  function obtenerEstadoNoVisible() {
    const nombres = [
      "INACTIVO",
      "OCULTO",
      "ARCHIVADO",
      "BORRADOR"
    ];

    for (
      const nombre
      of nombres
    ) {
      const estado =
        estadosPublicacion.find(
          (item) =>
            normalizarClave(
              item.nombre
            ) === nombre
        );

      if (estado) {
        return estado;
      }
    }

    return (
      estadosPublicacion.find(
        (estado) =>
          estado.esVisible === false ||
          estado.esVisible === 0
      ) ||
      null
    );
  }

  function esSeccionVisible(seccion) {
    if (!seccion) {
      return false;
    }

    if (
      seccion.estadoVisible === true ||
      seccion.estadoVisible === 1
    ) {
      return true;
    }

    if (
      seccion.estadoVisible === false ||
      seccion.estadoVisible === 0
    ) {
      return false;
    }

    const estado =
      obtenerEstadoPorId(
        seccion.idEstadoPublicacion
      );

    if (!estado) {
      return true;
    }

    return (
      estado.esVisible === true ||
      estado.esVisible === 1
    );
  }

  function llenarSelectEstados(
    select,
    valorSeleccionado = null
  ) {
    if (!select) {
      return;
    }

    const valor =
      valorSeleccionado ??
      select.value;

    select.innerHTML = "";

    const opcionInicial =
      document.createElement(
        "option"
      );

    opcionInicial.value = "";

    opcionInicial.textContent =
      "Seleccione un estado";

    select.appendChild(
      opcionInicial
    );

    estadosPublicacion.forEach(
      (estado) => {
        const opcion =
          document.createElement(
            "option"
          );

        opcion.value =
          String(
            estado.idEstadoPublicacion
          );

        opcion.textContent =
          estado.nombre;

        select.appendChild(
          opcion
        );
      }
    );

    if (
      valor !== null &&
      valor !== undefined &&
      texto(valor) !== ""
    ) {
      select.value =
        String(valor);
    }
  }

  function validarEstado(select) {
    const idEstado =
      numeroOpcional(
        select?.value
      );

    marcarInvalido(
      select,
      !idEstado
    );

    return idEstado;
  }

  /*
   * ==========================================================
   * 8. ARCHIVOS E IMÁGENES
   * ==========================================================
   */

  function validarImagen(archivo) {
    if (!archivo) {
      return (
        "Debe seleccionar una imagen."
      );
    }

    if (
      !TIPOS_IMAGEN_PERMITIDOS
        .includes(
          archivo.type
        )
    ) {
      return (
        "La imagen debe estar en formato JPG, PNG o WEBP."
      );
    }

    if (
      !Number.isFinite(
        archivo.size
      ) ||
      archivo.size <= 0
    ) {
      return (
        "La imagen seleccionada está vacía o dañada."
      );
    }

    if (
      archivo.size >
      TAMANO_MAXIMO_IMAGEN
    ) {
      return (
        "La imagen no puede superar los 5 MB."
      );
    }

    return null;
  }

  function formatearTamanoArchivo(
    tamanoBytes
  ) {
    const tamano =
      Number(
        tamanoBytes
      );

    if (
      !Number.isFinite(
        tamano
      ) ||
      tamano < 0
    ) {
      return "";
    }

    if (tamano < 1024) {
      return `${tamano} bytes`;
    }

    if (
      tamano <
      1024 * 1024
    ) {
      return (
        `${(
          tamano / 1024
        ).toFixed(1)} KB`
      );
    }

    return (
      `${(
        tamano /
        (1024 * 1024)
      ).toFixed(2)} MB`
    );
  }

  function crearUrlTemporal(
    archivo
  ) {
    if (!archivo) {
      return "";
    }

    return global.URL
      .createObjectURL(
        archivo
      );
  }

  function liberarUrlTemporal(url) {
    if (!url) {
      return;
    }

    global.URL.revokeObjectURL(
      url
    );
  }

  function construirUrlArchivo(
    seccion
  ) {
    const ruta =
      texto(
        seccion?.rutaArchivo ||
        seccion
          ?.rutaRelativaArchivo ||
        seccion
          ?.archivo
          ?.rutaRelativa ||
        seccion
          ?.archivo
          ?.ruta
      );

    if (!ruta) {
      return "";
    }

    try {
      return new URL(ruta).href;
    } catch (error) {
      /*
       * La ruta no es absoluta.
       */
    }

    const baseApi =
      configuracion.baseUrl ||
      configuracion.urlBase ||
      configuracion.apiUrl ||
      "";

    try {
      if (baseApi) {
        const origen =
          new URL(
            baseApi
          ).origin;

        return new URL(
          ruta.replace(
            /^\/+/,
            ""
          ),
          `${origen}/`
        ).href;
      }

      return new URL(
        ruta,
        document.baseURI
      ).href;
    } catch (error) {
      return ruta;
    }
  }

  /*
   * ==========================================================
   * 9. CONSTRUCCIÓN DE DATOS PARA LA API
   * ==========================================================
   */

  function crearDatosBase(datos) {
    if (!paginaActual?.idPagina) {
      throw new Error(
        "No existe una página cargada para guardar la sección."
      );
    }

    const posicionImagen =
      normalizarClave(
        datos.posicionImagen
      );

    return {
      idSeccionPagina:
        numeroOpcional(
          datos.idSeccionPagina
        ),

      idPagina:
        Number(
          paginaActual.idPagina
        ),

      clave:
        normalizarClave(
          datos.clave
        ),

      etiqueta:
        texto(
          datos.etiqueta
        ) ||
        null,

      titulo:
        texto(
          datos.titulo
        ) ||
        null,

      subtitulo:
        texto(
          datos.subtitulo
        ) ||
        null,

      contenido:
        texto(
          datos.contenido
        ) ||
        null,

      idArchivo:
        numeroOpcional(
          datos.idArchivo
        ),

      textoAlternativo:
        texto(
          datos.textoAlternativo
        ) ||
        null,

      textoBoton:
        texto(
          datos.textoBoton
        ) ||
        null,

      urlBoton:
        texto(
          datos.urlBoton
        ) ||
        null,

      tipoEnlace:
        normalizarClave(
          datos.tipoEnlace ||
          "NINGUNO"
        ),

      tipoDiseno:
        normalizarClave(
          datos.tipoDiseno
        ) ||
        null,

      posicionImagen:
        posicionImagen &&
        posicionImagen !==
          "NINGUNA"
          ? posicionImagen
          : null,

      orden:
        Math.max(
          0,
          Number(
            datos.orden ||
            0
          )
        ),

      idEstadoPublicacion:
        Number(
          datos.idEstadoPublicacion
        )
    };
  }

  function crearDatosOcultamiento(
    seccion,
    mensajeError =
      "No existe un estado no visible para ocultar la sección."
  ) {
    const estado =
      obtenerEstadoNoVisible();

    if (!estado) {
      throw new Error(
        mensajeError
      );
    }

    return crearDatosBase({
      ...seccion,

      idSeccionPagina:
        seccion.idSeccionPagina,

      idEstadoPublicacion:
        estado.idEstadoPublicacion
    });
  }

  /*
   * ==========================================================
   * 10. REGISTRO DE EDITORES
   * ==========================================================
   */

  function registrarEditor(
    slug,
    configuracionEditor
  ) {
    const slugNormalizado =
      normalizarSlug(slug);

    if (!slugNormalizado) {
      throw new Error(
        "No se puede registrar un editor sin un slug válido."
      );
    }

    if (
      !configuracionEditor ||
      typeof configuracionEditor !==
        "object"
    ) {
      throw new Error(
        `La configuración del editor ${slugNormalizado} no es válida.`
      );
    }

    if (
      typeof configuracionEditor
        .renderizar !==
      "function"
    ) {
      throw new Error(
        `El editor ${slugNormalizado} debe implementar la función renderizar.`
      );
    }

    editoresRegistrados.set(
      slugNormalizado,
      configuracionEditor
    );

    if (
      inicializado &&
      SLUG_PAGINA ===
        slugNormalizado &&
      !editorActivo
    ) {
      editorActivo =
        configuracionEditor;

      configurarInterfazEditor();

      if (
        typeof editorActivo
          .configurarEventos ===
        "function"
      ) {
        editorActivo
          .configurarEventos(
            apiPublica
          );
      }
    }
  }

  function configurarInterfazEditor() {
    document
      .querySelectorAll(
        "[data-editor-pagina]"
      )
      .forEach(
        (editor) => {
          const slugEditor =
            normalizarSlug(
              editor.dataset
                .editorPagina
            );

          editor.hidden =
            slugEditor !==
            SLUG_PAGINA;
        }
      );

    const elementos =
      obtenerElementosGenerales();

    const tituloEditor =
      texto(
        editorActivo?.titulo
      ) ||
      `Editar ${capitalizar(
        SLUG_PAGINA
      )}`;

    const descripcionEditor =
      texto(
        editorActivo?.descripcion
      ) ||
      "Administre el contenido de la página pública.";

    const descripcionResumen =
      texto(
        editorActivo
          ?.descripcionResumen
      ) ||
      `Datos generales obtenidos desde el registro de la página ${capitalizar(
        SLUG_PAGINA
      )}.`;

    const enlacePublico =
      texto(
        editorActivo
          ?.enlacePublico
      );

    const textoPie =
      texto(
        editorActivo?.textoPie
      ) ||
      `Gestión de la página ${capitalizar(
        SLUG_PAGINA
      )}`;

    document.body.dataset
      .paginaSlug =
        SLUG_PAGINA;

    document.body.dataset
      .tituloPagina =
        tituloEditor;

    document.title =
      `${tituloEditor} | Panel administrativo LHVR`;

    if (
      elementos.contenidoPagina
    ) {
      elementos
        .contenidoPagina
        .dataset
        .titulo =
          tituloEditor;
    }

    if (
      elementos.tituloEditorPagina
    ) {
      elementos
        .tituloEditorPagina
        .textContent =
          tituloEditor;
    }

    if (
      elementos.descripcionEditorPagina
    ) {
      elementos
        .descripcionEditorPagina
        .textContent =
          descripcionEditor;
    }

    if (
      elementos.descripcionResumenPagina
    ) {
      elementos
        .descripcionResumenPagina
        .textContent =
          descripcionResumen;
    }

    if (
      elementos.enlacePaginaPublica &&
      enlacePublico
    ) {
      elementos
        .enlacePaginaPublica
        .href =
          enlacePublico;
    }

    if (
      elementos.textoPieGestion
    ) {
      elementos
        .textoPieGestion
        .textContent =
          textoPie;
    }
  }

  /*
   * ==========================================================
   * 11. NORMALIZACIÓN Y RENDERIZADO
   * ==========================================================
   */

  function normalizarRespuestas(
    respuestaContenido,
    respuestaEstados
  ) {
    const contenido =
      extraerDatos(
        respuestaContenido
      );

    const estados =
      extraerDatos(
        respuestaEstados
      );

    paginaActual =
      contenido.pagina ||
      null;

    seccionesActuales =
      Array.isArray(
        contenido.secciones
      )
        ? contenido.secciones
        : [];

    estadosPublicacion =
      Array.isArray(
        estados.estados
      )
        ? estados.estados
        : Array.isArray(estados)
          ? estados
          : [];
  }

  function renderizarResumen() {
    const elementos =
      obtenerElementosGenerales();

    if (!paginaActual) {
      return;
    }

    if (elementos.nombrePagina) {
      elementos
        .nombrePagina
        .textContent =
          paginaActual.nombre ||
          paginaActual.titulo ||
          capitalizar(
            SLUG_PAGINA
          );
    }

    if (elementos.rutaPagina) {
      elementos
        .rutaPagina
        .textContent =
          paginaActual.ruta ||
          `/${paginaActual.slug ||
            SLUG_PAGINA}`;
    }

    if (elementos.estadoPagina) {
      elementos
        .estadoPagina
        .textContent =
          paginaActual.nombreEstado ||
          paginaActual
            .estadoPublicacion ||
          "Sin estado";

      elementos
        .estadoPagina
        .className =
          "admin-etiqueta";

      const visible =
        paginaActual.estadoVisible ===
          true ||
        paginaActual.estadoVisible ===
          1;

      elementos
        .estadoPagina
        .classList
        .add(
          visible
            ? "admin-etiqueta--exito"
            : "admin-etiqueta--advertencia"
        );
    }

    const fechas =
      seccionesActuales
        .map(
          (seccion) =>
            seccion.fechaActualizacion ||
            seccion.fechaCreacion
        )
        .filter(Boolean)
        .map(
          (valor) =>
            new Date(valor)
        )
        .filter(
          (fecha) =>
            !Number.isNaN(
              fecha.getTime()
            )
        );

    const ultimaFecha =
      fechas.length
        ? new Date(
          Math.max(
            ...fechas.map(
              (fecha) =>
                fecha.getTime()
            )
          )
        )
        : paginaActual
            .fechaActualizacion ||
          paginaActual
            .fechaCreacion;

    if (
      elementos
        .fechaActualizacionPagina
    ) {
      elementos
        .fechaActualizacionPagina
        .textContent =
          formatearFecha(
            ultimaFecha
          );
    }
  }

  async function renderizarPantalla() {
    renderizarResumen();

    if (
      typeof editorActivo
        ?.reiniciarEstado ===
      "function"
    ) {
      editorActivo
        .reiniciarEstado(
          apiPublica
        );
    }

    await Promise.resolve(
      editorActivo.renderizar(
        apiPublica
      )
    );
  }

  /*
   * ==========================================================
   * 12. CARGA DEL CONTENIDO
   * ==========================================================
   */

  async function cargarContenidoPagina(
    opciones = {}
  ) {
    if (
      cargaEnProceso ||
      !editorActivo
    ) {
      return;
    }

    cargaEnProceso = true;

    ocultarMensaje();

    const elementos =
      obtenerElementosGenerales();

    const textoBoton =
      elementos
        .botonRecargarContenido
        ?.textContent ||
      "Recargar contenido";

    if (
      elementos
        .botonRecargarContenido
    ) {
      elementos
        .botonRecargarContenido
        .disabled = true;

      elementos
        .botonRecargarContenido
        .textContent =
          "Recargando...";
    }

    try {
      const [
        respuestaContenido,
        respuestaEstados
      ] = await Promise.all([
        solicitarContenido(
          SLUG_PAGINA
        ),

        solicitarEstados()
      ]);

      normalizarRespuestas(
        respuestaContenido,
        respuestaEstados
      );

      if (!paginaActual?.idPagina) {
        throw new Error(
          `La API no devolvió la página ${capitalizar(
            SLUG_PAGINA
          )}.`
        );
      }

      if (
        estadosPublicacion.length === 0
      ) {
        throw new Error(
          "No se encontraron estados de publicación disponibles."
        );
      }

      await renderizarPantalla();

      contenidoCargado = true;

      elementos.contenido
        ?.removeAttribute(
          "hidden"
        );

      if (
        opciones.mostrarConfirmacion
      ) {
        mostrarMensaje(
          "El contenido fue recargado correctamente.",
          "exito"
        );
      }
    } catch (error) {
      elementos.contenido
        ?.removeAttribute(
          "hidden"
        );

      if (
        !manejarSesionVencida(
          error
        )
      ) {
        mostrarMensaje(
          obtenerMensajeError(
            error
          ),
          "error"
        );
      }
    } finally {
      cargaEnProceso = false;

      if (
        elementos
          .botonRecargarContenido
      ) {
        elementos
          .botonRecargarContenido
          .disabled = false;

        elementos
          .botonRecargarContenido
          .textContent =
            textoBoton;
      }
    }
  }

  /*
   * ==========================================================
   * 13. PROCESOS DE GUARDADO
   * ==========================================================
   */

  async function ejecutarProcesoGuardado(
    configuracionGuardado = {}
  ) {
    if (
      guardadoEnProceso ||
      !contenidoCargado
    ) {
      return false;
    }

    ocultarMensaje();

    let datosValidos =
      true;

    try {
      if (
        typeof configuracionGuardado
          .validar ===
        "function"
      ) {
        datosValidos =
          configuracionGuardado
            .validar();
      }
    } catch (error) {
      mostrarMensaje(
        obtenerMensajeError(
          error
        ),
        "error"
      );

      return false;
    }

    if (!datosValidos) {
      return false;
    }

    guardadoEnProceso = true;

    bloquearFormulario(
      configuracionGuardado
        .formulario,
      true
    );

    establecerBotonCargando(
      configuracionGuardado
        .boton,

      configuracionGuardado
        .cargador,

      true
    );

    if (
      typeof configuracionGuardado
        .antesBloquear ===
      "function"
    ) {
      configuracionGuardado
        .antesBloquear();
    }

    try {
      await configuracionGuardado
        .ejecutar(
          datosValidos
        );

      if (
        configuracionGuardado
          .recargar !== false
      ) {
        await cargarContenidoPagina();
      }

      if (
        configuracionGuardado
          .mensajeExito
      ) {
        mostrarMensaje(
          configuracionGuardado
            .mensajeExito,
          "exito"
        );
      }

      return true;
    } catch (error) {
      if (
        !manejarSesionVencida(
          error
        )
      ) {
        mostrarMensaje(
          obtenerMensajeError(
            error
          ),
          "error"
        );
      }

      return false;
    } finally {
      guardadoEnProceso = false;

      bloquearFormulario(
        configuracionGuardado
          .formulario,
        false
      );

      establecerBotonCargando(
        configuracionGuardado
          .boton,

        configuracionGuardado
          .cargador,

        false
      );

      if (
        typeof configuracionGuardado
          .despuesDesbloquear ===
        "function"
      ) {
        configuracionGuardado
          .despuesDesbloquear();
      }
    }
  }

  async function ejecutarGuardado(
    configuracionGuardado = {}
  ) {
    return ejecutarProcesoGuardado({
      formulario:
        configuracionGuardado
          .formulario,

      boton:
        configuracionGuardado
          .boton,

      cargador:
        configuracionGuardado
          .cargador,

      antesBloquear:
        configuracionGuardado
          .antesBloquear,

      despuesDesbloquear:
        configuracionGuardado
          .despuesDesbloquear,

      mensajeExito:
        configuracionGuardado
          .mensajeExito,

      recargar:
        configuracionGuardado
          .recargar,

      validar() {
        if (
          typeof configuracionGuardado
            .obtenerDatos !==
          "function"
        ) {
          throw new Error(
            "No se indicó cómo obtener los datos que deben guardarse."
          );
        }

        return configuracionGuardado
          .obtenerDatos();
      },

      async ejecutar(datos) {
        await guardarSecciones(
          datos
        );
      }
    });
  }

  /*
   * ==========================================================
   * 14. EVENTOS GENERALES
   * ==========================================================
   */

  function configurarEventosGenerales() {
    const elementos =
      obtenerElementosGenerales();

    elementos
      .botonRecargarContenido
      ?.addEventListener(
        "click",
        () => {
          cargarContenidoPagina({
            mostrarConfirmacion:
              true
          });
        }
      );
  }

  /*
   * ==========================================================
   * 15. SESIÓN E INICIALIZACIÓN
   * ==========================================================
   */

  function obtenerSesionDisponible() {
    return (
      global
        .SesionAdministrador
        ?.obtenerSesionActual
        ?.() ||
      proteccionRutas
        ?.obtenerSesionActual
        ?.() ||
      global
        .SESION_ADMINISTRADOR ||
      null
    );
  }

  function procesarSesionValidada() {
    if (!contenidoCargado) {
      cargarContenidoPagina();
    }
  }

  function mostrarErrorEditorNoRegistrado() {
    const elementos =
      obtenerElementosGenerales();

    elementos.contenido
      ?.removeAttribute(
        "hidden"
      );

    mostrarMensaje(
      `No existe un editor registrado para la página ${capitalizar(
        SLUG_PAGINA
      )}.`,
      "error"
    );
  }

  function inicializar() {
    if (inicializado) {
      return;
    }

    inicializado = true;

    editorActivo =
      editoresRegistrados.get(
        SLUG_PAGINA
      ) ||
      null;

    if (!editorActivo) {
      mostrarErrorEditorNoRegistrado();
      return;
    }

    configurarInterfazEditor();
    configurarEventosGenerales();

    if (
      typeof editorActivo
        .configurarEventos ===
      "function"
    ) {
      editorActivo
        .configurarEventos(
          apiPublica
        );
    }

    document.addEventListener(
      "sesionadministradorlista",
      procesarSesionValidada
    );

    const sesion =
      obtenerSesionDisponible();

    if (
      sesion?.autenticado ===
      true
    ) {
      cargarContenidoPagina();
    }
  }

  /*
   * ==========================================================
   * 16. API COMPARTIDA
   * ==========================================================
   */

  const apiPublica =
    Object.freeze({
      registrarEditor,

      obtenerSlugPagina:
        () => SLUG_PAGINA,

      obtenerPaginaActual,

      obtenerSeccionesActuales,

      obtenerEstadosPublicacion,

      obtenerSeccion,

      obtenerEstadoPorId,

      obtenerEstadoPredeterminado,

      obtenerEstadoNoVisible,

      esSeccionVisible,

      llenarSelectEstados,

      validarEstado,

      cargarContenidoPagina,

      solicitarContenido,

      solicitarEstados,

      guardarSeccion,

      guardarSecciones,

      subirImagenPagina,

      obtenerIdArchivoRespuesta,

      crearDatosBase,

      crearDatosOcultamiento,

      ejecutarGuardado,

      ejecutarProcesoGuardado,

      construirUrlArchivo,

      validarImagen,

      formatearTamanoArchivo,

      crearUrlTemporal,

      liberarUrlTemporal,

      confirmarAccion,

      mostrarMensaje,

      ocultarMensaje,

      manejarSesionVencida,

      obtenerMensajeError,

      obtenerEstadoError,

      marcarInvalido,

      establecerBotonCargando,

      bloquearFormulario,

      formatearFecha,

      extraerDatos,

      texto,

      numeroOpcional,

      normalizarClave,

      normalizarSlug,

      porId,

      estaCargando:
        () => cargaEnProceso,

      estaGuardando:
        () => guardadoEnProceso,

      contenidoEstaCargado:
        () => contenidoCargado
    });

  global.PAGINAS_CONTENIDO_ADMIN =
    apiPublica;

  /*
 * Los scripts con defer pueden ejecutarse cuando el documento
 * ya está en estado "interactive", pero antes de que los módulos
 * específicos hayan terminado de registrar sus editores.
 *
 * Por eso se espera siempre a DOMContentLoaded.
 */
if (
  document.readyState ===
  "complete"
) {
  global.setTimeout(
    inicializar,
    0
  );
} else {
  document.addEventListener(
    "DOMContentLoaded",
    inicializar,
    {
      once: true
    }
  );
}
})(window);