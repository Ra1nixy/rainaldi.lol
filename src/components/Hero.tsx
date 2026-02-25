import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section id="home" className="min-h-screen flex items-center justify-center bg-white py-20">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Text Content - Left Side */}
          <div className="lg:w-1/2 text-center lg:text-left order-2 lg:order-1">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-playfair font-light text-[#2c2a28] mb-6 tracking-tight">
              Rainaldi Putra Setiawan
            </h1>
            
            <div className="text-xl md:text-2xl text-[#2c2a28] mb-8 font-extralight tracking-wide">
              Junior Web Developer
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <a 
                href="#contact" 
                className="bg-[#2c2a28] text-white px-8 py-4 rounded-lg font-normal hover:bg-gray-800 transition-colors duration-300 tracking-wide"
              >
                Hubungi Saya
              </a>
              <Link 
                to="/portfolio"
                className="border border-[#2c2a28] text-[#2c2a28] px-8 py-4 rounded-lg font-normal hover:bg-[#2c2a28] hover:text-white transition-colors duration-300 tracking-wide inline-block"
              >
                Portofolio
              </Link>
            </div>
          </div>

          {/* Image Content - Right Side */}
          <div className="lg:w-1/2 flex justify-center order-1 lg:order-2">
            <div className="w-64 h-64 md:w-80 md:h-80 rounded-full bg-gray-50 flex items-center justify-center overflow-hidden">
              <div className="w-56 h-56 md:w-72 md:h-72 rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
                <img 
                  src="/img/aku.jpg" 
                  alt="Rainaldi Putra Setiawan"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback jika gambar tidak ditemukan
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      const fallback = document.createElement('span');
                      fallback.className = 'text-6xl md:text-8xl font-extralight text-[#2c2a28]';
                      fallback.textContent = 'R';
                      parent.appendChild(fallback);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;