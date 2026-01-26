import React, { useState, useEffect, useRef, memo, useCallback } from "react";
import axios from "axios";

let mobileBannerCache = [];

export const Mobileslider = memo(() => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [slides, setSlides] = useState(mobileBannerCache);
  const [loading, setLoading] = useState(!mobileBannerCache.length);
  
  // currentSlide 1 is the first real image
  const [currentSlide, setCurrentSlide] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(true);
  
  // Dragging States
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);

  // 1. Data Fetching - Only mobile banners
  useEffect(() => {
    if (mobileBannerCache.length > 0) {
      setSlides(mobileBannerCache);
      setLoading(false);
      return;
    }

    const fetchMobileBanners = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${base_url}/api/banners/mobile`);
        if (response.data.success) {
          const bannerData = response.data.data.map((banner) => ({
            id: banner._id,
            src: banner.image,
            alt: banner.name || "Banner",
            deviceCategory: banner.deviceCategory
          }));
          mobileBannerCache = bannerData;
          setSlides(bannerData);
        }
      } catch (err) {
        console.error("Error fetching mobile banners:", err);
        // Fallback banners for mobile
        const fallback = [
          { 
            id: 1, 
            src: "https://img.b112j.com/upload/announcement/image_241602.jpg", 
            alt: "Mobile Banner 1",
            deviceCategory: "mobile"
          },
          { 
            id: 2, 
            src: "https://img.b112j.com/upload/announcement/image_241701.jpg", 
            alt: "Mobile Banner 2",
            deviceCategory: "mobile"
          },
          { 
            id: 3, 
            src: "https://img.b112j.com/upload/announcement/image_242355.jpg", 
            alt: "Mobile Banner 3",
            deviceCategory: "mobile"
          },
        ];
        setSlides(fallback);
      } finally {
        setLoading(false);
      }
    };
    fetchMobileBanners();
  }, [base_url]);

  // 2. Prepare slides with clones for infinite loop
  const hasSlides = slides.length > 0;
  const extendedSlides = hasSlides 
    ? [slides[slides.length - 1], ...slides, slides[0]] 
    : [];

  // 3. Navigation Handlers
  const handleNext = useCallback(() => {
    if (!isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide((prev) => prev + 1);
  }, [isTransitioning]);

  const handlePrev = useCallback(() => {
    if (!isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide((prev) => prev - 1);
  }, [isTransitioning]);

  // 4. Mouse & Touch Event Handlers
  const onDragStart = (e) => {
    setIsDragging(true);
    // Support both mouse and touch
    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    setStartX(clientX);
  };

  const onDragMove = (e) => {
    if (!isDragging) return;
    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const currentDrag = clientX - startX;
    setDragOffset(currentDrag);
  };

  const onDragEnd = () => {
    if (!isDragging) return;
    
    // Threshold to trigger slide change (50px)
    if (dragOffset > 50) {
      handlePrev();
    } else if (dragOffset < -50) {
      handleNext();
    }
    
    setIsDragging(false);
    setDragOffset(0);
  };

  // 5. Infinite Jump Logic
  const handleTransitionEnd = () => {
    if (currentSlide === 0) {
      setIsTransitioning(false);
      setCurrentSlide(extendedSlides.length - 2);
    } else if (currentSlide === extendedSlides.length - 1) {
      setIsTransitioning(false);
      setCurrentSlide(1);
    }
  };

  useEffect(() => {
    if (!isTransitioning) {
      const timeout = setTimeout(() => setIsTransitioning(true), 50);
      return () => clearTimeout(timeout);
    }
  }, [isTransitioning]);

  // 6. Auto-play Logic (Paused while dragging)
  useEffect(() => {
    if (slides.length <= 1 || isDragging) return;
    const interval = setInterval(() => {
      handleNext();
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length, currentSlide, isDragging, handleNext]);

  if (loading) return <div className="w-full h-40 bg-gray-800 animate-pulse rounded-lg" />;
  if (!hasSlides) return null;

  return (
    <div className="relative w-full py-4 overflow-hidden select-none">
      <div 
        className={`flex ${isTransitioning && !isDragging ? "transition-transform duration-500 ease-out" : ""}`}
        onTransitionEnd={handleTransitionEnd}
        onMouseDown={onDragStart}
        onMouseMove={onDragMove}
        onMouseUp={onDragEnd}
        onMouseLeave={onDragEnd}
        onTouchStart={onDragStart}
        onTouchMove={onDragMove}
        onTouchEnd={onDragEnd}
        style={{
          // Calculate position based on slide index + manual drag offset
          transform: `translateX(calc(-${currentSlide * 85}% + 7.5% + ${dragOffset}px))`,
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
      >
        {extendedSlides.map((slide, index) => (
          <div 
            key={`${slide.id}-${index}`} 
            className={`
              flex-shrink-0 px-1 w-[85%] md:w-full 
              transition-all duration-500
              ${index === currentSlide ? 'scale-100 opacity-100' : 'scale-95 opacity-50'}
              md:scale-100 md:opacity-100 md:px-4
            `}
          >
            <div className="relative rounded-xl overflow-hidden bg-slate-900 pointer-events-none">
              <img
                src={slide.src.startsWith('http') ? slide.src : `${base_url}/${slide.src}`}
                alt={slide.alt}
                className="w-full aspect-[21/9] md:aspect-[3/1] object-cover block"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:block">
          <button 
            onClick={handlePrev}
            className="absolute left-10 top-1/2 -translate-y-1/2 z-10 bg-black/50 p-2 rounded-full text-white hover:bg-blue-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <button 
            onClick={handleNext}
            className="absolute right-10 top-1/2 -translate-y-1/2 z-10 bg-black/50 p-2 rounded-full text-white hover:bg-blue-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
      </div>

      {/* Indicators */}
      <div className="flex justify-center gap-1.5 mt-4">
        {slides.map((_, index) => {
          let activeIndex = currentSlide - 1;
          if (currentSlide === 0) activeIndex = slides.length - 1;
          if (currentSlide === extendedSlides.length - 1) activeIndex = 0;

          return (
            <div
              key={index}
              onClick={() => {
                setIsTransitioning(true);
                setCurrentSlide(index + 1);
              }}
              className={`h-[3px] transition-all duration-300 cursor-pointer rounded-full ${
                index === activeIndex ? "bg-white w-7" : "bg-gray-600 w-4"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
});