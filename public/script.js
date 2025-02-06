const socket = io();

// Subir archivo
document.getElementById("uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fileInput = document.getElementById("fileInput").files[0];
  if (!fileInput) return alert("Seleccione un archivo MKV");

  const formData = new FormData();
  formData.append("video", fileInput);

  const xhr = new XMLHttpRequest();
  xhr.open("POST", "/upload", true);

  // Actualizar progreso de subida
  xhr.upload.onprogress = (event) => {
    if (event.lengthComputable) {
      const percent = Math.floor((event.loaded / event.total) * 100);
      document.getElementById("uploadProgressBar").style.width = `${percent}%`;
    }
  };

  // Cuando finaliza la subida
  xhr.onload = () => {
    if (xhr.status === 200) {
      document.getElementById("uploadProgressBar").style.width = "100%";
      setTimeout(() => {
        document.getElementById("uploadProgressBar").style.width = "0%";
      }, 1000);
    } else {
      alert("Error al subir archivo.");
    }
  };

  xhr.send(formData);
});

// Actualizar progreso de conversión
socket.on("conversionProgress", ({ file, progress }) => {
  let bar = document.getElementById(file);
  if (!bar) {
    bar = document.createElement("div");
    bar.id = file;
    bar.classList.add("progress-bar");
    document.getElementById("progressContainer").appendChild(bar);
  }
  bar.style.width = `${progress}%`;
});

// Agregar video convertido a la lista
socket.on("conversionComplete", (filename) => {
  // Eliminar barra de progreso del archivo procesado
  const bar = document.getElementById(filename);
  if (bar) {
    bar.remove();
  }
  const listItem = document.createElement("li");
  listItem.innerHTML = `<a href="/output/${filename}" target="_blank">${filename}</a>`;
  document.getElementById("videoList").appendChild(listItem);
});

// Cuando la página carga, pedir la cola actual al servidor
socket.on("queueUpdate", (queue) => {
  const queueList = document.getElementById("queueList");
  queueList.innerHTML = queue.map((file) => `<li>${file}</li>`).join("");
});

// Pedir la cola actual al recargar la página
socket.emit("requestQueue");

socket.on("currentProcessing", (file) => {
  document.getElementById("currentFile").textContent = file || "Ninguno";
});

// Cargar lista de videos al inicio
async function loadVideos() {
  const res = await fetch("/videos");
  const files = await res.json();
  const videoList = document.getElementById("videoList");
  videoList.innerHTML = files
    .map(
      (file) => `<li><a href="/output/${file}" target="_blank">${file}</a></li>`
    )
    .join("");
}
loadVideos();
