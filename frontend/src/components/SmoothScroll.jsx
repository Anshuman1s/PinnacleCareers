import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { useLocation } from 'react-router-dom';

export default function SmoothScroll({ children }) {
  const scrollRef = useRef(null);
  const [pageHeight, setPageHeight] = useState(0);
  const location = useLocation();

  const { scrollY } = useScroll();
  
  // Custom spring configuration for fluid liquid physics feel
  const springConfig = { 
    damping: 25, 
    mass: 0.4, 
    stiffness: 80, 
    restDelta: 0.001 
  };
  const smoothY = useSpring(scrollY, springConfig);
  const y = useTransform(smoothY, (value) => -value);

  const handleResize = () => {
    if (scrollRef.current) {
      setPageHeight(scrollRef.current.scrollHeight);
    }
  };

  useEffect(() => {
    // Initial height calculation
    handleResize();
    
    // ResizeObserver watches for any child DOM changes and updates scrolling height dynamically
    const resizeObserver = new ResizeObserver(() => handleResize());
    if (scrollRef.current) {
      resizeObserver.observe(scrollRef.current);
    }

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, [children]);

  // Reset scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
    // Recalculate heights with a slight delay to allow React 19 to complete rendering of the new route
    const timer = setTimeout(handleResize, 150);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <>
      <motion.div
        ref={scrollRef}
        style={{ y }}
        className="fixed top-0 left-0 w-full overflow-hidden will-change-transform flex flex-col pt-24"
      >
        {children}
      </motion.div>
      {/* Spacer matching scrollable depth for the browser native scrollbar */}
      <div style={{ height: pageHeight }} className="pointer-events-none w-full" />
    </>
  );
}
