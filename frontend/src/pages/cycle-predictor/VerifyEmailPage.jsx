import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '@/lib/axios';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import Button from '@/components/common/Button';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('Verificando tu cuenta...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('El enlace de verificación no es válido o está incompleto.');
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await api.post('/cycle-users/verify-email', {
          token
        });
        
        setStatus('success');
        setMessage(response.data.message || 'Cuenta verificada exitosamente.');
      } catch (error) {
        setStatus('error');
        setMessage(
          error.response?.data?.detail || 
          'No se pudo verificar la cuenta. Es posible que el enlace haya expirado o ya fue utilizado.'
        );
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-pink-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white/80 backdrop-blur-md shadow-xl rounded-2xl p-8 max-w-md w-full text-center border border-white/40">
        
        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <Loader2 className="h-16 w-16 text-violet-500 animate-spin mb-6" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Verificando...</h2>
            <p className="text-slate-600">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
            <CheckCircle2 className="h-20 w-20 text-emerald-500 mb-6" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">¡Cuenta Verificada!</h2>
            <p className="text-slate-600 mb-8">{message}</p>
            
            <p className="mt-4 text-sm text-slate-500">
              Ya puedes regresar al Chatbot y continuar agendando tus consultas libremente.
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
            <XCircle className="h-20 w-20 text-rose-500 mb-6" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Error de Verificación</h2>
            <p className="text-slate-600 mb-8">{message}</p>
            
            <Button 
              onClick={() => navigate('/')}
              variant="outline"
              className="w-full border-violet-200 text-violet-700 hover:bg-violet-50 rounded-xl py-6"
            >
              Volver al Inicio
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}
