const express = require("express");
const fileUpload = require("express-fileupload");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const http = require("http");
const socketIO = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const PORT = 3000;

// Middleware para manejar las subidas de archivos
app.use(fileUpload());
app.use(express.static("public"));

// Crear carpetas necesarias
const uploadsDir = path.join(__dirname, "uploads");
const outputDir = path.join(__dirname, "output");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Ruta para subir archivos
app.post("/upload", (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send("No se subió ningún archivo.");
  }

  const file = req.files.file;

  // Normalizar el nombre del archivo
  let fileName = file.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Elimina acentos
    .replace(/[^a-zA-Z0-9.\-]/g, "-") // Reemplaza caracteres especiales por guiones
    .replace(/\s+/g, "-"); // Reemplaza espacios por guiones

  const uploadPath = path.join(uploadsDir, fileName);

  // Guardar el archivo en la carpeta "uploads"
  file.mv(uploadPath, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error al guardar el archivo.");
    }

    res.send("Archivo subido correctamente.");

    // Iniciar la conversión a MP4
    const outputFileName = fileName.replace(".mkv", ".mp4");
    const outputPath = path.join(outputDir, outputFileName);

    const ffmpegCommand = `ffmpeg -i "${uploadPath}" -c:v libx264 -c:a aac -strict experimental -y "${outputPath}"`;

    const conversionProcess = exec(ffmpegCommand);

    conversionProcess.stderr.on("data", (data) => {
      // Procesar progreso de conversión
      const progressMatch = data.match(/frame=\s*\d+/);
      if (progressMatch) {
        const frame = progressMatch[0].split("=")[1].trim();
        io.emit("conversionProgress", { fileName: outputFileName, frame });
      }
    });

    conversionProcess.on("close", (code) => {
      if (code === 0) {
        io.emit("conversionComplete", { fileName: outputFileName });
        console.log(`Conversión completada: ${outputFileName}`);
      } else {
        io.emit("conversionError", { fileName: outputFileName });
        console.error(`Error al convertir el archivo: ${outputFileName}`);
      }
    });
  });
});

// Iniciar el servidor
server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
