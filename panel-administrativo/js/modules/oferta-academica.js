/* ============================================================
   OFERTA ACADÉMICA - PANEL ADMINISTRATIVO LHVR
   ------------------------------------------------------------
   Contiene la lógica específica del editor Oferta académica.

   Gestiona:
   - Encabezado de la página.
   - Encabezado de programas de estudio.
   - Materias de la oferta académica.
   - Ciclos educativos asociados a cada materia.
   - Nota informativa final.

   Requiere:
   - paginas-contenido.js
   - api-admin.config.js
   - api-client.js
   - alertas-admin.js
   - modal-admin.js
   ============================================================ */

(function configurarOfertaAcademica(global) {
  "use strict";

  const comun =
    global.PAGINAS_CONTENIDO_ADMIN;

  const apiClient =
    global.API_ADMIN_CLIENT;

  const configuracion =
    global.API_ADMIN_CONFIG;

  if (
    !comun ||
    !apiClient ||
    !configuracion
  ) {
    throw new Error(
      "No se pudo cargar oferta-academica.js. " +
      "Verifique paginas-contenido.js, api-admin.config.js " +
      "y api-client.js."
    );
  }

  /*
   * ==========================================================
   * 1. CONSTANTES
   * ==========================================================
   */

  const CLAVES =
    Object.freeze({
      ENCABEZADO:
        "ENCABEZADO_OFERTA_ACADEMICA",

      PROGRAMAS:
        "ENCABEZADO_PROGRAMAS_ESTUDIO",

      NOTA:
        "NOTA_OFERTA_ACADEMICA"
    });

  const TIPOS_ENLACE =
    Object.freeze([
      "INTERNO",
      "EXTERNO",
      "ARCHIVO",
      "NINGUNO"
    ]);

  let eventosConfigurados =
    false;

  let datosOferta =
    crearEstadoOfertaVacio();

  /*
   * ==========================================================
   * 2. ESTADO LOCAL
   * ==========================================================
   */

  function crearEstadoOfertaVacio() {
    return {
      ciclos: [],
      materias: [],
      relaciones: []
    };
  }

  /*
   * ==========================================================
   * 3. ELEMENTOS DEL DOCUMENTO
   * ==========================================================
   */

  function obtenerElementos() {
    const porId =
      comun.porId;

    return {
      /*
       * Encabezado principal.
       */
      formularioEncabezado:
        porId(
          "formularioEncabezadoOferta"
        ),

      idSeccionEncabezado:
        porId(
          "idSeccionEncabezadoOferta"
        ),

      claveEncabezado:
        porId(
          "claveEncabezadoOferta"
        ),

      tituloEncabezado:
        porId(
          "tituloEncabezadoOferta"
        ),

      descripcionEncabezado:
        porId(
          "descripcionEncabezadoOferta"
        ),

      estadoEncabezado:
        porId(
          "estadoEncabezadoOferta"
        ),

      botonGuardarEncabezado:
        porId(
          "botonGuardarEncabezadoOferta"
        ),

      cargadorGuardarEncabezado:
        porId(
          "cargadorGuardarEncabezadoOferta"
        ),

      /*
       * Encabezado de programas.
       */
      formularioProgramas:
        porId(
          "formularioEncabezadoProgramasOferta"
        ),

      idSeccionProgramas:
        porId(
          "idSeccionEncabezadoProgramasOferta"
        ),

      claveProgramas:
        porId(
          "claveEncabezadoProgramasOferta"
        ),

      tituloProgramas:
        porId(
          "tituloProgramasOferta"
        ),

      descripcionProgramas:
        porId(
          "descripcionProgramasOferta"
        ),

      estadoProgramas:
        porId(
          "estadoEncabezadoProgramasOferta"
        ),

      botonGuardarProgramas:
        porId(
          "botonGuardarEncabezadoProgramasOferta"
        ),

      cargadorGuardarProgramas:
        porId(
          "cargadorGuardarEncabezadoProgramasOferta"
        ),

      /*
       * Materias.
       */
      
      botonAgregarMateria:
        porId(
          "botonAgregarMateriaOferta"
        ),

      buscarMateria:
        porId(
          "buscarMateriaOferta"
        ),

      listaMaterias:
        porId(
          "listaMateriasOferta"
        ),

      estadoVacioMaterias:
        porId(
          "estadoVacioMateriasOferta"
        ),

      plantillaMateria:
        porId(
          "plantillaMateriaOferta"
        ),
      /*
       * Nota final.
       */
      formularioNota:
        porId(
          "formularioNotaOferta"
        ),

      idSeccionNota:
        porId(
          "idSeccionNotaOferta"
        ),

      claveNota:
        porId(
          "claveNotaOferta"
        ),

      contenidoNota:
        porId(
          "contenidoNotaOferta"
        ),

      estadoNota:
        porId(
          "estadoNotaOferta"
        ),

      botonGuardarNota:
        porId(
          "botonGuardarNotaOferta"
        ),

      cargadorGuardarNota:
        porId(
          "cargadorGuardarNotaOferta"
        )
    };
  }

  /*
   * ==========================================================
   * 4. ENDPOINTS
   * ==========================================================
   */

  function obtenerEndpoints() {
    return (
      configuracion
        .endpoints
        ?.ofertaAcademica ||
      {}
    );
  }

  function obtenerEndpoint(
    nombre,
    valor = null
  ) {
    const endpoints =
      obtenerEndpoints();

    const configurado =
      endpoints[nombre];

    if (
      typeof configurado ===
      "function"
    ) {
      return configurado(
        valor
      );
    }

    if (
      typeof configurado ===
        "string" &&
      configurado.trim() !== ""
    ) {
      return configurado;
    }

    const predeterminados = {
      publica:
        "/oferta-academica/publica",

      administracion:
        "/oferta-academica/administracion",

      ciclos:
        "/oferta-academica/ciclos",

      crearMateria:
        "/oferta-academica/materias",

      actualizarMateria:
        valor === null
          ? null
          : (
            "/oferta-academica/materias/" +
            encodeURIComponent(
              String(valor)
            )
          ),

      retirarMateria:
        valor === null
          ? null
          : (
            "/oferta-academica/materias/" +
            encodeURIComponent(
              String(valor)
            )
          )
    };

    return predeterminados[nombre];
  }

  /*
   * ==========================================================
   * 5. SOLICITUD HTTP AUXILIAR
   * ==========================================================
   */

  function construirUrlCompleta(
    endpoint
  ) {
    const base =
      comun.texto(
        configuracion.urlBase
      ).replace(
        /\/+$/,
        ""
      );

    const ruta =
      comun.texto(
        endpoint
      ).replace(
        /^\/+/,
        ""
      );

    return (
      `${base}/${ruta}`
    );
  }

  async function solicitudFetch(
    metodo,
    endpoint,
    datos = null
  ) {
    const controlador =
      new AbortController();

    const tiempo =
      Number(
        configuracion
          .tiempoEsperaMs
      ) ||
      15000;

    const temporizador =
      global.setTimeout(
        () =>
          controlador.abort(),
        tiempo
      );

    try {
      const opciones = {
        method:
          metodo,

        credentials:
          configuracion
            .credenciales ||
          "include",

        headers: {
          Accept:
            "application/json"
        },

        signal:
          controlador.signal
      };

      if (
        datos !== null &&
        metodo !== "GET" &&
        metodo !== "DELETE"
      ) {
        opciones.headers[
          "Content-Type"
        ] =
          "application/json";

        opciones.body =
          JSON.stringify(
            datos
          );
      }

      const respuesta =
        await fetch(
          construirUrlCompleta(
            endpoint
          ),
          opciones
        );

      const textoRespuesta =
        await respuesta.text();

      let contenido = {};

      if (textoRespuesta) {
        try {
          contenido =
            JSON.parse(
              textoRespuesta
            );
        } catch (error) {
          contenido = {
            mensaje:
              textoRespuesta
          };
        }
      }

      if (!respuesta.ok) {
        const error =
          new Error(
            contenido?.mensaje ||
            contenido?.message ||
            "La solicitud no pudo completarse."
          );

        error.statusCode =
          respuesta.status;

        error.status =
          respuesta.status;

        error.codigo =
          contenido?.codigo ||
          contenido?.code ||
          null;

        throw error;
      }

      return contenido;
    } catch (error) {
      if (
        error?.name ===
        "AbortError"
      ) {
        const errorTiempo =
          new Error(
            "La solicitud tardó demasiado tiempo."
          );

        errorTiempo.statusCode = 0;

        throw errorTiempo;
      }

      throw error;
    } finally {
      global.clearTimeout(
        temporizador
      );
    }
  }

  async function ejecutarPut(
    endpoint,
    datos
  ) {
    if (
      typeof apiClient.put ===
      "function"
    ) {
      return apiClient.put(
        endpoint,
        datos
      );
    }

    return solicitudFetch(
      "PUT",
      endpoint,
      datos
    );
  }

  async function ejecutarDelete(
    endpoint
  ) {
    if (
      typeof apiClient.delete ===
      "function"
    ) {
      return apiClient.delete(
        endpoint
      );
    }

    return solicitudFetch(
      "DELETE",
      endpoint
    );
  }

  /*
   * ==========================================================
   * 6. CARGA DE OFERTA ACADÉMICA
   * ==========================================================
   */

  function obtenerLista(
    datos,
    nombres
  ) {
    for (
      const nombre
      of nombres
    ) {
      if (
        Array.isArray(
          datos?.[nombre]
        )
      ) {
        return datos[nombre];
      }
    }

    return [];
  }

  function normalizarDatosOferta(
    respuesta
  ) {
    const datos =
      comun.extraerDatos(
        respuesta
      );

    datosOferta = {
      ciclos:
        obtenerLista(
          datos,
          [
            "ciclos",
            "ciclosEducativos"
          ]
        ),

      materias:
        obtenerLista(
          datos,
          [
            "materias",
            "materiasOferta"
          ]
        ),

      relaciones:
        obtenerLista(
          datos,
          [
            "relaciones",
            "materiasCiclos",
            "relacionesMateriasCiclos"
          ]
        )
    };
  }

  async function cargarCiclosSiFaltan() {
    if (
      datosOferta
        .ciclos
        .length > 0
    ) {
      return;
    }

    const endpoint =
      obtenerEndpoint(
        "ciclos"
      );

    const respuesta =
      await apiClient.get(
        endpoint
      );

    const datos =
      comun.extraerDatos(
        respuesta
      );

    datosOferta.ciclos =
      obtenerLista(
        datos,
        [
          "ciclos",
          "ciclosEducativos"
        ]
      );

    if (
      datosOferta.ciclos.length ===
        0 &&
      Array.isArray(datos)
    ) {
      datosOferta.ciclos =
        datos;
    }
  }

  async function cargarDatosOferta() {
    const endpointBase =
      obtenerEndpoint(
        "administracion"
      );

    const separador =
      endpointBase.includes("?")
        ? "&"
        : "?";

    const endpoint =
      `${endpointBase}${separador}` +
      `_actualizacion=${Date.now()}`;

    const respuesta =
      await apiClient.get(
        endpoint
      );

    normalizarDatosOferta(
      respuesta
    );

    await cargarCiclosSiFaltan();

    if (
      datosOferta.ciclos.length ===
      0
    ) {
      throw new Error(
        "No se encontraron ciclos educativos configurados."
      );
    }
  }

  /*
   * ==========================================================
   * 7. UTILIDADES DE MATERIAS
   * ==========================================================
   */

  function esVerdadero(valor) {
    return (
      valor === true ||
      valor === 1 ||
      valor === "1" ||
      String(valor)
        .toLowerCase() ===
        "true"
    );
  }

  function cicloEstaActivo(
    ciclo
  ) {
    if (
      ciclo?.activo ===
        undefined ||
      ciclo?.activo ===
        null
    ) {
      return true;
    }

    return esVerdadero(
      ciclo.activo
    );
  }

  function relacionEstaActiva(
    relacion
  ) {
    if (
      relacion?.activo ===
        undefined ||
      relacion?.activo ===
        null
    ) {
      return true;
    }

    return esVerdadero(
      relacion.activo
    );
  }

  function materiaEstaEnOferta(
    materia
  ) {
    const tieneMostrar =
      materia
        ?.mostrarOfertaAcademica !==
        undefined &&
      materia
        ?.mostrarOfertaAcademica !==
        null;

    const tieneActivo =
      materia?.activo !==
        undefined &&
      materia?.activo !==
        null;

    if (
      tieneMostrar &&
      !esVerdadero(
        materia
          .mostrarOfertaAcademica
      )
    ) {
      return false;
    }

    if (
      tieneActivo &&
      !esVerdadero(
        materia.activo
      )
    ) {
      return false;
    }

    return true;
  }

  function obtenerMateriasActivas() {
    return datosOferta
      .materias
      .filter(
        materiaEstaEnOferta
      )
      .sort(
        (a, b) => {
          const ordenA =
            Number(
              a.orden || 0
            );

          const ordenB =
            Number(
              b.orden || 0
            );

          if (
            ordenA !==
            ordenB
          ) {
            return (
              ordenA -
              ordenB
            );
          }

          return comun
            .texto(
              a.nombre
            )
            .localeCompare(
              comun.texto(
                b.nombre
              ),
              "es"
            );
        }
      );
  }

  function obtenerCiclosActivos() {
    return datosOferta
      .ciclos
      .filter(
        cicloEstaActivo
      )
      .sort(
        (a, b) =>
          Number(a.orden || 0) -
          Number(b.orden || 0)
      );
  }

  function obtenerRelacionesMateria(
    idMateria
  ) {
    return datosOferta
      .relaciones
      .filter(
        (relacion) =>
          Number(
            relacion.idMateria
          ) ===
            Number(
              idMateria
            ) &&
          relacionEstaActiva(
            relacion
          )
      );
  }

  function generarCodigoMateria(
    nombre
  ) {
    return comun
      .texto(
        nombre
      )
      .normalize(
        "NFD"
      )
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .toUpperCase()
      .replace(
        /[^A-Z0-9]+/g,
        "_"
      )
      .replace(
        /^_+|_+$/g,
        ""
      )
      .slice(
        0,
        30
      );
  }

  /*
   * ==========================================================
   * 8. ENCABEZADO PRINCIPAL
   * ==========================================================
   */

  function renderizarEncabezado() {
    const elementos =
      obtenerElementos();

    const seccion =
      comun.obtenerSeccion(
        CLAVES.ENCABEZADO
      );

    const estado =
      comun
        .obtenerEstadoPredeterminado();

    if (
      elementos.idSeccionEncabezado
    ) {
      elementos
        .idSeccionEncabezado
        .value =
          seccion
            ?.idSeccionPagina ||
          "";
    }

    if (
      elementos.claveEncabezado
    ) {
      elementos
        .claveEncabezado
        .value =
          CLAVES.ENCABEZADO;
    }

    if (
      elementos.tituloEncabezado
    ) {
      elementos
        .tituloEncabezado
        .value =
          seccion?.titulo ||
          "Oferta académica";
    }

    if (
      elementos.descripcionEncabezado
    ) {
      elementos
        .descripcionEncabezado
        .value =
          seccion?.subtitulo ||
          seccion?.contenido ||
          "";
    }

    comun.llenarSelectEstados(
      elementos.estadoEncabezado,

      seccion
        ?.idEstadoPublicacion ||
      estado
        ?.idEstadoPublicacion
    );
  }

  /*
   * ==========================================================
   * 9. ENCABEZADO DE PROGRAMAS
   * ==========================================================
   */

  function renderizarProgramas() {
    const elementos =
      obtenerElementos();

    const seccion =
      comun.obtenerSeccion(
        CLAVES.PROGRAMAS
      );

    const estado =
      comun
        .obtenerEstadoPredeterminado();

    if (
      elementos.idSeccionProgramas
    ) {
      elementos
        .idSeccionProgramas
        .value =
          seccion
            ?.idSeccionPagina ||
          "";
    }

    if (
      elementos.claveProgramas
    ) {
      elementos
        .claveProgramas
        .value =
          CLAVES.PROGRAMAS;
    }

    if (
      elementos.tituloProgramas
    ) {
      elementos
        .tituloProgramas
        .value =
          seccion?.titulo ||
          "Programas de estudio";
    }

    if (
      elementos.descripcionProgramas
    ) {
      elementos
        .descripcionProgramas
        .value =
          seccion?.subtitulo ||
          seccion?.contenido ||
          "";
    }

    comun.llenarSelectEstados(
      elementos.estadoProgramas,

      seccion
        ?.idEstadoPublicacion ||
      estado
        ?.idEstadoPublicacion
    );
  }

  /*
   * ==========================================================
   * 10. NOTA FINAL
   * ==========================================================
   */

  function renderizarNota() {
    const elementos =
      obtenerElementos();

    const seccion =
      comun.obtenerSeccion(
        CLAVES.NOTA
      );

    const estado =
      comun
        .obtenerEstadoPredeterminado();

    if (
      elementos.idSeccionNota
    ) {
      elementos
        .idSeccionNota
        .value =
          seccion
            ?.idSeccionPagina ||
          "";
    }

    if (
      elementos.claveNota
    ) {
      elementos
        .claveNota
        .value =
          CLAVES.NOTA;
    }

    if (
      elementos.contenidoNota
    ) {
      elementos
        .contenidoNota
        .value =
          seccion?.contenido ||
          seccion?.subtitulo ||
          "";
    }

    comun.llenarSelectEstados(
      elementos.estadoNota,

      seccion
        ?.idEstadoPublicacion ||
      estado
        ?.idEstadoPublicacion
    );
  }

  /*
   * ==========================================================
   * 11. DATOS DE SECCIONES GENERALES
   * ==========================================================
   */

  function obtenerDatosEncabezado() {
    const elementos =
      obtenerElementos();

    const titulo =
      comun.texto(
        elementos
          .tituloEncabezado
          ?.value
      );

    const descripcion =
      comun.texto(
        elementos
          .descripcionEncabezado
          ?.value
      );

    const idEstado =
      comun.validarEstado(
        elementos.estadoEncabezado
      );

    comun.marcarInvalido(
      elementos.tituloEncabezado,
      !titulo
    );

    comun.marcarInvalido(
      elementos.descripcionEncabezado,
      !descripcion
    );

    if (
      !titulo ||
      !descripcion ||
      !idEstado
    ) {
      comun.mostrarMensaje(
        "Complete el título, la descripción y el estado del encabezado de Oferta académica.",
        "error"
      );

      return null;
    }

    return comun.crearDatosBase({
      idSeccionPagina:
        elementos
          .idSeccionEncabezado
          ?.value,

      clave:
        CLAVES.ENCABEZADO,

      etiqueta:
        "Encabezado de Oferta académica",

      titulo,

      subtitulo:
        descripcion,

      tipoEnlace:
        "NINGUNO",

      tipoDiseno:
        "ENCABEZADO_PAGINA",

      posicionImagen:
        "NINGUNA",

      orden: 1,

      idEstadoPublicacion:
        idEstado
    });
  }

  function obtenerDatosProgramas() {
    const elementos =
      obtenerElementos();

    const titulo =
      comun.texto(
        elementos
          .tituloProgramas
          ?.value
      );

    const descripcion =
      comun.texto(
        elementos
          .descripcionProgramas
          ?.value
      );

    const idEstado =
      comun.validarEstado(
        elementos.estadoProgramas
      );

    comun.marcarInvalido(
      elementos.tituloProgramas,
      !titulo
    );

    comun.marcarInvalido(
      elementos.descripcionProgramas,
      !descripcion
    );

    if (
      !titulo ||
      !descripcion ||
      !idEstado
    ) {
      comun.mostrarMensaje(
        "Complete el título, la descripción y el estado de Programas de estudio.",
        "error"
      );

      return null;
    }

    return comun.crearDatosBase({
      idSeccionPagina:
        elementos
          .idSeccionProgramas
          ?.value,

      clave:
        CLAVES.PROGRAMAS,

      etiqueta:
        "Encabezado de programas de estudio",

      titulo,

      subtitulo:
        descripcion,

      tipoEnlace:
        "NINGUNO",

      tipoDiseno:
        "ENCABEZADO_SECCION",

      posicionImagen:
        "NINGUNA",

      orden: 2,

      idEstadoPublicacion:
        idEstado
    });
  }

  function obtenerDatosNota() {
    const elementos =
      obtenerElementos();

    const contenido =
      comun.texto(
        elementos
          .contenidoNota
          ?.value
      );

    const idEstado =
      comun.validarEstado(
        elementos.estadoNota
      );

    comun.marcarInvalido(
      elementos.contenidoNota,
      !contenido
    );

    if (
      !contenido ||
      !idEstado
    ) {
      comun.mostrarMensaje(
        "Ingrese el texto de la nota informativa y seleccione un estado.",
        "error"
      );

      return null;
    }

    return comun.crearDatosBase({
      idSeccionPagina:
        elementos
          .idSeccionNota
          ?.value,

      clave:
        CLAVES.NOTA,

      etiqueta:
        "Nota informativa de Oferta académica",

      contenido,

      tipoEnlace:
        "NINGUNO",

      tipoDiseno:
        "NOTA_INFORMATIVA",

      posicionImagen:
        "NINGUNA",

      orden: 3,

      idEstadoPublicacion:
        idEstado
    });
  }

  /*
   * ==========================================================
   * 12. GUARDAR SECCIONES GENERALES
   * ==========================================================
   */

  async function guardarEncabezado(
    evento
  ) {
    evento.preventDefault();

    const elementos =
      obtenerElementos();

    await comun.ejecutarGuardado({
      formulario:
        elementos.formularioEncabezado,

      boton:
        elementos.botonGuardarEncabezado,

      cargador:
        elementos.cargadorGuardarEncabezado,

      obtenerDatos:
        obtenerDatosEncabezado,

      mensajeExito:
        "El encabezado de Oferta académica fue guardado correctamente."
    });
  }

  async function guardarProgramas(
    evento
  ) {
    evento.preventDefault();

    const elementos =
      obtenerElementos();

    await comun.ejecutarGuardado({
      formulario:
        elementos.formularioProgramas,

      boton:
        elementos.botonGuardarProgramas,

      cargador:
        elementos.cargadorGuardarProgramas,

      obtenerDatos:
        obtenerDatosProgramas,

      mensajeExito:
        "El encabezado de Programas de estudio fue guardado correctamente."
    });
  }

  async function guardarNota(
    evento
  ) {
    evento.preventDefault();

    const elementos =
      obtenerElementos();

    await comun.ejecutarGuardado({
      formulario:
        elementos.formularioNota,

      boton:
        elementos.botonGuardarNota,

      cargador:
        elementos.cargadorGuardarNota,

      obtenerDatos:
        obtenerDatosNota,

      mensajeExito:
        "La nota informativa fue guardada correctamente."
    });
  }

  /*
   * ==========================================================
   * 13. CICLOS DE UNA MATERIA
   * ==========================================================
   */

  function crearCheckboxCiclo(
    ciclo,
    seleccionado
  ) {
    const etiqueta =
      document.createElement(
        "label"
      );

    etiqueta.className =
      "oferta-materia__ciclo";

    const checkbox =
      document.createElement(
        "input"
      );

    checkbox.type =
      "checkbox";

    checkbox.className =
      "oferta-materia__ciclo-checkbox";

    checkbox.value =
      String(
        ciclo.idCicloEducativo
      );

    checkbox.checked =
      seleccionado;

    checkbox.dataset.orden =
      String(
        Number(
          ciclo.orden || 0
        )
      );

    const texto =
      document.createElement(
        "span"
      );

    texto.textContent =
      comun.texto(
        ciclo.nombre
      );

    etiqueta.appendChild(
      checkbox
    );

    etiqueta.appendChild(
      texto
    );

    return etiqueta;
  }

  function renderizarCiclosMateria(
    tarjeta,
    materia
  ) {
    const contenedor =
      tarjeta.querySelector(
        ".oferta-materia__ciclos"
      );

    if (!contenedor) {
      return;
    }

    contenedor.innerHTML = "";

    const relaciones =
      materia?.idMateria
        ? obtenerRelacionesMateria(
          materia.idMateria
        )
        : [];

    const idsSeleccionados =
      new Set(
        relaciones.map(
          (relacion) =>
            Number(
              relacion
                .idCicloEducativo
            )
        )
      );

    obtenerCiclosActivos()
      .forEach(
        (ciclo) => {
          contenedor.appendChild(
            crearCheckboxCiclo(
              ciclo,
              idsSeleccionados.has(
                Number(
                  ciclo
                    .idCicloEducativo
                )
              )
            )
          );
        }
      );
  }

  /*
   * ==========================================================
   * 14. CAMPOS DE ENLACE
   * ==========================================================
   */

  function actualizarCamposEnlace(
    tarjeta
  ) {
    const tipo =
      comun.normalizarClave(
        tarjeta.querySelector(
          ".oferta-materia__tipo-enlace"
        )?.value ||
        "NINGUNO"
      );

    const url =
      tarjeta.querySelector(
        ".oferta-materia__url"
      );

    const textoBoton =
      tarjeta.querySelector(
        ".oferta-materia__texto-boton"
      );

    const requiereEnlace =
      tipo !==
      "NINGUNO";

    if (url) {
      url.disabled =
        !requiereEnlace;

      url.required =
        requiereEnlace;

      if (!requiereEnlace) {
        comun.marcarInvalido(
          url,
          false
        );
      }
    }

    if (textoBoton) {
      textoBoton.disabled =
        !requiereEnlace;

      textoBoton.required =
        requiereEnlace;

      if (!requiereEnlace) {
        comun.marcarInvalido(
          textoBoton,
          false
        );
      }
    }
  }

  /*
   * ==========================================================
   * 15. TARJETAS DE MATERIAS
   * ==========================================================
   */

  function actualizarNumeracionMaterias() {
    const elementos =
      obtenerElementos();

    const tarjetas =
      Array.from(
        elementos
          .listaMaterias
          ?.querySelectorAll(
            ".oferta-materia-admin"
          ) ||
        []
      );

    tarjetas.forEach(
      (
        tarjeta,
        indice
      ) => {
        const numero =
          tarjeta.querySelector(
            ".oferta-materia__numero"
          );

        const tituloVisual =
          tarjeta.querySelector(
            ".oferta-materia__titulo-visual"
          );

        const nombre =
          comun.texto(
            tarjeta.querySelector(
              ".oferta-materia__nombre"
            )?.value
          );

        if (numero) {
          numero.textContent =
            `Materia ${indice + 1}`;
        }

        if (tituloVisual) {
          tituloVisual.textContent =
            nombre ||
            "Nueva materia";
        }
      }
    );

    if (
      elementos.estadoVacioMaterias
    ) {
      elementos
        .estadoVacioMaterias
        .hidden =
          tarjetas.length >
          0;
    }
  }

  function crearTarjetaMateria(
    materia = null,
    opciones = {}
  ) {
    const elementos =
      obtenerElementos();

    if (
      !elementos.plantillaMateria ||
      !elementos.listaMaterias
    ) {
      return null;
    }

    const fragmento =
      elementos
        .plantillaMateria
        .content
        .cloneNode(
          true
        );

    const tarjeta =
      fragmento.querySelector(
        ".oferta-materia-admin"
      );

    if (!tarjeta) {
      return null;
    }

    const id =
      tarjeta.querySelector(
        ".oferta-materia__id"
      );

    const codigo =
      tarjeta.querySelector(
        ".oferta-materia__codigo"
      );

    const nombre =
      tarjeta.querySelector(
        ".oferta-materia__nombre"
      );

    const descripcion =
      tarjeta.querySelector(
        ".oferta-materia__descripcion"
      );

    const tipoEnlace =
      tarjeta.querySelector(
        ".oferta-materia__tipo-enlace"
      );

    const url =
      tarjeta.querySelector(
        ".oferta-materia__url"
      );

    const textoBoton =
      tarjeta.querySelector(
        ".oferta-materia__texto-boton"
      );

    const orden =
      tarjeta.querySelector(
        ".oferta-materia__orden"
      );

    const estado =
      tarjeta.querySelector(
        ".oferta-materia__estado"
      );

    const estadoPredeterminado =
      comun
        .obtenerEstadoPredeterminado();

    if (id) {
      id.value =
        materia
          ?.idMateria ||
        "";
    }

    if (codigo) {
      codigo.value =
        materia
          ?.codigo ||
        "";
    }

    if (nombre) {
      nombre.value =
        materia
          ?.nombre ||
        "";
    }

    if (descripcion) {
      descripcion.value =
        materia
          ?.descripcionPublica ||
        "";
    }

    if (tipoEnlace) {
      tipoEnlace.value =
        comun.normalizarClave(
          materia
            ?.tipoEnlace ||
          "NINGUNO"
        );
    }

    if (url) {
      url.value =
        materia
          ?.urlPlanEstudio ||
        "";
    }

    if (textoBoton) {
      textoBoton.value =
        materia
          ?.textoBoton ||
        (
          materia
            ?.tipoEnlace ===
            "NINGUNO"
            ? ""
            : "Ver plan de estudio"
        );
    }

    if (orden) {
      orden.value =
        String(
          Number(
            materia?.orden ??
            opciones.orden ??
            0
          )
        );
    }

    comun.llenarSelectEstados(
      estado,

      materia
        ?.idEstadoPublicacion ||
      estadoPredeterminado
        ?.idEstadoPublicacion
    );

    renderizarCiclosMateria(
      tarjeta,
      materia
    );

    actualizarCamposEnlace(
      tarjeta
    );

    nombre
      ?.addEventListener(
        "input",
        actualizarNumeracionMaterias
      );

    tipoEnlace
      ?.addEventListener(
        "change",
        () =>
          actualizarCamposEnlace(
            tarjeta
          )
      );

    tarjeta
      .querySelector(
        ".oferta-materia__guardar"
      )
      ?.addEventListener(
        "click",
        () =>
          guardarMateria(
            tarjeta
          )
      );

    tarjeta
      .querySelector(
        ".oferta-materia__retirar"
      )
      ?.addEventListener(
        "click",
        () =>
          retirarMateria(
            tarjeta
          )
      );

    elementos
      .listaMaterias
      .appendChild(
        tarjeta
      );

    actualizarNumeracionMaterias();
    filtrarMaterias();

    return tarjeta;
  }
  function filtrarMaterias() {
    const elementos =
      obtenerElementos();

    const busqueda =
      comun
        .texto(
          elementos
            .buscarMateria
            ?.value
        )
        .normalize("NFD")
        .replace(
          /[\u0300-\u036f]/g,
          ""
        )
        .toLowerCase();

    const tarjetas =
      elementos
        .listaMaterias
        ?.querySelectorAll(
          ".oferta-materia-admin"
        ) || [];

    tarjetas.forEach(
      (tarjeta) => {
        const nombre =
          comun
            .texto(
              tarjeta.querySelector(
                ".oferta-materia__nombre"
              )?.value
            )
            .normalize("NFD")
            .replace(
              /[\u0300-\u036f]/g,
              ""
            )
            .toLowerCase();

        tarjeta.hidden =
          Boolean(
            busqueda &&
            !nombre.includes(
              busqueda
            )
          );
      }
    );
  }

  function renderizarMaterias() {
    const elementos =
      obtenerElementos();

      

    if (
      !elementos.listaMaterias
    ) {
      return;
    }

    elementos
      .listaMaterias
      .querySelectorAll(
        ".oferta-materia-admin"
      )
      .forEach(
        (tarjeta) =>
          tarjeta.remove()
      );

    obtenerMateriasActivas()
      .forEach(
        (materia) =>
          crearTarjetaMateria(
            materia
          )
      );

    actualizarNumeracionMaterias();
  }

  /*
   * ==========================================================
   * 16. OBTENER DATOS DE UNA MATERIA
   * ==========================================================
   */

  function marcarContenedorCiclos(
    contenedor,
    invalido
  ) {
    if (!contenedor) {
      return;
    }

    contenedor.classList.toggle(
      "es-invalido",
      Boolean(
        invalido
      )
    );

    if (invalido) {
      contenedor.setAttribute(
        "aria-invalid",
        "true"
      );
    } else {
      contenedor.removeAttribute(
        "aria-invalid"
      );
    }
  }

  function obtenerDatosMateria(
    tarjeta
  ) {
    const idMateria =
      comun.numeroOpcional(
        tarjeta.querySelector(
          ".oferta-materia__id"
        )?.value
      );

    const codigoControl =
      tarjeta.querySelector(
        ".oferta-materia__codigo"
      );

    const nombreControl =
      tarjeta.querySelector(
        ".oferta-materia__nombre"
      );

    const descripcionControl =
      tarjeta.querySelector(
        ".oferta-materia__descripcion"
      );

    const tipoControl =
      tarjeta.querySelector(
        ".oferta-materia__tipo-enlace"
      );

    const urlControl =
      tarjeta.querySelector(
        ".oferta-materia__url"
      );

    const textoBotonControl =
      tarjeta.querySelector(
        ".oferta-materia__texto-boton"
      );

    const ordenControl =
      tarjeta.querySelector(
        ".oferta-materia__orden"
      );

    const estadoControl =
      tarjeta.querySelector(
        ".oferta-materia__estado"
      );

    const ciclosContenedor =
      tarjeta.querySelector(
        ".oferta-materia__ciclos"
      );

    const nombre =
      comun.texto(
        nombreControl
          ?.value
      );

    const descripcion =
      comun.texto(
        descripcionControl
          ?.value
      );

    const tipoEnlace =
      comun.normalizarClave(
        tipoControl
          ?.value ||
        "NINGUNO"
      );

    const urlPlanEstudio =
      comun.texto(
        urlControl
          ?.value
      );

    const textoBoton =
      comun.texto(
        textoBotonControl
          ?.value
      );

    const orden =
      comun.numeroOpcional(
        ordenControl
          ?.value
      );

    const idEstadoPublicacion =
      comun.validarEstado(
        estadoControl
      );

    const requiereEnlace =
      tipoEnlace !==
      "NINGUNO";

    let codigo =
      comun.texto(
        codigoControl
          ?.value
      );

    if (!codigo) {
      codigo =
        generarCodigoMateria(
          nombre
        );

      if (
        codigoControl
      ) {
        codigoControl.value =
          codigo;
      }
    }

    const ciclos =
      Array.from(
        ciclosContenedor
          ?.querySelectorAll(
            ".oferta-materia__ciclo-checkbox:checked"
          ) ||
        []
      )
        .map(
          (
            checkbox,
            indice
          ) => ({
            idCicloEducativo:
              Number(
                checkbox.value
              ),

            orden:
              indice + 1
          })
        );

    comun.marcarInvalido(
      nombreControl,
      !nombre
    );

    comun.marcarInvalido(
      descripcionControl,
      !descripcion
    );

    comun.marcarInvalido(
      tipoControl,
      !TIPOS_ENLACE
        .includes(
          tipoEnlace
        )
    );

    comun.marcarInvalido(
      urlControl,
      requiereEnlace &&
      !urlPlanEstudio
    );

    comun.marcarInvalido(
      textoBotonControl,
      requiereEnlace &&
      !textoBoton
    );

    comun.marcarInvalido(
      ordenControl,
      orden === null ||
      !Number.isInteger(
        orden
      ) ||
      orden < 0
    );

    marcarContenedorCiclos(
      ciclosContenedor,
      ciclos.length === 0
    );

    if (!nombre) {
      comun.mostrarMensaje(
        "Debe indicar el nombre de la materia.",
        "error"
      );

      return null;
    }

    if (!descripcion) {
      comun.mostrarMensaje(
        "Debe indicar la descripción de la materia.",
        "error"
      );

      return null;
    }

    if (
      !TIPOS_ENLACE.includes(
        tipoEnlace
      )
    ) {
      comun.mostrarMensaje(
        "Seleccione un tipo de enlace válido.",
        "error"
      );

      return null;
    }

    if (
      requiereEnlace &&
      !textoBoton
    ) {
      comun.mostrarMensaje(
        "Debe indicar el texto del botón o seleccionar Sin enlace.",
        "error"
      );

      return null;
    }

    if (
      requiereEnlace &&
      !urlPlanEstudio
    ) {
      comun.mostrarMensaje(
        "Debe indicar la dirección del enlace o seleccionar Sin enlace.",
        "error"
      );

      return null;
    }

    if (
      orden === null ||
      !Number.isInteger(orden) ||
      orden < 0
    ) {
      comun.mostrarMensaje(
        "El orden de la materia no es válido.",
        "error"
      );

      return null;
    }

    if (!idEstadoPublicacion) {
      comun.mostrarMensaje(
        "Seleccione el estado de publicación.",
        "error"
      );

      return null;
    }

    if (ciclos.length === 0) {
      comun.mostrarMensaje(
        "Debe seleccionar al menos un ciclo educativo.",
        "error"
      );

      return null;
    }

    return {
      idMateria,

      codigo,

      nombre,

      descripcionPublica:
        descripcion,

      urlPlanEstudio:
        requiereEnlace
          ? urlPlanEstudio
          : null,

      textoBoton:
        requiereEnlace
          ? textoBoton
          : null,

      tipoEnlace,

      orden,

      mostrarOfertaAcademica:
        true,

      activo:
        true,

      idEstadoPublicacion,

      ciclos
    };
  }

  /*
   * ==========================================================
   * 17. GUARDAR MATERIA
   * ==========================================================
   */

  async function guardarMateria(
    tarjeta
  ) {
    if (!tarjeta) {
      return;
    }

    const boton =
      tarjeta.querySelector(
        ".oferta-materia__guardar"
      );

    const cargador =
      tarjeta.querySelector(
        ".oferta-materia__cargador"
      );

    const idActual =
      comun.numeroOpcional(
        tarjeta.querySelector(
          ".oferta-materia__id"
        )?.value
      );

    await comun.ejecutarProcesoGuardado({
      formulario:
        tarjeta,

      boton,

      cargador,

      validar() {
        return obtenerDatosMateria(
          tarjeta
        );
      },

      async ejecutar(datos) {
        if (datos.idMateria) {
          await ejecutarPut(
            obtenerEndpoint(
              "actualizarMateria",
              datos.idMateria
            ),
            datos
          );
        } else {
          await apiClient.post(
            obtenerEndpoint(
              "crearMateria"
            ),
            datos
          );
        }

        await cargarDatosOferta();

        renderizarMaterias();
      },

      recargar:
        false,

      mensajeExito:
        idActual
          ? "La materia fue actualizada correctamente."
          : "La materia fue agregada correctamente."
    });
  }

  /*
   * ==========================================================
   * 18. RETIRAR MATERIA
   * ==========================================================
   */

  async function retirarMateria(
    tarjeta
  ) {
    if (!tarjeta) {
      return;
    }

    const idMateria =
      comun.numeroOpcional(
        tarjeta.querySelector(
          ".oferta-materia__id"
        )?.value
      );

    /*
     * Si todavía no fue guardada,
     * únicamente se elimina del formulario.
     */
    if (!idMateria) {
      tarjeta.remove();

      actualizarNumeracionMaterias();

      comun.mostrarMensaje(
        "La materia nueva fue retirada del formulario.",
        "informacion"
      );

      return;
    }

    const nombre =
      comun.texto(
        tarjeta.querySelector(
          ".oferta-materia__nombre"
        )?.value
      ) ||
      "esta materia";

    const confirmado =
      await comun.confirmarAccion({
        tipo:
          "peligro",

        titulo:
          "Retirar materia",

        mensaje:
          "La materia dejará de mostrarse en Oferta académica.",

        detalle:
          nombre,

        textoCancelar:
          "Cancelar",

        textoConfirmar:
          "Retirar materia"
      });

    if (!confirmado) {
      return;
    }

    const boton =
      tarjeta.querySelector(
        ".oferta-materia__retirar"
      );

    await comun.ejecutarProcesoGuardado({
      formulario:
        tarjeta,

      boton,

      cargador:
        null,

      validar() {
        return true;
      },

      async ejecutar() {
        await ejecutarDelete(
          obtenerEndpoint(
            "retirarMateria",
            idMateria
          )
        );

        await cargarDatosOferta();

        renderizarMaterias();
      },

      recargar:
        false,

      mensajeExito:
        "La materia fue retirada de Oferta académica."
    });
  }

  /*
   * ==========================================================
   * 19. AGREGAR MATERIA
   * ==========================================================
   */

  function obtenerSiguienteOrden() {
    const ordenes =
      obtenerMateriasActivas()
        .map(
          (materia) =>
            Number(
              materia.orden
            )
        )
        .filter(
          Number.isFinite
        );

    if (
      ordenes.length ===
      0
    ) {
      return 1;
    }

    return (
      Math.max(
        ...ordenes
      ) + 1
    );
  }

  function agregarMateria() {
    comun.ocultarMensaje();

    const tarjeta =
      crearTarjetaMateria(
        null,
        {
          orden:
            obtenerSiguienteOrden()
        }
      );

    if (!tarjeta) {
      return;
    }

    const desplegable =
      tarjeta.querySelector(
        ".oferta-materia-admin__desplegable"
      );

    if (desplegable) {
      desplegable.open = true;
    }

    tarjeta
      .querySelector(
        ".oferta-materia__nombre"
      )
      ?.focus();
  }

  /*
   * ==========================================================
   * 20. RENDERIZADO GENERAL
   * ==========================================================
   */

  async function renderizar() {
    renderizarEncabezado();
    renderizarProgramas();
    renderizarNota();

    await cargarDatosOferta();

    renderizarMaterias();
  }

  /*
   * ==========================================================
   * 21. EVENTOS
   * ==========================================================
   */

  function configurarEventos() {
    if (
      eventosConfigurados
    ) {
      return;
    }

    eventosConfigurados =
      true;

    const elementos =
      obtenerElementos();

    elementos
      .formularioEncabezado
      ?.addEventListener(
        "submit",
        guardarEncabezado
      );

    elementos
      .formularioProgramas
      ?.addEventListener(
        "submit",
        guardarProgramas
      );

    elementos
      .formularioNota
      ?.addEventListener(
        "submit",
        guardarNota
      );

    elementos
      .botonAgregarMateria
      ?.addEventListener(
        "click",
        agregarMateria
      );

    elementos
    .buscarMateria
    ?.addEventListener(
      "input",
      filtrarMaterias
    );
  }

  /*
   * ==========================================================
   * 22. REINICIO DEL ESTADO
   * ==========================================================
   */

  function reiniciarEstado() {
    datosOferta =
      crearEstadoOfertaVacio();
  }

  /*
   * ==========================================================
   * 23. REGISTRO DEL EDITOR
   * ==========================================================
   */

  const editorOfertaAcademica =
    Object.freeze({
      titulo:
        "Editar Oferta académica",

      descripcion:
        "Administre el encabezado, los programas de estudio, las materias y la nota informativa de la página Oferta académica.",

      descripcionResumen:
        "Datos generales obtenidos desde el registro de la página Oferta académica.",

      enlacePublico:
        "../../../frontend-publico/pages/oferta-academica.html",

      textoPie:
        "Gestión de la página Oferta académica",

      renderizar,

      configurarEventos,

      reiniciarEstado
    });

  /*
   * API específica del módulo.
   */
  global.OFERTA_ACADEMICA_ADMIN =
    Object.freeze({
      renderizar,
      configurarEventos,
      reiniciarEstado,
      cargarDatosOferta,
      agregarMateria,
      guardarMateria,
      retirarMateria,
      guardarEncabezado,
      guardarProgramas,
      guardarNota
    });

  /*
   * Registrar Oferta académica dentro
   * del editor compartido de páginas.
   */
  comun.registrarEditor(
    "oferta-academica",
    editorOfertaAcademica
  );
})(window);