🏫 LHVR WebApp

<p align="center"> <strong>Plataforma web institucional para el Liceo Hernán Vargas Ramírez</strong> </p>

<p align="center"> Sitio web público + panel administrativo + API REST + base de datos </p>

<p align="center"> <img src="https://img.shields.io/badge/Node.js-Backend-339933?logo=node.js&logoColor=white"> <img src="https://img.shields.io/badge/Express.js-API-000000?logo=express&logoColor=white"> <img src="https://img.shields.io/badge/SQL%20Server-Database-CC2927?logo=microsoftsqlserver&logoColor=white"> <img src="https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black"> <img src="https://img.shields.io/badge/HTML5-Frontend-E34F26?logo=html5&logoColor=white"> <img src="https://img.shields.io/badge/CSS3-Styles-1572B6?logo=css3&logoColor=white"> <img src="https://img.shields.io/badge/REST-API-009688"> <img src="https://img.shields.io/badge/Security-2FA-blue"> </p>

📌 Descripción

LHVR WebApp es una plataforma web desarrollada para el Liceo Hernán Vargas Ramírez, diseñada para modernizar la administración y publicación de información institucional.

El proyecto evolucionó desde un sitio web público principalmente estático hacia una aplicación completa formada por:

🌐 Sitio web público.
🔐 Panel administrativo protegido.
⚙️ Backend con API REST.
🗄️ Base de datos Microsoft SQL Server.
✉️ Sistema de correo electrónico.
🔑 Autenticación con verificación en dos pasos.
📝 Administración dinámica del contenido.
📚 Gestión de biblioteca.
📅 Calendario y horarios.
📰 Gestión y distribución de boletines.
💬 Comunicación entre visitantes y administración.
📊 Gestión y consulta de información académica.

La información mostrada en el sitio público puede ser administrada desde el panel sin necesidad de modificar directamente los archivos del frontend.

✨ Principales funcionalidades
🌐 Sitio web público

El frontend público permite consultar información institucional de forma clara, accesible y adaptable a diferentes dispositivos.

Entre las principales secciones se encuentran:

Inicio.
Nosotros.
Oferta académica.
Comunidad.
Boletines.
Directorio de docentes.
Recursos de apoyo.
Galería.
Biblioteca BiblioCRA.
Horarios.
Calendario.
Contacto.
Consulta de calificaciones.
Solicitudes y servicios institucionales.

El contenido dinámico se obtiene desde el backend mediante la API y la base de datos.

🛠️ Panel administrativo

Se desarrolló un panel independiente para permitir que los administradores gestionen el contenido del sitio sin necesidad de editar código.

Entre sus funcionalidades se encuentran:

🏠 Gestión de Inicio

Permite administrar elementos como:

Encabezado principal.
Título.
Lema institucional.
Imagen principal.
Botones destacados.
Accesos rápidos.
Estado activo/inactivo.
Orden de elementos.

Las publicaciones recientes y próximas actividades pueden obtenerse automáticamente desde otros módulos del sistema.

🎓 Oferta académica

Administración de la información correspondiente a la oferta educativa del liceo.

Permite mantener organizada la información que posteriormente se muestra en el frontend público.

👥 Comunidad

Administración mediante tarjetas desplegables.

Funciones principales:

Crear elementos.
Editar elementos existentes.
Activar o retirar contenido.
Organizar información.
Administrar encabezados.
Visualizar el contenido utilizando una interfaz tipo acordeón.

Los formularios de creación se muestran de forma independiente para mantener una interfaz limpia.

📰 Boletines

Sistema para administrar los boletines institucionales.

Incluye:

Crear boletines.
Editar información.
Retirar boletines.
Clasificación por tipo.
Ordenamiento por fecha.
Enlaces a documentos.
Administración de encabezado.
Distribución por correo electrónico.

Tipos de contenido disponibles incluyen diferentes categorías institucionales, entre ellas recordatorios.

✉️ Envío de boletines por correo

Cuando se publica un nuevo boletín, el administrador puede seleccionar las personas que recibirán una notificación.

El sistema permite:

Buscar destinatarios.
Filtrar destinatarios.
Seleccionar personas individualmente.
Seleccionar grupos completos.
Seleccionar todos los resultados de una búsqueda.
Registrar los envíos realizados.

Los destinatarios pueden organizarse en categorías como:

