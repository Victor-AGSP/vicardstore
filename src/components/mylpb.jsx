import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import '../styles/mylpb.css';
import { useInView } from 'react-intersection-observer';
import { useNavigate } from "react-router-dom";

// Elimina acentos
const removeAccents = (str) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

function MylpbViewer() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRaza, setSelectedRaza] = useState("-");
  const [selectedEdicion, setSelectedEdicion] = useState("-");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLeyenda, setSelectedLeyenda] = useState("-");
  const itemsPerPage = 30;

  // Razas y ediciones definidas manualmente
  const razasDisponibles = ["-", "Olímpico", "Titán", "Héroe", "Eterno", "Faraón", "Sacerdote", "Defensor", "Desafiante", "Sombra", "Dragón", "Faerie", "Caballero"];
  const edicionesDisponibles = [
    { label: "Todos los artes", value: "-" },
    { label: "Helénica", value: "He" },
    { label: "Dominio de Ra", value: "Dr" },
    { label: "Hijos de Daana", value: "Hd" },
    { label: "Espada Sagrada", value: "Es" },
    { label: "Drácula", value: "Dc" },
  ];

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
      const edicion = removeAccents((row.Edicion || "").toLowerCase());
      const leyenda = (row.Extra || "").trim();
      const term = removeAccents(searchTerm);
      const selectedR = removeAccents(selectedRaza.toLowerCase());
      const selectedE = removeAccents(selectedEdicion.toLowerCase());

      const matchesNombre = nombre.includes(term);
      const matchesRaza = selectedR === "-" || selectedR === "" || raza === selectedR;
      const matchesEdicion = selectedE === "-" || selectedE === "" || edicion === selectedE;
      const matchesLeyenda =
        selectedLeyenda === "-" ||
        leyenda === selectedLeyenda;

      return matchesNombre && matchesRaza && matchesEdicion && matchesLeyenda;
    });

    setFilteredData(filtered);
    setCurrentPage(1);
  }, [searchTerm, selectedRaza, selectedEdicion, selectedLeyenda, data]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const handleRazaChange = (e) => {
    setSelectedRaza(e.target.value);
  };

  const handleEdicionChange = (e) => {
    setSelectedEdicion(e.target.value);
  };

  const CardItem = ({ row }) => {
    const nombre = row.Nombre || "Sin nombre";
    const leyenda = row.Extra ? row.Extra : null;
    const imagenNombre = row.Imagen ? row.Imagen + ".webp" : null;
    const imagePath = imagenNombre ? `/images/${imagenNombre}` : null;

    const { ref, inView } = useInView({ triggerOnce: true });
    const navigate = useNavigate();

    const handleClick = () => {
      navigate("/"); // Puedes cambiar esta ruta
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
        <div className="card-name">
          {nombre}
          {leyenda ? ` - ${leyenda}` : ""}
        </div>
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

      <div className="filters">
        <input
          type="text"
          placeholder="Buscar carta por nombre..."
          value={searchTerm}
          onChange={handleSearch}
        />

        <select value={selectedRaza} onChange={handleRazaChange}>
          {razasDisponibles.map((raza, index) => (
            <option key={index} value={raza}>
              {raza === "-" ? "Todas las razas" : raza}
            </option>
          ))}
        </select>

        <select value={selectedLeyenda} onChange={e => setSelectedLeyenda(e.target.value)}>
          <option value="-">Todas las leyendas</option>
          <option value="Epoca Salo">Salo</option>
          <option value="JO">Juego Organizado</option>
          <option value="Foil Lluvia">Foil Lluvia</option>
        </select>

        <select value={selectedEdicion} onChange={handleEdicionChange}>
          {edicionesDisponibles.map((edicion, index) => (
            <option key={index} value={edicion.value}>
              {edicion.label}
            </option>
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
