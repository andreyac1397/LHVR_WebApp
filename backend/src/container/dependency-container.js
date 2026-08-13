const SqlAutenticacionRepository = require(
  "../modules/autenticacion/repositories/sql-autenticacion.repository"
);

const SqlAuditoriaRepository = require(
  "../modules/auditoria/repositories/sql-auditoria.repository"
);

const SqlPaginaRepository = require(
  "../modules/paginas-contenido/repositories/sql-pagina.repository"
);

const SqlArchivoRepository = require(
  "../modules/archivos/repositories/sql-archivo.repository"
);

const SqlOfertaAcademicaRepository = require(
  "../modules/oferta-academica/repositories/sql-oferta-academica.repository"
);

const SqlComunidadRepository = require(
  "../modules/comunidad/repositories/sql-comunidad.repository"
);

const SqlConfiguracionRepository = require(
  "../modules/configuracion-sitio/repositories/sql-configuracion.repository"
);

const AuditoriaService = require(
  "../modules/auditoria/services/auditoria.service"
);

const VerificacionAdministradorService = require(
  "../modules/autenticacion/services/verificacion-administrador.service"
);

const AutenticacionService = require(
  "../modules/autenticacion/services/autenticacion.service"
);

const RecuperacionContrasenaService = require(
  "../modules/autenticacion/services/recuperacion-contrasena.service"
);

const PaginaService = require(
  "../modules/paginas-contenido/services/pagina.service"
);

const SeccionPaginaService = require(
  "../modules/paginas-contenido/services/seccion-pagina.service"
);

const ArchivoService = require(
  "../modules/archivos/services/archivo.service"
);

const CicloEducativoService = require(
  "../modules/oferta-academica/services/ciclo-educativo.service"
);

const MateriaService = require(
  "../modules/oferta-academica/services/materia.service"
);

const ComunidadService = require(
  "../modules/comunidad/services/comunidad.service"
);

const ConfiguracionService = require(
  "../modules/configuracion-sitio/services/configuracion.service"
);

const correoService = require(
  "../shared/services/correo.service"
);


/*
 * =============================================================
 * REPOSITORIOS
 * =============================================================
 */

const repositorioAutenticacion =
  new SqlAutenticacionRepository();

const repositorioAuditoria =
  new SqlAuditoriaRepository();

const repositorioPagina =
  new SqlPaginaRepository();

const repositorioArchivo =
  new SqlArchivoRepository();

const repositorioOfertaAcademica =
  new SqlOfertaAcademicaRepository();

const repositorioComunidad =
  new SqlComunidadRepository();

const repositorioConfiguracion =
  new SqlConfiguracionRepository();


/*
 * =============================================================
 * SERVICIO DE AUDITORÍA
 * =============================================================
 */

const auditoriaService =
  new AuditoriaService(
    repositorioAuditoria
  );


/*
 * Mantiene el contexto interno de correoService
 * cuando se envía como función a otro servicio.
 */
const enviarCodigo =
  correoService.enviarCodigoVerificacion.bind(
    correoService
  );


/*
 * =============================================================
 * SERVICIOS DE AUTENTICACIÓN
 * =============================================================
 */

const servicioVerificacion =
  new VerificacionAdministradorService(
    repositorioAutenticacion,
    auditoriaService
  );

const autenticacionService =
  new AutenticacionService(
    repositorioAutenticacion,
    servicioVerificacion,
    enviarCodigo,
    auditoriaService
  );

const recuperacionContrasenaService =
  new RecuperacionContrasenaService(
    repositorioAutenticacion,
    enviarCodigo,
    auditoriaService
  );


/*
 * =============================================================
 * SERVICIOS DE PÁGINAS Y CONTENIDO
 * =============================================================
 */

const paginaService =
  new PaginaService(
    repositorioPagina
  );

const seccionPaginaService =
  new SeccionPaginaService(
    repositorioPagina,
    auditoriaService
  );


/*
 * =============================================================
 * SERVICIOS DE ARCHIVOS
 * =============================================================
 */

const archivoService =
  new ArchivoService(
    repositorioArchivo,
    auditoriaService
  );


/*
 * =============================================================
 * SERVICIOS DE OFERTA ACADÉMICA
 * =============================================================
 */

const cicloEducativoService =
  new CicloEducativoService(
    repositorioOfertaAcademica
  );

const materiaService =
  new MateriaService(
    repositorioOfertaAcademica
  );


/*
 * =============================================================
 * SERVICIOS DE COMUNIDAD
 * =============================================================
 */

const comunidadService =
  new ComunidadService(
    repositorioComunidad
  );


/*
 * =============================================================
 * SERVICIOS DE CONFIGURACIÓN DEL SITIO
 * =============================================================
 */

const configuracionService =
  new ConfiguracionService(
    repositorioConfiguracion
  );


/*
 * =============================================================
 * EXPORTACIONES
 * =============================================================
 */

module.exports = {
  repositorioAutenticacion,
  repositorioAuditoria,
  repositorioPagina,
  repositorioArchivo,
  repositorioOfertaAcademica,
  repositorioComunidad,
  repositorioConfiguracion,
  auditoriaService,
  servicioVerificacion,
  autenticacionService,
  recuperacionContrasenaService,
  paginaService,
  seccionPaginaService,
  archivoService,
  cicloEducativoService,
  materiaService,
  comunidadService,
  configuracionService,
  enviarCodigo
};