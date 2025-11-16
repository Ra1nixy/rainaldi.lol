import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const [activeSection, setActiveSection] = useState('home');
  const [showTooltip, setShowTooltip] = useState(false);
  const [pulsingDot, setPulsingDot] = useState<string | null>(null);

  const sections = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'projects', label: 'Projects' },
    { id: 'contact', label: 'Contact' }
  ];

  useEffect(() => {
    // Cek apakah user sudah pernah melihat tooltip
    const seenTooltip = localStorage.getItem('hasSeenNavTooltip');
    if (!seenTooltip) {
      const timer = setTimeout(() => {
        setShowTooltip(true);
        // Mulai animasi pulsing pada dots
        startPulsingAnimation();
      }, 1000);
      
      const hideTimer = setTimeout(() => {
        setShowTooltip(false);
        setPulsingDot(null);
        localStorage.setItem('hasSeenNavTooltip', 'true');
      }, 6000);

      return () => {
        clearTimeout(timer);
        clearTimeout(hideTimer);
      };
    }
  }, []);

  const startPulsingAnimation = () => {
    let currentIndex = 0;
    
    const pulseNext = () => {
      if (currentIndex < sections.length) {
        setPulsingDot(sections[currentIndex].id);
        currentIndex++;
        setTimeout(pulseNext, 800);
      } else {
        // Setelah selesai, ulangi dari awal setelah jeda
        setTimeout(() => {
          if (showTooltip) {
            currentIndex = 0;
            pulseNext();
          }
        }, 1000);
      }
    };
    
    pulseNext();
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;

      sections.forEach(section => {
        const element = document.getElementById(section.id);
        if (element) {
          const offsetTop = element.offsetTop;
          const offsetBottom = offsetTop + element.offsetHeight;

          if (scrollPosition >= offsetTop && scrollPosition < offsetBottom) {
            setActiveSection(section.id);
          }
        }
      });

      if (showTooltip) {
        handleTooltipClose();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showTooltip]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      window.scrollTo({
        top: element.offsetTop,
        behavior: 'smooth'
      });
    }

    if (showTooltip) {
      handleTooltipClose();
    }
  };

  const handleTooltipClose = () => {
    setShowTooltip(false);
    setPulsingDot(null);
    localStorage.setItem('hasSeenNavTooltip', 'true');
  };

  // Variants untuk animasi Framer Motion dengan type yang benar
  const tooltipVariants = {
    hidden: {
      opacity: 0,
      y: 10,
      scale: 0.8
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 20
      }
    },
    exit: {
      opacity: 0,
      y: -10,
      scale: 0.8,
      transition: {
        duration: 0.2
      }
    }
  };

  const dotVariants = {
    normal: {
      scale: 1,
      backgroundColor: "#d1d5db"
    },
    active: {
      scale: 1.1,
      backgroundColor: "#2c2a28",
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 10
      }
    },
    pulsing: {
      scale: [1, 1.3, 1],
      backgroundColor: ["#d1d5db", "#2c2a28", "#d1d5db"],
      transition: {
        duration: 0.8,
        ease: "easeInOut" as const
      }
    },
    hover: {
      scale: 1.2,
      backgroundColor: "#2c2a28",
      transition: {
        duration: 0.2
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <>
      {/* Desktop - Vertical di kanan */}
      <div className="hidden lg:block fixed right-8 top-1/2 transform -translate-y-1/2 z-50">
        <motion.div 
          className="flex flex-col space-y-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {sections.map((section) => (
            <motion.button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              variants={dotVariants}
              animate={activeSection === section.id ? "active" : "normal"}
              whileHover="hover"
              className="w-3 h-3 rounded-full"
              title={section.label}
            />
          ))}
        </motion.div>
      </div>

      {/* Mobile - Horizontal di atas tengah */}
      <div className="lg:hidden fixed top-6 left-1/2 transform -translate-x-1/2 z-50">
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              className="absolute top-full mt-3 left-1/2 transform -translate-x-1/2"
              variants={tooltipVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="bg-gradient-to-r from-[#2c2a28] to-[#4a4947] text-white text-xs px-4 py-3 rounded-xl shadow-2xl whitespace-nowrap border border-white/10">
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ 
                      rotate: [0, 10, -10, 0],
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity,
                      repeatType: "reverse" as const
                    }}
                  >
                    👆
                  </motion.div>
                  {/* <span className="font-medium">Navigasi Cepat</span>
                  <motion.button 
                    onClick={handleTooltipClose}
                    className="ml-1 w-4 h-4 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <span className="text-xs font-bold">×</span>
                  </motion.button> */}
                </div>
                {/* Arrow pointer ke atas */}
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-[#2c2a28]"></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Dots */}
        <motion.div 
          className="bg-white/80 backdrop-blur-sm rounded-full px-5 py-3 shadow-xl border border-white/20"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex space-x-5">
            {sections.map((section) => (
              <motion.button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                variants={dotVariants}
                animate={
                  pulsingDot === section.id 
                    ? "pulsing" 
                    : activeSection === section.id 
                    ? "active" 
                    : "normal"
                }
                whileHover="hover"
                className="w-3 h-3 rounded-full relative"
                title={section.label}
              >
                {/* Glow effect untuk dot yang aktif/pulsing */}
                {(activeSection === section.id || pulsingDot === section.id) && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-[#2c2a28] opacity-30"
                    animate={{ scale: [1, 1.8, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default Navbar;