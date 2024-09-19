const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

let datosTabla = [];

app.get('/', (req, res) => {
    res.send('Servidor funcionando correctamente');
});

app.post('/receive-data', (req, res) => {
    console.log('Datos recibidos en el backend:', req.body);

    // 1. Verificar si es una notificación de cambio (INSERT, UPDATE, DELETE)
    if (req.body.tipoNotificacion === 'cambio' && req.body.tabla && req.body.operacion) {
        console.log(`Cambio detectado en la tabla ${req.body.tabla} con operación ${req.body.operacion}`);
        // Lógica para actualizar los datos locales si es necesario
        // Aquí puedes, por ejemplo, marcar un estado que fuerce una actualización en el frontend
        return res.json({ message: 'Notificación de cambio recibida' });
    }

    // 2. Manejar datos de SELECT (caso actual)
    if (Array.isArray(req.body.datos)) {
        datosTabla = req.body.datos;
        console.log('Datos guardados:', datosTabla);
        return res.json({ message: 'Datos recibidos y guardados correctamente' });
    } else {
        // Si la solicitud no coincide con ninguno de los casos, retorna un error
        return res.status(400).json({ error: 'Formato de datos incorrecto' });
    }
});

app.get('/get-data', (req, res) => {
    console.log('Solicitud recibida en /get-data');
    console.log('Enviando datos:', datosTabla);
    res.json(datosTabla);
});

// Manejador de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Algo salió mal!' });
});

const PORT = process.env.PORT || 5000; // Usa el puerto de la variable de entorno o 5000 por defecto
app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
