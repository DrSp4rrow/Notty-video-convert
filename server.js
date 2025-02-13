const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const { Server } = require("socket.io");
const http = require("http");
const unidecode = require("unidecode"); // Importar la librería para normalizar caracteres

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const uploadFolder = path.join(__dirname, "uploads");
const outputFolder = path.join(__dirname, "output");

// Crear carpetas si no existen
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder);
if (!fs.existsSync(outputFolder)) fs.mkdirSync(outputFolder);

// Configuración de Multer (para subir archivos)
const storage = multer.diskStorage({
  destination: uploadFolder,
  filename: (req, file, cb) => {
    // Transliterar el nombre del archivo (eliminar tildes y caracteres especiales)
    let normalizedFilename = unidecode(file.originalname)
      .toLowerCase() // Convertir a minúsculas
      .replace(/\s+/g, "-") // Reemplazar espacios por guiones
      .replace(/[^a-z0-9\-.]/g, ""); // Eliminar caracteres especiales excepto - y .

    cb(null, normalizedFilename);
  },
});
const upload = multer({ storage });

// Cola de trabajos
let queue = [];
let isProcessing = false;
let currentProcessingFile = null; // Archivo en proceso

// Enviar estado actual al conectarse un cliente
io.on("connection", (socket) => {
  socket.emit("queueUpdate", queue); // Envía la cola actual al cliente
  socket.emit("currentProcessing", currentProcessingFile); // Envía el archivo en proceso
});

// Ruta para subir archivo
app.post("/upload", upload.single("video"), (req, res) => {
  if (!req.file) return res.status(400).send("No se subió ningún archivo.");

  queue.push(req.file.filename);
  io.emit("queueUpdate", queue);

  if (!isProcessing) processQueue();

  res.json({
    message: "Archivo subido y en cola.",
    filename: req.file.filename,
  });
});

// Procesar cola de conversión
function processQueue() {
  if (queue.length === 0) {
    isProcessing = false;
    currentProcessingFile = null;
    io.emit("currentProcessing", null); // Notificar que no hay archivo en proceso
    return;
  }

  isProcessing = true;
  currentProcessingFile = queue.shift(); // Extrae el primer archivo de la cola
  io.emit("queueUpdate", queue);
  io.emit("currentProcessing", currentProcessingFile); // Notifica a los clientes

  const filePath = path.join(uploadFolder, currentProcessingFile);
  const outputFileName =
    path.basename(filePath, path.extname(filePath)) + ".mp4";
  const outputPath = path.join(outputFolder, outputFileName);

  ffmpeg(filePath)
    .output(outputPath)
    .outputOptions([
      "-c:v libx264",
      "-crf 23",
      "-preset fast",
      "-c:a aac",
      "-b:a 192k",
    ])
    .on("start", (cmd) => console.log("Ejecutando:", cmd))

    .on("progress", (progress) => {
      io.emit("conversionProgress", {
        file: outputFileName,
        progress: Math.floor(progress.percent),
      });
    })
    .on("end", () => {
      io.emit("conversionComplete", outputFileName);
      fs.unlinkSync(filePath);
      isProcessing = false;
      processQueue(); // Procesar el siguiente archivo en la cola
    })
    .on("error", (err) => {
      console.error("Error en conversión:", err);
      isProcessing = false;
      processQueue();
    })
    .run();
}

// Servir archivos estáticos
app.use(express.static("public"));
app.use("/output", express.static(outputFolder));

// Obtener lista de archivos convertidos
app.get("/videos", (req, res) => {
  fs.readdir(outputFolder, (err, files) => {
    if (err) return res.status(500).send("Error al listar archivos.");
    res.json(files);
  });
});

server.listen(3000, () => console.log("Servidor en http://localhost:3000"));
