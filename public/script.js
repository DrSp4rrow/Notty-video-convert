const socket = io();

async function uploadVideo() {
    const fileInput = document.getElementById("videoInput");
    const status = document.getElementById("status");
    
    if (fileInput.files.length === 0) {
        alert("Selecciona un video");
        return;
    }

    const formData = new FormData();
    formData.append("video", fileInput.files[0]);

    status.textContent = "Subiendo archivo...";

    try {
        const response = await fetch("/upload", {
            method: "POST",
            body: formData
        });

        const data = await response.json();
        status.textContent = "Archivo en cola: " + data.filename;
    } catch (error) {
        status.textContent = "Error al subir el video";
        console.error("Error:", error);
    }
}

// Función para verificar el estado del procesamiento en Redis
async function checkProcessingStatus() {
    try {
        const response = await fetch("/status");
        const data = await response.json();

        if (data.processing) {
            document.getElementById("processingFile").textContent = "Procesando: " + data.filename;
            document.getElementById("progressBar").value = data.progress;

            // Si ya está al 100%, mostrar como completado
            if (data.progress >= 100) {
                finalizeProcessing(data.filename);
            }
        }
    } catch (error) {
        console.error("Error al obtener el estado del procesamiento:", error);
    }
}

// Función para finalizar el procesamiento
function finalizeProcessing(filename) {
    document.getElementById("processingFile").textContent = "Conversión completada: " + filename;
    document.getElementById("progressBar").value = 100;

    const videoPlayer = document.getElementById("videoPlayer");
    const subtitleTrack = document.getElementById("subtitleTrack");

    videoPlayer.src = `/videos/${filename}`;
    videoPlayer.style.display = "block";

    fetch(`/subtitles/${filename.replace(".mp4", ".vtt")}`)
        .then((res) => {
            if (res.ok) {
                subtitleTrack.src = `/subtitles/${filename.replace(".mp4", ".vtt")}`;
                subtitleTrack.mode = "showing";
            } else {
                subtitleTrack.removeAttribute("src");
            }
        })
        .catch(() => {
            subtitleTrack.removeAttribute("src");
        });
}

// Eventos de conversión en tiempo real
socket.on("processing", (data) => {
    document.getElementById("processingFile").textContent = "Procesando: " + data.filename;
    document.getElementById("progressBar").value = 0;
});

socket.on("progress", (data) => {
    document.getElementById("progressBar").value = data.percent;
});

socket.on("completed", (data) => {
    finalizeProcessing(data.filename);
});

// Ejecutar al cargar la página para restaurar el estado
window.onload = checkProcessingStatus;
