import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const NAV_LINKS = [
  { label: 'Servicios', href: '/#servicios' },
  { label: 'Proyectos', href: '/#proyectos' },
  { label: 'Nosotros', href: '/#nosotros' },
  { label: 'BiblioARKO', href: '/biblio' },
  { label: 'Herramientas', href: '/herramientas' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Effect to handle scroll when navigating back to landing page hashes
  useEffect(() => {
    if (location.pathname === '/' && location.hash) {
      setTimeout(() => {
        const id = location.hash.replace('#', '');
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [location]);

  const handleLinkClick = (e, href) => {
    setMobileOpen(false);
    
    // If it's a hash link on the same page (landing)
    if (href.startsWith('/#') && location.pathname === '/') {
      e.preventDefault();
      const id = href.replace('/#', '');
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Update url without reload
      window.history.pushState(null, '', href);
    }
  };

  return (
    <>
      <nav className={`navbar ${scrolled || location.pathname !== '/' ? 'scrolled' : ''}`}>
        <div className="container">
          <div className="navbar-inner">
            <Link to="/" onClick={() => setMobileOpen(false)}>
              <img
                src="/arko360/images/logo_aeko360.png"
                alt="Ingeniería Arko 360"
                className={`navbar-logo ${(!scrolled && location.pathname === '/') ? 'navbar-logo-white' : ''}`}
              />
            </Link>

            <ul className="navbar-links">
              {NAV_LINKS.map((link) => (
                <li key={link.label}>
                  <Link 
                    to={link.href} 
                    onClick={(e) => handleLinkClick(e, link.href)}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <Link
              to="/#contacto"
              onClick={(e) => handleLinkClick(e, '/#contacto')}
              className="btn btn-primary navbar-cta navbar-links"
              style={{ display: 'inline-flex' }}
            >
              Solicitar Cotización
            </Link>

            <button
              className="navbar-toggle"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menú"
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="navbar-mobile open"
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
          >
            <button
              className="navbar-mobile-close"
              onClick={() => setMobileOpen(false)}
              aria-label="Cerrar menú"
            >
              <X size={28} />
            </button>

            <img
              src="/arko360/images/logo_aeko360.png"
              alt="Arko 360"
              style={{ height: 44, marginBottom: 32 }}
            />

            {NAV_LINKS.map((link) => (
              <Link 
                key={link.label} 
                to={link.href} 
                onClick={(e) => handleLinkClick(e, link.href)}
              >
                {link.label}
              </Link>
            ))}

            <Link
              to="/#contacto"
              onClick={(e) => handleLinkClick(e, '/#contacto')}
              className="btn btn-primary btn-lg"
              style={{ marginTop: 16 }}
            >
              Solicitar Cotización
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
