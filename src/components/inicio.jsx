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
      <div className="section-card" onClick={() => navigate('/')}>
        <h2>Magic: The Gathering</h2>
        <p>Explora todo lo relacionado a Magic</p>
      </div>
    </div>
  );
}

export default Inicio;
