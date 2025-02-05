const socket = io();
const fileInput = document.getElementById("fileInput");
const uploadButton = document.getElementById("uploadButton");
const uploadProgressBar = document.getElementById("uploadProgressBar");
const processingProgressBar = document.getElementById("processingProgressBar");
const statusMessage = document.getElementById("statusMessage");

uploadButton.addEventListener("click", () => {
  const file = fileInput.files[0];

  if (!file) {
    alert("Por favor, selecciona un archivo.");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  const xhr = new XMLHttpRequest();
  xhr.open("POST", "/upload", true);

  xhr.upload.onprogress = (event) => {
    if (event.lengthComputable) {
      const percentComplete = Math.round((event.loaded / event.total) * 100);
      uploadProgressBar.style.width = `${percentComplete}%`;
      uploadProgressBar.textContent = `${percentComplete}%`;
    }
  };

  xhr.onload = () => {
    if (xhr.status === 200) {
      statusMessage.textContent = "Archivo subido correctamente. Procesando...";
    } else {
      statusMessage.textContent = "Error al subir el archivo.";
    }
  };

  xhr.onerror = () => {
    statusMessage.textContent = "Error de red durante la subida.";
  };

  xhr.send(formData);
});

// Escuchar eventos de conversión en tiempo real
socket.on("fileStateUpdate", ({ fileName, state }) => {
  statusMessage.textContent = `Archivo: ${fileName} - Estado: ${state.status} (${state.progress}%)`;

  if (state.status === "procesando") {
    processingProgressBar.style.width = `${state.progress}%`;
    processingProgressBar.textContent = `${state.progress}%`;
  }

  if (state.status === "completado") {
    processingProgressBar.style.width = "100%";
    processingProgressBar.textContent = "100%";
  }
});

// Obtener el estado inicial al cargar la página
window.addEventListener("load", () => {
  fetch("/file-states")
    .then((response) => response.json())
    .then((states) => {
      Object.keys(states).forEach((fileName) => {
        const state = states[fileName];
        statusMessage.textContent = `Archivo: ${fileName} - Estado: ${state.status} (${state.progress}%)`;

        if (state.status === "procesando") {
          processingProgressBar.style.width = `${state.progress}%`;
          processingProgressBar.textContent = `${state.progress}%`;
        }

        if (state.status === "completado") {
          processingProgressBar.style.width = "100%";
          processingProgressBar.textContent = "100%";
        }
      });
    });
});
