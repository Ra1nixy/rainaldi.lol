import { Mail, Phone, MapPin } from "lucide-react";

const About = () => {
  return (
    <section id="about" className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-playfair font-light text-[#2c2a28] text-center mb-16">
            Tentang Saya
          </h2>
          
          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* Profil Section */}
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-medium text-[#2c2a28] mb-4 border-b border-gray-200 pb-2">
                  Profil
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Lulusan S1 Ilmu Komputer dari Universitas Putra Bangsa dengan IPK 3.88. 
                  Memiliki pengalaman profesional sebagai Junior Software Developer dan IT Support. 
                  Terampil dalam mengembangkan solusi teknologi untuk meningkatkan efisiensi bisnis.
                </p>
              </div>
            </div>

            {/* Kontak Section */}
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-medium text-[#2c2a28] mb-4 border-b border-gray-200 pb-2">
                  Kontak
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center group">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-4 group-hover:bg-[#2c2a28] transition-colors duration-300">
                      <Mail className="w-4 h-4 text-[#2c2a28] group-hover:text-white transition-colors duration-300" />
                    </div>
                    <div>
                      <p className="text-gray-700 font-medium">rainaldiputra.s@gmail.com</p>
                    </div>
                  </div>

                  <div className="flex items-center group">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-4 group-hover:bg-[#2c2a28] transition-colors duration-300">
                      <Phone className="w-4 h-4 text-[#2c2a28] group-hover:text-white transition-colors duration-300" />
                    </div>
                    <div>
                      <p className="text-gray-700 font-medium">+62815-4849-4508</p>
                    </div>
                  </div>

                  <div className="flex items-center group">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-4 group-hover:bg-[#2c2a28] transition-colors duration-300">
                      <MapPin className="w-4 h-4 text-[#2c2a28] group-hover:text-white transition-colors duration-300" />
                    </div>
                    <div>
                      <p className="text-gray-700 font-medium">Kebumen, Jawa Tengah</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;