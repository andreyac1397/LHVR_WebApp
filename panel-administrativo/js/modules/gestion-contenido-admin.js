/**
 * Gestión reutilizable de contenido administrativo.
 *
 * Cada módulo define window.CONFIGURACION_GESTION_CONTENIDO
 * antes de cargar este archivo.
 */
(function iniciarGestionContenido(global) {
  "use strict";

  const configuracion =
    global.CONFIGURACION_GESTION_CONTENIDO;

  if (!configuracion) {
    return;
  }

  const api = global.API_ADMIN_CLIENT;
  const alertas = global.AlertasAdmin;
  const esGestionHorarios = configuracion.apiBase === "horarios";
  const usaTarjetas = Boolean(configuracion.usarTarjetas);
  const maximoLeccionesHorario = 16;
  const diasHorario = Object.freeze([
    ["lunes", "Lunes"],
    ["martes", "Martes"],
    ["miercoles", "Miércoles"],
    ["jueves", "Jueves"],
    ["viernes", "Viernes"]
  ]);
  const plantillaSeccionHorario = Object.freeze([
    ["1", "07:00-07:40"],
    ["2", "07:40-08:20"],
    ["RECESO", "08:20-08:35", "Receso 15 minutos"],
    ["3", "08:35-09:15"],
    ["4", "09:15-09:55"],
    ["RECESO", "09:55-10:00", "Receso 5 minutos"],
    ["5", "10:00-10:40"],
    ["6", "10:40-11:20"],
    ["ALMUERZO", "11:20-12:00", "Almuerzo 40 minutos"],
    ["7", "12:00-12:40"],
    ["8", "12:40-01:20"],
    ["RECESO", "01:20-01:30", "Receso 10 minutos"],
    ["9", "01:30-02:10"],
    ["10", "02:10-02:50"],
    ["RECESO", "02:50-02:55", "Receso 5 minutos"],
    ["11", "02:55-03:35"],
    ["12", "03:35-04:15"]
  ]);

  const estado = {
    colecciones: [],
    elementos: [],
    idColeccion: null,
    elementoEditado: null,
    filasImportacion: [],
    columnasImportacion: [],
    erroresImportacion: [],
    filtroTexto: "",
    filtroEstado: "",
    filtroCategoria: "",
    nivelHorario: "",
    seccionHorario: "",
    idsHorarioModificados: new Set(),
    idsFilasHorarioModificadas: new Set(),
    profesorHorarioModificado: false,
    seccionesHorarioPendientes: new Set(),
    idsHorarioOriginales: new Set(),
    estructuraHorarioModificada: false,
    siguienteIdTemporalHorario: -1,
    guardandoHorario: false,
    guardandoSeccionHorario: false,
    descargandoHorarios: false,
    pagina: null,
    estadosPagina: []
  };

  const selectores = {
    contenido: "contenidoDashboard",
    titulo: "tituloGestionContenido",
    descripcion: "descripcionGestionContenido",
    selectorColeccion: "selectorColeccion",
    botonNuevaColeccion: "botonNuevaColeccion",
    botonEliminarColeccion: "botonEliminarColeccion",
    botonNuevoElemento: "botonNuevoElemento",
    botonImportar: "botonImportarContenido",
    botonPublicar: "botonPublicarColeccion",
    botonRecargar: "botonRecargarContenido",
    cuerpoTabla: "cuerpoTablaContenido",
    estadoVacio: "estadoVacioContenido",
    filtroTexto: "filtroTextoContenido",
    filtroEstado: "filtroEstadoContenido",
    filtroCategoria: "filtroCategoriaContenido",
    resumenColecciones: "resumenColecciones",
    resumenElementos: "resumenElementos",
    resumenPublicados: "resumenPublicados",
    resumenBorradores: "resumenBorradores",
    modalElemento: "modalElemento",
    formularioElemento: "formularioElemento",
    camposElemento: "camposElemento",
    tituloModalElemento: "tituloModalElemento",
    botonCerrarModalElemento: "botonCerrarModalElemento",
    botonCancelarElemento: "botonCancelarElemento",
    modalColeccion: "modalColeccion",
    formularioColeccion: "formularioColeccion",
    botonCerrarModalColeccion: "botonCerrarModalColeccion",
    botonCancelarColeccion: "botonCancelarColeccion",
    modalImportacion: "modalImportacion",
    formularioImportacion: "formularioImportacion",
    botonCerrarModalImportacion: "botonCerrarModalImportacion",
    botonCancelarImportacion: "botonCancelarImportacion",
    entradaImportacion: "entradaImportacion",
    archivoImportacion: "archivoImportacion",
    tablaImportacion: "tablaImportacion",
    cabeceraImportacion: "cabeceraImportacion",
    cuerpoImportacion: "cuerpoImportacion",
    resumenImportacion: "resumenImportacion",
    botonProcesarImportacion: "botonProcesarImportacion",
    botonAgregarFilaImportacion: "botonAgregarFilaImportacion",
    botonDescargarPlantilla: "botonDescargarPlantilla",
    filtrosGenericos: "filtrosContenidoGenerico",
    tablaGenerica: "tablaContenidoGenerica",
    editorHorario: "editorHorarioAdmin",
    selectorNivelHorario: "selectorNivelHorario",
    selectorSeccionHorario: "selectorSeccionHorario",
    contenidoEditorHorario: "contenidoEditorHorario",
    botonGuardarHorario: "botonGuardarHorario",
    estadoCambiosHorario: "estadoCambiosHorario",
    botonNuevaSeccionHorario: "botonNuevaSeccionHorario",
    botonEliminarSeccionHorario: "botonEliminarSeccionHorario",
    botonDescargarHorarios: "botonDescargarHorarios",
    accionesHorario: "accionesHorario",
    modalSeccionHorario: "modalSeccionHorario",
    formularioSeccionHorario: "formularioSeccionHorario",
    botonCerrarModalSeccionHorario: "botonCerrarModalSeccionHorario",
    botonCancelarSeccionHorario: "botonCancelarSeccionHorario",
    tarjetas: "tarjetasContenidoModulo",
    seccionTarjetas: "seccionTarjetasContenidoModulo",
    accionesTarjetas: "accionesTarjetasContenidoModulo",
    tituloTarjetas: "tituloTarjetasContenidoModulo"
  };

  function obtener(id) {
    return document.getElementById(id);
  }

  function texto(valor) {
    if (valor === null || valor === undefined) {
      return "";
    }

    return String(valor).trim();
  }

  function escapar(valor) {
    return texto(valor)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function resolverImagen(valor) {
    const rutaImagen = texto(valor);
    if (!rutaImagen) return "";
    if (/^https?:\/\//i.test(rutaImagen)) return rutaImagen;
    if (rutaImagen.startsWith("/")) {
      const origen = String(global.API_ADMIN_CONFIG?.urlBase || "http://127.0.0.1:3001/api")
        .replace(/\/api\/?$/, "");
      return `${origen}${rutaImagen}`;
    }
    if (usaTarjetas && configuracion.rutaPublica) {
      try {
        const paginaPublica = new URL(
          `../../../frontend-publico${configuracion.rutaPublica}`,
          global.location.href
        );
        return new URL(rutaImagen, paginaPublica).href;
      } catch (_error) {
        return rutaImagen;
      }
    }
    return rutaImagen;
  }

  function formatearFecha(valor) {
    if (!valor) {
      return "—";
    }

    const fecha = new Date(valor);

    if (Number.isNaN(fecha.getTime())) {
      return texto(valor) || "—";
    }

    return new Intl.DateTimeFormat(
      "es-CR",
      {
        dateStyle: "medium"
      }
    ).format(fecha);
  }

  function obtenerDatosRespuesta(respuesta) {
    return respuesta?.datos ?? {};
  }

  function notificar(tipo, titulo, mensaje) {
    if (
      alertas &&
      typeof alertas[tipo] === "function"
    ) {
      alertas[tipo](titulo, mensaje);
      return;
    }

    console[tipo === "error" ? "error" : "log"](
      `${titulo}: ${mensaje}`
    );
  }

  function mostrarError(error, titulo = "No fue posible completar la operación") {
    const mensaje =
      error?.message ||
      error?.mensaje ||
      "Ocurrió un error inesperado.";

    notificar("error", titulo, mensaje);
    console.error(error);
  }

  async function confirmarAccion(opciones) {
    if (
      global.ModalAdmin &&
      typeof global.ModalAdmin.confirmar === "function"
    ) {
      return global.ModalAdmin.confirmar(opciones);
    }

    return global.confirm(
      [opciones.mensaje, opciones.detalle]
        .filter(Boolean)
        .join("\n\n")
    );
  }

  function ruta(sufijo = "") {
    const base = `/${configuracion.apiBase}`;
    return `${base}${sufijo}`;
  }

  function campoValor(elemento, campo) {
    if (campo.origen === "datos") {
      return elemento?.datos?.[campo.nombre] ?? "";
    }

    return elemento?.[campo.nombre] ?? "";
  }

  function asignarCampo(datos, campo, valor) {
    let valorFinal = valor;

    if (campo.tipo === "checkbox") {
      valorFinal = Boolean(valor);
    }

    if (campo.tipo === "number") {
      valorFinal = valor === "" ? null : Number(valor);
    }

    if (campo.origen === "datos") {
      datos.datos = datos.datos || {};
      datos.datos[campo.nombre] = valorFinal;
      return;
    }

    datos[campo.nombre] = valorFinal;
  }

  function ordenDisponible(datos, idElemento = null) {
    if (!usaTarjetas) return true;
    const orden = Number(datos.orden);
    const ocupado = estado.elementos.find((elemento) =>
      Number(elemento.idElemento) !== Number(idElemento) &&
      Number(elemento.orden) === orden &&
      texto(elemento.estado).toUpperCase() !== "ARCHIVADO"
    );
    if (!ocupado) return true;
    notificar("advertencia", "Orden ocupado", `El orden ${orden} ya pertenece a “${ocupado.titulo}”. Seleccione otro orden.`);
    return false;
  }

  function camposEspecialesValidos(datos) {
    const imagenObligatoria = configuracion.campos.find(
      (campo) => campo.tipo === "image" && campo.requerido
    );
    if (imagenObligatoria && !Number(datos[imagenObligatoria.nombre])) {
      notificar("advertencia", "Imagen requerida", `Debe seleccionar una ${imagenObligatoria.etiqueta.toLowerCase()} antes de guardar.`);
      return false;
    }
    return true;
  }

  function obtenerArchivoSubido(respuesta) {
    const datos = obtenerDatosRespuesta(respuesta);

    if (datos.archivo && typeof datos.archivo === "object") {
      return datos.archivo;
    }

    if (
      datos.archivoRegistrado &&
      typeof datos.archivoRegistrado === "object"
    ) {
      return datos.archivoRegistrado;
    }

    return datos;
  }

  async function prepararImagenesFormulario(formulario, datos) {
    const camposImagen = configuracion.campos.filter(
      (campo) => campo.tipo === "image"
    );

    for (const campo of camposImagen) {
      const control = formulario.elements.namedItem(campo.nombre);

      if (!control) {
        throw new Error(
          `No se encontró el control de ${campo.etiqueta.toLowerCase()}.`
        );
      }

      const archivo = control.archivoPendiente;

      if (!archivo) {
        asignarCampo(datos, campo, control.value);
        continue;
      }

      const carga = new FormData();
      carga.append("imagen", archivo);
      carga.append(
        "textoAlternativo",
        texto(
          formulario.elements.namedItem("descripcion")?.value ||
          formulario.elements.namedItem("titulo")?.value
        )
      );

      const respuesta = await api.postFormData(
        "/archivos/imagenes/paginas",
        carga
      );
      const guardado = obtenerArchivoSubido(respuesta);
      const idArchivo = Number(guardado.idArchivo);

      if (!Number.isInteger(idArchivo) || idArchivo <= 0) {
        throw new Error(
          "La API registró la imagen, pero no devolvió un idArchivo válido."
        );
      }

      control.value = String(idArchivo);
      control.archivoPendiente = null;
      asignarCampo(datos, campo, idArchivo);
    }
  }

  function nombreColeccion(coleccion) {
    const partes = [coleccion.nombre];

    if (coleccion.publicada) {
      partes.push("Publicada");
    } else {
      partes.push(coleccion.estado || "Borrador");
    }

    return partes.filter(Boolean).join(" · ");
  }

  function coleccionSeleccionada() {
    return estado.colecciones.find(
      (item) => Number(item.idColeccion) === Number(estado.idColeccion)
    ) || null;
  }

  function elementosFiltrados() {
    const busqueda = estado.filtroTexto.toLocaleLowerCase("es");

    return estado.elementos.filter((elemento) => {
      const coincideTexto = !busqueda || [
        elemento.titulo,
        elemento.subtitulo,
        elemento.descripcion,
        elemento.claveExterna
      ].some((valor) =>
        texto(valor).toLocaleLowerCase("es").includes(busqueda)
      );

      const coincideEstado =
        !estado.filtroEstado ||
        texto(elemento.estado).toUpperCase() === estado.filtroEstado;

      const categoria = configuracion.campoCategoria
        ? texto(elemento.datos?.[configuracion.campoCategoria] ?? elemento[configuracion.campoCategoria])
        : "";
      const coincideCategoria = !estado.filtroCategoria || categoria === estado.filtroCategoria;

      return coincideTexto && coincideEstado && coincideCategoria;
    });
  }

  function renderizarSelectorColecciones() {
    const selector = obtener(selectores.selectorColeccion);

    if (!selector) {
      return;
    }

    selector.replaceChildren();

    if (estado.colecciones.length === 0) {
      const opcion = document.createElement("option");
      opcion.value = "";
      opcion.textContent = "No hay colecciones";
      selector.appendChild(opcion);
      selector.disabled = true;
      return;
    }

    selector.disabled = false;

    estado.colecciones.forEach((coleccion) => {
      const opcion = document.createElement("option");
      opcion.value = String(coleccion.idColeccion);
      opcion.textContent = nombreColeccion(coleccion);
      opcion.selected =
        Number(coleccion.idColeccion) === Number(estado.idColeccion);
      selector.appendChild(opcion);
    });
  }

  function renderizarResumen() {
    const publicados = estado.elementos.filter(
      (elemento) => elemento.estado === "PUBLICADO"
    ).length;

    const borradores = estado.elementos.filter(
      (elemento) => elemento.estado === "BORRADOR"
    ).length;

    const valores = {
      [selectores.resumenColecciones]: estado.colecciones.length,
      [selectores.resumenElementos]: estado.elementos.length,
      [selectores.resumenPublicados]: publicados,
      [selectores.resumenBorradores]: borradores
    };

    Object.entries(valores).forEach(([id, valor]) => {
      const elemento = obtener(id);
      if (elemento) {
        elemento.textContent = String(valor);
      }
    });
  }

  function crearBotonAccion(textoBoton, clase, accion, idElemento) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = `admin-boton admin-boton--pequeno ${clase}`;
    boton.textContent = textoBoton;
    boton.dataset.accion = accion;
    boton.dataset.idElemento = String(idElemento);
    return boton;
  }

  function detectarNivelHorario(seccion) {
    const numero = Number(
      texto(seccion).split(/\s*-\s*/)[0]
    );
    const nombres = new Map([
      [7, "Séptimo"],
      [8, "Octavo"],
      [9, "Noveno"],
      [10, "Décimo"],
      [11, "Undécimo"]
    ]);

    return {
      nombre: nombres.get(numero) || "Sin nivel",
      orden: nombres.has(numero) ? numero : 999
    };
  }

  function elementosAdministrablesHorario() {
    return estado.elementos.filter(
      (elemento) =>
        texto(elemento?.datos?.seccion)
    );
  }

  function obtenerNivelesHorario() {
    const niveles = new Map();

    elementosAdministrablesHorario().forEach((elemento) => {
      const nivel = detectarNivelHorario(elemento.datos.seccion);
      niveles.set(nivel.nombre, nivel);
    });

    return [...niveles.values()]
      .sort((a, b) => a.orden - b.orden)
      .map((nivel) => nivel.nombre);
  }

  function obtenerSeccionesHorario(nivel) {
    return [...new Set(
      elementosAdministrablesHorario()
        .filter(
          (elemento) =>
            detectarNivelHorario(elemento.datos.seccion).nombre === nivel
        )
        .map((elemento) => texto(elemento.datos.seccion))
    )].sort((a, b) =>
      a.localeCompare(b, "es", { numeric: true })
    );
  }

  function obtenerFilasSeccionHorario() {
    return elementosAdministrablesHorario()
      .filter(
        (elemento) =>
          texto(elemento.datos.seccion) === estado.seccionHorario
      )
      .sort(
        (a, b) => Number(a.orden ?? 0) - Number(b.orden ?? 0)
      );
  }

  function ajustarSeleccionHorario() {
    const niveles = obtenerNivelesHorario();

    if (!niveles.includes(estado.nivelHorario)) {
      estado.nivelHorario = niveles[0] || "";
    }

    const secciones = obtenerSeccionesHorario(estado.nivelHorario);

    if (!secciones.includes(estado.seccionHorario)) {
      estado.seccionHorario = secciones[0] || "";
    }

    return { niveles, secciones };
  }

  function llenarSelectorHorario(selector, valores, seleccionado) {
    if (!selector) {
      return;
    }

    selector.replaceChildren();
    selector.disabled = valores.length === 0;

    if (valores.length === 0) {
      const opcion = document.createElement("option");
      opcion.value = "";
      opcion.textContent = "Sin información";
      selector.appendChild(opcion);
      return;
    }

    valores.forEach((valor) => {
      const opcion = document.createElement("option");
      opcion.value = valor;
      opcion.textContent = valor;
      opcion.selected = valor === seleccionado;
      selector.appendChild(opcion);
    });
  }

  function tipoFilaHorario(elemento) {
    const leccion = texto(elemento?.datos?.lec).toUpperCase();

    if (leccion.includes("ALMUERZO")) {
      return "almuerzo";
    }

    if (leccion.includes("RECESO")) {
      return "receso";
    }

    return "";
  }

  function controlCeldaHorario(elemento, campo, etiqueta) {
    const valor = elemento?.datos?.[campo] ?? "";

    return `
      <input
        class="horario-admin__control-celda"
        type="text"
        value="${escapar(valor)}"
        placeholder="${campo === "lec" || campo === "horas" ? "—" : "Libre"}"
        data-horario-id="${Number(elemento.idElemento)}"
        data-horario-campo="${campo}"
        aria-label="${escapar(etiqueta)}"
      >
    `;
  }

  function actualizarEstadoCambiosHorario() {
    const cantidad = estado.idsHorarioModificados.size;
    const hayCambios =
      cantidad > 0 || estado.estructuraHorarioModificada;
    const filasModificadas =
      estado.idsFilasHorarioModificadas.size;
    const seccionesPendientes =
      estado.seccionesHorarioPendientes.size;
    const indicador = obtener(selectores.estadoCambiosHorario);
    const boton = obtener(selectores.botonGuardarHorario);

    if (indicador) {
      if (estado.guardandoHorario) {
        indicador.textContent = "Guardando cambios…";
      } else if (!hayCambios) {
        indicador.textContent = "Sin cambios pendientes";
      } else if (seccionesPendientes > 0) {
        indicador.textContent = seccionesPendientes === 1
          ? "Sección nueva pendiente de guardar"
          : `${seccionesPendientes} secciones nuevas pendientes de guardar`;
      } else if (
        estado.profesorHorarioModificado &&
        filasModificadas === 0
      ) {
        indicador.textContent = "Nombre modificado";
      } else if (estado.profesorHorarioModificado) {
        indicador.textContent =
          `Nombre y ${filasModificadas} ` +
          `${filasModificadas === 1 ? "fila modificada" : "filas modificadas"}`;
      } else if (filasModificadas > 0) {
        indicador.textContent =
          `${filasModificadas} ` +
          `${filasModificadas === 1 ? "fila modificada" : "filas modificadas"}`;
      } else {
        indicador.textContent = "Estructura del horario modificada";
      }
    }

    if (boton) {
      boton.disabled = !hayCambios || estado.guardandoHorario;
      boton.textContent = estado.guardandoHorario
        ? "Guardando…"
        : "Guardar cambios";
    }
  }

  function hayCambiosHorario() {
    return (
      estado.idsHorarioModificados.size > 0 ||
      estado.estructuraHorarioModificada
    );
  }

  function crearIdTemporalHorario() {
    const idTemporal = estado.siguienteIdTemporalHorario;
    estado.siguienteIdTemporalHorario -= 1;
    return idTemporal;
  }

  function crearPlantillaSeccionHorario(seccion, profesorGuia) {
    return plantillaSeccionHorario.map(
      ([leccion, horas, descanso], orden) => {
        const datos = {
          seccion,
          profesor_guia: profesorGuia,
          lec: leccion,
          horas,
          lunes: descanso || "",
          martes: descanso || "",
          miercoles: descanso || "",
          jueves: descanso || "",
          viernes: descanso || ""
        };

        return {
          idElemento: crearIdTemporalHorario(),
          idColeccion: Number(estado.idColeccion),
          claveExterna:
            typeof configuracion.crearClaveExterna === "function"
              ? configuracion.crearClaveExterna(datos)
              : null,
          titulo: `${seccion} · Lección ${leccion}`,
          descripcion:
            `${horas}${profesorGuia ? ` · ${profesorGuia}` : ""}`,
          orden,
          estado: "PUBLICADO",
          destacado: false,
          datos
        };
      }
    );
  }

  function renderizarEditorHorarios() {
    const contenedor = obtener(selectores.contenidoEditorHorario);

    if (!contenedor) {
      return;
    }

    const { niveles, secciones } = ajustarSeleccionHorario();
    llenarSelectorHorario(
      obtener(selectores.selectorNivelHorario),
      niveles,
      estado.nivelHorario
    );
    llenarSelectorHorario(
      obtener(selectores.selectorSeccionHorario),
      secciones,
      estado.seccionHorario
    );
    actualizarEstadoCambiosHorario();

    const filas = obtenerFilasSeccionHorario();

    if (filas.length === 0) {
      contenedor.innerHTML = `
        <div class="horario-admin__vacio">
          <strong>No hay horarios en esta versión</strong>
          <p>Importe un archivo Excel o CSV para comenzar a revisarlos.</p>
        </div>
      `;
      return;
    }

    const profesorGuia = texto(filas[0]?.datos?.profesor_guia);
    const filasHtml = filas.map((elemento) => {
      const tipo = tipoFilaHorario(elemento);
      const estadoElemento = texto(elemento.estado).toUpperCase();
      const estaInactivo = ["ARCHIVADO", "INACTIVO"].includes(
        estadoElemento
      );
      const clasesFila = [
        tipo ? `horario-admin__fila--${tipo}` : "",
        estaInactivo ? "horario-admin__fila--inactiva" : ""
      ].filter(Boolean).join(" ");
      const accion = estaInactivo ? "activar" : "desactivar";
      const textoAccion = estaInactivo ? "Activar" : "Desactivar";
      const claseAccion = estaInactivo
        ? "admin-boton--primario"
        : "admin-boton--peligro";

      return `
        <tr class="horario-admin__fila ${clasesFila}" data-fila-horario="${Number(elemento.idElemento)}">
          <td>${controlCeldaHorario(elemento, "lec", `Lección de ${estado.seccionHorario}`)}</td>
          <td>${controlCeldaHorario(elemento, "horas", `Hora de ${estado.seccionHorario}`)}</td>
          ${diasHorario.map(([campo, etiqueta]) => `
            <td>${controlCeldaHorario(elemento, campo, `${etiqueta} de ${estado.seccionHorario}`)}</td>
          `).join("")}
          <td class="horario-admin__acciones-celda">
            <button
              class="admin-boton admin-boton--pequeno ${claseAccion}"
              type="button"
              data-horario-accion="${accion}"
              data-horario-id="${Number(elemento.idElemento)}"
            >${textoAccion}</button>
            <button
              class="admin-boton admin-boton--pequeno admin-boton--peligro"
              type="button"
              data-horario-accion="eliminar"
              data-horario-id="${Number(elemento.idElemento)}"
            >Eliminar</button>
          </td>
        </tr>
      `;
    }).join("");

    contenedor.innerHTML = `
      <article class="horario-admin__tarjeta admin-panel">
        <div class="horario-admin__encabezado-tabla">
          <div>
            <span class="horario-admin__etiqueta">${escapar(estado.nivelHorario)}</span>
            <h3>Horario sección ${escapar(estado.seccionHorario)}</h3>
          </div>
          <label class="horario-admin__profesor">
            <span>Profesor guía</span>
            <input
              class="gestion-contenido__control"
              type="text"
              value="${escapar(profesorGuia)}"
              placeholder="No indicado"
              data-horario-profesor
            >
          </label>
        </div>
        <div class="horario-admin__tabla-contenedor">
          <table class="horario-admin__tabla">
            <thead>
              <tr>
                <th>Lección</th>
                <th>Hora</th>
                ${diasHorario.map(([, etiqueta]) => `<th>${etiqueta}</th>`).join("")}
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>${filasHtml}</tbody>
          </table>
        </div>
      </article>
    `;
  }

  function sincronizarResumenHorario(elemento) {
    const datos = elemento.datos || {};
    const seccion = texto(datos.seccion);
    const leccion = texto(datos.lec);
    const horas = texto(datos.horas);
    const profesor = texto(datos.profesor_guia);

    elemento.titulo = `${seccion} · Lección ${leccion}`;
    elemento.descripcion = `${horas}${profesor ? ` · ${profesor}` : ""}`;

    if (typeof configuracion.crearClaveExterna === "function") {
      elemento.claveExterna = configuracion.crearClaveExterna(datos);
    }
  }

  function marcarHorarioModificado(elemento) {
    const idElemento = Number(elemento.idElemento);
    estado.idsHorarioModificados.add(idElemento);
    estado.idsFilasHorarioModificadas.add(idElemento);
    sincronizarResumenHorario(elemento);
    actualizarEstadoCambiosHorario();
  }

  function editarHorarioDesdeControl(evento) {
    const control = evento.target.closest(
      "[data-horario-id][data-horario-campo]"
    );

    if (control) {
      const elemento = estado.elementos.find(
        (item) =>
          Number(item.idElemento) === Number(control.dataset.horarioId)
      );

      if (!elemento) {
        return;
      }

      elemento.datos = elemento.datos || {};
      elemento.datos[control.dataset.horarioCampo] = control.value;
      control.classList.add("horario-admin__control-celda--modificado");
      marcarHorarioModificado(elemento);
      return;
    }

    if (evento.target.matches("[data-horario-profesor]")) {
      obtenerFilasSeccionHorario().forEach((elemento) => {
        elemento.datos = elemento.datos || {};
        elemento.datos.profesor_guia = evento.target.value;
        estado.idsHorarioModificados.add(
          Number(elemento.idElemento)
        );
        sincronizarResumenHorario(elemento);
      });
      estado.profesorHorarioModificado = true;
      actualizarEstadoCambiosHorario();
    }
  }

  function datosParaGuardarHorario(elemento) {
    sincronizarResumenHorario(elemento);

    return {
      idElemento: Number(elemento.idElemento) > 0
        ? Number(elemento.idElemento)
        : null,
      idColeccion: Number(elemento.idColeccion || estado.idColeccion),
      claveExterna: elemento.claveExterna || null,
      titulo: elemento.titulo,
      subtitulo: elemento.subtitulo || null,
      descripcion: elemento.descripcion || null,
      fechaInicio: elemento.fechaInicio || null,
      fechaFin: elemento.fechaFin || null,
      orden: Number(elemento.orden ?? 0),
      estado: texto(elemento.estado).toUpperCase() === "BORRADOR"
        ? "PUBLICADO"
        : elemento.estado || "PUBLICADO",
      destacado: Boolean(elemento.destacado),
      url: elemento.url || null,
      urlSecundaria: elemento.urlSecundaria || null,
      idArchivo: elemento.idArchivo || null,
      datos: { ...(elemento.datos || {}) }
    };
  }

  async function guardarCambiosHorario() {
    if (!hayCambiosHorario() || estado.guardandoHorario) {
      return;
    }

    estado.guardandoHorario = true;
    actualizarEstadoCambiosHorario();

    try {
      const idsActuales = new Set(
        estado.elementos
          .map((elemento) => Number(elemento.idElemento))
          .filter((idElemento) => idElemento > 0)
      );
      const idsEliminados = [...estado.idsHorarioOriginales]
        .filter((idElemento) => !idsActuales.has(idElemento));
      const elementosNuevos = estado.elementos.filter(
        (elemento) => Number(elemento.idElemento) < 0
      );
      const elementosModificados = estado.elementos.filter(
        (elemento) => {
          const idElemento = Number(elemento.idElemento);
          return idElemento > 0 &&
            estado.idsHorarioModificados.has(idElemento);
        }
      );

      // Se eliminan primero para permitir recrear una sección con el mismo
      // nombre sin chocar con las claves que todavía existen en la BD.
      await Promise.all(
        idsEliminados.map((idElemento) =>
          api.delete(ruta(`/elementos/${idElemento}/permanente`))
        )
      );

      await Promise.all(
        elementosModificados.map((elemento) =>
          api.put(
            ruta(`/elementos/${elemento.idElemento}`),
            datosParaGuardarHorario(elemento)
          )
        )
      );

      await Promise.all(
        elementosNuevos.map((elemento) => {
          const datos = datosParaGuardarHorario(elemento);
          delete datos.idElemento;
          return api.post(ruta("/elementos"), datos);
        })
      );

      estado.idsHorarioModificados.clear();
      estado.idsFilasHorarioModificadas.clear();
      estado.profesorHorarioModificado = false;
      estado.seccionesHorarioPendientes.clear();
      estado.idsHorarioOriginales.clear();
      estado.estructuraHorarioModificada = false;
      estado.siguienteIdTemporalHorario = -1;
      await cargarContenido(estado.idColeccion);
      notificar(
        "exito",
        "Horario actualizado",
        "Los cambios de la tabla se guardaron correctamente."
      );
    } catch (error) {
      mostrarError(error, "No fue posible guardar el horario");
    } finally {
      estado.guardandoHorario = false;
      actualizarEstadoCambiosHorario();
    }
  }

  async function confirmarDescartarCambiosHorario() {
    if (
      !esGestionHorarios ||
      !hayCambiosHorario()
    ) {
      return true;
    }

    return confirmarAccion({
      tipo: "advertencia",
      titulo: "Descartar cambios",
      mensaje: "Hay cambios de horario sin guardar.",
      detalle: "Si continúa, las modificaciones de la tabla se perderán.",
      textoConfirmar: "Descartar cambios",
      textoCancelar: "Volver"
    });
  }

  function renderizarTabla() {
    if (esGestionHorarios) {
      renderizarEditorHorarios();
      return;
    }

    if (usaTarjetas) {
      renderizarTarjetas();
      return;
    }

    const cuerpo = obtener(selectores.cuerpoTabla);
    const vacio = obtener(selectores.estadoVacio);

    if (!cuerpo) {
      return;
    }

    cuerpo.replaceChildren();
    const elementos = elementosFiltrados();

    if (vacio) {
      vacio.hidden = elementos.length > 0;
    }

    elementos.forEach((elemento) => {
      const fila = document.createElement("tr");

      const celdaTitulo = document.createElement("td");
      celdaTitulo.className = "gestion-contenido__celda-titulo";
      celdaTitulo.innerHTML = `
        <strong>${escapar(elemento.titulo || "Sin título")}</strong>
        <small>${escapar(
          elemento.descripcion ||
          elemento.subtitulo ||
          elemento.claveExterna ||
          "Sin descripción"
        )}</small>
      `;

      const celdaFecha = document.createElement("td");
      celdaFecha.textContent = formatearFecha(
        elemento.fechaInicio || elemento.fechaCreacion
      );

      const celdaEstado = document.createElement("td");
      const etiqueta = document.createElement("span");
      etiqueta.className = "admin-etiqueta";
      etiqueta.textContent = elemento.estado || "BORRADOR";
      celdaEstado.appendChild(etiqueta);

      const celdaOrden = document.createElement("td");
      celdaOrden.textContent = String(elemento.orden ?? 0);

      const celdaAcciones = document.createElement("td");
      const acciones = document.createElement("div");
      acciones.className = "gestion-contenido__acciones-fila";
      acciones.append(
        crearBotonAccion(
          "Editar",
          "admin-boton--secundario",
          "editar",
          elemento.idElemento
        ),
        crearBotonAccion(
          "Archivar",
          "admin-boton--peligro",
          "archivar",
          elemento.idElemento
        )
      );
      celdaAcciones.appendChild(acciones);

      fila.append(
        celdaTitulo,
        celdaFecha,
        celdaEstado,
        celdaOrden,
        celdaAcciones
      );
      cuerpo.appendChild(fila);
    });
  }

  function resumenTarjeta(elemento) {
    if (configuracion.apiBase === "boletines") {
      return [formatearFecha(elemento.fechaInicio), elemento.datos?.edicion]
        .filter(Boolean).join(" · ");
    }
    if (configuracion.apiBase === "docentes") {
      return [elemento.subtitulo, elemento.datos?.departamento]
        .filter(Boolean).join(" · ");
    }
    if (configuracion.apiBase === "galeria") {
      return `Orden ${Number(elemento.orden ?? 0)}`;
    }
    return elemento.datos?.publico || elemento.datos?.categoria || "Recurso de apoyo";
  }

  function categoriaTarjeta(elemento) {
    if (!configuracion.campoCategoria) return configuracion.singular;
    return texto(
      elemento.datos?.[configuracion.campoCategoria] ??
      elemento[configuracion.campoCategoria]
    ) || configuracion.singular;
  }

  function crearFormularioTarjeta(elemento) {
    const formulario = document.createElement("form");
    formulario.className = "comunidad-admin__editor formulario-admin";
    formulario.dataset.idElemento = String(elemento.idElemento);

    const campos = document.createElement("div");
    campos.className = "gestion-contenido__cuadricula formulario-admin__cuadricula";
    configuracion.campos.forEach((campo) => {
      const contenedor = crearControlCampo(campo, campoValor(elemento, campo), elemento);
      const control = contenedor.querySelector("[name]");
      const etiqueta = contenedor.querySelector("label");
      if (control) {
        control.id = `tarjeta-${elemento.idElemento}-${campo.nombre}`;
      }
      if (etiqueta && control) {
        etiqueta.htmlFor = control.id;
      }
      contenedor.querySelector(".gestion-contenido__acciones-imagen")?.remove();
      campos.appendChild(contenedor);
    });

    const acciones = document.createElement("div");
    acciones.className = "formulario-admin__acciones";
    acciones.innerHTML = `
      <button type="button" class="comunidad-admin__cerrar-superior" data-accion-tarjeta="cerrar" title="Cerrar edición" aria-label="Cerrar edición"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m18 15-6-6-6 6"></path></svg></button>
      <button type="button" class="admin-boton admin-boton--secundario" data-accion-tarjeta="archivar">Retirar</button>
      <button type="button" class="admin-boton admin-boton--secundario" data-accion-tarjeta="cerrar"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m18 15-6-6-6 6"></path></svg> Cerrar edición</button>
      <button type="submit" class="admin-boton admin-boton--primario">Guardar cambios</button>
    `;
    formulario.append(campos, acciones);
    return formulario;
  }

  function renderizarTarjetas() {
    const contenedor = obtener(selectores.tarjetas);
    if (!contenedor) return;
    contenedor.replaceChildren();
    const elementos = elementosFiltrados();

    if (!elementos.length) {
      contenedor.innerHTML = '<div class="contenido-tarjetas-admin__vacio"><strong>No hay contenido en esta versión.</strong><p>Use el botón Nuevo para crear la primera tarjeta.</p></div>';
      global.BoletinesCorreoAdmin?.decorarTarjetas?.({
        contenedor,
        elementos: []
      });
      return;
    }

    elementos.forEach((elemento) => {
      const tarjeta = document.createElement("article");
      tarjeta.className = "comunidad-admin__tarjeta";
      const muestraImagen = ["docentes", "galeria"].includes(configuracion.apiBase);
      const foto = muestraImagen
        ? `<div class="comunidad-admin__imagen">${elemento.url
          ? `<img src="${escapar(resolverImagen(elemento.url))}" alt="${escapar(elemento.descripcion || elemento.titulo)}">`
          : '<div class="contenido-tarjetas-admin__imagen-vacia" aria-label="Sin imagen"><span aria-hidden="true">▧</span><small>Sin imagen</small></div>'
        }</div>`
        : "";
      tarjeta.innerHTML = `<div class="comunidad-admin__vista">${foto}<div class="comunidad-admin__vista-contenido"><span class="comunidad-seccion__etiqueta">${escapar(categoriaTarjeta(elemento))}</span><h3 class="comunidad-seccion__titulo-visual">${escapar(elemento.titulo || "Sin título")}</h3><p class="comunidad-seccion__subtitulo-visual">${escapar(resumenTarjeta(elemento))}</p><p class="comunidad-seccion__contenido-visual">${escapar(elemento.descripcion || "Sin descripción")}</p><span class="admin-etiqueta comunidad-seccion__estado-visual">${escapar(elemento.estado || "BORRADOR")}</span><button type="button" class="admin-boton admin-boton--secundario admin-boton--pequeno" data-accion-tarjeta="archivar" data-id-elemento="${Number(elemento.idElemento)}">Retirar</button></div></div>`;
      const detalles = document.createElement("details");
      detalles.className = "comunidad-admin__desplegable";
      const summary = document.createElement("summary");
      summary.className = "comunidad-admin__editar";
      summary.innerHTML = `<span>Editar ${escapar(configuracion.singular)}</span><span class="comunidad-admin__flecha" aria-hidden="true">&#9660;</span>`;
      detalles.append(summary, crearFormularioTarjeta(elemento));
      tarjeta.appendChild(detalles);
      contenedor.appendChild(tarjeta);
    });

    global.BoletinesCorreoAdmin?.decorarTarjetas?.({
      contenedor,
      elementos
    });
  }

  async function cargarPaginaModulo() {
    if (!usaTarjetas) return;
    const [respuestaPagina, respuestaEstados] = await Promise.all([
      api.get(`/paginas/administracion/${configuracion.paginaSlug}?_=${Date.now()}`),
      api.get("/paginas/estados-publicacion")
    ]);
    const datosPagina = obtenerDatosRespuesta(respuestaPagina);
    const datosEstados = obtenerDatosRespuesta(respuestaEstados);
    estado.pagina = datosPagina.pagina || datosPagina;
    estado.estadosPagina = Array.isArray(datosEstados.estados)
      ? datosEstados.estados : (Array.isArray(datosEstados) ? datosEstados : []);
    renderizarPaginaModulo();
  }

  function renderizarPaginaModulo() {
    const pagina = estado.pagina || {};
    obtener("nombrePaginaModulo").textContent = pagina.nombre || configuracion.titulo;
    obtener("rutaPaginaModulo").textContent = pagina.ruta || configuracion.rutaPublica;
    obtener("estadoPaginaModulo").textContent = pagina.nombreEstado || pagina.estadoPublicacion || pagina.estado || "Sin registrar";
    obtener("fechaPaginaModulo").textContent = formatearFecha(pagina.fechaActualizacion);
    obtener("tituloEncabezadoModulo").value = pagina.titulo || "";
    obtener("descripcionEncabezadoModulo").value = pagina.descripcion || "";
    const selector = obtener("estadoEncabezadoModulo");
    selector.replaceChildren();
    estado.estadosPagina.forEach((item) => {
      const opcion = document.createElement("option");
      opcion.value = String(item.idEstadoPublicacion ?? item.id_estado_publicacion ?? item.id);
      opcion.textContent = item.nombre || item.estado || item.etiqueta;
      opcion.selected = Number(opcion.value) === Number(pagina.idEstadoPublicacion);
      selector.appendChild(opcion);
    });
  }

  async function guardarPaginaModulo(evento) {
    evento.preventDefault();
    if (!estado.pagina?.idPagina) return;
    try {
      await api.put(`/paginas/administracion/${estado.pagina.idPagina}`, {
        titulo: texto(obtener("tituloEncabezadoModulo").value),
        descripcion: texto(obtener("descripcionEncabezadoModulo").value),
        idEstadoPublicacion: Number(obtener("estadoEncabezadoModulo").value)
      });
      await cargarPaginaModulo();
      notificar("exito", "Encabezado guardado", "La información pública de la página fue actualizada.");
    } catch (error) {
      mostrarError(error, "No fue posible guardar el encabezado");
    }
  }

  function renderizarTodo() {
    renderizarSelectorColecciones();
    renderizarResumen();
    renderizarTabla();
    renderizarFiltroCategorias();

    const botonPublicar = obtener(selectores.botonPublicar);
    const botonNuevo = obtener(selectores.botonNuevoElemento);
    const botonImportar = obtener(selectores.botonImportar);
    const botonEliminarColeccion = obtener(
      selectores.botonEliminarColeccion
    );
    const botonEliminarSeccion = obtener(
      selectores.botonEliminarSeccionHorario
    );
    const botonNuevaSeccion = obtener(
      selectores.botonNuevaSeccionHorario
    );
    const botonDescargarHorarios = obtener(
      selectores.botonDescargarHorarios
    );
    const hayColeccion = Boolean(estado.idColeccion);

    if (botonPublicar) {
      botonPublicar.disabled = !hayColeccion;
    }

    if (botonNuevo) {
      botonNuevo.disabled = !hayColeccion;
    }

    if (botonImportar) {
      botonImportar.hidden = !configuracion.importacion?.habilitada;
    }

    if (botonEliminarColeccion) {
      botonEliminarColeccion.hidden = !(esGestionHorarios || usaTarjetas);
      botonEliminarColeccion.disabled = !hayColeccion;
    }

    if (botonEliminarSeccion) {
      botonEliminarSeccion.disabled = !estado.seccionHorario;
    }

    if (botonNuevaSeccion) {
      botonNuevaSeccion.disabled =
        !hayColeccion || estado.guardandoSeccionHorario;
    }

    if (botonDescargarHorarios) {
      botonDescargarHorarios.disabled =
        !hayColeccion ||
        estado.elementos.length === 0 ||
        estado.descargandoHorarios;
    }
  }

  function renderizarFiltroCategorias() {
    const selector = obtener(selectores.filtroCategoria);
    const campo = obtener("campoFiltroCategoriaContenido");
    if (!selector || !campo) return;
    campo.hidden = !usaTarjetas || !configuracion.campoCategoria;
    if (campo.hidden) return;
    const actual = estado.filtroCategoria;
    const campoCategoria = configuracion.campos.find(
      (item) => item.nombre === configuracion.campoCategoria
    );
    const etiquetas = new Map((campoCategoria?.opciones || []).map((opcion) =>
      typeof opcion === "object"
        ? [String(opcion.valor), String(opcion.etiqueta || opcion.valor)]
        : [String(opcion), String(opcion)]
    ));
    const configuradas = [...etiquetas.keys()];
    const valores = [...new Set([
      ...configuradas,
      ...estado.elementos.map((elemento) =>
        texto(elemento.datos?.[configuracion.campoCategoria] ?? elemento[configuracion.campoCategoria])
      ).filter(Boolean)
    ])].sort((a, b) => a.localeCompare(b, "es"));
    selector.innerHTML = '<option value="">Todas</option>';
    valores.forEach((valor) => {
      const opcion = document.createElement("option");
      opcion.value = valor;
      opcion.textContent = etiquetas.get(valor) || valor;
      opcion.selected = valor === actual;
      selector.appendChild(opcion);
    });
  }

  async function cargarContenido(idColeccion = null) {
    const parametros = new URLSearchParams();

    if (idColeccion) {
      parametros.set("idColeccion", idColeccion);
    }

    const sufijo = parametros.size
      ? `/administracion?${parametros}`
      : "/administracion";

    const respuesta = await api.get(ruta(sufijo));
    const datos = obtenerDatosRespuesta(respuesta);

    estado.colecciones = Array.isArray(datos.colecciones)
      ? datos.colecciones
      : [];
    estado.elementos = Array.isArray(datos.elementos)
      ? datos.elementos
      : [];
    estado.idColeccion =
      datos.idColeccionSeleccionada ||
      estado.colecciones[0]?.idColeccion ||
      null;

    if (esGestionHorarios) {
      estado.idsHorarioModificados.clear();
      estado.idsFilasHorarioModificadas.clear();
      estado.profesorHorarioModificado = false;
      estado.seccionesHorarioPendientes.clear();
      estado.idsHorarioOriginales = new Set(
        estado.elementos
          .map((elemento) => Number(elemento.idElemento))
          .filter((idElemento) => idElemento > 0)
      );
      estado.estructuraHorarioModificada = false;
      estado.siguienteIdTemporalHorario = -1;

      estado.elementos.forEach((elemento) => {
        if (texto(elemento.estado).toUpperCase() !== "BORRADOR") {
          return;
        }

        estado.idsHorarioModificados.add(
          Number(elemento.idElemento)
        );

        const seccion = texto(elemento.datos?.seccion);
        if (seccion) {
          estado.seccionesHorarioPendientes.add(seccion);
        }
      });
    }

    renderizarTodo();
  }

  function abrirModal(id) {
    const modal = obtener(id);
    if (!modal) {
      return;
    }

    modal.hidden = false;
    document.body.classList.add("modal-abierto");
  }

  function cerrarModal(id) {
    const modal = obtener(id);
    if (!modal) {
      return;
    }

    modal.hidden = true;
    document.body.classList.remove("modal-abierto");
  }

  function crearControlCampo(campo, valor, elementoActual = null) {
    const contenedor = document.createElement("div");
    contenedor.className = "gestion-contenido__campo formulario-admin__grupo";

    if (campo.completo) {
      contenedor.classList.add("gestion-contenido__campo--completo");
    }

    const etiqueta = document.createElement("label");
    etiqueta.htmlFor = `campo-${campo.nombre}`;
    etiqueta.className = "formulario-admin__etiqueta";
    etiqueta.textContent = campo.etiqueta;

    let control;

    if (campo.tipo === "image") {
      control = document.createElement("input");
      control.type = "hidden";
      const vista = document.createElement("div");
      vista.className = "formulario-admin__archivo";
      const marco = document.createElement("div");
      marco.className = "formulario-admin__archivo-vista";
      const imagen = document.createElement("img");
      imagen.alt = elementoActual?.descripcion || elementoActual?.titulo || "Vista previa";
      if (elementoActual?.url) imagen.src = resolverImagen(elementoActual.url);
      else imagen.hidden = true;
      const marcador = document.createElement("span");
      marcador.className = "formulario-admin__archivo-vacio";
      marcador.textContent = "Sin imagen seleccionada";
      marcador.hidden = Boolean(elementoActual?.url);
      marco.append(imagen, marcador);
      const opciones = document.createElement("div");
      opciones.className = "formulario-admin__archivo-acciones";
      const archivo = document.createElement("input");
      archivo.type = "file";
      archivo.accept = "image/jpeg,image/png,image/webp";
      archivo.hidden = true;
      const seleccionar = document.createElement("button");
      seleccionar.type = "button";
      seleccionar.className = "admin-boton admin-boton--secundario";
      seleccionar.textContent = "Seleccionar imagen";
      const quitar = document.createElement("button");
      quitar.type = "button";
      quitar.className = "admin-boton admin-boton--texto";
      quitar.textContent = "Quitar imagen";
      const ayuda = document.createElement("small");
      ayuda.textContent = "JPG, PNG o WEBP.";
      seleccionar.addEventListener("click", () => archivo.click());
      quitar.addEventListener("click", () => {
        control.value = "";
        control.archivoPendiente = null;
        archivo.value = "";
        imagen.removeAttribute("src");
        imagen.hidden = true;
        marcador.hidden = false;
        ayuda.textContent = "La imagen se quitará al guardar.";
      });
      archivo.addEventListener("change", () => {
        const seleccionado = archivo.files?.[0];
        if (!seleccionado) return;
        control.archivoPendiente = seleccionado;
        imagen.src = URL.createObjectURL(seleccionado);
        imagen.hidden = false;
        marcador.hidden = true;
        ayuda.textContent = "Vista previa lista. La imagen se subirá al guardar.";
      });
      opciones.append(seleccionar, quitar, ayuda, archivo);
      vista.append(marco, opciones);
      contenedor.append(etiqueta, control, vista);
    } else if (campo.tipo === "textarea") {
      control = document.createElement("textarea");
    } else if (campo.tipo === "select") {
      control = document.createElement("select");
      (campo.opciones || []).forEach((opcion) => {
        const elementoOpcion = document.createElement("option");
        const valorOpcion =
          typeof opcion === "object" ? opcion.valor : opcion;
        const etiquetaOpcion =
          typeof opcion === "object" ? opcion.etiqueta : opcion;
        elementoOpcion.value = String(valorOpcion);
        elementoOpcion.textContent = String(etiquetaOpcion);
        control.appendChild(elementoOpcion);
      });
    } else {
      control = document.createElement("input");
      control.type = campo.tipo === "checkbox"
        ? "checkbox"
        : campo.tipo || "text";
    }

    control.id = `campo-${campo.nombre}`;
    control.name = campo.nombre;
    control.className = "gestion-contenido__control formulario-admin__control";
    if (campo.tipo === "textarea") {
      control.classList.add("formulario-admin__control--textarea");
    }
    control.required = Boolean(campo.requerido);

    if (campo.tipo === "checkbox") {
      control.checked = Boolean(valor);
    } else if (campo.tipo === "date" && valor) {
      control.value = String(valor).slice(0, 10);
    } else {
      control.value = valor ?? "";
    }

    if (campo.placeholder) {
      control.placeholder = campo.placeholder;
    }

    if (campo.maxlength) {
      control.maxLength = campo.maxlength;
    }

    if (campo.tipo !== "image") contenedor.append(etiqueta, control);

    if (campo.subirImagen) {
      const accionesImagen = document.createElement("div");
      accionesImagen.className = "gestion-contenido__acciones-imagen";

      const selectorArchivo = document.createElement("input");
      selectorArchivo.type = "file";
      selectorArchivo.accept = "image/jpeg,image/png,image/webp";
      selectorArchivo.className = "gestion-contenido__control";

      const botonSubir = document.createElement("button");
      botonSubir.type = "button";
      botonSubir.className =
        "admin-boton admin-boton--secundario admin-boton--pequeno";
      botonSubir.textContent = "Subir imagen";

      const estadoSubida = document.createElement("small");
      estadoSubida.textContent =
        "Puede pegar una URL o subir una imagen JPG, PNG o WEBP.";

      botonSubir.addEventListener("click", async () => {
        const archivo = selectorArchivo.files?.[0];

        if (!archivo) {
          estadoSubida.textContent =
            "Seleccione una imagen antes de subirla.";
          return;
        }

        const formulario = new FormData();
        formulario.append("imagen", archivo);
        formulario.append(
          "textoAlternativo",
          obtener("campo-descripcion")?.value ||
          obtener("campo-titulo")?.value ||
          ""
        );

        botonSubir.disabled = true;
        estadoSubida.textContent = "Subiendo imagen...";

        try {
          const respuesta = await api.postFormData(
            "/archivos/imagenes/paginas",
            formulario
          );
          const datos = obtenerDatosRespuesta(respuesta);
          const archivoGuardado =
            datos.archivo ||
            datos.archivoRegistrado ||
            datos;
          const rutaImagen =
            archivoGuardado.rutaRelativa ||
            archivoGuardado.rutaRelativaArchivo ||
            archivoGuardado.ruta ||
            "";

          if (!rutaImagen) {
            throw new Error(
              "La API no devolvió la ruta de la imagen."
            );
          }

          control.value = rutaImagen;
          estadoSubida.textContent =
            "Imagen subida correctamente. Guarde el registro para aplicar el cambio.";
        } catch (error) {
          estadoSubida.textContent =
            error?.message || "No fue posible subir la imagen.";
        } finally {
          botonSubir.disabled = false;
        }
      });

      accionesImagen.append(
        selectorArchivo,
        botonSubir,
        estadoSubida
      );
      contenedor.appendChild(accionesImagen);
    }

    if (campo.ayuda) {
      const ayuda = document.createElement("small");
      ayuda.textContent = campo.ayuda;
      contenedor.appendChild(ayuda);
    }

    return contenedor;
  }

  function seccionesDisponiblesHorario() {
    return [...new Set(
      elementosAdministrablesHorario().map(
        (elemento) => texto(elemento.datos.seccion)
      )
    )].sort((a, b) =>
      a.localeCompare(b, "es", { numeric: true })
    );
  }

  function actualizarSeccionesFormularioBloque() {
    const selectorNivel = obtener("campo-nivelBloqueHorario");
    const selectorSeccion = obtener("campo-seccion");

    if (!selectorNivel || !selectorSeccion) {
      return;
    }

    const secciones = seccionesDisponiblesHorario().filter(
      (seccion) =>
        String(detectarNivelHorario(seccion).orden) ===
        selectorNivel.value
    );

    selectorSeccion.replaceChildren();

    secciones.forEach((seccion) => {
      const opcion = document.createElement("option");
      opcion.value = seccion;
      opcion.textContent = seccion;
      opcion.selected = seccion === estado.seccionHorario;
      selectorSeccion.appendChild(opcion);
    });

    selectorSeccion.disabled = secciones.length === 0;
  }

  function abrirFormularioBloqueHorario() {
    if (!estado.idColeccion) {
      notificar(
        "advertencia",
        "Primero cree una versión",
        "Debe crear o seleccionar una versión antes de agregar una fila."
      );
      return;
    }

    const secciones = seccionesDisponiblesHorario();

    if (secciones.length === 0) {
      notificar(
        "advertencia",
        "Primero cree una sección",
        "Use el botón Nueva sección para generar la plantilla del horario."
      );
      return;
    }

    estado.elementoEditado = null;

    const tituloModal = obtener(selectores.tituloModalElemento);
    const campos = obtener(selectores.camposElemento);
    const formulario = obtener(selectores.formularioElemento);

    if (!campos || !formulario) {
      return;
    }

    formulario.reset();
    campos.replaceChildren();

    if (tituloModal) {
      tituloModal.textContent = "Agregar fila de horario";
    }

    const niveles = [...new Set(
      secciones.map(
        (seccion) => detectarNivelHorario(seccion).orden
      )
    )].sort((a, b) => a - b);

    const nivelSeleccionado = detectarNivelHorario(
      estado.seccionHorario || secciones[0]
    ).orden;

    [
      {
        nombre: "nivelBloqueHorario",
        etiqueta: "Nivel",
        tipo: "select",
        opciones: niveles.map((nivel) => ({
          valor: nivel,
          etiqueta: detectarNivelHorario(`${nivel}-1`).nombre
        }))
      },
      {
        nombre: "seccion",
        etiqueta: "Sección existente",
        tipo: "select",
        opciones: []
      },
      {
        nombre: "lec",
        etiqueta: "Lección o posición",
        tipo: "select",
        opciones: Array.from(
          { length: maximoLeccionesHorario },
          (_valor, indice) => String(indice + 1)
        )
      },
      {
        nombre: "horas",
        etiqueta: "Horario",
        tipo: "text",
        requerido: true,
        placeholder: "Ejemplo: 07:00-07:40"
      },
      ...diasHorario.map(([nombre, etiqueta]) => ({
        nombre,
        etiqueta,
        tipo: "text",
        placeholder: "Asignatura o actividad"
      }))
    ].forEach((campo) => {
      campos.appendChild(
        crearControlCampo(
          campo,
          campo.nombre === "nivelBloqueHorario"
            ? nivelSeleccionado
            : ""
        )
      );
    });

    obtener("campo-nivelBloqueHorario")?.addEventListener(
      "change",
      actualizarSeccionesFormularioBloque
    );
    actualizarSeccionesFormularioBloque();

    const selectorLeccion = obtener("campo-lec");
    if (selectorLeccion) {
      selectorLeccion.value = "1";
    }

    abrirModal(selectores.modalElemento);
  }

  function ordenNuevaLeccionHorario(posicion, filas) {
    const ordenPlantilla = new Map([
      [1, 0], [2, 1], [3, 3], [4, 4], [5, 6], [6, 7],
      [7, 9], [8, 10], [9, 12], [10, 13], [11, 15], [12, 16]
    ]);

    if (ordenPlantilla.has(posicion)) {
      return ordenPlantilla.get(posicion);
    }

    return Math.max(-1, ...filas.map(
      (elemento) => Number(elemento.orden ?? 0)
    )) + 1;
  }

  async function guardarBloqueHorario() {
    const seccion = texto(obtener("campo-seccion")?.value);
    const leccion = texto(obtener("campo-lec")?.value);
    const horas = texto(obtener("campo-horas")?.value);
    const filasSeccion = elementosAdministrablesHorario().filter(
      (elemento) => texto(elemento.datos.seccion) === seccion
    );
    const existente = filasSeccion.find(
      (elemento) =>
        texto(elemento.datos.lec).toUpperCase() ===
        leccion.toUpperCase()
    );
    const dias = Object.fromEntries(
      diasHorario.map(([dia]) => [
        dia,
        texto(obtener(`campo-${dia}`)?.value)
      ])
    );

    if (!seccion || !leccion || !horas) {
      throw new Error(
        "Debe seleccionar la sección, la posición e indicar el horario."
      );
    }

    if (!Object.values(dias).some(Boolean)) {
      throw new Error(
        "La fila debe incluir al menos una asignatura o actividad."
      );
    }

    if (!existente) {
      const cantidadLecciones = filasSeccion.filter(
        (elemento) => /^\d+$/.test(texto(elemento.datos.lec))
      ).length;

      if (cantidadLecciones >= maximoLeccionesHorario) {
        throw new Error(
          `La sección ya alcanzó el máximo de ${maximoLeccionesHorario} lecciones.`
        );
      }
    }

    if (existente) {
      const sobrescribir = await confirmarAccion({
        tipo: "advertencia",
        titulo: "La posición ya está ocupada",
        mensaje:
          `La lección ${leccion} de la sección ${seccion} ya existe.`,
        detalle:
          "Si continúa, la información actual de esa fila será reemplazada.",
        textoConfirmar: "Sobrescribir fila",
        textoCancelar: "Cancelar"
      });

      if (!sobrescribir) {
        return;
      }
    }

    const profesorGuia = texto(
      filasSeccion[0]?.datos?.profesor_guia
    );
    const datosHorario = {
      seccion,
      profesor_guia: profesorGuia,
      lec: leccion,
      horas,
      ...dias
    };
    const datos = existente
      ? {
        ...datosParaGuardarHorario(existente),
        datos: datosHorario,
        orden: Number(existente.orden ?? 0)
      }
      : {
        idColeccion: Number(estado.idColeccion),
        claveExterna:
          typeof configuracion.crearClaveExterna === "function"
            ? configuracion.crearClaveExterna(datosHorario)
            : null,
        titulo: `${seccion} · Lección ${leccion}`,
        descripcion:
          `${horas}${profesorGuia ? ` · ${profesorGuia}` : ""}`,
        orden: ordenNuevaLeccionHorario(Number(leccion), filasSeccion),
        estado: "PUBLICADO",
        destacado: false,
        datos: datosHorario
      };

    if (existente) {
      Object.assign(existente, datos, {
        datos: datosHorario
      });
      marcarHorarioModificado(existente);
    } else {
      const nuevoElemento = {
        ...datos,
        idElemento: crearIdTemporalHorario(),
        idColeccion: Number(estado.idColeccion)
      };
      estado.elementos.push(nuevoElemento);
      estado.estructuraHorarioModificada = true;
      marcarHorarioModificado(nuevoElemento);
    }

    cerrarModal(selectores.modalElemento);
    estado.nivelHorario = detectarNivelHorario(seccion).nombre;
    estado.seccionHorario = seccion;
    renderizarTodo();
    notificar(
      "exito",
      existente ? "Fila reemplazada localmente" : "Fila agregada localmente",
      existente
        ? "La posición quedó pendiente de guardar."
        : "La nueva fila quedó pendiente de guardar."
    );
  }

  function abrirFormularioElemento(elemento = null) {
    if (esGestionHorarios) {
      abrirFormularioBloqueHorario();
      return;
    }
    if (!estado.idColeccion) {
      notificar(
        "advertencia",
        "Primero cree una colección",
        "Debe crear o seleccionar una colección antes de agregar contenido."
      );
      return;
    }

    estado.elementoEditado = elemento;

    const tituloModal = obtener(selectores.tituloModalElemento);
    const campos = obtener(selectores.camposElemento);
    const formulario = obtener(selectores.formularioElemento);

    if (!campos || !formulario) {
      return;
    }

    formulario.reset();
    campos.replaceChildren();

    if (tituloModal) {
      tituloModal.textContent = elemento
        ? `Editar ${configuracion.singular}`
        : `Agregar ${configuracion.singular}`;
    }

    configuracion.campos.forEach((campo) => {
      campos.appendChild(
        crearControlCampo(
          campo,
          campoValor(elemento, campo),
          elemento
        )
      );
    });

    global.BoletinesCorreoAdmin?.prepararFormularioElemento?.({
      elemento,
      formulario,
      contenedorCampos: campos
    });

    abrirModal(selectores.modalElemento);
  }

  function leerFormularioElemento() {
    const datos = {
      idColeccion: Number(estado.idColeccion),
      estado: "PUBLICADO",
      orden: 0,
      datos: {}
    };

    configuracion.campos.forEach((campo) => {
      const control = obtener(`campo-${campo.nombre}`);

      if (!control) {
        return;
      }

      const valor = campo.tipo === "checkbox"
        ? control.checked
        : control.value.trim();

      asignarCampo(datos, campo, valor);
    });

    return datos;
  }

  async function guardarElemento(evento) {
    evento.preventDefault();

    try {
      if (esGestionHorarios) {
        await guardarBloqueHorario();
        return;
      }

      const datos = leerFormularioElemento();
      const id = estado.elementoEditado?.idElemento;
      await prepararImagenesFormulario(evento.currentTarget, datos);
      if (!camposEspecialesValidos(datos)) return;
      if (!ordenDisponible(datos, id)) return;

      const planCorreo = id
        ? null
        : await global.BoletinesCorreoAdmin?.antesDeGuardar?.({
          datos,
          formulario: evento.currentTarget
        });

      let respuestaGuardado;

      if (id) {
        respuestaGuardado = await api.put(ruta(`/elementos/${id}`), datos);
      } else {
        respuestaGuardado = await api.post(ruta("/elementos"), datos);
      }

      cerrarModal(selectores.modalElemento);
      await cargarContenido(estado.idColeccion);

      if (!id && typeof global.BoletinesCorreoAdmin?.despuesDeGuardar === "function") {
        await global.BoletinesCorreoAdmin?.despuesDeGuardar?.({
          elementoGuardado: obtenerDatosRespuesta(respuestaGuardado),
          planCorreo
        });
      }

      notificar(
        "exito",
        "Contenido guardado",
        `El registro de ${configuracion.singular} se guardó correctamente.`
      );
    } catch (error) {
      mostrarError(error);
    }
  }

  async function archivarElemento(idElemento) {
    const elemento = estado.elementos.find(
      (item) => Number(item.idElemento) === Number(idElemento)
    );

    const confirmar = await confirmarAccion({
      tipo: "advertencia",
      titulo: "Archivar registro",
      mensaje:
        `¿Desea archivar “${elemento?.titulo || "este registro"}”?`,
      detalle:
        "El contenido dejará de estar disponible públicamente.",
      textoConfirmar: "Archivar",
      textoCancelar: "Cancelar"
    });

    if (!confirmar) {
      return;
    }

    try {
      await api.delete(ruta(`/elementos/${idElemento}`));
      await cargarContenido(estado.idColeccion);
      notificar(
        "exito",
        "Registro archivado",
        "El contenido dejó de estar disponible públicamente."
      );
    } catch (error) {
      mostrarError(error, "No fue posible archivar el registro");
    }
  }

  async function cambiarEstadoHorario(idElemento, activar) {
    const elemento = estado.elementos.find(
      (item) => Number(item.idElemento) === Number(idElemento)
    );

    if (!elemento) {
      return;
    }

    const accion = activar ? "activar" : "desactivar";
    const confirmar = await confirmarAccion({
      tipo: activar ? "informacion" : "advertencia",
      titulo: activar ? "Activar fila" : "Desactivar fila",
      mensaje:
        `¿Desea ${accion} “${elemento.titulo || "la fila seleccionada"}”?`,
      detalle: activar
        ? "La fila volverá a aparecer cuando guarde los cambios."
        : "La fila seguirá visible en el panel y se ocultará públicamente cuando guarde los cambios.",
      textoConfirmar: activar ? "Activar fila" : "Desactivar fila",
      textoCancelar: "Cancelar"
    });

    if (!confirmar) {
      return;
    }

    elemento.estado = activar ? "PUBLICADO" : "ARCHIVADO";
    marcarHorarioModificado(elemento);
    renderizarEditorHorarios();
    notificar(
      "exito",
      activar ? "Activación pendiente" : "Desactivación pendiente",
      "El cambio se aplicará al pulsar Guardar cambios."
    );
  }

  async function eliminarFilaHorario(idElemento) {
    const elemento = estado.elementos.find(
      (item) => Number(item.idElemento) === Number(idElemento)
    );

    if (!elemento) {
      return;
    }

    const confirmar = await confirmarAccion({
      tipo: "peligro",
      titulo: "Eliminar fila definitivamente",
      mensaje:
        `Se eliminará “${elemento.titulo || "la fila seleccionada"}”.`,
      detalle:
        "La eliminación quedará pendiente y solo se aplicará al pulsar Guardar cambios.",
      textoConfirmar: "Eliminar fila",
      textoCancelar: "Cancelar"
    });

    if (!confirmar) {
      return;
    }

    estado.elementos = estado.elementos.filter(
      (item) => Number(item.idElemento) !== Number(idElemento)
    );
    estado.idsHorarioModificados.delete(Number(idElemento));
    estado.idsFilasHorarioModificadas.delete(Number(idElemento));
    estado.estructuraHorarioModificada = true;
    renderizarTodo();
    notificar(
      "exito",
      "Eliminación pendiente",
      "La fila se eliminará al pulsar Guardar cambios."
    );
  }

  function abrirFormularioSeccionHorario() {
    if (!estado.idColeccion) {
      notificar(
        "advertencia",
        "Primero cree una versión",
        "Debe crear o seleccionar una versión antes de agregar una sección."
      );
      return;
    }

    const formulario = obtener(selectores.formularioSeccionHorario);
    formulario?.reset();

    const nivelActual = detectarNivelHorario(
      estado.seccionHorario || "7-1"
    ).orden;
    const nivel = obtener("nivelNuevaSeccionHorario");
    const numero = obtener("numeroNuevaSeccionHorario");

    if (nivel && nivelActual >= 7 && nivelActual <= 11) {
      nivel.value = String(nivelActual);
    }

    if (numero) {
      const usados = new Set(
        seccionesDisponiblesHorario()
          .filter(
            (seccion) =>
              detectarNivelHorario(seccion).orden ===
              Number(nivel?.value || 7)
          )
          .map((seccion) => Number(seccion.split("-")[1]))
      );
      let siguiente = 1;
      while (usados.has(siguiente) && siguiente < 20) {
        siguiente += 1;
      }
      numero.value = String(siguiente);
    }

    abrirModal(selectores.modalSeccionHorario);
  }

  async function guardarSeccionHorario(evento) {
    evento.preventDefault();

    if (estado.guardandoSeccionHorario) {
      return;
    }

    const formulario = new FormData(evento.currentTarget);
    const nivel = Number(formulario.get("nivel"));
    const numeroSeccion = Number(formulario.get("numeroSeccion"));
    const seccion = `${nivel}-${numeroSeccion}`;
    const botonGuardar = evento.currentTarget.querySelector(
      "button[type='submit']"
    );

    if (seccionesDisponiblesHorario().includes(seccion)) {
      notificar(
        "advertencia",
        "La sección ya existe",
        `Seleccione otro número: la sección ${seccion} ya está creada en esta versión.`
      );
      obtener("numeroNuevaSeccionHorario")?.focus();
      return;
    }

    estado.guardandoSeccionHorario = true;

    if (botonGuardar) {
      botonGuardar.disabled = true;
      botonGuardar.textContent = "Creando…";
    }

    const botonNuevaSeccion = obtener(
      selectores.botonNuevaSeccionHorario
    );
    if (botonNuevaSeccion) {
      botonNuevaSeccion.disabled = true;
    }

    try {
      const elementosPlantilla = crearPlantillaSeccionHorario(
        seccion,
        texto(formulario.get("profesorGuia"))
      );

      elementosPlantilla.forEach((elemento) => {
        estado.elementos.push(elemento);
        estado.idsHorarioModificados.add(
          Number(elemento.idElemento)
        );
      });

      estado.seccionesHorarioPendientes.add(seccion);
      estado.estructuraHorarioModificada = true;
      cerrarModal(selectores.modalSeccionHorario);
      estado.nivelHorario = detectarNivelHorario(seccion).nombre;
      estado.seccionHorario = seccion;
      renderizarTodo();
      notificar(
        "exito",
        "Sección preparada",
        "La sección quedó pendiente y se creará al pulsar Guardar cambios."
      );
    } catch (error) {
      mostrarError(error, "No fue posible crear la sección");
    } finally {
      estado.guardandoSeccionHorario = false;

      if (botonGuardar) {
        botonGuardar.disabled = false;
        botonGuardar.textContent = "Crear plantilla";
      }

      if (botonNuevaSeccion) {
        botonNuevaSeccion.disabled = !estado.idColeccion;
      }
    }
  }

  async function eliminarSeccionHorario() {
    if (!estado.seccionHorario) {
      return;
    }

    const seccion = estado.seccionHorario;
    const idsSeccion = new Set(
      obtenerFilasSeccionHorario().map(
        (elemento) => Number(elemento.idElemento)
      )
    );
    const confirmar = await confirmarAccion({
      tipo: "peligro",
      titulo: "Eliminar sección completa",
      mensaje: `Se eliminará la sección ${seccion} y todas sus filas.`,
      detalle:
        "La eliminación quedará pendiente y solo afectará al sitio público después de pulsar Guardar cambios.",
      textoConfirmar: "Eliminar sección",
      textoCancelar: "Cancelar"
    });

    if (!confirmar) {
      return;
    }

    estado.elementos = estado.elementos.filter(
      (elemento) => !idsSeccion.has(Number(elemento.idElemento))
    );
    idsSeccion.forEach((idElemento) => {
      estado.idsHorarioModificados.delete(idElemento);
      estado.idsFilasHorarioModificadas.delete(idElemento);
    });
    estado.seccionesHorarioPendientes.delete(seccion);
    estado.estructuraHorarioModificada = true;
    estado.seccionHorario = "";
    renderizarTodo();
    notificar(
      "exito",
      "Eliminación pendiente",
      `La sección ${seccion} se eliminará al pulsar Guardar cambios.`
    );
  }

  async function eliminarColeccion() {
    const coleccion = coleccionSeleccionada();

    if (!coleccion) {
      return;
    }

    if (esGestionHorarios && hayCambiosHorario()) {
      notificar(
        "advertencia",
        "Hay cambios sin guardar",
        "Guarde o descarte los cambios antes de eliminar la versión."
      );
      return;
    }

    const confirmar = await confirmarAccion({
      tipo: "peligro",
      titulo: `Eliminar versión de ${configuracion.plural.toLowerCase()}`,
      mensaje: `Se eliminará “${coleccion.nombre}” con todas sus secciones.`,
      detalle: coleccion.publicada
        ? "Esta es la versión pública: el sitio quedará sin horarios hasta publicar otra versión. La acción no se puede deshacer."
        : "La versión y todas sus filas se eliminarán definitivamente. Esta acción no se puede deshacer.",
      textoConfirmar: "Eliminar versión",
      textoCancelar: "Cancelar"
    });

    if (!confirmar) {
      return;
    }

    try {
      await api.delete(
        ruta(`/colecciones/${coleccion.idColeccion}`)
      );
      estado.idColeccion = null;
      estado.nivelHorario = "";
      estado.seccionHorario = "";
      await cargarContenido();
      notificar(
        "exito",
        "Versión eliminada",
        "La versión se eliminó definitivamente."
      );
    } catch (error) {
      mostrarError(error, "No fue posible eliminar la versión");
    }
  }

  function nombreArchivoHorarios(coleccion) {
    const base = [
      "horarios",
      coleccion?.nombre,
      coleccion?.anio
    ]
      .filter(Boolean)
      .join("-")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    return `${base || "horarios-lhvr"}.xlsx`;
  }

  async function descargarHorariosExcel() {
    const coleccion = coleccionSeleccionada();
    const boton = obtener(selectores.botonDescargarHorarios);

    if (!coleccion || estado.descargandoHorarios) {
      return;
    }

    if (hayCambiosHorario()) {
      notificar(
        "advertencia",
        "Hay cambios sin guardar",
        "Guarde los cambios de la tabla antes de descargar el Excel."
      );
      return;
    }

    estado.descargandoHorarios = true;

    if (boton) {
      boton.disabled = true;
      boton.textContent = "Preparando Excel…";
    }

    try {
      const respuesta = await fetch(
        api.construirUrl(
          ruta(
            `/colecciones/${coleccion.idColeccion}/exportar.xlsx`
          )
        ),
        {
          method: "GET",
          credentials: "include",
          headers: {
            Accept:
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          }
        }
      );

      if (!respuesta.ok) {
        const detalle = await respuesta.json().catch(() => null);
        const error = new Error(
          detalle?.mensaje ||
          "No fue posible generar el archivo de horarios."
        );
        error.statusCode = respuesta.status;
        throw error;
      }

      const archivo = await respuesta.blob();

      if (archivo.size === 0) {
        throw new Error("El archivo generado está vacío.");
      }

      const urlTemporal = URL.createObjectURL(archivo);
      const enlace = document.createElement("a");
      enlace.href = urlTemporal;
      enlace.download = nombreArchivoHorarios(coleccion);
      enlace.hidden = true;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      global.setTimeout(
        () => URL.revokeObjectURL(urlTemporal),
        1000
      );

      notificar(
        "exito",
        "Excel preparado",
        "Los horarios se descargaron en hojas separadas por sección."
      );
    } catch (error) {
      mostrarError(error, "No fue posible descargar los horarios");
    } finally {
      estado.descargandoHorarios = false;

      if (boton) {
        boton.disabled =
          !estado.idColeccion || estado.elementos.length === 0;
        boton.textContent = "Descargar Excel";
      }
    }
  }

  async function guardarColeccion(evento) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const datosFormulario = new FormData(formulario);
    const anioTexto = texto(datosFormulario.get("anio"));

    const datos = {
      nombre: texto(datosFormulario.get("nombre")),
      anio: anioTexto ? Number(anioTexto) : null,
      estado: "BORRADOR"
    };

    try {
      const respuesta = await api.post(ruta("/colecciones"), datos);
      const guardado = obtenerDatosRespuesta(respuesta);
      cerrarModal(selectores.modalColeccion);
      await cargarContenido(guardado.idColeccion);
      notificar(
        "exito",
        "Colección creada",
        "Ya puede agregar o importar contenido."
      );
    } catch (error) {
      mostrarError(error, "No fue posible crear la colección");
    }
  }

  async function publicarColeccion() {
    const coleccion = coleccionSeleccionada();

    if (!coleccion) {
      return;
    }

    if (esGestionHorarios && hayCambiosHorario()) {
      notificar(
        "advertencia",
        "Hay cambios sin guardar",
        "Guarde primero los cambios de la tabla antes de publicar la versión."
      );
      return;
    }

    const confirmar = await confirmarAccion({
      tipo: "advertencia",
      titulo: "Publicar versión",
      mensaje: `¿Desea publicar “${coleccion.nombre}”?`,
      detalle:
        "El sitio público utilizará esta versión y la publicada anteriormente quedará archivada.",
      textoConfirmar: "Publicar versión",
      textoCancelar: "Cancelar"
    });

    if (!confirmar) {
      return;
    }

    try {
      await api.post(
        ruta(`/colecciones/${coleccion.idColeccion}/publicar`),
        {}
      );
      await cargarContenido(coleccion.idColeccion);
      notificar(
        "exito",
        "Colección publicada",
        "El sitio público utilizará esta versión del contenido."
      );
    } catch (error) {
      mostrarError(error, "No fue posible publicar la colección");
    }
  }

  function separarLineaCsv(linea, separador) {
    const celdas = [];
    let actual = "";
    let entreComillas = false;

    for (let indice = 0; indice < linea.length; indice += 1) {
      const caracter = linea[indice];
      const siguiente = linea[indice + 1];

      if (caracter === '"' && entreComillas && siguiente === '"') {
        actual += '"';
        indice += 1;
      } else if (caracter === '"') {
        entreComillas = !entreComillas;
      } else if (caracter === separador && !entreComillas) {
        celdas.push(actual.trim());
        actual = "";
      } else {
        actual += caracter;
      }
    }

    celdas.push(actual.trim());
    return celdas;
  }

  function analizarTextoTabular(contenido) {
    const lineas = texto(contenido)
      .split(/\r?\n/)
      .filter((linea) => linea.trim() !== "");

    if (lineas.length < 2) {
      throw new Error(
        "Debe pegar encabezados y al menos una fila de información."
      );
    }

    const primera = lineas[0];
    const separador = primera.includes("\t")
      ? "\t"
      : primera.includes(";")
        ? ";"
        : ",";

    const columnas = separarLineaCsv(primera, separador)
      .map((columna) => texto(columna));

    const filas = lineas.slice(1).map((linea) => {
      const valores = separarLineaCsv(linea, separador);
      const fila = {};

      columnas.forEach((columna, indice) => {
        fila[columna] = valores[indice] ?? "";
      });

      return fila;
    });

    return { columnas, filas };
  }

  function analizarJson(contenido) {
    const datos = JSON.parse(contenido);
    const filas = Array.isArray(datos)
      ? datos
      : Array.isArray(datos.eventos)
        ? datos.eventos
        : Array.isArray(datos.datos)
          ? datos.datos
          : null;

    if (!filas || filas.length === 0) {
      throw new Error(
        "El JSON no contiene una lista de registros para importar."
      );
    }

    const columnas = Array.from(
      filas.reduce((conjunto, fila) => {
        Object.keys(fila || {}).forEach((clave) => conjunto.add(clave));
        return conjunto;
      }, new Set())
    );

    return { columnas, filas };
  }

  function convertirCelda(valor) {
    if (valor === null || valor === undefined) {
      return "";
    }

    if (typeof valor === "object") {
      return JSON.stringify(valor);
    }

    return String(valor);
  }

  function validarImportacion() {
    const errores = [];
    const columnasRequeridas =
      configuracion.importacion?.columnasRequeridas || [];

    estado.filasImportacion.forEach((fila, indiceFila) => {
      columnasRequeridas.forEach((columna) => {
        if (!texto(fila?.[columna])) {
          errores.push({
            fila: indiceFila,
            columna,
            mensaje: `El campo ${columna} es obligatorio.`
          });
        }
      });
    });

    if (typeof configuracion.importacion?.validar === "function") {
      const resultado = configuracion.importacion.validar(
        estado.filasImportacion,
        {
          anio: Number(
            obtener("anioImportacion")?.value || 0
          ) || null
        }
      );

      if (Array.isArray(resultado)) {
        errores.push(...resultado);
      }
    }

    estado.erroresImportacion = errores;
    return errores;
  }

  function errorCelda(indiceFila, columna) {
    return estado.erroresImportacion.find(
      (error) =>
        Number(error.fila) === Number(indiceFila) &&
        (!error.columna || error.columna === columna)
    );
  }

  function renderizarVistaPreviaImportacion() {
    const tabla = obtener(selectores.tablaImportacion);
    const cabecera = obtener(selectores.cabeceraImportacion);
    const cuerpo = obtener(selectores.cuerpoImportacion);
    const resumen = obtener(selectores.resumenImportacion);

    if (!tabla || !cabecera || !cuerpo) {
      return;
    }

    cabecera.replaceChildren();
    cuerpo.replaceChildren();
    validarImportacion();

    const filaCabecera = document.createElement("tr");

    estado.columnasImportacion.forEach((columna) => {
      const th = document.createElement("th");
      th.textContent = columna;
      filaCabecera.appendChild(th);
    });

    const thAcciones = document.createElement("th");
    thAcciones.textContent = "Acciones";
    filaCabecera.appendChild(thAcciones);
    cabecera.appendChild(filaCabecera);

    estado.filasImportacion.forEach((fila, indiceFila) => {
      const tr = document.createElement("tr");

      estado.columnasImportacion.forEach((columna) => {
        const td = document.createElement("td");
        const input = document.createElement("input");
        input.type = "text";
        input.value = convertirCelda(fila[columna]);
        input.dataset.fila = String(indiceFila);
        input.dataset.columna = columna;

        const error = errorCelda(indiceFila, columna);
        if (error) {
          input.classList.add(
            "gestion-contenido__control--error"
          );
          input.title = error.mensaje;
          input.setAttribute("aria-invalid", "true");
        }

        input.addEventListener("input", () => {
          estado.filasImportacion[indiceFila][columna] = input.value;
        });
        input.addEventListener("change", () => {
          renderizarVistaPreviaImportacion();
        });
        input.addEventListener("paste", manejarPegadoTabla);
        td.appendChild(input);
        tr.appendChild(td);
      });

      const tdAcciones = document.createElement("td");
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "admin-boton admin-boton--peligro admin-boton--pequeno";
      boton.textContent = "Quitar";
      boton.addEventListener("click", () => {
        estado.filasImportacion.splice(indiceFila, 1);
        renderizarVistaPreviaImportacion();
      });
      tdAcciones.appendChild(boton);
      tr.appendChild(tdAcciones);
      cuerpo.appendChild(tr);
    });

    tabla.hidden = estado.filasImportacion.length === 0;

    if (resumen) {
      if (estado.erroresImportacion.length > 0) {
        resumen.classList.add(
          "gestion-contenido__mensaje--error"
        );
        resumen.textContent =
          `${estado.filasImportacion.length} registros revisados. ` +
          `${estado.erroresImportacion.length} errores deben corregirse antes de guardar.`;
      } else {
        resumen.classList.remove(
          "gestion-contenido__mensaje--error"
        );
        resumen.textContent = estado.filasImportacion.length
          ? `${estado.filasImportacion.length} registros válidos y preparados para guardar.`
          : "Aún no se han procesado registros.";
      }
    }
  }

  function manejarPegadoTabla(evento) {
    const textoPegado = evento.clipboardData?.getData("text/plain");

    if (!textoPegado || !textoPegado.includes("\t")) {
      return;
    }

    evento.preventDefault();

    const origen = evento.currentTarget;
    const filaInicial = Number(origen.dataset.fila);
    const columnaInicial = estado.columnasImportacion.indexOf(
      origen.dataset.columna
    );
    const filasPegadas = textoPegado.trimEnd().split(/\r?\n/);

    filasPegadas.forEach((linea, desplazamientoFila) => {
      const indiceFila = filaInicial + desplazamientoFila;

      while (estado.filasImportacion.length <= indiceFila) {
        estado.filasImportacion.push({});
      }

      linea.split("\t").forEach((valor, desplazamientoColumna) => {
        const columna = estado.columnasImportacion[
          columnaInicial + desplazamientoColumna
        ];

        if (columna) {
          estado.filasImportacion[indiceFila][columna] = valor.trim();
        }
      });
    });

    renderizarVistaPreviaImportacion();
  }

  async function procesarArchivoImportacion(archivo) {
    const extension = archivo.name.split(".").pop().toLowerCase();

    if (extension === "xlsx" && configuracion.importacion?.excel) {
      const formulario = new FormData();
      formulario.append("archivo", archivo);
      const respuesta = await api.postFormData(
        ruta("/analizar-archivo"),
        formulario,
        { tiempoEsperaMs: 60000 }
      );
      return obtenerDatosRespuesta(respuesta);
    }

    const contenido = await archivo.text();

    if (extension === "json") {
      return analizarJson(contenido);
    }

    return analizarTextoTabular(contenido);
  }

  async function procesarImportacion() {
    try {
      const archivo = obtener(selectores.archivoImportacion)?.files?.[0];
      const contenido = obtener(selectores.entradaImportacion)?.value || "";
      let resultado;

      if (archivo) {
        resultado = await procesarArchivoImportacion(archivo);
      } else if (texto(contenido).startsWith("[") ||
        texto(contenido).startsWith("{")) {
        resultado = analizarJson(contenido);
      } else {
        resultado = analizarTextoTabular(contenido);
      }

      estado.columnasImportacion = resultado.columnas ||
        Object.keys(resultado.filas?.[0] || {});
      estado.filasImportacion = resultado.filas || [];
      estado.erroresImportacion = [];
      renderizarVistaPreviaImportacion();
    } catch (error) {
      mostrarError(error, "No fue posible procesar la importación");
    }
  }

  function agregarFilaImportacion() {
    if (estado.columnasImportacion.length === 0) {
      estado.columnasImportacion = [
        ...(configuracion.importacion?.columnas || [])
      ];
    }

    const fila = {};
    estado.columnasImportacion.forEach((columna) => {
      fila[columna] = "";
    });
    estado.filasImportacion.push(fila);
    renderizarVistaPreviaImportacion();
  }

  function normalizarRegistroImportado(fila, indice) {
    if (typeof configuracion.importacion?.mapear === "function") {
      return configuracion.importacion.mapear(fila, indice);
    }

    const titulo =
      fila.titulo ||
      fila.nombre ||
      fila.descripcion ||
      `Registro ${indice + 1}`;

    return {
      claveExterna: fila.id || fila.clave || null,
      titulo,
      descripcion: fila.descripcion || null,
      fechaInicio: fila.fechaInicio || fila.fecha || null,
      fechaFin: fila.fechaFin || null,
      estado: fila.estado || "PUBLICADO",
      orden: indice,
      datos: { ...fila }
    };
  }

  async function guardarImportacion(evento) {
    evento.preventDefault();

    if (estado.filasImportacion.length === 0) {
      notificar(
        "advertencia",
        "Importación vacía",
        "Procese un archivo o pegue información antes de guardar."
      );
      return;
    }

    const errores = validarImportacion();

    if (errores.length > 0) {
      renderizarVistaPreviaImportacion();
      notificar(
        "advertencia",
        "Revise la importación",
        "Corrija las celdas marcadas antes de guardar."
      );
      return;
    }

    const formulario = new FormData(evento.currentTarget);
    const anio = texto(formulario.get("anio"));
    const publicar = formulario.get("publicar") === "on";
    const reemplazar = formulario.get("reemplazar") !== "no";
    const elementos = estado.filasImportacion.map(normalizarRegistroImportado);

    try {
      await api.post(
        ruta("/importar"),
        {
          nombre:
            texto(formulario.get("nombre")) ||
            `${configuracion.plural} ${anio || "general"}`,
          anio: anio ? Number(anio) : null,
          publicar,
          reemplazar,
          tipoOrigen: "ARCHIVO",
          nombreOrigen:
            obtener(selectores.archivoImportacion)?.files?.[0]?.name ||
            "Datos pegados",
          alcance: texto(formulario.get("alcance")) || "TOTAL",
          idColeccionBase: estado.idColeccion
            ? Number(estado.idColeccion)
            : null,
          elementos
        },
        { tiempoEsperaMs: 120000 }
      );

      cerrarModal(selectores.modalImportacion);
      estado.filasImportacion = [];
      estado.columnasImportacion = [];
      estado.erroresImportacion = [];
      evento.currentTarget.reset();
      await cargarContenido();
      notificar(
        "exito",
        "Importación completada",
        `Se procesaron ${elementos.length} registros correctamente.`
      );
    } catch (error) {
      mostrarError(error, "No fue posible guardar la importación");
    }
  }

  function abrirImportacion() {
    estado.filasImportacion = [];
    estado.erroresImportacion = [];
    estado.columnasImportacion = [
      ...(configuracion.importacion?.columnas || [])
    ];
    renderizarVistaPreviaImportacion();
    abrirModal(selectores.modalImportacion);
  }

  function vincularEventos() {
    obtener("formularioEncabezadoModulo")?.addEventListener(
      "submit",
      guardarPaginaModulo
    );

    obtener(selectores.tarjetas)?.addEventListener("toggle", (evento) => {
      if (evento.target.tagName !== "DETAILS" || !evento.target.open) return;
      obtener(selectores.tarjetas).querySelectorAll("details[open]").forEach((detalle) => {
        if (detalle !== evento.target) detalle.open = false;
      });
    }, true);

    obtener(selectores.tarjetas)?.addEventListener("click", async (evento) => {
      const boton = evento.target.closest("[data-accion-tarjeta]");
      if (!boton) return;
      const formulario = boton.closest("form");
      if (boton.dataset.accionTarjeta === "cerrar") {
        formulario.closest("details").open = false;
      } else if (boton.dataset.accionTarjeta === "archivar") {
        await archivarElemento(Number(
          formulario?.dataset.idElemento || boton.dataset.idElemento
        ));
      }
    });

    obtener(selectores.tarjetas)?.addEventListener("submit", async (evento) => {
      const formulario = evento.target.closest("form[data-id-elemento]");
      if (!formulario) return;
      evento.preventDefault();
      const datos = {
        idColeccion: Number(estado.idColeccion),
        datos: {}
      };
      configuracion.campos.forEach((campo) => {
        const control = formulario.elements.namedItem(campo.nombre);
        asignarCampo(datos, campo, campo.tipo === "checkbox" ? control.checked : control.value);
      });
      try {
        await prepararImagenesFormulario(formulario, datos);
        if (!camposEspecialesValidos(datos)) return;
        if (!ordenDisponible(datos, formulario.dataset.idElemento)) return;
        await api.put(ruta(`/elementos/${formulario.dataset.idElemento}`), datos);
        await cargarContenido(estado.idColeccion);
        notificar("exito", "Tarjeta guardada", "Los cambios se guardaron correctamente.");
      } catch (error) {
        mostrarError(error, "No fue posible guardar la tarjeta");
      }
    });

    obtener(selectores.selectorColeccion)?.addEventListener(
      "change",
      async (evento) => {
        if (!await confirmarDescartarCambiosHorario()) {
          evento.target.value = String(estado.idColeccion || "");
          return;
        }

        try {
          await cargarContenido(evento.target.value);
        } catch (error) {
          mostrarError(error, "No fue posible cambiar la colección");
        }
      }
    );

    obtener(selectores.botonRecargar)?.addEventListener(
      "click",
      async () => {
        if (!await confirmarDescartarCambiosHorario()) {
          return;
        }

        try {
          await cargarContenido(estado.idColeccion);
        } catch (error) {
          mostrarError(error);
        }
      }
    );

    obtener(selectores.botonNuevoElemento)?.addEventListener(
      "click",
      () => {
        abrirFormularioElemento();
      }
    );

    obtener(selectores.botonNuevaColeccion)?.addEventListener(
      "click",
      () => abrirModal(selectores.modalColeccion)
    );

    obtener(selectores.botonPublicar)?.addEventListener(
      "click",
      publicarColeccion
    );

    obtener(selectores.botonEliminarColeccion)?.addEventListener(
      "click",
      eliminarColeccion
    );

    obtener(selectores.botonImportar)?.addEventListener(
      "click",
      abrirImportacion
    );

    obtener(selectores.formularioElemento)?.addEventListener(
      "submit",
      guardarElemento
    );

    obtener(selectores.formularioColeccion)?.addEventListener(
      "submit",
      guardarColeccion
    );

    obtener(selectores.formularioSeccionHorario)?.addEventListener(
      "submit",
      guardarSeccionHorario
    );

    obtener(selectores.formularioImportacion)?.addEventListener(
      "submit",
      guardarImportacion
    );

    obtener(selectores.botonProcesarImportacion)?.addEventListener(
      "click",
      procesarImportacion
    );

    obtener(selectores.botonAgregarFilaImportacion)?.addEventListener(
      "click",
      agregarFilaImportacion
    );

    obtener(selectores.filtroTexto)?.addEventListener(
      "input",
      (evento) => {
        estado.filtroTexto = evento.target.value;
        renderizarTabla();
      }
    );

    obtener(selectores.filtroEstado)?.addEventListener(
      "change",
      (evento) => {
        estado.filtroEstado = evento.target.value;
        renderizarTabla();
      }
    );

    obtener(selectores.filtroCategoria)?.addEventListener("change", (evento) => {
      estado.filtroCategoria = evento.target.value;
      renderizarTabla();
    });

    obtener(selectores.cuerpoTabla)?.addEventListener(
      "click",
      (evento) => {
        const boton = evento.target.closest("button[data-accion]");

        if (!boton) {
          return;
        }

        const id = Number(boton.dataset.idElemento);

        if (boton.dataset.accion === "editar") {
          const elemento = estado.elementos.find(
            (item) => Number(item.idElemento) === id
          );
          abrirFormularioElemento(elemento);
        }

        if (boton.dataset.accion === "archivar") {
          archivarElemento(id);
        }
      }
    );

    obtener(selectores.selectorNivelHorario)?.addEventListener(
      "change",
      (evento) => {
        estado.nivelHorario = evento.target.value;
        estado.seccionHorario = "";
        renderizarEditorHorarios();
      }
    );

    obtener(selectores.selectorSeccionHorario)?.addEventListener(
      "change",
      (evento) => {
        estado.seccionHorario = evento.target.value;
        renderizarEditorHorarios();
      }
    );

    obtener(selectores.contenidoEditorHorario)?.addEventListener(
      "input",
      editarHorarioDesdeControl
    );

    obtener(selectores.contenidoEditorHorario)?.addEventListener(
      "click",
      async (evento) => {
        const boton = evento.target.closest("[data-horario-accion]");

        if (!boton) {
          return;
        }

        if (boton.dataset.horarioAccion === "desactivar") {
          await cambiarEstadoHorario(
            Number(boton.dataset.horarioId),
            false
          );
        }

        if (boton.dataset.horarioAccion === "activar") {
          await cambiarEstadoHorario(
            Number(boton.dataset.horarioId),
            true
          );
        }

        if (boton.dataset.horarioAccion === "eliminar") {
          await eliminarFilaHorario(
            Number(boton.dataset.horarioId)
          );
        }
      }
    );

    obtener(selectores.botonGuardarHorario)?.addEventListener(
      "click",
      guardarCambiosHorario
    );

    obtener(selectores.botonNuevaSeccionHorario)?.addEventListener(
      "click",
      () => {
        abrirFormularioSeccionHorario();
      }
    );

    obtener(selectores.botonEliminarSeccionHorario)?.addEventListener(
      "click",
      eliminarSeccionHorario
    );

    obtener(selectores.botonDescargarHorarios)?.addEventListener(
      "click",
      descargarHorariosExcel
    );

    obtener("nivelNuevaSeccionHorario")?.addEventListener(
      "change",
      () => {
        const numero = obtener("numeroNuevaSeccionHorario");
        const nivel = Number(obtener("nivelNuevaSeccionHorario")?.value);
        const usados = new Set(
          seccionesDisponiblesHorario()
            .filter(
              (seccion) => detectarNivelHorario(seccion).orden === nivel
            )
            .map((seccion) => Number(seccion.split("-")[1]))
        );
        let siguiente = 1;
        while (usados.has(siguiente) && siguiente < 20) {
          siguiente += 1;
        }
        if (numero) {
          numero.value = String(siguiente);
        }
      }
    );

    [
      [selectores.botonCerrarModalElemento, selectores.modalElemento],
      [selectores.botonCancelarElemento, selectores.modalElemento],
      [selectores.botonCerrarModalColeccion, selectores.modalColeccion],
      [selectores.botonCancelarColeccion, selectores.modalColeccion],
      [selectores.botonCerrarModalSeccionHorario, selectores.modalSeccionHorario],
      [selectores.botonCancelarSeccionHorario, selectores.modalSeccionHorario],
      [selectores.botonCerrarModalImportacion, selectores.modalImportacion],
      [selectores.botonCancelarImportacion, selectores.modalImportacion]
    ].forEach(([idBoton, idModal]) => {
      obtener(idBoton)?.addEventListener("click", () => {
        if (idModal === selectores.modalElemento) {
          global.BoletinesCorreoAdmin?.alCancelarFormularioElemento?.();
        }
        cerrarModal(idModal);
      });
    });

    if (configuracion.importacion?.plantillaUrl) {
      const botonPlantilla = obtener(selectores.botonDescargarPlantilla);
      if (botonPlantilla) {
        botonPlantilla.hidden = false;
        botonPlantilla.href =
          global.API_ADMIN_CLIENT.construirUrl(
            configuracion.importacion.plantillaUrl
          );
      }
    }
  }

  function prepararOpcionesImportacion() {
    const alcances = configuracion.importacion?.alcances;

    if (!Array.isArray(alcances) || alcances.length === 0) {
      return;
    }

    const formulario = obtener(selectores.formularioImportacion);
    const cuadricula = formulario?.querySelector(
      ".gestion-contenido__cuadricula"
    );

    if (!cuadricula || formulario.querySelector("[name='alcance']")) {
      return;
    }

    const contenedor = document.createElement("div");
    contenedor.className = "gestion-contenido__campo";

    const etiqueta = document.createElement("label");
    etiqueta.htmlFor = "alcanceImportacion";
    etiqueta.textContent = "Alcance de la actualización";

    const selector = document.createElement("select");
    selector.id = "alcanceImportacion";
    selector.name = "alcance";
    selector.className = "gestion-contenido__control";

    alcances.forEach((alcance) => {
      const opcion = document.createElement("option");
      opcion.value = alcance.valor;
      opcion.textContent = alcance.etiqueta;
      selector.appendChild(opcion);
    });

    const ayuda = document.createElement("small");
    ayuda.textContent =
      "La nueva versión conservará los datos no incluidos cuando elija nivel, secciones o agregar.";

    contenedor.append(etiqueta, selector, ayuda);

    const campoReemplazar = formulario
      .querySelector("[name='reemplazar']")
      ?.closest(".gestion-contenido__campo");

    if (campoReemplazar) {
      campoReemplazar.hidden = true;
      cuadricula.insertBefore(contenedor, campoReemplazar);
    } else {
      cuadricula.appendChild(contenedor);
    }
  }

  function prepararInterfaz() {
    const titulo = obtener(selectores.titulo);
    const descripcion = obtener(selectores.descripcion);
    const filtrosGenericos = obtener(selectores.filtrosGenericos);
    const tablaGenerica = obtener(selectores.tablaGenerica);
    const editorHorario = obtener(selectores.editorHorario);
    const informacionPagina = obtener("informacionPaginaModulo");
    const encabezadoPagina = obtener("encabezadoPaginaModulo");
    const tarjetas = obtener(selectores.tarjetas);
    const seccionTarjetas = obtener(selectores.seccionTarjetas);

    document.body.classList.toggle(
      "gestion-horarios-admin",
      esGestionHorarios
    );

    if (titulo) {
      titulo.textContent = configuracion.titulo;
    }

    if (descripcion) {
      descripcion.textContent = configuracion.descripcion;
    }

    const botonNuevo = obtener(selectores.botonNuevoElemento);
    if (botonNuevo) {
      botonNuevo.textContent = esGestionHorarios
        ? "Agregar fila"
        : usaTarjetas ? `Nuevo ${configuracion.singular}` : `Agregar ${configuracion.singular}`;
    }

    if (usaTarjetas) {
      obtener(selectores.tituloTarjetas).textContent = configuracion.plural;
      obtener(selectores.accionesTarjetas)?.appendChild(botonNuevo);
    }

    const botonImportar = obtener(selectores.botonImportar);
    if (botonImportar) {
      botonImportar.textContent =
        configuracion.importacion?.textoBoton || "Importar información";
    }

    if (esGestionHorarios) {
      const accionesHorario = obtener(selectores.accionesHorario);

      if (accionesHorario && botonImportar && botonNuevo) {
        accionesHorario.prepend(botonImportar, botonNuevo);
      }
    }

    if (filtrosGenericos) {
      filtrosGenericos.hidden = esGestionHorarios;
    }

    if (tablaGenerica) {
      tablaGenerica.hidden = esGestionHorarios || usaTarjetas;
    }

    if (informacionPagina) informacionPagina.hidden = !usaTarjetas;
    if (encabezadoPagina) encabezadoPagina.hidden = !usaTarjetas;
    if (seccionTarjetas) seccionTarjetas.hidden = !usaTarjetas;
    if (tarjetas) tarjetas.hidden = !usaTarjetas;

    if (editorHorario) {
      editorHorario.hidden = !esGestionHorarios;
    }

    prepararOpcionesImportacion();
    vincularEventos();
  }

  async function inicializar() {
    if (!api) {
      throw new Error("El cliente de la API administrativa no está disponible.");
    }

    prepararInterfaz();

    try {
      await Promise.all([
        cargarContenido(),
        usaTarjetas ? cargarPaginaModulo() : Promise.resolve()
      ]);
    } catch (error) {
      mostrarError(error, "No fue posible cargar el módulo");
      renderizarTodo();
    }
  }

  document.addEventListener("DOMContentLoaded", inicializar);
})(window);
