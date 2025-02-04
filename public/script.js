const socket = io();

// Función para subir un video
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

// Función para cargar la lista de videos ya convertidos
async function loadVideoList() {
    try {
        const response = await fetch("/videos-list");
        const data = await response.json();

        const videoList = document.getElementById("videoList");
        videoList.innerHTML = ""; // Limpiar lista antes de actualizar

        data.forEach(video => {
            addVideoLink(video.filename, video.url);
        });
    } catch (error) {
        console.error("Error al obtener la lista de videos:", error);
    }
}

// Función para agregar un enlace de video a la lista
function addVideoLink(filename, url) {
    const videoList = document.getElementById("videoList");

    const listItem = document.createElement("li");
    const link = document.createElement("a");

    link.href = url;
    link.textContent = filename;
    link.target = "_blank";

    listItem.appendChild(link);
    videoList.appendChild(listItem);
}

// Función para verificar el estado del procesamiento al recargar la página
async function checkProcessingStatus() {
    try {
        const response = await fetch("/status"); // Llamamos al backend
        const data = await response.json();

        if (data.processing) {
            document.getElementById("processingFile").textContent = "Procesando: " + data.filename;
            document.getElementById("progressBar").value = data.progress;
        } else {
            document.getElementById("processingFile").textContent = ""; // Limpiar si no hay archivo en proceso
            document.getElementById("progressBar").value = 0;
        }
    } catch (error) {
        console.error("Error al obtener el estado del procesamiento:", error);
    }
}


// Eventos de conversión en tiempo real
socket.on("processing", (data) => {
    document.getElementById("processingFile").textContent = "Procesando: " + data.filename;
    document.getElementById("progressBar").value = 0;
});

socket.on("progress", (data) => {
    document.getElementById("progressBar").value = data.percent;
});

socket.on("completed", async (data) => {
    document.getElementById("processingFile").textContent = "Conversión completada: " + data.filename;
    document.getElementById("progressBar").value = 100;

    // Agregar el nuevo video a la lista
    addVideoLink(data.filename, data.url);
    // Verificar si hay otro archivo en proceso
    await checkProcessingStatus();
});

// Cargar lista de videos y estado de procesamiento al inicio
window.onload = async function () {
    await loadVideoList();
    await checkProcessingStatus(); // Verificar si hay un archivo en proceso
};