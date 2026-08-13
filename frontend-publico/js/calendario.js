/* ============================================================
   CALENDARIO.JS - Liceo Hernán Vargas Ramírez
   ------------------------------------------------------------
   Calendario institucional moderno.
   Carga eventos desde data/calendario.json y muestra:
   1. Vista mensual compacta.
   2. Filtros por categoría.
   3. Selección de día.
   4. Panel de eventos del día.
   5. Detalle desplegable por evento.
   ------------------------------------------------------------
   Nota:
   Ya no se muestran barras continuas dentro del calendario,
   porque cuando hay muchos eventos el calendario crece demasiado.
   ============================================================ */

/* ===== ESTADO GENERAL DEL CALENDARIO ===== */

const estadoCalendario = {
  eventos: [],
  fechaVista: new Date(),
  fechaSeleccionada: new Date(),
  filtroActivo: "todos",
};

const MESES_CALENDARIO = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const CATEGORIAS_CALENDARIO = [
  "Periodos Lectivos",
  "Periodo de Matrícula",
  "Pruebas de Educación Formal",
  "Pruebas de Ampliación",
  "Participación Estudiantil",
  "Efemérides y otras celebraciones",
  "Administrativo y docente",
  "Orientación Educativa",
  "Educación Abierta",
];

/* ===== HELPERS GENERALES ===== */

function rutaBaseCalendario() {
  return window.location.pathname.includes("/pages/") ? "../" : "";
}

async function cargarJSONCalendario(rutaRelativa) {
  const respuesta = await fetch(rutaBaseCalendario() + rutaRelativa);
  if (!respuesta.ok) throw new Error("No se pudo cargar " + rutaRelativa);
  return respuesta.json();
}

function crearFechaLocal(iso) {
  const [anio, mes, dia] = iso.split("-").map(Number);
  return new Date(anio, mes - 1, dia);
}

function limpiarHora(fecha) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

function fechaAISO(fecha) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

function sumarDias(fecha, dias) {
  const nueva = new Date(fecha);
  nueva.setDate(nueva.getDate() + dias);
  return limpiarHora(nueva);
}

function compararFechas(a, b) {
  const fechaA = limpiarHora(a).getTime();
  const fechaB = limpiarHora(b).getTime();

  if (fechaA < fechaB) return -1;
  if (fechaA > fechaB) return 1;
  return 0;
}

