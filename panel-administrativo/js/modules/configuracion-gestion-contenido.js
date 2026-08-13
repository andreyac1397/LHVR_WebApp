(function configurarGestionContenido(global) {
  "use strict";

  function normalizarClave(valor) {
    return String(valor ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function valor(fila, ...nombres) {
    const entradas = Object.entries(fila || {});

    for (const nombre of nombres) {
      const encontrado = entradas.find(
        ([clave]) => normalizarClave(clave) === normalizarClave(nombre)
      );

      if (encontrado && String(encontrado[1] ?? "").trim() !== "") {
        return encontrado[1];
      }
    }

    return "";
  }

  const campo = (nombre, etiqueta, tipo = "text", opciones = {}) => ({
    nombre,
    etiqueta,
    tipo,
    ...opciones
  });

  const camposComunes = [
    campo("titulo", "Título", "text", { requerido: true, maxlength: 500 }),
    campo("descripcion", "Descripción", "textarea", { completo: true }),
    campo("estado", "Estado", "select", {
      opciones: ["PUBLICADO", "BORRADOR", "INACTIVO"]
    }),
    campo("orden", "Orden", "number")
  ];

  function validarCalendario(filas, contexto) {
    const errores = [];
    const claves = new Map();

    filas.forEach((fila, indice) => {
      const titulo = String(valor(fila, "titulo", "nombre") || "").trim();
      const inicio = valor(fila, "fechaInicio", "fecha_inicio", "fecha");
      const fin = valor(fila, "fechaFin", "fecha_fin");
      const id = valor(fila, "id", "claveExterna", "clave");
      const fechaInicio = inicio ? new Date(inicio) : null;
      const fechaFin = fin ? new Date(fin) : null;

      if (!titulo) {
        errores.push({ fila: indice, columna: "titulo", mensaje: "El título es obligatorio." });
      }

      if (!fechaInicio || Number.isNaN(fechaInicio.getTime())) {
        errores.push({ fila: indice, columna: "fechaInicio", mensaje: "La fecha inicial no es válida." });
      } else if (contexto.anio && fechaInicio.getUTCFullYear() !== contexto.anio) {
        errores.push({
          fila: indice,
          columna: "fechaInicio",
          mensaje: `La fecha no pertenece al año ${contexto.anio}.`
        });
      }

      if (fin && (!fechaFin || Number.isNaN(fechaFin.getTime()))) {
        errores.push({ fila: indice, columna: "fechaFin", mensaje: "La fecha final no es válida." });
      } else if (fechaInicio && fechaFin && fechaFin < fechaInicio) {
        errores.push({ fila: indice, columna: "fechaFin", mensaje: "La fecha final es anterior a la inicial." });
      }

      const clave = String(id || `${titulo}|${inicio}|${fin}`).toLocaleLowerCase("es");
      if (claves.has(clave)) {
        errores.push({
          fila: indice,
          mensaje: `Registro duplicado con la fila ${claves.get(clave) + 1}.`
        });
      } else {
        claves.set(clave, indice);
      }
    });

    return errores;
  }

  function mapearCalendario(fila, indice) {
    const subcategorias = valor(fila, "subcategorias", "subcategoría", "subcategoria");

    return {
      claveExterna: valor(fila, "id", "claveExterna", "clave") || null,
      titulo: valor(fila, "titulo", "nombre") || `Evento ${indice + 1}`,
      descripcion: valor(fila, "descripcion", "resumen") || null,
      fechaInicio: valor(fila, "fechaInicio", "fecha_inicio", "fecha") || null,
      fechaFin: valor(fila, "fechaFin", "fecha_fin") || null,
      url: valor(fila, "link", "url", "enlace") || null,
      urlSecundaria: valor(fila, "link2", "urlSecundaria") || null,
      destacado: [true, 1, "1", "true", "sí", "si"].includes(
        typeof valor(fila, "destacado") === "string"
          ? String(valor(fila, "destacado")).toLowerCase()
          : valor(fila, "destacado")
      ),
      estado: valor(fila, "estado") || "PUBLICADO",
      orden: indice,
      datos: {
        nombreCategoria: valor(fila, "nombreCategoria", "categoria") || "General",
        subcategorias: typeof subcategorias === "string"
          ? subcategorias
          : JSON.stringify(subcategorias || [])
      }
    };
  }

  function validarHorarios(filas) {
    const errores = [];

    filas.forEach((fila, indice) => {
      const requeridos = [
        ["seccion", "Sección"],
        ["lec", "Lección"],
        ["horas", "Horario"]
      ];

      requeridos.forEach(([clave, etiqueta]) => {
        if (!valor(fila, clave, etiqueta)) {
          errores.push({ fila: indice, columna: clave, mensaje: `${etiqueta} es obligatorio.` });
        }
      });

      const tieneActividad = ["lunes", "martes", "miercoles", "jueves", "viernes"]
        .some((dia) => Boolean(valor(fila, dia)));

      if (!tieneActividad) {
        errores.push({
          fila: indice,
          mensaje: "Incluya al menos una actividad entre lunes y viernes."
        });
      }
    });

    return errores;
  }

  function mapearHorario(fila, indice) {
    const seccion = valor(fila, "seccion", "sección");
    const leccion = valor(fila, "lec", "leccion", "lección", "numero_leccion");
    const horas = valor(fila, "horas", "horario", "hora");

    return {
      claveExterna: `${normalizarClave(seccion)}-${normalizarClave(leccion)}`,
      titulo: `${seccion} · Lección ${leccion}`,
      descripcion: `${horas}${valor(fila, "profesor_guia") ? ` · ${valor(fila, "profesor_guia")}` : ""}`,
      estado: "PUBLICADO",
      orden: indice,
      datos: {
        seccion,
        profesor_guia: valor(fila, "profesor_guia", "profesor guía"),
        lec: leccion,
        horas,
        lunes: valor(fila, "lunes"),
        martes: valor(fila, "martes"),
        miercoles: valor(fila, "miercoles", "miércoles"),
        jueves: valor(fila, "jueves"),
        viernes: valor(fila, "viernes")
      }
    };
  }

  const configuraciones = {
    boletines: {
      apiBase: "boletines",
      titulo: "Gestión de boletines",
      descripcion: "Cree ediciones, revise sus datos y publique la versión que verá la comunidad.",
      singular: "boletín",
      plural: "Boletines",
      campos: [
        ...camposComunes,
        campo("fechaInicio", "Fecha de publicación", "date"),
        campo("url", "Enlace o archivo", "url", { completo: true }),
        campo("edicion", "Edición", "text", { origen: "datos" })
      ],
      importacion: { habilitada: true, columnas: ["titulo", "descripcion", "fecha", "url"] }
    },
    calendario: {
      apiBase: "calendario",
      titulo: "Gestión de calendario",
      descripcion: "Edite eventos manualmente o importe JSON/CSV. La vista previa valida fechas y duplicados antes de crear una versión.",
      singular: "evento",
      plural: "Calendario",
      campos: [
        campo("titulo", "Título", "text", { requerido: true, maxlength: 500 }),
        campo("descripcion", "Descripción", "textarea", { completo: true }),
        campo("fechaInicio", "Fecha inicial", "date", { requerido: true }),
        campo("fechaFin", "Fecha final", "date"),
        campo("nombreCategoria", "Categoría", "text", { origen: "datos" }),
        campo("subcategorias", "Subcategorías", "text", {
          origen: "datos",
          ayuda: "Sepárelas con comas cuando edite manualmente."
        }),
        campo("url", "Enlace principal", "text", { completo: true }),
        campo("urlSecundaria", "Enlace secundario", "text", { completo: true }),
        campo("destacado", "Evento destacado", "checkbox"),
        campo("estado", "Estado", "select", { opciones: ["PUBLICADO", "BORRADOR", "INACTIVO"] }),
        campo("orden", "Orden", "number")
      ],
      importacion: {
        habilitada: true,
        textoBoton: "Importar JSON o CSV",
        columnas: [
          "id", "titulo", "descripcion", "link", "link2", "fechaInicio",
          "fechaFin", "nombreCategoria", "subcategorias", "destacado"
        ],
        validar: validarCalendario,
        mapear: mapearCalendario
      }
    },
    biblioteca: {
      apiBase: "biblioteca",
      titulo: "Gestión de BiblioCRA",
      descripcion: "Administre recursos y servicios publicados por la biblioteca.",
      singular: "recurso",
      plural: "Recursos BiblioCRA",
      campos: [
        ...camposComunes,
        campo("url", "Enlace del recurso", "url", { completo: true }),
        campo("tipo", "Tipo de recurso", "text", { origen: "datos" })
      ],
      importacion: { habilitada: true, columnas: ["titulo", "descripcion", "url", "tipo"] }
    },
    docentes: {
      apiBase: "docentes",
      titulo: "Gestión de docentes",
      descripcion: "Mantenga actualizado el directorio docente y publique una versión revisada.",
      singular: "docente",
      plural: "Directorio docente",
      campos: [
        campo("titulo", "Nombre completo", "text", { requerido: true }),
        campo("subtitulo", "Puesto o especialidad", "text"),
        campo("descripcion", "Información adicional", "textarea", { completo: true }),
        campo("correo", "Correo", "email", { origen: "datos" }),
        campo("departamento", "Departamento", "text", { origen: "datos" }),
        campo("url", "Fotografía", "text", { subirImagen: true, completo: true }),
        campo("estado", "Estado", "select", { opciones: ["PUBLICADO", "BORRADOR", "INACTIVO"] }),
        campo("orden", "Orden", "number")
      ],
      importacion: { habilitada: true, columnas: ["nombre", "especialidad", "correo", "departamento"] }
    },
    horarios: {
      apiBase: "horarios",
      titulo: "Gestión de horarios",
      descripcion: "Descargue la plantilla, cargue XLSX/CSV, corrija la tabla y publique solamente cuando esté revisada.",
      singular: "bloque de horario",
      plural: "Horarios",
      campos: [
        campo("titulo", "Identificación", "text", { requerido: true }),
        campo("seccion", "Sección", "text", { origen: "datos", requerido: true }),
        campo("profesor_guia", "Profesor guía", "text", { origen: "datos" }),
        campo("lec", "Lección", "text", { origen: "datos", requerido: true }),
        campo("horas", "Horario", "text", { origen: "datos", requerido: true }),
        ...["lunes", "martes", "miercoles", "jueves", "viernes"].map((dia) =>
          campo(dia, dia.charAt(0).toUpperCase() + dia.slice(1), "text", { origen: "datos" })),
        campo("estado", "Estado", "select", { opciones: ["PUBLICADO", "BORRADOR", "INACTIVO"] }),
        campo("orden", "Orden", "number")
      ],
      importacion: {
        habilitada: true,
        excel: true,
        textoBoton: "Importar Excel o CSV",
        plantillaUrl: "/horarios/plantilla.xlsx",
        columnas: [
          "seccion", "profesor_guia", "lec", "horas", "lunes", "martes",
          "miercoles", "jueves", "viernes"
        ],
        validar: validarHorarios,
        mapear: mapearHorario,
        alcances: [
          { valor: "TOTAL", etiqueta: "Horario completo" },
          { valor: "SECCIONES", etiqueta: "Secciones seleccionadas" },
          { valor: "AGREGAR", etiqueta: "Agregar filas" }
        ]
      }
    },
    tramites: {
      apiBase: "tramites",
      titulo: "Gestión de trámites",
      descripcion: "Administre requisitos, instrucciones y enlaces de los trámites institucionales.",
      singular: "trámite",
      plural: "Trámites",
      campos: [...camposComunes, campo("url", "Enlace", "url", { completo: true })],
      importacion: { habilitada: true, columnas: ["titulo", "descripcion", "url"] }
    },
    "recursos-apoyo": {
      apiBase: "recursos-apoyo",
      titulo: "Gestión de recursos de apoyo",
      descripcion: "Organice y publique enlaces, guías y recursos para estudiantes y familias.",
      singular: "recurso",
      plural: "Recursos de apoyo",
      campos: [
        ...camposComunes,
        campo("url", "Enlace", "url", { completo: true }),
        campo("categoria", "Categoría", "text", { origen: "datos" })
      ],
      importacion: { habilitada: true, columnas: ["titulo", "descripcion", "url", "categoria"] }
    },
    galeria: {
      apiBase: "galeria",
      titulo: "Gestión de galería",
      descripcion: "Suba imágenes, agregue texto alternativo, ordénelas y publique una colección revisada.",
      singular: "imagen",
      plural: "Galería",
      campos: [
        campo("titulo", "Título", "text", { requerido: true }),
        campo("descripcion", "Texto alternativo", "textarea", { completo: true, requerido: true }),
        campo("url", "Imagen", "text", { subirImagen: true, completo: true, requerido: true }),
        campo("estado", "Estado", "select", { opciones: ["PUBLICADO", "BORRADOR", "INACTIVO"] }),
        campo("orden", "Orden", "number")
      ],
      importacion: { habilitada: false }
    }
  };

  const modulo = new URLSearchParams(global.location.search).get("modulo") || "calendario";
  const configuracion = configuraciones[modulo];

  if (!configuracion) {
    global.location.replace("gestionar.html?modulo=calendario");
    return;
  }

  document.title = `${configuracion.titulo} | Panel administrativo LHVR`;
  document.body.dataset.tituloPagina = configuracion.titulo;
  global.CONFIGURACION_GESTION_CONTENIDO = Object.freeze(configuracion);
})(window);
