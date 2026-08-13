# Informe de integración final — LHVR

Fecha de revisión: 13 de agosto de 2026
Rama de trabajo: `codex/terminar-integracion-lhvr`

## Alcance y seguridad de la copia

El trabajo se realizó en `C:\Users\andre\Documents\ChatGPT\LHVR_WEBAPP`, una copia independiente. La carpeta original recibida no fue modificada. Se guardó un commit de línea base antes de programar.

No se reconstruyó el proyecto. Se conservaron los módulos funcionales y se reutilizó la capa CMS existente para cerrar los módulos incompletos sin duplicar controladores y repositorios por cada tipo de contenido.

## Resultado funcional

| Módulo | Resultado en código | Persistencia / salida |
|---|---|---|
| Inicio, Nosotros y páginas | Conservado y revisado | `paginas` y `secciones_pagina` |
| Oferta académica | Conservado y revisado | Tablas y SP existentes |
| Comunidad | Conservado, sin crear una segunda versión | Backend y frontend existentes |
| Configuración institucional | Terminado | Solo `configuracion_sitio`; 12 claves administrables |
| Boletines | Terminado | Colecciones versionadas `cms_*`; API pública |
| Calendario | Terminado | CRUD, importación JSON editable, borrador/publicación, filtros públicos |
| Horarios | Terminado | Plantilla XLSX, XLSX/CSV/pegado, validación, tabla editable, versión/publicación y vista móvil |
| Biblioteca / BiblioCRA | Terminado | Contenido CMS y solicitudes normalizadas |
| Docentes | Terminado | Contenido CMS, panel y API pública |
| Trámites | Terminado | Contenido CMS, panel y API pública |
| Recursos de apoyo | Terminado | Contenido CMS, panel y API pública |
| Galería | Terminado | Contenido CMS, panel y API pública |
| Contacto | Terminado | Envío público real, bandeja, estados, nota interna y spam |
| Administradores | Terminado | Listado, alta segura y cambio de estado; sin mostrar hashes |
| Auditoría | Terminado | Consulta protegida con filtros |
| Dashboard | Integrado sin reconstruirlo | Indicadores, eventos y actividad reales |
| Calificaciones | No se debe tocar en esta etapa | Se retiraron del menú las rutas vacías; no se inventó implementación |

## Calendario

- La BD suministrada ya contiene una colección publicada 2026 con 369 eventos.
- El administrador acepta el JSON con `id`, `titulo`, `descripcion`, `link`, `link2`, `fechaInicio`, `fechaFin`, `nombreCategoria`, `subcategorias` y `destacado`.
- Antes de guardar se valida, detecta duplicados y muestra una vista previa editable.
- Cada importación crea una versión nueva; no sobrescribe destructivamente la versión publicada.
- Se puede crear, editar o archivar un evento y publicar explícitamente una versión.
- El sitio público consulta la API por año y conserva el JSON local únicamente como respaldo cuando la API no está disponible.

## Horarios

- Descarga de plantilla `.xlsx` generada por el backend.
- Lectura de `.xlsx` sin depender de Microsoft Excel instalado, además de CSV y pegado tabular.
- Reconocimiento de encabezados como `Sección`, `Lección`, `Horario` y días con tilde.
- Vista previa editable, altas y eliminaciones de filas antes del guardado.
- Importación total o parcial, versiones en borrador y publicación posterior.
- Vista pública filtrable por nivel/sección y presentación móvil mediante tarjetas.

## Seguridad aplicada

- Todas las rutas administrativas requieren la cookie de sesión validada contra SQL Server.
- Formularios públicos de Contacto y BiblioCRA tienen validación en servidor, honeypot y límite básico por IP.
- Los enlaces administrables bloquean protocolos como `javascript:`, `data:` y `vbscript:`.
- La salida dinámica se escapa antes de insertarla en HTML.
- Las contraseñas nuevas se validan y almacenan con bcrypt (12 rondas); nunca se devuelven en la API.
- Una sesión no puede deshabilitar su propia cuenta.
- Consultas SQL con parámetros; importaciones masivas dentro de una transacción.

## Auditoría de base de datos

### 1. Estado actual

