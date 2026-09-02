(function iniciarGestionCorreosBoletines(global) {
  "use strict";

  const configuracion = global.CONFIGURACION_GESTION_CONTENIDO;
  if (configuracion?.apiBase !== "boletines") return;

  const api = global.API_ADMIN_CLIENT;
  const estado = {
    categorias: [],
    destinatarios: [],
    paginacion: { pagina: 1, paginas: 1, total: 0 },
    filtros: { buscar: "", idCategoria: "", activo: "" },
    idDestinatarioEditado: null,
    historial: [],
    historialPromesa: null,
    resultadosBusqueda: [],
    totalBusqueda: 0,
    criterioActual: "",
    seleccion: {
      idsCategorias: new Set(),
      idsDestinatarios: new Set(),
      criteriosBusqueda: new Set(),
      idsExcluidos: new Set()
    },
    seleccionResuelta: { destinatarios: [], resumen: { totalUnicos: 0 } },
    selectorFormulario: null,
    secuenciaResolucion: 0,
    secuenciaBusqueda: 0
  };

  const obtener = (id) => document.getElementById(id);
  const datos = (respuesta) => respuesta?.datos ?? {};
  const escapar = (valor) => String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  function notificar(tipo, titulo, mensaje) {
    const alertas = global.AlertasAdmin;
    const metodo = alertas?.[tipo] || alertas?.informacion;
    if (typeof metodo === "function") metodo.call(alertas, titulo, mensaje);
    else console[tipo === "error" ? "error" : "log"](`${titulo}: ${mensaje}`);
  }

  function mostrarError(error, titulo = "No fue posible completar la operación") {
    notificar("error", titulo, error?.message || "Ocurrió un error inesperado.");
    console.error(error);
  }

  function formatearFecha(valor, incluirHora = true) {
    if (!valor) return "—";
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return "—";
    return new Intl.DateTimeFormat("es-CR", incluirHora
      ? { dateStyle: "medium", timeStyle: "short" }
      : { dateStyle: "medium" }).format(fecha);
  }

  function abrirModal(id) {
    const modal = obtener(id);
    if (!modal) return;
    modal.hidden = false;
    document.body.classList.add("modal-abierto");
  }

  function cerrarModal(id) {
    const modal = obtener(id);
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove("modal-abierto");
  }

  function seleccionComoObjeto() {
    return {
      idsCategorias: [...estado.seleccion.idsCategorias],
      idsDestinatarios: [...estado.seleccion.idsDestinatarios],
      criteriosBusqueda: [...estado.seleccion.criteriosBusqueda],
      idsExcluidos: [...estado.seleccion.idsExcluidos]
    };
  }

  function renderizarCategoriasFormularioDestinatario(seleccionadas = []) {
    const contenedor = obtener("categoriasFormularioDestinatario");
    if (!contenedor) return;
    const ids = new Set(seleccionadas.map(Number));
    contenedor.innerHTML = estado.categorias.map((categoria) => `
      <label class="boletines-correo__opcion">
        <input type="checkbox" name="idsCategorias" value="${categoria.idCategoria}" ${ids.has(categoria.idCategoria) ? "checked" : ""}>
        <span>${escapar(categoria.nombre)}</span>
      </label>
    `).join("");
  }

  function renderizarFiltroCategorias() {
    const selector = obtener("filtroCategoriaCorreo");
    if (!selector) return;
    const actual = selector.value;
    selector.innerHTML = '<option value="">Todas</option>' + estado.categorias
      .map((categoria) => `<option value="${categoria.idCategoria}">${escapar(categoria.nombre)}</option>`)
      .join("");
    selector.value = actual;
  }

  async function cargarCategorias() {
    const respuesta = await api.get("/boletines/correo/categorias");
    estado.categorias = datos(respuesta).categorias || [];
    renderizarFiltroCategorias();
    renderizarCategoriasFormularioDestinatario();
    renderizarCategoriasSelectorBoletin();
  }

  function renderizarDirectorio() {
    const cuerpo = obtener("cuerpoDestinatariosCorreo");
    const vacio = obtener("vacioDestinatariosCorreo");
    if (!cuerpo) return;
    const idsResueltos = new Set(
      (estado.seleccionResuelta.destinatarios || []).map((persona) => persona.idDestinatario)
    );
    cuerpo.innerHTML = estado.destinatarios.map((persona) => `
      <tr>
        <td><input type="checkbox" data-seleccionar-persona="${persona.idDestinatario}" aria-label="Seleccionar a ${escapar(persona.nombreCompleto)}" ${idsResueltos.has(persona.idDestinatario) ? "checked" : ""}></td>
        <td><strong>${escapar(persona.nombreCompleto)}</strong></td>
        <td>${escapar(persona.correo)}</td>
        <td><div class="boletines-correo__categorias">${persona.categorias.map((categoria) => `<span class="boletines-correo__categoria">${escapar(categoria.nombre)}</span>`).join("")}</div></td>
        <td><span class="admin-etiqueta">${persona.activo ? "Activo" : "Inactivo"}</span></td>
        <td><div class="boletines-correo__acciones-tabla"><button class="admin-boton admin-boton--secundario admin-boton--pequeno" type="button" data-editar-destinatario="${persona.idDestinatario}">Editar</button><button class="admin-boton admin-boton--secundario admin-boton--pequeno" type="button" data-estado-destinatario="${persona.idDestinatario}" data-activo="${!persona.activo}">${persona.activo ? "Inactivar" : "Activar"}</button></div></td>
      </tr>
    `).join("");
    vacio.hidden = estado.destinatarios.length > 0;
    obtener("paginaDestinatariosCorreo").textContent =
      `Página ${estado.paginacion.pagina} de ${estado.paginacion.paginas} · ${estado.paginacion.total} registros`;
    obtener("anteriorDestinatariosCorreo").disabled = estado.paginacion.pagina <= 1;
    obtener("siguienteDestinatariosCorreo").disabled =
      estado.paginacion.pagina >= estado.paginacion.paginas;
  }

  async function cargarDirectorio(pagina = 1) {
    const parametros = new URLSearchParams({ pagina: String(pagina), limite: "20" });
    if (estado.filtros.buscar) parametros.set("buscar", estado.filtros.buscar);
    if (estado.filtros.idCategoria) parametros.set("idCategoria", estado.filtros.idCategoria);
    if (estado.filtros.activo) parametros.set("activo", estado.filtros.activo);
    const respuesta = await api.get(`/boletines/correo/destinatarios?${parametros}`);
    const contenido = datos(respuesta);
    estado.destinatarios = contenido.destinatarios || [];
    estado.paginacion = contenido.paginacion || { pagina: 1, paginas: 1, total: 0 };
    renderizarDirectorio();
  }

  function abrirFormularioDestinatario(persona = null) {
    const formulario = obtener("formularioDestinatarioCorreo");
    formulario.reset();
    estado.idDestinatarioEditado = persona?.idDestinatario || null;
    obtener("tituloModalDestinatarioCorreo").textContent = persona
      ? "Editar destinatario"
      : "Nuevo destinatario";
    formulario.elements.nombreCompleto.value = persona?.nombreCompleto || "";
    formulario.elements.correo.value = persona?.correo || "";
    formulario.elements.activo.value = String(persona?.activo !== false);
    renderizarCategoriasFormularioDestinatario(
      persona?.categorias?.map((categoria) => categoria.idCategoria) || []
    );
    abrirModal("modalDestinatarioCorreo");
  }

  async function guardarDestinatario(evento) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const payload = {
      nombreCompleto: formulario.elements.nombreCompleto.value.trim(),
      correo: formulario.elements.correo.value.trim(),
      activo: formulario.elements.activo.value === "true",
      idsCategorias: [...formulario.querySelectorAll("[name='idsCategorias']:checked")]
        .map((control) => Number(control.value))
    };
    try {
      if (estado.idDestinatarioEditado) {
        await api.put(`/boletines/correo/destinatarios/${estado.idDestinatarioEditado}`, payload);
      } else {
        await api.post("/boletines/correo/destinatarios", payload);
      }
      cerrarModal("modalDestinatarioCorreo");
      await cargarDirectorio(estado.paginacion.pagina);
      notificar("exito", "Destinatario guardado", "El directorio se actualizó correctamente.");
    } catch (error) {
      mostrarError(error, "No fue posible guardar el destinatario");
    }
  }

  async function editarDestinatario(id) {
    try {
      const respuesta = await api.get(`/boletines/correo/destinatarios/${id}`);
      abrirFormularioDestinatario(datos(respuesta));
    } catch (error) {
      mostrarError(error, "No fue posible abrir el destinatario");
    }
  }

  async function cambiarEstadoDestinatario(id, activo) {
    const confirmado = await (global.ModalAdmin?.confirmar?.({
      tipo: "advertencia",
      titulo: activo ? "Activar destinatario" : "Inactivar destinatario",
      mensaje: activo
        ? "El destinatario podrá incluirse nuevamente en envíos nuevos."
        : "El destinatario dejará de incluirse en envíos nuevos.",
      detalle: "El historial de boletines anteriores se conservará.",
      textoConfirmar: activo ? "Activar" : "Inactivar"
    }) ?? Promise.resolve(global.confirm("¿Desea cambiar el estado del destinatario?")));
    if (!confirmado) return;
    try {
      await api.patch(`/boletines/correo/destinatarios/${id}/estado`, { activo });
      await cargarDirectorio(estado.paginacion.pagina);
      notificar("exito", "Estado actualizado", "El cambio se guardó correctamente.");
    } catch (error) {
      mostrarError(error, "No fue posible cambiar el estado");
    }
  }

  function renderizarCategoriasSelectorBoletin() {
    const contenedor = estado.selectorFormulario?.querySelector("[data-categorias-boletin]");
    if (!contenedor) return;
    contenedor.innerHTML = estado.categorias.map((categoria) => `
      <label class="boletines-correo__opcion">
        <input type="checkbox" value="${categoria.idCategoria}" data-categoria-seleccion ${estado.seleccion.idsCategorias.has(categoria.idCategoria) ? "checked" : ""}>
        <span>${escapar(categoria.nombre)}</span>
      </label>
    `).join("");
  }

  function renderizarResultadosBusqueda() {
    const contenedor = estado.selectorFormulario?.querySelector("[data-resultados-correo]");
    const seleccionarTodos = estado.selectorFormulario?.querySelector("[data-seleccionar-buscados]");
    const etiquetaTodos = estado.selectorFormulario?.querySelector("[data-etiqueta-buscados]");
    if (!contenedor) return;
    if (seleccionarTodos) {
      seleccionarTodos.disabled = !estado.criterioActual || estado.totalBusqueda === 0;
      seleccionarTodos.checked = estado.seleccion.criteriosBusqueda.has(estado.criterioActual);
    }
    if (etiquetaTodos) {
      etiquetaTodos.textContent = estado.criterioActual
        ? `Seleccionar los ${estado.totalBusqueda} resultados encontrados`
        : "Escriba una búsqueda para seleccionar todos sus resultados";
    }
    const idsResueltos = new Set(
      (estado.seleccionResuelta.destinatarios || []).map((persona) => persona.idDestinatario)
    );
    contenedor.innerHTML = estado.resultadosBusqueda.length
      ? estado.resultadosBusqueda.map((persona) => {
        const seleccionada = idsResueltos.has(persona.idDestinatario) &&
          !estado.seleccion.idsExcluidos.has(persona.idDestinatario);
        return `<label class="boletines-correo__resultado"><input type="checkbox" data-persona-resultado="${persona.idDestinatario}" ${seleccionada ? "checked" : ""}><span><strong>${escapar(persona.nombreCompleto)}</strong><small>${escapar(persona.correo)}</small></span></label>`;
      }).join("")
      : `<p>${estado.criterioActual ? "No se encontraron destinatarios activos." : "Busque por nombre o correo para seleccionar personas."}</p>`;
  }

  async function buscarPersonasSeleccion(criterio) {
    const secuencia = ++estado.secuenciaBusqueda;
    estado.criterioActual = String(criterio || "").trim().toLowerCase();
    const parametros = new URLSearchParams({ activo: "true", pagina: "1", limite: "100" });
    if (estado.criterioActual) parametros.set("buscar", estado.criterioActual);
    try {
      const respuesta = await api.get(`/boletines/correo/destinatarios?${parametros}`);
      if (secuencia !== estado.secuenciaBusqueda) return;
      const contenido = datos(respuesta);
      estado.resultadosBusqueda = contenido.destinatarios || [];
      estado.totalBusqueda = contenido.paginacion?.total || 0;
      renderizarResultadosBusqueda();
    } catch (error) {
      if (secuencia === estado.secuenciaBusqueda) mostrarError(error, "No fue posible buscar destinatarios");
    }
  }

  function renderizarResumenSeleccion() {
    const resumen = estado.selectorFormulario?.querySelector("[data-resumen-seleccion]");
    if (!resumen) return;
    const datosResumen = estado.seleccionResuelta.resumen || {};
    const personas = estado.seleccionResuelta.destinatarios || [];
    const detalleCategorias = estado.categorias
      .filter((categoria) => estado.seleccion.idsCategorias.has(categoria.idCategoria))
      .map((categoria) => {
        const cantidad = personas.filter((persona) =>
          persona.categorias.some((item) => item.idCategoria === categoria.idCategoria)
        ).length;
        return `${escapar(categoria.nombre)}: ${cantidad}`;
      });
    resumen.innerHTML = `
      <div><p><strong>${Number(datosResumen.totalUnicos || 0)} destinatarios únicos seleccionados</strong></p><p>${detalleCategorias.length ? `${detalleCategorias.join(" · ")} · ` : ""}Selección individual: ${Number(datosResumen.porIndividual || 0)} · Búsquedas completas: ${Number(datosResumen.porBusqueda || 0)}</p></div>
      <div class="boletines-correo__acciones-tabla"><button type="button" class="admin-boton admin-boton--secundario" data-ver-seleccionados>Ver seleccionados</button><button type="button" class="admin-boton admin-boton--texto" data-limpiar-seleccion>Limpiar selección</button></div>
    `;
  }

  async function resolverSeleccion() {
    const secuencia = ++estado.secuenciaResolucion;
    const respuesta = await api.post("/boletines/correo/seleccion/resolver", seleccionComoObjeto());
    if (secuencia !== estado.secuenciaResolucion) return estado.seleccionResuelta;
    estado.seleccionResuelta = datos(respuesta);
    renderizarResumenSeleccion();
    renderizarResultadosBusqueda();
    renderizarDirectorio();
    return estado.seleccionResuelta;
  }

  function limpiarSeleccion() {
    Object.values(estado.seleccion).forEach((conjunto) => conjunto.clear());
    estado.seleccionResuelta = { destinatarios: [], resumen: { totalUnicos: 0 } };
    renderizarCategoriasSelectorBoletin();
    renderizarResultadosBusqueda();
    renderizarResumenSeleccion();
    renderizarDirectorio();
  }

  function prepararFormularioElemento({ elemento, contenedorCampos }) {
    if (elemento) return;
    const bloque = document.createElement("div");
    bloque.className = "boletines-correo__selector";
    bloque.innerHTML = `
      <h3>Enviar también por correo</h3>
      <p>El boletín se guarda primero. El envío solo se procesa después de una confirmación independiente.</p>
      <div class="boletines-correo__opciones">
        <label class="boletines-correo__opcion"><input type="radio" name="enviarCorreoBoletin" value="no" checked><span>No</span></label>
        <label class="boletines-correo__opcion"><input type="radio" name="enviarCorreoBoletin" value="si"><span>Sí</span></label>
      </div>
      <div data-configuracion-envio hidden>
        <fieldset class="boletines-correo__fieldset"><legend>Categorías</legend><div data-categorias-boletin class="boletines-correo__opciones"></div><div class="boletines-correo__acciones-seleccion"><button class="admin-boton admin-boton--secundario" type="button" data-todas-categorias>Seleccionar todas las categorías</button><button class="admin-boton admin-boton--texto" type="button" data-limpiar-categorias>Limpiar categorías</button></div></fieldset>
        <label class="gestion-contenido__campo"><span>Buscar persona</span><input class="gestion-contenido__control" type="search" data-buscar-persona placeholder="Nombre o correo"></label>
        <label class="boletines-correo__opcion"><input type="checkbox" data-seleccionar-buscados disabled><span data-etiqueta-buscados>Escriba una búsqueda para seleccionar todos sus resultados</span></label>
        <div class="boletines-correo__resultados" data-resultados-correo></div>
        <div class="boletines-correo__resumen" data-resumen-seleccion></div>
      </div>
    `;
    contenedorCampos.appendChild(bloque);
    estado.selectorFormulario = bloque;
    renderizarCategoriasSelectorBoletin();
    renderizarResumenSeleccion();
    buscarPersonasSeleccion("");

    bloque.addEventListener("change", async (evento) => {
      if (evento.target.name === "enviarCorreoBoletin") {
        bloque.querySelector("[data-configuracion-envio]").hidden = evento.target.value !== "si";
        return;
      }
      if (evento.target.matches("[data-categoria-seleccion]")) {
        const id = Number(evento.target.value);
        evento.target.checked
          ? estado.seleccion.idsCategorias.add(id)
          : estado.seleccion.idsCategorias.delete(id);
        await resolverSeleccion();
      } else if (evento.target.matches("[data-persona-resultado]")) {
        const id = Number(evento.target.dataset.personaResultado);
        if (evento.target.checked) {
          estado.seleccion.idsDestinatarios.add(id);
          estado.seleccion.idsExcluidos.delete(id);
        } else {
          estado.seleccion.idsDestinatarios.delete(id);
          estado.seleccion.idsExcluidos.add(id);
        }
        await resolverSeleccion();
      } else if (evento.target.matches("[data-seleccionar-buscados]")) {
        if (!estado.criterioActual) return;
        evento.target.checked
          ? estado.seleccion.criteriosBusqueda.add(estado.criterioActual)
          : estado.seleccion.criteriosBusqueda.delete(estado.criterioActual);
        await resolverSeleccion();
      }
    });

    let temporizador;
    bloque.querySelector("[data-buscar-persona]").addEventListener("input", (evento) => {
      clearTimeout(temporizador);
      temporizador = setTimeout(() => buscarPersonasSeleccion(evento.target.value), 280);
    });
    bloque.addEventListener("click", async (evento) => {
      if (evento.target.closest("[data-todas-categorias]")) {
        estado.categorias.forEach((categoria) => estado.seleccion.idsCategorias.add(categoria.idCategoria));
        renderizarCategoriasSelectorBoletin();
        await resolverSeleccion();
      } else if (evento.target.closest("[data-limpiar-categorias]")) {
        estado.seleccion.idsCategorias.clear();
        renderizarCategoriasSelectorBoletin();
        await resolverSeleccion();
      } else if (evento.target.closest("[data-ver-seleccionados]")) {
        mostrarSeleccionados();
      } else if (evento.target.closest("[data-limpiar-seleccion]")) {
        limpiarSeleccion();
      }
    });
  }

  async function antesDeGuardar() {
    const deseaEnviar = estado.selectorFormulario
      ?.querySelector("[name='enviarCorreoBoletin']:checked")?.value === "si";
    if (!deseaEnviar) return null;
    const resuelta = await resolverSeleccion();
    if (!resuelta?.resumen?.totalUnicos) {
      throw new Error("Seleccione al menos un destinatario activo antes de guardar.");
    }
    return {
      seleccion: seleccionComoObjeto(),
      totalUnicos: resuelta.resumen.totalUnicos
    };
  }

  async function despuesDeGuardar({ elementoGuardado, planCorreo }) {
    if (!planCorreo) {
      limpiarSeleccion();
      return;
    }
    const idElementoBoletin = Number(elementoGuardado?.idElemento);
    if (!idElementoBoletin) throw new Error("El boletín se guardó, pero no fue posible identificarlo para enviar el correo.");
    const confirmar = await (global.ModalAdmin?.confirmar?.({
      tipo: "advertencia",
      titulo: "Confirmar envío del boletín",
      mensaje: `Este boletín será enviado a ${planCorreo.totalUnicos} destinatarios únicos.`,
      detalle: "Una vez procesado, el envío quedará como historial y no se podrá editar ni reenviar desde este MVP.",
      textoCancelar: "Cancelar",
      textoConfirmar: "Enviar boletín",
      cerrarAlPresionarFuera: false
    }) ?? Promise.resolve(global.confirm(`¿Enviar el boletín a ${planCorreo.totalUnicos} destinatarios?`)));
    if (!confirmar) {
      limpiarSeleccion();
      notificar("informacion", "Boletín guardado sin enviar", "Se canceló la confirmación; no se creó ningún historial de correo.");
      return;
    }
    notificar("informacion", "Envío en proceso", "Se intentará entregar el correo a cada destinatario sin detener el lote por un fallo individual.");
    const respuesta = await api.post("/boletines/correo/envios", {
      idElementoBoletin,
      seleccion: planCorreo.seleccion
    }, { tiempoEsperaMs: 180000 });
    const envio = datos(respuesta);
    await cargarHistorial(true);
    limpiarSeleccion();
    notificar(
      envio.estado === "ENVIADO" ? "exito" : "advertencia",
      "Envío procesado",
      `${envio.cantidadEnviados} enviados y ${envio.cantidadFallidos} fallidos. Estado: ${envio.estado}.`
    );
  }

  function mostrarSeleccionados() {
    const lista = estado.seleccionResuelta.destinatarios || [];
    obtener("tituloModalListaCorreo").textContent = "Destinatarios seleccionados";
    obtener("descripcionModalListaCorreo").textContent = `${lista.length} correos únicos activos.`;
    obtener("cabeceraModalListaCorreo").innerHTML = "<tr><th>Nombre</th><th>Correo</th><th>Categorías</th><th>Acción</th></tr>";
    obtener("cuerpoModalListaCorreo").innerHTML = lista.map((persona) => `
      <tr><td>${escapar(persona.nombreCompleto)}</td><td>${escapar(persona.correo)}</td><td>${escapar(persona.categorias.map((categoria) => categoria.nombre).join(", "))}</td><td><button class="admin-boton admin-boton--texto" type="button" data-quitar-seleccionado="${persona.idDestinatario}">Quitar</button></td></tr>
    `).join("") || '<tr><td colspan="4">No hay destinatarios seleccionados.</td></tr>';
    abrirModal("modalListaCorreo");
  }

  function renderizarHistorial() {
    const cuerpo = obtener("cuerpoHistorialCorreo");
    if (!cuerpo) return;
    cuerpo.innerHTML = estado.historial.map((envio) => `
      <tr><td><strong>${escapar(envio.tituloBoletin || envio.asunto)}</strong></td><td>${formatearFecha(envio.fechaEnvio || envio.fechaCreacion)}</td><td>${envio.cantidadDestinatarios}</td><td>${envio.cantidadEnviados}</td><td>${envio.cantidadFallidos}</td><td><span class="admin-etiqueta">${escapar(envio.estado)}</span></td><td><button class="admin-boton admin-boton--secundario admin-boton--pequeno" type="button" data-ver-envio="${envio.idEnvio}">Ver</button></td></tr>
    `).join("");
    obtener("vacioHistorialCorreo").hidden = estado.historial.length > 0;
  }

  async function cargarHistorial(forzar = false) {
    if (estado.historialPromesa && !forzar) return estado.historialPromesa;
    estado.historialPromesa = api.get("/boletines/correo/envios?pagina=1&limite=100")
      .then((respuesta) => {
        estado.historial = datos(respuesta).envios || [];
        renderizarHistorial();
        return estado.historial;
      })
      .finally(() => { estado.historialPromesa = null; });
    return estado.historialPromesa;
  }

  async function verDetalleEnvio(idEnvio) {
    try {
      const respuesta = await api.get(`/boletines/correo/envios/${idEnvio}`);
      const envio = datos(respuesta);
      obtener("tituloModalListaCorreo").textContent = envio.tituloBoletin || "Detalle del envío";
      obtener("descripcionModalListaCorreo").textContent = `${formatearFecha(envio.fechaEnvio || envio.fechaCreacion)} · ${envio.cantidadEnviados} enviados · ${envio.cantidadFallidos} fallidos`;
      obtener("cabeceraModalListaCorreo").innerHTML = "<tr><th>Nombre</th><th>Correo</th><th>Estado</th><th>Fecha</th><th>Error</th></tr>";
      obtener("cuerpoModalListaCorreo").innerHTML = envio.destinatarios.map((persona) => `
        <tr><td>${escapar(persona.nombreCompleto)}</td><td>${escapar(persona.correo)}</td><td>${escapar(persona.estado)}</td><td>${formatearFecha(persona.fechaEnvio)}</td><td>${escapar(persona.mensajeError || "—")}</td></tr>
      `).join("");
      abrirModal("modalListaCorreo");
    } catch (error) {
      mostrarError(error, "No fue posible cargar el detalle del envío");
    }
  }

  async function decorarTarjetas({ contenedor, elementos }) {
    try {
      await cargarHistorial();
      const porElemento = new Map(estado.historial.map((envio) => [envio.idElementoBoletin, envio]));
      elementos.forEach((elemento, indice) => {
        const envio = porElemento.get(Number(elemento.idElemento));
        if (!envio) return;
        const formulario = contenedor.children[indice]?.querySelector("form[data-id-elemento]");
        if (!formulario || formulario.querySelector("[data-correo-historial]")) return;
        const resumen = document.createElement("div");
        resumen.className = "boletines-correo__historial-tarjeta";
        resumen.dataset.correoHistorial = "";
        resumen.innerHTML = `<strong>Correo enviado</strong><span>${formatearFecha(envio.fechaEnvio || envio.fechaCreacion)} · ${envio.cantidadDestinatarios} destinatarios · ${envio.cantidadEnviados} enviados · ${envio.cantidadFallidos} fallidos · ${escapar(envio.estado)}</span><button class="admin-boton admin-boton--texto" type="button" data-ver-envio="${envio.idEnvio}">Ver detalle del envío</button>`;
        formulario.querySelector(".gestion-contenido__cuadricula")?.appendChild(resumen);
      });
    } catch (error) {
      console.error("No fue posible decorar el historial de las tarjetas.", error);
    }
  }

  function cambiarPestana(historial) {
    obtener("panelDirectorioCorreo").hidden = historial;
    obtener("panelHistorialCorreo").hidden = !historial;
    const botonDirectorio = obtener("pestanaDirectorioCorreo");
    const botonHistorial = obtener("pestanaHistorialCorreo");
    botonDirectorio.setAttribute("aria-selected", String(!historial));
    botonHistorial.setAttribute("aria-selected", String(historial));
    botonDirectorio.className = `admin-boton ${historial ? "admin-boton--secundario" : "admin-boton--primario"}`;
    botonHistorial.className = `admin-boton ${historial ? "admin-boton--primario" : "admin-boton--secundario"}`;
  }

  function vincularEventos() {
    obtener("pestanaDirectorioCorreo").addEventListener("click", () => cambiarPestana(false));
    obtener("pestanaHistorialCorreo").addEventListener("click", () => cambiarPestana(true));
    obtener("botonNuevoDestinatarioCorreo").addEventListener("click", () => abrirFormularioDestinatario());
    obtener("formularioDestinatarioCorreo").addEventListener("submit", guardarDestinatario);
    ["cerrarModalDestinatarioCorreo", "cancelarModalDestinatarioCorreo"].forEach((id) =>
      obtener(id).addEventListener("click", () => cerrarModal("modalDestinatarioCorreo")));
    ["cerrarModalListaCorreo", "aceptarModalListaCorreo"].forEach((id) =>
      obtener(id).addEventListener("click", () => cerrarModal("modalListaCorreo")));

    let temporizador;
    obtener("buscarDestinatarioCorreo").addEventListener("input", (evento) => {
      clearTimeout(temporizador);
      temporizador = setTimeout(async () => {
        estado.filtros.buscar = evento.target.value.trim();
        try { await cargarDirectorio(1); } catch (error) { mostrarError(error); }
      }, 280);
    });
    obtener("filtroCategoriaCorreo").addEventListener("change", async (evento) => {
      estado.filtros.idCategoria = evento.target.value;
      try { await cargarDirectorio(1); } catch (error) { mostrarError(error); }
    });
    obtener("filtroEstadoCorreo").addEventListener("change", async (evento) => {
      estado.filtros.activo = evento.target.value;
      try { await cargarDirectorio(1); } catch (error) { mostrarError(error); }
    });
    obtener("anteriorDestinatariosCorreo").addEventListener("click", () => cargarDirectorio(estado.paginacion.pagina - 1).catch(mostrarError));
    obtener("siguienteDestinatariosCorreo").addEventListener("click", () => cargarDirectorio(estado.paginacion.pagina + 1).catch(mostrarError));

    obtener("gestionCorreosBoletines").addEventListener("change", async (evento) => {
      const id = Number(evento.target.dataset.seleccionarPersona);
      if (!id) return;
      evento.target.checked
        ? (estado.seleccion.idsDestinatarios.add(id), estado.seleccion.idsExcluidos.delete(id))
        : (estado.seleccion.idsDestinatarios.delete(id), estado.seleccion.idsExcluidos.add(id));
      try { await resolverSeleccion(); } catch (error) { mostrarError(error); }
    });
    document.addEventListener("click", (evento) => {
      const editar = evento.target.closest("[data-editar-destinatario]");
      const cambiar = evento.target.closest("[data-estado-destinatario]");
      const ver = evento.target.closest("[data-ver-envio]");
      if (editar) editarDestinatario(Number(editar.dataset.editarDestinatario));
      else if (cambiar) cambiarEstadoDestinatario(Number(cambiar.dataset.estadoDestinatario), cambiar.dataset.activo === "true");
      else if (ver) verDetalleEnvio(Number(ver.dataset.verEnvio));
    });
    obtener("cuerpoModalListaCorreo").addEventListener("click", async (evento) => {
      const boton = evento.target.closest("[data-quitar-seleccionado]");
      if (!boton) return;
      const id = Number(boton.dataset.quitarSeleccionado);
      estado.seleccion.idsDestinatarios.delete(id);
      estado.seleccion.idsExcluidos.add(id);
      try {
        await resolverSeleccion();
        mostrarSeleccionados();
      } catch (error) { mostrarError(error); }
    });
  }

  async function inicializar() {
    if (!api) return;
    obtener("gestionCorreosBoletines").hidden = false;
    vincularEventos();
    try {
      await cargarCategorias();
      await Promise.all([cargarDirectorio(), cargarHistorial()]);
    } catch (error) {
      mostrarError(error, "No fue posible cargar la gestión de correos");
    }
  }

  global.BoletinesCorreoAdmin = Object.freeze({
    prepararFormularioElemento,
    antesDeGuardar,
    despuesDeGuardar,
    decorarTarjetas,
    alCancelarFormularioElemento: limpiarSeleccion
  });

  document.addEventListener("DOMContentLoaded", inicializar);
})(window);
