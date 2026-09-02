/* ============================================================
   PÁGINA NOSOTROS - PANEL ADMINISTRATIVO LHVR
   ------------------------------------------------------------
   Contiene únicamente la lógica específica del editor Nosotros.

   Requiere:
   - paginas-contenido.js
   - alertas-admin.js
   - modal-admin.js
   ============================================================ */

(function configurarPaginaNosotros(global) {
  "use strict";

  const comun =
    global.PAGINAS_CONTENIDO_ADMIN;

  if (!comun) {
    throw new Error(
      "No se pudo cargar paginas-nosotros.js. " +
      "Verifique que paginas-contenido.js se cargue primero."
    );
  }

  const MAXIMO_NORMATIVAS = 12;

  const IMAGEN_PREDETERMINADA_HISTORIA =
  "../../../frontend-publico/assets/img/fachada-colegio.jpg";

  const CLAVES = Object.freeze({
    ENCABEZADO:
      "ENCABEZADO_NOSOTROS",

    HISTORIA:
      "HISTORIA_NOSOTROS",

    MISION:
      "MISION_NOSOTROS",

    VISION:
      "VISION_NOSOTROS",

    ENCABEZADO_NORMATIVA:
      "ENCABEZADO_NORMATIVA",

    PREFIJO_NORMATIVA:
      "NORMATIVA_"
  });

  let eventosConfigurados = false;
  let contadorNormativas = 0;

  let normativasPendientesOcultar = [];

  let imagenHistoriaPendiente = null;
  let urlTemporalImagenHistoria = null;

  /*
   * ==========================================================
   * 1. ELEMENTOS DEL DOCUMENTO
   * ==========================================================
   */

  function obtenerElementos() {
    const porId =
      comun.porId;

    return {
      formularioEncabezado:
        porId(
          "formularioEncabezadoNosotros"
        ),

      idSeccionEncabezado:
        porId(
          "idSeccionEncabezadoNosotros"
        ),

      claveEncabezado:
        porId(
          "claveEncabezadoNosotros"
        ),

      tituloEncabezado:
        porId(
          "tituloEncabezadoNosotros"
        ),

      descripcionEncabezado:
        porId(
          "descripcionEncabezadoNosotros"
        ),

      estadoEncabezado:
        porId(
          "estadoEncabezadoNosotros"
        ),

      botonGuardarEncabezado:
        porId(
          "botonGuardarEncabezadoNosotros"
        ),

      cargadorGuardarEncabezado:
        porId(
          "cargadorGuardarEncabezadoNosotros"
        ),

      formularioHistoria:
        porId(
          "formularioHistoriaNosotros"
        ),

      idSeccionHistoria:
        porId(
          "idSeccionHistoriaNosotros"
        ),

      claveHistoria:
        porId(
          "claveHistoriaNosotros"
        ),

      idArchivoHistoria:
        porId(
          "idArchivoHistoriaNosotros"
        ),

      tituloHistoria:
        porId(
          "tituloHistoriaNosotros"
        ),

      subtituloHistoria:
        porId(
          "subtituloHistoriaNosotros"
        ),

      contenidoHistoria:
        porId(
          "contenidoHistoriaNosotros"
        ),

      textoAlternativoHistoria:
        porId(
          "textoAlternativoHistoriaNosotros"
        ),

      estadoHistoria:
        porId(
          "estadoHistoriaNosotros"
        ),

      vistaPreviaImagenHistoria:
        porId(
          "vistaPreviaImagenHistoriaNosotros"
        ),

      nombreImagenHistoria:
        porId(
          "nombreImagenHistoriaNosotros"
        ),

      detalleImagenHistoria:
        porId(
          "detalleImagenHistoriaNosotros"
        ),

      inputImagenHistoria:
        porId(
          "inputImagenHistoriaNosotros"
        ),

      botonSeleccionarImagenHistoria:
        porId(
          "botonSeleccionarImagenHistoriaNosotros"
        ),

      botonQuitarImagenHistoria:
        porId(
          "botonQuitarImagenHistoriaNosotros"
        ),

      botonGuardarHistoria:
        porId(
          "botonGuardarHistoriaNosotros"
        ),

      cargadorGuardarHistoria:
        porId(
          "cargadorGuardarHistoriaNosotros"
        ),

      formularioPrincipios:
        porId(
          "formularioPrincipiosNosotros"
        ),

      idSeccionMision:
        porId(
          "idSeccionMisionNosotros"
        ),

      claveMision:
        porId(
          "claveMisionNosotros"
        ),

      tituloMision:
        porId(
          "tituloMisionNosotros"
        ),

      contenidoMision:
        porId(
          "contenidoMisionNosotros"
        ),

      estadoMision:
        porId(
          "estadoMisionNosotros"
        ),

      idSeccionVision:
        porId(
          "idSeccionVisionNosotros"
        ),

      claveVision:
        porId(
          "claveVisionNosotros"
        ),

      tituloVision:
        porId(
          "tituloVisionNosotros"
        ),

      contenidoVision:
        porId(
          "contenidoVisionNosotros"
        ),

      estadoVision:
        porId(
          "estadoVisionNosotros"
        ),

      botonGuardarPrincipios:
        porId(
          "botonGuardarPrincipiosNosotros"
        ),

      cargadorGuardarPrincipios:
        porId(
          "cargadorGuardarPrincipiosNosotros"
        ),

      formularioEncabezadoNormativa:
        porId(
          "formularioEncabezadoNormativa"
        ),

      idSeccionEncabezadoNormativa:
        porId(
          "idSeccionEncabezadoNormativa"
        ),

      claveEncabezadoNormativa:
        porId(
          "claveEncabezadoNormativa"
        ),

      tituloEncabezadoNormativa:
        porId(
          "tituloEncabezadoNormativa"
        ),

      descripcionEncabezadoNormativa:
        porId(
          "descripcionEncabezadoNormativa"
        ),

      estadoEncabezadoNormativa:
        porId(
          "estadoEncabezadoNormativa"
        ),

      botonGuardarEncabezadoNormativa:
        porId(
          "botonGuardarEncabezadoNormativa"
        ),

      cargadorGuardarEncabezadoNormativa:
        porId(
          "cargadorGuardarEncabezadoNormativa"
        ),

      botonAgregarNormativa:
        porId(
          "botonAgregarNormativa"
        ),

      listaTarjetasNormativa:
        porId(
          "listaTarjetasNormativa"
        ),

      estadoVacioNormativa:
        porId(
          "estadoVacioNormativa"
        ),

      botonGuardarNormativas:
        porId(
          "botonGuardarNormativas"
        ),

      cargadorGuardarNormativas:
        porId(
          "cargadorGuardarNormativas"
        ),

      plantillaTarjetaNormativa:
        porId(
          "plantillaTarjetaNormativa"
        )
    };
  }

  /*
   * ==========================================================
   * 2. IMAGEN PREDETERMINADA DE HISTORIA
   * ==========================================================
   */


  function obtenerImagenPredeterminadaHistoria() {
  const elementos =
    obtenerElementos();

  const imagen =
    elementos
      .vistaPreviaImagenHistoria;

  if (imagen) {
    imagen.dataset
      .imagenPredeterminada =
        IMAGEN_PREDETERMINADA_HISTORIA;
  }

  return IMAGEN_PREDETERMINADA_HISTORIA;
}

  function liberarUrlTemporalImagenHistoria() {
    if (!urlTemporalImagenHistoria) {
      return;
    }

    comun.liberarUrlTemporal(
      urlTemporalImagenHistoria
    );

    urlTemporalImagenHistoria = null;
  }

  function limpiarSeleccionTemporalImagenHistoria() {
    const elementos =
      obtenerElementos();

    liberarUrlTemporalImagenHistoria();

    imagenHistoriaPendiente = null;

    if (
      elementos.inputImagenHistoria
    ) {
      elementos
        .inputImagenHistoria
        .value = "";
    }
  }

  /*
   * ==========================================================
   * 3. ENCABEZADO DE NOSOTROS
   * ==========================================================
   */

  function renderizarEncabezadoNosotros() {
    const elementos =
      obtenerElementos();

    const seccion =
      comun.obtenerSeccion(
        CLAVES.ENCABEZADO
      );

    const estado =
      comun.obtenerEstadoPredeterminado();

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
          "Nosotros";
    }

    if (
      elementos.descripcionEncabezado
    ) {
      elementos
        .descripcionEncabezado
        .value =
          seccion?.subtitulo ||
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
   * 4. HISTORIA INSTITUCIONAL
   * ==========================================================
   */

  function renderizarHistoriaNosotros() {
    const elementos =
      obtenerElementos();

    const seccion =
      comun.obtenerSeccion(
        CLAVES.HISTORIA
      );

    const estado =
      comun.obtenerEstadoPredeterminado();

    if (
      elementos.idSeccionHistoria
    ) {
      elementos
        .idSeccionHistoria
        .value =
          seccion
            ?.idSeccionPagina ||
          "";
    }

    if (
      elementos.claveHistoria
    ) {
      elementos
        .claveHistoria
        .value =
          CLAVES.HISTORIA;
    }

    if (
      elementos.idArchivoHistoria
    ) {
      elementos
        .idArchivoHistoria
        .value =
          seccion?.idArchivo ||
          "";
    }

    if (
      elementos.tituloHistoria
    ) {
      elementos
        .tituloHistoria
        .value =
          seccion?.titulo ||
          "Nuestra historia";
    }

    if (
      elementos.subtituloHistoria
    ) {
      elementos
        .subtituloHistoria
        .value =
          seccion?.subtitulo ||
          "";
    }

    if (
      elementos.contenidoHistoria
    ) {
      elementos
        .contenidoHistoria
        .value =
          seccion?.contenido ||
          "";
    }

    if (
      elementos.textoAlternativoHistoria
    ) {
      elementos
        .textoAlternativoHistoria
        .value =
          seccion
            ?.textoAlternativo ||
          "Fachada del Liceo Hernán Vargas Ramírez";
    }

    comun.llenarSelectEstados(
      elementos.estadoHistoria,

      seccion
        ?.idEstadoPublicacion ||
      estado
        ?.idEstadoPublicacion
    );

    const urlImagen =
      comun.construirUrlArchivo(
        seccion
      );

    if (
      elementos.vistaPreviaImagenHistoria
    ) {
      elementos
        .vistaPreviaImagenHistoria
        .src =
          urlImagen ||
          obtenerImagenPredeterminadaHistoria();

      elementos
        .vistaPreviaImagenHistoria
        .alt =
          seccion
            ?.textoAlternativo ||
          "";
    }

    if (
      elementos.nombreImagenHistoria
    ) {
      elementos
        .nombreImagenHistoria
        .textContent =
          seccion
            ?.nombreArchivoOriginal ||
          seccion
            ?.nombreArchivoAlmacenado ||
          seccion
            ?.nombreArchivo ||
          seccion
            ?.nombreOriginalArchivo ||
          (
            seccion?.idArchivo
              ? `Archivo #${seccion.idArchivo}`
              : "Fachada institucional actual"
          );
    }

    if (
      elementos.detalleImagenHistoria
    ) {
      elementos
        .detalleImagenHistoria
        .textContent =
          seccion?.mimeTypeArchivo ||
          seccion?.extensionArchivo ||
          (
            seccion?.idArchivo
              ? "Imagen vinculada a la historia institucional."
              : "No hay una imagen cargada desde la biblioteca."
          );
    }
  }

  /*
   * ==========================================================
   * 5. MISIÓN Y VISIÓN
   * ==========================================================
   */

  function renderizarPrincipio(
    datos
  ) {
    const seccion =
      comun.obtenerSeccion(
        datos.clave
      );

    const estado =
      comun.obtenerEstadoPredeterminado();

    if (datos.idSeccion) {
      datos.idSeccion.value =
        seccion
          ?.idSeccionPagina ||
        "";
    }

    if (datos.campoClave) {
      datos.campoClave.value =
        datos.clave;
    }

    if (datos.titulo) {
      datos.titulo.value =
        seccion?.titulo ||
        datos.tituloPredeterminado;
    }

    if (datos.contenido) {
      datos.contenido.value =
        seccion?.contenido ||
        "";
    }

    comun.llenarSelectEstados(
      datos.estado,

      seccion
        ?.idEstadoPublicacion ||
      estado
        ?.idEstadoPublicacion
    );
  }

  function renderizarPrincipiosNosotros() {
    const elementos =
      obtenerElementos();

    renderizarPrincipio({
      clave:
        CLAVES.MISION,

      idSeccion:
        elementos.idSeccionMision,

      campoClave:
        elementos.claveMision,

      titulo:
        elementos.tituloMision,

      contenido:
        elementos.contenidoMision,

      estado:
        elementos.estadoMision,

      tituloPredeterminado:
        "Misión"
    });

    renderizarPrincipio({
      clave:
        CLAVES.VISION,

      idSeccion:
        elementos.idSeccionVision,

      campoClave:
        elementos.claveVision,

      titulo:
        elementos.tituloVision,

      contenido:
        elementos.contenidoVision,

      estado:
        elementos.estadoVision,

      tituloPredeterminado:
        "Visión"
    });
  }

  /*
   * ==========================================================
   * 6. ENCABEZADO DE NORMATIVA
   * ==========================================================
   */

  function renderizarEncabezadoNormativa() {
    const elementos =
      obtenerElementos();

    const seccion =
      comun.obtenerSeccion(
        CLAVES.ENCABEZADO_NORMATIVA
      );

    const estado =
      comun.obtenerEstadoPredeterminado();

    if (
      elementos
        .idSeccionEncabezadoNormativa
    ) {
      elementos
        .idSeccionEncabezadoNormativa
        .value =
          seccion
            ?.idSeccionPagina ||
          "";
    }

    if (
      elementos
        .claveEncabezadoNormativa
    ) {
      elementos
        .claveEncabezadoNormativa
        .value =
          CLAVES
            .ENCABEZADO_NORMATIVA;
    }

    if (
      elementos
        .tituloEncabezadoNormativa
    ) {
      elementos
        .tituloEncabezadoNormativa
        .value =
          seccion?.titulo ||
          "Normativa institucional";
    }

    if (
      elementos
        .descripcionEncabezadoNormativa
    ) {
      elementos
        .descripcionEncabezadoNormativa
        .value =
          seccion?.subtitulo ||
          "";
    }

    comun.llenarSelectEstados(
      elementos
        .estadoEncabezadoNormativa,

      seccion
        ?.idEstadoPublicacion ||
      estado
        ?.idEstadoPublicacion
    );
  }

  /*
   * ==========================================================
   * 7. OBTENCIÓN DE TARJETAS NORMATIVAS
   * ==========================================================
   */

  function obtenerNormativas() {
    return comun
      .obtenerSeccionesActuales()
      .filter(
        (seccion) => {
          const esNormativa =
            comun.normalizarClave(
              seccion.clave
            ).startsWith(
              CLAVES.PREFIJO_NORMATIVA
            ) ||
            comun.normalizarClave(
              seccion.tipoDiseno
            ) ===
              "TARJETA_NORMATIVA";

          // Las normativas inactivas permanecen editables.
          // Solo las retiradas dejan de aparecer en la lista.
          return (
            esNormativa &&
            !comun.esSeccionArchivada(
              seccion
            )
          );
        }
      )
      .sort(
        (a, b) =>
          Number(a.orden || 0) -
          Number(b.orden || 0)
      );
  }

  function crearClaveNormativa() {
    contadorNormativas += 1;

    return (
      `${CLAVES.PREFIJO_NORMATIVA}` +
      `${Date.now()}_` +
      `${contadorNormativas}`
    );
  }

  /*
   * ==========================================================
   * 8. ESTADO DEL ENLACE DE UNA NORMATIVA
   * ==========================================================
   */

  function actualizarCamposEnlaceNormativa(
    tarjeta
  ) {
    if (!tarjeta) {
      return;
    }

    const tipoEnlace =
      tarjeta.querySelector(
        ".normativa__tipo-enlace"
      );

    const textoBoton =
      tarjeta.querySelector(
        ".normativa__texto-boton"
      );

    const url =
      tarjeta.querySelector(
        ".normativa__url"
      );

    const sinEnlace =
      comun.normalizarClave(
        tipoEnlace?.value
      ) ===
      "NINGUNO";

    if (textoBoton) {
      textoBoton.disabled =
        sinEnlace;

      textoBoton.required =
        !sinEnlace;

      if (sinEnlace) {
        comun.marcarInvalido(
          textoBoton,
          false
        );
      }
    }

    if (url) {
      url.disabled =
        sinEnlace;

      url.required =
        !sinEnlace;

      if (sinEnlace) {
        comun.marcarInvalido(
          url,
          false
        );
      }
    }
  }

  /*
   * ==========================================================
   * 9. ACTUALIZACIÓN VISUAL DE NORMATIVAS
   * ==========================================================
   */

  function actualizarTarjetasNormativa() {
    const elementos =
      obtenerElementos();

    const tarjetas =
      Array.from(
        elementos
          .listaTarjetasNormativa
          ?.querySelectorAll(
            ".tarjeta-normativa-admin"
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
            ".normativa__numero"
          );

        const tituloVisual =
          tarjeta.querySelector(
            ".normativa__titulo-visual"
          );

        const titulo =
          comun.texto(
            tarjeta.querySelector(
              ".normativa__titulo"
            )?.value
          );

        const orden =
          tarjeta.querySelector(
            ".normativa__orden"
          );

        if (numero) {
          numero.textContent =
            `Tarjeta normativa ${indice + 1}`;
        }

        if (tituloVisual) {
          tituloVisual.textContent =
            titulo ||
            "Nueva tarjeta";
        }

        if (
          orden &&
          comun.texto(
            orden.value
          ) === ""
        ) {
          orden.value =
            String(
              11 + indice
            );
        }

        actualizarCamposEnlaceNormativa(
          tarjeta
        );
      }
    );

    if (
      elementos.estadoVacioNormativa
    ) {
      elementos
        .estadoVacioNormativa
        .hidden =
          tarjetas.length > 0;
    }
  }

  /*
   * ==========================================================
   * 10. CREACIÓN DE TARJETAS NORMATIVAS
   * ==========================================================
   */

  function crearTarjetaNormativa(
    seccion = null
  ) {
    const elementos =
      obtenerElementos();

    if (
      !elementos
        .plantillaTarjetaNormativa ||
      !elementos
        .listaTarjetasNormativa
    ) {
      return null;
    }

    const fragmento =
      elementos
        .plantillaTarjetaNormativa
        .content
        .cloneNode(true);

    const tarjeta =
      fragmento.querySelector(
        ".tarjeta-normativa-admin"
      );

    if (!tarjeta) {
      return null;
    }

    const estado =
      comun.obtenerEstadoPredeterminado();

    const idSeccion =
      tarjeta.querySelector(
        ".normativa__id"
      );

    const clave =
      tarjeta.querySelector(
        ".normativa__clave"
      );

    const etiqueta =
      tarjeta.querySelector(
        ".normativa__etiqueta"
      );

    const titulo =
      tarjeta.querySelector(
        ".normativa__titulo"
      );

    const descripcion =
      tarjeta.querySelector(
        ".normativa__descripcion"
      );

    const categoria =
      tarjeta.querySelector(
        ".normativa__categoria"
      );

    const textoBoton =
      tarjeta.querySelector(
        ".normativa__texto-boton"
      );

    const tipoEnlace =
      tarjeta.querySelector(
        ".normativa__tipo-enlace"
      );

    const url =
      tarjeta.querySelector(
        ".normativa__url"
      );

    const orden =
      tarjeta.querySelector(
        ".normativa__orden"
      );

    const selectEstado =
      tarjeta.querySelector(
        ".normativa__estado"
      );

    const botonQuitar =
      tarjeta.querySelector(
        ".normativa__quitar"
      );

    if (idSeccion) {
      idSeccion.value =
        seccion
          ?.idSeccionPagina ||
        "";
    }

    if (clave) {
      clave.value =
        seccion?.clave ||
        crearClaveNormativa();
    }

    if (etiqueta) {
      etiqueta.value =
        seccion?.etiqueta ||
        "";
    }

    if (titulo) {
      titulo.value =
        seccion?.titulo ||
        "";
    }

    if (descripcion) {
      descripcion.value =
        seccion?.subtitulo ||
        "";
    }

    if (categoria) {
      categoria.value =
        seccion?.contenido ||
        "DOCUMENTO";

      if (
        categoria.value !==
        (
          seccion?.contenido ||
          "DOCUMENTO"
        )
      ) {
        categoria.value =
          "DOCUMENTO";
      }
    }

    if (textoBoton) {
      textoBoton.value =
        seccion?.textoBoton ||
        "";
    }

    if (tipoEnlace) {
      tipoEnlace.value =
        seccion?.tipoEnlace ||
        "NINGUNO";

      if (
        tipoEnlace.value !==
        (
          seccion?.tipoEnlace ||
          "NINGUNO"
        )
      ) {
        tipoEnlace.value =
          "NINGUNO";
      }
    }

    if (url) {
      url.value =
        seccion?.urlBoton ||
        "";
    }

    if (orden) {
      orden.value =
        String(
          Number(
            seccion?.orden ||
            (
              11 +
              elementos
                .listaTarjetasNormativa
                .querySelectorAll(
                  ".tarjeta-normativa-admin"
                ).length
            )
          )
        );
    }

    comun.llenarSelectEstados(
      selectEstado,

      seccion
        ?.idEstadoPublicacion ||
      estado
        ?.idEstadoPublicacion
    );

    if (seccion) {
      tarjeta.dataset
        .seccionOriginal =
          JSON.stringify(
            seccion
          );
    }

    titulo
      ?.addEventListener(
        "input",
        actualizarTarjetasNormativa
      );

    tipoEnlace
      ?.addEventListener(
        "change",
        () => {
          actualizarCamposEnlaceNormativa(
            tarjeta
          );
        }
      );

    botonQuitar
      ?.addEventListener(
        "click",
        () => {
          quitarNormativa(
            tarjeta
          );
        }
      );

    elementos
      .listaTarjetasNormativa
      .appendChild(
        tarjeta
      );

    actualizarCamposEnlaceNormativa(
      tarjeta
    );

    actualizarTarjetasNormativa();

    return tarjeta;
  }

  /*
   * ==========================================================
   * 11. RENDERIZADO DE NORMATIVAS
   * ==========================================================
   */

  function renderizarNormativas() {
    const elementos =
      obtenerElementos();

    elementos
      .listaTarjetasNormativa
      ?.querySelectorAll(
        ".tarjeta-normativa-admin"
      )
      .forEach(
        (tarjeta) => {
          tarjeta.remove();
        }
      );

    obtenerNormativas().forEach(
      (seccion) => {
        crearTarjetaNormativa(
          seccion
        );
      }
    );

    actualizarTarjetasNormativa();
  }

  /*
   * ==========================================================
   * 12. RENDERIZADO COMPLETO DE NOSOTROS
   * ==========================================================
   */

  function renderizar() {
    renderizarEncabezadoNosotros();
    renderizarHistoriaNosotros();
    renderizarPrincipiosNosotros();
    renderizarEncabezadoNormativa();
    renderizarNormativas();
  }

  /*
   * ==========================================================
   * 13. DATOS DEL ENCABEZADO DE NOSOTROS
   * ==========================================================
   */

  function obtenerDatosEncabezadoNosotros() {
    const elementos =
      obtenerElementos();

    const titulo =
      comun.texto(
        elementos
          .tituloEncabezado
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

    if (
      !titulo ||
      !idEstado
    ) {
      comun.mostrarMensaje(
        "Complete el título del encabezado y seleccione el estado de publicación.",
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
        "Encabezado de la página Nosotros",

      titulo,

      subtitulo:
        elementos
          .descripcionEncabezado
          ?.value,

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

  /*
   * ==========================================================
   * 14. DATOS DE HISTORIA
   * ==========================================================
   */

  function obtenerDatosHistoriaNosotros() {
    const elementos =
      obtenerElementos();

    const titulo =
      comun.texto(
        elementos
          .tituloHistoria
          ?.value
      );

    const contenido =
      comun.texto(
        elementos
          .contenidoHistoria
          ?.value
      );

    const idEstado =
      comun.validarEstado(
        elementos.estadoHistoria
      );

    comun.marcarInvalido(
      elementos.tituloHistoria,
      !titulo
    );

    comun.marcarInvalido(
      elementos.contenidoHistoria,
      !contenido
    );

    if (
      !titulo ||
      !contenido ||
      !idEstado
    ) {
      comun.mostrarMensaje(
        "Complete el título, la historia y el estado de publicación.",
        "error"
      );

      return null;
    }

    return comun.crearDatosBase({
      idSeccionPagina:
        elementos
          .idSeccionHistoria
          ?.value,

      clave:
        CLAVES.HISTORIA,

      etiqueta:
        "Historia institucional",

      titulo,

      subtitulo:
        elementos
          .subtituloHistoria
          ?.value,

      contenido,

      idArchivo:
        elementos
          .idArchivoHistoria
          ?.value,

      textoAlternativo:
        elementos
          .textoAlternativoHistoria
          ?.value,

      tipoEnlace:
        "NINGUNO",

      tipoDiseno:
        "HISTORIA",

      posicionImagen:
        "DERECHA",

      orden: 2,

      idEstadoPublicacion:
        idEstado
    });
  }

  /*
   * ==========================================================
   * 15. DATOS DE MISIÓN Y VISIÓN
   * ==========================================================
   */

  function obtenerDatosPrincipio(
    datos
  ) {
    const titulo =
      comun.texto(
        datos.titulo?.value
      );

    const contenido =
      comun.texto(
        datos.contenido?.value
      );

    const idEstado =
      comun.validarEstado(
        datos.estado
      );

    comun.marcarInvalido(
      datos.titulo,
      !titulo
    );

    comun.marcarInvalido(
      datos.contenido,
      !contenido
    );

    if (
      !titulo ||
      !contenido ||
      !idEstado
    ) {
      return null;
    }

    return comun.crearDatosBase({
      idSeccionPagina:
        datos.idSeccion?.value,

      clave:
        datos.clave,

      etiqueta:
        datos.etiqueta,

      titulo,

      contenido,

      tipoEnlace:
        "NINGUNO",

      tipoDiseno:
        "TARJETA_PRINCIPIO",

      posicionImagen:
        "NINGUNA",

      orden:
        datos.orden,

      idEstadoPublicacion:
        idEstado
    });
  }

  function obtenerDatosMisionNosotros() {
    const elementos =
      obtenerElementos();

    return obtenerDatosPrincipio({
      idSeccion:
        elementos.idSeccionMision,

      clave:
        CLAVES.MISION,

      etiqueta:
        "Misión institucional",

      titulo:
        elementos.tituloMision,

      contenido:
        elementos.contenidoMision,

      estado:
        elementos.estadoMision,

      orden: 3
    });
  }

  function obtenerDatosVisionNosotros() {
    const elementos =
      obtenerElementos();

    return obtenerDatosPrincipio({
      idSeccion:
        elementos.idSeccionVision,

      clave:
        CLAVES.VISION,

      etiqueta:
        "Visión institucional",

      titulo:
        elementos.tituloVision,

      contenido:
        elementos.contenidoVision,

      estado:
        elementos.estadoVision,

      orden: 4
    });
  }

  /*
   * ==========================================================
   * 16. DATOS DEL ENCABEZADO DE NORMATIVA
   * ==========================================================
   */

  function obtenerDatosEncabezadoNormativa() {
    const elementos =
      obtenerElementos();

    const titulo =
      comun.texto(
        elementos
          .tituloEncabezadoNormativa
          ?.value
      );

    const idEstado =
      comun.validarEstado(
        elementos
          .estadoEncabezadoNormativa
      );

    comun.marcarInvalido(
      elementos
        .tituloEncabezadoNormativa,
      !titulo
    );

    if (
      !titulo ||
      !idEstado
    ) {
      comun.mostrarMensaje(
        "Complete el título de normativa y seleccione el estado de publicación.",
        "error"
      );

      return null;
    }

    return comun.crearDatosBase({
      idSeccionPagina:
        elementos
          .idSeccionEncabezadoNormativa
          ?.value,

      clave:
        CLAVES
          .ENCABEZADO_NORMATIVA,

      etiqueta:
        "Encabezado de normativa institucional",

      titulo,

      subtitulo:
        elementos
          .descripcionEncabezadoNormativa
          ?.value,

      tipoEnlace:
        "NINGUNO",

      tipoDiseno:
        "ENCABEZADO_SECCION",

      posicionImagen:
        "NINGUNA",

      orden: 10,

      idEstadoPublicacion:
        idEstado
    });
  }

  /*
   * ==========================================================
   * 17. DATOS DE UNA TARJETA NORMATIVA
   * ==========================================================
   */

  function obtenerDatosTarjetaNormativa(
    tarjeta,
    indice
  ) {
    const idSeccion =
      tarjeta.querySelector(
        ".normativa__id"
      );

    const clave =
      tarjeta.querySelector(
        ".normativa__clave"
      );

    const etiqueta =
      tarjeta.querySelector(
        ".normativa__etiqueta"
      );

    const titulo =
      tarjeta.querySelector(
        ".normativa__titulo"
      );

    const descripcion =
      tarjeta.querySelector(
        ".normativa__descripcion"
      );

    const categoria =
      tarjeta.querySelector(
        ".normativa__categoria"
      );

    const textoBoton =
      tarjeta.querySelector(
        ".normativa__texto-boton"
      );

    const tipoEnlace =
      tarjeta.querySelector(
        ".normativa__tipo-enlace"
      );

    const url =
      tarjeta.querySelector(
        ".normativa__url"
      );

    const orden =
      tarjeta.querySelector(
        ".normativa__orden"
      );

    const estado =
      tarjeta.querySelector(
        ".normativa__estado"
      );

    const valorTitulo =
      comun.texto(
        titulo?.value
      );

    const valorEtiqueta =
      comun.texto(
        etiqueta?.value
      );

    const valorTextoBoton =
      comun.texto(
        textoBoton?.value
      );

    const valorUrl =
      comun.texto(
        url?.value
      );

    const valorTipoEnlace =
      comun.normalizarClave(
        tipoEnlace?.value ||
        "NINGUNO"
      );

    const valorOrden =
      comun.numeroOpcional(
        orden?.value
      );

    const idEstado =
      comun.validarEstado(
        estado
      );

    const requiereEnlace =
      valorTipoEnlace !==
      "NINGUNO";

    comun.marcarInvalido(
      titulo,
      !valorTitulo
    );

    comun.marcarInvalido(
      textoBoton,
      requiereEnlace &&
      !valorTextoBoton
    );

    comun.marcarInvalido(
      url,
      requiereEnlace &&
      !valorUrl
    );

    comun.marcarInvalido(
      orden,
      valorOrden === null ||
      !Number.isInteger(
        valorOrden
      ) ||
      valorOrden < 0
    );

    if (
      !valorTitulo ||
      !idEstado ||
      (
        requiereEnlace &&
        (
          !valorTextoBoton ||
          !valorUrl
        )
      ) ||
      valorOrden === null ||
      !Number.isInteger(
        valorOrden
      ) ||
      valorOrden < 0
    ) {
      return null;
    }

    return comun.crearDatosBase({
      idSeccionPagina:
        idSeccion?.value,

      clave:
        clave?.value ||
        crearClaveNormativa(),

      etiqueta:
        valorEtiqueta ||
        `Normativa ${indice + 1}`,

      titulo:
        valorTitulo,

      subtitulo:
        descripcion?.value,

      contenido:
        categoria?.value ||
        "DOCUMENTO",

      textoBoton:
        requiereEnlace
          ? valorTextoBoton
          : null,

      urlBoton:
        requiereEnlace
          ? valorUrl
          : null,

      tipoEnlace:
        valorTipoEnlace,

      tipoDiseno:
        "TARJETA_NORMATIVA",

      posicionImagen:
        "NINGUNA",

      orden:
        valorOrden,

      idEstadoPublicacion:
        idEstado
    });
  }

  function obtenerDatosNormativas() {
    const elementos =
      obtenerElementos();

    const tarjetas =
      Array.from(
        elementos
          .listaTarjetasNormativa
          ?.querySelectorAll(
            ".tarjeta-normativa-admin"
          ) ||
        []
      );

    const datos =
      tarjetas.map(
        obtenerDatosTarjetaNormativa
      );

    if (
      datos.some(
        (item) =>
          item === null
      )
    ) {
      comun.mostrarMensaje(
        "Revise los datos de las tarjetas normativas marcados en rojo.",
        "error"
      );

      return null;
    }

    const ordenes =
      datos.map(
        (item) =>
          item.orden
      );

    if (
      new Set(ordenes).size !==
      ordenes.length
    ) {
      comun.mostrarMensaje(
        "Cada tarjeta normativa debe tener un número de orden diferente.",
        "error"
      );

      return null;
    }

    return datos;
  }

  /*
   * ==========================================================
   * 18. GUARDAR ENCABEZADO DE NOSOTROS
   * ==========================================================
   */

  async function guardarEncabezadoNosotros(
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
        obtenerDatosEncabezadoNosotros,

      mensajeExito:
        "El encabezado de Nosotros fue guardado correctamente."
    });
  }

  /*
   * ==========================================================
   * 19. GUARDAR HISTORIA
   * ==========================================================
   */

  async function guardarHistoriaNosotros(
    evento
  ) {
    evento.preventDefault();

    const elementos =
      obtenerElementos();

    await comun.ejecutarProcesoGuardado({
      formulario:
        elementos.formularioHistoria,

      boton:
        elementos.botonGuardarHistoria,

      cargador:
        elementos.cargadorGuardarHistoria,

      validar:
        obtenerDatosHistoriaNosotros,

      async ejecutar(datosIniciales) {
        let datosHistoria =
          datosIniciales;

        if (imagenHistoriaPendiente) {
          const respuestaCarga =
            await comun.subirImagenPagina(
              imagenHistoriaPendiente,
              elementos
                .textoAlternativoHistoria
                ?.value
            );

          const idArchivo =
            comun.obtenerIdArchivoRespuesta(
              respuestaCarga
            );

          if (!idArchivo) {
            throw new Error(
              "La API no devolvió el identificador de la imagen cargada."
            );
          }

          if (
            elementos.idArchivoHistoria
          ) {
            elementos
              .idArchivoHistoria
              .value =
                String(
                  idArchivo
                );
          }

          datosHistoria =
            obtenerDatosHistoriaNosotros();

          if (!datosHistoria) {
            throw new Error(
              "No fue posible preparar los datos de la historia institucional."
            );
          }
        }

        await comun.guardarSeccion(
          datosHistoria
        );

        limpiarSeleccionTemporalImagenHistoria();
      },

      mensajeExito:
        "La historia institucional fue guardada correctamente."
    });
  }

  /*
   * ==========================================================
   * 20. GUARDAR MISIÓN Y VISIÓN
   * ==========================================================
   */

  async function guardarPrincipiosNosotros(
    evento
  ) {
    evento.preventDefault();

    const elementos =
      obtenerElementos();

    await comun.ejecutarGuardado({
      formulario:
        elementos.formularioPrincipios,

      boton:
        elementos.botonGuardarPrincipios,

      cargador:
        elementos.cargadorGuardarPrincipios,

      obtenerDatos() {
        const mision =
          obtenerDatosMisionNosotros();

        const vision =
          obtenerDatosVisionNosotros();

        if (
          !mision ||
          !vision
        ) {
          comun.mostrarMensaje(
            "Complete correctamente la misión, la visión y sus estados de publicación.",
            "error"
          );

          return null;
        }

        return [
          mision,
          vision
        ];
      },

      mensajeExito:
        "La misión y la visión fueron guardadas correctamente."
    });
  }

  /*
   * ==========================================================
   * 21. GUARDAR ENCABEZADO DE NORMATIVA
   * ==========================================================
   */

  async function guardarEncabezadoNormativa(
    evento
  ) {
    evento.preventDefault();

    const elementos =
      obtenerElementos();

    await comun.ejecutarGuardado({
      formulario:
        elementos
          .formularioEncabezadoNormativa,

      boton:
        elementos
          .botonGuardarEncabezadoNormativa,

      cargador:
        elementos
          .cargadorGuardarEncabezadoNormativa,

      obtenerDatos:
        obtenerDatosEncabezadoNormativa,

      mensajeExito:
        "El encabezado de normativa fue guardado correctamente."
    });
  }

  /*
   * ==========================================================
   * 22. GUARDAR TARJETAS NORMATIVAS
   * ==========================================================
   */

  async function guardarNormativas() {
    const elementos =
      obtenerElementos();

    await comun.ejecutarProcesoGuardado({
      boton:
        elementos.botonGuardarNormativas,

      cargador:
        elementos.cargadorGuardarNormativas,

      validar:
        obtenerDatosNormativas,

      antesBloquear() {
        if (
          elementos.botonAgregarNormativa
        ) {
          elementos
            .botonAgregarNormativa
            .disabled = true;
        }

        elementos
          .listaTarjetasNormativa
          ?.classList.add(
            "formulario-admin__bloqueado"
          );
      },

      async ejecutar(datos) {
        await comun.guardarSecciones(
          datos
        );

        for (
          const normativa
          of normativasPendientesOcultar
        ) {
          await comun.retirarSeccion(
            normativa.idSeccionPagina
          );
        }

        normativasPendientesOcultar = [];
      },

      despuesDesbloquear() {
        if (
          elementos.botonAgregarNormativa
        ) {
          elementos
            .botonAgregarNormativa
            .disabled = false;
        }

        elementos
          .listaTarjetasNormativa
          ?.classList.remove(
            "formulario-admin__bloqueado"
          );
      },

      mensajeExito:
        "Las tarjetas normativas fueron guardadas correctamente."
    });
  }

  /*
   * ==========================================================
   * 23. AGREGAR NORMATIVA
   * ==========================================================
   */

  function agregarNormativa() {
    const elementos =
      obtenerElementos();

    const cantidad =
      elementos
        .listaTarjetasNormativa
        ?.querySelectorAll(
          ".tarjeta-normativa-admin"
        ).length ||
      0;

    if (
      cantidad >=
      MAXIMO_NORMATIVAS
    ) {
      comun.mostrarMensaje(
        `Puede configurar un máximo de ${MAXIMO_NORMATIVAS} tarjetas normativas.`,
        "error"
      );

      return;
    }

    comun.ocultarMensaje();

    const tarjeta =
      crearTarjetaNormativa();

    tarjeta
      ?.querySelector(
        ".normativa__titulo"
      )
      ?.focus();
  }

  /*
   * ==========================================================
   * 24. QUITAR NORMATIVA
   * ==========================================================
   */

  async function quitarNormativa(
    tarjeta
  ) {
    if (!tarjeta) {
      return;
    }

    const titulo =
      comun.texto(
        tarjeta.querySelector(
          ".normativa__titulo"
        )?.value
      ) ||
      "esta tarjeta normativa";

    const confirmado =
      await comun.confirmarAccion({
        tipo:
          "peligro",

        titulo:
          "Quitar tarjeta normativa",

        mensaje:
          "La tarjeta dejará de mostrarse en el sitio público después de guardar los cambios.",

        detalle:
          titulo,

        textoCancelar:
          "Cancelar",

        textoConfirmar:
          "Quitar tarjeta"
      });

    if (!confirmado) {
      return;
    }

    const idSeccion =
      comun.numeroOpcional(
        tarjeta.querySelector(
          ".normativa__id"
        )?.value
      );

    if (idSeccion) {
      let original = null;

      try {
        original =
          JSON.parse(
            tarjeta
              .dataset
              .seccionOriginal ||
            "null"
          );
      } catch (error) {
        original = null;
      }

      if (!original) {
        original =
          comun
            .obtenerSeccionesActuales()
            .find(
              (seccion) =>
                Number(
                  seccion.idSeccionPagina
                ) ===
                idSeccion
            ) ||
          null;
      }

      if (original) {
        const yaAgregada =
          normativasPendientesOcultar
            .some(
              (seccion) =>
                Number(
                  seccion.idSeccionPagina
                ) ===
                idSeccion
            );

        if (!yaAgregada) {
          normativasPendientesOcultar
            .push(
              original
            );
        }
      }
    }

    tarjeta.remove();

    actualizarTarjetasNormativa();

    comun.mostrarMensaje(
      "La tarjeta fue quitada de la lista. " +
      "Presione Guardar tarjetas de normativa para confirmar.",
      "informacion"
    );
  }

  /*
   * ==========================================================
   * 25. SELECCIÓN DE IMAGEN DE HISTORIA
   * ==========================================================
   */

  function seleccionarImagenHistoria() {
    obtenerElementos()
      .inputImagenHistoria
      ?.click();
  }

  function procesarSeleccionImagenHistoria(
    evento
  ) {
    const elementos =
      obtenerElementos();

    const archivo =
      evento
        ?.target
        ?.files
        ?.[0] ||
      null;

    if (!archivo) {
      return;
    }

    const errorValidacion =
      comun.validarImagen(
        archivo
      );

    if (errorValidacion) {
      if (
        elementos.inputImagenHistoria
      ) {
        elementos
          .inputImagenHistoria
          .value = "";
      }

      comun.mostrarMensaje(
        errorValidacion,
        "error"
      );

      return;
    }

    liberarUrlTemporalImagenHistoria();

    imagenHistoriaPendiente =
      archivo;

    urlTemporalImagenHistoria =
      comun.crearUrlTemporal(
        archivo
      );

    if (
      elementos
        .vistaPreviaImagenHistoria
    ) {
      elementos
        .vistaPreviaImagenHistoria
        .src =
          urlTemporalImagenHistoria;

      elementos
        .vistaPreviaImagenHistoria
        .alt =
          comun.texto(
            elementos
              .textoAlternativoHistoria
              ?.value
          );
    }

    if (
      elementos.nombreImagenHistoria
    ) {
      elementos
        .nombreImagenHistoria
        .textContent =
          archivo.name;
    }

    if (
      elementos.detalleImagenHistoria
    ) {
      elementos
        .detalleImagenHistoria
        .textContent =
          `${archivo.type} · ` +
          `${comun.formatearTamanoArchivo(
            archivo.size
          )}`;
    }

    comun.mostrarMensaje(
      "La imagen fue seleccionada. " +
      "Se cargará cuando guarde la historia institucional.",
      "informacion"
    );
  }

  function quitarImagenHistoria() {
    const elementos =
      obtenerElementos();

    limpiarSeleccionTemporalImagenHistoria();

    if (
      elementos.idArchivoHistoria
    ) {
      elementos
        .idArchivoHistoria
        .value = "";
    }

    if (
      elementos
        .vistaPreviaImagenHistoria
    ) {
      elementos
        .vistaPreviaImagenHistoria
        .src =
          obtenerImagenPredeterminadaHistoria();

      elementos
        .vistaPreviaImagenHistoria
        .alt = "";
    }

    if (
      elementos.nombreImagenHistoria
    ) {
      elementos
        .nombreImagenHistoria
        .textContent =
          "Sin archivo vinculado";
    }

    if (
      elementos.detalleImagenHistoria
    ) {
      elementos
        .detalleImagenHistoria
        .textContent =
          "La imagen se quitará al guardar la historia institucional.";
    }

    comun.mostrarMensaje(
      "La imagen fue retirada del formulario. " +
      "Guarde la historia para confirmar.",
      "informacion"
    );
  }

  /*
   * ==========================================================
   * 26. EVENTOS DE NOSOTROS
   * ==========================================================
   */

  function configurarEventos() {
    if (eventosConfigurados) {
      return;
    }

    eventosConfigurados = true;

    const elementos =
      obtenerElementos();

    elementos
      .formularioEncabezado
      ?.addEventListener(
        "submit",
        guardarEncabezadoNosotros
      );

    elementos
      .formularioHistoria
      ?.addEventListener(
        "submit",
        guardarHistoriaNosotros
      );

    elementos
      .formularioPrincipios
      ?.addEventListener(
        "submit",
        guardarPrincipiosNosotros
      );

    elementos
      .formularioEncabezadoNormativa
      ?.addEventListener(
        "submit",
        guardarEncabezadoNormativa
      );

    elementos
      .botonAgregarNormativa
      ?.addEventListener(
        "click",
        agregarNormativa
      );

    elementos
      .botonGuardarNormativas
      ?.addEventListener(
        "click",
        guardarNormativas
      );

    elementos
      .botonSeleccionarImagenHistoria
      ?.addEventListener(
        "click",
        seleccionarImagenHistoria
      );

    elementos
      .inputImagenHistoria
      ?.addEventListener(
        "change",
        procesarSeleccionImagenHistoria
      );

    elementos
      .botonQuitarImagenHistoria
      ?.addEventListener(
        "click",
        quitarImagenHistoria
      );
  }

  /*
   * ==========================================================
   * 27. REINICIO DEL ESTADO LOCAL
   * ==========================================================
   */

  function reiniciarEstado() {
    contadorNormativas = 0;
    normativasPendientesOcultar = [];

    limpiarSeleccionTemporalImagenHistoria();
  }

  /*
   * ==========================================================
   * 28. REGISTRO DEL EDITOR NOSOTROS
   * ==========================================================
   */

  const editorNosotros =
    Object.freeze({
      titulo:
        "Editar Nosotros",

      descripcion:
        "Modifique el encabezado, la historia, la misión, la visión y la normativa institucional.",

      descripcionResumen:
        "Datos generales obtenidos desde el registro de la página Nosotros.",

      enlacePublico:
        "../../../frontend-publico/pages/nosotros.html",

      textoPie:
        "Gestión de la página Nosotros",

      renderizar,

      configurarEventos,

      reiniciarEstado
    });

  global.PAGINAS_NOSOTROS_ADMIN =
    Object.freeze({
      renderizar,
      configurarEventos,
      reiniciarEstado,
      guardarEncabezadoNosotros,
      guardarHistoriaNosotros,
      guardarPrincipiosNosotros,
      guardarEncabezadoNormativa,
      guardarNormativas,
      agregarNormativa
    });

  comun.registrarEditor(
    "nosotros",
    editorNosotros
  );
})(window);