Docentes.
Administrativos.
Padres o encargados.
Secretaría.
Otros grupos configurados.

El sistema reutiliza la infraestructura de correo electrónico utilizada por la autenticación.

👨‍🏫 Directorio de docentes

Permite administrar los docentes mostrados en el sitio institucional.

Características:

Nombre.
Área académica.
Materia o especialidad.
Correo.
Fotografía.
Tipo o categoría.
Orden.
Estado activo/inactivo.

Las fotografías se administran mediante el sistema de archivos/imágenes del panel y no mediante enlaces externos escritos manualmente.

📚 Recursos de apoyo

Administración centralizada de materiales y recursos disponibles para estudiantes y comunidad educativa.

Permite:

Crear recursos.
Editarlos.
Clasificarlos.
Ordenarlos.
Activarlos o retirarlos.
Administrar sus enlaces.
Controlar su visualización en el frontend público.
🖼️ Galería

Sistema para gestionar contenido multimedia institucional.

Incluye:

Creación de elementos.
Imágenes.
Categorías.
Orden.
Estado.
Edición.
Retiro.
Administración del encabezado de la página.
📚 Biblioteca BiblioCRA

Se desarrolló un módulo específico para administrar la información de la biblioteca institucional.

El módulo permite gestionar:

Encabezado de la página.
Secciones.
Colecciones.
Elementos.
Versiones.
Publicación de contenido.
Estado activo/inactivo.
Importaciones.
Recursos de biblioteca.

También se integró la identidad visual correspondiente a BiblioCRA dentro del frontend público.

📖 Solicitud de préstamo BiblioCRA

Los usuarios pueden enviar solicitudes de préstamo directamente desde el sitio.

El formulario contempla información como:

Material solicitado
Signatura.
Autor.
Título.
Fecha de solicitud.
Fecha de devolución.
Información del solicitante
Nombre.
Cédula o carné.
Tipo de usuario.
Sección.
Teléfono.
Correo.
Observaciones.
Modalidad de préstamo
Sala.
Aula.
Hogar.
Tipos de usuario
Estudiante.
Docente.
Administrativo.

Las solicitudes pueden ser consultadas y administradas posteriormente desde el panel administrativo.

📅 Calendario institucional

Se incorporó un sistema de calendario para mostrar actividades y fechas importantes.

Permite:

Mostrar actividades institucionales.
Gestionar eventos.
Integrar información del calendario educativo.
Preparar calendarios para nuevos periodos académicos.
Consultar actividades desde el frontend.

Los eventos futuros pueden gestionarse dinámicamente desde la base de datos.

🕒 Gestión de horarios

Se implementó un módulo para administrar horarios académicos.

El flujo permite:

Seleccionar una plantilla.
Cargar información.
Validar los datos.
Revisar y editar.
Guardar el horario.
Publicarlo para consulta.

El sistema contempla múltiples secciones y niveles académicos.

📞 Contacto institucional

La información de contacto fue centralizada para evitar datos duplicados en diferentes páginas.

Desde el sistema se pueden administrar datos como:

Nombre de la institución.
Correo institucional.
Dirección.
Ubicación.
Facebook.
Horario institucional.

La misma información puede ser reutilizada en diferentes partes del sitio, por ejemplo:

Página de contacto.
Footer.
Secciones institucionales.
💬 Sistema de chat

Se incorporó un sistema de comunicación entre visitantes del sitio público y el personal administrativo.

El objetivo es facilitar consultas de:

Padres de familia.
Estudiantes.
Encargados.
Personas externas.

El visitante proporciona información básica para iniciar la conversación y el personal puede gestionar las consultas desde el entorno administrativo.

🎓 Calificaciones

La plataforma contempla módulos independientes para:

Consulta de calificaciones.
Gestión administrativa de calificaciones.

Esto permite separar el acceso público de las funciones administrativas.

🔐 Seguridad y autenticación

Uno de los componentes principales del proyecto es el sistema de seguridad para administradores.

Inicio de sesión en dos pasos

El proceso se realiza mediante:

Correo + Contraseña
        ↓
Validación de credenciales
        ↓
Código temporal de 6 dígitos
        ↓
Código enviado por correo
        ↓
Verificación
        ↓
Creación de sesión
        ↓
Panel administrativo
🔑 Características de seguridad

Se implementaron diferentes medidas, entre ellas:

