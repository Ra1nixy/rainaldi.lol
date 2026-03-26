import { useEffect, useRef, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Github, Star, BookOpen, Users, UserCheck } from "lucide-react";

const GITHUB_USERNAME = "Ra1nixy";

// Warna khas per bahasa pemrograman
const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f7df1e",
  PHP: "#8892be",
  HTML: "#e34f26",
  CSS: "#1572b6",
  Python: "#3572A5",
  Dart: "#00B4AB",
  Java: "#b07219",
  "C#": "#178600",
  Go: "#00ADD8",
  Rust: "#dea584",
  Swift: "#f05138",
  Kotlin: "#7F52FF",
  Vue: "#41b883",
  Shell: "#89e051",
  SCSS: "#c6538c",
  Other: "#9ca3af",
};

interface GitHubUser {
  login: string;
  name: string;
  public_repos: number;
  total_private_repos?: number; // Hanya ada jika di-auth
  followers: number;
  following: number;
  bio: string;
  html_url: string;
}

interface LangData {
  name: string;
  value: number;
  color: string;
}

// Hook animasi angka (count-up) saat elemen masuk viewport
function useCountUp(target: number, duration = 1500, start = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start || target === 0) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);

  return count;
}

// Card statistik individual
const StatCard = ({
  icon,
  label,
  value,
  animate,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  animate: boolean;
}) => {
  const count = useCountUp(value, 1200, animate);

  return (
    <div className="border border-gray-200 rounded-xl p-6 flex flex-col items-center gap-3 hover:border-[#2c2a28] hover:shadow-sm transition-all duration-300 group">
      <div className="w-11 h-11 bg-gray-50 rounded-lg flex items-center justify-center group-hover:bg-[#2c2a28] transition-colors duration-300">
        <span className="text-[#2c2a28] group-hover:text-white transition-colors duration-300">
          {icon}
        </span>
      </div>
      <span className="text-3xl font-light text-[#2c2a28] tabular-nums">
        {animate ? count.toLocaleString() : "—"}
      </span>
      <span className="text-sm text-gray-500 font-medium tracking-wide text-center">
        {label}
      </span>
    </div>
  );
};

// Skeleton loader
const Skeleton = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <div
    className={`bg-gray-100 rounded animate-pulse ${className ?? ""}`}
    style={style}
  />
);

