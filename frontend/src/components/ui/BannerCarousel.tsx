import { useState, useEffect } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

interface BannerSlide {
  id: number;
  image: string;
  title?: string;
  subtitle?: string;
  link?: string;
  buttonText?: string;
}

interface BannerCarouselProps {
  slides: BannerSlide[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

const BannerCarousel = ({
  slides,
  autoPlay = true,
  autoPlayInterval = 5000,
}: BannerCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (!autoPlay || slides.length <= 1) return;

    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % slides.length);
        setIsTransitioning(false);
      }, 50);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, slides.length]);

  const goToSlide = (index: number) => {
    if (index === currentIndex) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsTransitioning(false);
    }, 50);
  };

  const goToPrevious = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
      setIsTransitioning(false);
    }, 50);
  };

  const goToNext = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
      setIsTransitioning(false);
    }, 50);
  };

  if (slides.length === 0) return null;

  const currentSlide = slides[currentIndex];

  return (
    <div className="relative mb-12 overflow-hidden rounded-lg">
      <div className="relative aspect-[21/9] w-full bg-slate-200 overflow-hidden">
        {/* Slides container với slide animation */}
        <div
          className="flex h-full transition-transform duration-700 ease-in-out"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
          }}
        >
          {slides.map((slide, index) => (
            <div
              key={index}
              className="min-w-full h-full relative"
              style={{ flexShrink: 0 }}
            >
              <img
                src={slide.image}
                alt={slide.title || `Banner ${index + 1}`}
                className="h-full w-full object-cover"
                loading={index === currentIndex ? "eager" : "lazy"}
              />
            </div>
          ))}
        </div>
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent pointer-events-none" />

        {/* Content với fade animation khi slide thay đổi */}
        {(currentSlide.title || currentSlide.subtitle || currentSlide.link) && (
          <div
            key={currentIndex}
            className="absolute inset-0 flex items-center pointer-events-none"
          >
            <div className="container-page w-full">
              <div
                className={`max-w-2xl text-white transition-all duration-500 ${
                  isTransitioning
                    ? "opacity-0 translate-x-4"
                    : "opacity-100 translate-x-0"
                }`}
              >
                {currentSlide.title && (
                  <h2 className="mb-4 text-3xl font-bold md:text-4xl lg:text-5xl">
                    {currentSlide.title}
                  </h2>
                )}
                {currentSlide.subtitle && (
                  <p className="mb-6 text-lg text-slate-200 md:text-xl">
                    {currentSlide.subtitle}
                  </p>
                )}
                {currentSlide.link && currentSlide.buttonText && (
                  <a
                    href={currentSlide.link}
                    className="inline-flex items-center rounded-md bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition-all duration-200 hover:bg-slate-100 hover:scale-105 active:scale-95 pointer-events-auto"
                  >
                    {currentSlide.buttonText}
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation arrows */}
        {slides.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/80 p-2 text-slate-900 backdrop-blur-sm transition-all duration-300 hover:bg-white hover:scale-110 active:scale-95 shadow-lg"
              aria-label="Previous slide"
            >
              <ChevronLeftIcon className="h-6 w-6 transition-transform duration-200" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/80 p-2 text-slate-900 backdrop-blur-sm transition-all duration-300 hover:bg-white hover:scale-110 active:scale-95 shadow-lg"
              aria-label="Next slide"
            >
              <ChevronRightIcon className="h-6 w-6 transition-transform duration-200" />
            </button>
          </>
        )}

        {/* Dots indicator */}
        {slides.length > 1 && (
          <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2 rounded-full transition-all duration-500 ease-in-out ${
                  index === currentIndex
                    ? "w-8 bg-white scale-110 shadow-lg"
                    : "w-2 bg-white/50 hover:bg-white/75 hover:scale-110"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BannerCarousel;

