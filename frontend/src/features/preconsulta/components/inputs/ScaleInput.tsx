import React from 'react';

interface ScaleInputProps {
  label: string;
  onNext: (value: number) => void;
  min?: number;
  max?: number;
  primaryColor?: string;
}

export const ScaleInput: React.FC<ScaleInputProps> = ({ label, onNext, primaryColor = '#4f46e5' }) => {

  const handleSelect = (val: number) => {
    onNext(val);
  };

  const Button = ({ value }: { value: number }) => (
    <button
      onClick={() => handleSelect(value)}
      className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold border-2 border-white rounded-lg py-1 px-[3px] text-base transition-all shadow-sm"
    >
      {value}
    </button>
  );

  return (
    <div className="w-full max-w-sm animate-fade-in">
      <div
        className="p-2.5 rounded-xl shadow-md space-y-2"
        style={{ backgroundColor: primaryColor }}
      >
        {/* Leve: 1, 2, 3 */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
          <span className="text-xs font-semibold text-white uppercase tracking-wider w-20">Leve</span>
          <div className="grid grid-cols-3 gap-1.5 flex-1">
            <Button value={1} />
            <Button value={2} />
            <Button value={3} />
          </div>
        </div>

        {/* Moderado: 4, 5, 6 */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
          <span className="text-xs font-semibold text-white uppercase tracking-wider w-20">Moderado</span>
          <div className="grid grid-cols-3 gap-1.5 flex-1">
            <Button value={4} />
            <Button value={5} />
            <Button value={6} />
          </div>
        </div>

        {/* Intenso: 7, 8, 9, 10 */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
          <span className="text-xs font-semibold text-white uppercase tracking-wider w-20">Intenso</span>
          <div className="grid grid-cols-4 gap-1.5 flex-1">
            <Button value={7} />
            <Button value={8} />
            <Button value={9} />
            <Button value={10} />
          </div>
        </div>
      </div>
    </div>
  );
};
