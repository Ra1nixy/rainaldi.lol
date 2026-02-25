import { useEffect, useState } from 'react';
import { db } from '../../config/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import type { PortfolioItem } from '../../types/portfolio';
import { ArrowLeft, ExternalLink, Github } from 'lucide-react';

const Portfolio = () => {
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  useEffect(() => {
    fetchPortfolioItems();
  }, []);

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

        {/* Filter Categories - Style seperti sebelumnya */}
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
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="group border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                {/* Image Container */}
                <div className="relative overflow-hidden h-48">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  
                  {/* Overlay dan Tombol - Selalu terlihat di mobile, hover di desktop */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 
                                md:opacity-0 md:group-hover:opacity-100
                                flex items-center justify-center gap-4">
                    {item.demoLink && item.demoLink !== '#' && (
                      <a
                        href={item.demoLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white text-[#2c2a28] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2c2a28] hover:text-white transition-colors duration-300"
                      >
                        Demo
                      </a>
                    )}
                    {item.githubLink && item.githubLink !== '#' && (
                      <a
                        href={item.githubLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white text-[#2c2a28] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2c2a28] hover:text-white transition-colors duration-300"
                      >
                        Code
                      </a>
                    )}
                  </div>

                  {/* Tombol untuk Mobile - Selalu terlihat di bawah gambar */}
                  <div className="absolute bottom-2 right-2 flex gap-2 md:hidden">
                    {item.demoLink && item.demoLink !== '#' && (
                      <a
                        href={item.demoLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg"
                        aria-label="Demo"
                      >
                        <ExternalLink size={16} className="text-[#2c2a28]" />
                      </a>
                    )}
                    {item.githubLink && item.githubLink !== '#' && (
                      <a
                        href={item.githubLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg"
                        aria-label="Code"
                      >
                        <Github size={16} className="text-[#2c2a28]" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500 uppercase tracking-wider">
                      {item.category}
                    </span>
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Portfolio;