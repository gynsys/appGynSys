import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calculator, AlertTriangle, Droplets, Box, Mountain, Hash } from 'lucide-react';
import { Link } from 'react-router-dom';

// Factor Z según Fractil
const getFactorZ = (fractil) => {
  const f = parseFloat(fractil);
  if (f === 1) return 2.326;
  if (f === 2) return 2.054;
  if (f === 3) return 1.881;
  if (f === 4) return 1.751;
  if (f === 5) return 1.645;
  if (f === 10) return 1.282;
  if (f === 15) return 1.036;
  if (f === 20) return 0.842;
  return 1.282; // Default 10%
};

export default function MixDesignCalculator() {
  // --- Inputs State ---
  const [inputs, setInputs] = useState({
    volumen: 1.0,        // m3
    fc: 250,             // Kg/cm2
    asentamiento: 5.0,   // Pulgadas
    relacionB: 0.55,     // b (Relación agregado)
    fractil: 10,         // %
    desviacionEstandar: 35, // S (Típica)
    fCorrAgregado: 1.0,  // Factor de Corrección del Agregado
    
    // Gravedades Específicas
    gG: 2.7,             // Grueso
    gA: 2.64,            // Fino / Arena
    
    // Humedad y Absorción
    humedadFino: 0.0,    // %
    humedadGrueso: 0.0,  // %
    absorcionFino: 2.0,  // %
    absorcionGrueso: 1.0 // %
  });

  // --- Results State ---
  const [results, setResults] = useState({
    cemento: 0,
    agua: 0,
    arena: 0,
    piedra: 0,
    aguaCorregida: 0,
    arenaCorregida: 0,
    piedraCorregida: 0,
    relacionAC: 0
  });

  // --- Calculation Logic ---
  useEffect(() => {
    try {
      const { 
        volumen, fc, asentamiento, relacionB, fractil, desviacionEstandar, fCorrAgregado,
        gG, gA, humedadFino, humedadGrueso, absorcionFino, absorcionGrueso
      } = inputs;

      const Z = getFactorZ(fractil);
      const b = relacionB;

      // 1. Relación Agua/Cemento (a/c) teórica del modelo
      // a/c = 3.147 - (0.4625 * LN(fc + Z * S))
      const resistenciaRequerida = parseFloat(fc) + (Z * parseFloat(desviacionEstandar));
      const relacionAC = 3.147 - (0.4625 * Math.log(resistenciaRequerida));

      // 2. Cemento (Kg para 1m3)
      // = (117.2 * (a/c)^-1.3 * ((Asentamiento * 2.54)^0.16)) * F_corr
      const cementoM3 = 117.2 * Math.pow(relacionAC, -1.3) * Math.pow(parseFloat(asentamiento) * 2.54, 0.16) * parseFloat(fCorrAgregado);

      // 3. Agua (Kg para 1m3)
      const aguaM3 = cementoM3 * relacionAC;

      // 4. Arena (Kg para 1m3)
      // = (((1000 - 0.3*Cemento - Agua - Cemento/25) * (gA*b + (1-b)*gG)) * b)
      const arenaM3 = (1000 - (0.3 * cementoM3) - aguaM3 - (cementoM3 / 25)) * ((parseFloat(gA) * b) + ((1 - b) * parseFloat(gG))) * b;

      // 5. Piedra (Kg para 1m3)
      const piedraM3 = (arenaM3 / b) - arenaM3;

      // 6. Correcciones por humedad y absorción
      const arenaCorregidaM3 = arenaM3 * (1 + parseFloat(humedadFino)/100);
      const piedraCorregidaM3 = piedraM3 * (1 + parseFloat(humedadGrueso)/100);
      
      const aporteAguaArena = arenaM3 * ((parseFloat(humedadFino) - parseFloat(absorcionFino)) / 100);
      const aporteAguaPiedra = piedraM3 * ((parseFloat(humedadGrueso) - parseFloat(absorcionGrueso)) / 100);
      
      const aguaCorregidaM3 = aguaM3 - aporteAguaArena - aporteAguaPiedra;

      // 7. Multiplicar por volumen deseado y setear resultados
      const v = parseFloat(volumen);
      setResults({
        relacionAC: relacionAC.toFixed(3),
        cemento: (cementoM3 * v).toFixed(1),
        agua: (aguaM3 * v).toFixed(1),
        arena: (arenaM3 * v).toFixed(1),
        piedra: (piedraM3 * v).toFixed(1),
        aguaCorregida: (aguaCorregidaM3 * v).toFixed(1),
        arenaCorregida: (arenaCorregidaM3 * v).toFixed(1),
        piedraCorregida: (piedraCorregidaM3 * v).toFixed(1)
      });
    } catch (e) {
      console.error("Error en cálculos:", e);
    }
  }, [inputs]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="bg-white min-h-screen pt-32 pb-24">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <Link to="/herramientas" className="text-primary hover:underline flex items-center gap-2 mb-4">
            ← Volver a Herramientas
          </Link>
          <h1 className="text-4xl md:text-5xl font-black text-secondary tracking-tight mb-4">
            Diseño de Mezclas <span className="text-primary">Avanzado</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-3xl">
            Calculadora paramétrica para diseño de concreto utilizando modelos logarítmicos continuos validados experimentalmente.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Panel Izquierdo: Entradas */}
          <div className="lg:col-span-5 bg-slate-50 p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Calculator size={20} />
              </div>
              <h2 className="text-2xl font-bold text-secondary">Datos de Entrada</h2>
            </div>

            <div className="space-y-6">
              {/* Parámetros Generales */}
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Parámetros de Diseño</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Volumen (m³)</label>
                    <input type="number" name="volumen" value={inputs.volumen} onChange={handleInputChange} step="0.1" className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">f'c (Kg/cm²)</label>
                    <input type="number" name="fc" value={inputs.fc} onChange={handleInputChange} step="10" className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Asentamiento (pulg)</label>
                    <input type="number" name="asentamiento" value={inputs.asentamiento} onChange={handleInputChange} step="0.5" className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Relación 'b'</label>
                    <input type="number" name="relacionB" value={inputs.relacionB} onChange={handleInputChange} step="0.01" className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                  </div>
                </div>
              </div>

              {/* Estadísticos */}
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Control Estadístico</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Fractil (%)</label>
                    <select name="fractil" value={inputs.fractil} onChange={handleInputChange} className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white">
                      {[1, 2, 3, 4, 5, 10, 15, 20].map(f => (
                        <option key={f} value={f}>{f}%</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Desv. Est. (S)</label>
                    <input type="number" name="desviacionEstandar" value={inputs.desviacionEstandar} onChange={handleInputChange} step="1" className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                  </div>
                </div>
              </div>

              {/* Agregados */}
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Propiedades Agregados</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div className="col-span-2 grid grid-cols-2 gap-4">
                    <span className="text-xs font-semibold text-slate-500 text-center">Fino (Arena)</span>
                    <span className="text-xs font-semibold text-slate-500 text-center">Grueso (Piedra)</span>
                  </div>
                  
                  {/* Gravedad */}
                  <div className="flex items-center justify-between col-span-2 gap-4">
                    <span className="text-xs font-semibold text-slate-600 w-16">Gravedad</span>
                    <input type="number" name="gA" value={inputs.gA} onChange={handleInputChange} step="0.01" className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 focus:border-primary outline-none" />
                    <input type="number" name="gG" value={inputs.gG} onChange={handleInputChange} step="0.01" className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 focus:border-primary outline-none" />
                  </div>

                  {/* Humedad */}
                  <div className="flex items-center justify-between col-span-2 gap-4">
                    <span className="text-xs font-semibold text-slate-600 w-16">Humedad %</span>
                    <input type="number" name="humedadFino" value={inputs.humedadFino} onChange={handleInputChange} step="0.1" className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 focus:border-primary outline-none" />
                    <input type="number" name="humedadGrueso" value={inputs.humedadGrueso} onChange={handleInputChange} step="0.1" className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 focus:border-primary outline-none" />
                  </div>

                  {/* Absorción */}
                  <div className="flex items-center justify-between col-span-2 gap-4">
                    <span className="text-xs font-semibold text-slate-600 w-16">Absorción %</span>
                    <input type="number" name="absorcionFino" value={inputs.absorcionFino} onChange={handleInputChange} step="0.1" className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 focus:border-primary outline-none" />
                    <input type="number" name="absorcionGrueso" value={inputs.absorcionGrueso} onChange={handleInputChange} step="0.1" className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 focus:border-primary outline-none" />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Panel Derecho: Resultados */}
          <div className="lg:col-span-7">
            <div className="sticky top-32">
              <div className="bg-secondary p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
                {/* Elementos decorativos */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"></div>

                <div className="relative z-10">
                  <div className="flex justify-between items-end mb-8">
                    <div>
                      <h2 className="text-sm font-bold text-primary tracking-widest uppercase mb-2">Resultados del Diseño</h2>
                      <p className="text-3xl font-black">Cantidades para {inputs.volumen} m³</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Relación A/C</p>
                      <p className="text-2xl font-bold text-primary">{results.relacionAC}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    {/* Cemento */}
                    <div className="bg-white/10 backdrop-blur-md border border-white/10 p-5 rounded-2xl">
                      <div className="flex items-center gap-2 mb-3 text-slate-300">
                        <Box size={18} />
                        <span className="font-semibold text-sm">Cemento</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black">{results.cemento}</span>
                        <span className="text-sm font-medium text-slate-400">Kg</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">{(results.cemento / 42.5).toFixed(1)} Sacos (42.5kg)</p>
                    </div>

                    {/* Agua */}
                    <div className="bg-white/10 backdrop-blur-md border border-white/10 p-5 rounded-2xl">
                      <div className="flex items-center gap-2 mb-3 text-blue-300">
                        <Droplets size={18} />
                        <span className="font-semibold text-sm">Agua (Corregida)</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-white">{results.aguaCorregida}</span>
                        <span className="text-sm font-medium text-slate-400">Litros</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-2 line-through opacity-70">Teórica: {results.agua} L</p>
                    </div>

                    {/* Arena */}
                    <div className="bg-white/10 backdrop-blur-md border border-white/10 p-5 rounded-2xl">
                      <div className="flex items-center gap-2 mb-3 text-yellow-300">
                        <Mountain size={18} />
                        <span className="font-semibold text-sm">Arena (Corregida)</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black">{results.arenaCorregida}</span>
                        <span className="text-sm font-medium text-slate-400">Kg</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-2 line-through opacity-70">Teórica: {results.arena} Kg</p>
                    </div>

                    {/* Piedra */}
                    <div className="bg-white/10 backdrop-blur-md border border-white/10 p-5 rounded-2xl">
                      <div className="flex items-center gap-2 mb-3 text-slate-300">
                        <Hash size={18} />
                        <span className="font-semibold text-sm">Piedra (Corregida)</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black">{results.piedraCorregida}</span>
                        <span className="text-sm font-medium text-slate-400">Kg</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-2 line-through opacity-70">Teórica: {results.piedra} Kg</p>
                    </div>
                  </div>

                  <div className="bg-blue-500/20 border border-blue-500/30 p-4 rounded-xl flex items-start gap-3">
                    <AlertTriangle className="text-blue-400 flex-shrink-0 mt-0.5" size={20} />
                    <p className="text-sm text-blue-100 leading-relaxed">
                      <strong>Nota de Precisión:</strong> Estas dosificaciones son teóricas y calculadas bajo el modelo matemático paramétrico. Los resultados finales en obra pueden requerir ajustes menores por la variabilidad real de los agregados.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
