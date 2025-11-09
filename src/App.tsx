import Navbar from "././components/Navbar";
import Hero from "././components/Hero";
import About from "././components/About";
import Projects from "././components/Projects";
import Contact from "././components/Contact";

function App() {
  return (
    <div className="font-sans bg-gray-50 text-gray-800">
      <Navbar />
      <Hero />
      <About />
      <Projects />
      <Contact />
    </div>
  );
}

export default App;
