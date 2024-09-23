import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import io from 'socket.io-client';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function App() {
  const [datos, setDatos] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Desconnectat');
  const [error, setError] = useState(null);
  const [selecting, setSelecting] = useState(false);
  const [selectedCells, setSelectedCells] = useState([]);
  const [startCell, setStartCell] = useState(null);

  // Estados para el autoscroll
  const [scrollDirection, setScrollDirection] = useState({ vertical: null, horizontal: null });
  const scrollInterval = useRef(null);

  // Posición del mouse
  const mousePosition = useRef({ x: 0, y: 0 });

  const tableRef = useRef(null);

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

  useEffect(() => {
    fetchData();

    const socket = io(API_URL);

    socket.on('dataUpdated', () => {
      fetchData();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleRefresh = () => {
    fetchData();
  };

  // Función para actualizar la selección
  const updateSelection = (rowIndex, cellIndex) => {
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
  };

  const handleMouseDown = (e, rowIndex, cellIndex) => {
    e.preventDefault(); // Previene la selección de texto
    setSelecting(true);
    setStartCell({ rowIndex, cellIndex });
    setSelectedCells([{ rowIndex, cellIndex }]);
  };

  const handleMouseEnter = (rowIndex, cellIndex) => {
    if (selecting) {
      updateSelection(rowIndex, cellIndex);
    }
  };

  const handleMouseMove = (e) => {
    if (selecting) {
      mousePosition.current = { x: e.clientX, y: e.clientY };

      const tableRect = tableRef.current.getBoundingClientRect();
      const offsetY = e.clientY - tableRect.top;
      const offsetX = e.clientX - tableRect.left;

      // Distancia en píxeles desde los bordes para iniciar el autoscroll
      const edgeThreshold = 100; // Aumentado para permitir movimientos rápidos

      let verticalDirection = null;
      let horizontalDirection = null;

      if (offsetY < edgeThreshold) {
        verticalDirection = 'up';
      } else if (offsetY > tableRect.height - edgeThreshold) {
        verticalDirection = 'down';
      }

      if (offsetX < edgeThreshold) {
        horizontalDirection = 'left';
      } else if (offsetX > tableRect.width - edgeThreshold) {
        horizontalDirection = 'right';
      }

      if (verticalDirection || horizontalDirection) {
        startAutoScroll(verticalDirection, horizontalDirection);
      } else {
        stopAutoScroll();
      }

      // Actualizar la selección mientras se mueve el mouse
      updateSelectionFromPoint(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = () => {
    setSelecting(false);
    stopAutoScroll();
  };

  const updateSelectionFromPoint = (x, y) => {
    const elements = document.elementsFromPoint(x, y);
    const cellElement = elements.find((el) => el.tagName === 'TD');

    if (cellElement) {
      const rowIndex = cellElement.parentElement.rowIndex - 1; // Restar 1 si tienes un thead
      const cellIndex = cellElement.cellIndex;
      updateSelection(rowIndex, cellIndex);
    }
  };

  const startAutoScroll = (verticalDirection, horizontalDirection) => {
    if (
      scrollDirection.vertical !== verticalDirection ||
      scrollDirection.horizontal !== horizontalDirection
    ) {
      setScrollDirection({ vertical: verticalDirection, horizontal: horizontalDirection });

      if (scrollInterval.current) {
        clearInterval(scrollInterval.current);
      }

      scrollInterval.current = setInterval(() => {
        if (tableRef.current) {
          const scrollOptions = { top: 0, left: 0, behavior: 'auto' };

          if (verticalDirection === 'up') {
            scrollOptions.top = -20;
            mousePosition.current.y -= 20;
          } else if (verticalDirection === 'down') {
            scrollOptions.top = 20;
            mousePosition.current.y += 20;
          }

          if (horizontalDirection === 'left') {
            scrollOptions.left = -20;
            mousePosition.current.x -= 20;
          } else if (horizontalDirection === 'right') {
            scrollOptions.left = 20;
            mousePosition.current.x += 20;
          }

          tableRef.current.scrollBy(scrollOptions);

          updateSelectionFromPoint(mousePosition.current.x, mousePosition.current.y);
        }
      }, 30); // Intervalo reducido para mayor sensibilidad
    }
  };

  const stopAutoScroll = () => {
    setScrollDirection({ vertical: null, horizontal: null });
    if (scrollInterval.current) {
      clearInterval(scrollInterval.current);
      scrollInterval.current = null;
    }
  };

  const copySelectedCells = useCallback(() => {
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
  }, [selectedCells, datos]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        copySelectedCells();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [copySelectedCells]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (tableRef.current && !tableRef.current.contains(e.target)) {
        setSelectedCells([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
      {datos && datos.length > 0 ? (
        <div
          className="table-container"
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onMouseMove={handleMouseMove}
          ref={tableRef}
        >
          <table>
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

