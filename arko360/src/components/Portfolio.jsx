import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ZoomIn, FolderOpen } from 'lucide-react';
import ProjectModal from './ProjectModal.jsx';

const PROJECTS = [
  {
    id: 1,
    title: 'Residencia Las Acacias',
    category: 'Residencial',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
    description: 'Construcción de vivienda unifamiliar de 320m² con diseño moderno, 4 habitaciones, 3 baños, área de servicio y jardín interior. Materiales de primera calidad con acabados importados.',
    duration: '8 meses',
    area: '320 m²',
    year: '2024',
  },
  {
    id: 2,
    title: 'Remodelación Oficinas Central',
    category: 'Comercial',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
    description: 'Transformación integral de 5 pisos de oficinas corporativas. Nuevo diseño open-space, salas de reuniones, área lounge y modernización de instalaciones eléctricas y de red.',
    duration: '4 meses',
    area: '1,200 m²',
    year: '2024',
  },
  {
    id: 3,
    title: 'Conjunto Residencial Torres',
    category: 'Residencial',
    image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80',
    description: 'Desarrollo de conjunto residencial de 24 apartamentos, 2 torres de 6 niveles con áreas comunes, gimnasio, piscina y parque infantil.',
    duration: '18 meses',
    area: '4,800 m²',
    year: '2023',
  },
  {
    id: 4,
    title: 'Restaurante Gourmet Nova',
    category: 'Comercial',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
    description: 'Construcción y acondicionamiento de restaurante gourmet de 2 niveles con cocina industrial, barra de cócteles, terraza exterior y baños premium.',
    duration: '3 meses',
    area: '480 m²',
    year: '2023',
  },
  {
    id: 5,
    title: 'Villa Mediterránea',
    category: 'Residencial',
    image: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&q=80',
    description: 'Diseño y construcción de villa estilo mediterráneo con piscina desbordante, jardines paisajistas, sala de cine, bodega de vinos y sistema domótico completo.',
    duration: '12 meses',
    area: '650 m²',
    year: '2022',
  },
  {
    id: 6,
    title: 'Refuerzo Estructural Edificio Caracas',
    category: 'Estructural',
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80',
    description: 'Evaluación y refuerzo estructural de edificio de 12 pisos. Instalación de muros de corte, vigas de amarre, nuevas columnas y sistemas anti-sísmicos.',
    duration: '6 meses',
    area: '2,400 m²',
    year: '2022',
  },
];

const CATEGORIES = ['Todos', 'Residencial', 'Comercial', 'Estructural'];

export default function Portfolio() {
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [selectedProject, setSelectedProject] = useState(null);

  const filtered = activeFilter === 'Todos'
    ? PROJECTS
    : PROJECTS.filter((p) => p.category === activeFilter);

  return (
    <section id="proyectos" className="section portfolio">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="section-tag">
            <FolderOpen size={12} />
            Portafolio
          </div>
          <h2 className="section-title">
            Proyectos que <span>hablan por sí solos</span>
          </h2>
          <p className="section-subtitle" style={{ marginTop: 16 }}>
            Cada obra es un compromiso con la excelencia. Descubre algunos de nuestros proyectos
            más destacados a lo largo de Venezuela.
          </p>
        </motion.div>

        <div className="portfolio-filters">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`filter-btn ${activeFilter === cat ? 'active' : ''}`}
              onClick={() => setActiveFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <motion.div
          className="portfolio-grid"
          layout
        >
          {filtered.map((project, i) => (
            <motion.div
              key={project.id}
              className="portfolio-item"
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              onClick={() => setSelectedProject(project)}
            >
              <img src={project.image} alt={project.title} loading="lazy" />
              <div className="portfolio-item-overlay">
                <div className="portfolio-item-info">
                  <h3>{project.title}</h3>
                  <p>{project.category}</p>
                </div>
              </div>
              <div className="portfolio-item-icon">
                <ZoomIn size={22} />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <ProjectModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />
    </section>
  );
}
