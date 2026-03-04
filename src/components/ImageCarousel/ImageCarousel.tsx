import React, { useState, useEffect } from 'react';
import './ImageCarousel.css';

interface CarouselImage {
  desktop: string;
  mobile: string;
}

interface ImageCarouselProps {
  images: CarouselImage[];
  autoSlide?: boolean;
  autoSlideInterval?: number;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ 
  images, 
  autoSlide = true, 
  autoSlideInterval = 20000
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!autoSlide) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      );
    }, autoSlideInterval);

    return () => clearInterval(interval);
  }, [autoSlide, autoSlideInterval, images.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? images.length - 1 : currentIndex - 1);
  };

  const goToNext = () => {
    setCurrentIndex(currentIndex === images.length - 1 ? 0 : currentIndex + 1);
  };

  return (
    <div className="image-carousel">
      <div className="carousel-container">
        {images.map((image, index) => (
          <div
            key={index}
            className={`carousel-slide ${index === currentIndex ? 'active' : ''}`}
          >
            <img
              src={image.mobile}
              srcSet={`${image.mobile} 800w, ${image.desktop} 1536w`}
              sizes="(max-width: 768px) 100vw, 1536px"
              alt={`Sauna experience ${index + 1}`}
              className="carousel-slide-img"
              loading={index === 0 ? 'eager' : 'lazy'}
              fetchPriority={index === 0 ? 'high' : 'auto'}
              width="1536"
              height="1024"
            />
            <div className="carousel-overlay" />
          </div>
        ))}
        
        {/* Navigation Arrows */}
        <button 
          className="carousel-nav carousel-nav-prev" 
          onClick={goToPrevious}
          aria-label="Previous image"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
          </svg>
        </button>
        
        <button 
          className="carousel-nav carousel-nav-next" 
          onClick={goToNext}
          aria-label="Next image"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
          </svg>
        </button>

        {/* Content Overlay */}
        <div className="carousel-content">
          <h1 style={{ 
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 'clamp(2rem, 5vw, 4rem)',
            fontWeight: 700,
            lineHeight: 1.2
          }}>
            Welcome to Victoria Mobile Sauna Rentals
          </h1>
          <p>Experience the ultimate relaxation with our unique floating sauna adventures and mobile sauna rentals. Creating unforgettable wellness experiences on and off the water.</p>
          <div className="carousel-cta">
            <a href="/booking" className="btn btn-primary">Book Your Experience</a>
            <a href="/services" className="btn btn-outline">Explore Services</a>
          </div>
        </div>

        {/* Dots Indicator */}
        <div className="carousel-dots">
          {images.map((_, index) => (
            <button
              key={index}
              className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ImageCarousel;