Autenticación de administradores.
Verificación en dos pasos mediante correo.
Código temporal de 6 dígitos.
Recuperación de contraseña.
Cambio de contraseña.
Cierre de sesión.
Cookies HttpOnly.
Tokens de sesión.
Hash SHA-256 para identificadores de sesión.
Registro de dirección IP.
Registro de User-Agent.
Auditoría de acciones administrativas.
Helmet para protección de cabeceras HTTP.
Configuración de CORS.
Validación de solicitudes.
Separación entre frontend público y panel administrativo.
Control de acceso a endpoints administrativos.
🧾 Auditoría

El sistema mantiene registros de operaciones importantes realizadas por los administradores.

Esto permite conocer información relacionada con acciones administrativas, incluyendo:

Administrador.
Acción ejecutada.
Dirección IP.
Navegador/dispositivo.
Fecha.
Información relacionada con la operación.

La auditoría se integra con procedimientos almacenados de SQL Server.

⚙️ Configuración general

Se diseñó una sección para centralizar configuraciones importantes del sistema.

Entre las configuraciones contempladas se encuentran:

🌐 Modo mantenimiento del sitio público

Permite:

Activarlo/desactivarlo.
Definir un mensaje personalizado.
🛠️ Modo mantenimiento administrativo

Permite:

Activarlo/desactivarlo.
Mostrar un mensaje personalizado.
Mantener acceso especial para usuarios con permisos superiores cuando corresponda.
⏱️ Tiempo de inactividad

Permite configurar el cierre automático de sesión después de cierto periodo sin actividad.

Ejemplos:

15 minutos.
30 minutos.
60 minutos.
120 minutos.
👤 Perfil administrativo

El sistema contempla una sección para administrar la información personal del usuario autenticado.

Puede incluir información como:

Fotografía.
Nombre.
Correo.
Datos del perfil.
Fecha de creación de la cuenta.
Información de seguridad.

La fecha de creación se mantiene únicamente como información de consulta y no puede modificarse.

🗄️ Base de datos

La aplicación utiliza:

Microsoft SQL Server

La base de datos centraliza la información necesaria para:

Administradores.
Sesiones.
Códigos de autenticación.
Recuperación de contraseña.
Auditoría.
Contenido institucional.
Encabezados.
Tarjetas.
Boletines.
Docentes.
Recursos.
Galería.
Biblioteca.
Calendario.
Horarios.
Contacto.
Destinatarios de correo.
Envíos.
Solicitudes.
Configuración.
Chat.
Información académica.

También se utilizan:

Relaciones mediante claves foráneas.
Restricciones.
Índices.
Procedimientos almacenados.
Consultas parametrizadas.
Migraciones SQL.
Scripts de configuración y carga de datos.
🧱 Arquitectura

El backend fue desarrollado utilizando una arquitectura modular por capas.

HTTP Request
     │
     ▼
┌──────────────┐
│    Routes    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Controllers  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Services   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Repositories │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ SQL Server   │
└──────────────┘

Esta separación facilita:

Mantenimiento.
Reutilización de código.
Pruebas.
Escalabilidad.
Separación de responsabilidades.
Incorporación de nuevos módulos.
🗂️ Estructura general
LHVR_WebApp/
│
├── backend/
│   ├── scripts/
│   ├── src/
│   │   ├── config/
│   │   ├── modules/
│   │   ├── shared/
│   │   ├── middlewares/
│   │   └── app.js
│   │
│   ├── server.js
│   ├── package.json
│   └── .env
│
├── database/
│   ├── migrations/
│   ├── scripts/
│   └── seeds/
│
├── frontend-publico/
│   ├── css/
│   ├── js/
│   ├── img/
│   └── *.html
│
├── panel-administrativo/
│   ├── css/
│   ├── js/
│   ├── img/
│   └── *.html
│
├── docs/
│
└── README.md

La estructura exacta puede variar ligeramente según la versión actual del repositorio.