El script entregado tiene 9.082 líneas, 60 tablas, 27 procedimientos, 100 relaciones FK, 85 restricciones `CHECK` y 126 índices/unicidades detectados mediante inspección estática. No hubo conexión directa a SQL Server.

Contiene dos colecciones publicadas: Boletines (5 elementos) y Calendario (369 eventos). Las tablas normalizadas de horarios y calendario están vacías, pero la capa `cms_*` ya almacena esos contenidos y es la arquitectura reutilizable elegida por el proyecto.

### 2. Aspectos correctos

- Catálogos, estados, claves foráneas, checks e índices extensos.
- Autenticación con tokens hasheados, verificación y registro de intentos.
- Auditoría central con acciones y módulos catalogados.
- Colecciones CMS con borrador/publicación e historial de importación.
- Tablas normalizadas para Contacto y BiblioCRA.
- `configuracion_sitio` contiene las 12 claves institucionales requeridas.

### 3. Problemas encontrados

- Existían dos áreas de configuración (`configuracion_sitio` y `cms_configuracion`) con posibilidad de valores contradictorios.
- Muchas clases y páginas eran archivos vacíos, aunque sus nombres sugerían módulos completos.
- La capa CMS ya implementada no estaba montada en la API ni conectada con el panel.
- Las rutas de calificaciones del menú apuntaban a archivos inexistentes y el módulo está reservado para otra etapa.
- No había endpoints administrativos reales para mensajes, BiblioCRA, dashboard, administradores y consulta de auditoría.

### 4. Severidad

- Alta: rutas administrativas vacías/rotas y formularios públicos que simulaban envío.
- Alta: calendario y horarios sin flujo completo BD → API → panel → público.
- Media: duplicación de configuración y contenido local usado como fuente principal.
- Baja: falta de vista móvil útil para horarios.

### 5. Cambios obligatorios

Se resolvieron en código reutilizando el esquema actual. No se identificó un cambio obligatorio de esquema para esta entrega.

### 6. Mejoras recomendadas

- Ejecutar las pruebas reales contra una copia de `BD-LHVR`.
- En despliegue con varias instancias, sustituir el límite por IP en memoria por un almacén compartido.
- Definir una política institucional para retiro definitivo de datos históricos.

### 7. Mejoras no necesarias

- No duplicar las 369 fechas en las tablas normalizadas mientras `cms_*` sea la capa publicada.
- No eliminar `cms_configuracion` automáticamente; basta con no usarla como fuente vigente.
- No crear SP nuevos solo para reemplazar consultas parametrizadas que ya son transaccionales y acotadas.

## Informe de scripts SQL

Cambios manuales requeridos: ninguno. Stored procedures nuevos: ninguno. Migraciones nuevas: ninguna.

Las migraciones históricas `006`, `007` y `008` ya están reflejadas en el script de la base entregada, por lo que no deben aplicarse otra vez sin verificar primero. Se agregó `database/queries/verificar-integracion-final.sql`, que es de solo lectura.

## Antes y después

Antes: capa CMS desconectada, importador XLSX vacío, múltiples rutas del panel vacías, formularios simulados y contenido público dependiente de archivos locales.

Después: una capa de gestión reutilizable para ocho módulos, calendario y horarios versionados, formularios persistentes, administración segura, tablero/auditoría reales y frontend público API-first con respaldo local controlado.

## Pruebas y límites de evidencia

Se ejecutan con `npm test`:

- servicios de autenticación, contenido, contacto, BiblioCRA y administradores;
- lectura y reconstrucción de una plantilla XLSX;
- duplicados de importación y bloqueo de URL insegura;
- respuestas 401 de rutas protegidas sin sesión;
- validación HTTP de formularios públicos sin tocar la BD;
- integridad de todas las rutas visibles del menú.

También se verificó sintaxis de 134 archivos JavaScript y se inspeccionaron en navegador Calendario, Horarios, Contacto y BiblioCRA, incluyendo Horarios a 390 px.

No se afirma una prueba SQL extremo a extremo: faltan credenciales/acceso a la base real. La persistencia, autenticación con una sesión real, envío SMTP y publicación contra `BD-LHVR` deben probarse manualmente en el equipo que tiene SQL Server, siguiendo `database/README-CAMBIOS-BD.md`.
