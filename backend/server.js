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
    if (Array.isArray(req.body.datos)) {
        datosTabla = req.body.datos;
        console.log('Datos guardados:', datosTabla);
        res.json({ message: 'Datos recibidos y guardados correctamente' });
    } else {
        res.status(400).json({ error: 'Formato de datos incorrecto' });
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

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
