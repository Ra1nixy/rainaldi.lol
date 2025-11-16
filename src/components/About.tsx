import { Mail, Phone, MapPin } from "lucide-react";

const About = () => {
  return (
    <section id="about" className="pt-20 pb-24 md:py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-playfair font-light text-[#2c2a28] text-center mb-16">
            Tentang Saya
          </h2>
          
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Profil Section */}
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-medium text-[#2c2a28] mb-4">Profil</h3>
                <div className="bg-gray-50 rounded-2xl p-6">
                  <p className="text-gray-600 leading-relaxed">
                    Lulusan S1 Ilmu Komputer dari Universitas Putra Bangsa dengan IPK 3.88. 
                    Memiliki pengalaman profesional sebagai Junior Software Developer dan IT Support. 
                    Terampil dalam mengembangkan solusi teknologi untuk meningkatkan efisiensi bisnis.
                  </p>
                </div>
              </div>

              {/* Kontak Section */}
              <div>
                <h3 className="text-xl font-medium text-[#2c2a28] mb-6">Kontak</h3>
                <div className="space-y-4">
                  <div className="flex items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-300">
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mr-4 shadow-sm">
                      <Mail className="w-5 h-5 text-[#2c2a28]" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-gray-700 font-medium">rainaldiputra.s@gmail.com</p>
                    </div>
                  </div>

                  <div className="flex items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-300">
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mr-4 shadow-sm">
                      <Phone className="w-5 h-5 text-[#2c2a28]" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Telepon</p>
                      <p className="text-gray-700 font-medium">+62815-4849-4508</p>
                    </div>
                  </div>

                  <div className="flex items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-300">
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mr-4 shadow-sm">
                      <MapPin className="w-5 h-5 text-[#2c2a28]" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Lokasi</p>
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