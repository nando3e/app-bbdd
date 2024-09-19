require('dotenv').config();
//console.log('DB_HOST:', process.env.DB_HOST);

const { Client } = require('pg');
const axios = require('axios');

const client = new Client({
  user: process.env.DB_USER, // Usar variables de entorno
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD, 
  port: process.env.DB_PORT,
});

client.connect();

// Escuchar el canal de notificaciones
client.query('LISTEN evento_cambio');

client.on('notification', async (msg) => {
  try {
    // Desglose del mensaje de notificación
    const [operacion, tabla] = msg.payload.split(',');
    if (!operacion || !tabla) {
      console.error('Formato de notificación incorrecto:', msg.payload);
      return;
    }

    // Enviar una solicitud HTTP al webhook de n8n
    await axios.post('https://primary-production-09ef.up.railway.app/webhook/line1', {
      tabla: tabla,
      operacion: operacion,
    });

    console.log(`Notificación enviada para tabla: ${tabla}, operación: ${operacion}`);
  } catch (error) {
    console.error('Error al enviar la notificación:', error);
  }
});

client.on('error', (err) => {
  console.error('Error en la conexión a la base de datos:', err);
  // Aquí puedes implementar lógica para reconectar si es necesario
});