function escaparHTML(texto) {
  return String(texto || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function recortarTexto(texto, limite = 75) {
  const limpio = String(texto || "").trim();
  if (limpio.length <= limite) return limpio;
  return limpio.slice(0, limite).trim() + "...";
}

function formatearFechaCalendario(fecha) {
  const dia = fecha.getDate();
  const mes = MESES_CALENDARIO[fecha.getMonth()];
  const anio = fecha.getFullYear();
  return `${dia} de ${mes} de ${anio}`;
}

function formatearRangoEvento(evento) {
  const inicio = formatearFechaCalendario(evento._inicio);
  const fin = formatearFechaCalendario(evento._fin);

  if (fechaAISO(evento._inicio) === fechaAISO(evento._fin)) {
    return inicio;
  }

  return `${inicio} al ${fin}`;
}

function obtenerClaseCategoria(categoria) {
  const nombre = String(categoria || "").toLowerCase();

  if (nombre.includes("periodos lectivos")) return "periodos";
  if (nombre.includes("matrícula") || nombre.includes("matricula")) return "matricula";
  if (nombre.includes("pruebas")) return "pruebas";
  if (nombre.includes("participación") || nombre.includes("participacion")) return "participacion";
  if (nombre.includes("efemérides") || nombre.includes("efemerides")) return "efemerides";
  if (nombre.includes("administrativo")) return "administrativo";
  if (nombre.includes("orientación") || nombre.includes("orientacion")) return "orientacion";
  if (nombre.includes("educación abierta") || nombre.includes("educacion abierta")) return "abierta";

  return "general";
}

function eventoCoincideConFiltro(evento) {
  return estadoCalendario.filtroActivo === "todos" ||
    evento.nombreCategoria === estadoCalendario.filtroActivo;
}

function eventoIncluyeFecha(evento, fecha) {
  const dia = limpiarHora(fecha);
  return compararFechas(dia, evento._inicio) >= 0 &&
    compararFechas(dia, evento._fin) <= 0;
}

function esURLValida(valor) {
  const texto = String(valor || "").trim();
  return texto.startsWith("http://") || texto.startsWith("https://");
}

function esCorreo(valor) {
  const texto = String(valor || "").trim();
  return texto.includes("@") && !texto.includes(" ");
}

function obtenerTextoCantidadEventos(cantidad) {
  return cantidad === 1 ? "1 evento" : `${cantidad} eventos`;
}

function obtenerEstadoEvento(evento, fechaSeleccionada) {
  const fechaISO = fechaAISO(fechaSeleccionada);
  const inicioISO = fechaAISO(evento._inicio);
  const finISO = fechaAISO(evento._fin);

  if (inicioISO === finISO) return "Evento de un día";
  if (fechaISO === inicioISO) return "Inicia hoy";
  if (fechaISO === finISO) return "Finaliza hoy";

  return "En curso";
}

/* ===== INICIO DEL CALENDARIO ===== */

document.addEventListener("DOMContentLoaded", () => {
  iniciarCalendarioInteractivo();
});

async function iniciarCalendarioInteractivo() {
  const grid = document.getElementById("calendarioGrid");
  const tituloMes = document.getElementById("tituloMesCalendario");

  if (!grid || !tituloMes) return;

  try {
    const datos = await cargarJSONCalendario("data/calendario.json");

    estadoCalendario.eventos = datos
      .filter((evento) => evento.fechaInicio)
      .map((evento) => {
        const inicio = crearFechaLocal(evento.fechaInicio);
        const fin = evento.fechaFin ? crearFechaLocal(evento.fechaFin) : inicio;

        return {
          ...evento,
          _inicio: inicio,
          _fin: compararFechas(fin, inicio) >= 0 ? fin : inicio,
        };
      })
      .sort((a, b) => compararFechas(a._inicio, b._inicio));

    prepararFechaInicial();
    configurarBotonesCalendario();
    configurarFiltrosCalendario();
    renderizarCalendarioCompleto();
  } catch (error) {
    grid.innerHTML = `<p class="estado">No se pudo cargar el calendario.</p>`;
    console.error(error);
  }
}

function prepararFechaInicial() {
  const hoy = limpiarHora(new Date());

  if (estadoCalendario.eventos.length === 0) {
    estadoCalendario.fechaVista = hoy;
    estadoCalendario.fechaSeleccionada = hoy;
    return;
  }

  const hayEventosEnAnioActual = estadoCalendario.eventos.some((evento) => {
    return evento._inicio.getFullYear() === hoy.getFullYear() ||
      evento._fin.getFullYear() === hoy.getFullYear();
  });

  if (hayEventosEnAnioActual) {
    estadoCalendario.fechaVista = new Date(hoy);
    estadoCalendario.fechaSeleccionada = new Date(hoy);
  } else {
    estadoCalendario.fechaVista = new Date(estadoCalendario.eventos[0]._inicio);
    estadoCalendario.fechaSeleccionada = new Date(estadoCalendario.eventos[0]._inicio);
  }
}

/* ===== BOTONES Y FILTROS ===== */

function configurarBotonesCalendario() {
  const btnHoy = document.getElementById("btnHoy");
  const btnAnterior = document.getElementById("btnMesAnterior");
  const btnSiguiente = document.getElementById("btnMesSiguiente");

  if (btnHoy) {
    btnHoy.addEventListener("click", () => {
      const hoy = limpiarHora(new Date());
      estadoCalendario.fechaVista = hoy;
      estadoCalendario.fechaSeleccionada = hoy;
      renderizarCalendarioCompleto();
    });
  }

  if (btnAnterior) {
    btnAnterior.addEventListener("click", () => {
      estadoCalendario.fechaVista.setMonth(estadoCalendario.fechaVista.getMonth() - 1);
      estadoCalendario.fechaVista = limpiarHora(estadoCalendario.fechaVista);
      renderizarCalendarioCompleto();
    });
  }

  if (btnSiguiente) {
    btnSiguiente.addEventListener("click", () => {
      estadoCalendario.fechaVista.setMonth(estadoCalendario.fechaVista.getMonth() + 1);
      estadoCalendario.fechaVista = limpiarHora(estadoCalendario.fechaVista);
      renderizarCalendarioCompleto();
    });
  }
}

function configurarFiltrosCalendario() {
  const contenedorFiltros = document.getElementById("filtrosCalendario");
  if (!contenedorFiltros) return;

  const categoriasJSON = [...new Set(
    estadoCalendario.eventos
      .map((evento) => evento.nombreCategoria)
      .filter((categoria) => String(categoria || "").trim() !== "")
  )];

  const categoriasOrdenadas = [
    ...CATEGORIAS_CALENDARIO.filter((cat) => categoriasJSON.includes(cat)),
    ...categoriasJSON.filter((cat) => !CATEGORIAS_CALENDARIO.includes(cat)),
  ];

  contenedorFiltros.innerHTML = `
    <button class="filtro activo" type="button" data-filtro="todos">Todos</button>
    ${categoriasOrdenadas.map((categoria) => `
      <button class="filtro" type="button" data-filtro="${escaparHTML(categoria)}">
        ${escaparHTML(categoria)}
      </button>
    `).join("")}
  `;

  contenedorFiltros.addEventListener("click", (e) => {
    const boton = e.target.closest(".filtro");
    if (!boton) return;

    contenedorFiltros.querySelectorAll(".filtro").forEach((btn) => {
      btn.classList.remove("activo");
    });

    boton.classList.add("activo");
    estadoCalendario.filtroActivo = boton.dataset.filtro || "todos";

    renderizarCalendarioCompleto();
  });
}

/* ===== RENDER PRINCIPAL ===== */

function renderizarCalendarioCompleto() {
  renderizarTituloMes();
  renderizarGridCalendario();
  renderizarEventosDelDia();
}

function renderizarTituloMes() {
  const tituloMes = document.getElementById("tituloMesCalendario");
  if (!tituloMes) return;

  const mes = MESES_CALENDARIO[estadoCalendario.fechaVista.getMonth()];
  const anio = estadoCalendario.fechaVista.getFullYear();

  tituloMes.textContent = `${mes.charAt(0).toUpperCase() + mes.slice(1)} ${anio}`;
}

function renderizarGridCalendario() {
  const grid = document.getElementById("calendarioGrid");
  if (!grid) return;

  const anio = estadoCalendario.fechaVista.getFullYear();
  const mes = estadoCalendario.fechaVista.getMonth();

  const primerDiaMes = new Date(anio, mes, 1);
  const posicionLunes = (primerDiaMes.getDay() + 6) % 7;
  const inicioGrid = sumarDias(primerDiaMes, -posicionLunes);

  const semanas = [];

  for (let semana = 0; semana < 6; semana++) {
    const inicioSemana = sumarDias(inicioGrid, semana * 7);

    semanas.push({
      dias: Array.from({ length: 7 }, (_, i) => sumarDias(inicioSemana, i)),
    });
  }

  grid.innerHTML = semanas
    .map((semana) => renderizarSemana(semana, mes))
    .join("");

  configurarClicksDias();
}

function renderizarSemana(semana, mesActual) {
  const diasHTML = semana.dias
    .map((dia) => renderizarDia(dia, mesActual))
    .join("");

  return `
    <div class="calendario-semana calendario-semana--compacta" style="--niveles-eventos: 0">
      ${diasHTML}
    </div>
  `;
}

function renderizarDia(fecha, mesActual) {
  const iso = fechaAISO(fecha);
  const hoyISO = fechaAISO(new Date());
  const seleccionadaISO = fechaAISO(estadoCalendario.fechaSeleccionada);

  const fueraMes = fecha.getMonth() !== mesActual;
  const esHoy = iso === hoyISO;
  const estaSeleccionada = iso === seleccionadaISO;

  const eventosDia = estadoCalendario.eventos.filter((evento) => {
    return eventoCoincideConFiltro(evento) && eventoIncluyeFecha(evento, fecha);
  });

  const clases = [
    "calendario-dia",
    fueraMes ? "calendario-dia--fuera" : "",
    esHoy ? "calendario-dia--hoy" : "",
    estaSeleccionada ? "calendario-dia--seleccionado" : "",
    eventosDia.length > 0 ? "calendario-dia--con-eventos" : "",
  ].filter(Boolean).join(" ");

  return `
    <button class="${clases}" type="button" data-fecha="${iso}">
      <span class="calendario-dia__numero">${fecha.getDate()}</span>
      ${eventosDia.length > 0 ? renderizarResumenEventosDia(eventosDia) : ""}
    </button>
  `;
}

function renderizarResumenEventosDia(eventosDia) {
  const eventosVisibles = eventosDia.slice(0, 3);
  const eventosRestantes = eventosDia.length - eventosVisibles.length;

  const puntosHTML = eventosVisibles.map((evento) => {
    const claseCategoria = obtenerClaseCategoria(evento.nombreCategoria);

    return `
      <span
        class="calendario-dia__punto calendario-dia__punto--${claseCategoria}"
        title="${escaparHTML(evento.titulo)}"
      ></span>
    `;
  }).join("");

  return `
    <span class="calendario-dia__resumen">
      <span class="calendario-dia__puntos">
        ${puntosHTML}
      </span>

      <span class="calendario-dia__conteo">
        ${escaparHTML(obtenerTextoCantidadEventos(eventosDia.length))}
      </span>

      ${eventosRestantes > 0 ? `
        <span class="calendario-dia__extra">+${eventosRestantes}</span>
      ` : ""}
    </span>
  `;
}

function configurarClicksDias() {
  document.querySelectorAll(".calendario-dia[data-fecha]").forEach((dia) => {
    dia.addEventListener("click", () => {
      estadoCalendario.fechaSeleccionada = crearFechaLocal(dia.dataset.fecha);
      renderizarCalendarioCompleto();
    });
  });
}

/* ===== PANEL DE EVENTOS DEL DÍA ===== */

function renderizarEventosDelDia() {
  const titulo = document.getElementById("tituloDiaSeleccionado");
  const contenedor = document.getElementById("eventosDiaSeleccionado");

  if (!titulo || !contenedor) return;

  const fecha = limpiarHora(estadoCalendario.fechaSeleccionada);

  const eventosDia = estadoCalendario.eventos
    .filter((evento) => eventoCoincideConFiltro(evento))
    .filter((evento) => eventoIncluyeFecha(evento, fecha))
    .sort((a, b) => {
      const destacadoA = a.destacado === "1" ? 1 : 0;
      const destacadoB = b.destacado === "1" ? 1 : 0;

      if (destacadoA !== destacadoB) return destacadoB - destacadoA;

      const porFecha = compararFechas(a._inicio, b._inicio);
      if (porFecha !== 0) return porFecha;

      return String(a.titulo || "").localeCompare(String(b.titulo || ""), "es");
    });

  titulo.textContent = `${formatearFechaCalendario(fecha)} · ${obtenerTextoCantidadEventos(eventosDia.length)}`;

  if (eventosDia.length === 0) {
    contenedor.innerHTML = `
      <p class="estado">No hay eventos programados para esta fecha con el filtro seleccionado.</p>
    `;
    return;
  }

  contenedor.innerHTML = eventosDia
    .map((evento) => renderizarTarjetaEvento(evento, fecha))
    .join("");

  configurarBotonesDetalleEventos();
}

function renderizarTarjetaEvento(evento, fechaSeleccionada) {
  const claseCategoria = obtenerClaseCategoria(evento.nombreCategoria);

  const subcategorias = Array.isArray(evento.subcategorias)
    ? evento.subcategorias.filter((sub) => String(sub || "").trim() !== "")
    : [];

  const linksHTML = renderizarLinksEvento(evento);

  const tieneDetalle = Boolean(
    String(evento.descripcion || "").trim() ||
    subcategorias.length > 0 ||
    linksHTML.trim()
  );

  const estado = obtenerEstadoEvento(evento, fechaSeleccionada);

  return `
    <article class="evento-detalle evento-detalle--${claseCategoria}">
      <div class="evento-detalle__superior">
        <span class="evento-categoria">${escaparHTML(evento.nombreCategoria || "Evento")}</span>
        ${evento.destacado === "1" ? `<span class="evento-destacado">Destacado</span>` : ""}
      </div>

      <h4>${escaparHTML(recortarTexto(evento.titulo, 95))}</h4>

      <p class="evento-fecha">
        ${escaparHTML(formatearRangoEvento(evento))}
      </p>

      <span class="evento-estado">${escaparHTML(estado)}</span>

      ${tieneDetalle ? `
        <button class="btn-ver-detalle" type="button" aria-expanded="false">
          Ver detalle
        </button>

        <div class="evento-detalle__contenido" hidden>
          ${evento.descripcion ? `
            <p class="evento-descripcion">${escaparHTML(evento.descripcion)}</p>
          ` : ""}

          ${subcategorias.length > 0 ? `
            <div class="evento-subcategorias">
              ${subcategorias.map((sub) => `<span>${escaparHTML(sub)}</span>`).join("")}
            </div>
          ` : ""}

          ${linksHTML}
        </div>
      ` : ""}
    </article>
  `;
}

function configurarBotonesDetalleEventos() {
  const contenedor = document.getElementById("eventosDiaSeleccionado");
  if (!contenedor) return;

  contenedor.querySelectorAll(".btn-ver-detalle").forEach((boton) => {
    boton.addEventListener("click", () => {
      const tarjeta = boton.closest(".evento-detalle");
      if (!tarjeta) return;

      const detalle = tarjeta.querySelector(".evento-detalle__contenido");
      if (!detalle) return;

      const estaOculto = detalle.hasAttribute("hidden");

      if (estaOculto) {
        detalle.removeAttribute("hidden");
        boton.textContent = "Ocultar detalle";
        boton.setAttribute("aria-expanded", "true");
        tarjeta.classList.add("evento-detalle--abierto");
      } else {
        detalle.setAttribute("hidden", "");
        boton.textContent = "Ver detalle";
        boton.setAttribute("aria-expanded", "false");
        tarjeta.classList.remove("evento-detalle--abierto");
      }
    });
  });
}

function renderizarLinksEvento(evento) {
  const links = [];

  if (esURLValida(evento.link)) {
    links.push(`<a href="${escaparHTML(evento.link.trim())}" target="_blank" rel="noopener">Ver enlace</a>`);
  } else if (esCorreo(evento.link)) {
    links.push(`<a href="mailto:${escaparHTML(evento.link.trim())}">Enviar correo</a>`);
  }

  if (esURLValida(evento.link2)) {
    links.push(`<a href="${escaparHTML(evento.link2.trim())}" target="_blank" rel="noopener">Ver enlace adicional</a>`);
  } else if (esCorreo(evento.link2)) {
    links.push(`<a href="mailto:${escaparHTML(evento.link2.trim())}">Enviar correo adicional</a>`);
  }

  if (links.length === 0) return "";

  return `
    <div class="evento-links">
      ${links.join("")}
    </div>
  `;
}

/* ===== FUNCIÓN EXTRA PARA LISTAS SIMPLES =====
   Se deja por compatibilidad si en otra página se quiere mostrar
   solo una lista resumida de próximos eventos.
*/

async function renderCalendario(idContenedor, opciones = {}) {
  const contenedor = document.getElementById(idContenedor);
  if (!contenedor) return;

  try {
    let actividades = await cargarJSONCalendario("data/calendario.json");
    const hoy = limpiarHora(new Date());

    actividades = actividades
      .filter((act) => act.fechaInicio)
      .map((act) => {
        const inicio = crearFechaLocal(act.fechaInicio);
        const fin = act.fechaFin ? crearFechaLocal(act.fechaFin) : inicio;

        return {
          ...act,
          _inicio: inicio,
          _fin: compararFechas(fin, inicio) >= 0 ? fin : inicio,
        };
      });

    if (opciones.soloProximas) {
      actividades = actividades.filter((act) => {
        return compararFechas(act._fin, hoy) >= 0;
      });
    }

    actividades.sort((a, b) => {
      const aEnCurso = compararFechas(a._inicio, hoy) <= 0 && compararFechas(a._fin, hoy) >= 0;
      const bEnCurso = compararFechas(b._inicio, hoy) <= 0 && compararFechas(b._fin, hoy) >= 0;

      if (aEnCurso && !bEnCurso) return -1;
      if (!aEnCurso && bEnCurso) return 1;

      if (aEnCurso && bEnCurso) {
        const porFin = compararFechas(a._fin, b._fin);
        if (porFin !== 0) return porFin;
      }

      return compararFechas(a._inicio, b._inicio);
    });

    if (opciones.limite) {
      actividades = actividades.slice(0, opciones.limite);
    }

    if (actividades.length === 0) {
      contenedor.innerHTML = `<p class="estado">No hay actividades próximas programadas.</p>`;
      return;
    }

    contenedor.innerHTML = actividades
      .map((act) => {
        const fechaInicio = act._inicio;
        const fechaFin = act._fin;

        const dia = String(fechaInicio.getDate()).padStart(2, "0");
        const mes = MESES_CALENDARIO[fechaInicio.getMonth()].slice(0, 3).toUpperCase();

        const rango = fechaAISO(fechaInicio) === fechaAISO(fechaFin)
          ? formatearFechaCalendario(fechaInicio)
          : `${formatearFechaCalendario(fechaInicio)} al ${formatearFechaCalendario(fechaFin)}`;

        return `
          <article class="actividad">
            <div class="actividad__fecha" aria-hidden="true">
              <span class="actividad__dia">${dia}</span>
              <span class="actividad__mes">${mes}</span>
            </div>

            <div class="actividad__info">
              <h3>${escaparHTML(act.titulo)}</h3>
              <p>${escaparHTML(recortarTexto(act.descripcion || "", 140))}</p>
              <span class="actividad__lugar">${escaparHTML(act.nombreCategoria || "Evento")} · ${escaparHTML(rango)}</span>
            </div>
          </article>
        `;
      })
      .join("");
  } catch (error) {
    contenedor.innerHTML = `<p class="estado">No se pudo cargar el calendario.</p>`;
    console.error(error);
  }
}