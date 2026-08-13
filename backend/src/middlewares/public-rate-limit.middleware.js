function crearLimitePublico(opciones = {}) {
  const ventanaMs = Number(opciones.ventanaMs) || 15 * 60 * 1000;
  const maximo = Number(opciones.maximo) || 5;
  const codigo = opciones.codigo || "LIMITE_PUBLICO_EXCEDIDO";
  const mensaje = opciones.mensaje ||
    "Se recibieron varias solicitudes en poco tiempo. Intente nuevamente más tarde.";
  const intentosPorIp = new Map();

  return function limitarPublico(req, _res, next) {
    const ahora = Date.now();
    const clave = String(req.ip || req.socket?.remoteAddress || "desconocida");
    const intentos = (intentosPorIp.get(clave) || [])
      .filter((momento) => ahora - momento < ventanaMs);

    if (intentos.length >= maximo) {
      const error = new Error(mensaje);
      error.statusCode = 429;
      error.codigo = codigo;
      next(error);
      return;
    }

    intentos.push(ahora);
    intentosPorIp.set(clave, intentos);

    if (intentosPorIp.size > 10000) {
      for (const [ip, registros] of intentosPorIp) {
        if (!registros.some((momento) => ahora - momento < ventanaMs)) {
          intentosPorIp.delete(ip);
        }
      }
    }

    next();
  };
}

module.exports = crearLimitePublico;
