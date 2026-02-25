import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import About from "./components/About";
import Projects from "./components/Projects";
import Contact from "./components/Contact";
import Portfolio from "./components/Pages/Portfolio";
import AdminPortfolio from "./components/Pages/AdminPortfolio";

// Komponen wrapper untuk mengkondisikan Navbar
const AppContent = () => {
  const location = useLocation();
  const hideNavbarPaths = ['/portfolio', '/admin/portfolio']; // Path yang tidak ingin menampilkan navbar
  
  return (
    <div className="font-montserrat bg-white text-[#2c2a28]">
      {/* Navbar hanya ditampilkan jika path tidak ada di hideNavbarPaths */}
      {!hideNavbarPaths.includes(location.pathname) && <Navbar />}
      
      <Routes>
        <Route path="/" element={
          <>
            <Hero />
            <About />
            <Projects />
            <Contact />
          </>
        } />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/admin/portfolio" element={<AdminPortfolio />} />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;