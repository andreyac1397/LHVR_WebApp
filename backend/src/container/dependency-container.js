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

const SqlContenidoRepository = require(
  "../shared/content-management/sql-contenido.repository"
);

const SqlContactoRepository = require(
  "../modules/contacto/repositories/sql-contacto.repository"
);

const SqlSolicitudBibliocraRepository = require(
  "../modules/biblioteca/repositories/sql-solicitud-bibliocra.repository"
);

const SqlDashboardRepository = require(
  "../modules/dashboard/repositories/sql-dashboard.repository"
);

const SqlAdministradorRepository = require(
  "../modules/administradores/repositories/sql-administrador.repository"
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

const ContenidoService = require(
  "../shared/content-management/contenido.service"
);

const CalendarioService = require(
  "../modules/calendario/services/calendario.service"
);

const HorarioService = require(
  "../modules/horarios/services/horario.service"
);

const ContactoService = require(
  "../modules/contacto/services/contacto.service"
);

const SolicitudBibliocraService = require(
  "../modules/biblioteca/services/solicitud-bibliocra.service"
);

const DashboardService = require(
  "../modules/dashboard/services/dashboard.service"
);

const AdministradorService = require(
  "../modules/administradores/services/administrador.service"
);

const {
  MODULOS_CONTENIDO
} = require(
  "../shared/content-management/contenido-modulos"
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

const repositorioContenido =
  new SqlContenidoRepository();

const repositorioContacto =
  new SqlContactoRepository();

const repositorioSolicitudBibliocra =
  new SqlSolicitudBibliocraRepository();

const repositorioDashboard =
  new SqlDashboardRepository();

const repositorioAdministrador =
  new SqlAdministradorRepository();


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
 * CONTENIDO VERSIONADO REUTILIZABLE
 * =============================================================
 */

const contenidoServices = {
  boletines: new ContenidoService(
    MODULOS_CONTENIDO.BOLETINES,
    repositorioContenido,
    auditoriaService
  ),
  calendario: new CalendarioService(
    repositorioContenido,
    auditoriaService
  ),
  biblioteca: new ContenidoService(
    MODULOS_CONTENIDO.BIBLIOTECA,
    repositorioContenido,
    auditoriaService
  ),
  docentes: new ContenidoService(
    MODULOS_CONTENIDO.DOCENTES,
    repositorioContenido,
    auditoriaService
  ),
  horarios: new HorarioService(
    repositorioContenido,
    auditoriaService
  ),
  tramites: new ContenidoService(
    MODULOS_CONTENIDO.TRAMITES,
    repositorioContenido,
    auditoriaService
  ),
  "recursos-apoyo": new ContenidoService(
    MODULOS_CONTENIDO.RECURSOS_APOYO,
    repositorioContenido,
    auditoriaService
  ),
  galeria: new ContenidoService(
    MODULOS_CONTENIDO.GALERIA,
    repositorioContenido,
    auditoriaService
  )
};

const contactoService = new ContactoService(
  repositorioContacto,
  auditoriaService
);

const solicitudBibliocraService = new SolicitudBibliocraService(
  repositorioSolicitudBibliocra,
  auditoriaService
);

const dashboardService = new DashboardService(
  repositorioDashboard
);

const administradorService = new AdministradorService(
  repositorioAdministrador,
  auditoriaService
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
  repositorioContenido,
  repositorioContacto,
  repositorioSolicitudBibliocra,
  repositorioDashboard,
  repositorioAdministrador,
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
  contenidoServices,
  contactoService,
  solicitudBibliocraService,
  dashboardService,
  administradorService,
  enviarCodigo
};
