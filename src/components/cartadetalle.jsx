import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/cartadetalle.css";

function CartaDetalle() {
  const [carta, setCarta] = useState(null);
  const [datosJson, setDatosJson] = useState(null);
  const [ids, setIds] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(-1);

  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const id = params.get("id");

  useEffect(() => {
    if (!id) return;

    const cache = JSON.parse(localStorage.getItem("magicCardCache")) || {};
    const allIds = Object.keys(cache);
    setIds(allIds);

    const idx = allIds.indexOf(id);
    setCurrentIdx(idx);
    setCarta(cache[id]);

    fetch(`/data/json/${id}.json`)
      .then((res) => {
        if (!res.ok) throw new Error("No se encontró JSON de la carta");
        return res.json();
      })
      .then((data) => {
        setDatosJson(data);
      })
      .catch(() => {
        setDatosJson(null);
      });
  }, [id]);

  const goTo = (offset) => {
    const newIdx = currentIdx + offset;
    if (newIdx >= 0 && newIdx < ids.length) {
      const newId = ids[newIdx];
      navigate(`?id=${encodeURIComponent(newId)}`, { replace: false });
    }
  };

  if (!carta) {
    return (
      <div className="detalle-container">
        <p>No se encontró la carta.</p>
      </div>
    );
  }

  // --- Render para cartas de doble cara ---
  if (datosJson?.card_faces && Array.isArray(datosJson.card_faces)) {
    return (
      <div className="detalle-container">
        <div className="detalle-card doble-cara">
          <button
            className="detalle-nav"
            onClick={() => goTo(-1)}
            disabled={currentIdx <= 0}
          >
            &#60;
          </button>
          {datosJson.card_faces.map((face, idx) => (
            <div key={idx} className="detalle-face">
              <img
                src={face.image_uris?.normal}
                alt={face.name}
                className="detalle-img"
              />
              <div className="detalle-info">
                <h2 className="detalle-nombre">{face.name}</h2>
                <p><strong>Tipo:</strong> {face.type_line}</p>
                <p><strong>Coste de maná:</strong> {face.mana_cost || "N/A"}</p>
                <p className="oracle-text"><strong>Texto:</strong> {face.oracle_text || "No disponible"}</p>
                {face.power && face.toughness && (
                  <p><strong>Fuerza/Resistencia:</strong> {face.power}/{face.toughness}</p>
                )}
                <p><strong>Artista:</strong> {face.artist || datosJson.artist || "Desconocido"}</p>
              </div>
            </div>
          ))}
          <button
            className="detalle-nav"
            onClick={() => goTo(1)}
            disabled={currentIdx === -1 || currentIdx >= ids.length - 1}
          >
            &#62;
          </button>
        </div>
        <div style={{ marginTop: "1rem" }}>
          <p><strong>Rareza:</strong> {datosJson.rarity || "Desconocida"}</p>
        </div>
        <button className="detalle-volver" onClick={() => navigate("/magic")}>
          Volver
        </button>
      </div>
    );
  }

  // --- Render para cartas normales ---
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
          <h2 className="detalle-nombre">{carta.nombre}</h2>
          <p><strong>Tipo:</strong> {carta.tipo}</p>
          <p><strong>Coste de maná:</strong> {datosJson?.mana_cost || "N/A"}</p>
          <p className="oracle-text"><strong>Texto:</strong> {datosJson?.oracle_text || "No disponible"}</p>
          <p><strong>Rareza:</strong> {datosJson?.rarity || "Desconocida"}</p>
          <p><strong>Artista:</strong> {datosJson?.artist || "Desconocido"}</p>
        </div>
        <button
          className="detalle-nav"
          onClick={() => goTo(1)}
          disabled={currentIdx === -1 || currentIdx >= ids.length - 1}
        >
          &#62;
        </button>
      </div>
      <button className="detalle-volver" onClick={() => navigate("/magic")}>
        Volver
      </button>
    </div>
  );
}

export default CartaDetalle;