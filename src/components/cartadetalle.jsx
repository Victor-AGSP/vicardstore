import React, { useEffect, useState } from "react";
import "../styles/cartadetalle.css";

function CartaDetalle() {
  const [carta, setCarta] = useState(null);

  useEffect(() => {
    // Obtiene el id de la carta desde la URL
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (!id) return;

    // Busca la carta en el localStorage
    const cache = JSON.parse(localStorage.getItem("magicCardCache")) || {};
    setCarta(cache[id]);
  }, []);

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
      </div>
      <button className="detalle-volver" onClick={() => window.history.back()}>
        Volver
      </button>
    </div>
  );
}

export default CartaDetalle;