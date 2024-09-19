import React, { useState, useEffect } from 'react';
import './App.css';

// Definimos la URL de la API utilizando una variable de entorno
// Si no está definida, se usará 'http://localhost:5000' para desarrollo local
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function App() {
  // Estado para almacenar los datos recibidos
  const [datos, setDatos] = useState([]);
  // Estado para el estado de la conexión
  const [connectionStatus, setConnectionStatus] = useState('Desconectado');
  // Estado para manejar errores
  const [error, setError] = useState(null);

  // Función para obtener datos del servidor
  const fetchData = async () => {
    try {
      // Realizamos una solicitud a la API para obtener datos
      const response = await fetch(`${API_URL}/get-data`, {
        headers: {
          // Esta línea se puede eliminar si no usas ngrok
          'ngrok-skip-browser-warning': 'true' 
        }
      });
      console.log('Respuesta del servidor:', response);
      
      // Verificamos si la respuesta es correcta
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Convertimos la respuesta a JSON
      const data = await response.json();
      console.log('Datos recibidos:', data);
      
      // Actualizamos el estado con los datos recibidos
      setDatos(data);
      setConnectionStatus('Conectado'); // Actualizamos el estado de conexión
      setError(null);
    } catch (error) {
      // Manejo de errores
      console.error('Error al obtener datos:', error);
      setConnectionStatus('Error de conexión'); // Actualizamos el estado de conexión
      setError(error.message); // Guardamos el mensaje de error
    }
  };

  useEffect(() => {
    fetchData(); // Llamamos a fetchData una vez al cargar
  }, []); // El array vacío significa que solo se ejecuta una vez

  const handleRefresh = () => {
    fetchData(); // Llama a fetchData para obtener datos nuevamente
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
      {error && <p style={{color: 'red'}}>Error: {error}</p>} {/* Mostrar error si existe */}
      <button onClick={handleRefresh}>Actualizar Datos</button>
      {datos.length === 0 ? (
        <div className="waiting-message">Esperando datos...</div> // Mensaje mientras no hay datos
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                {getHeaders().map((header, index) => (
                  <th key={index}>{header}</th> // Crear encabezados de tabla
                ))}
              </tr>
            </thead>
            <tbody>
              {datos.map((fila, index) => (
                <tr key={index}>
                  {getHeaders().map((header) => (
                    <td key={header}>{fila[header]}</td> // Crear celdas de tabla
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

export default App; // Exportar el componente App

