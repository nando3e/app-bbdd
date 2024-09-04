import './App.css'; 
import React, { useState } from 'react';

function App() {
  const [consulta, setConsulta] = useState('');
  const [historial, setHistorial] = useState([]); // Guardar el historial de consultas y respuestas

  // Función para manejar el envío de la consulta
  const enviarConsulta = async () => {
    if (consulta.trim() === '') {
      return; // No hacer nada si el campo de consulta está vacío
    }

    // Agregar la consulta al historial antes de hacer la petición
    setHistorial((prevHistorial) => [
      ...prevHistorial,
      { tipo: 'usuario', mensaje: consulta }
    ]);

    try {
      const response = await fetch('https://primary-production-09ef.up.railway.app/webhook-test/linea1', { // Cambia por tu URL de webhook
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ consulta }),
      });

      // Revisar si el contenido es JSON o texto
      const contentType = response.headers.get('content-type');
      let result;

      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
        // Asegurarse de que el campo "output" exista
        if (result.output) {
          setHistorial((prevHistorial) => [
            ...prevHistorial,
            { tipo: 'backend', mensaje: result.output }
          ]);
        } else {
          setHistorial((prevHistorial) => [
            ...prevHistorial,
            { tipo: 'backend', mensaje: 'No se obtuvo respuesta en el campo "output".' }
          ]);
        }
      } else {
        // Si no es JSON, lo tratamos como texto plano
        result = await response.text();
        setHistorial((prevHistorial) => [
          ...prevHistorial,
          { tipo: 'backend', mensaje: result }
        ]);
      }
    } catch (error) {
      console.error('Error al enviar la consulta:', error);
      setHistorial((prevHistorial) => [
        ...prevHistorial,
        { tipo: 'backend', mensaje: 'Error al procesar la consulta.' }
      ]);
    } finally {
      setConsulta(''); // Limpiar el input después de enviar
    }
  };

  // Función para manejar la tecla Enter
  const manejarEnter = (e) => {
    if (e.key === 'Enter') {
      enviarConsulta(); // Si se presiona Enter, se envía la consulta
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">Chatbot SQL en Tiempo Real</div>

      <div className="chatbox">
        {/* Mostrar el historial de mensajes */}
        {historial.map((item, index) => (
          <div
            key={index}
            className={`mensaje ${item.tipo === 'usuario' ? 'usuario' : 'backend'}`}
          >
            {item.mensaje}
          </div>
        ))}
      </div>

      <div className="input-area">
        <input
          type="text"
          id="consulta"
          value={consulta}
          onChange={(e) => setConsulta(e.target.value)}
          onKeyDown={manejarEnter}
          placeholder="Escribe tu consulta..."
        />
        <button onClick={enviarConsulta}>Enviar</button>
      </div>
    </div>
  );
}

export default App;
