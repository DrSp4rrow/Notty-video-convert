# Conversor MKV a MP4

Este proyecto es una aplicación web para convertir archivos de video en formato **MKV** a **MP4**.  
Utiliza **Node.js**, **Express**, **Multer** para la subida de archivos, y **FFmpeg** a través de la biblioteca **fluent-ffmpeg** para realizar las conversiones.  
Se implementa un sistema de cola que procesa los videos en orden de subida y actualiza el progreso en tiempo real con **Socket.IO**.

## Características

- **Subida de Archivos**: Permite a los usuarios subir archivos en formato `.mkv`.
- **Cola de Procesamiento**: Procesa los archivos uno por uno en el orden en que se subieron.
- **Progreso en Tiempo Real**: Muestra barras de progreso tanto para la subida como para la conversión.
- **Archivos Convertidos**: Lista de videos convertidos disponibles para descargar.

## Captura de Pantalla

![Captura de Pantalla](https://i.imgur.com/dtNuoxA.png)

---

## Requisitos Previos

Antes de comenzar, asegúrate de tener instalado lo siguiente:

1. **Node.js**: Descarga e instala desde [nodejs.org](https://nodejs.org).
2. **FFmpeg**: Debes instalar FFmpeg en tu sistema:
   - **Linux (Debian/Ubuntu)**:
     ```bash
     sudo apt update
     sudo apt install ffmpeg
     ```
   - **Windows**:
     Descarga el ejecutable desde [FFmpeg.org](https://ffmpeg.org/download.html) y agrégalo a tu PATH.
   - **macOS**:
     ```bash
     brew install ffmpeg
     ```

---

## Instalación

1. Clona este repositorio:
   ```bash
   git clone https://github.com/tu-usuario/conversor-mkv-a-mp4.git
   ```
2. Accede al directorio del proyecto:
   ```bash
   cd conversor-mkv-a-mp4
   ```
3. Instala las dependencias:
   ```bash
   npm install
   ```

---

## Uso

1. Inicia el servidor:
   ```bash
   node server.js
   ```
2. Abre tu navegador y ve a:  
   [http://localhost:3000](http://localhost:3000)

3. Sube archivos MKV desde la interfaz web y observa el progreso de conversión.

---

## Estructura del Proyecto

```plaintext
conversor-mkv-a-mp4/
├── public/
│   ├── index.html        # Interfaz de usuario
│   ├── script.js         # Lógica del cliente
│   ├── styles.css        # Estilos de la interfaz
├── uploads/              # Carpeta para archivos subidos
├── output/               # Carpeta para archivos convertidos
├── server.js             # Lógica del servidor
├── package.json          # Dependencias y scripts del proyecto
└── README.md             # Documentación
```

---

## Tecnologías Utilizadas

- **Node.js**: Entorno de ejecución para el servidor.
- **Express.js**: Framework para manejar rutas y lógica de servidor.
- **Multer**: Middleware para la gestión de archivos subidos.
- **Fluent-ffmpeg**: Interfaz para trabajar con FFmpeg desde Node.js.
- **Socket.IO**: Comunicación en tiempo real entre cliente y servidor.
- **Unidecode**: Normalización de nombres de archivo.

---

## Comandos Principales

- Iniciar el servidor:
  ```bash
  node server.js
  ```
- Instalar dependencias:
  ```bash
  npm install
  ```

---

## Contribuciones

¡Las contribuciones son bienvenidas! Si encuentras un error o tienes una idea para mejorar el proyecto, no dudes en abrir un [issue](https://github.com/DrSp4rrow/Notty-video-convert/issues) o enviar un [pull request](https://github.com/DrSp4rrow/Notty-video-convert/pulls).

---

## Licencia

Este proyecto está bajo la licencia **MIT**. Consulta el archivo [LICENSE](LICENSE) para más información.

---

## Autor

**[DrSp4rrow](https://github.com/DrSp4rrow)**  
Desarrollador entusiasta de aplicaciones web y herramientas útiles. ✨
