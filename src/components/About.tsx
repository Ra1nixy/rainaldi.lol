import { motion } from 'framer-motion';
import { Code2, Database, Palette, Server, Smartphone, Zap } from 'lucide-react';

const About = () => {
  const skills = [
    {
      icon: Code2,
      title: 'Frontend Development',
      description: 'React, TypeScript, Tailwind CSS, Next.js'
    },
    {
      icon: Server,
      title: 'Backend Development',
      description: 'Laravel, Node.js, Express, RESTful APIs'
    },
    {
      icon: Database,
      title: 'Database & Storage',
      description: 'Firebase, MySQL, MongoDB, PostgreSQL'
    },
    {
      icon: Smartphone,
      title: 'Mobile Development',
      description: 'React Native, Flutter, PWA'
    },
    {
      icon: Palette,
      title: 'UI/UX Design',
      description: 'Figma, Adobe XD, Prototyping, Design Systems'
    },
    {
      icon: Zap,
      title: 'DevOps & Tools',
      description: 'Git, Docker, CI/CD, AWS, Vercel'
    }
  ];

  return (
    <section id="about" className="py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
            About Me
          </h2>
          <div className="w-24 h-1 bg-gray-900 dark:bg-white mx-auto mb-8"></div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800 dark:text-gray-200">
              Crafting Digital Experiences with Code
            </h3>
            <div className="space-y-4 text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
              <p>
                Saya adalah seorang <span className="text-gray-900 dark:text-white font-semibold">Software Developer</span> 
                {' '}yang berfokus pada pengembangan web modern menggunakan teknologi terdepan seperti 
                <span className="text-gray-900 dark:text-white font-semibold"> Laravel, React, dan Firebase</span>.
              </p>
              <p>
                Saya memiliki passion dalam menciptakan sistem yang tidak hanya 
                <span className="text-gray-900 dark:text-white font-semibold"> efisien dan scalable</span>, 
                {' '}tetapi juga memberikan pengalaman pengguna yang 
                <span className="text-gray-900 dark:text-white font-semibold"> intuitif dan memorable</span>.
              </p>
              <p>
                Dengan pendekatan yang detail-oriented dan commitment terhadap code quality, 
                saya berusaha memberikan solusi yang tepat guna untuk setiap tantangan pengembangan.
              </p>
            </div>

            {/* Stats */}
            <motion.div
              className="grid grid-cols-2 gap-6 mt-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
              viewport={{ once: true }}
            >
              {/* <div className="text-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">50+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Projects Completed</div>
              </div>
              <div className="text-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">3+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Years Experience</div>
              </div> */}
            </motion.div>
          </motion.div>

          {/* Skills Grid */}
          <div className="grid grid-cols-2 gap-4">
            {skills.map((skill, index) => (
              <motion.div
                key={skill.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.1 }}
                viewport={{ once: true }}
                className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 group bg-white dark:bg-gray-800"
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-700 group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-colors duration-300 mb-4">
                    <skill.icon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {skill.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {skill.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Philosophy Section */}
        <motion.div
          className="text-center max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          <div className="border-t border-gray-200 dark:border-gray-700 pt-12">
            <h3 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">
              Development Philosophy
            </h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Performance First</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Optimized code for fast loading and smooth user experience
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Code2 className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Clean Code</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Maintainable and scalable architecture with best practices
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Palette className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">User Centric</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Intuitive interfaces with focus on user experience
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default About;