import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Hero from './components/Hero.jsx';
import Services from './components/Services.jsx';
import Portfolio from './components/Portfolio.jsx';
import About from './components/About.jsx';
import Testimonials from './components/Testimonials.jsx';
import Process from './components/Process.jsx';
import Contact from './components/Contact.jsx';
import Footer from './components/Footer.jsx';

function LandingPage() {
  return (
    <main>
      <Hero />
      <Services />
      <Portfolio />
      <About />
      <Testimonials />
      <Process />
      <Contact />
    </main>
  );
}

function BiblioPage() {
  return (
    <main style={{ paddingTop: '120px', minHeight: '80vh' }} className="container">
      <h1 className="section-title">BiblioARKO</h1>
      <p>Próximamente: Artículos y Notas de Ingeniería.</p>
    </main>
  );
}

function ToolsPage() {
  return (
    <main style={{ paddingTop: '120px', minHeight: '80vh' }} className="container">
      <h1 className="section-title">Herramientas</h1>
      <p>Próximamente: Calculadoras de Ingeniería.</p>
    </main>
  );
}

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/biblio" element={<BiblioPage />} />
        <Route path="/herramientas" element={<ToolsPage />} />
      </Routes>
      <Footer />
    </>
  );
}
