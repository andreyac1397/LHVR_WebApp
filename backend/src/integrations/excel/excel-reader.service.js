const zlib = require("node:zlib");

/**
 * Lector pequeño y sin dependencias para archivos XLSX.
 *
 * XLSX es un contenedor ZIP con documentos XML. El servicio acepta los dos
 * tipos de celdas que generan Excel y LibreOffice (shared strings e inline
 * strings), además de los archivos creados por excel-writer.service.js.
 */
class ExcelReaderService {
  crearError(mensaje, codigo = "ARCHIVO_EXCEL_INVALIDO") {
    const error = new Error(mensaje);
    error.statusCode = 400;
    error.codigo = codigo;
    return error;
  }

  decodificarXml(valor) {
    return String(valor ?? "")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&#(\d+);/g, (_coincidencia, numero) =>
        String.fromCodePoint(Number(numero)))
      .replace(/&#x([\da-f]+);/gi, (_coincidencia, numero) =>
        String.fromCodePoint(Number.parseInt(numero, 16)))
      .replace(/&amp;/g, "&");
  }

  normalizarEncabezado(valor, indice) {
    const encabezado = String(valor ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

    const aliasHorarios = {
      leccion: "lec",
      numero_leccion: "lec",
      horario: "horas",
      hora: "horas"
    };

    return aliasHorarios[encabezado] ||
      encabezado ||
      `columna_${indice + 1}`;
  }

  indiceColumna(referencia) {
    const letras = String(referencia || "").match(/^[A-Z]+/i)?.[0] || "A";
    let indice = 0;

    for (const letra of letras.toUpperCase()) {
      indice = (indice * 26) + letra.charCodeAt(0) - 64;
    }

    return indice - 1;
  }

  extraerArchivosZip(buffer) {
    if (!Buffer.isBuffer(buffer) || buffer.length < 30) {
      throw this.crearError("El archivo XLSX está vacío o dañado.");
    }

    const archivos = new Map();
    let posicion = 0;

    while (posicion + 30 <= buffer.length) {
      const firma = buffer.readUInt32LE(posicion);

      if (firma !== 0x04034b50) {
        break;
      }

      const bandera = buffer.readUInt16LE(posicion + 6);
      const metodo = buffer.readUInt16LE(posicion + 8);
      const tamanoComprimido = buffer.readUInt32LE(posicion + 18);
      const longitudNombre = buffer.readUInt16LE(posicion + 26);
      const longitudExtra = buffer.readUInt16LE(posicion + 28);
      const inicioNombre = posicion + 30;
      const finNombre = inicioNombre + longitudNombre;
      const inicioDatos = finNombre + longitudExtra;

      if ((bandera & 0x08) !== 0) {
        throw this.crearError(
          "El XLSX utiliza un formato ZIP no compatible. Guárdelo nuevamente desde Excel."
        );
      }

      const finDatos = inicioDatos + tamanoComprimido;

      if (finDatos > buffer.length) {
        throw this.crearError("El archivo XLSX está incompleto.");
      }

      const nombre = buffer.subarray(inicioNombre, finNombre).toString("utf8");
      const comprimido = buffer.subarray(inicioDatos, finDatos);
      let contenido;

      if (metodo === 0) {
        contenido = comprimido;
      } else if (metodo === 8) {
        contenido = zlib.inflateRawSync(comprimido);
      } else {
        throw this.crearError(
          "El método de compresión del XLSX no es compatible."
        );
      }

      archivos.set(nombre.replace(/\\/g, "/"), contenido);
      posicion = finDatos;
    }

    if (archivos.size === 0) {
      throw this.crearError("El archivo no tiene la estructura de un XLSX válido.");
    }

    return archivos;
  }

  leerTextosCompartidos(archivos) {
    const contenido = archivos.get("xl/sharedStrings.xml");

    if (!contenido) {
      return [];
    }

    return Array.from(
      contenido.toString("utf8").matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/gi)
    ).map((coincidencia) => {
      const partes = Array.from(
        coincidencia[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/gi)
      ).map((parte) => this.decodificarXml(parte[1]));

      return partes.join("");
    });
  }

  leerValorCelda(xmlCelda, tipo, compartidos) {
    if (tipo === "inlineStr") {
      return Array.from(xmlCelda.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/gi))
        .map((parte) => this.decodificarXml(parte[1]))
        .join("");
    }

    const valor = xmlCelda.match(/<v\b[^>]*>([\s\S]*?)<\/v>/i)?.[1] ?? "";

    if (tipo === "s") {
      return compartidos[Number(valor)] ?? "";
    }

    if (tipo === "b") {
      return valor === "1" ? "Sí" : "No";
    }

    return this.decodificarXml(valor);
  }

  leer(buffer) {
    const archivos = this.extraerArchivosZip(buffer);
    const hoja = archivos.get("xl/worksheets/sheet1.xml");

    if (!hoja) {
      throw this.crearError("No se encontró la primera hoja del archivo XLSX.");
    }

    const compartidos = this.leerTextosCompartidos(archivos);
    const filas = [];
    const xmlHoja = hoja.toString("utf8");

    for (const coincidenciaFila of xmlHoja.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/gi)) {
      const celdas = [];

      for (const coincidenciaCelda of coincidenciaFila[1]
        .matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/gi)) {
        const atributos = coincidenciaCelda[1];
        const referencia = atributos.match(/\br="([^"]+)"/i)?.[1];
        const tipo = atributos.match(/\bt="([^"]+)"/i)?.[1] || "n";
        const indice = this.indiceColumna(referencia);
        celdas[indice] = this.leerValorCelda(
          coincidenciaCelda[2],
          tipo,
          compartidos
        ).trim();
      }

      filas.push(celdas);
    }

    if (filas.length < 2) {
      throw this.crearError(
        "El archivo debe contener encabezados y al menos una fila de información.",
        "ARCHIVO_EXCEL_VACIO"
      );
    }

    const ancho = Math.max(...filas.map((fila) => fila.length));
    const encabezados = Array.from({ length: ancho }, (_valor, indice) =>
      this.normalizarEncabezado(filas[0][indice], indice));
    const nombres = new Set();

    for (const encabezado of encabezados) {
      if (nombres.has(encabezado)) {
        throw this.crearError(
          `El encabezado “${encabezado}” está repetido.`,
          "ENCABEZADO_EXCEL_REPETIDO"
        );
      }
      nombres.add(encabezado);
    }

    const datos = filas.slice(1)
      .filter((fila) => fila.some((valor) => String(valor ?? "").trim()))
      .map((fila) => Object.fromEntries(
        encabezados.map((encabezado, indice) => [
          encabezado,
          String(fila[indice] ?? "").trim()
        ])
      ));

    if (datos.length === 0) {
      throw this.crearError(
        "El archivo no contiene filas con información.",
        "ARCHIVO_EXCEL_VACIO"
      );
    }

    return {
      encabezados,
      columnas: encabezados,
      filas: datos
    };
  }
}

module.exports = ExcelReaderService;
