import React, { useState } from 'react';

export const ListBuilder = ({ value, onChange, placeholder = "Agregar nuevo ítem..." }) => {
  const [newItem, setNewItem] = useState('');

  // Parse items from the newline-separated string
  const items = value ? value.split('\n').filter(line => line.trim() !== '') : [];

  const handleAddItem = (e) => {
    e.preventDefault();
    if (newItem.trim()) {
      const updatedItems = [...items, newItem.trim()];
      onChange(updatedItems.join('\n'));
      setNewItem('');
    }
  };

  const handleRemoveItem = (index) => {
    const updatedItems = items.filter((_, i) => i !== index);
    onChange(updatedItems.join('\n'));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleAddItem(e);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-4 space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-start gap-2 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600 group">
            <span className="text-gray-400 mt-1">•</span>
            <span className="flex-1 text-gray-800 dark:text-gray-100">{item}</span>
            <button
              onClick={() => handleRemoveItem(index)}
              className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Eliminar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-gray-400 text-sm italic p-2">No hay ítems agregados.</div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-gray-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white dark:placeholder-gray-400"
        />
        <button
          onClick={handleAddItem}
          disabled={!newItem.trim()}
          className="bg-gray-900 dark:bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-transparent dark:border-gray-600"
        >
          Agregar
        </button>
      </div>
    </div>
  );
};
