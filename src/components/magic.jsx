import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import '../styles/magic.css';

function Magic() {
  const [images, setImages] = useState([]);
  const [filteredImages, setFilteredImages] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const allCardsRef = useRef([]);
  const indexRef = useRef(0);
  const intervalRef = useRef(null);

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
        fetchCardImages(jsonData);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    loadExcel();
    return () => clearInterval(intervalRef.current);
  }, []);

  const fetchCardImages = async (cardList) => {
    const imagePromises = cardList.map(async (card) => {
      const codigo = card["Edición"];
      const idioma = card["Idioma"]?.toLowerCase() || "es";
      const numero = card["Código"];

      if (!codigo || !numero) return null;

      try {
        const res = await fetch(
          `https://api.scryfall.com/cards/${codigo.toLowerCase()}/${numero}?lang=${idioma}`
        );
        if (!res.ok) throw new Error("Carta no encontrada");

        const data = await res.json();
        const image = data.image_uris?.normal || data.card_faces?.[0]?.image_uris?.normal;
        const nombre = data.printed_name || data.name;
        const idiomaReal = data.lang || idioma;

        return {
          id: `${codigo.toLowerCase()}_${numero}_${idioma}`, // ID único por idioma
          nombre,
          codigo,
          numero,
          idioma, // el idioma solicitado
          idiomaReal, // idioma que devolvió la API (opcional)
          image,
        };
      } catch (err) {
        return null;
      }
    });

    const resolved = await Promise.all(imagePromises);
    const validCards = resolved.filter((img) => img?.image);

    allCardsRef.current = validCards;
    indexRef.current = 0;

    setImages([]);
    setFilteredImages([]);
    setLoading(false);

    intervalRef.current = setInterval(() => {
      if (indexRef.current >= allCardsRef.current.length) {
        clearInterval(intervalRef.current);
        return;
      }

      const card = allCardsRef.current[indexRef.current];
      setImages((prev) => [...prev, card]);
      setFilteredImages((prev) => [...prev, card]);
      indexRef.current += 1;
    }, 100);
  };

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearch(value);

    setFilteredImages(
      images.filter((card) => {
        if (!card) return false;
        const cardName = card.nombre?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        return cardName?.includes(value);
      })
    );
  };

  return (
    <div className="magic-container">
      <h2>Visor de Cartas de Magic</h2>

      <input
        type="text"
        placeholder="Buscar carta por nombre..."
        value={search}
        onChange={handleSearch}
        className="magic-search"
      />

      {error && <p className="magic-error">{error}</p>}
      {loading && <p className="magic-loading">Cargando cartas...</p>}
      {!loading && filteredImages.length === 0 && (
        <p className="magic-empty">No se encontraron cartas.</p>
      )}

      <div className="magic-grid">
        {filteredImages.map((card) =>
          card ? (
            <div key={card.id} className="magic-card">
              <img src={card.image} alt={card.nombre} className="magic-card-image" />
              <p className="magic-card-name">
                {card.nombre} ({card.idioma.toUpperCase()})
              </p>
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}

export default Magic;
