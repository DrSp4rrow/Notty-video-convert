const { Worker } = require("bullmq");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");
const redisConnection = { host: "127.0.0.1", port: 6379 };

// Configurar el trabajador de BullMQ
const worker = new Worker(
  "conversionQueue",
  async (job) => {
    const { filePath, outputFile } = job.data;

    console.log(`Procesando: ${filePath}`);

    return new Promise((resolve, reject) => {
      // Usar ffmpeg para convertir el archivo
      ffmpeg(filePath)
        .videoCodec("libx264")
        .audioCodec("aac")
        .outputOptions(["-strict experimental", "-y"])
        .output(outputFile)
        .on("progress", (progress) => {
          console.log(`Progreso: ${progress.percent}%`);
        })
        .on("end", () => {
          console.log(`Conversión completada: ${outputFile}`);
          resolve();
        })
        .on("error", (err) => {
          console.error(`Error al convertir ${filePath}:`, err);
          reject(err);
        })
        .run();
    });
  },
  { connection: redisConnection }
);

// Manejar errores del trabajador
worker.on("failed", (job, err) => {
  console.error(`Trabajo fallido ${job.id}:`, err);
});
