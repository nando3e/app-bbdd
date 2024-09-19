import React, { useState, useEffect } from 'react';
import './App.css';

// Usar la variable de entorno para la URL base del backend
const API_URL = process.env.REACT_APP_API_URL;

function App() {
  const [datos, setDatos] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('Desconectado');
  const [error, setError] = useState(null);

  // Función para obtener los datos del backend
  const fetchData = async () => {
    try {
      const response = await fetch(`${API_URL}/get-data`, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });
      console.log('Respuesta del servidor:', response);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Datos recibidos:', data);
      
      setDatos(data);
      setConnectionStatus('Conectado');
      setError(null);
    } catch (error) {
      console.error('Error al obtener datos:', error);
      setConnectionStatus('Error de conexión');
      setError(error.message);
    }
  };

  // Obtener los datos automáticamente cada 5 segundos
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Función para refrescar los datos manualmente
  const handleRefresh = () => {
    fetchData();
  };

  // Obtener los encabezados dinámicamente
  const getHeaders = () => {
    if (datos.length > 0) {
      return Object.keys(datos[0]); // Obtener las claves del primer objeto
    }
    return [];
  };

  return (
    <div className="container">
      <h1>Datos Recibidos</h1>
      <p>Estado de la conexión: {connectionStatus}</p>
      {error && <p style={{color: 'red'}}>Error: {error}</p>}
      <button onClick={handleRefresh}>Actualizar Datos</button>
      {datos.length === 0 ? (
        <div className="waiting-message">Esperando datos...</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                {getHeaders().map((header, index) => (
                  <th key={index}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {datos.map((fila, index) => (
                <tr key={index}>
                  {getHeaders().map((header) => (
                    <td key={header}>{fila[header]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;
