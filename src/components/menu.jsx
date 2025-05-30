import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/menu.css';

function Menu() {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: 'Inicio', path: '/' },
    { label: 'Yugi', path: '/yugi' },
    { label: 'MyLpb', path: '/mylpb' },
    { label: 'Magic', path: '/magic' },
  ];

  return (
    <nav className="menu-nav">
      <div className="menu-container">
      <Link to="/" className="menu-logo">Vicardstore</Link>
        <button className="menu-toggle" onClick={() => setIsOpen(!isOpen)}>
          ☰
        </button>
        <ul className={`menu-links ${isOpen ? 'active' : ''}`}>
          {navItems.map((item) => (
            <li key={item.label}>
              <Link className="menu-link" to={item.path} onClick={() => setIsOpen(false)}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

export default Menu;
