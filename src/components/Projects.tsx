const Projects = () => {
  const technicalSkills = {
    programming: [
      { name: 'PHP & Laravel', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg' },
      { name: 'JavaScript', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg' },
      { name: 'MySQL', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg' },
      { name: 'HTML', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg' },
      { name: 'CSS', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg' }
    ],
    tools: [
      { name: 'VS Code', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vscode/vscode-original.svg' },
      { name: 'Git', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg' },
      { name: 'Firebase', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firebase/firebase-plain.svg' },
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
                {technicalSkills.programming.map((skill, index) => (
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