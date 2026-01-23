import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';

import { FiTrash2 } from 'react-icons/fi';

const DAYS = [
  { id: 0, label: 'Dom' },
  { id: 1, label: 'Lun' },
  { id: 2, label: 'Mar' },
  { id: 3, label: 'Mié' },
  { id: 4, label: 'Jue' },
  { id: 5, label: 'Vie' },
  { id: 6, label: 'Sáb' },
];

export default function ScheduleModal({ isOpen, onClose, tenant, onSave }) {
  const [schedule, setSchedule] = useState({});
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');

  useEffect(() => {
    if (tenant?.schedule) {
      setSchedule(tenant.schedule);
    } else {
      setSchedule({});
    }
  }, [tenant]);

  const handleAddLocation = () => {
    setIsAddingLocation(true);
  };

  const confirmAddLocation = () => {
    const name = newLocationName.trim();
    if (name && !schedule[name]) {
      setSchedule(prev => ({
        ...prev,
        [name]: {
          days: [],
          hours: { start: 8, end: 17 },
          label: `${name} (8am - 5pm)`
        }
      }));
      setNewLocationName('');
      setIsAddingLocation(false);
    }
  };

  const cancelAddLocation = () => {
    setNewLocationName('');
    setIsAddingLocation(false);
  };

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState(null);

  const handleDeleteClick = (name) => {
    setLocationToDelete(name);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (locationToDelete) {
      const newSchedule = { ...schedule };
      delete newSchedule[locationToDelete];
      setSchedule(newSchedule);
      setIsDeleteModalOpen(false);
      setLocationToDelete(null);
    }
  };

  const handleDayToggle = (locName, dayId) => {
    setSchedule(prev => {
      const loc = prev[locName];
      const newDays = loc.days.includes(dayId)
        ? loc.days.filter(d => d !== dayId)
        : [...loc.days, dayId].sort();

      return {
        ...prev,
        [locName]: { ...loc, days: newDays }
      };
    });
  };

  const handleHourChange = (locName, field, value) => {
    setSchedule(prev => ({
      ...prev,
      [locName]: {
        ...prev[locName],
        hours: { ...prev[locName].hours, [field]: parseInt(value) }
      }
    }));
  };

  const handleSave = () => {
    // Update labels automatically based on hours
    const finalSchedule = {};
    Object.keys(schedule).forEach(key => {
      const loc = schedule[key];
      const start = loc.hours.start > 12 ? `${loc.hours.start - 12}pm` : `${loc.hours.start}am`;
      const end = loc.hours.end > 12 ? `${loc.hours.end - 12}pm` : `${loc.hours.end}am`;

      finalSchedule[key] = {
        ...loc,
        label: `${key} (${start} - ${end})`
      };
    });

    onSave(tenant.id, { schedule: finalSchedule });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Horarios de ${tenant?.nombre_completo}`} size="lg">
      <div className="space-y-6">
        {!isAddingLocation ? (
          <div className="flex justify-end">
            <Button onClick={handleAddLocation} size="sm">Agregar Sede</Button>
          </div>
        ) : (
          <div className="bg-gray-50 p-4 rounded-lg border border-indigo-100">
            <label className="block text-sm font-medium text-gray-700 mb-2">Nueva Sede</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
                placeholder="Ej: Consultorio Centro, Clínica Santa María..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') confirmAddLocation();
                  if (e.key === 'Escape') cancelAddLocation();
                }}
              />
              <Button onClick={confirmAddLocation} size="sm">Confirmar</Button>
              <Button onClick={cancelAddLocation} size="sm" variant="secondary">Cancelar</Button>
            </div>
          </div>
        )}

        {Object.keys(schedule).length === 0 && !isAddingLocation && (
          <p className="text-gray-500 text-center">No hay horarios configurados.</p>
        )}

        {Object.entries(schedule).map(([name, data]) => (
          <div key={name} className="border p-4 rounded-lg bg-gray-50">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-bold text-lg">{name}</h4>
              <button onClick={() => handleDeleteClick(name)} className="text-red-600 text-sm">Eliminar</button>
            </div>

            <div className="mb-3">
              <label className="block text-xs font-bold mb-1">Días de Consulta:</label>
              <div className="flex gap-2 flex-wrap">
                {DAYS.map(day => (
                  <label key={day.id} className="flex items-center space-x-1 cursor-pointer bg-white px-2 py-1 rounded border">
                    <input
                      type="checkbox"
                      checked={data.days.includes(day.id)}
                      onChange={() => handleDayToggle(name, day.id)}
                      className="rounded text-indigo-600"
                    />
                    <span className="text-sm">{day.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <div>
                <label className="block text-xs font-bold mb-1">Hora Inicio (24h):</label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={data.hours.start}
                  onChange={(e) => handleHourChange(name, 'start', e.target.value)}
                  className="w-20 p-1 border rounded"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Hora Fin (24h):</label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={data.hours.end}
                  onChange={(e) => handleHourChange(name, 'end', e.target.value)}
                  className="w-20 p-1 border rounded"
                />
              </div>
            </div>
          </div>
        ))}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Guardar Horarios</Button>
        </div>
      </div>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmar eliminación"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-center text-red-100 bg-red-100 w-12 h-12 rounded-full mx-auto mb-4">
            <FiTrash2 className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-gray-600 text-center">
            ¿Estás seguro de que deseas eliminar la sede <strong>{locationToDelete}</strong>?
          </p>
          <div className="flex justify-end space-x-3 mt-6">
            <Button
              variant="secondary"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={confirmDelete}
            >
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </Modal>
  );
}
