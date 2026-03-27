import { useState, useEffect } from 'react';

const ICON_MAP: Record<string, string> = {
  JavaScript: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg',
  TypeScript: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg',
  PHP: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg',
  Laravel: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/laravel/laravel-original.svg',
  HTML: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg',
  CSS: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg',
  MySQL: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg',
  Firebase: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firebase/firebase-plain.svg',
  Java: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg',
  Python: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
  Dart: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/dart/dart-original.svg',
  Blade: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/laravel/laravel-original.svg',
  default: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg'
};

const Projects = () => {
  const [skills, setSkills] = useState<{ name: string; icon: string }[]>([]);

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const response = await fetch('/api/github-stats');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();

        // 1. Ambil dari GitHub
        const githubSkills = (data.langData || []).map((l: any) => ({
          name: l.name,
          icon: ICON_MAP[l.name] || ICON_MAP.default
        }));

        // 2. Gabungkan dengan Skill Manual (MySQL, Firestore/NoSQL)
        const manualSkills = [
          { name: 'MySQL', icon: ICON_MAP.MySQL },
          { name: 'NoSQL (Firestore)', icon: ICON_MAP.Firebase },
        ];

        // 3. Filter unik buat kalau-kalau ada duplikat
        const combined = [...githubSkills, ...manualSkills];
        const unique = combined.filter((v, i, a) => a.findIndex(t => t.name === v.name) === i);
        
        setSkills(unique);
      } catch (err) {
        console.error('Error loading skills:', err);
        // Fallback default jika API mati
        setSkills([
          { name: 'PHP & Laravel', icon: ICON_MAP.PHP },
          { name: 'JavaScript', icon: ICON_MAP.JavaScript },
          { name: 'MySQL', icon: ICON_MAP.MySQL },
          { name: 'NoSQL (Firestore)', icon: ICON_MAP.Firebase },
        ]);
      }
    };

    fetchSkills();
  }, []);

  const technicalSkills = {
    tools: [
      { name: 'VS Code', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vscode/vscode-original.svg' },
      { name: 'Git', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg' },
      { name: 'Figma', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg' }
    ]
  };

  const softSkills = [
    'Problem Solving',
    'Self-Learning',
    'Teamwork',
    'Komunikasi'
  ];

  return (
    <section id="projects" className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-playfair font-light text-[#2c2a28] text-center mb-16">
          Keahlian Teknis
        </h2>

        <div className="max-w-3xl mx-auto space-y-8">
          {/* Programming & Tools */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Bahasa Pemrograman & Framework */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-base font-medium text-[#2c2a28] mb-4">
                Teknologi
              </h3>
              <div className="flex flex-wrap gap-3">
                {skills.map((skill, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-md transition-all hover:bg-gray-100"
                  >
                    <img
                      src={skill.icon}
                      alt={skill.name}
                      className="w-4 h-4 object-contain"
                    />
                    <span className="text-sm text-gray-700">
                      {skill.name}
                    </span>
                  </div>
                ))}
                {skills.length === 0 && (
                  <div className="text-sm text-gray-400 italic">Memuat keahlian...</div>
                )}
              </div>
            </div>

            {/* Tools & Platform */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-base font-medium text-[#2c2a28] mb-4">
                Tools
              </h3>
              <div className="flex flex-wrap gap-3">
                {technicalSkills.tools.map((skill, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-md"
                  >
                    <img
                      src={skill.icon}
                      alt={skill.name}
                      className="w-4 h-4 object-contain"
                    />
                    <span className="text-sm text-gray-700">
                      {skill.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Soft Skills */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-base font-medium text-[#2c2a28] mb-4">
              Kemampuan Lain
            </h3>
            <div className="flex flex-wrap gap-2">
              {softSkills.map((skill, index) => (
                <span
                  key={index}
                  className="bg-gray-50 px-3 py-1 rounded text-sm text-gray-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Projects;