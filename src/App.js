import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// IMPORTAR SOCKET.IO-CLIENT
import io from 'socket.io-client';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function App() {
  const [datos, setDatos] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Desconnectat');
  const [error, setError] = useState(null);
  const [selecting, setSelecting] = useState(false);
  const [selectedCells, setSelectedCells] = useState([]);
  const [startCell, setStartCell] = useState(null);

  const tableRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch(`${API_URL}/get-data`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setDatos(data);
      setConnectionStatus('Connectat');
      setError(null);
    } catch (error) {
      setConnectionStatus('Error de conexión');
      setError(error.message);
    }
  };

  const handleRefresh = () => {
    fetchData();
  };

  const handleMouseDown = (e, rowIndex, cellIndex) => {
    e.preventDefault(); // Previene la selección de texto
    setSelecting(true);
    setStartCell({ rowIndex, cellIndex });
    setSelectedCells([{ rowIndex, cellIndex }]);
  };

  const handleMouseEnter = (rowIndex, cellIndex) => {
    if (selecting) {
      const minRow = Math.min(startCell.rowIndex, rowIndex);
      const maxRow = Math.max(startCell.rowIndex, rowIndex);
      const minCell = Math.min(startCell.cellIndex, cellIndex);
      const maxCell = Math.max(startCell.cellIndex, cellIndex);

      const newSelectedCells = [];
      for (let i = minRow; i <= maxRow; i++) {
        for (let j = minCell; j <= maxCell; j++) {
          newSelectedCells.push({ rowIndex: i, cellIndex: j });
        }
      }
      setSelectedCells(newSelectedCells);
    }
  };

  const handleMouseUp = () => {
    setSelecting(false);
  };

  const copySelectedCells = () => {
    if (selectedCells.length === 0 || !datos) {
      alert('No hay celdas seleccionadas');
      return;
    }

    const keys = Object.keys(datos[0]);

    // Obtener los límites de filas y columnas seleccionadas
    const rows = selectedCells.map((cell) => cell.rowIndex);
    const cols = selectedCells.map((cell) => cell.cellIndex);
    const minRow = Math.min(...rows);
    const maxRow = Math.max(...rows);
    const minCol = Math.min(...cols);
    const maxCol = Math.max(...cols);

    let copyText = '';

    for (let i = minRow; i <= maxRow; i++) {
      const rowValues = [];
      for (let j = minCol; j <= maxCol; j++) {
        // Verificar si la celda está seleccionada
        const isSelected = selectedCells.some(
          (cell) => cell.rowIndex === i && cell.cellIndex === j
        );
        if (isSelected) {
          rowValues.push(datos[i][keys[j]]);
        } else {
          rowValues.push(''); // Celda vacía si no está seleccionada
        }
      }
      copyText += rowValues.join('\t') + '\n';
    }

    navigator.clipboard
      .writeText(copyText.trim())
      .then(() => {
        alert('Celdas seleccionadas copiadas al portapapeles');
      })
      .catch((err) => {
        console.error('Error al copiar: ', err);
      });
  };

  // Añadir listener para Ctrl+C o Command+C
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        copySelectedCells();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Limpiar el listener al desmontar el componente
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedCells]); // Dependencia de selectedCells

  // Añadir listener para detectar clic fuera de la tabla y limpiar selección
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (tableRef.current && !tableRef.current.contains(e.target)) {
        setSelectedCells([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    // Limpiar el listener al desmontar el componente
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // CONECTARSE AL SERVIDOR DE SOCKET.IO Y ESCUCHAR EL EVENTO 'dataUpdated'
  useEffect(() => {
    const socket = io(API_URL);

    socket.on('dataUpdated', () => {
      fetchData();
    });

    // LIMPIAR LA CONEXIÓN DE SOCKET AL DESMONTAR EL COMPONENTE
    return () => {
      socket.disconnect();
    };
  }, []); // EJECUTAR SOLO AL MONTAR EL COMPONENTE

  return (
    <div className="App">
      <h1>Furniture Ai - Consultes</h1>
      <p>Estat de la connexió: {connectionStatus}</p>
      {error && <p className="error">{error}</p>}
      <div className="button-container">
        <button onClick={handleRefresh} className="refresh-button">
          Actualitzar manualment
        </button>
        <button onClick={copySelectedCells} className="copy-button">
          Copiar selecció
        </button>
      </div>
      {datos ? (
        <div
          className="table-container"
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <table ref={tableRef}>
            <thead>
              <tr>
                {Object.keys(datos[0]).map((key) => (
                  <th key={key}>{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {datos.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {Object.values(row).map((value, cellIndex) => (
                    <td
                      key={cellIndex}
                      onMouseDown={(e) => handleMouseDown(e, rowIndex, cellIndex)}
                      onMouseEnter={() => handleMouseEnter(rowIndex, cellIndex)}
                      onMouseUp={handleMouseUp}
                      className={
                        selectedCells.some(
                          (cell) =>
                            cell.rowIndex === rowIndex && cell.cellIndex === cellIndex
                        )
                          ? 'selected'
                          : ''
                      }
                    >
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>Esperant dades...</p>
      )}
    </div>
  );
}

export default App;
