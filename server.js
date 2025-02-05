const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { Server } = require("socket.io");
const http = require("http");
const ffmpeg = require("fluent-ffmpeg");

// Configuración del servidor
const app = express();
const server = http.createServer(app);
const io = new Server(server);

const uploadDir = path.join(__dirname, "uploads");
const outputDir = path.join(__dirname, "output");

// Crear carpetas si no existen
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

// Estado de los archivos en memoria
const fileStates = {}; // Estructura: { fileName: { status: "subido" | "procesando" | "completado", progress: 0 } }

// Configuración de Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const normalized = file.originalname
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9.\-]/g, "-")
      .replace(/\s+/g, "-");
    cb(null, normalized);
  },
});
const upload = multer({ storage });

// Middleware y rutas estáticas
app.use(express.static(path.join(__dirname, "public")));

// Ruta para subir archivos
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).send("No se subió ningún archivo.");

  const fileName = req.file.filename;
  const filePath = path.join(uploadDir, fileName);
  const outputFilePath = path.join(outputDir, fileName.replace(".mkv", ".mp4"));

  // Guardar estado inicial del archivo
  fileStates[fileName] = { status: "subido", progress: 0 };
  io.emit("fileStateUpdate", { fileName, state: fileStates[fileName] });

  // Procesar el archivo con ffmpeg
  fileStates[fileName].status = "procesando";
  io.emit("fileStateUpdate", { fileName, state: fileStates[fileName] });

  ffmpeg(filePath)
    .videoCodec("libx264")
    .audioCodec("aac")
    .outputOptions(["-strict experimental", "-movflags +faststart"])
    .on("progress", (progress) => {
      const percent = Math.round(progress.percent);
      fileStates[fileName].progress = percent;
      io.emit("fileStateUpdate", { fileName, state: fileStates[fileName] });
    })
    .on("end", () => {
      fileStates[fileName].status = "completado";
      fileStates[fileName].progress = 100;
      io.emit("fileStateUpdate", { fileName, state: fileStates[fileName] });
    })
    .on("error", (err) => {
      console.error(err);
      fileStates[fileName].status = "error";
      io.emit("fileStateUpdate", { fileName, state: fileStates[fileName] });
    })
    .save(outputFilePath);

  res.status(200).send("Archivo subido y en proceso.");
});

// Ruta para obtener el estado actual de todos los archivos
app.get("/file-states", (req, res) => {
  res.json(fileStates);
});

// Iniciar servidor
const PORT = 3000;
server.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
