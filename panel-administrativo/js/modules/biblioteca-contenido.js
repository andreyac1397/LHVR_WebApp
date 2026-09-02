(function iniciarBibliotecaAdmin(global) {
  "use strict";

  const api = global.API_ADMIN_CLIENT;
  const grupos = Object.freeze([
    { id: "informacion-rapida", titulo: "Información rápida", descripcion: "Datos principales sobre el horario, préstamo de materiales y servicios disponibles.", max: 8 },
    { id: "nuestra-biblioteca", titulo: "Nuestra biblioteca", descripcion: "Presentación institucional y acceso al Site BiblioCRA.", max: 1, imagen: true, texto: true },
    { id: "historia", titulo: "Historia de la Biblioteca", descripcion: "Historia institucional y línea de tiempo.", max: 12, texto: true },
    { id: "servicios", titulo: "Servicios disponibles", descripcion: "Recursos que apoyan el aprendizaje, la lectura y el trabajo escolar.", max: 12 },
    { id: "areas", titulo: "Áreas de la BiblioCRA", descripcion: "Espacios para consulta, lectura, estudio y tecnología.", max: 12, imagen: true },
    { id: "prestamo", titulo: "Préstamo de materiales", descripcion: "Una tarjeta principal con la guía y la información complementaria dentro de la misma sección.", max: 1, imagen: true },
    { id: "materiales", titulo: "Materiales disponibles", descripcion: "Recursos físicos disponibles para lectura, consulta e investigación.", max: 12 },
    {
      id: "reglamento-recursos",
      titulo: "Reglamento y recursos digitales",
      descripcion: "Normas básicas de uso de la biblioteca y enlaces de apoyo para la comunidad educativa.",
      descripcionAdmin: "Edite el encabezado principal y las dos tarjetas que forman esta sección.",
      max: 2,
      imagen: true,
      texto: true,
      tarjetasFijas: true
    }
  ]);

  const estado = {
    pagina: null,
    estados: [],
    colecciones: [],
    elementos: [],
    idColeccion: null,
    elementoEditado: null,
    grupoEditado: null,
    subgrupoEditado: null,
    permiteImagen: false,
    permiteMultiples: false,
    imagenPrincipal: null,
    imagenesAdicionales: [],
    urlsTemporales: []
  };

  const obtener = (id) => document.getElementById(id);
  const texto = (valor) => String(valor ?? "").trim();
  const datosRespuesta = (respuesta) => respuesta?.datos ?? respuesta ?? {};

  function escapar(valor) {
    return texto(valor)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function resolverImagen(valor) {
    const ruta = texto(valor);
    if (!ruta) {
      return "";
    }
    if (/^https?:\/\//i.test(ruta)) {
      return ruta;
    }
    if (ruta.startsWith("/uploads/")) {
      const baseApi = String(
        global.API_ADMIN_CONFIG?.urlBase || "http://localhost:3001/api"
      ).replace(/\/api\/?$/, "");
      return `${baseApi}${ruta}`;
    }
    try {
      return new URL(
        ruta,
        new URL(
          "../../../frontend-publico/pages/biblioteca-recursos.html",
          global.location.href
        )
      ).href;
    } catch (_error) {
      return ruta;
    }
  }

  function liberarUrlsTemporales() {
    estado.urlsTemporales.forEach((url) => {
      if (typeof URL.revokeObjectURL === "function") {
        URL.revokeObjectURL(url);
      }
    });
    estado.urlsTemporales = [];
  }

  function crearVistaTemporal(archivo) {
    if (!archivo || typeof URL.createObjectURL !== "function") {
      return "";
    }
    const url = URL.createObjectURL(archivo);
    estado.urlsTemporales.push(url);
    return url;
  }

  function validarArchivoImagen(archivo) {
    const tipos = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (!archivo || !tipos.has(texto(archivo.type).toLowerCase())) {
      return "Seleccione una imagen JPG, PNG o WebP.";
    }
    if (Number(archivo.size) > 5 * 1024 * 1024) {
      return "La imagen no puede superar los 5 MB.";
    }
    return "";
  }

  function renderSelectorImagenes() {
    const principal = obtener("vistaPreviaImagenBiblioteca");
    const vacia = obtener("imagenBibliotecaVacia");
    const botonQuitar = obtener("botonQuitarImagenBiblioteca");
    const urlPrincipal = estado.imagenPrincipal?.vista ||
      resolverImagen(estado.imagenPrincipal?.ruta);

    if (principal) {
      principal.src = urlPrincipal || "";
      principal.hidden = !urlPrincipal;
    }
    if (vacia) {
      vacia.hidden = Boolean(urlPrincipal);
    }
    if (botonQuitar) {
      botonQuitar.disabled = !estado.imagenPrincipal;
    }

    const adicionales = obtener("vistasImagenesBiblioteca");
    if (adicionales) {
      adicionales.innerHTML = estado.imagenesAdicionales.map((imagen, indice) => `
        <figure class="biblioteca-admin__miniatura">
          <img src="${escapar(imagen.vista || resolverImagen(imagen.ruta))}" alt="Imagen adicional ${indice + 1}">
          <button type="button" data-quitar-imagen-adicional="${indice}" aria-label="Quitar imagen adicional ${indice + 1}">×</button>
        </figure>
      `).join("");
    }
    const botonQuitarTodas = obtener("botonQuitarImagenesBiblioteca");
    if (botonQuitarTodas) {
      botonQuitarTodas.disabled = estado.imagenesAdicionales.length === 0;
    }
  }

  function prepararSelectorImagenes(elemento) {
    liberarUrlsTemporales();
    estado.imagenPrincipal = texto(elemento?.datos?.imagen)
      ? { ruta: texto(elemento.datos.imagen), archivo: null, vista: "" }
      : null;
    estado.imagenesAdicionales = Array.isArray(elemento?.datos?.imagenes)
      ? elemento.datos.imagenes.map((ruta) => ({
          ruta: texto(ruta),
          archivo: null,
          vista: ""
        })).filter((imagen) => imagen.ruta)
      : [];
    const principal = obtener("archivoImagenBiblioteca");
    const adicionales = obtener("archivosImagenesBiblioteca");
    if (principal) {
      principal.value = "";
    }
    if (adicionales) {
      adicionales.value = "";
    }
    renderSelectorImagenes();
  }

  function seleccionarImagenPrincipal(evento) {
    const archivo = evento.target.files?.[0] || null;
    if (!archivo) {
      return;
    }
    const error = validarArchivoImagen(archivo);
    if (error) {
      evento.target.value = "";
      notificarError(new Error(error), "Imagen no válida");
      return;
    }
    estado.imagenPrincipal = {
      ruta: "",
      archivo,
      vista: crearVistaTemporal(archivo)
    };
    renderSelectorImagenes();
  }

  function seleccionarImagenesAdicionales(evento) {
    const archivos = [...(evento.target.files || [])];
    if (!archivos.length) {
      return;
    }
    const error = archivos.map(validarArchivoImagen).find(Boolean);
    if (error) {
      evento.target.value = "";
      notificarError(new Error(error), "Imagen no válida");
      return;
    }
    estado.imagenesAdicionales.push(...archivos.map((archivo) => ({
      ruta: "",
      archivo,
      vista: crearVistaTemporal(archivo)
    })));
    evento.target.value = "";
    renderSelectorImagenes();
  }

  async function subirImagen(archivo, textoAlternativo) {
    const formulario = new FormData();
    formulario.append("imagen", archivo);
    formulario.append("textoAlternativo", texto(textoAlternativo));
    const respuesta = typeof api.postFormData === "function"
      ? await api.postFormData("/archivos/imagenes/paginas", formulario)
      : await api.post("/archivos/imagenes/paginas", formulario);
    const datos = datosRespuesta(respuesta);
    const archivoRegistrado = datos.archivo || datos.archivoRegistrado || datos;
    const ruta = texto(
      archivoRegistrado?.rutaRelativa || archivoRegistrado?.ruta_relativa
    );
    if (!ruta) {
      throw new Error("La imagen se cargó, pero el servidor no devolvió su ubicación.");
    }
    return ruta;
  }

  function aviso(mensaje, tipo = "info") {
    const elemento = obtener("mensajeBiblioteca");
    if (!elemento) {
      return;
    }
    elemento.textContent = mensaje;
    elemento.dataset.tipo = tipo;
    elemento.hidden = !mensaje;
  }

  function notificarExito(titulo, mensaje) {
    if (global.AlertasAdmin?.exito) {
      global.AlertasAdmin.exito(titulo, mensaje);
      return;
    }
    aviso(mensaje, "exito");
  }

  function notificarError(error, titulo = "Ocurrió un problema") {
    const mensaje = error?.message || "No fue posible completar la operación.";
    if (global.AlertasAdmin?.error) {
      global.AlertasAdmin.error(titulo, mensaje);
    } else {
      aviso(mensaje, "error");
    }
    console.error(error);
  }

  async function confirmar(opciones) {
    if (typeof global.ModalAdmin?.confirmar === "function") {
      return global.ModalAdmin.confirmar(opciones);
    }
    notificarError(
      new Error("No se pudo cargar el componente de confirmación del panel."),
      "No fue posible mostrar la confirmación"
    );
    return false;
  }

  function formatearFecha(valor) {
    if (!valor) {
      return "Sin registrar";
    }
    const fecha = new Date(valor);
    return Number.isNaN(fecha.getTime())
      ? texto(valor)
      : new Intl.DateTimeFormat("es-CR", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(fecha);
  }

  function estadoItem(elemento) {
    return texto(
      elemento?.estado || elemento?.nombreEstado || "BORRADOR"
    ).toUpperCase();
  }

  function esInactivo(elemento) {
    return ["INACTIVO", "ARCHIVADO"].includes(estadoItem(elemento));
  }

  function esColeccionPublicada(coleccion) {
    return Boolean(coleccion?.esPublicada ?? coleccion?.publicada);
  }

  function grupoPorId(idGrupo) {
    return grupos.find((grupo) => grupo.id === idGrupo) || null;
  }

  function normalizarIdentificador(valor) {
    return texto(valor)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function grupoElemento(elemento) {
    const grupo = texto(elemento?.datos?.grupo);
    return ["reglamento", "recursos-digitales", "reglamento-recursos"].includes(grupo)
      ? "reglamento-recursos"
      : grupo;
  }

  function subgrupoReglamentoRecurso(elemento) {
    const datos = elemento?.datos || {};
    const subgrupo = texto(datos.subgrupo);
    if (["encabezado", "reglamento", "recursos-digitales"].includes(subgrupo)) {
      return subgrupo;
    }
    const grupo = texto(datos.grupo);
    if (grupo === "reglamento" || grupo === "recursos-digitales") {
      return grupo;
    }
    const identificador = normalizarIdentificador(
      `${datos.etiqueta || ""} ${elemento?.titulo || ""}`
    );
    return identificador.includes("reglamento")
      ? "reglamento"
      : "recursos-digitales";
  }

  function esEncabezadoReglamentoRecursos(elemento) {
    return elemento?.datos?.tipo === "texto" &&
      texto(elemento?.datos?.grupo) === "reglamento-recursos" &&
      texto(elemento?.datos?.subgrupo) === "encabezado";
  }

  function seleccionarTarjetaFija(elementos, subgrupo) {
    const candidatas = elementos
      .filter(
        (elemento) =>
          !esEncabezadoReglamentoRecursos(elemento) &&
          subgrupoReglamentoRecurso(elemento) === subgrupo
      )
      .sort((a, b) => Number(a.orden) - Number(b.orden));
    return candidatas.find((elemento) => elemento?.datos?.tipo !== "texto") ||
      candidatas[0] ||
      null;
  }

  function esTarjetaPrestamoPrincipal(elemento) {
    if (!elemento) {
      return false;
    }
    const datos = elemento.datos || {};
    const identificador = normalizarIdentificador(
      `${datos.etiqueta || ""} ${elemento.titulo || ""}`
    );
    return datos.principal === true || identificador.includes("guia");
  }

  function seleccionarTarjetaPrestamoPrincipal(elementos) {
    return elementos.find(esTarjetaPrestamoPrincipal) ||
      elementos.find((elemento) => Boolean(texto(elemento?.datos?.imagen))) ||
      elementos[0] ||
      null;
  }

  function coleccionSeleccionada() {
    return estado.colecciones.find(
      (coleccion) =>
        Number(coleccion.idColeccion) === Number(estado.idColeccion)
    ) || null;
  }

  function elementoPorId(idElemento) {
    return estado.elementos.find(
      (elemento) =>
        Number(elemento.idElemento) === Number(idElemento)
    ) || null;
  }

  async function cargarEncabezado() {
    try {
      const [respuestaPagina, respuestaEstados] = await Promise.all([
        api.get(`/paginas/administracion/biblioteca?_=${Date.now()}`),
        api.get("/paginas/estados-publicacion")
      ]);
      estado.pagina = datosRespuesta(respuestaPagina).pagina || null;
      const datosEstados = datosRespuesta(respuestaEstados);
      estado.estados = Array.isArray(datosEstados.estados)
        ? datosEstados.estados
        : Array.isArray(datosEstados)
          ? datosEstados
          : [];
    } catch (_error) {
      estado.pagina = null;
      aviso(
        "El encabezado de Biblioteca todavía no existe en la base de datos.",
        "info"
      );
    }

    const pagina = estado.pagina;
    obtener("nombrePaginaBiblioteca").textContent =
      pagina?.nombre || "Biblioteca";
    obtener("rutaPaginaBiblioteca").textContent =
      pagina?.ruta || "/pages/biblioteca-recursos.html";
    obtener("fechaPaginaBiblioteca").textContent = formatearFecha(
      pagina?.fechaActualizacion || pagina?.fechaCreacion
    );

    const etiquetaEstado = obtener("estadoPaginaBiblioteca");
    const visible = pagina?.estadoVisible === true ||
      pagina?.estadoVisible === 1;
    etiquetaEstado.textContent = pagina?.nombreEstado || "No disponible";
    etiquetaEstado.className = `admin-etiqueta ${
      visible ? "admin-etiqueta--exito" : "admin-etiqueta--advertencia"
    }`;

    obtener("tituloBiblioteca").value =
      pagina?.titulo || "Biblioteca BiblioCRA";
    obtener("descripcionBiblioteca").value =
      pagina?.descripcion ||
      "Espacio de apoyo para la lectura, el estudio, la investigación, el uso de recursos tecnológicos y las actividades educativas.";

    const selectorEstado = obtener("estadoBiblioteca");
    selectorEstado.innerHTML = '<option value="">Seleccione un estado</option>' +
      estado.estados.map((item) =>
        `<option value="${Number(item.idEstadoPublicacion)}">${escapar(item.nombre)}</option>`
      ).join("");
    selectorEstado.value = pagina?.idEstadoPublicacion || "";
    obtener("botonGuardarEncabezadoBiblioteca").disabled = !pagina?.idPagina;
  }

  async function guardarEncabezado(evento) {
    evento.preventDefault();
    if (!estado.pagina) {
      return;
    }

    await api.put(
      `/paginas/administracion/${estado.pagina.idPagina}`,
      {
        titulo: texto(obtener("tituloBiblioteca").value),
        descripcion: texto(obtener("descripcionBiblioteca").value) || null,
        idEstadoPublicacion: Number(obtener("estadoBiblioteca").value)
      }
    );
    await cargarEncabezado();
    notificarExito(
      "Encabezado guardado",
      "El encabezado de Biblioteca fue actualizado."
    );
  }

  function renderSelectorColecciones() {
    const selector = obtener("selectorColeccionBiblioteca");
    selector.innerHTML = estado.colecciones.length
      ? estado.colecciones.map((coleccion) => `
          <option value="${Number(coleccion.idColeccion)}">
            ${escapar(coleccion.nombre)}${esColeccionPublicada(coleccion) ? " · Pública" : ""}
          </option>
        `).join("")
      : '<option value="">No hay versiones</option>';
    selector.disabled = !estado.colecciones.length;
    selector.value = estado.idColeccion || "";

    const seleccionada = coleccionSeleccionada();
    obtener("botonPublicarBiblioteca").disabled =
      !seleccionada || esColeccionPublicada(seleccionada);
    obtener("botonEliminarVersionBiblioteca").disabled = !seleccionada;
  }

  function renderVersiones() {
    const cuerpo = obtener("cuerpoVersionesBiblioteca");
    const vacio = obtener("versionesBibliotecaVacias");
    if (!cuerpo || !vacio) {
      return;
    }

    cuerpo.innerHTML = estado.colecciones.map((coleccion) => `
      <tr>
        <td>
          <strong>${escapar(coleccion.nombre)}</strong>
          ${coleccion.anio ? `<small>${Number(coleccion.anio)}</small>` : ""}
        </td>
        <td>${escapar(formatearFecha(coleccion.fechaActualizacion || coleccion.fechaCreacion))}</td>
        <td>
          <span class="admin-etiqueta ${
            esColeccionPublicada(coleccion)
              ? "admin-etiqueta--exito"
              : "admin-etiqueta--advertencia"
          }">${escapar(esColeccionPublicada(coleccion) ? "PUBLICADA" : coleccion.estado || "BORRADOR")}</span>
        </td>
        <td class="biblioteca-admin__celda-acciones">
          <button
            class="admin-boton admin-boton--pequeno admin-boton--peligro"
            type="button"
            data-eliminar-version="${Number(coleccion.idColeccion)}"
          >Eliminar</button>
        </td>
      </tr>
    `).join("");
    vacio.hidden = estado.colecciones.length > 0;
  }

  function tarjeta(elemento, grupo) {
    const datos = elemento.datos || {};
    const inactivo = esInactivo(elemento);
    const estadoActual = estadoItem(elemento);
    return `
      <article
        class="comunidad-admin__tarjeta biblioteca-admin__tarjeta${inactivo ? " biblioteca-admin__tarjeta--inactiva" : ""}"
        data-id="${Number(elemento.idElemento)}"
        data-grupo="${grupo.id}"
      >
        <div class="comunidad-admin__vista">
          <div class="comunidad-admin__vista-contenido">
            ${grupo.imagen && datos.imagen ? `<img class="biblioteca-admin__imagen" src="${escapar(resolverImagen(datos.imagen))}" alt="${escapar(elemento.titulo || grupo.titulo)}">` : ""}
            <span class="comunidad-seccion__etiqueta">${escapar(datos.etiqueta || grupo.titulo)}</span>
            <h4 class="comunidad-seccion__titulo-visual">${escapar(elemento.titulo)}</h4>
            <p class="comunidad-seccion__contenido-visual">${escapar(elemento.descripcion || elemento.subtitulo || "Sin descripción")}</p>
            ${elemento.url ? `<p class="biblioteca-admin__enlace">${escapar(elemento.url)}</p>` : ""}
            <span class="admin-etiqueta ${estadoActual === "PUBLICADO" ? "admin-etiqueta--exito" : "admin-etiqueta--advertencia"}">${escapar(estadoActual)}</span>
          </div>
        </div>
        <div class="biblioteca-admin__acciones biblioteca-admin__acciones--tarjeta">
          <button
            class="admin-boton admin-boton--secundario"
            type="button"
            data-editar-tarjeta="${Number(elemento.idElemento)}"
          >Editar</button>
          <button
            class="admin-boton ${inactivo ? "admin-boton--primario" : "admin-boton--peligro"}"
            type="button"
            data-cambiar-estado="${Number(elemento.idElemento)}"
            data-activar="${inactivo ? "true" : "false"}"
          >${inactivo ? "Reactivar" : "Retirar"}</button>
        </div>
      </article>
    `;
  }

  function informacionCompactaPrestamo(elemento, grupo) {
    const datos = elemento.datos || {};
    const inactivo = esInactivo(elemento);
    const estadoActual = estadoItem(elemento);
    return `
      <article class="biblioteca-admin__prestamo-item${inactivo ? " biblioteca-admin__prestamo-item--inactivo" : ""}">
        <div>
          <span class="comunidad-seccion__etiqueta">${escapar(datos.etiqueta || "Información")}</span>
          <h4>${escapar(elemento.titulo)}</h4>
          <p>${escapar(elemento.descripcion || elemento.subtitulo || "Sin descripción")}</p>
          ${elemento.url ? `<p class="biblioteca-admin__enlace">${escapar(elemento.url)}</p>` : ""}
          <span class="admin-etiqueta ${estadoActual === "PUBLICADO" ? "admin-etiqueta--exito" : "admin-etiqueta--advertencia"}">${escapar(estadoActual)}</span>
        </div>
        <div class="biblioteca-admin__acciones biblioteca-admin__acciones--tarjeta">
          <button class="admin-boton admin-boton--secundario" type="button" data-editar-tarjeta="${Number(elemento.idElemento)}">Editar</button>
          <button
            class="admin-boton ${inactivo ? "admin-boton--primario" : "admin-boton--peligro"}"
            type="button"
            data-cambiar-estado="${Number(elemento.idElemento)}"
            data-activar="${inactivo ? "true" : "false"}"
          >${inactivo ? "Reactivar" : "Retirar"}</button>
        </div>
      </article>
    `;
  }

  function bloqueTexto(elemento, grupo) {
    return `
      <form
        class="biblioteca-admin__texto-fijo"
        data-texto-biblioteca
        data-id="${elemento?.idElemento ? Number(elemento.idElemento) : ""}"
        data-grupo="${grupo.id}"
      >
        <h4>Encabezado principal de la sección</h4>
        <div class="formulario-admin__grupo">
          <label class="formulario-admin__etiqueta">Título principal</label>
          <input name="titulo" class="formulario-admin__control" value="${escapar(elemento?.titulo || grupo.titulo)}" required>
        </div>
        <div class="formulario-admin__grupo">
          <label class="formulario-admin__etiqueta">Texto principal</label>
          <textarea name="descripcion" class="formulario-admin__control formulario-admin__control--textarea" rows="5" required>${escapar(elemento?.descripcion || elemento?.subtitulo || grupo.descripcion)}</textarea>
        </div>
        <div class="biblioteca-admin__acciones">
          <button class="admin-boton admin-boton--primario" type="submit">Guardar texto</button>
        </div>
      </form>
    `;
  }

  function tarjetaFijaVacia(grupo, subgrupo, titulo, descripcion) {
    return `
      <article class="comunidad-admin__tarjeta biblioteca-admin__tarjeta biblioteca-admin__tarjeta--vacia">
        <div class="comunidad-admin__vista">
          <div class="comunidad-admin__vista-contenido">
            <span class="comunidad-seccion__etiqueta">${escapar(titulo)}</span>
            <h4 class="comunidad-seccion__titulo-visual">${escapar(titulo)}</h4>
            <p class="comunidad-seccion__contenido-visual">${escapar(descripcion)}</p>
          </div>
        </div>
        <div class="biblioteca-admin__acciones biblioteca-admin__acciones--tarjeta">
          <button
            class="admin-boton admin-boton--primario"
            data-agregar="${grupo.id}"
            data-subgrupo="${subgrupo}"
            type="button"
            ${!estado.idColeccion ? "disabled" : ""}
          >Configurar tarjeta</button>
        </div>
      </article>
    `;
  }

  function renderGrupoReglamentoRecursos(grupo) {
    const todos = estado.elementos.filter(
      (elemento) => grupoElemento(elemento) === grupo.id
    );
    const textoPrincipal = todos.find(esEncabezadoReglamentoRecursos);
    const tarjetaReglamento = seleccionarTarjetaFija(todos, "reglamento");
    const tarjetaRecursos = seleccionarTarjetaFija(todos, "recursos-digitales");
    const cantidad = [tarjetaReglamento, tarjetaRecursos].filter(Boolean).length;

    return `
      <section class="biblioteca-admin__grupo">
        <header class="biblioteca-admin__grupo-cabecera">
          <div>
            <h3>${escapar(grupo.titulo)}</h3>
            <p>${escapar(grupo.descripcionAdmin || grupo.descripcion)}</p>
            <span class="biblioteca-admin__contador">${cantidad} de 2 tarjetas</span>
          </div>
        </header>
        ${bloqueTexto(textoPrincipal, grupo)}
        <div class="biblioteca-admin__tarjetas biblioteca-admin__tarjetas--dos">
          ${tarjetaReglamento
            ? tarjeta(tarjetaReglamento, grupo)
            : tarjetaFijaVacia(
                grupo,
                "reglamento",
                "Reglamento",
                "Configure el título, el texto, la imagen y el enlace del reglamento."
              )}
          ${tarjetaRecursos
            ? tarjeta(tarjetaRecursos, grupo)
            : tarjetaFijaVacia(
                grupo,
                "recursos-digitales",
                "Recursos digitales",
                "Configure el título, el texto, las imágenes y el enlace de recursos digitales."
              )}
        </div>
      </section>
    `;
  }

  function renderContenido() {
    const contenedor = obtener("seccionesBibliotecaAdmin");
    contenedor.innerHTML = grupos.map((grupo) => {
      if (grupo.tarjetasFijas) {
        return renderGrupoReglamentoRecursos(grupo);
      }
      const todos = estado.elementos.filter(
        (elemento) => grupoElemento(elemento) === grupo.id
      );
      const textoPrincipal = todos.find(
        (elemento) => elemento.datos?.tipo === "texto"
      );
      const tarjetas = todos
        .filter((elemento) => elemento.datos?.tipo !== "texto")
        .sort((a, b) => Number(a.orden) - Number(b.orden));
      const tarjetaPrestamoPrincipal = grupo.id === "prestamo"
        ? seleccionarTarjetaPrestamoPrincipal(tarjetas)
        : null;
      const tarjetasPrincipales = grupo.id === "prestamo"
        ? tarjetaPrestamoPrincipal ? [tarjetaPrestamoPrincipal] : []
        : tarjetas;
      const informacionPrestamo = grupo.id === "prestamo"
        ? tarjetas.filter((elemento) => elemento !== tarjetaPrestamoPrincipal)
        : [];

      return `
        <section class="biblioteca-admin__grupo">
          <header class="biblioteca-admin__grupo-cabecera">
            <div>
              <h3>${escapar(grupo.titulo)}</h3>
              <p>${escapar(grupo.descripcion)}</p>
              <span class="biblioteca-admin__contador">${tarjetasPrincipales.length} de ${grupo.max} ${grupo.id === "prestamo" ? "tarjeta principal" : "tarjetas"}</span>
            </div>
            <button
              class="admin-boton admin-boton--primario"
              data-agregar="${grupo.id}"
              type="button"
              ${!estado.idColeccion || tarjetasPrincipales.length >= grupo.max ? "disabled" : ""}
            >${grupo.id === "prestamo" ? "Agregar tarjeta principal" : "Agregar tarjeta"}</button>
          </header>
          ${grupo.texto ? bloqueTexto(textoPrincipal, grupo) : ""}
          <div class="biblioteca-admin__tarjetas">
            ${tarjetasPrincipales.map((elemento) => tarjeta(elemento, grupo)).join("")}
          </div>
          ${tarjetasPrincipales.length ? "" : '<div class="biblioteca-admin__vacio">No hay una tarjeta principal configurada.</div>'}
          ${informacionPrestamo.length ? `
            <div class="biblioteca-admin__prestamo-informacion">
              <h4>Información complementaria dentro de la sección</h4>
              ${informacionPrestamo.map((elemento) => informacionCompactaPrestamo(elemento, grupo)).join("")}
            </div>
          ` : ""}
        </section>
      `;
    }).join("");
  }

  async function cargar(idColeccion = null) {
    const sufijo = idColeccion
      ? `?idColeccion=${encodeURIComponent(idColeccion)}`
      : "";
    const respuesta = await api.get(`/biblioteca/administracion${sufijo}`);
    const datos = datosRespuesta(respuesta);

    estado.colecciones = Array.isArray(datos.colecciones)
      ? datos.colecciones
      : [];
    estado.idColeccion = Number(
      datos.idColeccionSeleccionada ||
      datos.coleccion?.idColeccion ||
      idColeccion ||
      estado.colecciones[0]?.idColeccion
    ) || null;
    estado.elementos = Array.isArray(datos.elementos)
      ? datos.elementos
      : [];

    renderSelectorColecciones();
    renderVersiones();
    renderContenido();
  }

  function payloadElemento(elemento, nuevoEstado = null) {
    return {
      idColeccion: Number(elemento.idColeccion || estado.idColeccion),
      titulo: texto(elemento.titulo),
      descripcion: texto(elemento.descripcion || elemento.subtitulo),
      url: texto(elemento.url) || null,
      orden: Number(elemento.orden || 1),
      estado: nuevoEstado || estadoItem(elemento),
      destacado: Boolean(elemento.destacado),
      datos: {
        ...(elemento.datos || {})
      }
    };
  }

  function abrirModalTarjeta(idGrupo, elemento = null, subgrupo = null) {
    const grupo = grupoPorId(idGrupo);
    if (!grupo || !estado.idColeccion) {
      return;
    }

    estado.grupoEditado = grupo;
    estado.elementoEditado = elemento;
    estado.subgrupoEditado = grupo.tarjetasFijas
      ? texto(subgrupo) || subgrupoReglamentoRecurso(elemento)
      : null;
    const principalPrestamoActual = seleccionarTarjetaPrestamoPrincipal(
      estado.elementos
        .filter((item) => grupoElemento(item) === "prestamo" && item.datos?.tipo !== "texto")
        .sort((a, b) => Number(a.orden) - Number(b.orden))
    );
    estado.permiteImagen = Boolean(
      grupo.imagen &&
      (grupo.id !== "prestamo" || !elemento || elemento === principalPrestamoActual)
    );
    estado.permiteMultiples = Boolean(
      grupo.tarjetasFijas && estado.subgrupoEditado === "recursos-digitales"
    );
    const nombreTarjeta = estado.subgrupoEditado === "reglamento"
      ? "Reglamento"
      : estado.subgrupoEditado === "recursos-digitales"
        ? "Recursos digitales"
        : grupo.titulo;
    obtener("tituloModalTarjetaBiblioteca").textContent = elemento
      ? `Editar: ${elemento.titulo}`
      : `Configurar: ${nombreTarjeta}`;

    const formulario = obtener("formularioTarjetaBiblioteca");
    formulario.reset();
    obtener("tarjetaBibliotecaTitulo").value = elemento?.titulo || "";
    obtener("tarjetaBibliotecaEtiqueta").value = elemento?.datos?.etiqueta || "";
    obtener("tarjetaBibliotecaOrden").value = Number(
      elemento?.orden ||
      estado.elementos.filter((item) => grupoElemento(item) === grupo.id).length + 1
    );
    obtener("tarjetaBibliotecaDescripcion").value =
      elemento?.descripcion || elemento?.subtitulo || "";
    obtener("tarjetaBibliotecaUrl").value = elemento?.url || "";
    obtener("tarjetaBibliotecaTextoBoton").value =
      elemento?.datos?.textoBoton || "";
    obtener("tarjetaBibliotecaAltImagen").value =
      elemento?.datos?.altImagen || elemento?.titulo || "";
    obtener("tarjetaBibliotecaEstado").value = elemento
      ? estadoItem(elemento)
      : "PUBLICADO";
    obtener("campoImagenTarjetaBiblioteca").hidden = !estado.permiteImagen;
    obtener("campoImagenesTarjetaBiblioteca").hidden = !estado.permiteMultiples;
    obtener("campoAltImagenTarjetaBiblioteca").hidden = !estado.permiteImagen;
    prepararSelectorImagenes(elemento);

    const modal = obtener("modalTarjetaBiblioteca");
    modal.hidden = false;
    document.body.classList.add("modal-abierto");
    global.setTimeout(() => obtener("tarjetaBibliotecaTitulo")?.focus(), 0);
  }

  function cerrarModalTarjeta() {
    obtener("modalTarjetaBiblioteca").hidden = true;
    document.body.classList.remove("modal-abierto");
    liberarUrlsTemporales();
    estado.imagenPrincipal = null;
    estado.imagenesAdicionales = [];
    estado.elementoEditado = null;
    estado.grupoEditado = null;
    estado.subgrupoEditado = null;
    estado.permiteImagen = false;
    estado.permiteMultiples = false;
  }

  async function guardarTarjeta(evento) {
    evento.preventDefault();
    const grupo = estado.grupoEditado;
    const subgrupo = estado.subgrupoEditado;
    if (!grupo) {
      return;
    }

    const formulario = new FormData(evento.currentTarget);
    const botonGuardar = evento.currentTarget.querySelector?.('[type="submit"]');
    if (botonGuardar) {
      botonGuardar.disabled = true;
      botonGuardar.textContent = "Guardando...";
    }

    try {
      const altImagen = texto(formulario.get("altImagen"));
      let imagenPrincipal = estado.imagenPrincipal?.ruta || "";
      if (estado.permiteImagen && estado.imagenPrincipal?.archivo) {
        imagenPrincipal = await subirImagen(
          estado.imagenPrincipal.archivo,
          altImagen || formulario.get("titulo")
        );
      }

      const imagenesAdicionales = [];
      if (estado.permiteMultiples) {
        for (const [indice, imagen] of estado.imagenesAdicionales.entries()) {
          imagenesAdicionales.push(
            imagen.archivo
              ? await subirImagen(
                  imagen.archivo,
                  `${altImagen || formulario.get("titulo")} ${indice + 1}`
                )
              : imagen.ruta
          );
        }
      }

      const payload = {
        idColeccion: Number(estado.idColeccion),
        titulo: texto(formulario.get("titulo")),
        descripcion: texto(formulario.get("descripcion")),
        url: texto(formulario.get("url")) || null,
        orden: Number(formulario.get("orden") || 1),
        estado: texto(formulario.get("estado")) || "PUBLICADO",
        destacado: false,
        datos: {
          ...(estado.elementoEditado?.datos || {}),
          grupo: grupo.id,
          tipo: "tarjeta",
          ...(subgrupo
            ? { subgrupo }
            : {}),
          etiqueta: texto(formulario.get("etiqueta")),
          imagen: estado.permiteImagen ? imagenPrincipal : "",
          imagenes: estado.permiteMultiples ? imagenesAdicionales : [],
          altImagen,
          textoBoton: texto(formulario.get("textoBoton")),
          ...(grupo.id === "prestamo" && estado.permiteImagen
            ? { principal: true }
            : {})
        }
      };

      if (estado.elementoEditado?.idElemento) {
        await api.put(
          `/biblioteca/elementos/${estado.elementoEditado.idElemento}`,
          payload
        );
      } else {
        await api.post("/biblioteca/elementos", payload);
      }

      cerrarModalTarjeta();
      await cargar(estado.idColeccion);
      notificarExito(
        "Contenido guardado",
        subgrupo === "recursos-digitales"
          ? "El recurso digital fue actualizado."
          : "La tarjeta de Biblioteca fue actualizada."
      );
    } finally {
      if (botonGuardar) {
        botonGuardar.disabled = false;
        botonGuardar.textContent = "Guardar cambios";
      }
    }
  }

  async function guardarTextoPrincipal(formularioElemento) {
    const idElemento = Number(formularioElemento.dataset.id);
    const grupo = grupoPorId(formularioElemento.dataset.grupo);
    if (!grupo) {
      return;
    }

    const formulario = new FormData(formularioElemento);
    const elemento = elementoPorId(idElemento);
    const payload = {
      ...(elemento ? payloadElemento(elemento) : {
        idColeccion: Number(estado.idColeccion),
        url: null,
        orden: 0,
        estado: "PUBLICADO",
        destacado: false,
        datos: {}
      }),
      titulo: texto(formulario.get("titulo")),
      descripcion: texto(formulario.get("descripcion")),
      datos: {
        ...(elemento?.datos || {}),
        grupo: grupo.id,
        tipo: "texto",
        ...(grupo.tarjetasFijas ? { subgrupo: "encabezado" } : {})
      }
    };
    if (elemento) {
      await api.put(`/biblioteca/elementos/${idElemento}`, payload);
    } else {
      await api.post("/biblioteca/elementos", payload);
    }
    await cargar(estado.idColeccion);
    notificarExito(
      "Texto guardado",
      "El texto principal de la sección fue actualizado."
    );
  }

  async function cambiarEstadoTarjeta(idElemento, activar) {
    const elemento = elementoPorId(idElemento);
    if (!elemento) {
      return;
    }

    const confirmado = await confirmar({
      tipo: activar ? "informacion" : "advertencia",
      titulo: activar ? "Reactivar tarjeta" : "Retirar tarjeta",
      mensaje: activar
        ? `¿Desea reactivar “${elemento.titulo}”?`
        : `¿Desea retirar “${elemento.titulo}”?`,
      detalle: activar
        ? "La tarjeta volverá a aparecer públicamente si esta versión está publicada."
        : "La tarjeta permanecerá en administración como inactiva y dejará de aparecer públicamente.",
      textoConfirmar: activar ? "Reactivar" : "Retirar",
      textoCancelar: "Cancelar"
    });

    if (!confirmado) {
      return;
    }

    await api.put(
      `/biblioteca/elementos/${idElemento}`,
      payloadElemento(elemento, activar ? "PUBLICADO" : "INACTIVO")
    );
    await cargar(estado.idColeccion);
    notificarExito(
      activar ? "Tarjeta reactivada" : "Tarjeta retirada",
      activar
        ? "La tarjeta volvió a quedar publicada."
        : "La tarjeta quedó inactiva y se conserva en administración."
    );
  }

  async function eliminarVersion(idColeccion) {
    const coleccion = estado.colecciones.find(
      (item) => Number(item.idColeccion) === Number(idColeccion)
    );
    if (!coleccion) {
      return;
    }

    const confirmado = await confirmar({
      tipo: "peligro",
      titulo: "Eliminar versión de Biblioteca",
      mensaje: `Se eliminará “${coleccion.nombre}”.`,
      detalle: esColeccionPublicada(coleccion)
        ? "Esta versión es pública. También se eliminarán sus tarjetas y registros de importación, y Biblioteca quedará sin versión pública hasta publicar otra."
        : "También se eliminarán sus tarjetas y registros de importación. Esta acción no se puede deshacer.",
      textoConfirmar: "Eliminar versión",
      textoCancelar: "Cancelar"
    });

    if (!confirmado) {
      return;
    }

    await api.delete(`/biblioteca/colecciones/${idColeccion}`);
    const siguiente = estado.colecciones.find(
      (item) => Number(item.idColeccion) !== Number(idColeccion)
    );
    await cargar(siguiente?.idColeccion || null);
    notificarExito(
      "Versión eliminada",
      "La versión, sus tarjetas y sus importaciones se eliminaron correctamente."
    );
  }

  async function publicar() {
    const coleccion = coleccionSeleccionada();
    if (!coleccion) {
      return;
    }

    const confirmado = await confirmar({
      tipo: "advertencia",
      titulo: "Publicar versión",
      mensaje: `¿Desea publicar “${coleccion.nombre}”?`,
      detalle: "Esta versión sustituirá la versión pública anterior.",
      textoConfirmar: "Publicar versión",
      textoCancelar: "Cancelar"
    });
    if (!confirmado) {
      return;
    }

    await api.post(
      `/biblioteca/colecciones/${coleccion.idColeccion}/publicar`,
      {}
    );
    await cargar(coleccion.idColeccion);
    notificarExito(
      "Versión publicada",
      "El contenido ya está disponible en la página pública."
    );
  }

  async function cargarTodo() {
    aviso("");
    await Promise.all([
      cargarEncabezado(),
      cargar(estado.idColeccion)
    ]);
  }

  function vincularEventos() {
    obtener("formularioEncabezadoBiblioteca").addEventListener(
      "submit",
      (evento) => guardarEncabezado(evento).catch((error) =>
        notificarError(error, "No fue posible guardar el encabezado")
      )
    );
    obtener("botonRecargarBiblioteca").addEventListener(
      "click",
      () => cargarTodo().catch((error) => notificarError(error))
    );
    obtener("selectorColeccionBiblioteca").addEventListener(
      "change",
      (evento) => cargar(evento.target.value).catch((error) =>
        notificarError(error, "No fue posible cargar la versión")
      )
    );
    obtener("botonPublicarBiblioteca").addEventListener(
      "click",
      () => publicar().catch((error) =>
        notificarError(error, "No fue posible publicar la versión")
      )
    );
    obtener("botonEliminarVersionBiblioteca").addEventListener(
      "click",
      () => {
        if (!estado.idColeccion) {
          return;
        }
        eliminarVersion(estado.idColeccion).catch((error) =>
          notificarError(error, "No fue posible eliminar la versión")
        );
      }
    );
    obtener("formularioTarjetaBiblioteca").addEventListener(
      "submit",
      (evento) => guardarTarjeta(evento).catch((error) =>
        notificarError(error, "No fue posible guardar la tarjeta")
      )
    );
    obtener("botonCerrarModalTarjetaBiblioteca").addEventListener(
      "click",
      cerrarModalTarjeta
    );
    obtener("botonCancelarTarjetaBiblioteca").addEventListener(
      "click",
      cerrarModalTarjeta
    );
    obtener("botonSeleccionarImagenBiblioteca").addEventListener(
      "click",
      () => obtener("archivoImagenBiblioteca").click()
    );
    obtener("archivoImagenBiblioteca").addEventListener(
      "change",
      seleccionarImagenPrincipal
    );
    obtener("botonQuitarImagenBiblioteca").addEventListener(
      "click",
      () => {
        estado.imagenPrincipal = null;
        obtener("archivoImagenBiblioteca").value = "";
        renderSelectorImagenes();
      }
    );
    obtener("botonSeleccionarImagenesBiblioteca").addEventListener(
      "click",
      () => obtener("archivosImagenesBiblioteca").click()
    );
    obtener("archivosImagenesBiblioteca").addEventListener(
      "change",
      seleccionarImagenesAdicionales
    );
    obtener("botonQuitarImagenesBiblioteca").addEventListener(
      "click",
      () => {
        estado.imagenesAdicionales = [];
        renderSelectorImagenes();
      }
    );
    obtener("vistasImagenesBiblioteca").addEventListener(
      "click",
      (evento) => {
        const boton = evento.target.closest("[data-quitar-imagen-adicional]");
        if (!boton) {
          return;
        }
        estado.imagenesAdicionales.splice(
          Number(boton.dataset.quitarImagenAdicional),
          1
        );
        renderSelectorImagenes();
      }
    );
    obtener("modalTarjetaBiblioteca").addEventListener("click", (evento) => {
      if (evento.target === evento.currentTarget) {
        cerrarModalTarjeta();
      }
    });

    obtener("seccionesBibliotecaAdmin").addEventListener(
      "submit",
      (evento) => {
        if (!evento.target.matches("[data-texto-biblioteca]")) {
          return;
        }
        evento.preventDefault();
        guardarTextoPrincipal(evento.target).catch((error) =>
          notificarError(error, "No fue posible guardar el texto")
        );
      }
    );
    obtener("seccionesBibliotecaAdmin").addEventListener(
      "click",
      (evento) => {
        const agregar = evento.target.closest("[data-agregar]");
        const editar = evento.target.closest("[data-editar-tarjeta]");
        const cambiar = evento.target.closest("[data-cambiar-estado]");

        if (agregar) {
          abrirModalTarjeta(
            agregar.dataset.agregar,
            null,
            agregar.dataset.subgrupo || null
          );
        } else if (editar) {
          const elemento = elementoPorId(editar.dataset.editarTarjeta);
          if (elemento) {
            abrirModalTarjeta(
              grupoElemento(elemento),
              elemento,
              grupoElemento(elemento) === "reglamento-recursos"
                ? subgrupoReglamentoRecurso(elemento)
                : null
            );
          }
        } else if (cambiar) {
          cambiarEstadoTarjeta(
            cambiar.dataset.cambiarEstado,
            cambiar.dataset.activar === "true"
          ).catch((error) =>
            notificarError(error, "No fue posible cambiar el estado")
          );
        }
      }
    );
    obtener("cuerpoVersionesBiblioteca").addEventListener(
      "click",
      (evento) => {
        const boton = evento.target.closest("[data-eliminar-version]");
        if (boton) {
          eliminarVersion(boton.dataset.eliminarVersion).catch((error) =>
            notificarError(error, "No fue posible eliminar la versión")
          );
        }
      }
    );
    document.addEventListener("keydown", (evento) => {
      if (
        evento.key === "Escape" &&
        !obtener("modalTarjetaBiblioteca").hidden
      ) {
        cerrarModalTarjeta();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (!api) {
      return;
    }
    obtener("contenidoBibliotecaAdmin").hidden = false;
    vincularEventos();
    cargarTodo().catch((error) => notificarError(error));
  }, { once: true });
})(window);
