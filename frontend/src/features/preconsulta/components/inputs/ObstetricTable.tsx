import React, { useState, useEffect } from 'react';
import { FiAlertCircle, FiCheck } from 'react-icons/fi';

interface ChildDetail {
  id: string; // Use string UUID or timestamp
  year: string;
  type: 'Parto' | 'Cesarea';
  weight: string;
  height: string;
  complications: string;
}

interface ObstetricTableProps {
  label: string;
  onNext: (value: any) => void;
  primaryColor?: string;
}

export const ObstetricTable: React.FC<ObstetricTableProps> = ({ label, onNext, primaryColor = '#4F46E5' }) => {
  // --- SECTION 1: COUNTERS ---
  const [counts, setCounts] = useState({
    gestas: '',
    partos: '',
    cesareas: '',
    abortos: ''
  });

  const [step, setStep] = useState<'counters' | 'details'>('counters');

  // --- SECTION 2: DETAILS ---
  const [childrenDetails, setChildrenDetails] = useState<ChildDetail[]>([]);

  // Calculate expected births
  const totalBirths = (parseInt(counts.partos as any) || 0) + (parseInt(counts.cesareas as any) || 0);

  // Initialize Details when moving to step 2 or when counts change
  useEffect(() => {
    // Only re-initialize if array length doesn't match expected births
    // This preserves data if user goes back and forth but doesn't change totals
    if (childrenDetails.length !== totalBirths) {
      const newDetails: ChildDetail[] = Array(totalBirths).fill(null).map((_, i) => ({
        id: `child_${Date.now()}_${i}`,
        year: '',
        type: i < (parseInt(counts.partos as any) || 0) ? 'Parto' : 'Cesarea', // Smart default suggestion
        weight: '',
        height: '',
        complications: ''
      }));
      setChildrenDetails(newDetails);
    }
  }, [totalBirths]); // Depend on totalBirths

  const handleCountChange = (field: keyof typeof counts, val: string) => {
    // Allow empty string or numbers
    if (val === '' || /^\d+$/.test(val)) {
      setCounts(prev => ({ ...prev, [field]: val }));
    }
  };

  const handleDetailChange = (index: number, field: keyof ChildDetail, value: string) => {
    const updated = [...childrenDetails];
    updated[index] = { ...updated[index], [field]: value };
    setChildrenDetails(updated);
  };

  const handleContinueToDetails = () => {
    if (totalBirths === 0) {
      // If no births, skip details and finish
      handleSubmit();
    } else {
      setStep('details');
    }
  };

  // Roman Numeral Helper
  const toRoman = (num: number): string => {
    if (num === 0) return '0';
    const val = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
    const syb = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"];
    let roman_num = '';
    let i = 0;
    let n = num;
    while (n > 0) {
      while (n >= val[i]) {
        roman_num += syb[i];
        n -= val[i];
      }
      i++;
    }
    return roman_num;
  };

  const handleSubmit = () => {
    const gestas = parseInt(counts.gestas as any) || 0;
    const partos = parseInt(counts.partos as any) || 0;
    const cesareas = parseInt(counts.cesareas as any) || 0;
    const abortos = parseInt(counts.abortos as any) || 0;

    let summaryParts = [];

    if (gestas > 0) summaryParts.push(`${toRoman(gestas)}G`);
    if (partos > 0) summaryParts.push(`${toRoman(partos)}P`);
    if (cesareas > 0) summaryParts.push(`${toRoman(cesareas)}C`);
    if (abortos > 0) summaryParts.push(`${toRoman(abortos)}A`);

    const summary = summaryParts.length > 0 ? summaryParts.join(' ') : 'Nuligesta';

    onNext({
      ...counts,
      children: childrenDetails,
      summary
    });
  };

  if (step === 'counters') {
    return (
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{label}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Indica el resumen de tu historial obstétrico.</p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex flex-col items-center w-full">
            <p className="mb-2 font-bold text-center text-xs text-gray-900 dark:text-gray-300">GESTAS</p>
            <input
              type="number"
              min="0"
              className="w-20 p-2 text-center border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-current text-xl font-bold transition-all shadow-sm bg-white dark:bg-gray-700 dark:text-white [&::-webkit-inner-spin-button]:appearance-none"
              style={{ color: primaryColor, borderColor: 'var(--tw-border-opacity, #d1d5db)' }}
              onFocus={(e) => e.target.style.borderColor = primaryColor}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              value={counts.gestas}
              onChange={(e) => handleCountChange('gestas', e.target.value)}
            />
          </div>
          <div className="flex flex-col items-center w-full">
            <p className="mb-2 font-bold text-center text-xs text-gray-900 dark:text-gray-300">PARTOS</p>
            <input
              type="number"
              min="0"
              className="w-20 p-2 text-center border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-current text-xl font-bold transition-all shadow-sm bg-white dark:bg-gray-700 dark:text-white [&::-webkit-inner-spin-button]:appearance-none"
              style={{ color: primaryColor, borderColor: 'var(--tw-border-opacity, #d1d5db)' }}
              onFocus={(e) => e.target.style.borderColor = primaryColor}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              value={counts.partos}
              onChange={(e) => handleCountChange('partos', e.target.value)}
            />
          </div>
          <div className="flex flex-col items-center w-full">
            <p className="mb-2 font-bold text-center text-xs text-gray-900 dark:text-gray-300">CESÁREAS</p>
            <input
              type="number"
              min="0"
              className="w-20 p-2 text-center border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-current text-xl font-bold transition-all shadow-sm bg-white dark:bg-gray-700 dark:text-white [&::-webkit-inner-spin-button]:appearance-none"
              style={{ color: primaryColor, borderColor: 'var(--tw-border-opacity, #d1d5db)' }}
              onFocus={(e) => e.target.style.borderColor = primaryColor}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              value={counts.cesareas}
              onChange={(e) => handleCountChange('cesareas', e.target.value)}
            />
          </div>
          <div className="flex flex-col items-center w-full">
            <p className="mb-2 font-bold text-center text-xs text-gray-900 dark:text-gray-300">ABORTOS</p>
            <input
              type="number"
              min="0"
              className="w-20 p-2 text-center border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-current text-xl font-bold transition-all shadow-sm bg-white dark:bg-gray-700 dark:text-white [&::-webkit-inner-spin-button]:appearance-none"
              style={{ color: primaryColor, borderColor: 'var(--tw-border-opacity, #d1d5db)' }}
              onFocus={(e) => e.target.style.borderColor = primaryColor}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              value={counts.abortos}
              onChange={(e) => handleCountChange('abortos', e.target.value)}
            />
          </div>
        </div>

        {/* Validation warning if math looks off */}
        {counts.gestas < (counts.partos + counts.cesareas + counts.abortos) && (
          <div className="flex items-start gap-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 p-3 rounded-md mb-4 text-sm">
            <FiAlertCircle className="mt-0.5 flex-shrink-0" />
            <p>El número de Gestas suele ser la suma de Partos + Cesáreas + Abortos + Embarazo actual (si aplica).</p>
          </div>
        )}

        <button
          onClick={handleContinueToDetails}
          className="w-full text-white py-2 rounded-lg font-bold hover:opacity-90 transition-opacity shadow-md"
          style={{ backgroundColor: primaryColor }}
        >
          {totalBirths > 0 ? 'Siguiente: Detallar Hijos' : 'ENVIAR'}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4 border-b dark:border-gray-700 pb-4">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white">Detalle de Nacimientos</h3>
        <button onClick={() => setStep('counters')} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
          Volver a contadores
        </button>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Por favor completa la información para los <strong>{totalBirths}</strong> nacimientos registrados (Partos + Cesáreas).
      </p>

      <div className="space-y-4 mb-8">
        {childrenDetails.map((child, index) => (
          <div key={child.id} className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
              <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 w-6 h-6 flex items-center justify-center rounded-full text-xs">
                {index + 1}
              </span>
              Nacimiento
            </h4>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="col-span-1">
                <p className="mb-1 font-bold text-center text-[10px] text-gray-900 dark:text-gray-300">AÑO</p>
                <input
                  type="number"
                  placeholder="Ej. 2018"
                  className="w-full h-9 px-2 border border-gray-400 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 dark:text-white [&::-webkit-inner-spin-button]:appearance-none"
                  value={child.year}
                  onChange={(e) => handleDetailChange(index, 'year', e.target.value)}
                />
              </div>
              <div className="col-span-1">
                <p className="mb-1 font-bold text-center text-[10px] text-gray-900 dark:text-gray-300">TIPO</p>
                <select
                  className="w-full h-9 px-2 border border-gray-400 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 dark:text-white"
                  value={child.type}
                  onChange={(e) => handleDetailChange(index, 'type', e.target.value as any)}
                >
                  <option value="Parto">Parto</option>
                  <option value="Cesarea">Cesárea</option>
                </select>
              </div>
              <div className="col-span-1">
                <p className="mb-1 font-bold text-center text-[10px] text-gray-900 dark:text-gray-300">PESO</p>
                <input
                  type="text"
                  placeholder="Ej. 3.2kg"
                  className="w-full h-9 px-2 border border-gray-400 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-800 dark:text-white"
                  value={child.weight}
                  onChange={(e) => handleDetailChange(index, 'weight', e.target.value)}
                />
              </div>
              <div className="col-span-1">
                <p className="mb-1 font-bold text-center text-[10px] text-gray-900 dark:text-gray-300">TALLA</p>
                <input
                  type="text"
                  placeholder="Ej. 50cm"
                  className="w-full h-9 px-2 border border-gray-400 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-800 dark:text-white"
                  value={child.height}
                  onChange={(e) => handleDetailChange(index, 'height', e.target.value)}
                />
              </div>
            </div>

            <div className="w-full">
              <p className="mb-1 font-bold text-[10px] text-gray-900 dark:text-gray-300">COMPLICACIONES</p>
              <select
                className="w-full h-9 px-2 border border-gray-400 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 dark:text-white"
                value={child.complications}
                onChange={(e) => handleDetailChange(index, 'complications', e.target.value)}
              >
                <option value="Sin complicaciones">Sin complicaciones</option>
                <option value="Preeclampsia">Preeclampsia</option>
                <option value="Hemorragia">Hemorragia</option>
                <option value="Distocia">Distocia</option>
                <option value="Infección">Infección</option>
                <option value="Placenta previa">Placenta previa</option>
                <option value="Otras">Otras</option>
              </select>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        className="w-full text-white py-2 rounded-lg font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-md"
        style={{ backgroundColor: primaryColor }}
      >
        <FiCheck /> Guardar Historial
      </button>
    </div>
  );
};
