import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, Mail, Lock, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { auth } from '../../config/firebase';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) navigate('/admin');
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/admin');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Email atau password salah.');
      } else {
        setError('Terjadi kesalahan. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center px-6 relative overflow-hidden font-montserrat">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Back to Home */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-3 text-gray-400 hover:text-gray-900 transition-all mb-8 group"
        >
          <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm group-hover:bg-gray-50 transition-all">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest">Back to Site</span>
        </button>

        {/* Card */}
        <div className="bg-white border border-gray-100 rounded-[32px] p-10 shadow-2xl shadow-gray-200/50">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gray-50 border border-gray-100 mb-6 shadow-inner">
              <LogIn className="w-8 h-8 text-gray-900" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">Admin Area</h1>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em]">Restricted Access Only</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3 text-red-500 text-sm font-medium"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p>{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-300 group-focus-within:text-gray-900 transition-colors" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-12 pr-5 py-4 bg-gray-50 border-0 rounded-2xl text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:bg-white transition-all text-sm font-medium"
                    placeholder="nama@email.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-300 group-focus-within:text-gray-900 transition-colors" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-12 pr-5 py-4 bg-gray-50 border-0 rounded-2xl text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:bg-white transition-all text-sm font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-gray-900 rounded-2xl flex items-center justify-center text-white font-bold text-sm tracking-widest uppercase hover:bg-black transition-all shadow-xl shadow-gray-900/20 active:scale-95"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-300 text-[10px] font-bold mt-12 tracking-[0.4em] uppercase">
          Ra1nixy &bull; Master Control
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
