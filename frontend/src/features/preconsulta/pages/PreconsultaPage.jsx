import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import PreconsultaWidget from '../components/PreconsultaWidget';

export function PreconsultaPage() {
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get('appointment_id');
  const navigate = useNavigate();
  // Always open in this standalone page mode
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    // In standalone mode, closing might mean going back to home or just staying there.
    // For now, let's redirect to landing or show a "finished" state.
    navigate('/');
  };

  if (!appointmentId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">
        Falta el ID de la cita.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
      {/* 
        We render the widget. 
        Since the widget is built as a Dialog/Modal, it will overlay.
        We can pass a prop to force it 'inline' if we wanted, 
        but the user seems happy with the 'modal' look found in the screenshot.
      */}
      <PreconsultaWidget
        isOpen={isOpen}
        onClose={handleClose}
        appointmentId={appointmentId}
      // In standalone mode, we might want to ensure it looks 'centered' and nice.
      />
    </div>
  );
}
