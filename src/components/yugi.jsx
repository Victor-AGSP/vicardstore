import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import '../styles/yugi.css';

function ExcelViewer() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  function extractMiddleCodeFromEnd(text) {
    if (!text) return "";
    const parts = text.split(" - ");

    if (parts.length < 2) return "";

    return parts[parts.length - 2];
  }

  useEffect(() => {
    fetch("/data/yugi.xlsx")
      .then((res) => res.arrayBuffer())
      .then((arrayBuffer) => {
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const processedData = jsonData.map(row => {

          const firstKey = Object.keys(row)[0];
          const originalText = row[firstKey];
          const extracted = extractMiddleCodeFromEnd(originalText);
          
          return {
            ...row,
            codigo: extracted,
          };
        });
        setData(processedData);
        setFilteredData(processedData);
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
      <h2>Cartas de Yugi</h2>
      <input
        type="text"
        placeholder="Buscar..."
        value={searchTerm}
        onChange={handleSearch}
      />
      <table border="1">
        <thead>
            <tr>
            {currentData[0] &&
                Object.keys(currentData[0])
                .map((key) => <th key={key}>{key}</th>)}
            </tr>
        </thead>
        <tbody>
            {currentData.map((row, i) => (
            <tr key={i}>
                {Object.entries(row)
                .map(([key, val], j) => (
                    <td key={j}>{val}</td>
                ))}
            </tr>
            ))}
        </tbody>
        </table>


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

export default ExcelViewer;
