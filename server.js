const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const { Server } = require('socket.io');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const uploadFolder = path.join(__dirname, 'uploads');
const outputFolder = path.join(__dirname, 'output');

// Crear carpetas si no existen
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder);
if (!fs.existsSync(outputFolder)) fs.mkdirSync(outputFolder);

// Configuración de Multer (para subir archivos)
const storage = multer.diskStorage({
    destination: uploadFolder,
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});
const upload = multer({ storage });

// Cola de trabajos
let queue = [];
let isProcessing = false;

// Enviar estado actual al conectarse un cliente
io.on('connection', (socket) => {
    socket.emit('queueUpdate', queue);  // Envía la cola actual al cliente
});

// Ruta para subir archivo
app.post('/upload', upload.single('video'), (req, res) => {
    if (!req.file) return res.status(400).send('No se subió ningún archivo.');

    queue.push(req.file.path);
    io.emit('queueUpdate', queue);
    
    if (!isProcessing) processQueue();

    res.json({ message: 'Archivo subido y en cola.', filename: req.file.filename });
});

// Procesar cola de conversión
function processQueue() {
    if (queue.length === 0) {
        isProcessing = false;
        return;
    }

    isProcessing = true;
    const filePath = queue.shift();
    io.emit('queueUpdate', queue);

    const outputFileName = path.basename(filePath, path.extname(filePath)) + '.mp4';
    const outputPath = path.join(outputFolder, outputFileName);

    ffmpeg(filePath)
        .output(outputPath)
        .outputOptions([
            '-c:v libx264',
            '-crf 23',
            '-preset fast',
            '-c:a aac',
            '-b:a 192k'
        ])
        .on('start', (cmd) => console.log('Ejecutando:', cmd))

        .on('progress', (progress) => {
            io.emit('conversionProgress', { file: outputFileName, progress: Math.floor(progress.percent) });
        })
        .on('end', () => {
            io.emit('conversionComplete', outputFileName);
            fs.unlinkSync(filePath);
            processQueue();
        })
        .on('error', (err) => {
            console.error('Error en conversión:', err);
            processQueue();
        })
        .run();
}

// Servir archivos estáticos
app.use(express.static('public'));

// Obtener lista de archivos convertidos
app.get('/videos', (req, res) => {
    fs.readdir(outputFolder, (err, files) => {
        if (err) return res.status(500).send('Error al listar archivos.');
        res.json(files);
    });
});

server.listen(3000, () => console.log('Servidor en http://localhost:3000'));
