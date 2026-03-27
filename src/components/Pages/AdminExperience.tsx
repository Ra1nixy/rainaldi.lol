import { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc, 
  query, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Save, X, Briefcase, Calendar, Building2, ListTodo, Database, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Experience {
  id?: string;
  title: string;
  company: string;
  period: string;
  responsibilities: string[];
  order: number;
  createdAt?: any;
}

interface GroupedExperience {
  company: string;
  roles: Experience[];
}

const AdminExperience = () => {
  const [groupedExperiences, setGroupedExperiences] = useState<GroupedExperience[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null);

  const [formData, setFormData] = useState<Experience>({
    title: '',
    company: '',
    period: '',
    responsibilities: [''],
    order: 1
  });

  // Data awal untuk migrasi otomatis (Urutan Kronologis 1-4)
  const initialExperiences = [
    {
      title: 'IT Internship',
      period: 'September 2025 - Sekarang',
      company: 'Universitas Putra Bangsa',
      responsibilities: ['Membangun sistem manajemen SDM dan presensi yang terintegrasi menggunakan REST API Laravel dan React JS'],
      order: 1
    },
    {
      title: 'IT Support Intern',
      period: 'Sep 2024 - Jan 2025',
      company: 'Pengadilan Negeri Kebumen',
      responsibilities: [
        'Mengembangkan sistem presensi digital untuk peserta magang',
        'Memberikan dukungan teknis dan pemeliharaan sistem IT'
      ],
      order: 2
    },
    {
      title: 'Junior Software Developer',
      period: 'Jun 2024 - Dec 2024',
      company: 'LP3M Universitas Putra Bangsa',
      responsibilities: [
        'Berkontribusi dalam pengembangan sistem untuk program PKM',
        'Mengelola dokumentasi dan publikasi kegiatan',
        'Mengimplementasikan fitur untuk pemberdayaan masyarakat'
      ],
      order: 3
    },
    {
      title: 'Web Developer (KKL)',
      period: 'Agustus 2024',
      company: 'Caraka Wedding',
      responsibilities: [
        'Membangun landing page untuk promosi dan pembukuan',
        'Meningkatkan profesionalisme bisnis klien',
        'Menyederhanakan proses administrasi'
      ],
      order: 4
    }
  ];

  const fetchExperiences = async () => {
    try {
      const q = query(collection(db, 'experiences'), orderBy('order', 'asc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Experience[];
      
      if (data.length === 0) {
        console.log("Database kosong, memulai migrasi...");
        await migrateData();
      } else {
        // Grouping logic
        const grouped = data.reduce((acc: GroupedExperience[], curr) => {
          const existing = acc.find(item => item.company === curr.company);
          if (existing) {
            existing.roles.push(curr);
          } else {
            acc.push({ company: curr.company, roles: [curr] });
          }
          return acc;
        }, []);
        
        setGroupedExperiences(grouped);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching experiences:", error);
      setLoading(false);
    }
  };

  const migrateData = async () => {
    try {
      for (const exp of initialExperiences) {
        await addDoc(collection(db, 'experiences'), {
          ...exp,
          createdAt: serverTimestamp()
        });
      }
      fetchExperiences();
    } catch (error) {
      console.error("Migration error:", error);
    }
  };

  // Utility untuk menghapus semua data (gunakan jika urutan berantakan)
  const resetAndMigrate = async () => {
    if (!window.confirm("Hapus semua data pengalaman dan isi ulang sesuai urutan standar?")) return;
    
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'experiences'));
      for (const docItem of querySnapshot.docs) {
        await deleteDoc(doc(db, 'experiences', docItem.id));
      }
      await migrateData();
      alert("Reset berhasil! Urutan telah dikembalikan ke standar.");
    } catch (error) {
      alert("Error resetting: " + error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiences();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.name === 'order' ? parseInt(e.target.value) : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleResponsibilityChange = (index: number, value: string) => {
    const newResponsibilities = [...formData.responsibilities];
    newResponsibilities[index] = value;
    setFormData({ ...formData, responsibilities: newResponsibilities });
  };

  const addResponsibilityField = () => {
    setFormData({ ...formData, responsibilities: [...formData.responsibilities, ''] });
  };

  const removeResponsibilityField = (index: number) => {
    const newResponsibilities = formData.responsibilities.filter((_, i) => i !== index);
    setFormData({ ...formData, responsibilities: newResponsibilities });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, 'experiences', editingId), { 
          ...formData, 
          updatedAt: serverTimestamp() 
        });
      } else {
        await addDoc(collection(db, 'experiences'), { 
          ...formData, 
          createdAt: serverTimestamp() 
        });
      }
      setFormData({ title: '', company: '', period: '', responsibilities: [''], order: 1 });
      setShowForm(false);
      setEditingId(null);
      fetchExperiences();
    } catch (error) {
      alert("Error saving: " + error);
    }
  };

  const handleEdit = (exp: Experience) => {
    setFormData(exp);
    setEditingId(exp.id || null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Hapus pengalaman ini?")) {
      try {
        await deleteDoc(doc(db, 'experiences', id));
        fetchExperiences();
      } catch (error) {
        alert("Error deleting: " + error);
      }
    }
  };

  const toggleCompany = (company: string) => {
    setExpandedCompany(expandedCompany === company ? null : company);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link to="/admin" className="text-gray-400 hover:text-[#2c2a28] transition-colors">Admin Dashboard</Link>
              <span className="text-gray-300">/</span>
              <h1 className="text-3xl font-playfair font-light text-[#2c2a28]">Manajemen Pengalaman</h1>
            </div>
            <p className="text-gray-500">Kelola riwayat karir Anda secara berkelompok per perusahaan.</p>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={resetAndMigrate}
              className="flex items-center gap-2 bg-gray-100 text-gray-600 px-4 py-3 rounded-xl hover:bg-gray-200 transition-all text-sm font-medium"
              title="Gunakan ini jika urutan di database berantakan"
            >
              <Database className="w-4 h-4" />
              Reset Standar
            </button>
            <button 
              onClick={() => {
                setShowForm(!showForm);
                if (!showForm) {
                  setEditingId(null);
                  setFormData({ title: '', company: '', period: '', responsibilities: [''], order: groupedExperiences.length + 1 });
                }
              }}
              className="flex items-center gap-2 bg-[#2c2a28] text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-all shadow-md active:scale-95"
            >
              {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showForm ? 'Batal' : 'Tambah Baru'}
            </button>
          </div>
        </div>

        {/* Add/Edit Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-12 overflow-hidden"
            >
              <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-lg">
                <h3 className="text-xl font-medium mb-6 flex items-center gap-2 text-[#2c2a28]">
                  {editingId ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  {editingId ? 'Edit Pengalaman' : 'Tambah Pengalaman Baru'}
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                        <Briefcase className="w-4 h-4" /> Jabatan
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#2c2a28] focus:border-transparent transition-all outline-none"
                        placeholder="Contoh: Junior Web Developer"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                        <Building2 className="w-4 h-4" /> Perusahaan
                      </label>
                      <input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#2c2a28] focus:border-transparent transition-all outline-none"
                        placeholder="Contoh: Universitas Putra Bangsa"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Periode
                      </label>
                      <input
                        type="text"
                        name="period"
                        value={formData.period}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#2c2a28] focus:border-transparent transition-all outline-none"
                        placeholder="Contoh: Jan 2024 - Sekarang"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                        <ListTodo className="w-4 h-4" /> Urutan (Tampilan)
                      </label>
                      <input
                        type="number"
                        name="order"
                        value={formData.order}
                        onChange={handleInputChange}
                        required
                        min="1"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#2c2a28] focus:border-transparent transition-all outline-none"
                        placeholder="1"
                      />
                      <p className="text-[10px] text-gray-400">Angka kecil akan tampil paling atas.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <ListTodo className="w-4 h-4" /> Tanggung Jawab / Pencapaian
                    </label>
                    {formData.responsibilities.map((resp, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={resp}
                          onChange={(e) => handleResponsibilityChange(index, e.target.value)}
                          required
                          className="flex-grow px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#2c2a28] focus:border-transparent transition-all outline-none text-sm"
                          placeholder="Tulis tanggung jawab Anda..."
                        />
                        {formData.responsibilities.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => removeResponsibilityField(index)}
                            className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addResponsibilityField}
                      className="text-sm font-medium text-[#2c2a28] hover:underline flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Tambah Baris Baru
                    </button>
                  </div>

                  <div className="pt-6">
                    <button
                      type="submit"
                      className="w-full bg-[#2c2a28] text-white py-4 rounded-xl font-medium hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                      <Save className="w-5 h-5" />
                      {editingId ? 'Simpan Perubahan' : 'Posting Pengalaman'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grouped List of Experiences (Accordion) */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-20">
              <div className="w-10 h-10 border-4 border-[#2c2a28] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Menyinkronkan data dengan Firestore...</p>
            </div>
          ) : groupedExperiences.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
              <Database className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400">Belum ada pengalaman yang tersimpan.</p>
            </div>
          ) : (
            groupedExperiences.map((group, gIndex) => (
              <div key={gIndex} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <button 
                  onClick={() => toggleCompany(group.company)}
                  className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-[#2c2a28]/5 p-3 rounded-xl">
                      <Building2 className="w-6 h-6 text-[#2c2a28]" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-xl font-medium text-[#2c2a28]">{group.company}</h3>
                      <p className="text-sm text-gray-400">{group.roles.length} Posisi dalam riwayat</p>
                    </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${expandedCompany === group.company ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {expandedCompany === group.company && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-gray-50"
                    >
                      <div className="p-6 space-y-6">
                        {group.roles.map((role) => (
                          <div key={role.id} className="bg-gray-50 rounded-2xl p-6 relative group">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                              <div>
                                <h4 className="text-lg font-medium text-[#2c2a28]">{role.title}</h4>
                                <p className="text-sm text-gray-500 flex items-center gap-2">
                                  <Calendar className="w-4 h-4" /> {role.period}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => handleEdit(role)}
                                  className="p-2 text-gray-400 hover:text-blue-500 hover:bg-white rounded-lg transition-all shadow-sm"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDelete(role.id!)}
                                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg transition-all shadow-sm"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <ul className="space-y-2">
                              {role.responsibilities.map((resp, i) => (
                                <li key={i} className="text-sm text-gray-600 flex items-start gap-3">
                                  <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-2 flex-shrink-0" />
                                  {resp}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminExperience;
