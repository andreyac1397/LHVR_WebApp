const MODULOS_CONTENIDO = Object.freeze({
  BOLETINES: "BOLETINES",
  CALENDARIO: "CALENDARIO",
  BIBLIOTECA: "BIBLIOTECA",
  DOCENTES: "DOCENTES",
  HORARIOS: "HORARIOS",
  TRAMITES: "TRAMITES",
  RECURSOS_APOYO: "RECURSOS_APOYO",
  GALERIA: "GALERIA"
});

const MODULOS_VALIDOS = new Set(
  Object.values(MODULOS_CONTENIDO)
);

function normalizarModulo(modulo) {
  const valor = String(modulo || "")
    .trim()
    .toUpperCase()
    .replace(/[-\s]+/g, "_");

  if (!MODULOS_VALIDOS.has(valor)) {
    const error = new Error(
      "El módulo de contenido indicado no es válido."
    );

    error.statusCode = 400;
    error.codigo = "MODULO_CONTENIDO_INVALIDO";

    throw error;
  }

  return valor;
}

module.exports = {
  MODULOS_CONTENIDO,
  normalizarModulo
};
