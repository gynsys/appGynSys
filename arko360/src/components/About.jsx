import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Award, Users, ShieldCheck } from 'lucide-react';

const STATS = [
  { number: 200, suffix: '+', label: 'Proyectos Completados' },
  { number: 500, suffix: '+', label: 'Clientes Satisfechos' },
  { number: 15, suffix: '', label: 'Años de Experiencia' },
  { number: 50, suffix: '+', label: 'Colaboradores Expertos' },
];

const FEATURES = [
  {
    icon: CheckCircle,
    title: 'Calidad Garantizada',
    desc: 'Utilizamos materiales certificados y técnicas constructivas de vanguardia en cada proyecto.',
  },
  {
    icon: Award,
    title: 'Empresa Certificada',
    desc: 'Contamos con todas las certificaciones y registros necesarios para operar con plena legalidad.',
  },
  {
    icon: Users,
    title: 'Equipo Especializado',
    desc: 'Ingenieros, arquitectos y técnicos con años de experiencia en construcción y remodelaciones.',
  },
  {
    icon: ShieldCheck,
    title: 'Cumplimiento de Plazos',
    desc: 'Entregamos a tiempo sin sacrificar calidad. Tu proyecto termina cuando dijimos que terminaría.',
  },
];

function Counter({ target, suffix }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1800;
          const steps = 60;
          const increment = target / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref} className="about-stat-number">
      {count}{suffix}
    </span>
  );
}

export default function About() {
  return (
    <section id="nosotros" className="section about">
      <div className="container">
        <div className="about-grid">
          {/* Images column */}
          <motion.div
            className="about-images"
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <img
              src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80"
              alt="Equipo Arko 360 trabajando"
              className="about-img-main"
            />
            <div className="about-img-badge">
              <div className="about-img-badge-number">15+</div>
              <div className="about-img-badge-text">Años de<br />Experiencia</div>
            </div>

            <div className="about-stats">
              {STATS.map((stat) => (
                <div key={stat.label} className="about-stat-card">
                  <Counter target={stat.number} suffix={stat.suffix} />
                  <div className="about-stat-label">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Text column */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="section-tag">
              <Users size={12} />
              Sobre Nosotros
            </div>
            <h2 className="section-title" style={{ marginBottom: 20 }}>
              Construyendo sueños<br />
              <span>desde hace 15 años</span>
            </h2>
            <p className="section-subtitle" style={{ marginBottom: 16 }}>
              Ingeniería Arko 360 nació con una visión clara: ofrecer soluciones constructivas
              de la más alta calidad, combinando innovación tecnológica con la experiencia
              artesanal de nuestros técnicos.
            </p>
            <p className="section-subtitle" style={{ marginBottom: 36 }}>
              Hemos ejecutado más de 200 proyectos en todo el país, desde viviendas
              unifamiliares hasta complejos comerciales, siempre manteniendo nuestro
              compromiso con la excelencia y la satisfacción del cliente.
            </p>

            <div className="about-features">
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className="about-feature">
                    <div className="about-feature-icon">
                      <Icon size={20} strokeWidth={2} />
                    </div>
                    <div className="about-feature-text">
                      <strong>{feature.title}</strong>
                      <span>{feature.desc}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
