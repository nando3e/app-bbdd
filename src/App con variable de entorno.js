import React, { useState } from 'react';
import './App.css';

function App() {
  const [consulta, setConsulta] = useState('');
  const [historial, setHistorial] = useState([]);
  const [resultados, setResultados] = useState([]);
  const [columnas, setColumnas] = useState([]);

  // Función para manejar el envío de la consulta
  const enviarConsulta = async () => {
    if (consulta.trim() === '') return;

    // Agregar consulta al historial
    setHistorial((prev) => [...prev, { tipo: 'usuario', mensaje: consulta }]);

    try {
      // Enviar solicitud al webhook de producción
      const response = await fetch('https://primary-production-09ef.up.railway.app/webhook/linea1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consulta }),
      });

      // Obtener tipo de contenido de la respuesta
      const contentType = response.headers.get('content-type');
      let result;

      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor');
      }

      // Si la respuesta es JSON
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
        console.log('Respuesta JSON recibida:', result);

        if (Array.isArray(result)) {
          setResultados(result);
          setColumnas(Object.keys(result[0] || {})); // Manejar caso sin columnas
        } else {
          setHistorial((prev) => [
            ...prev,
            { tipo: 'backend', mensaje: 'No se obtuvo respuesta válida.' },
          ]);
          setResultados([]); // Resetear resultados en caso de error
          setColumnas([]);
        }
      } else {
        // Si es una respuesta de texto
        result = await response.text();
        setHistorial((prev) => [...prev, { tipo: 'backend', mensaje: result }]);
      }
    } catch (error) {
      console.error('Error al enviar la consulta:', error);
      setHistorial((prev) => [
        ...prev,
        { tipo: 'backend', mensaje: 'Error al procesar la consulta.' },
      ]);
      setResultados([]);
      setColumnas([]);
    } finally {
      setConsulta(''); // Limpiar input después de enviar
    }
  };

  // Función para manejar la respuesta de resultados
  const manejarResultados = async () => {
    try {
      const response = await fetch('https://0ae8-139-47-34-109.ngrok-free.app/results');
      const data = await response.json();
      setResultados(data);
      setColumnas(Object.keys(data[0] || {})); // Asignar las columnas
    } catch (error) {
      console.error('Error al obtener los resultados:', error);
    }
  };

  // Función para manejar el estado de la operación
  const manejarEstado = async () => {
    try {
      const response = await fetch('https://0ae8-139-47-34-109.ngrok-free.app/status');
      const data = await response.text();
      setHistorial((prev) => [...prev, { tipo: 'backend', mensaje: data }]);
    } catch (error) {
      console.error('Error al obtener el estado:', error);
    }
  };

  // Manejar tecla Enter
  const manejarEnter = (e) => {
    if (e.key === 'Enter') {
      enviarConsulta();
    }
  };

  return (
    <div className="main-container">
      {/* Tabla de resultados */}
      <div className="resultados-container">
        {resultados.length > 0 ? (
          <table border="1">
            <thead>
              <tr>{columnas.map((columna, index) => <th key={index}>{columna}</th>)}</tr>
            </thead>
            <tbody>
              {resultados.map((fila, index) => (
                <tr key={index}>
                  {columnas.map((columna, colIndex) => (
                    <td key={colIndex}>{fila[columna]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No hay resultados</p>
        )}
      </div>

      {/* Chat emergente */}
      <div className="chat-container">
        <div className="chat-header">Chatbot SQL</div>

        <div className="chatbox">
          {historial.map((item, index) => (
            <div key={index} className={`mensaje ${item.tipo === 'usuario' ? 'usuario' : 'backend'}`}>
              {item.mensaje}
            </div>
          ))}
        </div>

        <div className="input-area">
          <input
            type="text"
            value={consulta}
            onChange={(e) => setConsulta(e.target.value)}
            onKeyDown={manejarEnter}
            placeholder="Escribe tu consulta..."
          />
          <button onClick={enviarConsulta}>Enviar</button>
          <button onClick={manejarResultados}>Ver Resultados</button>
          <button onClick={manejarEstado}>Ver Estado</button>
        </div>
      </div>
    </div>
  );
}

export default App;
