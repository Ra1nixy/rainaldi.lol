import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase'; // Dari Pages ke config (naik 2 level)
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs,
  query,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import type { PortfolioItem } from '../../types/portfolio'; // Gunakan type-only import
import { compressImage, convertToBase64 } from '../../utils/imageCompression'; // Dari Pages ke utils (naik 2 level)
import { useDropzone } from 'react-dropzone';

const AdminPortfolio = () => {
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [formData, setFormData] = useState<Partial<PortfolioItem>>({
    title: '',
    category: '',
    image: '',
    technologies: [],
    description: '',
    demoLink: '',
    githubLink: ''
  });
  const [techInput, setTechInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    onDrop: async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        setImageFile(file);
        const preview = await convertToBase64(file);
        setImagePreview(preview);
      }
    }
  });

  useEffect(() => {
    fetchPortfolioItems();
  }, []);

  const fetchPortfolioItems = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'portfolio'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const items: PortfolioItem[] = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as PortfolioItem);
      });
      setPortfolioItems(items);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      alert('Gagal mengambil data portfolio');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddTechnology = () => {
    if (techInput.trim()) {
      const currentTechs = formData.technologies || [];
      setFormData(prev => ({
        ...prev,
        technologies: [...currentTechs, techInput.trim()]
      }));
      setTechInput('');
    }
  };

  const handleRemoveTechnology = (index: number) => {
    const currentTechs = formData.technologies || [];
    setFormData(prev => ({
      ...prev,
      technologies: currentTechs.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.category || !formData.description) {
      alert('Harap isi semua field yang wajib');
      return;
    }

    try {
      setUploading(true);
      
      let imageBase64 = formData.image || '';
      
      // Compress and convert image if new file is uploaded
      if (imageFile) {
        imageBase64 = await compressImage(imageFile);
      }

      const portfolioData: any = {
        ...formData,
        image: imageBase64,
        technologies: formData.technologies || [],
        updatedAt: Timestamp.now()
      };

      if (editingItem?.id) {
        // Update existing item
        const docRef = doc(db, 'portfolio', editingItem.id);
        await updateDoc(docRef, portfolioData);
        alert('Portfolio berhasil diupdate!');
      } else {
        // Add new item
        portfolioData.createdAt = Timestamp.now();
        await addDoc(collection(db, 'portfolio'), portfolioData);
        alert('Portfolio berhasil ditambahkan!');
      }

      // Reset form
      resetForm();
      fetchPortfolioItems();
    } catch (error) {
      console.error('Error saving portfolio:', error);
      alert('Gagal menyimpan portfolio');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (item: PortfolioItem) => {
    setEditingItem(item);
    setFormData(item);
    setImagePreview(item.image);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus item ini?')) {
      try {
        await deleteDoc(doc(db, 'portfolio', id));
        alert('Portfolio berhasil dihapus!');
        fetchPortfolioItems();
      } catch (error) {
        console.error('Error deleting portfolio:', error);
        alert('Gagal menghapus portfolio');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      category: '',
      image: '',
      technologies: [],
      description: '',
      demoLink: '',
      githubLink: ''
    });
    setEditingItem(null);
    setImageFile(null);
    setImagePreview('');
    setTechInput('');
  };

  const categories = [
    "Web Application",
    "Web Development",
    "Website",
    "Mobile App",
    "Web App"
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-20">
      <div className="container mx-auto px-6">
        <h1 className="text-3xl font-playfair font-light text-[#2c2a28] mb-8">
          Admin Portfolio
        </h1>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-medium text-[#2c2a28] mb-4">
            {editingItem ? 'Edit Portfolio' : 'Tambah Portfolio Baru'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Judul Project *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c2a28] focus:border-transparent"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kategori *
              </label>
              <select
                name="category"
                value={formData.category || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c2a28] focus:border-transparent"
                required
              >
                <option value="">Pilih Kategori</option>
                {categories.map((cat: string) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gambar Project (Max 5MB, akan dikompres ke 100KB)
              </label>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                  ${isDragActive ? 'border-[#2c2a28] bg-gray-50' : 'border-gray-300 hover:border-[#2c2a28]'}`}
              >
                <input {...getInputProps()} />
                {imagePreview ? (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="max-h-48 mx-auto rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImageFile(null);
                        setImagePreview('');
                        setFormData(prev => ({ ...prev, image: '' }));
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-600">
                      {isDragActive ? 'Drop gambar di sini' : 'Klik atau drag & drop gambar di sini'}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      Format: JPG, PNG, GIF (Max 5MB)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Technologies */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teknologi yang Digunakan
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTechnology())}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c2a28] focus:border-transparent"
                  placeholder="Contoh: React.js"
                />
                <button
                  type="button"
                  onClick={handleAddTechnology}
                  className="px-4 py-2 bg-[#2c2a28] text-white rounded-lg hover:bg-opacity-90 transition-colors"
                >
                  Tambah
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(formData.technologies || []).map((tech: string, index: number) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full text-sm"
                  >
                    {tech}
                    <button
                      type="button"
                      onClick={() => handleRemoveTechnology(index)}
                      className="text-gray-500 hover:text-red-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deskripsi *
              </label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c2a28] focus:border-transparent"
                required
              />
            </div>

            {/* Links */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link Demo
                </label>
                <input
                  type="url"
                  name="demoLink"
                  value={formData.demoLink || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c2a28] focus:border-transparent"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link GitHub
                </label>
                <input
                  type="url"
                  name="githubLink"
                  value={formData.githubLink || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c2a28] focus:border-transparent"
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* Form Buttons */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={uploading}
                className="px-6 py-2 bg-[#2c2a28] text-white rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50"
              >
                {uploading ? 'Menyimpan...' : (editingItem ? 'Update' : 'Simpan')}
              </button>
              {editingItem && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Portfolio List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-medium text-[#2c2a28] mb-4">
            Daftar Portfolio
          </h2>
          
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="space-y-4">
              {portfolioItems.map((item: PortfolioItem) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-[#2c2a28]">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.category}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.technologies.slice(0, 3).map((tech: string, i: number) => (
                        <span key={i} className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                          {tech}
                        </span>
                      ))}
                      {item.technologies.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{item.technologies.length - 3} lainnya
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => item.id && handleDelete(item.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPortfolio;