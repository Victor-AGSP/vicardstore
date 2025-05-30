import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { useInView } from "react-intersection-observer";
import { useNavigate } from "react-router-dom";
import '../styles/mylpb.css'; // Ajusta la ruta según tu estructura

function Magic() {
  const [cards, setCards] = useState([]);
  const [filteredCards, setFilteredCards] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const navigate = useNavigate();

  useEffect(() => {
    const loadExcel = async () => {
      try {
        const res = await fetch("/data/magic.xlsx");
        if (!res.ok) throw new Error("No se pudo cargar el archivo magic.xlsx");

        const data = await res.arrayBuffer();
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        // Mapear jsonData para preparar los datos con imagen en null (se cargará luego)
        const cardsWithImagePlaceholder = jsonData.map(card => ({
          ...card,
          image: null,
          imageError: false,
        }));

        setCards(cardsWithImagePlaceholder);
        setFilteredCards(cardsWithImagePlaceholder);
        setCurrentPage(1);

        // Luego se cargan las imágenes
        fetchCardImages(cardsWithImagePlaceholder);
      } catch (err) {
        console.error(err);
      }
    };

    loadExcel();
  }, []);

  // Carga las imágenes de Scryfall para cada carta
  const fetchCardImages = async (cardsList) => {
    const updatedCards = await Promise.all(
      cardsList.map(async (card) => {
        const codigo = card["Código"];
        const idioma = card["Idioma"] || "es";
        const numero = card["Edición"]; // Ajusta si es necesario

        if (!codigo || !numero) return { ...card, imageError: true };

        try {
          const res = await fetch(
            `https://api.scryfall.com/cards/${codigo.toLowerCase()}/${numero}?lang=${idioma}`
          );
          if (!res.ok) throw new Error("Carta no encontrada");

          const data = await res.json();
          const image =
            data.image_uris?.normal || data.card_faces?.[0]?.image_uris?.normal;

          return { ...card, image: image || null, imageError: !image };
        } catch {
          return { ...card, imageError: true };
        }
      })
    );

    setCards(updatedCards);
    setFilteredCards(updatedCards);
  };

  // Filtrado por búsqueda
  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);
    setCurrentPage(1);

    const filtered = cards.filter((card) =>
      Object.values(card).some((val) =>
        String(val).toLowerCase().includes(value)
      )
    );
    setFilteredCards(filtered);
  };

  // Paginación
  const totalPages = Math.ceil(filteredCards.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentCards = filteredCards.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // Componente para mostrar cada carta con lazy loading y navegación
  const CardItem = ({ card }) => {
    const nombre = card["Nombre"] || card["Código"] || "Sin nombre";
    const { ref, inView } = useInView({ triggerOnce: true });

    const handleClick = () => {
      // Ejemplo de navegación, puedes cambiar ruta o lógica
      navigate("/");
    };

    return (
      <div className="card" ref={ref} onClick={handleClick} style={{ cursor: "pointer" }}>
        <div className="card-image" style={{ minHeight: "280px", display: "flex", justifyContent: "center", alignItems: "center" }}>
          {inView ? (
            card.image ? (
              <img
                src={card.image}
                alt={nombre}
                loading="lazy"
                style={{ maxWidth: "200px", borderRadius: "8px" }}
              />
            ) : card.imageError ? (
              <div style={{ color: "red" }}>Imagen no encontrada</div>
            ) : (
              <div>Cargando imagen...</div>
            )
          ) : (
            <div>Cargando...</div>
          )}
        </div>
        <div className="card-name" style={{ marginTop: "0.5rem", textAlign: "center", fontWeight: "bold" }}>
          {nombre}
        </div>
      </div>
    );
  };

  return (
    <div className="magic-card-viewer" style={{ padding: "1rem" }}>
      <h2>Cartas cargadas desde Excel y Scryfall</h2>

      <input
        type="text"
        placeholder="Buscar carta..."
        value={searchTerm}
        onChange={handleSearch}
        style={{ marginBottom: "1rem", padding: "0.5rem", width: "100%", maxWidth: "400px" }}
      />

      {currentCards.length === 0 && <p>No se encontraron cartas.</p>}

      <div
        className="cards-grid"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          justifyContent: "center",
        }}
      >
        {currentCards.map((card, idx) => (
          <CardItem key={idx} card={card} />
        ))}
      </div>

      <div
        className="pagination"
        style={{ marginTop: "1rem", textAlign: "center" }}
      >
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          style={{ marginRight: "1rem" }}
        >
          Anterior
        </button>
        <span>
          Página {currentPage} de {totalPages}
        </span>
        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{ marginLeft: "1rem" }}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

export default Magic;
