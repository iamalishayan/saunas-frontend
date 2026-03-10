import React, { useState, useEffect, useCallback } from 'react';
import './VesselImageCarousel.css';

interface VesselImageCarouselProps {
  images: string[];
  imageVariants?: Array<{
    mobile?: string;
    tablet?: string;
    desktop?: string;
  }>;
  vesselName: string;
  autoRotate?: boolean;
  rotateInterval?: number;
}

const VesselImageCarousel: React.FC<VesselImageCarouselProps> = ({
  images,
  imageVariants,
  vesselName,
  autoRotate = true,
  rotateInterval = 20000, // Default to 20 seconds
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const goToIndex = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Auto-rotate functionality
  useEffect(() => {
    if (!autoRotate || images.length <= 1 || isLightboxOpen) return;

    const interval = setInterval(goToNext, rotateInterval);
    return () => clearInterval(interval);
  }, [autoRotate, rotateInterval, images.length, goToNext, isLightboxOpen]);

  // Lightbox functions
  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    document.body.style.overflow = ''; // Restore scrolling
  };

  const goToNextInLightbox = () => {
    setLightboxIndex((prev) => (prev + 1) % images.length);
  };

  const goToPreviousInLightbox = () => {
    setLightboxIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Handle keyboard navigation in lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') goToNextInLightbox();
      if (e.key === 'ArrowLeft') goToPreviousInLightbox();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, images.length]);

  // Touch handlers for mobile swipe
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }
  };

  // Lightbox render function
  const renderLightbox = () => (
    <div className="image-lightbox" onClick={closeLightbox}>
      <button className="lightbox-close" onClick={closeLightbox} aria-label="Close">
        ✕
      </button>
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <img
          src={images[lightboxIndex]}
          srcSet={
            imageVariants?.[lightboxIndex]
              ? `${imageVariants[lightboxIndex].mobile} 400w, ${imageVariants[lightboxIndex].tablet} 800w, ${imageVariants[lightboxIndex].desktop} 1200w`
              : undefined
          }
          sizes="100vw"
          alt={`${vesselName} - Full view ${lightboxIndex + 1}`}
          className="lightbox-image"
        />
      </div>
      {images.length > 1 && (
        <>
          <button
            className="lightbox-arrow lightbox-arrow-left"
            onClick={(e) => {
              e.stopPropagation();
              goToPreviousInLightbox();
            }}
            aria-label="Previous image"
          >
            ‹
          </button>
          <button
            className="lightbox-arrow lightbox-arrow-right"
            onClick={(e) => {
              e.stopPropagation();
              goToNextInLightbox();
            }}
            aria-label="Next image"
          >
            ›
          </button>
          <div className="lightbox-counter">
            {lightboxIndex + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );

  // Handle single image case
  if (images.length === 0) {
    return null;
  }

  if (images.length === 1) {
    const imagePath = images[0];
    const variants = imageVariants?.[0];

    return (
      <>
        <img
          src={imagePath}
          srcSet={
            variants
              ? `${variants.mobile} 400w, ${variants.tablet} 800w, ${variants.desktop} 1200w`
              : undefined
          }
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          alt={vesselName}
          className="trip-card-image clickable-image"
          loading="lazy"
          onClick={() => openLightbox(0)}
          style={{ cursor: 'pointer' }}
        />
        {isLightboxOpen && renderLightbox()}
      </>
    );
  }

  // Multiple images - show carousel
  return (
    <>
      <div
        className="vessel-image-carousel"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {images.map((imagePath, index) => {
          const variants = imageVariants?.[index];
          return (
            <img
              key={index}
              src={imagePath}
              srcSet={
                variants
                  ? `${variants.mobile} 400w, ${variants.tablet} 800w, ${variants.desktop} 1200w`
                  : undefined
              }
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              alt={`${vesselName} - Image ${index + 1}`}
              className={`trip-card-image carousel-image clickable-image ${
                index === currentIndex ? 'active' : ''
              }`}
              loading={index === 0 ? 'eager' : 'lazy'}
              onClick={() => openLightbox(index)}
              style={{ cursor: 'pointer' }}
            />
          );
        })}

      {/* Navigation dots */}
      <div className="carousel-dots">
        {images.map((_, index) => (
          <button
            key={index}
            className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
            onClick={() => goToIndex(index)}
            aria-label={`Go to image ${index + 1}`}
          />
        ))}
      </div>

      {/* Navigation arrows (optional, for desktop) */}
      {images.length > 1 && (
        <>
          <button
            className="carousel-arrow carousel-arrow-left"
            onClick={goToPrevious}
            aria-label="Previous image"
          >
            ‹
          </button>
          <button
            className="carousel-arrow carousel-arrow-right"
            onClick={goToNext}
            aria-label="Next image"
          >
            ›
          </button>
        </>
      )}
    </div>
    {isLightboxOpen && renderLightbox()}
    </>
  );
};

export default VesselImageCarousel;
