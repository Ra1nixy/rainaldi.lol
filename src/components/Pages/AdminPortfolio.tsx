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

// Modal Component dengan optimasi mobile
const Modal = ({ isOpen, onClose, title, children }: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  children: React.ReactNode 
}) => {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content - iOS Style Bottom Sheet */}
      <div className="relative bg-white w-full md:w-[600px] md:max-w-[90vw] rounded-t-[32px] md:rounded-[32px] max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp md:animate-fadeIn">
        <div className="sticky top-0 bg-white/90 backdrop-blur-xl border-b border-gray-100 px-6 py-5 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 bg-gray-50 rounded-full transition-colors text-gray-500"
            aria-label="Tutup"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>
        
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

// Alert Component - Modern Pill Notification
const Alert = ({ message, type = 'success', onClose }: { 
  message: string; 
  type?: 'success' | 'error'; 
  onClose: () => void 
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-6 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[400px] z-[120] animate-slideDown flex justify-center">
      <div className={`rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] py-3 px-5 flex items-center gap-3 backdrop-blur-md border ${
        type === 'success' ? 'bg-white/95 border-green-100' : 'bg-white/95 border-red-100'
      }`}>
        <div className={`flex items-center justify-center rounded-full ${type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
          {type === 'success' ? <CheckCircle size={20} strokeWidth={2.5} /> : <AlertCircle size={20} strokeWidth={2.5} />}
        </div>
        <p className="flex-1 text-sm font-medium text-gray-800 mr-2">
          {message}
        </p>
        <button 
          onClick={onClose} 
          className="p-1 hover:bg-gray-100 rounded-full text-gray-400"
        >
          <X size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};

// Loading Skeleton Component - Modern
const SkeletonCard = () => (
  <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden animate-pulse">
    <div className="aspect-square bg-gray-100"></div>
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-100 rounded-full w-3/4"></div>
      <div className="h-3 bg-gray-50 rounded-full w-1/2"></div>
    </div>
  </div>
);

const AdminPortfolio = () => {
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
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
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  // Dropzone configuration - multiple images
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxSize: 5 * 1024 * 1024,
    multiple: true,
    onDrop: async (acceptedFiles: File[]) => {
      const remaining = 5 - imagePreviews.length;
      const filesToAdd = acceptedFiles.slice(0, remaining);
      if (filesToAdd.length === 0) return;
      const previews = await Promise.all(filesToAdd.map(f => convertToBase64(f)));
      setImageFiles(prev => [...prev, ...filesToAdd]);
      setImagePreviews(prev => [...prev, ...previews]);
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
      
      let compressedImages: string[] = [];

      // Compress new files if any
      if (imageFiles.length > 0) {
        compressedImages = await Promise.all(imageFiles.map(f => compressImage(f)));
        // Merge: existing base64 previews that are NOT new files (already stored)
        // imagePreviews may contain existing stored images and new file previews
        // We reconstruct by: stored previews = imagePreviews slice(0, imagePreviews.length - imageFiles.length)
        const storedPreviews = imagePreviews.slice(0, imagePreviews.length - imageFiles.length);
        compressedImages = [...storedPreviews, ...compressedImages];
      } else {
        compressedImages = imagePreviews;
      }

      const portfolioData: any = {
        ...formData,
        image: compressedImages[0] || '',
        images: compressedImages,
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
    const existingImages = item.images && item.images.length > 0 ? item.images : (item.image ? [item.image] : []);
    setImagePreviews(existingImages);
    setImageFiles([]); // no new File objects for existing images
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
    setImageFiles([]);
    setImagePreviews([]);
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
    <div className="min-h-screen bg-[#F8F9FA] selection:bg-gray-900 selection:text-white pb-safe">
      {/* Alert */}
      {alert && (
        <Alert 
          message={alert.message} 
          type={alert.type} 
          onClose={() => setAlert(null)} 
        />
      )}

      {/* Header & Search Bar - Unified Mobile First */}
      <div className="sticky top-0 z-30 bg-[#F8F9FA]/80 backdrop-blur-xl border-b border-gray-200/50 pb-3 pt-safe">
        <div className="px-5 pt-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-[28px] font-bold tracking-tight text-gray-900">
              Portfolio
            </h1>
            {!initialLoading && (
              <span className="bg-gray-900 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                {filteredItems.length}
              </span>
            )}
          </div>
        </div>

        {/* Search and Filter */}
        <div className="px-5 mt-2">
          <div className="flex gap-3">
            <div className="flex-1 relative group">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-white hover:bg-gray-50 border-0 rounded-2xl shadow-sm text-base focus:ring-2 focus:ring-gray-900 focus:outline-none transition-all placeholder:text-gray-400"
                style={{ fontSize: '16px' }}
              />
            </div>
            <div className="flex gap-1.5 p-1 bg-white shadow-sm rounded-2xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 rounded-xl transition-all ${
                  viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                <Grid3x3 size={20} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 rounded-xl transition-all ${
                  viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                <List size={20} />
              </button>
            </div>
          </div>

          {/* Categories Horizontal Scroll */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide -mx-5 px-5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 text-sm font-medium whitespace-nowrap rounded-full transition-all flex items-center justify-center ${
                  selectedCategory === cat
                    ? 'bg-gray-900 text-white shadow-md shadow-gray-900/20'
                    : 'bg-white border border-gray-200/60 text-gray-600 hover:border-gray-300 hover:bg-gray-50 shadow-sm'
                }`}
              >
                {cat === 'all' ? 'All Projects' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-4 pb-20">
        {/* Loading State */}
        {initialLoading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!initialLoading && filteredItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="bg-white w-24 h-24 rounded-[32px] flex items-center justify-center mb-6 shadow-sm border border-gray-100/60">
              <ImageIcon size={40} className="text-gray-300" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Projects Yet</h3>
            <p className="text-gray-500 mb-8 max-w-[250px]">Get started by creating your first portfolio project.</p>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-gray-900 text-white font-medium rounded-2xl hover:bg-gray-800 transition-colors shadow-lg shadow-gray-900/20 active:scale-95"
            >
              <Plus size={20} />
              Add Project
            </button>
          </div>
        )}

        {/* Grid View */}
        {!initialLoading && filteredItems.length > 0 && viewMode === 'grid' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="group bg-white rounded-[24px] shadow-sm hover:shadow-xl hover:shadow-gray-200/50 border border-gray-100 overflow-hidden transition-all duration-300 active:scale-[0.98] flex flex-col"
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 flex items-center justify-center">
                  {/* Background Blur Helper for Portrait */}
                  <img
                    src={item.image || '/placeholder-image.jpg'}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover blur-xl opacity-20 scale-110"
                  />
                  <img
                    src={item.image || '/placeholder-image.jpg'}
                    alt={item.title}
                    className="relative z-10 w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-60"></div>
                  
                  {/* Action Buttons Overlay */}
                  <div className="absolute top-3 right-3 flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
                      className="p-2.5 bg-white/90 backdrop-blur-md rounded-xl shadow-lg hover:bg-white transition-colors flex items-center justify-center text-gray-700 hover:text-blue-600"
                      aria-label="Edit"
                    >
                      <Edit2 size={16} strokeWidth={2.5} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); item.id && handleDelete(item.id); }}
                      disabled={deleteLoading === item.id}
                      className="p-2.5 bg-white/90 backdrop-blur-md rounded-xl shadow-lg hover:bg-white transition-colors disabled:opacity-50 flex items-center justify-center text-gray-700 hover:text-red-600"
                      aria-label="Hapus"
                    >
                      {deleteLoading === item.id ? (
                        <Loader2 size={16} className="animate-spin text-red-600" />
                      ) : (
                        <Trash2 size={16} strokeWidth={2.5} />
                      )}
                    </button>
                  </div>
                  
                  {/* Category Badge */}
                  <div className="absolute bottom-3 left-3">
                    <span className="text-[11px] font-medium bg-white/90 text-gray-900 px-3 py-1.5 rounded-full backdrop-blur-md shadow-sm">
                      {item.category}
                    </span>
                  </div>
                </div>
                <div className="p-4 flex flex-col flex-1 justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 line-clamp-1 mb-1 text-[15px]">
                      {item.title}
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {item.technologies.slice(0, 3).map((tech, i) => (
                      <span key={i} className="text-[10px] font-medium bg-gray-50 text-gray-600 border border-gray-100 px-2.5 py-1 rounded-lg">
                        {tech}
                      </span>
                    ))}
                    {item.technologies.length > 3 && (
                      <span className="text-[10px] font-medium text-gray-500 px-1 py-1">
                        +{item.technologies.length - 3}
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
          <div className="flex flex-col gap-3 md:grid md:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="group bg-white rounded-[24px] shadow-sm hover:shadow-md border border-gray-100 p-4 transition-all active:scale-[0.99]"
              >
                <div className="flex gap-5">
                  <div className="w-[88px] h-[88px] rounded-[18px] overflow-hidden bg-gray-50 flex-shrink-0 shadow-sm border border-gray-100/50">
                    <img
                      src={item.image || '/placeholder-image.jpg'}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-[15px] text-gray-900 line-clamp-1 mb-0.5">
                          {item.title}
                        </h3>
                        <span className="text-[12px] font-medium text-gray-500 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                          {item.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 hover:bg-gray-100 rounded-xl transition-colors flex items-center justify-center text-gray-400 hover:text-blue-600"
                          aria-label="Edit"
                        >
                          <Edit2 size={16} strokeWidth={2.5} />
                        </button>
                        <button
                          onClick={() => item.id && handleDelete(item.id)}
                          disabled={deleteLoading === item.id}
                          className="p-2 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center text-gray-400 hover:text-red-600"
                          aria-label="Hapus"
                        >
                          {deleteLoading === item.id ? (
                            <Loader2 size={16} className="animate-spin text-red-600" />
                          ) : (
                            <Trash2 size={16} strokeWidth={2.5} />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {item.technologies.slice(0, 3).map((tech, i) => (
                        <span key={i} className="text-[10px] font-medium bg-gray-50 text-gray-600 border border-gray-100 px-2.5 py-1 rounded-lg">
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Judul Project *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title || ''}
              onChange={handleInputChange}
              className="w-full px-5 py-3.5 bg-gray-50 hover:bg-gray-100/50 border-0 rounded-2xl text-[15px] font-medium text-gray-900 focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all placeholder:font-normal placeholder:text-gray-400"
              placeholder="Contoh: Aplikasi E-commerce"
              style={{ fontSize: '16px' }}
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Kategori *
            </label>
            <div className="relative">
              <select
                name="category"
                value={formData.category || ''}
                onChange={handleInputChange}
                className="w-full px-5 py-3.5 bg-gray-50 hover:bg-gray-100/50 border-0 rounded-2xl text-[15px] font-medium text-gray-900 focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all appearance-none"
                style={{ fontSize: '16px' }}
                required
              >
                <option value="" disabled>Pilih Kategori</option>
                {categories_list.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>

          {/* Image Upload - Multi Image */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-700">
                Gambar Project
              </label>
              <span className="text-xs text-gray-400 font-medium">{imagePreviews.length}/5</span>
            </div>

            {/* Thumbnail strip */}
            {imagePreviews.length > 0 && (
              <div className="flex gap-3 overflow-x-auto pb-3 mb-3 scrollbar-hide">
                {imagePreviews.map((src, idx) => (
                  <div key={idx} className="relative flex-shrink-0 group">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 shadow-sm">
                      <img
                        src={src}
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {idx === 0 && (
                      <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-gray-900 text-white px-1.5 py-0.5 rounded-full">
                        Cover
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const newPreviews = imagePreviews.filter((_, i) => i !== idx);
                        setImagePreviews(newPreviews);
                        // Only remove from imageFiles if it's a new file (at end of array)
                        const storedCount = imagePreviews.length - imageFiles.length;
                        if (idx >= storedCount) {
                          const fileIdx = idx - storedCount;
                          setImageFiles(prev => prev.filter((_, i) => i !== fileIdx));
                        }
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                      aria-label={`Hapus gambar ${idx + 1}`}
                    >
                      <X size={12} strokeWidth={3} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Dropzone */}
            {imagePreviews.length < 5 && (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center bg-gray-50/50 hover:bg-gray-50
                  ${isDragActive ? 'border-gray-900 bg-gray-100/80 scale-[0.99]' : 'border-gray-200 hover:border-gray-400'}`}
              >
                <input {...getInputProps()} />
                <div className="space-y-3">
                  <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mx-auto text-gray-400">
                    <ImageIcon size={24} strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-gray-900 font-medium text-[14px] mb-0.5">
                      {isDragActive ? 'Drop gambar di sini' : 'Tambah gambar'}
                    </p>
                    <p className="text-xs text-gray-400">
                      Landscape & portrait supported · Max {5 - imagePreviews.length} lagi
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>


          {/* Technologies */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Teknologi
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTechnology())}
                className="flex-1 px-5 py-3.5 bg-gray-50 hover:bg-gray-100/50 border-0 rounded-2xl text-[15px] font-medium text-gray-900 focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all placeholder:font-normal placeholder:text-gray-400"
                placeholder="Contoh: React.js"
                style={{ fontSize: '16px' }}
              />
              <button
                type="button"
                onClick={handleAddTechnology}
                className="px-5 py-3.5 bg-gray-900 text-white rounded-2xl hover:bg-gray-800 transition-colors shadow-md shadow-gray-900/10 active:scale-95 flex items-center justify-center"
                aria-label="Tambah teknologi"
              >
                <Plus size={20} strokeWidth={2.5} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(formData.technologies || []).map((tech, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1.5 bg-white border border-gray-200 px-3.5 py-2 rounded-xl text-[13px] font-medium text-gray-700 shadow-sm"
                >
                  {tech}
                  <button
                    type="button"
                    onClick={() => handleRemoveTechnology(index)}
                    className="text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 p-0.5 transition-colors"
                    aria-label={`Hapus ${tech}`}
                  >
                    <X size={14} strokeWidth={3} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Deskripsi *
            </label>
            <textarea
              name="description"
              value={formData.description || ''}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-5 py-4 bg-gray-50 hover:bg-gray-100/50 border-0 rounded-2xl text-[15px] font-medium text-gray-900 focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all placeholder:font-normal placeholder:text-gray-400 resize-none"
              placeholder="Jelaskan tentang project ini..."
              style={{ fontSize: '16px' }}
              required
            />
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Link Demo
              </label>
              <input
                type="url"
                name="demoLink"
                value={formData.demoLink || ''}
                onChange={handleInputChange}
                className="w-full px-5 py-3.5 bg-gray-50 hover:bg-gray-100/50 border-0 rounded-2xl text-[15px] font-medium text-gray-900 focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all placeholder:font-normal placeholder:text-gray-400"
                placeholder="https://..."
                style={{ fontSize: '16px' }}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Link GitHub
              </label>
              <input
                type="url"
                name="githubLink"
                value={formData.githubLink || ''}
                onChange={handleInputChange}
                className="w-full px-5 py-3.5 bg-gray-50 hover:bg-gray-100/50 border-0 rounded-2xl text-[15px] font-medium text-gray-900 focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all placeholder:font-normal placeholder:text-gray-400"
                placeholder="https://..."
                style={{ fontSize: '16px' }}
              />
            </div>
          </div>

          {/* Form Buttons */}
          <div className="flex gap-3 pt-4 pb-2">
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 py-4 bg-gray-900 text-white rounded-2xl hover:bg-gray-800 transition-colors disabled:opacity-50 font-semibold active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-gray-900/20 text-[15px]"
            >
              {uploading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Menyimpan...
                </>
              ) : (
                editingItem ? 'Update Portfolio' : 'Simpan Portfolio'
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-6 py-4 bg-white border border-gray-200 text-gray-700 font-semibold rounded-2xl hover:bg-gray-50 transition-colors active:scale-95 text-[15px]"
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
          className="fixed bottom-6 right-6 md:hidden bg-gray-900 text-white p-4 rounded-full shadow-xl shadow-gray-900/30 hover:bg-gray-800 transition-all active:scale-90 z-40 flex items-center justify-center group"
          aria-label="Tambah Portfolio"
        >
          <div className="relative flex items-center justify-center">
            <Plus size={26} strokeWidth={2.5} className="group-active:rotate-90 transition-transform duration-200" />
          </div>
        </button>
      )}
    </div>
  );
};

export default AdminPortfolio;