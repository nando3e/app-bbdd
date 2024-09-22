import React, { useState, useEffect, useMemo } from 'react';
import { useTable } from 'react-table';
import './App.css';

// Usar la variable de entorno para la URL base del backend
const API_URL = process.env.REACT_APP_API_URL;

function App() {
  const [datos, setDatos] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('Desconnectat');
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
      setConnectionStatus('Connectat');
      setError(null);
    } catch (error) {
      console.error('Error al obtener datos:', error);
      setConnectionStatus('Error de conexión');
      setError(error.message);
    }
  };

  // Obtener los datos
  useEffect(() => {
    fetchData(); // Solo se llama al cargar el componente
  }, []);

  // Función para refrescar los datos manualmente
  const handleRefresh = () => {
    fetchData(); // Actualización manual
  };

  // Obtener los encabezados dinámicamente
  const columns = useMemo(() => {
    if (datos.length === 0) return [];
    return Object.keys(datos[0]).map(key => ({
      Header: key,
      accessor: key,
    }));
  }, [datos]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({ columns, data: datos });

  return (
    <div className="container">
      <h1>Furniture Ai - Consultes</h1>
      <p>Estat de la connexió: {connectionStatus}</p>
      {error && <p style={{color: 'red'}}>Error: {error}</p>}
      <button onClick={handleRefresh}>Actualitzar manualment</button>
      {datos.length === 0 ? (
        <div className="waiting-message">Esperant dades...</div>
      ) : (
        <div className="table-container">
          <table {...getTableProps()}>
            <thead>
              {headerGroups.map(headerGroup => (
                <tr {...headerGroup.getHeaderGroupProps()}>
                  {headerGroup.headers.map(column => (
                    <th {...column.getHeaderProps()}>{column.render('Header')}</th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody {...getTableBodyProps()}>
              {rows.map(row => {
                prepareRow(row);
                return (
                  <tr {...row.getRowProps()}>
                    {row.cells.map(cell => (
                      <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;
