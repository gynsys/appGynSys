import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_LINKS = [
  { label: 'Servicios', href: '#servicios' },
  { label: 'Proyectos', href: '#proyectos' },
  { label: 'Nosotros', href: '#nosotros' },
  { label: 'Proceso', href: '#proceso' },
  { label: 'Testimonios', href: '#testimonios' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAnchorClick = (e, href) => {
    e.preventDefault();
    setMobileOpen(false);
    const id = href.replace('#', '');
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="container">
          <div className="navbar-inner">
            <a href="#inicio" onClick={(e) => handleAnchorClick(e, '#inicio')}>
              <img
                src="/arko360/images/logo_aeko360.png"
                alt="Ingeniería Arko 360"
                className={`navbar-logo ${!scrolled ? 'navbar-logo-white' : ''}`}
              />
            </a>

            <ul className="navbar-links">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a href={link.href} onClick={(e) => handleAnchorClick(e, link.href)}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>

            <a
              href="#contacto"
              onClick={(e) => handleAnchorClick(e, '#contacto')}
              className="btn btn-primary navbar-cta navbar-links"
              style={{ display: 'inline-flex' }}
            >
              Solicitar Cotización
            </a>

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
              <a key={link.href} href={link.href} onClick={(e) => handleAnchorClick(e, link.href)}>
                {link.label}
              </a>
            ))}

            <a
              href="#contacto"
              onClick={(e) => handleAnchorClick(e, '#contacto')}
              className="btn btn-primary btn-lg"
              style={{ marginTop: 16 }}
            >
              Solicitar Cotización
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
