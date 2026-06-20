import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { HeroSlide } from '../types';

const DEFAULT_SLIDES: HeroSlide[] = [
  {
    id: 1,
    title: "Next-Gen Enterprise Infrastructure",
    subtitle: "Server Cabinets, Switches & Storage Solutions",
    description: "High-density Dell PowerEdge arrays and Cisco business switches with compliant HSN codes and 18% GST invoice records pre-loaded.",
    buttonText: "Sourcing catalog",
    image: "https://picsum.photos/seed/slide1/1920/1085?blur=3",
    badge: "18% GST INVOICES"
  },
  {
    id: 2,
    title: "Professional Workstation laptops",
    subtitle: "Lenovo ThinkPad X1 & Dell Latitude Arrays",
    description: "Equipped with military-spec aluminum bodies, Intel Xeon or vPro Core processors and premium on-site warranty packages.",
    buttonText: "Browse Workstations",
    image: "https://picsum.photos/seed/slide2/1920/1085?blur=2",
    badge: "FESTIVE SALE DISCOUNTS"
  },
  {
    id: 3,
    title: "CCTV surveillance & biometric access",
    subtitle: "Secure your Corporate Warehouse Premises",
    description: "Buy PoE night-vision CP Plus Dome arrays paired with Matrix Fingerprint scanners. Fully integrated for commercial compliance.",
    buttonText: "Secure setups",
    image: "https://picsum.photos/seed/slide3/1920/1085?blur=4",
    badge: "PoE COMPATIBLE"
  }
];

export default function HeroSlider({ slides }: { slides?: HeroSlide[] }) {
  const activeSlides = slides && slides.length > 0 ? slides : DEFAULT_SLIDES;
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx(i => (i + 1) % activeSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [activeSlides]);

  const slidePrev = () => {
    setCurrentIdx(i => (i - 1 + activeSlides.length) % activeSlides.length);
  };

  const slideNext = () => {
    setCurrentIdx(i => (i + 1) % activeSlides.length);
  };

  return (
    <div className="relative h-[280px] sm:h-[420px] bg-slate-950 overflow-hidden font-sans select-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIdx}
          initial={{ opacity: 0.1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0.1 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 w-full h-full"
        >
          {/* Background image component for zooming */}
          <motion.div 
            initial={{ scale: 1 }}
            animate={{ scale: 1.08 }}
            transition={{ duration: 8, ease: "linear" }}
            className="absolute inset-0 w-full h-full"
            style={{
              backgroundImage: `linear-gradient(to right, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.45)), url(${activeSlides[currentIdx].image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />

          {/* Slide overlay text */}
          <div className="max-w-7xl mx-auto px-6 sm:px-12 h-full flex flex-col justify-center text-left relative z-10">
            <span className="inline-block bg-amber-500 text-slate-950 font-black text-[9px] uppercase tracking-widest px-2.5 py-1 rounded mb-3 w-fit">
              {activeSlides[currentIdx].badge}
            </span>
            <h1 className="text-xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight uppercase leading-tight sm:max-w-xl">
              {activeSlides[currentIdx].title}
            </h1>
            <p className="text-amber-400 font-bold text-xs sm:text-base tracking-wide uppercase mt-1">
              {activeSlides[currentIdx].subtitle}
            </p>
            <p className="text-slate-200 drop-shadow-md text-[10px] sm:text-xs max-w-sm sm:max-w-md mt-2 font-medium leading-relaxed hidden sm:block">
              {activeSlides[currentIdx].description}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Manual Sliders switches buttons */}
      <button
        onClick={slidePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/50 hover:bg-slate-900 text-slate-100 hover:text-white transition-all cursor-pointer z-20 border border-slate-800"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={slideNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/50 hover:bg-slate-900 text-slate-100 hover:text-white transition-all cursor-pointer z-20 border border-slate-800"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Progress Indicators */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-20">
        {activeSlides.map((slide, idx) => (
          <button
            key={slide.id}
            onClick={() => setCurrentIdx(idx)}
            className={`w-4 h-1.5 rounded-full transition-all cursor-pointer ${idx === currentIdx ? 'bg-amber-500 w-8' : 'bg-slate-705 bg-slate-700'}`}
          />
        ))}
      </div>
    </div>
  );
}
