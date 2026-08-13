# Informe final de cambios — LICEO-WEBSITE

Fecha de revisión: 6 de agosto de 2026  
Base utilizada: `LICEO-WEBSITE(1).zip`

## Alcance respetado

El desarrollo se realizó sobre una copia exacta del ZIP proporcionado. No se reconstruyó el proyecto desde cero y no se usó otra versión como base.

Permanecieron sin cambios respecto al ZIP original:

- Inicio público y su gestión administrativa.
- Nosotros público y su gestión administrativa.
- Oferta académica.
- Dashboard.
- Autenticación existente.

No se eliminó, renombró ni movió ningún archivo existente.

## Páginas y módulos implementados

- Gestión de páginas: Comunidad.
- Gestión de páginas: Contacto y ubicación.
- Boletines.
- Calendario.
- Biblioteca BiblioCRA.
- Solicitudes BiblioCRA.
- Docentes.
- Horarios.
- Trámites.
- Recursos de apoyo.
- Galería.
- Administradores.
- Auditoría.
- Configuración general.
- Calificaciones históricas: únicamente interfaz gráfica, sin backend ni almacenamiento.

## Funcionalidades principales agregadas

### Gestión de contenido

Se agregó una infraestructura reutilizable para administrar colecciones, versiones y elementos sin duplicar la misma lógica en cada módulo. Incluye:

- Consulta pública y administrativa.
- Creación y edición de registros.
- Archivado lógico.
- Estados de borrador, publicado, inactivo y archivado.
- Publicación de una versión activa por módulo.
- Registro de importaciones.
- Operaciones masivas transaccionales.
- Validaciones en la interfaz y nuevamente en el backend.
- Auditoría de operaciones administrativas.

### Calendario

- Importación del JSON anual del MEP.
- Validación del año y de las fechas.
- Vista previa editable antes de guardar.
- Conservación del calendario público vigente mientras se revisa otro año.
- Versiones anuales en borrador y publicación posterior.
- Edición, creación y archivado de eventos desde el panel.
- Página pública conectada a la API con respaldo en el JSON local existente.

### Horarios

- Descarga de plantilla Excel `.xlsx`.
- Lectura de Excel sin incorporar una dependencia nueva.
- Pegado de filas copiadas desde Excel.
- Vista previa editable.
- Validación de niveles de sétimo a undécimo y secciones dinámicas.
- Modos de importación: reemplazo total, por niveles, por secciones o agregado sin duplicar.
- Versiones en borrador y publicación posterior.
- Página pública conectada a la API con respaldo en el CSV local existente.

### Formularios y solicitudes

- Formulario público de contacto conectado a su módulo administrativo.
- Formulario público de solicitudes BiblioCRA.
- Estados de seguimiento y respuesta administrativa.

### Seguridad de contenido

- Rechazo de protocolos de enlace inseguros.
- Escape de textos administrables antes de insertarlos en HTML público.
- Validación de correos y enlaces institucionales.
- Protección de todas las operaciones administrativas con la sesión existente.

## Archivos y estructura

La comparación detallada se encuentra en `COMPARACION-ARCHIVOS.json`.

Resumen previo a incluir los dos archivos de informe:

- Archivos originales: 10 953.
- Archivos nuevos de implementación: 30.
- Archivos existentes modificados: 126.
- Archivos eliminados: 0.
- Archivos renombrados o movidos: 0.
- Archivos originales sin cambios: 10 827.

Los archivos nuevos corresponden a migraciones, servicios compartidos, pruebas, scripts de inicialización y recursos necesarios para las páginas pendientes.

## Pruebas realizadas

- 385 archivos JavaScript revisados sintácticamente: 0 fallos.
- 74 archivos HTML revisados: 0 referencias locales rotas, 0 identificadores duplicados y 0 botones de formulario sin tipo.
- 20 archivos CSS revisados: 0 bloques o delimitadores desbalanceados.
- 9 archivos JSON validados: 0 fallos.
- 17 pruebas unitarias: 17 aprobadas.
- 15 pruebas HTTP con dependencias controladas: 15 aprobadas.
- 36 pruebas del panel administrativo en escritorio y móvil: 36 aprobadas.
- 20 pruebas de páginas públicas en escritorio y móvil: 20 aprobadas.
- Verificación de protección administrativa: las rutas privadas respondieron 401 sin sesión, como corresponde.
- Comparación por hash SHA-256 entre el ZIP original y la versión final.

## Errores encontrados y corregidos

- Rutas administrativas que generaban `/api/api/...` porque el cliente compartido ya agregaba `/api`.
- Error de referencia en la interfaz visual de Calificaciones.
- Fechas que requerían normalización para controles HTML.
- Importaciones que debían impedir el guardado de filas inválidas.
- Enlaces administrables que necesitaban validación de protocolo.
- Rutas del menú que apuntaban a carpetas distintas de las existentes.
- Falsos positivos del validador de conflictos causados por separadores de comentarios SQL.

Después de cada corrección se repitieron las pruebas correspondientes.

## Comparación con el ZIP original

Se verificó expresamente que permanecen idénticos por hash:

- `frontend-publico/index.html`
- `frontend-publico/js/inicio.js`
- `frontend-publico/pages/nosotros.html`
- `frontend-publico/js/nosotros.js`
- `frontend-publico/pages/oferta-academica.html`
- `panel-administrativo/pages/dashboard/dashboard.html`
- `panel-administrativo/js/modules/dashboard.js`
- `panel-administrativo/css/dashboard.css`
- `panel-administrativo/pages/autenticacion/iniciar-sesion.html`
- `panel-administrativo/js/modules/autenticacion.js`

La carpeta `.git` fue restaurada exactamente desde el ZIP original para eliminar cambios incidentales producidos por la revisión.

## Puesta en marcha de la base de datos

Antes de iniciar la versión nueva en el equipo Windows del proyecto:

1. Crear un respaldo de `BD-LHVR`.
2. Entrar en la carpeta `backend`.
3. Ejecutar `npm run setup:contenido`.
4. Ejecutar `npm run test:db`.
5. Iniciar el backend con `npm start`.
6. Probar una carga y publicación real desde cada módulo administrativo.

## Limitación de la prueba en este entorno

No fue posible ejecutar las migraciones contra el SQL Server real del liceo desde este entorno Linux, porque la conexión del proyecto utiliza `msnodesqlv8`, compilado para Windows. Se validaron el código, las consultas mediante dependencias controladas, las transacciones, las rutas, la protección, las interfaces y el comportamiento del navegador; la prueba final de persistencia real debe realizarse en el equipo Windows conectado a `BD-LHVR` después de ejecutar `npm run setup:contenido`.

## Seguridad del archivo entregado

El ZIP original contiene `backend/.env` con información sensible. Se conservó sin modificar porque se solicitó mantener exactamente la estructura y no eliminar archivos, pero esas credenciales deben cambiarse antes de compartir el proyecto con terceros o publicarlo.
