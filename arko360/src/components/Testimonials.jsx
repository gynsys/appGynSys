import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquareQuote } from 'lucide-react';

const TESTIMONIALS = [
  {
    id: 1,
    text: 'Arko 360 superó todas mis expectativas. Construyeron mi casa en el tiempo acordado y con una calidad impresionante. El equipo es profesional, ordenado y siempre dispuesto a resolver cualquier inquietud.',
    name: 'Carlos Mendoza',
    role: 'Propietario — Residencia Las Acacias',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
    stars: 5,
  },
  {
    id: 2,
    text: 'La remodelación de nuestras oficinas fue un proceso sorprendentemente fluido. Cumplieron con el presupuesto, el tiempo y lo más importante: el resultado es extraordinario. Nuestros empleados y clientes quedaron encantados.',
    name: 'María González',
    role: 'Directora General — Grupo Comercial MG',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&q=80',
    stars: 5,
  },
  {
    id: 3,
    text: 'Llevamos 3 proyectos con Arko 360 y no pensamos cambiar de empresa constructora. Su transparencia, comunicación constante y nivel de acabados los hacen únicos en el mercado venezolano.',
    name: 'Roberto Herrera',
    role: 'Desarrollador Inmobiliario',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80',
    stars: 5,
  },
];

export default function Testimonials() {
  return (
    <section id="testimonios" className="section testimonials">
      <div className="container">
        <motion.div
          className="text-center"
          style={{ marginBottom: 64 }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="section-tag" style={{ margin: '0 auto 16px' }}>
            <MessageSquareQuote size={12} />
            Testimonios
          </div>
          <h2 className="section-title">
            Lo que dicen<br />
            <span>nuestros clientes</span>
          </h2>
          <p className="section-subtitle" style={{ marginTop: 16 }}>
            La satisfacción de nuestros clientes es el mejor indicador de nuestro trabajo.
          </p>
        </motion.div>

        <div className="testimonials-track">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.id}
              className="testimonial-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
            >
              <div className="testimonial-quote">"</div>
              <div className="testimonial-stars">
                {Array.from({ length: t.stars }).map((_, si) => (
                  <span key={si} className="testimonial-star">★</span>
                ))}
              </div>
              <p className="testimonial-text">{t.text}</p>
              <div className="testimonial-author">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="testimonial-avatar"
                  loading="lazy"
                />
                <div>
                  <div className="testimonial-name">{t.name}</div>
                  <div className="testimonial-role">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
