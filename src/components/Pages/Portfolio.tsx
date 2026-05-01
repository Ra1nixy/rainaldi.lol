import { useEffect, useState, useRef, useCallback } from 'react';
import { db } from '../../config/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import type { PortfolioItem } from '../../types/portfolio';
import { ArrowLeft, ExternalLink, Github, ChevronLeft, ChevronRight, X, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Image Carousel Component - supports landscape and portrait, with swipe
const ImageCarousel = ({ 
  images, 
  title, 
  onImageClick 
}: { 
  images: string[]; 
  title: string;
  onImageClick?: (index: number) => void;
}) => {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-56 bg-gray-100 flex items-center justify-center">
        <ExternalLink size={32} className="text-gray-300" />
      </div>
    );
  }

  const prev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrent(i => (i - 1 + images.length) % images.length);
  };
  
  const next = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrent(i => (i + 1) % images.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (touchStartX.current !== null && touchEndX.current !== null) {
      const diff = touchStartX.current - touchEndX.current;
      if (Math.abs(diff) > 40) {
        diff > 0 ? next() : prev();
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <div className="relative overflow-hidden bg-gray-50 group/carousel aspect-video">
      {/* Slides */}
      <div
        className="flex h-full transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1)"
        style={{ transform: `translateX(-${current * 100}%)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {images.map((src, idx) => (
          <div 
            key={idx} 
            className="min-w-full h-full cursor-zoom-in"
            onClick={() => onImageClick?.(idx)}
          >
            <img
              src={src}
              alt={`${title} ${idx + 1}`}
              className="w-full h-full object-cover bg-gray-100 transition-transform duration-700 group-hover/carousel:scale-105"
              style={{ display: 'block' }}
            />
          </div>
        ))}
      </div>

      {/* Overlay to indicate clickable */}
      <div className="absolute top-3 right-3 opacity-0 group-hover/carousel:opacity-100 transition-opacity bg-black/30 backdrop-blur-md p-1.5 rounded-full text-white pointer-events-none">
        <Maximize2 size={14} />
      </div>

      {/* Arrows - only show if > 1 image */}
      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg opacity-0 group-hover/carousel:opacity-100 transition-all hover:bg-white active:scale-90"
            aria-label="Previous"
          >
            <ChevronLeft size={20} className="text-gray-800" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg opacity-0 group-hover/carousel:opacity-100 transition-all hover:bg-white active:scale-90"
            aria-label="Next"
          >
            <ChevronRight size={20} className="text-gray-800" />
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); setCurrent(idx); }}
                className={`rounded-full transition-all duration-300 ${idx === current
                    ? 'w-6 h-1.5 bg-white shadow-sm'
                    : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'
                  }`}
                aria-label={`Go to image ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// Lightbox Component - Full screen image viewer with swipe
const ImageLightbox = ({ 
  images, 
  initialIndex, 
  onClose 
}: { 
  images: string[]; 
  initialIndex: number; 
  onClose: () => void;
}) => {
  const [[current, direction], setCurrent] = useState([initialIndex, 0]);

  const paginate = (newDirection: number) => {
    const nextIndex = (current + newDirection + images.length) % images.length;
    setCurrent([nextIndex, newDirection]);
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft') paginate(-1);
    if (e.key === 'ArrowRight') paginate(1);
  }, [images.length, onClose, current]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [handleKeyDown]);

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95
    })
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center"
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
        <div className="text-white/70 text-sm font-medium">
          {current + 1} / {images.length}
        </div>
        <button 
          onClick={onClose}
          className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-colors backdrop-blur-md"
        >
          <X size={24} />
        </button>
      </div>

      {/* Main Image View */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            className="absolute inset-0 flex items-center justify-center p-4 md:p-12"
          >
            <img 
              src={images[current]} 
              alt="Full size" 
              className="max-w-full max-h-full object-contain select-none shadow-2xl"
            />
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons (Desktop) */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => paginate(-1)}
              className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-4 rounded-full transition-all backdrop-blur-md z-20"
            >
              <ChevronLeft size={32} />
            </button>
            <button
              onClick={() => paginate(1)}
              className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-4 rounded-full transition-all backdrop-blur-md z-20"
            >
              <ChevronRight size={32} />
            </button>
          </>
        )}
      </div>

      {/* Mobile Swipe Info & Dots */}
      {images.length > 1 && (
        <div className="absolute bottom-10 flex flex-col items-center gap-4 z-10">
          <div className="flex gap-2">
            {images.map((_, idx) => (
              <div 
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === current ? 'w-8 bg-white' : 'w-1.5 bg-white/30'
                }`}
              />
            ))}
          </div>
          <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] md:hidden">
            Swipe left or right to navigate
          </p>
        </div>
      )}

      {/* Swipe area for mobile */}
      <div 
        className="absolute inset-0 z-0 md:hidden"
        onTouchStart={(e) => {
          const touchStartX = e.touches[0].clientX;
          const handleTouchMove = (moveEvent: TouchEvent) => {
            const touchEndX = moveEvent.touches[0].clientX;
            const diff = touchStartX - touchEndX;
            if (Math.abs(diff) > 50) {
              if (diff > 0) paginate(1);
              else paginate(-1);
              document.removeEventListener('touchmove', handleTouchMove);
            }
          };
          document.addEventListener('touchmove', handleTouchMove);
          document.addEventListener('touchend', () => {
            document.removeEventListener('touchmove', handleTouchMove);
          }, { once: true });
        }}
      />
    </motion.div>
  );
};

const Portfolio = () => {
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [selectedProject, setSelectedProject] = useState<PortfolioItem | null>(null);
  const [lightboxData, setLightboxData] = useState<{ images: string[], index: number } | null>(null);

  useEffect(() => {
    fetchPortfolioItems();
  }, []);

  // Modal Component
  const ProjectDetailModal = ({ project, onClose }: { project: PortfolioItem; onClose: () => void }) => {
    useEffect(() => {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = 'unset'; };
    }, []);

    const modalImages = project.images && project.images.length > 0
      ? project.images
      : project.image ? [project.image] : [];

    return (
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-0 md:p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-[#0a0a0a]/90 backdrop-blur-md"
          onClick={onClose}
        />
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="relative bg-white w-full h-full md:h-auto md:max-w-5xl md:rounded-3xl overflow-y-auto shadow-2xl flex flex-col md:flex-row"
        >
          {/* Close button - Fixed on mobile */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-[160] bg-black/10 hover:bg-black/20 text-[#2c2a28] p-2.5 rounded-full backdrop-blur-md transition-all active:scale-90"
          >
            <X size={22} />
          </button>

          {/* Modal Content - Two Column Layout */}
          <div className="flex flex-col md:flex-row w-full">
            {/* Left: Images */}
            <div className="w-full md:w-3/5 bg-gray-50 border-r border-gray-100">
              <ImageCarousel 
                images={modalImages} 
                title={project.title} 
                onImageClick={(idx) => setLightboxData({ images: modalImages, index: idx })}
              />
            </div>
            
            {/* Right: Info */}
            <div className="w-full md:w-2/5 p-8 md:p-10 flex flex-col">
              <div className="mb-8">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mb-3 block">
                  {project.category}
                </span>
                <h2 className="text-3xl md:text-4xl font-playfair font-medium text-[#2c2a28] mb-4">
                  {project.title}
                </h2>

                <div className="flex flex-wrap gap-1.5 mb-8">
                  {project.technologies.map((tech, i) => (
                    <span
                      key={i}
                      className="bg-gray-50 text-gray-400 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border border-gray-100"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                
                <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed mb-8">
                  {project.description.split('\n').map((line, i) => (
                    <p key={i} className="mb-3">{line}</p>
                  ))}
                </div>

                <div className="flex flex-col gap-3">
                  {project.demoLink && project.demoLink !== '#' && (
                    <a
                      href={project.demoLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 bg-[#2c2a28] text-white px-8 py-4 rounded-2xl text-sm font-semibold hover:bg-black transition-all active:scale-95 shadow-xl shadow-black/10"
                    >
                      <ExternalLink size={18} /> Visit Project
                    </a>
                  )}
                  {project.githubLink && project.githubLink !== '#' && (
                    <a
                      href={project.githubLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 bg-gray-100 text-[#2c2a28] px-8 py-4 rounded-2xl text-sm font-semibold hover:bg-gray-200 transition-all active:scale-95"
                    >
                      <Github size={18} /> View Source
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  const fetchPortfolioItems = async () => {
    try {
      const q = query(collection(db, 'portfolio'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const items: PortfolioItem[] = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as PortfolioItem);
      });
      setPortfolioItems(items);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['Semua', ...new Set(portfolioItems.map(item => item.category))];

  const filteredItems = selectedCategory === 'Semua'
    ? portfolioItems
    : portfolioItems.filter(item => item.category === selectedCategory);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-12 h-12 border-2 border-[#2c2a28] border-t-transparent rounded-full mx-auto mb-6"
          />
          <p className="text-gray-400 text-[10px] tracking-[0.3em] uppercase">Loading Masterpieces</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Navbar */}
      <nav className="sticky top-0 bg-white/80 backdrop-blur-xl z-[90] border-b border-gray-100">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-3 text-xs font-bold text-gray-500 hover:text-[#2c2a28] transition-all group uppercase tracking-widest"
          >
            <div className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center group-hover:border-[#2c2a28]/20 group-hover:bg-gray-50 transition-all">
              <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            </div>
            <span>Back</span>
          </button>
          <div className="text-sm font-playfair italic text-gray-400">Selected Works</div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-12">
        {/* Filter Categories */}
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-12 md:mb-20">
            {categories.map((category, index) => (
              <button
                key={index}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all duration-300 border
                  ${selectedCategory === category
                    ? 'bg-[#2c2a28] text-white border-[#2c2a28] shadow-xl shadow-black/10'
                    : 'bg-white text-gray-500 border-gray-100 hover:border-[#2c2a28]/20 hover:text-[#2c2a28]'
                  }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        {/* Portfolio Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-32 border-2 border-dashed border-gray-100 rounded-3xl">
            <p className="text-gray-400 text-sm tracking-widest uppercase">No projects found in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
            {filteredItems.map((item, index) => {
              const images = item.images && item.images.length > 0
                ? item.images
                : item.image ? [item.image] : [];

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: index % 3 * 0.1 }}
                  className="group flex flex-col bg-white border border-gray-100 rounded-[2rem] overflow-hidden hover:shadow-2xl hover:shadow-black/5 transition-all duration-500"
                >
                  {/* Carousel Container */}
                  <div className="relative overflow-hidden">
                    <ImageCarousel 
                      images={images} 
                      title={item.title} 
                      onImageClick={(idx) => setLightboxData({ images, index: idx })}
                    />
                  </div>

                  {/* Content */}
                  <div className="p-8 flex flex-col flex-grow">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {item.category}
                      </span>
                    </div>
                    
                    <h3 className="text-2xl font-playfair font-medium text-[#2c2a28] mb-3 group-hover:text-black transition-colors">
                      {item.title}
                    </h3>
                    
                    <p className="text-gray-500 text-sm mb-6 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="flex flex-wrap gap-1 mb-8">
                      {item.technologies.slice(0, 4).map((tech: string, techIndex: number) => (
                        <span
                          key={techIndex}
                          className="text-[9px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50 px-2 py-0.5 rounded"
                        >
                          {tech}
                        </span>
                      ))}
                      {item.technologies.length > 4 && (
                        <span className="text-[9px] font-bold text-gray-300">+{item.technologies.length - 4}</span>
                      )}
                    </div>

                    <div className="mt-auto flex items-center justify-between">
                      <button
                        onClick={() => setSelectedProject(item)}
                        className="text-xs font-bold text-[#2c2a28] uppercase tracking-widest flex items-center gap-2 group/btn"
                      >
                        View Details
                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center group-hover/btn:bg-[#2c2a28] group-hover/btn:text-white transition-all">
                          <Maximize2 size={12} />
                        </div>
                      </button>
                      
                      <div className="flex gap-3">
                        {item.demoLink && item.demoLink !== '#' && (
                          <a
                            href={item.demoLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-[#2c2a28] text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-black/5"
                          >
                            <ExternalLink size={12} />
                            <span>Demo</span>
                          </a>
                        )}
                        {item.githubLink && item.githubLink !== '#' && (
                          <a
                            href={item.githubLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-500 hover:text-[#2c2a28] hover:bg-gray-100 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all"
                          >
                            <Github size={12} />
                            <span>Code</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Selected Project Modal */}
        <AnimatePresence>
          {selectedProject && (
            <ProjectDetailModal 
              project={selectedProject} 
              onClose={() => setSelectedProject(null)} 
            />
          )}
        </AnimatePresence>

        {/* Full Screen Lightbox */}
        <AnimatePresence>
          {lightboxData && (
            <ImageLightbox 
              images={lightboxData.images}
              initialIndex={lightboxData.index}
              onClose={() => setLightboxData(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Portfolio;