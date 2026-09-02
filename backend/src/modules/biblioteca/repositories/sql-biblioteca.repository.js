const SqlContenidoRepository = require(
  "../../../shared/content-management/sql-contenido.repository"
);

/** Repositorio SQL del módulo Biblioteca; conserva las consultas comunes del CMS. */
class SqlBibliotecaRepository extends SqlContenidoRepository {}

module.exports = SqlBibliotecaRepository;
