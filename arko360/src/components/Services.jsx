import React from 'react';
import { motion } from 'framer-motion';
import {
  Home, Wrench, Compass, ClipboardList, Layers, HardHat
} from 'lucide-react';

const SERVICES = [
  {
    icon: Home,
    title: 'Construcción Residencial',
    description:
      'Diseñamos y construimos viviendas de alta calidad, adaptadas a tus necesidades y presupuesto, con los mejores materiales del mercado.',
  },
  {
    icon: Wrench,
    title: 'Remodelaciones Integrales',
    description:
      'Transformamos espacios existentes con renovaciones completas. Cocinas, baños, salas y más, con acabados de primera.',
  },
  {
    icon: Compass,
    title: 'Diseño Arquitectónico',
    description:
      'Planos, renders 3D y planificación arquitectónica para que puedas visualizar tu proyecto antes de comenzar la construcción.',
  },
  {
    icon: ClipboardList,
    title: 'Gestión de Proyectos',
    description:
      'Supervisamos cada etapa de tu obra garantizando tiempos, calidad y presupuesto. Tu tranquilidad es nuestra prioridad.',
  },
  {
    icon: Layers,
    title: 'Acabados e Interiores',
    description:
      'Porcelanatos, pintura, yeso, cielos rasos, carpintería y más. Cada detalle interior que transforma espacios en hogares.',
  },
  {
    icon: HardHat,
    title: 'Consultoría Estructural',
    description:
      'Asesoramiento experto en análisis estructural, refuerzo de edificaciones y evaluación de condiciones constructivas.',
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.4, 0, 0.2, 1] },
  }),
};

export default function Services() {
  return (
    <section id="servicios" className="section services">
      <div className="container">
        <motion.div
          className="services-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="section-tag">
            <HardHat size={12} />
            Nuestros Servicios
          </div>
          <h2 className="section-title">
            Todo lo que necesitas<br />
            <span>bajo un mismo techo</span>
          </h2>
          <p className="section-subtitle" style={{ marginTop: 16 }}>
            Ofrecemos soluciones integrales de construcción y remodelación con más de 15 años
            de experiencia en el sector.
          </p>
        </motion.div>

        <div className="services-grid">
          {SERVICES.map((service, i) => {
            const Icon = service.icon;
            return (
              <motion.div
                key={service.title}
                className="service-card"
                custom={i}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <div className="service-icon">
                  <Icon size={28} strokeWidth={1.8} />
                </div>
                <h3 className="service-title">{service.title}</h3>
                <p className="service-desc">{service.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
