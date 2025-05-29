import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/inicio.css';

function Inicio() {
  const navigate = useNavigate();

  return (
    <div className="inicio-container">
      <div className="section-card" onClick={() => navigate('/yugi')}>
        <h2>Yu-Gi-Oh!</h2>
        <p>Explora todo lo relacionado a Yu-Gi-Oh!</p>
      </div>
      <div className="section-card" onClick={() => navigate('/mylpb')}>
        <h2>Mitos y Leyendas PB</h2>
        <p>Explora todo lo relacionado a MyL</p>
      </div>
    </div>
  );
}

export default Inicio;
