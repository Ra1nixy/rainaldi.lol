import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {  Menu, X, Github, Linkedin, Mail } from 'lucide-react';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
 

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);



  const navItems = [
    { name: 'About', href: '#about' },
    { name: 'Skills', href: '#skills' },
    { name: 'Projects', href: '#projects' },
    { name: 'Experience', href: '#experience' },
    { name: 'Contact', href: '#contact' },
  ];

  const socialLinks = [
    { icon: Github, href: 'https://github.com', label: 'GitHub' },
    { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
    { icon: Mail, href: 'mailto:hello@example.com', label: 'Email' },
  ];

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg shadow-lg py-2'
          : 'bg-transparent py-4'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <motion.div
            className="flex items-center space-x-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="flex items-center gap-2">
            {/* <div className="p-2 rounded-lg flex items-center justify-center">
                <img
                src="/img/rainixy.png"
                alt="Rainaldi Logo"
                className="h-8 w-8 object-contain"
                />
            </div> */}
            <span className="text-xl font-bold text-gray-900 dark:text-white transition-colors">
                Ra1nixy
            </span>
            </div>

          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <div className="flex items-center space-x-6">
              {navItems.map((item) => (
                <motion.a
                  key={item.name}
                  href={item.href}
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors duration-200 relative group"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {item.name}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300" />
                </motion.a>
              ))}
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-4 border-l border-gray-200 dark:border-gray-700 pl-6">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors duration-200"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <social.icon className="h-5 w-5" />
                </motion.a>
              ))}
            </div>

            {/* Theme Toggle */}
            {/* <motion.button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </motion.button> */}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center space-x-4">
            {/* <motion.button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
              whileTap={{ scale: 0.9 }}
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </motion.button> */}

            <motion.button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
              whileTap={{ scale: 0.9 }}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              className="md:hidden mt-4 py-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg rounded-lg shadow-xl border border-gray-200 dark:border-gray-700"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-col space-y-4">
                {navItems.map((item, index) => (
                  <motion.a
                    key={item.name}
                    href={item.href}
                    className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {item.name}
                  </motion.a>
                ))}
                
                {/* Mobile Social Links */}
                <div className="flex justify-center space-x-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  {socialLinks.map((social) => (
                    <motion.a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 p-2"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <social.icon className="h-6 w-6" />
                    </motion.a>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

export default Navbar;