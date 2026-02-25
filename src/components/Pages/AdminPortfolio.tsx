import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
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
import type { PortfolioItem } from '../../types/portfolio';
import { compressImage, convertToBase64 } from '../../utils/imageCompression';
import { useDropzone } from 'react-dropzone';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Image as ImageIcon,
  Grid3x3,
  List,
  Search,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

// Modal Component
const Modal = ({ isOpen, onClose, title, children }: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  children: React.ReactNode 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white w-full md:w-[600px] md:max-w-[90vw] rounded-t-2xl md:rounded-2xl max-h-[90vh] overflow-y-auto animate-slideUp md:animate-fadeIn">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-[#2c2a28]">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  );
};

// Alert Component
const Alert = ({ message, type = 'success', onClose }: { 
  message: string; 
  type?: 'success' | 'error'; 
  onClose: () => void 
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slideDown`}>
      <div className={`rounded-xl shadow-lg p-4 flex items-start gap-3 ${
        type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
      }`}>
        {type === 'success' ? (
          <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
        ) : (
          <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
        )}
        <p className={`flex-1 text-sm ${
          type === 'success' ? 'text-green-800' : 'text-red-800'
        }`}>
          {message}
        </p>
        <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-full">
          <X size={16} className={type === 'success' ? 'text-green-800' : 'text-red-800'} />
        </button>
      </div>
    </div>
  );
};

// Loading Skeleton Component
const SkeletonCard = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
    <div className="aspect-square bg-gray-200"></div>
    <div className="p-3 space-y-2">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
    </div>
  </div>
);

const AdminPortfolio = () => {
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
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
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

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

  const showAlert = (message: string, type: 'success' | 'error') => {
    setAlert({ message, type });
  };

  const fetchPortfolioItems = async () => {
    try {
      setInitialLoading(true);
      const q = query(collection(db, 'portfolio'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const items: PortfolioItem[] = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as PortfolioItem);
      });
      setPortfolioItems(items);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      showAlert('Gagal mengambil data portfolio', 'error');
    } finally {
      setInitialLoading(false);
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
      showAlert('Harap isi semua field yang wajib', 'error');
      return;
    }

    try {
      setUploading(true);
      
      let imageBase64 = formData.image || '';
      
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
        showAlert('Portfolio berhasil diupdate!', 'success');
      } else {
        // Add new item
        portfolioData.createdAt = Timestamp.now();
        await addDoc(collection(db, 'portfolio'), portfolioData);
        showAlert('Portfolio berhasil ditambahkan!', 'success');
      }

      resetForm();
      setShowModal(false);
      fetchPortfolioItems();
    } catch (error) {
      console.error('Error saving portfolio:', error);
      showAlert('Gagal menyimpan portfolio', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (item: PortfolioItem) => {
    setEditingItem(item);
    setFormData(item);
    setImagePreview(item.image);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus item ini?')) {
      try {
        setDeleteLoading(id);
        await deleteDoc(doc(db, 'portfolio', id));
        showAlert('Portfolio berhasil dihapus!', 'success');
        fetchPortfolioItems();
      } catch (error) {
        console.error('Error deleting portfolio:', error);
        showAlert('Gagal menghapus portfolio', 'error');
      } finally {
        setDeleteLoading(null);
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

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  // Filter items based on search and category
  const filteredItems = portfolioItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.technologies.some(tech => tech.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...new Set(portfolioItems.map(item => item.category))];

  const categories_list = [
    "Web Application",
    "Web Development",
    "Website",
    "Mobile App",
    "Web App"
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Alert */}
      {alert && (
        <Alert 
          message={alert.message} 
          type={alert.type} 
          onClose={() => setAlert(null)} 
        />
      )}

      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-[#2c2a28]">Admin Portfolio</h1>
            {!initialLoading && (
              <span className="bg-[#2c2a28] text-white text-xs px-2 py-1 rounded-full">
                {filteredItems.length}
              </span>
            )}
          </div>
          <button
            onClick={openAddModal}
            className="bg-[#2c2a28] text-white p-3 rounded-full shadow-lg hover:bg-opacity-90 transition-all active:scale-95"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="sticky top-[57px] z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200 px-4 py-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari portfolio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2c2a28] focus:border-transparent"
            />
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 rounded-xl transition-colors ${
                viewMode === 'grid' ? 'bg-[#2c2a28] text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <Grid3x3 size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 rounded-xl transition-colors ${
                viewMode === 'list' ? 'bg-[#2c2a28] text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <List size={18} />
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 text-sm whitespace-nowrap rounded-full transition-all ${
                selectedCategory === cat
                  ? 'bg-[#2c2a28] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat === 'all' ? 'Semua' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-4 pb-20">
        {/* Loading State */}
        {initialLoading && (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!initialLoading && filteredItems.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <ImageIcon size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-1">Belum ada portfolio</h3>
            <p className="text-sm text-gray-500 mb-4">Tambahkan portfolio pertama Anda</p>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#2c2a28] text-white rounded-xl hover:bg-opacity-90 transition-colors active:scale-95"
            >
              <Plus size={18} />
              Tambah Portfolio
            </button>
          </div>
        )}

        {/* Grid View */}
        {!initialLoading && filteredItems.length > 0 && viewMode === 'grid' && (
          <div className="grid grid-cols-2 gap-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all active:scale-[0.98]"
              >
                <div className="relative aspect-square">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-md hover:bg-white transition-colors"
                    >
                      <Edit2 size={14} className="text-blue-600" />
                    </button>
                    <button
                      onClick={() => item.id && handleDelete(item.id)}
                      disabled={deleteLoading === item.id}
                      className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-md hover:bg-white transition-colors disabled:opacity-50"
                    >
                      {deleteLoading === item.id ? (
                        <Loader2 size={14} className="animate-spin text-red-600" />
                      ) : (
                        <Trash2 size={14} className="text-red-600" />
                      )}
                    </button>
                  </div>
                  <div className="absolute bottom-2 left-2 right-2">
                    <span className="text-xs bg-black/60 text-white px-2 py-1 rounded-full backdrop-blur-sm">
                      {item.category}
                    </span>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-sm text-[#2c2a28] line-clamp-1">
                    {item.title}
                  </h3>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.technologies.slice(0, 2).map((tech, i) => (
                      <span key={i} className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full">
                        {tech}
                      </span>
                    ))}
                    {item.technologies.length > 2 && (
                      <span className="text-[10px] text-gray-500">
                        +{item.technologies.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View */}
        {!initialLoading && filteredItems.length > 0 && viewMode === 'list' && (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all active:scale-[0.99]"
              >
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-[#2c2a28] line-clamp-1">
                          {item.title}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {item.category}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} className="text-blue-600" />
                        </button>
                        <button
                          onClick={() => item.id && handleDelete(item.id)}
                          disabled={deleteLoading === item.id}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {deleteLoading === item.id ? (
                            <Loader2 size={16} className="animate-spin text-red-600" />
                          ) : (
                            <Trash2 size={16} className="text-red-600" />
                          )}
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {item.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.technologies.slice(0, 3).map((tech, i) => (
                        <span key={i} className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Form */}
      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        title={editingItem ? 'Edit Portfolio' : 'Tambah Portfolio Baru'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Judul Project *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title || ''}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#2c2a28] focus:border-transparent"
              placeholder="Contoh: Aplikasi E-commerce"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Kategori *
            </label>
            <select
              name="category"
              value={formData.category || ''}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#2c2a28] focus:border-transparent"
              required
            >
              <option value="">Pilih Kategori</option>
              {categories_list.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Gambar Project
            </label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
                ${isDragActive ? 'border-[#2c2a28] bg-gray-50' : 'border-gray-300 hover:border-[#2c2a28]'}`}
            >
              <input {...getInputProps()} />
              {imagePreview ? (
                <div className="relative">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="max-h-48 mx-auto rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImageFile(null);
                      setImagePreview('');
                      setFormData(prev => ({ ...prev, image: '' }));
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <ImageIcon size={40} className="mx-auto text-gray-400" />
                  <p className="text-gray-600 text-sm">
                    {isDragActive ? 'Drop gambar di sini' : 'Klik atau drag & drop'}
                  </p>
                  <p className="text-xs text-gray-400">
                    Format: JPG, PNG, GIF (Max 5MB, akan dikompres ke 100KB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Technologies */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Teknologi
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTechnology())}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#2c2a28] focus:border-transparent"
                placeholder="Contoh: React.js"
              />
              <button
                type="button"
                onClick={handleAddTechnology}
                className="px-5 py-3 bg-[#2c2a28] text-white rounded-xl hover:bg-opacity-90 transition-colors active:scale-95"
              >
                <Plus size={18} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(formData.technologies || []).map((tech, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 bg-gray-100 px-3 py-1.5 rounded-full text-sm"
                >
                  {tech}
                  <button
                    type="button"
                    onClick={() => handleRemoveTechnology(index)}
                    className="text-gray-500 hover:text-red-500"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Deskripsi *
            </label>
            <textarea
              name="description"
              value={formData.description || ''}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#2c2a28] focus:border-transparent"
              placeholder="Jelaskan tentang project ini..."
              required
            />
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Link Demo
              </label>
              <input
                type="url"
                name="demoLink"
                value={formData.demoLink || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#2c2a28] focus:border-transparent"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Link GitHub
              </label>
              <input
                type="url"
                name="githubLink"
                value={formData.githubLink || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#2c2a28] focus:border-transparent"
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Form Buttons */}
          <div className="flex gap-3 pt-3">
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 py-3.5 bg-[#2c2a28] text-white rounded-xl hover:bg-opacity-90 transition-colors disabled:opacity-50 font-medium active:scale-95 flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Menyimpan...
                </>
              ) : (
                editingItem ? 'Update' : 'Simpan'
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 py-3.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors active:scale-95"
            >
              Batal
            </button>
          </div>
        </form>
      </Modal>

      {/* Floating Action Button untuk Mobile (FAB) */}
      {!showModal && (
        <button
          onClick={openAddModal}
          className="fixed bottom-6 right-6 md:hidden bg-[#2c2a28] text-white p-4 rounded-full shadow-xl hover:bg-opacity-90 transition-all active:scale-95 z-10"
        >
          <Plus size={24} />
        </button>
      )}
    </div>
  );
};

export default AdminPortfolio;