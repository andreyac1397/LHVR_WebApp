(function iniciarBibliotecaPublica(global) {
  "use strict";

  const API = String(
    global.API_PUBLICA_URL || "http://localhost:3001/api"
  ).replace(/\/+$/, "");

  const grupos = Object.freeze([
    "informacion-rapida",
    "nuestra-biblioteca",
    "historia",
    "servicios",
    "areas",
    "prestamo",
    "materiales",
    "reglamento-recursos"
  ]);

  function texto(valor) {
    return String(valor ?? "").trim();
  }

  function escapar(valor) {
    return texto(valor)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function urlSegura(valor) {
    const candidata = texto(valor);

    if (!candidata) {
      return "";
    }

    try {
      const resuelta = new URL(candidata, global.location.href);
      if (!["http:", "https:"].includes(resuelta.protocol)) {
        return "";
      }
      return candidata;
    } catch (_error) {
      return "";
    }
  }

  function urlImagenSegura(valor) {
    const segura = urlSegura(valor);
    if (!segura) {
      return "";
    }
    if (segura.startsWith("/uploads/")) {
      try {
        return `${new URL(API).origin}${segura}`;
      } catch (_error) {
        return "";
      }
    }
    return segura;
  }

  function datosElemento(elemento) {
    return elemento?.datos && typeof elemento.datos === "object"
      ? elemento.datos
      : {};
  }

  function grupoElemento(elemento) {
    const grupo = texto(datosElemento(elemento).grupo);
    return ["reglamento", "recursos-digitales", "reglamento-recursos"].includes(grupo)
      ? "reglamento-recursos"
      : grupo;
  }

  function subgrupoReglamentoRecurso(elemento) {
    const datos = datosElemento(elemento);
    const subgrupo = texto(datos.subgrupo);
    if (["encabezado", "reglamento", "recursos-digitales"].includes(subgrupo)) {
      return subgrupo;
    }
    const grupo = texto(datos.grupo);
    if (grupo === "reglamento" || grupo === "recursos-digitales") {
      return grupo;
    }
    const identificador = `${datos.etiqueta || ""} ${elemento?.titulo || ""}`
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    return identificador.includes("reglamento")
      ? "reglamento"
      : "recursos-digitales";
  }

  function descripcionElemento(elemento) {
    return texto(elemento?.descripcion || elemento?.subtitulo);
  }

  function ordenar(elementos) {
    return [...elementos].sort(
      (a, b) => Number(a?.orden ?? 0) - Number(b?.orden ?? 0)
    );
  }

  function separarContenido(valor) {
    const contenido = texto(valor);

    if (!contenido) {
      return [];
    }

    const lineas = contenido
      .split(/\r?\n+/)
      .map(texto)
      .filter(Boolean);

    if (lineas.length > 1) {
      return lineas;
    }

    const oraciones = contenido
      .split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ¿])/u)
      .map(texto)
      .filter(Boolean);

    return oraciones.length > 1 ? oraciones : [contenido];
  }

  function parrafos(valor, clase = "tarjeta__texto") {
    return texto(valor)
      .split(/\r?\n\s*\r?\n/)
      .map(texto)
      .filter(Boolean)
      .map((parrafo) =>
        `<p class="${clase}">${escapar(parrafo).replaceAll("\n", "<br>")}</p>`
      )
      .join("");
  }

  function lista(valor, clase = "lista") {
    const elementos = separarContenido(valor);
    if (!elementos.length) {
      return "";
    }

    return `<ul class="${clase}">${elementos
      .map((elemento) => `<li>${escapar(elemento)}</li>`)
      .join("")}</ul>`;
  }

  function atributosEnlace(url) {
    try {
      const resuelta = new URL(url, global.location.href);
      return resuelta.origin !== global.location.origin
        ? ' target="_blank" rel="noopener noreferrer"'
        : "";
    } catch (_error) {
      return "";
    }
  }

  function enlaceBoton(url, etiqueta, clases) {
    const segura = urlSegura(url);
    if (!segura) {
      return "";
    }

    return `<a class="${clases}" href="${escapar(segura)}"${atributosEnlace(segura)}>${escapar(etiqueta)}</a>`;
  }

  function obtenerSeccion(grupo) {
    return document.querySelector(
      `[data-biblioteca-grupo="${grupo}"]`
    );
  }

  function encabezadoSeccion(seccion, titulo) {
    const elemento = seccion?.querySelector(
      ".encabezado-seccion .titulo-seccion"
    );
    if (elemento && texto(titulo)) {
      elemento.textContent = texto(titulo);
    }
  }

  function claseEtiquetaInformacion(etiqueta, indice) {
    const normalizada = texto(etiqueta)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    const clases = [
      "etiqueta--circular",
      "etiqueta--formulario",
      "etiqueta--boletin",
      "etiqueta--reglamento"
    ];

    if (normalizada.includes("prestamo")) {
      return clases[1];
    }
    if (normalizada.includes("tecnolog")) {
      return clases[2];
    }
    if (normalizada.includes("espacio")) {
      return clases[3];
    }
    return clases[indice % clases.length];
  }

  function tarjetaSimple(elemento, opciones = {}) {
    const datos = datosElemento(elemento);
    const etiqueta = texto(datos.etiqueta);
    const etiquetaHtml = opciones.mostrarEtiqueta && etiqueta
      ? `<span class="etiqueta ${opciones.claseEtiqueta || "etiqueta--circular"}">${escapar(etiqueta)}</span>`
      : "";
    const enlace = opciones.mostrarEnlace !== false
      ? enlaceBoton(
          elemento.url,
          texto(datos.textoBoton) || opciones.textoEnlace || "Ver recurso",
          "boton boton--primario boton--pequeno"
        )
      : "";

    return `
      <article class="tarjeta">
        ${etiquetaHtml}
        <h3 class="tarjeta__titulo">${escapar(elemento.titulo)}</h3>
        <p class="tarjeta__texto">${escapar(descripcionElemento(elemento)).replaceAll("\n", "<br>")}</p>
        ${enlace ? `<div class="tarjeta__pie">${enlace}</div>` : ""}
      </article>
    `;
  }

  function renderInformacionRapida(seccion, elementos) {
    const tarjetas = ordenar(
      elementos.filter((elemento) => datosElemento(elemento).tipo !== "texto")
    );
    const cuadricula = seccion.querySelector(".cuadricula--4");

    if (!cuadricula) {
      return;
    }

    cuadricula.innerHTML = tarjetas.map((elemento, indice) => {
      const etiqueta = datosElemento(elemento).etiqueta;
      return tarjetaSimple(elemento, {
        mostrarEtiqueta: true,
        claseEtiqueta: claseEtiquetaInformacion(etiqueta, indice)
      });
    }).join("");
  }

  function renderNuestraBiblioteca(seccion, elementos) {
    const principal = elementos.find(
      (elemento) => datosElemento(elemento).tipo === "texto"
    );
    const destacado = ordenar(elementos).find(
      (elemento) => datosElemento(elemento).tipo !== "texto"
    );
    const bloqueTexto = seccion.querySelector(".bloque-texto");
    const tarjeta = seccion.querySelector(".biblioteca-destacado");

    if (bloqueTexto) {
      bloqueTexto.hidden = !principal;
      if (principal) {
        const titulo = bloqueTexto.querySelector(".titulo-seccion");
        const parrafo = bloqueTexto.querySelector(":scope > p");
        if (titulo) {
          titulo.textContent = texto(principal.titulo) || titulo.textContent;
        }
        if (parrafo) {
          parrafo.textContent = descripcionElemento(principal);
        }
      }
    }

    if (!tarjeta) {
      return;
    }

    tarjeta.hidden = !destacado;
    if (!destacado) {
      return;
    }

    const datos = datosElemento(destacado);
    const logo = tarjeta.querySelector(".biblioteca-destacado__logo");
    const imagen = logo?.querySelector("img");
    const urlImagen = urlImagenSegura(datos.imagen);
    const titulo = tarjeta.querySelector(".tarjeta__titulo");
    const descripcion = tarjeta.querySelector(".tarjeta__texto");
    const pie = tarjeta.querySelector(".tarjeta__pie");

    if (logo) {
      logo.hidden = !urlImagen;
    }
    if (imagen && urlImagen) {
      imagen.src = urlImagen;
      imagen.alt = texto(datos.altImagen) || texto(destacado.titulo) || "Logo BiblioCRA";
    }
    if (titulo) {
      titulo.textContent = texto(destacado.titulo);
    }
    if (descripcion) {
      descripcion.textContent = descripcionElemento(destacado);
    }
    if (pie) {
      pie.innerHTML = enlaceBoton(
        destacado.url,
        texto(datos.textoBoton) || "Ver Site BiblioCRA",
        "boton boton--primario boton--pequeno"
      );
      pie.hidden = !pie.innerHTML;
    }
  }

  function renderHistoria(seccion, elementos) {
    const principal = elementos.find(
      (elemento) => datosElemento(elemento).tipo === "texto"
    );
    const hitos = ordenar(
      elementos.filter((elemento) => datosElemento(elemento).tipo !== "texto")
    );
    const historia = seccion.querySelector(".biblioteca-historia");
    const lineaTiempo = seccion.querySelector(".biblioteca-linea-tiempo");

    encabezadoSeccion(seccion, principal?.titulo);
    if (historia) {
      historia.hidden = !principal;
      if (principal) {
        historia.innerHTML = parrafos(descripcionElemento(principal));
      }
    }
    if (lineaTiempo) {
      lineaTiempo.innerHTML = hitos.map((elemento) => `
        <article class="tarjeta">
          <span class="etiqueta etiqueta--circular">${escapar(datosElemento(elemento).etiqueta)}</span>
          <h3 class="tarjeta__titulo">${escapar(elemento.titulo)}</h3>
          <p class="tarjeta__texto">${escapar(descripcionElemento(elemento))}</p>
          ${elemento.url ? `<div class="tarjeta__pie">${enlaceBoton(
            elemento.url,
            texto(datosElemento(elemento).textoBoton) || "Ver más",
            "boton boton--primario boton--pequeno"
          )}</div>` : ""}
        </article>
      `).join("");
    }
  }

  function renderServicios(seccion, elementos) {
    const cuadricula = seccion.querySelector(".cuadricula--3");
    if (cuadricula) {
      cuadricula.innerHTML = ordenar(elementos)
        .filter((elemento) => datosElemento(elemento).tipo !== "texto")
        .map((elemento) => tarjetaSimple(elemento))
        .join("");
    }
  }

  function renderAreas(seccion, elementos) {
    const galeria = seccion.querySelector(".biblioteca-galeria");
    if (!galeria) {
      return;
    }

    galeria.innerHTML = ordenar(elementos)
      .filter((elemento) => datosElemento(elemento).tipo !== "texto")
      .map((elemento) => {
        const imagen = urlImagenSegura(datosElemento(elemento).imagen);
        if (!imagen) {
          return "";
        }
        const enlace = enlaceBoton(
          elemento.url,
          texto(datosElemento(elemento).textoBoton) || "Ver más",
          "boton boton--primario boton--pequeno"
        );
        return `
          <article class="biblioteca-area-card${enlace ? " biblioteca-area-card--con-enlace" : ""}">
            <figure class="galeria__item">
              <img src="${escapar(imagen)}" alt="${escapar(elemento.titulo)}" loading="lazy">
              <figcaption class="galeria__pie">${escapar(elemento.titulo)}</figcaption>
            </figure>
            ${enlace ? `<div class="biblioteca-galeria__accion">${enlace}</div>` : ""}
          </article>
        `;
      })
      .join("");
  }

  function esGuiaPrestamo(elemento) {
    const datos = datosElemento(elemento);
    const identificador = `${datos.etiqueta || ""} ${elemento.titulo || ""}`
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    return datos.principal === true || identificador.includes("guia");
  }

  function renderPrestamo(seccion, elementos) {
    const tarjetas = ordenar(
      elementos.filter((elemento) => datosElemento(elemento).tipo !== "texto")
    );
    const guia = tarjetas.find(esGuiaPrestamo) ||
      tarjetas.find((elemento) => Boolean(datosElemento(elemento).imagen)) ||
      tarjetas[0];
    const informacion = tarjetas.filter((elemento) => elemento !== guia);
    const cuadricula = seccion.querySelector(".cuadricula--2");
    const documento = seccion.querySelector(".biblioteca-documentos");

    if (cuadricula) {
      cuadricula.innerHTML = "";
      cuadricula.hidden = true;
    }

    if (!documento) {
      return;
    }

    documento.hidden = !guia;
    if (!guia) {
      return;
    }

    const datos = datosElemento(guia);
    const imagen = urlImagenSegura(datos.imagen);
    documento.innerHTML = `
      <span class="etiqueta etiqueta--formulario">${escapar(datos.etiqueta || "Guía")}</span>
      <h3 class="tarjeta__titulo">${escapar(guia.titulo)}</h3>
      <p class="tarjeta__texto">${escapar(descripcionElemento(guia))}</p>
      ${informacion.length ? `
        <div class="biblioteca-prestamo__informacion">
          ${informacion.map((elemento) => `
            <section class="biblioteca-prestamo__dato">
              <span class="etiqueta etiqueta--formulario">${escapar(datosElemento(elemento).etiqueta || "Información")}</span>
              <h4>${escapar(elemento.titulo)}</h4>
              ${lista(descripcionElemento(elemento))}
              ${enlaceBoton(
                elemento.url,
                texto(datosElemento(elemento).textoBoton) || "Ver más",
                "boton boton--secundario boton--pequeno"
              )}
            </section>
          `).join("")}
        </div>
      ` : ""}
      ${imagen ? `
        <figure class="galeria__item biblioteca-documento">
          <img src="${escapar(imagen)}" alt="${escapar(datos.altImagen || guia.titulo)}" loading="lazy">
          <figcaption class="galeria__pie">${escapar(datos.pieImagen || "Ver guía de boleta de préstamo")}</figcaption>
        </figure>
      ` : ""}
      <div class="tarjeta__pie biblioteca-formulario-accion">
        ${enlaceBoton(
          guia.url,
          texto(datos.textoBoton) || "Llenar boleta de préstamo",
          "boton boton--primario"
        )}
      </div>
    `;
    const pie = documento.querySelector(".biblioteca-formulario-accion");
    if (pie) {
      pie.hidden = !pie.querySelector("a");
    }
  }

  function renderMateriales(seccion, elementos) {
    const cuadricula = seccion.querySelector(".cuadricula--4");
    if (cuadricula) {
      cuadricula.innerHTML = ordenar(elementos)
        .filter((elemento) => datosElemento(elemento).tipo !== "texto")
        .map((elemento) => tarjetaSimple(elemento, {
          mostrarEnlace: true,
          textoEnlace: "Ver material"
        }))
        .join("");
    }
  }

  function nombreRevista(imagen, indice, datos) {
    if (texto(imagen.titulo)) {
      return texto(imagen.titulo);
    }

    const configurados = Array.isArray(datos.titulosImagenes)
      ? datos.titulosImagenes
      : [];
    if (texto(configurados[indice])) {
      return texto(configurados[indice]);
    }

    const ruta = texto(imagen.url);
    const anio = ruta.match(/(?:19|20)\d{2}/)?.[0];
    if (anio) {
      return `Revista ${anio}`;
    }
    if (/(?:^|[-_])50(?:[-_.]|$)|cincuentenario/i.test(ruta)) {
      return "Cincuentenario";
    }
    return `Revista ${indice + 1}`;
  }

  function imagenesRecurso(datos) {
    const valores = [
      datos.imagen,
      ...(Array.isArray(datos.imagenes) ? datos.imagenes : [])
    ];

    return valores.map((valor) => {
      if (valor && typeof valor === "object") {
        return {
          url: urlImagenSegura(valor.url || valor.imagen),
          titulo: texto(valor.titulo || valor.etiqueta || valor.pie)
        };
      }
      return { url: urlImagenSegura(valor), titulo: "" };
    }).filter((imagen) => imagen.url);
  }

  function botonesRecurso(elemento, datos, botonesOriginales) {
    const configurados = Array.isArray(datos.botones)
      ? datos.botones
      : Array.isArray(datos.enlaces)
        ? datos.enlaces
        : [];
    let botones = configurados.map((boton) => ({
      etiqueta: texto(boton.etiqueta || boton.titulo || boton.texto),
      url: urlSegura(boton.url || boton.enlace)
    })).filter((boton) => boton.etiqueta && boton.url);

    if (!botones.length) {
      botones = botonesOriginales.map((boton) => ({ ...boton }));
    }

    const principal = urlSegura(elemento.url);
    if (principal) {
      if (botones.length) {
        botones[0].url = principal;
      } else {
        botones.push({
          etiqueta: texto(datos.textoBoton) || "Abrir recurso",
          url: principal
        });
      }
    }

    return botones;
  }

  function renderTextoSeccion(seccion, principal, respaldo = null) {
    const contenido = principal || respaldo;
    if (!contenido) {
      return;
    }
    encabezadoSeccion(seccion, contenido.titulo);
    const descripcion = seccion.querySelector(
      ".encabezado-seccion .subtitulo-seccion"
    );
    if (descripcion) {
      descripcion.textContent = descripcionElemento(contenido);
    }
  }

  function renderReglamentoRecursos(seccion, elementos) {
    const encabezado = elementos.find(
      (elemento) =>
        subgrupoReglamentoRecurso(elemento) === "encabezado" &&
        datosElemento(elemento).tipo === "texto"
    );
    const reglamento = ordenar(
      elementos.filter((elemento) => subgrupoReglamentoRecurso(elemento) === "reglamento")
    );
    const recursos = ordenar(
      elementos.filter((elemento) => subgrupoReglamentoRecurso(elemento) === "recursos-digitales")
    );
    const textoReglamento = reglamento.find(
      (elemento) => datosElemento(elemento).tipo === "texto"
    );
    const tarjetaReglamento = reglamento.find(
      (elemento) => datosElemento(elemento).tipo !== "texto"
    );
    const textoRecursos = recursos.find(
      (elemento) => datosElemento(elemento).tipo === "texto"
    );
    const tarjetasRecursos = recursos.filter(
      (elemento) => datosElemento(elemento).tipo !== "texto"
    );
    const contenidoReglamento = tarjetaReglamento || textoReglamento;
    const contenidoRecursos = tarjetasRecursos[0] || textoRecursos;
    const tarjetaReglamentoDom = seccion.querySelector(".biblioteca-reglamento-card");
    const tarjetaRecursosDom = seccion.querySelector(".biblioteca-recursos-card");

    renderTextoSeccion(seccion, encabezado);

    if (tarjetaReglamentoDom) {
      tarjetaReglamentoDom.hidden = !contenidoReglamento;
      if (contenidoReglamento) {
        const datos = datosElemento(tarjetaReglamento || contenidoReglamento);
        const imagen = urlImagenSegura(datos.imagen);
        tarjetaReglamentoDom.innerHTML = `
          <span class="etiqueta etiqueta--reglamento">${escapar(datos.etiqueta || "Reglamento")}</span>
          <h3 class="tarjeta__titulo">${escapar(contenidoReglamento.titulo)}</h3>
          <p class="tarjeta__texto">${escapar(descripcionElemento(contenidoReglamento)).replaceAll("\n", "<br>")}</p>
          ${imagen ? `
            <figure class="galeria__item biblioteca-documento">
              <img src="${escapar(imagen)}" alt="${escapar(datos.altImagen || contenidoReglamento.titulo)}" loading="lazy">
              <figcaption class="galeria__pie">${escapar(datos.pieImagen || contenidoReglamento.titulo)}</figcaption>
            </figure>
          ` : ""}
          ${tarjetaReglamento?.url ? `<div class="tarjeta__pie">${enlaceBoton(
            tarjetaReglamento.url,
            texto(datos.textoBoton) || "Abrir reglamento",
            "boton boton--primario boton--pequeno"
          )}</div>` : ""}
        `;
      }
    }

    if (!tarjetaRecursosDom) {
      return;
    }
    tarjetaRecursosDom.hidden = !contenidoRecursos;
    if (!contenidoRecursos) {
      return;
    }

    const botonesOriginales = [...tarjetaRecursosDom.querySelectorAll(".tarjeta__pie a")]
      .map((boton) => ({ etiqueta: texto(boton.textContent), url: urlSegura(boton.getAttribute("href")) }))
      .filter((boton) => boton.etiqueta && boton.url);
    const imagenes = tarjetasRecursos.flatMap((recurso) =>
      imagenesRecurso(datosElemento(recurso))
    );
    const botones = tarjetasRecursos.flatMap((recurso, indice) =>
      botonesRecurso(
        recurso,
        datosElemento(recurso),
        indice === 0 ? botonesOriginales : []
      )
    ).filter((boton, indice, listaBotones) =>
      boton.url && listaBotones.findIndex((item) => item.url === boton.url) === indice
    );
    const datosRecursos = datosElemento(tarjetasRecursos[0] || contenidoRecursos);

    tarjetaRecursosDom.innerHTML = `
      <span class="etiqueta etiqueta--boletin">${escapar(datosRecursos.etiqueta || "Recursos")}</span>
      <h3 class="tarjeta__titulo">${escapar(contenidoRecursos.titulo)}</h3>
      <p class="tarjeta__texto">${escapar(descripcionElemento(contenidoRecursos)).replaceAll("\n", "<br>")}</p>
      ${imagenes.length ? `
        <div class="biblioteca-revistas-mini">
          ${imagenes.map((imagen, indice) => {
            const titulo = nombreRevista(imagen, indice, datosRecursos);
            return `
              <figure class="galeria__item biblioteca-revista-mini">
                <img src="${escapar(imagen.url)}" alt="${escapar(datosRecursos.altImagen || titulo)}" loading="lazy">
                <figcaption class="galeria__pie">${escapar(titulo)}</figcaption>
              </figure>
            `;
          }).join("")}
        </div>
      ` : ""}
      ${botones.length ? `
        <div class="tarjeta__pie">
          ${botones.map((boton, indice) => enlaceBoton(
            boton.url,
            boton.etiqueta,
            `boton ${indice === 0 ? "boton--primario" : "boton--secundario"} boton--pequeno`
          )).join("")}
        </div>
      ` : ""}
    `;
  }

  const renderizadores = Object.freeze({
    "informacion-rapida": renderInformacionRapida,
    "nuestra-biblioteca": renderNuestraBiblioteca,
    historia: renderHistoria,
    servicios: renderServicios,
    areas: renderAreas,
    prestamo: renderPrestamo,
    materiales: renderMateriales,
    "reglamento-recursos": renderReglamentoRecursos
  });

  function renderContenido(elementos) {
    const elementosPublicos = elementos.filter((elemento) => {
      const estado = texto(elemento?.estado).toUpperCase();
      return !estado || estado === "PUBLICADO";
    });

    grupos.forEach((grupo) => {
      const seccion = obtenerSeccion(grupo);
      if (!seccion) {
        return;
      }

      const elementosGrupo = elementosPublicos.filter(
        (elemento) => grupoElemento(elemento) === grupo
      );
      seccion.hidden = elementosGrupo.length === 0;

      if (elementosGrupo.length) {
        renderizadores[grupo](seccion, elementosGrupo);
      }
    });

    if (typeof global.activarLightboxGaleria === "function") {
      global.activarLightboxGaleria();
    }
  }

  function mostrarContenidoInicial() {
    grupos.forEach((grupo) => {
      const seccion = obtenerSeccion(grupo);
      if (seccion) {
        seccion.hidden = false;
      }
    });
  }

  function actualizarBanda(pagina) {
    const banda = document.querySelector(
      'body[data-pagina="biblioteca"] main .banda'
    );
    if (!banda) {
      return;
    }

    const visible = Boolean(pagina) &&
      pagina.estadoVisible !== false &&
      pagina.encabezadoVisible !== false;

    banda.hidden = !visible;
    if (!visible) {
      return;
    }

    const titulo = banda.querySelector("h1");
    const descripcion = titulo?.nextElementSibling;

    if (titulo && texto(pagina.titulo)) {
      titulo.textContent = texto(pagina.titulo);
    }
    if (descripcion && texto(pagina.descripcion)) {
      descripcion.textContent = texto(pagina.descripcion);
    }
  }

  async function obtenerJson(ruta) {
    const respuesta = await fetch(`${API}${ruta}`, {
      headers: { Accept: "application/json" }
    });
    if (!respuesta.ok) {
      const detalle = await respuesta.json().catch(() => null);
      const error = new Error(
        detalle?.mensaje || `Respuesta HTTP ${respuesta.status}`
      );
      error.statusCode = respuesta.status;
      error.codigo = detalle?.codigo || null;
      throw error;
    }
    return respuesta.json();
  }

  async function cargar() {
    const main = document.querySelector(
      'body[data-pagina="biblioteca"] main'
    );
    if (!main) {
      return;
    }

    const [contenido, pagina] = await Promise.allSettled([
      obtenerJson("/biblioteca/publico"),
      obtenerJson("/paginas/publicas/biblioteca")
    ]);

    if (contenido.status === "fulfilled") {
      const elementos = contenido.value?.datos?.elementos;
      if (Array.isArray(elementos)) {
        renderContenido(elementos);
      } else {
        mostrarContenidoInicial();
        console.warn(
          "Biblioteca no recibió una colección válida; se conserva el contenido inicial."
        );
      }
    } else {
      mostrarContenidoInicial();
      console.warn(
        "No fue posible cargar el contenido de Biblioteca; se conserva el contenido inicial."
      );
    }

    if (pagina.status === "fulfilled") {
      actualizarBanda(
        pagina.value?.datos?.pagina || pagina.value?.datos
      );
    } else if (
      pagina.reason?.statusCode === 404 ||
      pagina.reason?.codigo === "PAGINA_NO_DISPONIBLE"
    ) {
      actualizarBanda(null);
    } else {
      const banda = document.querySelector(
        'body[data-pagina="biblioteca"] main .banda'
      );
      if (banda) {
        banda.hidden = false;
      }
      console.warn(
        "No fue posible actualizar el encabezado de Biblioteca; se conserva el contenido inicial."
      );
    }
  }

  document.addEventListener("DOMContentLoaded", cargar, { once: true });
})(window);
