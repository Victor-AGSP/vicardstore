import React, { useEffect, useState } from "react";
import "../styles/cartadetalle.css";

function CartaDetalle() {
  const [carta, setCarta] = useState(null);
  const [ids, setIds] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(-1);

  // Cargar ids y carta actual
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (!id) return;

    const cache = JSON.parse(localStorage.getItem("magicCardCache")) || {};
    const allIds = Object.keys(cache);
    setIds(allIds);

    const idx = allIds.indexOf(id);
    console.log(`ID actual: ${id}, Índice: ${idx}`);
    setCurrentIdx(idx);
    setCarta(cache[id]);
  }, []);

  // Navegar a la carta anterior/siguiente
  const goTo = (offset) => {
    const newIdx = currentIdx + offset;
    if (newIdx >= 0 && newIdx < ids.length) {
      const newId = ids[newIdx];
      window.location.search = `?id=${encodeURIComponent(newId)}`;
    }
  };

  if (!carta) {
    return (
      <div className="detalle-container">
        <p>No se encontró la carta.</p>
      </div>
    );
  }

  return (
    <div className="detalle-container">
      <div className="detalle-card">
        <button
          className="detalle-nav"
          onClick={() => goTo(-1)}
          disabled={currentIdx <= 0}
        >
          &#60;
        </button>
        <img src={carta.image} alt={carta.nombre} className="detalle-img" />
        <div className="detalle-info">
          <h2>{carta.nombre}</h2>
          <p>
            <strong>Idioma:</strong> {carta.idioma.toUpperCase()}
          </p>
          <p>
            <strong>Tipo:</strong> {carta.tipo}
          </p>
          <p>
            <strong>Foil:</strong> {carta.foil === "foil" ? "Sí" : "No"}
          </p>
        </div>
        <button
          className="detalle-nav"
          onClick={() => goTo(1)}
          disabled={currentIdx === -1 || currentIdx >= ids.length - 1}
        >
          &#62;
        </button>
      </div>
      <button className="detalle-volver" onClick={() => window.history.back()}>
        Volver
      </button>
    </div>
  );
}

export default CartaDetalle;