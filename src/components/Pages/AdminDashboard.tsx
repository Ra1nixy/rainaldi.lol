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
  if (diff < 60) return `${diff}d lalu`;
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
    <div className="bg-[#1a1a2e]/90 border border-white/10 rounded-xl px-4 py-3 shadow-2xl backdrop-blur-md">
      <p className="text-xs text-gray-400 mb-2">{formatDate(label)}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-300">{p.name}:</span>
          <span className="text-white font-semibold">{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

// Stat card with glow effect
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
    transition={{ delay: 0.1 + index * 0.07, duration: 0.4 }}
    className="relative overflow-hidden rounded-2xl p-5 border border-white/5 bg-white/5 backdrop-blur-sm hover:bg-white/8 transition-all duration-300 group"
  >
    {/* Glowing orb */}
    <div
      className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-15 blur-2xl group-hover:opacity-25 transition-opacity duration-500"
      style={{ background: color }}
    />

    <div className="flex items-start justify-between mb-4">
      <div
        className="p-2.5 rounded-xl"
        style={{ background: `${color}22`, border: `1px solid ${color}33` }}
      >
        <span style={{ color }}>{icon}</span>
      </div>
      <ArrowUpRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
    </div>

    <p className="text-2xl font-bold text-white mb-1 tabular-nums">
      {typeof value === 'number' ? value.toLocaleString() : value}
    </p>
    <p className="text-sm text-gray-400">{label}</p>
    {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
  </motion.div>
);

// Skeleton loader
const Skeleton = ({ className }: { className?: string }) => (
  <div className={`rounded-lg animate-pulse bg-white/5 ${className ?? ''}`} />
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
    try {
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus SEMUA data statistik? Tindakan ini tidak dapat dibatalkan.')) return;
    
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
      color: '#22d3ee',
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

  // ─── Derived: last 7 days for area chart (condensed) ──────
  const chartData =
    analytics?.dailyStats.slice(-Math.min(period, 30)).map((d) => ({
      ...d,
      label: formatDate(d.date),
    })) ?? [];

  return (
    <div className="min-h-screen bg-[#0d0d1a]" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Background gradient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-cyan-500/10 blur-[100px]" />
        <div className="absolute top-1/2 left-0 w-64 h-64 rounded-full bg-purple-600/8 blur-[80px]" />
      </div>

      <div className="relative z-10 px-4 sm:px-6 lg:px-10 py-10 max-w-7xl mx-auto">
        
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10"
        >
          <div>
            <p className="text-xs text-indigo-400 tracking-widest uppercase font-semibold mb-1">
              Admin Area
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Statistik performa website rainaldi.lol
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Period selector */}
            <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
              {([7, 14, 30] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                    period === p
                      ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {p}d
                </button>
              ))}
            </div>

            {/* Refresh */}
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-400 hover:text-white hover:border-white/20 transition-all duration-200"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            {/* Reset Analytics */}
            <button
              onClick={handleReset}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 hover:bg-red-500 hover:text-white transition-all duration-200"
              title="Bersihkan Semua Data Statistik"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 hover:bg-red-500 hover:text-white transition-all duration-200"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>

            {/* Home link */}
            <Link
              to="/"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-400 hover:text-white transition-all duration-200"
            >
              <Home className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>

        {/* ── Admin Menu Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {menuItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <Link to={item.link}>
                <div className="relative overflow-hidden flex items-center gap-4 p-5 rounded-2xl bg-white/5 border border-white/8 hover:border-white/15 hover:bg-white/8 transition-all duration-300 group">
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: `radial-gradient(ellipse at 0% 50%, ${item.color}11 0%, transparent 60%)`,
                    }}
                  />
                  <div
                    className="p-3 rounded-xl transition-all duration-300 relative z-10 flex-shrink-0"
                    style={{ background: `${item.color}22`, border: `1px solid ${item.color}33` }}
                  >
                    <span style={{ color: item.color }}>{item.icon}</span>
                  </div>
                  <div className="relative z-10 flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-white">{item.title}</h3>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-300 group-hover:translate-x-1 transition-all relative z-10 flex-shrink-0" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* ── Analytics Section ── */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </div>
            <span className="text-xs text-gray-500 font-medium tracking-widest uppercase">
              Live Analytics
            </span>
          </div>
          <div className="flex-1 h-px bg-white/5" />
          <span className="text-xs text-gray-600">{period} hari terakhir</span>
        </div>

        <AnimatePresence mode="wait">
          {error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <Activity className="w-12 h-12 text-gray-700 mb-4" />
              <p className="text-gray-400 text-sm mb-2">Gagal memuat data analytics</p>
              <code className="text-xs text-gray-600 bg-white/5 px-3 py-1.5 rounded-lg">{error}</code>
              <button
                onClick={() => loadData()}
                className="mt-4 text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5"
              >
                <RefreshCw className="w-4 h-4" /> Coba lagi
              </button>
            </motion.div>
          ) : (
            <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* ── KPI Stat Cards Row ── */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-36" />
                  ))
                ) : (
                  <>
                    <StatCard
                      index={0}
                      icon={<Eye className="w-5 h-5" />}
                      label="Total Kunjungan"
                      value={analytics?.totalViews ?? 0}
                      sub={`${period} hari terakhir`}
                      color="#6366f1"
                    />
                    <StatCard
                      index={1}
                      icon={<Users className="w-5 h-5" />}
                      label="Pengunjung Unik"
                      value={analytics?.uniqueVisitors ?? 0}
                      sub="Berdasarkan sesi"
                      color="#22d3ee"
                    />
                    <StatCard
                      index={2}
                      icon={<MousePointerClick className="w-5 h-5" />}
                      label="Total Interaksi"
                      value={analytics?.totalInteractions ?? 0}
                      sub="Klik & submit form"
                      color="#f59e0b"
                    />
                    <StatCard
                      index={3}
                      icon={<TrendingUp className="w-5 h-5" />}
                      label="Rata-rata Halaman/Sesi"
                      value={analytics?.avgSessionViews ?? 0}
                      sub="Page depth"
                      color="#10b981"
                    />
                  </>
                )}
              </div>

              {/* ── Area Chart ── */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="rounded-2xl bg-white/5 border border-white/8 p-6 mb-6"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6">
                  <div>
                    <h2 className="text-base font-semibold text-white flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-indigo-400" />
                      Tren Kunjungan
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">Kunjungan & pengunjung unik harian</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                      Kunjungan
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                      Unik
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      Interaksi
                    </span>
                  </div>
                </div>

                {loading ? (
                  <Skeleton className="w-full h-56" />
                ) : chartData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-56 text-gray-600">
                    <BarChart2 className="w-10 h-10 mb-2 opacity-30" />
                    <p className="text-sm">Belum ada data untuk periode ini</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={chartData} margin={{ left: -10, right: 8, top: 4 }}>
                      <defs>
                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorUnique" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorInteractions" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10, fill: '#6b7280' }}
                        tickLine={false}
                        axisLine={false}
                        interval={Math.ceil(chartData.length / 8)}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#6b7280' }}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip content={<AreaTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="views"
                        name="Kunjungan"
                        stroke="#6366f1"
                        strokeWidth={2}
                        fill="url(#colorViews)"
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 0 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="uniqueSessions"
                        name="Unik"
                        stroke="#22d3ee"
                        strokeWidth={2}
                        fill="url(#colorUnique)"
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 0 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="interactions"
                        name="Interaksi"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        fill="url(#colorInteractions)"
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </motion.div>

              {/* ── Bottom 3-col Grid ── */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">

                {/* Popular Pages */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="rounded-2xl bg-white/5 border border-white/8 p-6"
                >
                  <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-5">
                    <Globe className="w-4 h-4 text-indigo-400" />
                    Halaman Terpopuler
                  </h2>
                  {loading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-8" />
                      ))}
                    </div>
                  ) : !analytics?.pageStats.length ? (
                    <p className="text-gray-600 text-sm py-8 text-center">Belum ada data</p>
                  ) : (
                    <div className="space-y-3">
                      {analytics.pageStats.map((p, i) => (
                        <div key={i}>
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-gray-300 truncate flex-1 mr-2">{p.page}</span>
                            <span className="text-gray-500 whitespace-nowrap">
                              {p.views.toLocaleString()} ({p.percentage}%)
                            </span>
                          </div>
                          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                              initial={{ width: 0 }}
                              animate={{ width: `${p.percentage}%` }}
                              transition={{ delay: 0.6 + i * 0.05, duration: 0.6 }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>

                {/* Device Distribution */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 }}
                  className="rounded-2xl bg-white/5 border border-white/8 p-6"
                >
                  <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-5">
                    <Monitor className="w-4 h-4 text-cyan-400" />
                    Perangkat
                  </h2>
                  {loading ? (
                    <div className="flex flex-col items-center gap-4">
                      <Skeleton className="w-40 h-40 rounded-full" />
                      <div className="space-y-2 w-full">
                        <Skeleton className="h-6" />
                        <Skeleton className="h-6" />
                      </div>
                    </div>
                  ) : !analytics?.deviceStats.length ? (
                    <p className="text-gray-600 text-sm py-8 text-center">Belum ada data</p>
                  ) : (
                    <>
                      <div className="flex justify-center mb-4">
                        <ResponsiveContainer width={160} height={160}>
                          <PieChart>
                            <Pie
                              data={analytics.deviceStats}
                              dataKey="count"
                              nameKey="device"
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={72}
                              paddingAngle={3}
                              startAngle={90}
                              endAngle={-270}
                            >
                              {analytics.deviceStats.map((entry, index) => (
                                <Cell
                                  key={index}
                                  fill={entry.color}
                                  stroke="transparent"
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                background: '#1a1a2e',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                fontSize: '12px',
                                color: '#e5e7eb',
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-2">
                        {analytics.deviceStats.map((d, i) => {
                          const total = analytics.deviceStats.reduce((a, b) => a + b.count, 0);
                          const pct = Math.round((d.count / total) * 100);
                          return (
                            <div key={i} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2 text-gray-300">
                                <span style={{ color: d.color }}>
                                  <DeviceIcon device={d.device} />
                                </span>
                                <span className="capitalize">{d.device}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500 text-xs">{d.count}</span>
                                <span
                                  className="text-xs font-semibold px-1.5 py-0.5 rounded"
                                  style={{ background: `${d.color}22`, color: d.color }}
                                >
                                  {pct}%
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </motion.div>

                {/* Referrers */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="rounded-2xl bg-white/5 border border-white/8 p-6"
                >
                  <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-5">
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                    Sumber Traffic
                  </h2>
                  {loading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-8" />
                      ))}
                    </div>
                  ) : !analytics?.referrerStats.length ? (
                    <p className="text-gray-600 text-sm py-8 text-center">Belum ada data</p>
                  ) : (
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={analytics.referrerStats}
                          layout="vertical"
                          margin={{ left: 0, right: 16 }}
                        >
                          <CartesianGrid
                            horizontal={false}
                            strokeDasharray="3 3"
                            stroke="rgba(255,255,255,0.04)"
                          />
                          <XAxis
                            type="number"
                            tick={{ fontSize: 10, fill: '#6b7280' }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            type="category"
                            dataKey="referrer"
                            tick={{ fontSize: 10, fill: '#9ca3af' }}
                            tickLine={false}
                            axisLine={false}
                            width={70}
                          />
                          <Tooltip
                            contentStyle={{
                              background: '#1a1a2e',
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '12px',
                              fontSize: '12px',
                              color: '#e5e7eb',
                            }}
                          />
                          <Bar
                            dataKey="count"
                            name="Kunjungan"
                            radius={[0, 6, 6, 0]}
                            fill="#f59e0b"
                            fillOpacity={0.8}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </motion.div>
              </div>

              {/* ── Recent Activity Feed ── */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65 }}
                className="rounded-2xl bg-white/5 border border-white/8 p-6"
              >
                <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-5">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  Aktivitas Terbaru
                </h2>

                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_) => (
                      <Skeleton key={Math.random()} className="h-12" />
                    ))}
                  </div>
                ) : recentActivity.length === 0 ? (
                  <p className="text-gray-600 text-sm py-8 text-center">Belum ada aktivitas</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-gray-600 border-b border-white/5">
                          <th className="pb-3 pr-4 font-medium">Halaman</th>
                          <th className="pb-3 pr-4 font-medium">Perangkat</th>
                          <th className="pb-3 pr-4 font-medium">Referrer</th>
                          <th className="pb-3 font-medium text-right">Waktu</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {recentActivity.map((event) => (
                          <tr key={event.id} className="hover:bg-white/3 transition-colors">
                            <td className="py-3 pr-4 text-gray-300 font-medium truncate max-w-[140px]">
                              {event.page}
                            </td>
                            <td className="py-3 pr-4">
                              <span className="flex items-center gap-1.5 text-gray-500">
                                <DeviceIcon device={event.device || 'desktop'} />
                                <span className="capitalize text-xs">{event.device}</span>
                              </span>
                            </td>
                            <td className="py-3 pr-4">
                              <span className="text-xs text-gray-600 bg-white/5 px-2 py-0.5 rounded-full">
                                {event.referrer || 'direct'}
                              </span>
                            </td>
                            <td className="py-3 text-right text-xs text-gray-600">
                              {formatTimeAgo(event.timestamp)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>

              {/* Footer */}
              <p className="text-center text-xs text-gray-700 mt-8 tracking-wide">
                Data analytics tersimpan di Firebase Firestore &middot; rainaldi.lol
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminDashboard;