// Custom tooltip untuk chart
const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: LangData }>;
}) => {
  if (active && payload && payload.length) {
    const total = payload[0].payload.value;
    return (
      <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-md text-sm">
        <p className="font-medium text-[#2c2a28]">{payload[0].name}</p>
        <p className="text-gray-500">{total} repo</p>
      </div>
    );
  }
  return null;
};
const GitHubStats = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [totalStars, setTotalStars] = useState(0);
  const [totalRepos, setTotalRepos] = useState(0);
  const [contributions, setContributions] = useState<any>(null);
  const [timeFrame, setTimeFrame] = useState<'1mo' | '6mo' | '1yr'>('6mo'); // Default ke 6 bulan
  const [langData, setLangData] = useState<LangData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Intersection observer agar animasi hanya terjadi saat section terlihat
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Fetch GitHub data via Secure Vercel API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Panggil endpoint internal yang baru (aman)
        const response = await fetch("/api/github-stats");
        
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || `Server error: ${response.status}`);
        }

        const data = await response.json();
        const { user: userData, repos: reposData, contributions: contData } = data;

        // Hitung total repos & stars
        const repoCount = reposData.length;
        const stars = reposData
          .filter((r: any) => !r.fork)
          .reduce((acc: number, r: any) => acc + r.stargazers_count, 0);

        // Agregasi bahasa pemrograman
        const langCount: Record<string, number> = {};
        reposData.forEach((repo: any) => {
          if (repo.language) {
            langCount[repo.language] = (langCount[repo.language] || 0) + 1;
          }
        });

        const sorted = Object.entries(langCount).sort((a, b) => b[1] - a[1]);
        const top = sorted.slice(0, 8);
        const otherCount = sorted.slice(8).reduce((acc, [, v]) => acc + v, 0);

        const chartData: LangData[] = top.map(([name, value]) => ({
          name,
          value,
          color: LANGUAGE_COLORS[name] ?? LANGUAGE_COLORS.Other,
        }));

        if (otherCount > 0) {
          chartData.push({ name: "Other", value: otherCount, color: LANGUAGE_COLORS.Other });
        }

        setUser(userData);
        setTotalRepos(repoCount);
        setTotalStars(stars);
        setLangData(chartData);
        setContributions(contData);
      } catch (err: any) {
        console.error("GitHub fetch error:", err);
        setError(err.message || "Failed to load GitHub stats");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter data kontribusi berdasarkan periode yang dipilih
  const getFilteredContributions = () => {
    if (!contributions) return null;
    
    let weeksCount = 52; // 1 tahun
    if (timeFrame === '6mo') weeksCount = 26;
    if (timeFrame === '1mo') weeksCount = 4;
    
    // Ambil minggu terakhir sebanyak weeksCount
    const weeks = contributions.weeks.slice(-weeksCount);
    
    // Hitung ulang total kontribusi untuk periode terpilih
    const totalInPeriod = weeks.reduce((acc: number, week: any) => 
      acc + week.contributionDays.reduce((dAcc: number, day: any) => dAcc + day.contributionCount, 0), 
    0);

    return { weeks, totalInPeriod };
  };

  const filteredData = getFilteredContributions();

  return (
    <section
      id="github-stats"
      ref={sectionRef}
      className="py-20 bg-gray-50 border-y border-gray-100"
    >
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">

          {/* Header */}
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 text-gray-400 text-xs tracking-[0.2em] uppercase mb-4 font-medium">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </div>
              <Github className="w-4 h-4 ml-1" />
              <span>Live dari GitHub</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-playfair font-light text-[#2c2a28]">
              Statistik GitHub
            </h2>
            {!loading && user && (
              <a
                href={user.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 text-sm text-gray-400 hover:text-[#2c2a28] transition-colors duration-200"
              >
                @{user.login}
              </a>
            )}
          </div>

          {error ? (
            <div className="text-center text-gray-400 py-12">
              <Github className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>Gagal memuat data GitHub:</p>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded mt-2 block">{error}</code>
              <p className="mt-4 text-xs">Coba restart server (`npm run dev`) atau cek token Anda.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stat Cards */}
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="border border-gray-200 rounded-xl p-6 flex flex-col items-center gap-3">
                      <Skeleton className="w-11 h-11 rounded-lg" />
                      <Skeleton className="w-16 h-8 rounded" />
                      <Skeleton className="w-20 h-4 rounded" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard
                    icon={<BookOpen className="w-5 h-5" />}
                    label="Repositories"
                    value={totalRepos}
                    animate={visible}
                  />
                  <StatCard
                    icon={<Star className="w-5 h-5" />}
                    label="Total Stars"
                    value={totalStars}
                    animate={visible}
                  />
                  <StatCard
                    icon={<Users className="w-5 h-5" />}
                    label="Followers"
                    value={user?.followers ?? 0}
                    animate={visible}
                  />
                  <StatCard
                    icon={<UserCheck className="w-5 h-5" />}
                    label="Following"
                    value={user?.following ?? 0}
                    animate={visible}
                  />
                </div>
              )}

              {/* Contribution Activity Card */}
              <div className="border border-gray-200 rounded-xl p-6 bg-white overflow-hidden shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                  <div className="space-y-1">
                    <h3 className="text-base font-medium text-[#2c2a28]">
                      Aktivitas Kontribusi
                    </h3>
                    {filteredData && (
                      <p className="text-xs text-gray-400">
                        {filteredData.totalInPeriod.toLocaleString()} kontribusi dalam periode terpilih
                      </p>
                    )}
                  </div>

                  {/* Filter Tabs */}
                  <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-100">
                    {[
                      { id: '1mo', label: '1 bln' },
                      { id: '6mo', label: '6 bln' },
                      { id: '1yr', label: '1 thn' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setTimeFrame(tab.id as any)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                          timeFrame === tab.id 
                            ? 'bg-white text-[#2c2a28] shadow-sm ring-1 ring-gray-100' 
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {loading ? (
                  <Skeleton className="w-full h-32 rounded-lg" />
                ) : !contributions ? (
                  <div className="w-full bg-gray-50 rounded-lg py-12 flex flex-col items-center justify-center border border-dashed border-gray-200">
                    <Github className="w-8 h-8 text-gray-300 mb-2" />
                    <p className="text-sm text-gray-400">Hubungkan token untuk melihat grafik kontribusi.</p>
                  </div>
                ) : (
                  <div className="w-full overflow-x-auto pb-4 custom-scrollbar-github">
                    <div className="flex gap-[3px] min-w-max pr-4 pt-6 relative">
                      {(() => {
                        let lastMonth = -1;
                        let lastLabelIndex = -99; // Lacak posisi label terakhir
                        
                        return filteredData?.weeks.map((week: any, weekIndex: number) => {
                          const firstDay = new Date(week.contributionDays[0].date);
                          const currentMonth = firstDay.getMonth();
                          let showMonth = false;
                          
                          // Tampilkan label jika bulan berubah DAN jarak antar label > 2 minggu agar tidak tabrakan
                          if (currentMonth !== lastMonth && (weekIndex - lastLabelIndex) > 3) {
                            showMonth = true;
                            lastMonth = currentMonth;
                            lastLabelIndex = weekIndex;
                          }

                          return (
                            <div key={weekIndex} className="flex flex-col gap-[3px] relative pt-1">
                              {/* Month Label */}
                              {showMonth && (
                                <span className="absolute -top-6 left-0 text-[10px] text-gray-400 font-medium whitespace-nowrap">
                                  {firstDay.toLocaleString('id-ID', { month: 'short' })}
                                </span>
                              )}
                              
                              {week.contributionDays.map((day: any) => {
                                const count = day.contributionCount;
                                let bgColor = "#ebedf0"; // level 0
                                if (count > 0 && count <= 2) bgColor = "#9be9a8"; // level 1
                                if (count > 2 && count <= 5) bgColor = "#40c463"; // level 2
                                if (count > 5 && count <= 10) bgColor = "#30a14e"; // level 3
                                if (count > 10) bgColor = "#216e39"; // level 4

                                return (
                                  <div
                                    key={day.date}
                                    className="w-[10px] h-[10px] sm:w-[12px] sm:h-[12px] rounded-[2px] cursor-pointer hover:ring-1 hover:ring-offset-1 hover:ring-gray-300 transition-all duration-200"
                                    style={{ backgroundColor: bgColor }}
                                    title={`${day.date}: ${count} kontribusi`}
                                  />
                                );
                              })}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}
                
                <div className="mt-4 flex flex-wrap items-center justify-start gap-4 border-t border-gray-50 pt-4">
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Intensitas</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-gray-400 mr-1">Less</span>
                      <div className="w-2.5 h-2.5 rounded-[1px] bg-[#ebedf0]"></div>
                      <div className="w-2.5 h-2.5 rounded-[1px] bg-[#9be9a8]"></div>
                      <div className="w-2.5 h-2.5 rounded-[1px] bg-[#40c463]"></div>
                      <div className="w-2.5 h-2.5 rounded-[1px] bg-[#30a14e]"></div>
                      <div className="w-2.5 h-2.5 rounded-[1px] bg-[#216e39]"></div>
                      <span className="text-[10px] text-gray-400 ml-1">More</span>
                    </div>
                </div>
              </div>

              {/* Language Chart */}
              <div className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm">
                <h3 className="text-base font-medium text-[#2c2a28] mb-6">
                  Bahasa Pemrograman
                </h3>

                {loading ? (
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <Skeleton className="w-52 h-52 rounded-full mx-auto" />
                    <div className="flex-1 space-y-3 w-full">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <Skeleton className="w-3 h-3 rounded-full" />
                          <Skeleton className="h-4 rounded" style={{ width: `${60 + i * 8}%` }} />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : langData.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">
                    Tidak ada data bahasa pemrograman.
                  </p>
                ) : (
                  <div className="flex flex-col lg:flex-row items-center gap-8">
                    {/* Donut Chart */}
                    <div className="w-full lg:w-64 min-h-[250px] flex-shrink-0 relative">
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={langData}
                            cx="50%"
                            cy="50%"
                            innerRadius="55%"
                            outerRadius="80%"
                            paddingAngle={3}
                            dataKey="value"
                            startAngle={90}
                            endAngle={-270}
                          >
                            {langData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} stroke="white" strokeWidth={2} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Legend & Bars */}
                    <div className="flex-1 w-full space-y-3">
                      {(() => {
                        const total = langData.reduce((acc, l) => acc + l.value, 0);
                        return langData.map((lang) => {
                          const pct = Math.round((lang.value / total) * 100);
                          return (
                            <div key={lang.name} className="group">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: lang.color }}
                                  />
                                  <span className="text-sm text-gray-700 font-medium">{lang.name}</span>
                                </div>
                                <span className="text-xs text-gray-400">{pct}%</span>
                              </div>
                              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-1000"
                                  style={{
                                    width: visible ? `${pct}%` : "0%",
                                    backgroundColor: lang.color,
                                    transitionDelay: `${langData.indexOf(lang) * 80}ms`,
                                  }}
                                />
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer note */}
              {!loading && (
                <p className="text-center text-xs text-gray-300 mt-6 tracking-wide">
                  Data diperbarui secara langsung dari GitHub API · @{GITHUB_USERNAME}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default GitHubStats;
