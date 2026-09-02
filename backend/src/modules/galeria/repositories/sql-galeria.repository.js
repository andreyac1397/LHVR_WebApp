const SqlContenidoRepository = require(
  "../../../shared/content-management/sql-contenido.repository"
);

/** Repositorio SQL del módulo Galeria; conserva las consultas comunes del CMS. */
class SqlGaleriaRepository extends SqlContenidoRepository {}

module.exports = SqlGaleriaRepository;
