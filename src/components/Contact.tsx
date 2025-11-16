import { useState } from 'react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const experiences = [
    {
      title: 'IT Internship',
      period: 'September 2025 - Sekarang',
      company: 'Universitas Putra Bangsa',
      responsibilities: [
        'Membangun sistem manajemen SDM dan presensi yang terintegrasi menggunakan REST API Laravel dan React JS',
      ]
    },
    {
      title: 'IT Support Intern',
      period: 'Sep 2024 - Jan 2025',
      company: 'Pengadilan Negeri Kebumen',
      responsibilities: [
        'Mengembangkan sistem presensi digital untuk peserta magang',
        'Memberikan dukungan teknis dan pemeliharaan sistem IT'
      ]
    },
    {
      title: 'Junior Software Developer',
      period: 'Jun 2024 - Dec 2024',
      company: 'LP3M Universitas Putra Bangsa',
      responsibilities: [
        'Berkontribusi dalam pengembangan sistem untuk program PKM',
        'Mengelola dokumentasi dan publikasi kegiatan',
        'Mengimplementasikan fitur untuk pemberdayaan masyarakat'
      ]
    },
    {
      title: 'Web Developer (KKL)',
      period: 'Agustus 2024',
      company: 'Caraka Wedding',
      responsibilities: [
        'Membangun landing page untuk promosi dan pembukuan',
        'Meningkatkan profesionalisme bisnis klien',
        'Menyederhanakan proses administrasi'
      ]
    }
  ];

  const education = {
    degree: 'S1 Ilmu Komputer',
    graduation: 'Lulus 2025',
    university: 'Universitas Putra Bangsa',
    gpa: 'IPK: 3.88/4.00',
    description: 'Fokus pada pengembangan perangkat lunak dan manajemen sistem informasi. Aktif dalam kegiatan penelitian dan pengabdian masyarakat melalui teknologi.'
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    alert('Thank you for your message! I will get back to you soon.');
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <section id="contact" className="py-20 bg-gray-50">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-playfair font-light text-[#2c2a28] text-center mb-4">
          Pengalaman Kerja
        </h2>
        <p className="text-gray-600 text-center mb-16 max-w-2xl mx-auto">
          Perjalanan profesional dan kontribusi dalam berbagai proyek pengembangan
        </p>

        {/* Experience Timeline */}
        <div className="max-w-4xl mx-auto mb-20">
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-gray-300 transform md:-translate-x-1/2"></div>
            
            {experiences.map((exp, index) => (
              <div key={index} className={`relative flex items-start mb-12 ${
                index % 2 === 0 ? 'md:justify-start' : 'md:justify-end'
              }`}>
                {/* Timeline Dot */}
                <div className={`absolute left-4 md:left-1/2 w-3 h-3 rounded-full transform md:-translate-x-1/2 z-10 ${
                  index === 0 ? 'bg-green-500 animate-pulse' : 'bg-[#2c2a28]'
                }`}></div>
                
                {/* Content - Selang-seling kiri-kanan */}
                <div className={`ml-12 md:ml-0 md:w-5/12 ${
                  index % 2 === 0 ? 'md:pr-8' : 'md:pl-8'
                }`}>
                  <div className={`bg-white rounded-xl p-6 shadow-sm border ${
                    index === 0 ? 'border-green-200' : 'border-gray-200'
                  } hover:shadow-md transition-shadow duration-300`}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                      <h3 className="text-lg font-medium text-[#2c2a28]">{exp.title}</h3>
                      <span className={`text-sm px-3 py-1 rounded-full mt-1 sm:mt-0 ${
                        index === 0 
                          ? 'text-green-700 bg-green-100' 
                          : 'text-gray-500 bg-gray-100'
                      }`}>
                        {exp.period}
                      </span>
                    </div>
                    <p className="text-gray-700 font-medium mb-4">{exp.company}</p>
                    <ul className="space-y-2">
                      {exp.responsibilities.map((resp, respIndex) => (
                        <li key={respIndex} className="flex items-start">
                          <div className={`w-1.5 h-1.5 rounded-full mt-2 mr-3 flex-shrink-0 ${
                            index === 0 ? 'bg-green-500' : 'bg-[#2c2a28]'
                          }`}></div>
                          <span className="text-gray-600 text-sm leading-relaxed">{resp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Education Section */}
        <div className="max-w-4xl mx-auto mb-20">
          <h2 className="text-3xl md:text-4xl font-playfair font-light text-[#2c2a28] text-center mb-4">
            Pendidikan
          </h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Latar belakang akademik dan pencapaian selama masa studi
          </p>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
            <div className="grid md:grid-cols-3 gap-8 items-start">
              {/* Left Side - Basic Info */}
              <div className="md:col-span-1">
                <div className="text-center md:text-left">
                  <h3 className="text-2xl font-light text-[#2c2a28] mb-2">{education.degree}</h3>
                  <p className="text-gray-700 font-medium mb-4">{education.university}</p>
                  <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full inline-block font-medium">
                    {education.gpa}
                  </div>
                  <p className="text-gray-500 mt-3">{education.graduation}</p>
                </div>
              </div>

              {/* Right Side - Description */}
              <div className="md:col-span-2">
                <div className="border-l-2 border-[#2c2a28] pl-6">
                  <p className="text-gray-600 leading-relaxed">
                    {education.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form Section */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-playfair font-light text-[#2c2a28] text-center mb-4">
            Hubungi Saya
          </h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Tertarik berkolaborasi? Mari berdiskusi tentang proyek Anda
          </p>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div>
              <div className="space-y-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-[#2c2a28]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Email</p>
                    <p className="text-gray-800 font-medium">rainaldiputra.s@gmail.com</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-[#2c2a28]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Telepon</p>
                    <p className="text-gray-800 font-medium">+62815-4849-4508</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-[#2c2a28]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Lokasi</p>
                    <p className="text-gray-800 font-medium">Kebumen, Jawa Tengah</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Contact Form */}
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
                    Nama
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c2a28] focus:border-transparent transition-all"
                    placeholder="Masukkan nama Anda"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c2a28] focus:border-transparent transition-all"
                    placeholder="Masukkan email Anda"
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-gray-700 font-medium mb-2">
                    Pesan
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c2a28] focus:border-transparent transition-all resize-none"
                    placeholder="Ceritakan tentang proyek atau kolaborasi yang Anda inginkan"
                  ></textarea>
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-[#2c2a28] text-white py-4 rounded-lg font-medium hover:bg-gray-800 transition-colors duration-300"
                >
                  Kirim Pesan
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;