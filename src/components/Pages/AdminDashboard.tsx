import { motion } from 'framer-motion';
import { LayoutDashboard, Briefcase, ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const menuItems = [
    {
      title: 'Portfolio',
      icon: <LayoutDashboard className="w-6 h-6 text-gray-400" />,
      link: '/admin/portfolio'
    },
    {
      title: 'Experience',
      icon: <Briefcase className="w-6 h-6 text-gray-400" />,
      link: '/admin/experience'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 pt-24 pb-12 px-6">
      <div className="max-w-2xl mx-auto text-center">
        {/* Simple Header */}
        <h1 className="text-3xl font-playfair font-light text-[#2c2a28] mb-12">Admin Area</h1>

        {/* Minimalist Menu Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {menuItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={item.link}>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all flex items-center gap-4 group">
                  <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-white transition-colors">
                    {item.icon}
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-medium text-[#2c2a28]">{item.title}</h3>
                    <span className="text-xs text-gray-400">Click to edit</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-200 ml-auto group-hover:text-gray-400 transition-colors" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Back Link */}
        <div className="mt-12 flex justify-center">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-[#2c2a28] transition-colors"
          >
            <Home className="w-4 h-4" />
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
