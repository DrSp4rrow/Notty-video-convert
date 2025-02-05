const socket = io();

document.getElementById("uploadButton").addEventListener("click", () => {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];

  if (!file) {
    alert("Por favor, selecciona un archivo.");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  const xhr = new XMLHttpRequest();
  xhr.open("POST", "/upload", true);

  // Actualizar la barra de progreso de subida
  xhr.upload.onprogress = (event) => {
    if (event.lengthComputable) {
      const percentComplete = (event.loaded / event.total) * 100;
      const progressBar = document.getElementById("progressBar");
      progressBar.style.width = percentComplete + "%";
    }
  };

  // Manejar la respuesta del servidor
  xhr.onload = () => {
    const statusText = document.getElementById("status");
    if (xhr.status === 200) {
      statusText.textContent = "Archivo subido con éxito.";
    } else {
      statusText.textContent = "Error al subir el archivo.";
    }
    document.getElementById("progressBar").style.width = "0%";
  };

  xhr.send(formData);
});

// Escuchar actualizaciones de conversión
socket.on("conversionProgress", (data) => {
  const conversionProgressBar = document.getElementById("conversionProgressBar");
  const progress = parseInt(data.frame) % 100; // Muestra el progreso relativo
  conversionProgressBar.style.width = progress + "%";
});

socket.on("conversionComplete", (data) => {
  const conversionStatus = document.getElementById("conversionStatus");
  conversionStatus.textContent = `Conversión completada: ${data.fileName}`;
  document.getElementById("conversionProgressBar").style.width = "0%";
});

socket.on("conversionError", (data) => {
  const conversionStatus = document.getElementById("conversionStatus");
  conversionStatus.textContent = `Error al convertir: ${data.fileName}`;
});
