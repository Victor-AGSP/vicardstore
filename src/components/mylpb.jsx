import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import '../styles/mylpb.css';
import { useInView } from 'react-intersection-observer';
import { useNavigate } from "react-router-dom";

// Función para eliminar acentos/tildes
const removeAccents = (str) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

function MylpbViewer() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRaza, setSelectedRaza] = useState("");
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

  useEffect(() => {
    const filtered = data.filter((row) => {
      const nombre = removeAccents((row.Nombre || "").toLowerCase());
      const raza = removeAccents((row.Raza || "").toLowerCase());
      const term = removeAccents(searchTerm);
      const selected = removeAccents(selectedRaza.toLowerCase());

      const matchesNombre = nombre.includes(term);
      const matchesRaza = selected === "" || raza === selected;

      return matchesNombre && matchesRaza;
    });

    setFilteredData(filtered);
    setCurrentPage(1);
  }, [searchTerm, selectedRaza, data]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const handleRazaChange = (e) => {
    setSelectedRaza(e.target.value);
  };

  const CardItem = ({ row }) => {
    const nombre = row.Nombre || "Sin nombre";
    const imagenNombre = row.Imagen ? row.Imagen + ".webp" : null;
    const imagePath = imagenNombre ? `/images/${imagenNombre}` : null;

    const { ref, inView } = useInView({ triggerOnce: true });
    const navigate = useNavigate();

    const handleClick = () => {
      navigate("/"); // Cambia la ruta si deseas
    };

    return (
      <div className="card" ref={ref} onClick={handleClick}>
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

  const uniqueRazas = [...new Set(data.map(row => row.Raza).filter(Boolean))];

  return (
    <div className="excel-viewer">
      <h2>Cartas de MyLpb</h2>

      <div className="filters">
        <input
          type="text"
          placeholder="Buscar carta por nombre..."
          value={searchTerm}
          onChange={handleSearch}
        />

        <select value={selectedRaza} onChange={handleRazaChange}>
          <option value="">Todas las razas</option>
          {uniqueRazas.map((raza, index) => (
            <option key={index} value={raza}>{raza}</option>
          ))}
        </select>
      </div>

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
