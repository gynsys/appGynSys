import { useState } from 'react'
import LoginModal from '../components/features/LoginModal'
import ForgotPasswordForm from '../features/auth/ForgotPasswordForm'

export default function ForgotPasswordPage() {
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)

    return (
        <>
            <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full">
                    <ForgotPasswordForm
                        onBackToLogin={() => setIsLoginModalOpen(true)}
                    />
                </div>
            </div>
            <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
        </>
    )
}
