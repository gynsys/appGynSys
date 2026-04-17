import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from '../../../lib/axios';
import ModernLoader from '../../../components/common/ModernLoader';

export function PreconsultaPage() {
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get('appointment_id');
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const redirectToUnified = async () => {
      if (!appointmentId) {
        setError("Falta el ID de la cita en la URL.");
        setLoading(false);
        return;
      }

      try {
        // Fetch appointment to get the doctor_slug
        const res = await axios.get(`/onboarding/appointment/${appointmentId}`);
        const { doctor_slug } = res.data;

        if (doctor_slug) {
          // Redirect to the new unified path
          navigate(`/${doctor_slug}/preconsulta?appointment_id=${appointmentId}`, { replace: true });
        } else {
          setError("No se pudo identificar al especialista asociado a esta cita.");
          setLoading(false);
        }
      } catch (err) {
        console.error("[PreconsultaPage] Redirection error:", err);
        setError("La cita no existe o el enlace ha caducado.");
        setLoading(false);
      }
    };

    redirectToUnified();
  }, [appointmentId, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full border border-red-100">
           <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
             </svg>
           </div>
           <h2 className="text-xl font-bold text-gray-900 mb-2">Enlace no válido</h2>
           <p className="text-gray-500 mb-6">{error}</p>
           <button 
             onClick={() => navigate('/')}
             className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition"
           >
             Ir al inicio
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
      <ModernLoader 
        isOpen={loading} 
        text="Redirigiendo a tu preconsulta..." 
        primaryColor="#4F46E5" 
      />
      <div className="text-center">
        <p className="text-gray-400 animate-pulse font-medium">Conectando con tu especialista...</p>
      </div>
    </div>
  );
}
