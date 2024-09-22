require('dotenv').config();
// Si es necesario especificar la ruta, puedes hacerlo así:
// require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const { Client } = require('pg');
const axios = require('axios');
// Si especificaste la ruta del .env, recuerda importar 'path'
// const path = require('path');

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

    // Obtener la URL del webhook desde la variable de entorno
    const webhookUrl = process.env.N8N_WEBHOOK_URL;

    if (!webhookUrl) {
      console.error('La URL del webhook de n8n no está definida en las variables de entorno.');
      return;
    }

    // Enviar una solicitud HTTP al webhook de n8n
    await axios.post(webhookUrl, {
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

