import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import About from "./components/About";
import GitHubStats from "./components/GitHubStats";
import Projects from "./components/Projects";
import Contact from "./components/Contact";
import Portfolio from "./components/Pages/Portfolio";
import AdminPortfolio from "./components/Pages/AdminPortfolio";
import AdminDashboard from "./components/Pages/AdminDashboard";
import AdminExperience from "./components/Pages/AdminExperience";
import Login from "./components/Pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAnalytics } from "./utils/useAnalytics";

// Komponen wrapper untuk mengkondisikan Navbar
const AppContent = () => {
  const location = useLocation();
  const hideNavbarPaths = ['/portfolio', '/admin', '/admin/portfolio', '/admin/experience', '/login']; // Path yang tidak ingin menampilkan navbar
  
  // Auto-track page views & interactions across the entire app
  useAnalytics();
  
  return (
    <div className="font-montserrat bg-white text-[#2c2a28]">
      {/* Navbar hanya ditampilkan jika path tidak ada di hideNavbarPaths */}
      {!hideNavbarPaths.includes(location.pathname) && <Navbar />}
      
      <Routes>
        <Route path="/" element={
          <>
            <Hero />
            <About />
            <GitHubStats />
            <Projects />
            <Contact />
          </>
        } />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/login" element={<Login />} />
        
        {/* Protected Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/portfolio" element={<ProtectedRoute><AdminPortfolio /></ProtectedRoute>} />
        <Route path="/admin/experience" element={<ProtectedRoute><AdminExperience /></ProtectedRoute>} />
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