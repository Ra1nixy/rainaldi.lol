import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Briefcase,
  ChevronRight,
  Home,
  TrendingUp,
  Users,
  Eye,
  MousePointerClick,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  RefreshCw,
  BarChart2,
  Calendar,
  ArrowUpRight,
  Activity,
  LogOut,
  Trash2,
  ChevronDown,
  ArrowLeft
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import {
  fetchAnalytics,
  fetchRecentActivity,
  resetAnalytics,
  type AnalyticsSummary,
  type PageViewEvent,
} from '../../utils/analyticsService';

// ─── Types ────────────────────────────────────────────────────
type Period = 7 | 14 | 30;

// ─── Small helpers ───────────────────────────────────────────
const formatDate = (dateStr: string) => {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
};

const formatTimeAgo = (ts: any) => {
  if (!ts?.toDate) return '—';
  const now = Date.now();
  const diff = Math.round((now - ts.toDate().getTime()) / 1000);
  if (diff < 60) return `${diff}s lalu`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}j lalu`;
  return `${Math.floor(diff / 86400)} hari lalu`;
};

const DeviceIcon = ({ device }: { device: string }) => {
  if (device === 'mobile') return <Smartphone className="w-4 h-4" />;
  if (device === 'tablet') return <Tablet className="w-4 h-4" />;
  return <Monitor className="w-4 h-4" />;
};

// ─── Sub-components ──────────────────────────────────────────

// Custom tooltip for AreaChart
const AreaTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-xl backdrop-blur-md">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{formatDate(label)}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-3 text-xs mb-1 last:mb-0">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-500 font-medium">{p.name}:</span>
          <span className="text-gray-900 font-bold">{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

// Stat card redesign
const StatCard = ({
  icon,
  label,
  value,
  sub,
  color,
  index,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  index: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1 + index * 0.05, duration: 0.4 }}
    className="relative overflow-hidden rounded-[28px] p-6 border border-gray-100 bg-white shadow-sm hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 group flex flex-col justify-between min-h-[140px]"
  >
    <div className="flex items-start justify-between mb-4">
      <div
        className="p-2.5 rounded-2xl flex items-center justify-center"
        style={{ background: `${color}10`, color: color }}
      >
        {icon}
      </div>
      <div className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">{sub}</div>
    </div>

    <div>
      <p className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 tabular-nums">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{label}</p>
    </div>
  </motion.div>
);

// Skeleton loader
const Skeleton = ({ className }: { className?: string }) => (
  <div className={`rounded-3xl animate-pulse bg-gray-100 ${className ?? ''}`} />
);

// ─── Main Component ──────────────────────────────────────────
const AdminDashboard = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>(30);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [recentActivity, setRecentActivity] = useState<(PageViewEvent & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    if (!window.confirm('Keluar dari panel admin?')) return;
    try {
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Hapus SEMUA data statistik?')) return;
    
    setRefreshing(true);
    try {
      await resetAnalytics();
      await loadData();
    } catch (err) {
      console.error('Reset error:', err);
      alert('Gagal mereset data.');
    } finally {
      setRefreshing(false);
    }
  };

  const menuItems = [
    {
      title: 'Portfolio',
      icon: <LayoutDashboard className="w-5 h-5" />,
      link: '/admin/portfolio',
      desc: 'Kelola proyek & karya',
      color: '#6366f1',
    },
    {
      title: 'Experience',
      icon: <Briefcase className="w-5 h-5" />,
      link: '/admin/experience',
      desc: 'Kelola riwayat kerja',
      color: '#06b6d4',
    },
  ];

  const loadData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const [analyticsData, recentData] = await Promise.all([
          fetchAnalytics(period),
          fetchRecentActivity(10),
        ]);
        setAnalytics(analyticsData);
        setRecentActivity(recentData);
      } catch (err: any) {
        console.error('[AdminDashboard] loadData error:', err);
        setError(err.message || 'Gagal memuat data analytics');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [period]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const chartData =
    analytics?.dailyStats.slice(-Math.min(period, 30)).map((d) => ({
      ...d,
      label: formatDate(d.date),
    })) ?? [];

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24 md:pb-12">
      {/* ── Sticky Header ── */}
      <header className="sticky top-0 z-[40] bg-white/80 backdrop-blur-xl border-b border-gray-100 px-5 py-4 pt-safe">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              to="/" 
              className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-all"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Admin</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
             <button
              onClick={() => loadData(true)}
              className={`p-2.5 rounded-full bg-gray-50 text-gray-500 hover:bg-gray-100 transition-all ${refreshing ? 'animate-spin' : ''}`}
              title="Refresh"
            >
              <RefreshCw size={18} />
            </button>
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-full bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 py-8">
        
        {/* ── Action Navigation Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {menuItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={item.link}>
                <div className="group relative overflow-hidden bg-white border border-gray-100 rounded-[32px] p-6 flex items-center gap-5 hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-500 active:scale-[0.98]">
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110"
                    style={{ background: `${item.color}10`, color: item.color }}
                  >
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-black transition-colors">{item.title}</h3>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{item.desc}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-gray-900 group-hover:text-white transition-all">
                    <ChevronRight size={20} />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* ── Period Selector ── */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-indigo-500" />
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Analytics Overview</h2>
          </div>
          <div className="flex bg-white shadow-sm border border-gray-100 rounded-2xl p-1 gap-1">
            {([7, 14, 30] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all duration-300 ${
                  period === p
                    ? 'bg-gray-900 text-white shadow-lg'
                    : 'text-gray-400 hover:text-gray-900'
                }`}
              >
                {p}d
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-[32px] border border-gray-100"
            >
              <Activity className="w-12 h-12 text-gray-200 mb-6" />
              <p className="text-gray-900 font-semibold mb-2">Gagal memuat data</p>
              <code className="text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg mb-6">{error}</code>
              <button
                onClick={() => loadData()}
                className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg hover:bg-black transition-all"
              >
                <RefreshCw className="w-4 h-4" /> Coba lagi
              </button>
            </motion.div>
          ) : (
            <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* ── KPI Stat Cards ── */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-36" />
                  ))
                ) : (
                  <>
                    <StatCard
                      index={0}
                      icon={<Eye size={20} />}
                      label="Kunjungan"
                      value={analytics?.totalViews ?? 0}
                      sub={`${period}D`}
                      color="#6366f1"
                    />
                    <StatCard
                      index={1}
                      icon={<Users size={20} />}
                      label="Unik"
                      value={analytics?.uniqueVisitors ?? 0}
                      sub="Sesi"
                      color="#06b6d4"
                    />
                    <StatCard
                      index={2}
                      icon={<MousePointerClick size={20} />}
                      label="Interaksi"
                      value={analytics?.totalInteractions ?? 0}
                      sub="Clicks"
                      color="#f59e0b"
                    />
                    <StatCard
                      index={3}
                      icon={<TrendingUp size={20} />}
                      label="Page/Session"
                      value={analytics?.avgSessionViews ?? 0}
                      sub="Avg"
                      color="#10b981"
                    />
                  </>
                )}
              </div>

              {/* ── Main Chart ── */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-[32px] bg-white border border-gray-100 p-8 mb-8 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Tren Kunjungan</h2>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mt-1">Data harian periode terakhir</p>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {[
                      { label: 'Kunjungan', color: '#6366f1' },
                      { label: 'Unik', color: '#06b6d4' },
                      { label: 'Interaksi', color: '#f59e0b' }
                    ].map((l) => (
                      <div key={l.label} className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: l.color }} />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{l.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="h-[300px] w-full">
                  {loading ? (
                    <Skeleton className="w-full h-full" />
                  ) : chartData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-300">
                      <BarChart2 className="w-12 h-12 mb-4 opacity-20" />
                      <p className="text-xs uppercase tracking-widest font-bold">No data available</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ left: -20, right: 0, top: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorUnique" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                          axisLine={false}
                          tickLine={false}
                          dy={15}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                          axisLine={false}
                          tickLine={false}
                          dx={-10}
                        />
                        <Tooltip content={<AreaTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="views"
                          name="Kunjungan"
                          stroke="#6366f1"
                          strokeWidth={4}
                          fill="url(#colorViews)"
                          dot={false}
                          activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1 shadow-lg' }}
                        />
                        <Area
                          type="monotone"
                          dataKey="uniqueSessions"
                          name="Unik"
                          stroke="#06b6d4"
                          strokeWidth={4}
                          fill="url(#colorUnique)"
                          dot={false}
                          activeDot={{ r: 6, strokeWidth: 0, fill: '#06b6d4' }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </motion.div>

              {/* ── Secondary Charts Grid ── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                
                {/* Popular Pages Card */}
                <div className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                      <Globe size={20} />
                    </div>
                    <h3 className="font-bold text-gray-900 tracking-tight text-[15px]">Halaman Terpopuler</h3>
                  </div>
                  
                  {loading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-10" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {analytics?.pageStats.map((p, i) => (
                        <div key={i}>
                          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                            <span className="truncate flex-1 mr-4">{p.page}</span>
                            <span className="text-gray-900">{p.percentage}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full rounded-full bg-indigo-500 shadow-sm shadow-indigo-100"
                              initial={{ width: 0 }}
                              animate={{ width: `${p.percentage}%` }}
                              transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Device Card */}
                <div className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm flex flex-col items-center">
                  <div className="w-full flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-500">
                      <Monitor size={20} />
                    </div>
                    <h3 className="font-bold text-gray-900 tracking-tight text-[15px]">Perangkat</h3>
                  </div>

                  <div className="relative w-48 h-48 mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics?.deviceStats ?? []}
                          dataKey="count"
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={6}
                        >
                          {(analytics?.deviceStats ?? []).map((entry, index) => (
                            <Cell key={index} fill={entry.color} stroke="transparent" />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-gray-900">{analytics?.uniqueVisitors ?? 0}</span>
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Sesi</span>
                    </div>
                  </div>

                  <div className="w-full grid grid-cols-1 gap-2">
                    {analytics?.deviceStats.map((d) => (
                      <div key={d.device} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100/50">
                        <div className="flex items-center gap-3">
                          <span style={{ color: d.color }}>
                            <DeviceIcon device={d.device} />
                          </span>
                          <span className="text-[11px] font-bold uppercase tracking-widest text-gray-600">{d.device}</span>
                        </div>
                        <span className="text-[11px] font-bold text-gray-900">{d.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Traffic Source Card */}
                <div className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm">
                  <div className="w-full flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
                      <TrendingUp size={20} />
                    </div>
                    <h3 className="font-bold text-gray-900 tracking-tight text-[15px]">Sumber Traffic</h3>
                  </div>

                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={analytics?.referrerStats ?? []}
                        layout="vertical"
                        margin={{ left: 0, right: 20 }}
                      >
                        <CartesianGrid horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide />
                        <YAxis
                          type="category"
                          dataKey="referrer"
                          tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                          width={80}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip 
                          cursor={{ fill: '#f8fafc' }}
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar
                          dataKey="count"
                          radius={[0, 10, 10, 0]}
                          fill="#f59e0b"
                          barSize={12}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* ── Recent Activity Section ── */}
              <div className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                      <Calendar size={20} />
                    </div>
                    <h3 className="font-bold text-gray-900 tracking-tight text-[15px]">Aktivitas Terbaru</h3>
                  </div>
                  <button 
                    onClick={handleReset}
                    className="flex items-center gap-2 text-red-400 hover:text-red-500 text-[10px] font-bold uppercase tracking-widest transition-colors"
                  >
                    <Trash2 size={14} /> Clear Data
                  </button>
                </div>

                {loading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-14" />
                    ))}
                  </div>
                ) : (
                  <>
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50">
                            <th className="pb-4 pr-6">Halaman</th>
                            <th className="pb-4 pr-6">Perangkat</th>
                            <th className="pb-4 pr-6">Referrer</th>
                            <th className="pb-4 text-right">Waktu</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {recentActivity.map((event) => (
                            <tr key={event.id} className="group hover:bg-gray-50/50 transition-colors">
                              <td className="py-4 pr-6">
                                <span className="text-sm font-bold text-gray-900">{event.page}</span>
                              </td>
                              <td className="py-4 pr-6">
                                <div className="flex items-center gap-2 text-gray-500">
                                  <DeviceIcon device={event.device || 'desktop'} />
                                  <span className="text-xs font-semibold capitalize">{event.device}</span>
                                </div>
                              </td>
                              <td className="py-4 pr-6">
                                <span className="text-[10px] font-bold bg-gray-50 text-gray-400 px-2 py-1 rounded-full border border-gray-100 uppercase">
                                  {event.referrer || 'direct'}
                                </span>
                              </td>
                              <td className="py-4 text-right">
                                <span className="text-[11px] font-medium text-gray-400 whitespace-nowrap">
                                  {formatTimeAgo(event.timestamp)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3">
                      {recentActivity.map((event) => (
                        <div key={event.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100/50">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-sm font-bold text-gray-900">{event.page}</span>
                            <span className="text-[10px] font-bold text-gray-400">{formatTimeAgo(event.timestamp)}</span>
                          </div>
                          <div className="flex items-center gap-3">
                             <div className="flex items-center gap-1.5 text-gray-400">
                              <DeviceIcon device={event.device || 'desktop'} />
                              <span className="text-[10px] font-bold uppercase">{event.device}</span>
                            </div>
                            <span className="text-[10px] font-bold bg-white text-gray-400 px-2 py-0.5 rounded-full border border-gray-100">
                              {event.referrer || 'direct'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* ── Footer ── */}
              <div className="mt-12 text-center">
                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.3em]">
                  Rainaldi.lol &bull; Protected Admin Area
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Action Bar (Mobile Only) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[50] md:hidden">
        <div className="bg-white/90 backdrop-blur-xl border border-gray-200/50 px-6 py-3 rounded-full shadow-2xl flex items-center gap-6">
          <Link to="/admin" className="text-gray-900">
            <Home size={22} />
          </Link>
          <Link to="/admin/portfolio" className="text-gray-400 hover:text-indigo-500">
            <LayoutDashboard size={22} />
          </Link>
          <Link to="/admin/experience" className="text-gray-400 hover:text-cyan-500">
            <Briefcase size={22} />
          </Link>
          <div className="w-px h-6 bg-gray-100" />
          <button onClick={() => loadData(true)} className="text-gray-400">
            <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button onClick={handleLogout} className="text-red-400">
            <LogOut size={22} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
