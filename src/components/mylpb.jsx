import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import '../styles/mylpb.css'; // Ajusta la ruta si tu CSS está en otro lugar
import { useInView } from 'react-intersection-observer';

function MylpbViewer() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    fetch("/data/MyLpb.xlsx")
      .then((res) => res.arrayBuffer())
      .then((arrayBuffer) => {
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        setData(jsonData);
        setFilteredData(jsonData);
      });
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);
    setCurrentPage(1);
    const filtered = data.filter((row) =>
      Object.values(row).some((val) =>
        String(val).toLowerCase().includes(value)
      )
    );
    setFilteredData(filtered);
  };

  const CardItem = ({ row }) => {
    const nombre = row.Nombre || "Sin nombre";
    const imagenNombre = row.Imagen ? row.Imagen + ".png" : null;
    const imagePath = imagenNombre ? `/images/${imagenNombre}` : null;
  
    const { ref, inView } = useInView({ triggerOnce: true });
  
    return (
      <div className="card" ref={ref}>
        <div className="card-image">
          {imagePath && inView ? (
            <img src={imagePath} alt={nombre} loading="lazy" />
          ) : (
            <div className="no-image">Cargando...</div>
          )}
        </div>
        <div className="card-name">{nombre}</div>
      </div>
    );
  };
  
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="excel-viewer">
      <h2>Cartas de MyLpb</h2>
      <input
        type="text"
        placeholder="Buscar carta..."
        value={searchTerm}
        onChange={handleSearch}
      />
      <div className="cards-grid">
        {currentData.map((row, index) => (
          <CardItem key={index} row={row} />
       ))}
      </div>

      <div className="pagination">
        <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
          Anterior
        </button>
        <span style={{ margin: "0 1rem" }}>
          Página {currentPage} de {totalPages}
        </span>
        <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
          Siguiente
        </button>
      </div>
    </div>
  );
}

export default MylpbViewer;
