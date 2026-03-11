import { useEffect, useState, useRef } from 'react';
import { db } from '../../config/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import type { PortfolioItem } from '../../types/portfolio';
import { ArrowLeft, ExternalLink, Github, ChevronLeft, ChevronRight } from 'lucide-react';

// Image Carousel Component - supports landscape and portrait, with swipe
const ImageCarousel = ({ images, title }: { images: string[]; title: string }) => {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
        <ExternalLink size={32} className="text-gray-300" />
      </div>
    );
  }

  const prev = () => setCurrent(i => (i - 1 + images.length) % images.length);
  const next = () => setCurrent(i => (i + 1) % images.length);

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
    <div className="relative overflow-hidden bg-gray-50">
      {/* Slides */}
      <div
        className="flex transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {images.map((src, idx) => (
          <div key={idx} className="min-w-full">
            <img
              src={src}
              alt={`${title} ${idx + 1}`}
              className="w-full object-contain max-h-72 bg-gray-50"
              style={{ display: 'block' }}
            />
          </div>
        ))}
      </div>

      {/* Arrows - only show if > 1 image */}
      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-1.5 shadow-md hover:bg-white transition-colors"
            aria-label="Previous"
          >
            <ChevronLeft size={18} className="text-gray-700" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-1.5 shadow-md hover:bg-white transition-colors"
            aria-label="Next"
          >
            <ChevronRight size={18} className="text-gray-700" />
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
                className={`rounded-full transition-all duration-200 ${idx === current
                    ? 'w-4 h-1.5 bg-gray-900'
                    : 'w-1.5 h-1.5 bg-gray-400/60'
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

const Portfolio = () => {
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [selectedProject, setSelectedProject] = useState<PortfolioItem | null>(null);

  useEffect(() => {
    fetchPortfolioItems();
  }, []);

  // Modal Component
  const ProjectDetailModal = ({ project, onClose }: { project: PortfolioItem; onClose: () => void }) => {
    // Lock scroll
    useEffect(() => {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = 'unset'; };
    }, []);

    const modalImages = project.images && project.images.length > 0
      ? project.images
      : project.image ? [project.image] : [];

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6">
        <div 
          className="absolute inset-0 bg-[#2c2a28]/80 backdrop-blur-md animate-fadeIn"
          onClick={onClose}
        />
        <div className="relative bg-white w-full h-full md:h-auto md:max-w-4xl md:rounded-2xl overflow-y-auto animate-slideUp shadow-2xl">
          {/* Close button - Fixed on mobile */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-md transition-colors"
          >
            <ArrowLeft className="rotate-90 md:rotate-0" size={24} />
          </button>

          {/* Modal Content */}
          <div className="flex flex-col">
            <div className="bg-gray-100">
              <ImageCarousel images={modalImages} title={project.title} />
            </div>
            
            <div className="p-6 md:p-10">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">
                    {project.category}
                  </span>
                  <h2 className="text-3xl md:text-4xl font-playfair font-medium text-[#2c2a28]">
                    {project.title}
                  </h2>
                </div>
                
                <div className="flex gap-3">
                  {project.demoLink && project.demoLink !== '#' && (
                    <a
                      href={project.demoLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-[#2c2a28] text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-black transition-all active:scale-95 shadow-lg shadow-black/10"
                    >
                      <ExternalLink size={18} /> Live Demo
                    </a>
                  )}
                  {project.githubLink && project.githubLink !== '#' && (
                    <a
                      href={project.githubLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-gray-100 text-[#2c2a28] px-6 py-3 rounded-xl text-sm font-medium hover:bg-gray-200 transition-all active:scale-95"
                    >
                      <Github size={18} /> Code
                    </a>
                  )}
                </div>
              </div>

              <div className="prose prose-sm max-w-none text-gray-600 mb-8 leading-relaxed">
                {project.description.split('\n').map((line, i) => (
                  <p key={i} className="mb-4">{line}</p>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-8">
                <h4 className="text-sm font-bold text-[#2c2a28] uppercase tracking-wider mb-4">
                  Technologies Used
                </h4>
                <div className="flex flex-wrap gap-2">
                  {project.technologies.map((tech, i) => (
                    <span
                      key={i}
                      className="bg-gray-50 text-gray-600 px-4 py-2 rounded-lg text-sm border border-gray-100"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
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

  const handleGoBack = () => {
    window.history.back();
  };

  // Get unique categories from items
  const categories = ['Semua', ...new Set(portfolioItems.map(item => item.category))];

  // Filter items based on selected category
  const filteredItems = selectedCategory === 'Semua'
    ? portfolioItems
    : portfolioItems.filter(item => item.category === selectedCategory);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-2 border-[#2c2a28] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm tracking-wide">LOADING PORTFOLIO</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Simple Header with Back Button */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-sm z-10 border-b border-gray-100">
        <div className="container mx-auto px-6 py-4">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#2c2a28] transition-colors group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span>Kembali</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-playfair font-light text-[#2c2a28] mb-4">
            Portofolio
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Kumpulan proyek-proyek yang telah saya kerjakan, dari website company profile
            hingga aplikasi web kompleks.
          </p>
        </div>

        {/* Filter Categories */}
        {categories.length > 1 && (
          <div className="flex flex-wrap justify-center gap-3 mb-16">
            {categories.map((category, index) => (
              <button
                key={index}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 text-sm border rounded-full transition-colors duration-300
                  ${selectedCategory === category
                    ? 'bg-[#2c2a28] text-white border-[#2c2a28]'
                    : 'border-gray-200 hover:bg-[#2c2a28] hover:text-white'
                  }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        {/* Portfolio Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-sm">Belum ada portfolio dalam kategori ini.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map((item) => {
              // Resolve images: prefer images[] array, fall back to image string
              const images = item.images && item.images.length > 0
                ? item.images
                : item.image ? [item.image] : [];

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedProject(item)}
                  className="group border border-gray-200 rounded-lg overflow-hidden hover:shadow-xl hover:border-[#2c2a28]/20 transition-all duration-500 cursor-pointer bg-white"
                >
                  {/* Carousel */}
                  <div className="pointer-events-none md:pointer-events-auto">
                    <ImageCarousel images={images} title={item.title} />
                  </div>

                  {/* Mobile Action Buttons (always visible on mobile) */}
                  <div className="flex gap-2 px-4 py-2 border-b border-gray-100 md:hidden">
                    {item.demoLink && item.demoLink !== '#' && (
                      <a
                        href={item.demoLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#2c2a28] text-white rounded-full"
                      >
                        <ExternalLink size={12} /> Demo
                      </a>
                    )}
                    {item.githubLink && item.githubLink !== '#' && (
                      <a
                        href={item.githubLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gray-200 rounded-full text-gray-700"
                      >
                        <Github size={12} /> Code
                      </a>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500 uppercase tracking-wider">
                        {item.category}
                      </span>
                      {/* Desktop action links */}
                      <div className="hidden md:flex gap-2">
                        {item.demoLink && item.demoLink !== '#' && (
                          <a
                            href={item.demoLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-[#2c2a28] transition-colors"
                            aria-label="Demo"
                          >
                            <ExternalLink size={16} />
                          </a>
                        )}
                        {item.githubLink && item.githubLink !== '#' && (
                          <a
                            href={item.githubLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-[#2c2a28] transition-colors"
                            aria-label="GitHub"
                          >
                            <Github size={16} />
                          </a>
                        )}
                      </div>
                    </div>
                    <h3 className="text-xl font-medium text-[#2c2a28] mb-2">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      {item.description}
                    </p>

                    {/* Technologies */}
                    <div className="flex flex-wrap gap-2">
                      {item.technologies.map((tech: string, techIndex: number) => (
                        <span
                          key={techIndex}
                          className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Selected Project Modal */}
        {selectedProject && (
          <ProjectDetailModal 
            project={selectedProject} 
            onClose={() => setSelectedProject(null)} 
          />
        )}
      </div>
    </div>
  );
};

export default Portfolio;