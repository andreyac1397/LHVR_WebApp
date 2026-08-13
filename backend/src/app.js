const path = require("node:path");

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");

const rutasPrincipales = require(
  "./routes/api.routes"
);

const rutaNoEncontrada = require(
  "./middlewares/not-found.middleware"
);

const manejadorErrores = require(
  "./middlewares/error-handler.middleware"
);

const app = express();

/*
 * Carpeta pública donde se almacenan
 * las imágenes y documentos cargados.
 */
const DIRECTORIO_UPLOADS =
  path.resolve(
    process.cwd(),
    "uploads"
  );

/*
 * Ocultar información de Express
 * en los encabezados de respuesta.
 */
app.disable("x-powered-by");

/*
 * Permite obtener correctamente la IP original
 * cuando el backend se publique detrás de un proxy.
 */
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

/*
 * Seguridad básica para encabezados HTTP.
 */
app.use(helmet());

/*
 * Orígenes autorizados para consumir la API.
 *
 * Se pueden configurar desde el archivo .env mediante:
 * CORS_ORIGINS=http://localhost:5500,http://localhost:3000
 */
const origenesPermitidos = (
  process.env.CORS_ORIGINS ||
  [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
  ].join(",")
)
  .split(",")
  .map((origen) => origen.trim())
  .filter(Boolean);

/*
 * Configuración de CORS.
 *
 * credentials: true permite que el navegador
 * envíe y reciba la cookie sesion_admin.
 */
const opcionesCors = {
  origin(origen, callback) {
    /*
     * Las solicitudes sin encabezado Origin,
     * como Postman o algunas pruebas internas,
     * también se permiten.
     */
    if (!origen) {
      return callback(null, true);
    }

    if (origenesPermitidos.includes(origen)) {
      return callback(null, true);
    }

    const error = new Error(
      "El origen de la solicitud no está autorizado."
    );

    error.statusCode = 403;
    error.codigo = "ORIGEN_NO_AUTORIZADO";

    return callback(error);
  },

  credentials: true,

  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS"
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Request-Id"
  ],

  optionsSuccessStatus: 204
};

app.use(cors(opcionesCors));

/*
 * Permitir recibir datos en formato JSON.
 */
app.use(
  express.json({
    limit: "6mb"
  })
);

/*
 * Permitir recibir datos enviados
 * mediante formularios.
 */
app.use(
  express.urlencoded({
    extended: true,
    limit: "6mb"
  })
);

/*
 * Permitir leer cookies mediante req.cookies.
 */
app.use(cookieParser());

/*
 * Publicar los archivos almacenados en:
 *
 * backend/uploads
 *
 * Ejemplo:
 * backend/uploads/images/paginas/logo.png
 *
 * Disponible desde:
 * http://127.0.0.1:3001/uploads/images/paginas/logo.png
 */
app.use(
  "/uploads",

  express.static(
    DIRECTORIO_UPLOADS,
    {
      dotfiles: "deny",
      index: false,

      /*
       * Permite mostrar las imágenes desde
       * el frontend que funciona en el puerto 5500.
       */
      setHeaders(res) {
        res.setHeader(
          "Cross-Origin-Resource-Policy",
          "cross-origin"
        );

        res.setHeader(
          "X-Content-Type-Options",
          "nosniff"
        );
      }
    }
  )
);

/*
 * Ruta inicial del backend.
 */
app.get("/", (req, res) => {
  return res.status(200).json({
    exito: true,
    mensaje:
      "API del Liceo Hernán Vargas Ramírez funcionando"
  });
});

/*
 * Rutas principales de la API.
 */
app.use("/api", rutasPrincipales);

/*
 * Se ejecuta cuando ninguna ruta coincide.
 */
app.use(rutaNoEncontrada);

/*
 * Manejo centralizado de errores.
 */
app.use(manejadorErrores);

module.exports = app;
