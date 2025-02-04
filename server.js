const express = require("express");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const http = require("http");
const { Queue, Worker } = require("bullmq");
const { Server } = require("socket.io");
const Redis = require("ioredis");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 3000;

// Configurar conexión con Redis
const redisConnection = { host: "127.0.0.1", port: 6379 };
const redis = new Redis(redisConnection);

// Crear la cola de trabajos
const videoQueue = new Queue("video-processing", { connection: redisConnection });

// Configuración de Multer para almacenamiento temporal
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Mantener el nombre original
  },
});

const upload = multer({ storage });

app.use(cors());
app.use(express.static("public"));
app.use("/videos", express.static("processed"));
app.use("/subtitles", express.static("subtitles"));

// Ruta para subir video
app.post("/upload", upload.single("video"), async (req, res) => {
  if (!req.file) return res.status(400).send("No se subió ningún archivo");

  // Agregar el archivo a la cola de procesamiento
  await videoQueue.add("convert", { filename: req.file.filename });

  // Guardar en Redis que el archivo está en cola
  await redis.set("processingFile", req.file.filename);
  await redis.set("progress", 0);

  res.json({ message: "Archivo en cola", filename: req.file.filename });
});

// Ruta para consultar el estado del procesamiento
app.get("/status", async (req, res) => {
  const processingFile = await redis.get("processingFile");
  const progress = await redis.get("progress");

  if (processingFile) {
    res.json({ processing: true, filename: processingFile, progress: progress || 0 });
  } else {
    res.json({ processing: false });
  }
});

// Worker para procesar videos en segundo plano
const worker = new Worker(
  "video-processing",
  async (job) => {
    const inputPath = `uploads/${job.data.filename}`;
    const outputFilename = path.parse(job.data.filename).name + ".mp4";
    const outputPath = `processed/${outputFilename}`;
    const subtitlePath = `subtitles/${path.parse(job.data.filename).name}.vtt`;

    io.emit("processing", { filename: job.data.filename });

    await redis.set("processingFile", job.data.filename);
    await redis.set("progress", 0);

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .output(outputPath)
        .format("mp4")
        .videoCodec("libx264")
        .audioCodec("aac")
        .outputOptions(["-movflags +faststart"])
        .on("progress", async (progress) => {
          const percent = progress.percent.toFixed(2);
          await redis.set("progress", percent);
          io.emit("progress", { filename: job.data.filename, percent });
        })
        .on("end", async () => {
          fs.unlinkSync(inputPath); // Eliminar el archivo original

          // Extraer subtítulos
          ffmpeg(inputPath)
            .output(subtitlePath)
            .outputOptions(["-map 0:s:0", "-c:s webvtt"])
            .on("end", async () => {
              await redis.del("processingFile");
              await redis.del("progress");

              io.emit("completed", {
                filename: outputFilename,
                subtitle: `/subtitles/${path.basename(subtitlePath)}`,
              });
              resolve();
            })
            .on("error", async () => {
              await redis.del("processingFile");
              await redis.del("progress");

              io.emit("completed", { filename: outputFilename, subtitle: null });
              resolve();
            })
            .run();
        })
        .on("error", async (err) => {
          await redis.del("processingFile");
          await redis.del("progress");

          io.emit("error", { filename: job.data.filename, error: err.message });
          reject(err);
        })
        .run();
    });
  },
  { connection: redisConnection }
);

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
