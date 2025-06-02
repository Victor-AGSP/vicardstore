import React, { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import "../styles/magic.css";

const CARDS_PER_PAGE = 30;

function Magic() {
  const [cardList, setCardList] = useState([]); // Desde Excel
  const [rawCards, setRawCards] = useState([]); // Tras fetch
  const [search, setSearch] = useState("");
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedRace, setSelectedRace] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  // Cargar Excel
  useEffect(() => {
    const controller = new AbortController();
    const loadExcel = async () => {
      try {
        const res = await fetch("/data/magic.xlsx", { signal: controller.signal });
        if (!res.ok) throw new Error("No se pudo cargar el archivo magic.xlsx");
        const data = await res.arrayBuffer();
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        setCardList(jsonData);
      } catch (err) {
        if (err.name !== "AbortError") setError(err.message);
      }
    };
    loadExcel();
    return () => controller.abort();
  }, []);

  // Cargar imágenes
  useEffect(() => {
    const controller = new AbortController();
    const loadImages = async () => {
      if (cardList.length === 0) return;
      setLoading(true);

      const results = await Promise.allSettled(
        cardList.map(async (card) => {
          const codigo = card["Edición"];
          const idioma = card["Idioma"]?.toLowerCase() || "es";
          const numero = card["Código"];
          const foil = card["Foil"]?.toString().toLowerCase() === "foil" || card["Foil"] === true ? "foil" : "normal";

          if (!codigo || !numero) return null;

          try {
            const res = await fetch(
              `https://api.scryfall.com/cards/${codigo.toLowerCase()}/${numero}?lang=${idioma}`,
              { signal: controller.signal }
            );
            if (!res.ok) return null;

            const data = await res.json();
            const image = data.image_uris?.normal || data.card_faces?.[0]?.image_uris?.normal;

            return image
              ? {
                  id: `${codigo.toLowerCase()}_${numero}_${idioma}_${foil}`,
                  nombre: data.printed_name || data.name,
                  idioma,
                  image,
                  foil,
                  tipo: data.type_line,
                }
              : null;
          } catch {
            return null;
          }
        })
      );

      const loaded = results
        .filter((r) => r.status === "fulfilled" && r.value)
        .map((r) => r.value);

      setRawCards(loaded);
      setLoading(false);
    };

    loadImages();
    return () => controller.abort();
  }, [cardList]);

  const norm = (text) =>
    text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Extraer razas de tipo línea
  const creatureRaces = useMemo(() => {
    const subtypes = new Set();
    rawCards.forEach((card) => {
      if (card.tipo) {
        const match = card.tipo.match(/—\s+(.+)/); // Cualquier tipo con subtipos
        if (match) {
          match[1].split(" ").forEach((sub) => subtypes.add(sub));
        }
      }
    });
    return Array.from(subtypes).sort();
  }, [rawCards]);

  // Filtro combinado
  const filteredCards = useMemo(() => {
    let filtered = rawCards;

    if (search.trim()) {
      filtered = filtered.filter((card) =>
        norm(card.nombre).includes(norm(search))
      );
    }

    if (selectedTypes.length > 0) {
      filtered = filtered.filter((card) =>
        selectedTypes.some((type) => card.tipo?.includes(type))
      );
    }

    if (selectedRace) {
      filtered = filtered.filter((card) => {
        if (!card.tipo || !card.tipo.includes("—")) return false;
        const match = card.tipo.match(/—\s+(.+)/);
        if (!match) return false;
        const subtypes = match[1].split(" ");
        return subtypes.includes(selectedRace);
      });
    }

    return filtered;
  }, [search, rawCards, selectedTypes, selectedRace]);

  const totalPages = Math.ceil(filteredCards.length / CARDS_PER_PAGE);
  const paginatedCards = filteredCards.slice(
    (currentPage - 1) * CARDS_PER_PAGE,
    currentPage * CARDS_PER_PAGE
  );

  // Tipos disponibles
  const allTypes = ["Legendary", "Sorcery", "Instant", "Creature", "Planeswalker", "Artifact", "Land", "Enchantment", "Kindred"];

  const handleTypeChange = (type) => {
    setCurrentPage(1);
    setSelectedTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  return (
    <div className="magic-container">
      <h2>Visor de Cartas de Magic</h2>

      <input
        type="text"
        placeholder="Buscar carta por nombre..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setCurrentPage(1);
        }}
        className="magic-search"
      />

      <div className="magic-filter">
        <details>
          <summary>Filtrar por tipo</summary>
          {allTypes.map((type) => (
            <label key={type} style={{ display: "block" }}>
              <input
                type="checkbox"
                checked={selectedTypes.includes(type)}
                onChange={() => handleTypeChange(type)}
              />
              {type}
            </label>
          ))}
        </details>

        <details className="magic-filter">
          <summary>Filtrar por raza</summary>
          <label style={{ display: "block", marginTop: "1rem" }}>
            <select
              value={selectedRace}
              onChange={(e) => {
                setSelectedRace(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                marginTop: "0.5rem",
                padding: "0.5rem",
                borderRadius: "6px",
                backgroundColor: "#3a3a3a",
                color: "#e0e0e0",
                border: "1px solid #555",
                fontSize: "1rem",
                width: "100%",
                maxWidth: "300px"
              }}
            >
              <option value="">Todas las razas</option>
              {creatureRaces.map((race) => (
                <option key={race} value={race}>
                  {race}
                </option>
              ))}
            </select>
          </label>
        </details>

      </div>

      {error && <p className="magic-error">{error}</p>}
      {loading && <p className="magic-loading">Cargando cartas...</p>}
      {!loading && filteredCards.length === 0 && (
        <p className="magic-empty">No se encontraron cartas.</p>
      )}

      <div className="magic-grid">
        {paginatedCards.map((card) => (
          <div key={card.id} className="magic-card">
            <img
              src={card.image}
              alt={card.nombre}
              className="magic-card-image"
              loading="lazy"
            />
            <p className="magic-card-name">
              {card.nombre} ({card.idioma.toUpperCase()}){" "}
              {card.foil === "foil" && <strong>★ Foil</strong>}
            </p>
          </div>
        ))}
      </div>

      {!loading && totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </button>
          <span>
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}

export default Magic;