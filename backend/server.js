const express = require('express');
const cors = require('cors');
const path = require('path'); // Importamos 'path' para manejar rutas de archivos

require('dotenv').config();

const app = express();

// IMPORTAR MÓDULOS NECESARIOS PARA SOCKET.IO
const http = require('http');
const socketIo = require('socket.io');

// CREAR SERVIDOR HTTP
const server = http.createServer(app);

// CONFIGURAR SOCKET.IO
const io = socketIo(server, {
  cors: {
    origin: '*', // DEBERÍAS REEMPLAZAR '*' POR LA URL DE TU FRONTEND EN PRODUCCIÓN
    methods: ['GET', 'POST'],
  },
});

// Configurar CORS para permitir solicitudes desde el frontend
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:3000'];

app.use(
  cors({
    origin: function (origin, callback) {
      // Permitir solicitudes sin origen (como aplicaciones móviles o curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        var msg =
          'The CORS policy for this site does not allow access from the specified Origin.';
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
  })
);

app.use(express.json());

let datosTabla = [];

// Servir los archivos estáticos del build de React
app.use(express.static(path.join(__dirname, '../build'))); // Cambia '../build' por la ruta correcta según tu estructura

// Endpoint para verificar si el servidor está corriendo
app.get('/', (req, res) => {
  res.send('Servidor funcionando correctamente en producción');
});

// Endpoint para recibir los datos desde n8n
app.post('/receive-data', (req, res) => {
  console.log('Datos recibidos en el backend:', req.body);

  // 1. Verificar si es una notificación de cambio (INSERT, UPDATE, DELETE)
  if (req.body.tipoNotificacion === 'cambio' && req.body.tabla && req.body.operacion) {
    console.log(
      `Cambio detectado en la tabla ${req.body.tabla} con operación ${req.body.operacion}`
    );
    return res.json({ message: 'Notificación de cambio recibida' });
  }

  // 2. Manejar datos de SELECT (caso actual)
  if (Array.isArray(req.body.datos)) {
    datosTabla = req.body.datos;
    console.log('Datos guardados:', datosTabla);

    // EMITIR EVENTO 'dataUpdated' A LOS CLIENTES CONECTADOS
    io.emit('dataUpdated');

    return res.json({ message: 'Datos recibidos y guardados correctamente' });
  } else {
    return res.status(400).json({ error: 'Formato de datos incorrecto' });
  }
});

// Endpoint para enviar los datos al frontend
app.get('/get-data', (req, res) => {
  console.log('Solicitud recibida en /get-data');
  console.log('Enviando datos:', datosTabla);
  res.json(datosTabla);
});

// Ruta para servir el index.html de React
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html')); // Asegúrate de que '../build' sea la ruta correcta
});

// Manejador de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo salió mal!' });
});

// ESCUCHAR CONEXIONES DE SOCKET.IO
io.on('connection', (socket) => {
  console.log('Nuevo cliente conectado');

  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});

// Configurar el puerto asignado por Railway
const PORT = process.env.PORT || 5000;

// CAMBIAR app.listen POR server.listen
server.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
