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

  const estado = {
    colecciones: [],
    elementos: [],
    idColeccion: null,
    elementoEditado: null,
    filasImportacion: [],
    columnasImportacion: [],
    erroresImportacion: [],
    filtroTexto: "",
    filtroEstado: ""
  };

  const selectores = {
    contenido: "contenidoDashboard",
    titulo: "tituloGestionContenido",
    descripcion: "descripcionGestionContenido",
    selectorColeccion: "selectorColeccion",
    botonNuevaColeccion: "botonNuevaColeccion",
    botonNuevoElemento: "botonNuevoElemento",
    botonImportar: "botonImportarContenido",
    botonPublicar: "botonPublicarColeccion",
    botonRecargar: "botonRecargarContenido",
    cuerpoTabla: "cuerpoTablaContenido",
    estadoVacio: "estadoVacioContenido",
    filtroTexto: "filtroTextoContenido",
    filtroEstado: "filtroEstadoContenido",
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
    botonDescargarPlantilla: "botonDescargarPlantilla"
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

      return coincideTexto && coincideEstado;
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

  function renderizarTabla() {
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

  function renderizarTodo() {
    renderizarSelectorColecciones();
    renderizarResumen();
    renderizarTabla();

    const botonPublicar = obtener(selectores.botonPublicar);
    const botonNuevo = obtener(selectores.botonNuevoElemento);
    const botonImportar = obtener(selectores.botonImportar);
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

  function crearControlCampo(campo, valor) {
    const contenedor = document.createElement("div");
    contenedor.className = "gestion-contenido__campo";

    if (campo.completo) {
      contenedor.classList.add("gestion-contenido__campo--completo");
    }

    const etiqueta = document.createElement("label");
    etiqueta.htmlFor = `campo-${campo.nombre}`;
    etiqueta.textContent = campo.etiqueta;

    let control;

    if (campo.tipo === "textarea") {
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
    control.className = "gestion-contenido__control";
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

    contenedor.append(etiqueta, control);

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

  function abrirFormularioElemento(elemento = null) {
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
          campoValor(elemento, campo)
        )
      );
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
      const datos = leerFormularioElemento();
      const id = estado.elementoEditado?.idElemento;

      if (id) {
        await api.put(ruta(`/elementos/${id}`), datos);
      } else {
        await api.post(ruta("/elementos"), datos);
      }

      cerrarModal(selectores.modalElemento);
      await cargarContenido(estado.idColeccion);
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

    const confirmar = global.confirm(
      `¿Desea archivar “${elemento?.titulo || "este registro"}”?`
    );

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

    const confirmar = global.confirm(
      `¿Desea publicar “${coleccion.nombre}”? ` +
      "La colección publicada anteriormente quedará archivada."
    );

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
    obtener(selectores.selectorColeccion)?.addEventListener(
      "change",
      async (evento) => {
        try {
          await cargarContenido(evento.target.value);
        } catch (error) {
          mostrarError(error, "No fue posible cambiar la colección");
        }
      }
    );

    obtener(selectores.botonRecargar)?.addEventListener(
      "click",
      () => cargarContenido(estado.idColeccion).catch(mostrarError)
    );

    obtener(selectores.botonNuevoElemento)?.addEventListener(
      "click",
      () => abrirFormularioElemento()
    );

    obtener(selectores.botonNuevaColeccion)?.addEventListener(
      "click",
      () => abrirModal(selectores.modalColeccion)
    );

    obtener(selectores.botonPublicar)?.addEventListener(
      "click",
      publicarColeccion
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

    [
      [selectores.botonCerrarModalElemento, selectores.modalElemento],
      [selectores.botonCancelarElemento, selectores.modalElemento],
      [selectores.botonCerrarModalColeccion, selectores.modalColeccion],
      [selectores.botonCancelarColeccion, selectores.modalColeccion],
      [selectores.botonCerrarModalImportacion, selectores.modalImportacion],
      [selectores.botonCancelarImportacion, selectores.modalImportacion]
    ].forEach(([idBoton, idModal]) => {
      obtener(idBoton)?.addEventListener("click", () => cerrarModal(idModal));
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

    if (titulo) {
      titulo.textContent = configuracion.titulo;
    }

    if (descripcion) {
      descripcion.textContent = configuracion.descripcion;
    }

    const botonNuevo = obtener(selectores.botonNuevoElemento);
    if (botonNuevo) {
      botonNuevo.textContent = `Agregar ${configuracion.singular}`;
    }

    const botonImportar = obtener(selectores.botonImportar);
    if (botonImportar) {
      botonImportar.textContent =
        configuracion.importacion?.textoBoton || "Importar información";
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
      await cargarContenido();
    } catch (error) {
      mostrarError(error, "No fue posible cargar el módulo");
      renderizarTodo();
    }
  }

  document.addEventListener("DOMContentLoaded", inicializar);
})(window);
