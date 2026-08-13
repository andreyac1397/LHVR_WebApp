const OfertaAcademicaRepositoryContract = require(
  "../contracts/oferta-academica.repository.contract"
);

const {
  sql,
  obtenerConexion
} = require("../../../config/database");

/*
 * Repositorio SQL del módulo Oferta académica.
 *
 * Es la única clase del módulo que se comunica
 * directamente con SQL Server.
 *
 * Utiliza los procedimientos almacenados:
 *
 * - sp_obtener_oferta_academica_administrativa
 * - sp_obtener_oferta_academica_publica
 * - sp_guardar_materia_oferta_academica
 * - sp_retirar_materia_oferta_academica
 */
class SqlOfertaAcademicaRepository
  extends OfertaAcademicaRepositoryContract {

  /**
   * Obtiene de forma segura un conjunto de resultados
   * devuelto por SQL Server.
   *
   * @param {object} resultado
   * @param {number} indice
   * @returns {Array}
   */
  obtenerRecordset(
    resultado,
    indice
  ) {
    if (
      !resultado ||
      !Array.isArray(resultado.recordsets) ||
      !Array.isArray(
        resultado.recordsets[indice]
      )
    ) {
      return [];
    }

    return resultado.recordsets[indice];
  }

  /**
   * Obtiene la primera fila de un conjunto
   * de resultados.
   *
   * @param {object} resultado
   * @param {number} indice
   * @returns {object|null}
   */
  obtenerPrimeraFila(
    resultado,
    indice = 0
  ) {
    const filas =
      this.obtenerRecordset(
        resultado,
        indice
      );

    if (filas.length === 0) {
      return null;
    }

    return filas[0];
  }

  /**
   * Convierte la lista de ciclos recibida desde
   * el servicio al JSON requerido por el SP.
   *
   * @param {Array|string|null} ciclos
   * @returns {string}
   */
  convertirCiclosJson(ciclos) {
    if (typeof ciclos === "string") {
      return ciclos;
    }

    if (!Array.isArray(ciclos)) {
      return "[]";
    }

    return JSON.stringify(ciclos);
  }

  /**
   * Obtiene toda la información necesaria para
   * administrar Oferta académica.
   *
   * Resultado:
   * - pagina
   * - secciones
   * - ciclos
   * - materias
   * - relaciones
   *
   * @returns {Promise<object>}
   */
  async obtenerOfertaAdministrativa() {
    const conexion =
      await obtenerConexion();

    const resultado =
      await conexion
        .request()
        .execute(
          "dbo.sp_obtener_oferta_academica_administrativa"
        );

    return {
      pagina:
        this.obtenerPrimeraFila(
          resultado,
          0
        ),

      secciones:
        this.obtenerRecordset(
          resultado,
          1
        ),

      ciclos:
        this.obtenerRecordset(
          resultado,
          2
        ),

      materias:
        this.obtenerRecordset(
          resultado,
          3
        ),

      relaciones:
        this.obtenerRecordset(
          resultado,
          4
        )
    };
  }

  /**
   * Obtiene únicamente el contenido que puede
   * mostrarse en la página pública.
   *
   * Resultado:
   * - secciones
   * - ciclos
   * - materias
   * - relaciones
   *
   * @returns {Promise<object>}
   */
  async obtenerOfertaPublica() {
    const conexion =
      await obtenerConexion();

    const resultado =
      await conexion
        .request()
        .execute(
          "dbo.sp_obtener_oferta_academica_publica"
        );

    return {
      secciones:
        this.obtenerRecordset(
          resultado,
          0
        ),

      ciclos:
        this.obtenerRecordset(
          resultado,
          1
        ),

      materias:
        this.obtenerRecordset(
          resultado,
          2
        ),

      relaciones:
        this.obtenerRecordset(
          resultado,
          3
        )
    };
  }

  /**
   * Crea o actualiza una materia y sincroniza
   * los ciclos educativos asociados.
   *
   * Procedimiento:
   * dbo.sp_guardar_materia_oferta_academica
   *
   * @param {object} datosMateria
   * @returns {Promise<object>}
   */
  async guardarMateria(
    datosMateria
  ) {
    const conexion =
      await obtenerConexion();

    const resultado =
      await conexion
        .request()

        .input(
          "idMateria",
          sql.Int,
          datosMateria.idMateria ?? null
        )

        .input(
          "codigo",
          sql.NVarChar(30),
          datosMateria.codigo
        )

        .input(
          "nombre",
          sql.NVarChar(150),
          datosMateria.nombre
        )

        .input(
          "descripcionPublica",
          sql.NVarChar(800),
          datosMateria.descripcionPublica ??
            null
        )

        .input(
          "urlPlanEstudio",
          sql.NVarChar(1000),
          datosMateria.urlPlanEstudio ??
            null
        )

        .input(
          "textoBoton",
          sql.NVarChar(120),
          datosMateria.textoBoton ??
            null
        )

        .input(
          "tipoEnlace",
          sql.NVarChar(20),
          datosMateria.tipoEnlace
        )

        .input(
          "orden",
          sql.Int,
          datosMateria.orden
        )

        .input(
          "mostrarOfertaAcademica",
          sql.Bit,
          datosMateria
            .mostrarOfertaAcademica ??
            true
        )

        .input(
          "activo",
          sql.Bit,
          datosMateria.activo ??
            true
        )

        .input(
          "idEstadoPublicacion",
          sql.Int,
          datosMateria
            .idEstadoPublicacion
        )

        .input(
          "idAdministrador",
          sql.Int,
          datosMateria
            .idAdministrador ??
            null
        )

        .input(
          "ciclosJson",
          sql.NVarChar(sql.MAX),
          this.convertirCiclosJson(
            datosMateria.ciclos
          )
        )

        .execute(
          "dbo.sp_guardar_materia_oferta_academica"
        );

    return {
      materia:
        this.obtenerPrimeraFila(
          resultado,
          0
        ),

      ciclos:
        this.obtenerRecordset(
          resultado,
          1
        )
    };
  }

  /**
   * Retira una materia de Oferta académica
   * sin eliminar físicamente el registro.
   *
   * Procedimiento:
   * dbo.sp_retirar_materia_oferta_academica
   *
   * @param {number} idMateria
   * @param {number|null} idAdministrador
   * @returns {Promise<object|null>}
   */
  async retirarMateria(
    idMateria,
    idAdministrador = null
  ) {
    const conexion =
      await obtenerConexion();

    const resultado =
      await conexion
        .request()

        .input(
          "idMateria",
          sql.Int,
          idMateria
        )

        .input(
          "idAdministrador",
          sql.Int,
          idAdministrador
        )

        .execute(
          "dbo.sp_retirar_materia_oferta_academica"
        );

    return this.obtenerPrimeraFila(
      resultado,
      0
    );
  }
}

module.exports =
  SqlOfertaAcademicaRepository;