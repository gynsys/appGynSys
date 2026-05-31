import React from 'react';
import { motion } from 'framer-motion';
import { Settings, PencilRuler, FileSignature, HardHat, Key } from 'lucide-react';

const STEPS = [
  {
    icon: Settings,
    title: '1. Consulta Inicial',
    desc: 'Nos reunimos para entender tu visión, necesidades y presupuesto. Evaluamos el espacio y discutimos las posibilidades.',
  },
  {
    icon: PencilRuler,
    title: '2. Diseño y Planificación',
    desc: 'Nuestros arquitectos crean propuestas de diseño, planos y renders 3D para que visualices el resultado final.',
  },
  {
    icon: FileSignature,
    title: '3. Presupuesto y Contrato',
    desc: 'Presentamos un presupuesto detallado y transparente. Una vez aprobado, firmamos el contrato y establecemos el cronograma.',
  },
  {
    icon: HardHat,
    title: '4. Ejecución de Obra',
    desc: 'Nuestro equipo comienza la construcción o remodelación, con supervisión constante y reportes de avance regulares.',
  },
  {
    icon: Key,
    title: '5. Entrega Final',
    desc: 'Realizamos una inspección detallada contigo, entregamos garantías y te damos las llaves de tu nuevo espacio.',
  },
];

export default function Process() {
  return (
    <section id="proceso" className="section process">
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
            <Settings size={12} />
            Metodología de Trabajo
          </div>
          <h2 className="section-title">
            Nuestro proceso <span>paso a paso</span>
          </h2>
          <p className="section-subtitle" style={{ marginTop: 16 }}>
            Hemos perfeccionado nuestro método de trabajo para garantizar resultados predecibles,
            entregas a tiempo y sin sorpresas en el presupuesto.
          </p>
        </motion.div>

        <div className="process-steps">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                className="process-step"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
              >
                <div className="process-step-number">{i + 1}</div>
                <div className="process-step-icon">
                  <Icon size={40} strokeWidth={1.5} />
                </div>
                <h3 className="process-step-title">{step.title}</h3>
                <p className="process-step-desc">{step.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
