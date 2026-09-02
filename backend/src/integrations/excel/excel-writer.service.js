class ExcelWriterService {
  constructor() {
    this.tablaCrc = this.crearTablaCrc();
  }

  crearTablaCrc() {
    const tabla = [];

    for (let numero = 0; numero < 256; numero += 1) {
      let valor = numero;

      for (let bit = 0; bit < 8; bit += 1) {
        valor = (valor & 1)
          ? 0xedb88320 ^ (valor >>> 1)
          : valor >>> 1;
      }

      tabla[numero] = valor >>> 0;
    }

    return tabla;
  }

  crc32(buffer) {
    let crc = 0xffffffff;

    for (const byte of buffer) {
      crc = this.tablaCrc[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    }

    return (crc ^ 0xffffffff) >>> 0;
  }

  escaparXml(valor) {
    return String(valor ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  nombreColumna(indice) {
    let numero = indice + 1;
    let nombre = "";

    while (numero > 0) {
      const resto = (numero - 1) % 26;
      nombre = String.fromCharCode(65 + resto) + nombre;
      numero = Math.floor((numero - 1) / 26);
    }

    return nombre;
  }

  crearHoja(filas) {
    const filasXml = filas.map((fila, indiceFila) => {
      const numeroFila = indiceFila + 1;
      const celdas = fila.map((valor, indiceColumna) => {
        const referencia =
          `${this.nombreColumna(indiceColumna)}${numeroFila}`;
        const estilo = indiceFila === 0 ? ' s="1"' : "";

        return (
          `<c r="${referencia}" t="inlineStr"${estilo}>` +
          `<is><t>${this.escaparXml(valor)}</t></is>` +
          "</c>"
        );
      }).join("");

      return `<row r="${numeroFila}">${celdas}</row>`;
    }).join("");

    return (
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/' +
      'spreadsheetml/2006/main">' +
      '<sheetViews><sheetView workbookViewId="0"/></sheetViews>' +
      '<sheetFormatPr defaultRowHeight="15"/>' +
      `<sheetData>${filasXml}</sheetData>` +
      '</worksheet>'
    );
  }

  normalizarHojas(hojas) {
    if (!Array.isArray(hojas) || hojas.length === 0) {
      throw new Error(
        "Se requiere al menos una hoja para crear el Excel."
      );
    }

    const nombresUsados = new Set();

    return hojas.map((hoja, indice) => {
      if (!Array.isArray(hoja?.filas) || hoja.filas.length === 0) {
        throw new Error(
          `La hoja ${indice + 1} debe contener al menos una fila.`
        );
      }

      const base = String(hoja.nombre || `Hoja ${indice + 1}`)
        .replace(/[\\/*?:\[\]]/g, "-")
        .trim()
        .slice(0, 31) || `Hoja ${indice + 1}`;
      let nombre = base;
      let consecutivo = 2;

      while (nombresUsados.has(nombre.toLocaleLowerCase("es"))) {
        const sufijo = ` (${consecutivo})`;
        nombre = `${base.slice(0, 31 - sufijo.length)}${sufijo}`;
        consecutivo += 1;
      }

      nombresUsados.add(nombre.toLocaleLowerCase("es"));

      return {
        nombre,
        filas: hoja.filas
      };
    });
  }

  crearArchivos(hojas) {
    const tiposHojas = hojas.map((_hoja, indice) =>
      '<Override PartName="/xl/worksheets/sheet' +
      `${indice + 1}.xml" ContentType="application/` +
      'vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
    ).join("");
    const hojasLibro = hojas.map((hoja, indice) =>
      `<sheet name="${this.escaparXml(hoja.nombre)}" ` +
      `sheetId="${indice + 1}" r:id="rId${indice + 1}"/>`
    ).join("");
    const relacionesHojas = hojas.map((_hoja, indice) =>
      `<Relationship Id="rId${indice + 1}" ` +
      'Type="http://schemas.openxmlformats.org/' +
      'officeDocument/2006/relationships/worksheet" ' +
      `Target="worksheets/sheet${indice + 1}.xml"/>`
    ).join("");
    const relacionEstilos = hojas.length + 1;

    return [
      {
        nombre: "[Content_Types].xml",
        contenido:
          '<?xml version="1.0" encoding="UTF-8"?>' +
          '<Types xmlns="http://schemas.openxmlformats.org/' +
          'package/2006/content-types">' +
          '<Default Extension="rels" ContentType="application/' +
          'vnd.openxmlformats-package.relationships+xml"/>' +
          '<Default Extension="xml" ContentType="application/xml"/>' +
          '<Override PartName="/xl/workbook.xml" ContentType="application/' +
          'vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
          tiposHojas +
          '<Override PartName="/xl/styles.xml" ContentType="application/' +
          'vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
          '</Types>'
      },
      {
        nombre: "_rels/.rels",
        contenido:
          '<?xml version="1.0" encoding="UTF-8"?>' +
          '<Relationships xmlns="http://schemas.openxmlformats.org/' +
          'package/2006/relationships">' +
          '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/' +
          'officeDocument/2006/relationships/officeDocument" ' +
          'Target="xl/workbook.xml"/>' +
          '</Relationships>'
      },
      {
        nombre: "xl/workbook.xml",
        contenido:
          '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<workbook xmlns="http://schemas.openxmlformats.org/' +
          'spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/' +
          'officeDocument/2006/relationships">' +
          `<sheets>${hojasLibro}</sheets></workbook>`
      },
      {
        nombre: "xl/_rels/workbook.xml.rels",
        contenido:
          '<?xml version="1.0" encoding="UTF-8"?>' +
          '<Relationships xmlns="http://schemas.openxmlformats.org/' +
          'package/2006/relationships">' +
          relacionesHojas +
          `<Relationship Id="rId${relacionEstilos}" Type="http://schemas.openxmlformats.org/` +
          'officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
          '</Relationships>'
      },
      {
        nombre: "xl/styles.xml",
        contenido:
          '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<styleSheet xmlns="http://schemas.openxmlformats.org/' +
          'spreadsheetml/2006/main">' +
          '<fonts count="2"><font><sz val="11"/><name val="Calibri"/>' +
          '</font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
          '<fills count="1"><fill><patternFill patternType="none"/></fill></fills>' +
          '<borders count="1"><border/></borders>' +
          '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" ' +
          'borderId="0"/></cellStyleXfs>' +
          '<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" ' +
          'borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" ' +
          'borderId="0" xfId="0" applyFont="1"/></cellXfs>' +
          '</styleSheet>'
      },
      ...hojas.map((hoja, indice) => ({
        nombre: `xl/worksheets/sheet${indice + 1}.xml`,
        contenido: this.crearHoja(hoja.filas)
      }))
    ];
  }

  crearZip(archivos) {
    const partesLocales = [];
    const partesCentrales = [];
    let desplazamiento = 0;

    for (const archivo of archivos) {
      const nombre = Buffer.from(archivo.nombre, "utf8");
      const datos = Buffer.from(archivo.contenido, "utf8");
      const crc = this.crc32(datos);
      const cabeceraLocal = Buffer.alloc(30);

      cabeceraLocal.writeUInt32LE(0x04034b50, 0);
      cabeceraLocal.writeUInt16LE(20, 4);
      cabeceraLocal.writeUInt16LE(0, 6);
      cabeceraLocal.writeUInt16LE(0, 8);
      cabeceraLocal.writeUInt16LE(0, 10);
      cabeceraLocal.writeUInt16LE(0, 12);
      cabeceraLocal.writeUInt32LE(crc, 14);
      cabeceraLocal.writeUInt32LE(datos.length, 18);
      cabeceraLocal.writeUInt32LE(datos.length, 22);
      cabeceraLocal.writeUInt16LE(nombre.length, 26);
      cabeceraLocal.writeUInt16LE(0, 28);

      partesLocales.push(cabeceraLocal, nombre, datos);

      const cabeceraCentral = Buffer.alloc(46);
      cabeceraCentral.writeUInt32LE(0x02014b50, 0);
      cabeceraCentral.writeUInt16LE(20, 4);
      cabeceraCentral.writeUInt16LE(20, 6);
      cabeceraCentral.writeUInt16LE(0, 8);
      cabeceraCentral.writeUInt16LE(0, 10);
      cabeceraCentral.writeUInt16LE(0, 12);
      cabeceraCentral.writeUInt16LE(0, 14);
      cabeceraCentral.writeUInt32LE(crc, 16);
      cabeceraCentral.writeUInt32LE(datos.length, 20);
      cabeceraCentral.writeUInt32LE(datos.length, 24);
      cabeceraCentral.writeUInt16LE(nombre.length, 28);
      cabeceraCentral.writeUInt16LE(0, 30);
      cabeceraCentral.writeUInt16LE(0, 32);
      cabeceraCentral.writeUInt16LE(0, 34);
      cabeceraCentral.writeUInt16LE(0, 36);
      cabeceraCentral.writeUInt32LE(0, 38);
      cabeceraCentral.writeUInt32LE(desplazamiento, 42);

      partesCentrales.push(cabeceraCentral, nombre);
      desplazamiento += 30 + nombre.length + datos.length;
    }

    const directorioCentral = Buffer.concat(partesCentrales);
    const eocd = Buffer.alloc(22);

    eocd.writeUInt32LE(0x06054b50, 0);
    eocd.writeUInt16LE(0, 4);
    eocd.writeUInt16LE(0, 6);
    eocd.writeUInt16LE(archivos.length, 8);
    eocd.writeUInt16LE(archivos.length, 10);
    eocd.writeUInt32LE(directorioCentral.length, 12);
    eocd.writeUInt32LE(desplazamiento, 16);
    eocd.writeUInt16LE(0, 20);

    return Buffer.concat([
      ...partesLocales,
      directorioCentral,
      eocd
    ]);
  }

  crear(filas) {
    if (!Array.isArray(filas) || filas.length === 0) {
      throw new Error(
        "Se requiere al menos una fila para crear el Excel."
      );
    }

    return this.crearLibro([
      {
        nombre: "Horarios",
        filas
      }
    ]);
  }

  crearLibro(hojas) {
    const hojasNormalizadas = this.normalizarHojas(hojas);

    return this.crearZip(
      this.crearArchivos(hojasNormalizadas)
    );
  }
}

module.exports = ExcelWriterService;