💻 Tecnologías utilizadas
Frontend
Tecnología	Uso
HTML5	Estructura de las páginas
CSS3	Diseño y responsive
JavaScript	Lógica del frontend
Fetch API	Comunicación con el backend
DOM API	Interfaces dinámicas
JSON	Intercambio de información
Backend
Tecnología	Uso
Node.js	Entorno de ejecución
Express.js	Servidor y API REST
JavaScript	Lógica de negocio
REST	Comunicación frontend/backend
Middleware	Seguridad y validaciones
Variables de entorno	Configuración segura
Base de datos
Tecnología	Uso
Microsoft SQL Server	Base de datos principal
T-SQL	Consultas y lógica SQL
Stored Procedures	Operaciones centralizadas
Constraints	Integridad de datos
Foreign Keys	Relaciones
Índices	Optimización
Migraciones	Evolución del esquema
Seguridad
Tecnología / técnica	Uso
2FA	Segundo factor de autenticación
SHA-256	Tokens de sesión
HttpOnly Cookies	Protección de sesión
Helmet	Seguridad HTTP
CORS	Control de acceso
Variables .env	Protección de credenciales
Auditoría	Registro de operaciones
Herramientas de desarrollo
Visual Studio Code.
Git.
GitHub.
SQL Server Management Studio.
Node.js.
npm.
Microsoft SQL Server.
ODBC Driver 18 for SQL Server.
Postman / herramientas HTTP para pruebas.
Navegadores modernos y herramientas de desarrollo.
🔄 Comunicación entre componentes
┌────────────────────────┐
│    Frontend público     │
└───────────┬────────────┘
            │
            │ HTTP / JSON
            ▼
┌────────────────────────┐
│       API REST         │
│   Node.js + Express    │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│   Servicios / lógica   │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│      Repositories      │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│ Microsoft SQL Server   │
└────────────────────────┘
            ▲
            │
            │ HTTP / JSON
┌───────────┴────────────┐
│ Panel administrativo  │
└────────────────────────┘
🔌 API REST

La aplicación utiliza endpoints organizados por módulo.

Ejemplo:

/api/
│
├── autenticacion/
├── administracion/
├── comunidad/
├── boletines/
├── docentes/
├── recursos/
├── galeria/
├── biblioteca/
├── calendario/
├── horarios/
├── contacto/
├── calificaciones/
└── ...

Ejemplos de operaciones disponibles:

GET
POST
PUT
PATCH
DELETE

Los endpoints administrativos requieren autenticación cuando corresponde.

🔐 Flujo de sesión administrativa
1. Usuario ingresa correo y contraseña
                 ↓
2. Backend valida las credenciales
                 ↓
3. Se genera código temporal
                 ↓
4. Código enviado por correo
                 ↓
5. Usuario introduce código
                 ↓
6. Backend verifica el código
                 ↓
7. Se genera sesión administrativa
                 ↓
8. Cookie HttpOnly
                 ↓
9. Acceso al panel
🧠 Reglas de gestión de contenido

Se implementaron reglas para mantener consistencia en los módulos administrables.

Entre ellas:

Cada elemento puede manejar estado activo/inactivo.
Los elementos retirados dejan de mostrarse públicamente.
Los encabezados pueden activarse o desactivarse.
El frontend utiliza la información almacenada en la base de datos.
Las tarjetas pueden clasificarse mediante tipos o categorías.
Los tipos se utilizan para filtros.
Los elementos pueden tener un orden definido.
El orden debe mantenerse consistente dentro de cada colección.
Las imágenes se administran mediante mecanismos de selección/carga.
La creación utiliza formularios independientes o modales.
Las interfaces administrativas reutilizan patrones visuales consistentes.
Se utilizan confirmaciones para operaciones importantes.
📱 Diseño responsive

El frontend fue desarrollado considerando diferentes tamaños de pantalla.

Compatible con:

💻 Computadoras.
💻 Laptops.
📱 Teléfonos.
📲 Tablets.

Se utilizaron:

Flexbox.
CSS Grid.
Media queries.
Componentes adaptables.
Navegación responsive.
🚀 Instalación
1. Clonar el repositorio
git clone <URL_DEL_REPOSITORIO>

Entrar al proyecto:

cd LHVR_WebApp
2. Instalar dependencias del backend
cd backend
npm install
3. Configurar SQL Server

Crear o restaurar la base de datos correspondiente al proyecto.

Posteriormente ejecutar las migraciones y scripts disponibles dentro de:

database/
4. Configurar variables de entorno

Crear/configurar el archivo:

backend/.env

Ejemplo de variables:

NODE_ENV=development
PORT=3001

DB_SERVER=localhost
DB_DATABASE=BD-LHVR

DB_TRUSTED_CONNECTION=true
DB_TRUST_SERVER_CERTIFICATE=true

Las credenciales y secretos reales no deben almacenarse en GitHub.

