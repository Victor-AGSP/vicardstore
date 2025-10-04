import React, { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import "../styles/magic.css";
import { useNavigate } from "react-router-dom";

const CARDS_PER_PAGE = 50;

function Magic() {
  const [cardList, setCardList] = useState([]);
  const [rawCards, setRawCards] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedRace, setSelectedRace] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  // Intentar leer del localStorage primero
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

  // 2. Cargar cache de localStorage al iniciar
  useEffect(() => {
    const cached = localStorage.getItem("magic-rawCards");
    if (cached) {
      setRawCards(JSON.parse(cached));
    }
  }, []);

  // 3. Cuando tengas cardList, busca cartas faltantes y sigue cargando
  useEffect(() => {
    if (cardList.length === 0) return;

    // Si ya están todas las cartas, no hagas nada
    if (rawCards.length >= cardList.length) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Crear un Set de ids ya cargados
    const loadedIds = new Set(rawCards.map(c => c.id));

    const loadMissing = async () => {
      let updated = [...rawCards];
      for (const card of cardList) {
        const codigo = card["Edición"];
        const idioma = card["Idioma"]?.toLowerCase() || "es";
        const numero = card["Código"];
        const foil = card["Foil"]?.toString().toLowerCase() === "foil" ? "foil" : "normal";
        let id = foil === "normal"
          ? `${codigo}_${numero}_${idioma}`
          : `${codigo}_${numero}_${idioma}_${foil}`;

        if (loadedIds.has(id)) continue; // Ya está en cache

        try {
          const res = await fetch(`/data/json/${id}.json`);
          if (!res.ok) continue;
          const data = await res.json();
          let isDoubleFaced = data.layout === 'transform' || data.layout === 'modal_dfc';
          const a = data.layout === 'adventure' || data.layout === 'split';
          if (a === true) isDoubleFaced = false;
          const cardObj = {
            id,
            nombre: data.printed_name || data.name,
            idioma,
            image: isDoubleFaced
              ? `/images/magic/${id}_1.webp` 
              : `/images/magic/${id}.webp`,
            foil,
            tipo: data.type_line,
          };
          updated.push(cardObj);

          // Actualiza el estado y el cache progresivamente
          setRawCards([...updated]);
          if (updated.length % 10 === 0) {
            localStorage.setItem("magic-rawCards", JSON.stringify(updated));
          }
          // Actualiza el cache individual también si quieres
          const existingCache = localStorage.getItem("magicCardCache");
          const cache = existingCache ? JSON.parse(existingCache) : {};
          if (!cache[cardObj.id]) {
            cache[cardObj.id] = cardObj;
            localStorage.setItem("magicCardCache", JSON.stringify(cache));
          }
        } catch (err) {
          // Ignorar errores individuales
        }
      }
      // Al terminar, guarda el cache final
      localStorage.setItem("magic-rawCards", JSON.stringify(updated));
      setLoading(false);
    };

    loadMissing();
    // eslint-disable-next-line
  }, [cardList]);
/*
  const reloadCache = () => {
  // Limpiar ambos caches
    localStorage.removeItem("magic-rawCards");
    localStorage.removeItem("magicCardCache");
    // Resetear estados para forzar recarga
    setRawCards([]);
    setCardList([]); 
    setLoading(true);

    // Recargar el archivo Excel para disparar la carga de nuevo
    fetch("/data/magic.xlsx")
      .then((res) => {
        if (!res.ok) throw new Error("No se pudo cargar el archivo magic.xlsx");
        return res.arrayBuffer();
      })
      .then((data) => {
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        setCardList(jsonData);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };*/

  const creatureRaces = useMemo(() => {
    const subtypes = new Set();
    rawCards.forEach((card) => {
      if (card.tipo) {
        const match = card.tipo.match(/—\s+(.+)/);
        if (match) {
          match[1].split(" ").forEach((sub) => subtypes.add(sub));
        }
      }
    });
    return Array.from(subtypes).sort();
  }, [rawCards]);

  const filteredCards = useMemo(() => {
    let filtered = rawCards;

    const norm = (text) =>
      text?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

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

  const allTypes = ["Legendary", "Sorcery", "Instant", "Creature", "Planeswalker", "Artifact", "Land", "Enchantment", "Kindred"];

  const handleTypeChange = (type) => {
    setCurrentPage(1);
    setSelectedTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  /*
      <button
        onClick={reloadCache}
        style={{
          marginBottom: "1rem",
          padding: "0.5rem 1rem",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer"
        }}
        disabled={loading}
        title="Recargar cache de cartas"
      >
        {loading ? "Cargando..." : "Recargar Cache"}
      </button>
  */

  return (
    <div className="magic-container">
      <h2>Magic The Gathering</h2>

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

        <details>
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
          <div
            key={card.id}
            className="magic-card"
            style={{ cursor: "pointer" }}
            onClick={() => {
              navigate(`/detalle?id=${encodeURIComponent(card.id)}`);
            }}
          >
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

      {totalPages > 1 && (
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