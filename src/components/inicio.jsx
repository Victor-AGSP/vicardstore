import React, { useEffect, useState } from 'react';
import Slider from 'react-slick';
import '../styles/inicio.css';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

function Inicio() {
  const [images, setImages] = useState([]);

  useEffect(() => {
    // Simula la carga aleatoria de imágenes locales
    const totalImages = 11; // total que tienes en la carpeta
    const randomImages = [];

    const usedIndexes = new Set();
    while (randomImages.length < 8 && usedIndexes.size < totalImages) {
      const index = Math.floor(Math.random() * totalImages) + 1;
      if (!usedIndexes.has(index)) {
        usedIndexes.add(index);
        randomImages.push(`/cartas-carrusel/carta${index}.webp`);
      }
    }

    setImages(randomImages);
  }, []);

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    autoplay: true,
    autoplaySpeed: 3000,
    slidesToShow: 3,
    slidesToScroll: 1,
    responsive: [
      {
        breakpoint: 768,
        settings: { slidesToShow: 1 }
      },
      {
        breakpoint: 1024,
        settings: { slidesToShow: 2 }
      }
    ]
  };

  return (
    <div className="inicio-carrusel-container">
      <h2 className="inicio-titulo">Cartas destacadas</h2>
      <div className="carrusel-wrapper">
        <Slider {...settings}>
          {images.map((imgSrc, idx) => (
            <div key={idx} className="slide">
              <img src={imgSrc} alt={`Carta ${idx}`} className="carta-imagen" />
            </div>
          ))}
        </Slider>
      </div>
    </div>
  );
}

export default Inicio;