5. Verificar conexión con la base de datos

El proyecto dispone de scripts de soporte para comprobar la comunicación entre Node.js y SQL Server.

6. Iniciar backend

Ejecutar el script correspondiente definido en:

backend/package.json

El backend se ejecuta por defecto en un entorno local similar a:

http://localhost:3001
7. Ejecutar los frontends

Abrir o servir mediante un servidor web:

frontend-publico/

y

panel-administrativo/

Para desarrollo puede utilizarse una extensión como Live Server o cualquier servidor HTTP local.

⚠️ Variables y archivos privados

Nunca subir al repositorio:

.env
.env.*
node_modules/
credenciales
contraseñas
tokens
certificados privados
copias privadas de la base de datos

Ejemplo para .gitignore:

# Dependencies
node_modules/

# Environment variables
.env
.env.*
!.env.example

# Logs
*.log
logs/

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/

# Temporary files
tmp/
temp/

# Database backups
*.bak
📊 Objetivos alcanzados

Con el desarrollo de esta versión se logró:

✅ Convertir un sitio institucional estático en una aplicación dinámica.

✅ Centralizar información institucional en SQL Server.

✅ Crear una API REST propia.

✅ Implementar un panel administrativo.

✅ Permitir administración de contenido sin editar código.

✅ Implementar autenticación administrativa.

✅ Incorporar autenticación en dos pasos.

✅ Implementar recuperación y cambio de contraseña.

✅ Crear sesiones protegidas mediante cookies HttpOnly.

✅ Incorporar auditoría administrativa.

✅ Integrar correo electrónico.

✅ Implementar distribución de boletines.

✅ Crear gestión de docentes.

✅ Crear gestión de recursos.

✅ Crear galería dinámica.

✅ Implementar módulos de comunidad y contacto.

✅ Centralizar datos institucionales.

✅ Implementar calendario.

✅ Desarrollar gestión de horarios.

✅ Implementar Biblioteca BiblioCRA.

✅ Incorporar solicitudes de préstamo.

✅ Integrar comunicación entre usuarios y administración.

✅ Mantener frontend público y panel administrativo separados.

✅ Aplicar una arquitectura modular y escalable.

📈 Evolución del proyecto
Versión 1
   │
   │ Sitio público
   │ HTML + CSS + JavaScript
   ▼
Versión 2
   │
   ├── Frontend público dinámico
   ├── Panel administrativo
   ├── API REST
   ├── SQL Server
   ├── Autenticación 2FA
   ├── Gestión de contenido
   ├── Auditoría
   ├── Correo electrónico
   ├── Biblioteca
   ├── Calendario
   ├── Horarios
   └── Nuevos servicios institucionales
🎯 Propósito del proyecto

Este proyecto fue desarrollado como parte de una práctica profesional en Tecnologías de Información, aplicando conocimientos de:

Desarrollo web.
Programación.
Bases de datos.
Diseño de APIs.
Arquitectura de software.
Seguridad informática.
Desarrollo frontend.
Desarrollo backend.
SQL.
Administración de contenido.
Integración de servicios.
Control de versiones.

El objetivo fue desarrollar una solución funcional que pueda facilitar la administración de información y servicios digitales del centro educativo.

🛣️ Posibles mejoras futuras

La arquitectura actual permite continuar incorporando funcionalidades como:

Aplicación móvil.
Notificaciones push.
Integración con servicios educativos externos.
Mayor automatización de procesos.
Dashboards estadísticos.
Reportes.
Roles y permisos más detallados.
Almacenamiento de archivos en la nube.
CDN para imágenes.
Contenedores Docker.
CI/CD.
Pruebas automatizadas.
Monitoreo y observabilidad.
👨‍💻 Autor

Andrey Calderón Vega

Estudiante de Tecnologías de Información.

Áreas aplicadas en el proyecto:

Desarrollo Full Stack.
Node.js.
JavaScript.
SQL Server.
Bases de datos.
APIs REST.
Arquitectura de software.
Seguridad.
Git y GitHub.
📄 Licencia

Proyecto desarrollado con fines académicos y como parte de una práctica profesional.

El uso, distribución o modificación del contenido institucional debe respetar las disposiciones del Liceo Hernán Vargas Ramírez.

<p align="center"> <strong>LHVR WebApp</strong><br> Transformación digital de la información institucional. </p>
