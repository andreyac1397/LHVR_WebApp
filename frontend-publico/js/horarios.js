/* ============================================================
   HORARIOS.JS - Liceo Hernán Vargas Ramírez
   ------------------------------------------------------------
   Lee el archivo CSV de horarios y muestra una tabla bonita
   filtrando por nivel y sección.

   Archivo usado:
   data/horarios.csv
   ============================================================ */

(() => {
  const RUTA_CSV = "data/horarios.csv";

  const DIAS = [
    { clave: "lunes", texto: "Lunes" },
    { clave: "martes", texto: "Martes" },
    { clave: "miercoles", texto: "Miércoles" },
    { clave: "jueves", texto: "Jueves" },
    { clave: "viernes", texto: "Viernes" },
  ];

  let horarios = [];
  let nivelSeleccionado = null;
  let seccionSeleccionada = null;

  /* Detecta si la página está dentro de /pages/ */
  function rutaBaseHorarios() {
    return window.location.pathname.includes("/pages/") ? "../" : "";
  }

  /* Evita errores si algún dato viene vacío */
  function limpiar(valor) {
    return String(valor ?? "").trim();
  }

  /* Evita que el contenido del CSV rompa el HTML */
  function escaparHTML(valor) {
    return limpiar(valor)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  /* Convierte encabezados del CSV a claves limpias */
  function normalizarClave(valor) {
    return limpiar(valor)
      .replace(/^\uFEFF/, "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replaceAll(" ", "_");
  }

  /* Convierte CSV a objetos JavaScript */
  function parsearCSV(texto) {
    const filas = [];
    let fila = [];
    let campo = "";
    let dentroDeComillas = false;

    for (let i = 0; i < texto.length; i++) {
      const caracter = texto[i];
      const siguiente = texto[i + 1];

      if (caracter === '"' && dentroDeComillas && siguiente === '"') {
        campo += '"';
        i++;
      } else if (caracter === '"') {
        dentroDeComillas = !dentroDeComillas;
      } else if (caracter === "," && !dentroDeComillas) {
        fila.push(campo);
        campo = "";
      } else if ((caracter === "\n" || caracter === "\r") && !dentroDeComillas) {
        if (caracter === "\r" && siguiente === "\n") i++;

        fila.push(campo);
        campo = "";

        if (fila.some((celda) => limpiar(celda) !== "")) {
          filas.push(fila);
        }

        fila = [];
      } else {
        campo += caracter;
      }
    }

    if (campo || fila.length) {
      fila.push(campo);
      if (fila.some((celda) => limpiar(celda) !== "")) {
        filas.push(fila);
      }
    }

    const encabezados = filas.shift().map(normalizarClave);

    return filas.map((valores) => {
      const objeto = {};

      encabezados.forEach((encabezado, indice) => {
        objeto[encabezado] = limpiar(valores[indice]);
      });

      objeto.nivel = detectarNivel(objeto.seccion);

      return objeto;
    });
  }

  /* Detecta el nivel según la sección */
  function detectarNivel(seccion) {
    const valor = limpiar(seccion);

    if (valor.startsWith("7-")) return "Séptimo";
    if (valor.startsWith("8-")) return "Octavo";
    if (valor.startsWith("9-")) return "Noveno";
    if (valor.startsWith("10-")) return "Décimo";
    if (valor.startsWith("11-")) return "Undécimo";

    return "Sin nivel";
  }

  function ordenarNiveles(a, b) {
    const orden = ["Séptimo", "Octavo", "Noveno", "Décimo", "Undécimo"];
    return orden.indexOf(a) - orden.indexOf(b);
  }

  function ordenarSecciones(a, b) {
    const [nivelA, grupoA] = a.split("-").map(Number);
    const [nivelB, grupoB] = b.split("-").map(Number);

    if (nivelA !== nivelB) return nivelA - nivelB;
    return grupoA - grupoB;
  }

  function obtenerNiveles() {
    return [...new Set(horarios.map((h) => h.nivel))]
      .filter((nivel) => nivel !== "Sin nivel")
      .sort(ordenarNiveles);
  }

  function obtenerSeccionesPorNivel(nivel) {
    return [...new Set(
      horarios
        .filter((h) => h.nivel === nivel)
        .map((h) => h.seccion)
    )].sort(ordenarSecciones);
  }

  async function cargarHorarios() {
    const apiBase = String(
      window.API_PUBLICA_URL || "http://127.0.0.1:3001/api"
    ).replace(/\/+$/, "");

    try {
      const respuestaApi = await fetch(`${apiBase}/horarios/publico`, {
        headers: { Accept: "application/json" }
      });

      if (!respuestaApi.ok) {
        throw new Error(`HTTP ${respuestaApi.status}`);
      }

      const contenido = await respuestaApi.json();
      const elementos = contenido?.datos?.elementos;

      if (!Array.isArray(elementos)) {
        throw new Error("La API devolvió un horario inválido.");
      }

      horarios = elementos.map((elemento) => {
        const fila = { ...(elemento.datos || {}) };
        fila.seccion = limpiar(fila.seccion);
        fila.profesor_guia = limpiar(fila.profesor_guia);
        fila.lec = limpiar(fila.lec || fila.leccion);
        fila.horas = limpiar(fila.horas || fila.horario);
        fila.nivel = detectarNivel(fila.seccion);
        return fila;
      });
    } catch (errorApi) {
      console.warn(
        "La API de horarios no está disponible; se usará el CSV local de respaldo.",
        errorApi
      );

      const respuesta = await fetch(rutaBaseHorarios() + RUTA_CSV);

      if (!respuesta.ok) {
        throw new Error("No se pudo cargar el archivo de horarios.");
      }

      const texto = await respuesta.text();
      horarios = parsearCSV(texto);
    }
  }

  function renderizarNiveles() {
    const contenedor = document.getElementById("filtrosNivelHorario");
    if (!contenedor) return;

    const niveles = obtenerNiveles();

    contenedor.innerHTML = niveles
      .map((nivel) => {
        const activo = nivel === nivelSeleccionado ? " activo" : "";

        return `
          <button class="filtro${activo}" type="button" data-nivel="${escaparHTML(nivel)}">
            ${escaparHTML(nivel)}
          </button>
        `;
      })
      .join("");

    contenedor.querySelectorAll("[data-nivel]").forEach((boton) => {
      boton.addEventListener("click", () => {
        seleccionarNivel(boton.dataset.nivel);
      });
    });
  }

  function seleccionarNivel(nivel) {
    nivelSeleccionado = nivel;
    seccionSeleccionada = null;

    renderizarNiveles();
    renderizarSecciones();

    mostrarEstado(
      `Seleccione una sección de ${nivelSeleccionado} para consultar el horario correspondiente.`
    );
  }

  function renderizarSecciones() {
    const contenedor = document.getElementById("filtrosSeccionHorario");
    if (!contenedor) return;

    if (!nivelSeleccionado) {
      contenedor.innerHTML = "";
      return;
    }

    const secciones = obtenerSeccionesPorNivel(nivelSeleccionado);

    contenedor.innerHTML = secciones
      .map((seccion) => {
        const activo = seccion === seccionSeleccionada ? " activo" : "";

        return `
          <button class="filtro${activo}" type="button" data-seccion="${escaparHTML(seccion)}">
            ${escaparHTML(seccion)}
          </button>
        `;
      })
      .join("");

    contenedor.querySelectorAll("[data-seccion]").forEach((boton) => {
      boton.addEventListener("click", () => {
        seleccionarSeccion(boton.dataset.seccion);
      });
    });
  }

  function seleccionarSeccion(seccion) {
    seccionSeleccionada = seccion;

    renderizarSecciones();
    renderizarHorario(seccionSeleccionada);
  }

  function mostrarEstado(mensaje) {
    const resultado = document.getElementById("resultadoHorario");
    if (!resultado) return;

    const texto = escaparHTML(mensaje);
    const mensajeNormalizado = limpiar(mensaje).toLowerCase();

    const esCarga = mensajeNormalizado.includes("cargando");
    const esError = mensajeNormalizado.includes("no se pudieron") || mensajeNormalizado.includes("no se encontró");
    const esVacio = mensajeNormalizado.includes("no hay horarios");

    const hayNivel = Boolean(nivelSeleccionado);
    const secciones = hayNivel ? obtenerSeccionesPorNivel(nivelSeleccionado) : [];

    let titulo = "Seleccione una sección";
    let descripcion = "Primero elija un nivel y luego seleccione la sección que desea consultar.";

    if (esCarga) {
      titulo = "Cargando horarios";
      descripcion = "Estamos preparando la información de horarios disponibles.";
    } else if (esError) {
      titulo = "No se pudo cargar la información";
      descripcion = texto;
    } else if (esVacio) {
      titulo = "No hay horarios disponibles";
      descripcion = texto;
    } else if (hayNivel) {
      titulo = `Seleccione una sección de ${escaparHTML(nivelSeleccionado)}`;
      descripcion = "Elija una de las secciones disponibles para ver el horario completo.";
    }

    const claseEstado = esError ? " horario-estado--error" : esCarga ? " horario-estado--cargando" : "";

    const seccionesHTML = secciones.length > 0
      ? `
        <div class="horario-estado__secciones">
          ${secciones.map((seccion) => `<span>${escaparHTML(seccion)}</span>`).join("")}
        </div>
      `
      : "";

    resultado.innerHTML = `
      <article class="tarjeta horario-estado${claseEstado}">
        <div class="horario-estado__icono" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="17" rx="2"></rect>
            <path d="M16 2v4"></path>
            <path d="M8 2v4"></path>
            <path d="M3 10h18"></path>
            <path d="M8 14h.01"></path>
            <path d="M12 14h.01"></path>
            <path d="M16 14h.01"></path>
            <path d="M8 18h.01"></path>
            <path d="M12 18h.01"></path>
          </svg>
        </div>

        <div class="horario-estado__contenido">
          <h3>${titulo}</h3>
          <p>${descripcion}</p>

          ${seccionesHTML}

          <div class="horario-estado__pasos">
            <span class="horario-estado__paso ${hayNivel ? "completo" : "activo"}">1. Nivel</span>
            <span class="horario-estado__separador">→</span>
            <span class="horario-estado__paso ${hayNivel ? "activo" : ""}">2. Sección</span>
            <span class="horario-estado__separador">→</span>
            <span class="horario-estado__paso">3. Horario</span>
          </div>
        </div>
      </article>
    `;
  }

  function esFilaEspecial(fila) {
    const lec = limpiar(fila.lec).toUpperCase();

    return lec.includes("RECESO") || lec.includes("ALMUERZO");
  }

  function obtenerTipoEspecial(fila) {
    const lec = limpiar(fila.lec).toUpperCase();

    if (lec.includes("ALMUERZO")) return "almuerzo";
    if (lec.includes("RECESO")) return "receso";

    return "";
  }

  function obtenerTextoEspecial(fila) {
    const valores = DIAS.map((dia) => limpiar(fila[dia.clave])).filter(Boolean);
    const valoresUnicos = [...new Set(valores)];

    if (valoresUnicos.length === 1) {
      return valoresUnicos[0];
    }

    return "";
  }

  function obtenerValorDia(fila, dia) {
    const valor = limpiar(fila[dia.clave]);
    return valor || "Libre";
  }

  function renderizarFilaTabla(fila) {
    const tipoEspecial = obtenerTipoEspecial(fila);
    const textoEspecial = obtenerTextoEspecial(fila);

    if (esFilaEspecial(fila) && textoEspecial) {
      return `
        <tr class="horario__fila horario__fila--${tipoEspecial}">
          <td>${escaparHTML(fila.lec)}</td>
          <td>${escaparHTML(fila.horas)}</td>
          <td colspan="5">${escaparHTML(textoEspecial)}</td>
        </tr>
      `;
    }

    return `
      <tr class="horario__fila">
        <td>${escaparHTML(fila.lec)}</td>
        <td>${escaparHTML(fila.horas)}</td>
        ${DIAS.map((dia) => `<td>${escaparHTML(obtenerValorDia(fila, dia))}</td>`).join("")}
      </tr>
    `;
  }

  function renderizarTarjetaMovil(fila) {
    const tipoEspecial = obtenerTipoEspecial(fila);
    const textoEspecial = obtenerTextoEspecial(fila);
    const claseEspecial = tipoEspecial ? ` horario-movil__tarjeta--${tipoEspecial}` : "";

    if (esFilaEspecial(fila) && textoEspecial) {
      return `
        <article class="horario-movil__tarjeta${claseEspecial}">
          <div class="horario-movil__encabezado">
            <div>
              <span class="horario-movil__etiqueta">${escaparHTML(fila.lec)}</span>
              <h4>${escaparHTML(textoEspecial)}</h4>
            </div>
            <span class="horario-movil__hora">${escaparHTML(fila.horas)}</span>
          </div>
        </article>
      `;
    }

    return `
      <article class="horario-movil__tarjeta${claseEspecial}">
        <div class="horario-movil__encabezado">
          <div>
            <span class="horario-movil__etiqueta">Lección ${escaparHTML(fila.lec)}</span>
            <h4>${tipoEspecial ? escaparHTML(fila.lec) : "Horario de clase"}</h4>
          </div>
          <span class="horario-movil__hora">${escaparHTML(fila.horas)}</span>
        </div>

        <div class="horario-movil__dias">
          ${DIAS.map((dia) => `
            <div class="horario-movil__dia">
              <span>${dia.texto}</span>
              <strong>${escaparHTML(obtenerValorDia(fila, dia))}</strong>
            </div>
          `).join("")}
        </div>
      </article>
    `;
  }

  function renderizarHorario(seccion) {
    const resultado = document.getElementById("resultadoHorario");
    if (!resultado) return;

    const filas = horarios.filter((h) => h.seccion === seccion);

    if (filas.length === 0) {
      mostrarEstado("No se encontró horario para la sección seleccionada.");
      return;
    }

    const profesorGuia = filas[0].profesor_guia || "No indicado";

    const filasTablaHTML = filas.map(renderizarFilaTabla).join("");
    const tarjetasMovilHTML = filas.map(renderizarTarjetaMovil).join("");

    resultado.innerHTML = `
      <article class="tarjeta horario">
        <div class="tarjeta__encabezado">
          <span class="etiqueta">${escaparHTML(nivelSeleccionado)}</span>
          <h3 class="tarjeta__titulo">Horario sección ${escaparHTML(seccion)}</h3>
          <p class="tarjeta__texto">
            <strong>Profesor guía:</strong> ${escaparHTML(profesorGuia)}
          </p>
        </div>

        <div class="horario__tabla-contenedor horario__vista-escritorio">
          <table class="horario__tabla">
            <thead>
              <tr>
                <th>Lección</th>
                <th>Hora</th>
                ${DIAS.map((dia) => `<th>${dia.texto}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${filasTablaHTML}
            </tbody>
          </table>
        </div>

        <div class="horario__vista-movil">
          ${tarjetasMovilHTML}
        </div>
      </article>
    `;
  }

  async function iniciarHorarios() {
    const existePantallaHorarios =
      document.getElementById("filtrosNivelHorario") &&
      document.getElementById("filtrosSeccionHorario") &&
      document.getElementById("resultadoHorario");

    if (!existePantallaHorarios) return;

    try {
      mostrarEstado("Cargando horarios...");

      await cargarHorarios();

      const niveles = obtenerNiveles();

      if (niveles.length === 0) {
        mostrarEstado("No hay horarios disponibles por ahora.");
        return;
      }

      nivelSeleccionado = niveles[0];

      renderizarNiveles();
      renderizarSecciones();

      mostrarEstado(
        `Seleccione una sección de ${nivelSeleccionado} para consultar el horario correspondiente.`
      );
    } catch (error) {
      mostrarEstado("No se pudieron cargar los horarios publicados.");
      console.error(error);
    }
  }

  document.addEventListener("DOMContentLoaded", iniciarHorarios);
})();
