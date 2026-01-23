import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import LoginForm from '../../features/auth/LoginForm';
import ForgotPasswordForm from '../../features/auth/ForgotPasswordForm';

export default function LoginModal({ isOpen, onClose, primaryColor, darkMode }) {
    const [view, setView] = useState('login'); // 'login' | 'forgot-password'

    useEffect(() => {
        if (!isOpen) {
            const timer = setTimeout(() => {
                setView('login');
            }, 300); // Wait for transition to finish (200ms + buffer)
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="" darkMode={darkMode} size="sm">
            {view === 'login' ? (
                <LoginForm
                    isModal={true}
                    primaryColor={primaryColor}
                    onForgotPasswordClick={() => setView('forgot-password')}
                    onSuccess={onClose}
                />
            ) : (
                <ForgotPasswordForm
                    isModal={true}
                    primaryColor={primaryColor}
                    onBackToLogin={() => setView('login')}
                />
            )}
        </Modal>
    );
}
