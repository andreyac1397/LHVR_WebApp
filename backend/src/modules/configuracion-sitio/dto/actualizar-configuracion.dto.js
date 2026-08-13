/* ============================================================
   ACTUALIZAR-CONFIGURACION.DTO.JS
   Liceo Hernán Vargas Ramírez
   ------------------------------------------------------------
   DTO utilizado para representar los datos necesarios
   para actualizar una configuración existente del sitio.

   Ejemplo recibido desde el frontend:

   {
     "clave": "correo_institucional",
     "valor": "correo@institucion.ac.cr"
   }

   Responsabilidades:
   - Extraer únicamente los campos permitidos.
   - Evitar que datos adicionales enviados por el cliente
     lleguen a la capa de servicio.
   - Mantener una estructura consistente para la actualización
     de configuraciones.
   ============================================================ */


/* ============================================================
   DTO
   ============================================================ */

class ActualizarConfiguracionDto {

  /**
   * @param {object} datos
   */
  constructor(datos = {}) {

    /*
     * La clave identifica qué configuración existente
     * se desea modificar.
     *
     * Ejemplos:
     * - direccion_institucional
     * - telefonos_institucionales
     * - correo_institucional
     * - horario_atencion
     * - facebook_url
     * - google_maps_url
     */
    this.clave =
      datos.clave ?? null;


    /*
     * El valor puede ser:
     *
     * - string
     * - null
     *
     * Se permite null porque algunas configuraciones
     * pueden no estar definidas todavía.
     */
    this.valor =
      datos.valor ?? null;
  }


  /* ==========================================================
     CREACIÓN DESDE REQUEST
     ========================================================== */

  /**
   * Crea el DTO a partir del body recibido por Express.
   *
   * @param {object} body
   * @returns {ActualizarConfiguracionDto}
   */
  static desdeBody(body) {

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return new ActualizarConfiguracionDto();
    }


    return new ActualizarConfiguracionDto({
      clave:
        body.clave,

      valor:
        body.valor
    });
  }


  /* ==========================================================
     CONVERSIÓN
     ========================================================== */

  /**
   * Convierte el DTO a un objeto simple.
   *
   * @returns {object}
   */
  toObject() {
    return {
      clave:
        this.clave,

      valor:
        this.valor
    };
  }
}


/* ============================================================
   EXPORTACIÓN
   ============================================================ */

module.exports =
  ActualizarConfiguracionDto;