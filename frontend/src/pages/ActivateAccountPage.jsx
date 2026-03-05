import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../lib/axios'

/**
 * ActivateAccountPage
 *
 * Public page reached via /activar-cuenta?token=TOKEN
 * Allows a patient to set their password and activate their Mi Ciclo account.
 * After successful activation, logs in automatically and redirects to /cycle/dashboard.
 */
export default function ActivateAccountPage() {
    const [searchParams] = useSearchParams()
    const token = searchParams.get('token')
    const navigate = useNavigate()
    const { loadUser } = useAuthStore()

    // Token info
    const [email, setEmail] = useState('')
    const [tokenStatus, setTokenStatus] = useState('loading') // loading | valid | invalid | expired | used

    // Form state
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [formStatus, setFormStatus] = useState('idle') // idle | loading | success | error
    const [errorMessage, setErrorMessage] = useState('')

    // On mount: validate token and fetch email to pre-fill form
    useEffect(() => {
        if (!token) {
            setTokenStatus('invalid')
            return
        }

        const fetchTokenInfo = async () => {
            try {
                const res = await api.get(`/auth/patient/activation-info?token=${token}`)
                setEmail(res.data.email)
                setTokenStatus('valid')
            } catch (err) {
                const detail = err.response?.data?.detail || ''
                if (detail.includes('expirado') || detail.includes('expired')) {
                    setTokenStatus('expired')
                } else if (detail.includes('utilizado') || detail.includes('usado')) {
                    setTokenStatus('used')
                } else {
                    setTokenStatus('invalid')
                }
            }
        }

        fetchTokenInfo()
    }, [token])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setErrorMessage('')

        if (password !== confirmPassword) {
            setErrorMessage('Las contraseñas no coinciden')
            return
        }
        if (password.length < 6) {
            setErrorMessage('La contraseña debe tener al menos 6 caracteres')
            return
        }

        setFormStatus('loading')
        try {
            const res = await api.post('/auth/patient/activate', { token, password })
            // Store cycle token and load user
            localStorage.setItem('cycle_access_token', res.data.access_token)
            await loadUser()
            setFormStatus('success')
            setTimeout(() => navigate('/cycle/dashboard'), 1800)
        } catch (err) {
            setFormStatus('error')
            setErrorMessage(err.response?.data?.detail || 'Error al activar la cuenta. Intente de nuevo.')
        }
    }

    // ─── Render helpers ────────────────────────────────────────────────────────

    const cardStyle = {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        padding: '24px',
        fontFamily: "'Inter', system-ui, sans-serif",
    }

    const glassCard = {
        width: '100%',
        maxWidth: '420px',
        background: 'rgba(255, 255, 255, 0.07)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '20px',
        padding: '40px 36px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
        color: '#fff',
    }

    const inputStyle = {
        width: '100%',
        padding: '12px 16px',
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.18)',
        borderRadius: '10px',
        color: '#fff',
        fontSize: '15px',
        outline: 'none',
        transition: 'border-color 0.2s',
        boxSizing: 'border-box',
    }

    const labelStyle = {
        fontSize: '13px',
        fontWeight: '500',
        color: 'rgba(255,255,255,0.65)',
        marginBottom: '6px',
        display: 'block',
        letterSpacing: '0.02em',
    }

    const btnPrimary = {
        width: '100%',
        padding: '13px',
        background: 'linear-gradient(135deg, #a855f7, #6366f1)',
        border: 'none',
        borderRadius: '10px',
        color: '#fff',
        fontSize: '15px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'opacity 0.2s, transform 0.15s',
        marginTop: '8px',
        letterSpacing: '0.03em',
    }

    // ─── Token invalid / expired / used states ─────────────────────────────────
    if (tokenStatus === 'loading') {
        return (
            <div style={cardStyle}>
                <div style={glassCard}>
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <div style={{
                            width: '48px', height: '48px',
                            border: '3px solid rgba(255,255,255,0.2)',
                            borderTop: '3px solid #a855f7',
                            borderRadius: '50%',
                            margin: '0 auto 20px',
                            animation: 'spin 0.8s linear infinite',
                        }} />
                        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px' }}>Verificando enlace…</p>
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                </div>
            </div>
        )
    }

    if (tokenStatus !== 'valid') {
        const msgs = {
            expired: { icon: '⏰', title: 'Enlace expirado', body: 'Este enlace de activación ya no es válido. Contacta a tu doctora para que te envíe uno nuevo.' },
            used: { icon: '✅', title: 'Cuenta ya activada', body: 'Este enlace ya fue utilizado. Si olvidaste tu contraseña, usa la opción de recuperación.' },
            invalid: { icon: '❌', title: 'Enlace inválido', body: 'El enlace no existe o está incompleto. Verifica que copiaste el enlace completo del correo.' },
        }
        const m = msgs[tokenStatus] || msgs.invalid
        return (
            <div style={cardStyle}>
                <div style={{ ...glassCard, textAlign: 'center' }}>
                    <div style={{ fontSize: '52px', marginBottom: '16px' }}>{m.icon}</div>
                    <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '12px' }}>{m.title}</h2>
                    <p style={{ color: 'rgba(255,255,255,0.65)', lineHeight: '1.6', marginBottom: '28px' }}>{m.body}</p>
                    {tokenStatus === 'used' && (
                        <a href="/cycle/dashboard" style={{ color: '#a855f7', fontWeight: '600', textDecoration: 'none' }}>
                            Ir a Mi Ciclo →
                        </a>
                    )}
                </div>
            </div>
        )
    }

    // ─── Success state ─────────────────────────────────────────────────────────
    if (formStatus === 'success') {
        return (
            <div style={cardStyle}>
                <div style={{ ...glassCard, textAlign: 'center' }}>
                    <div style={{ fontSize: '56px', marginBottom: '16px' }}>🎉</div>
                    <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '10px' }}>¡Cuenta activada!</h2>
                    <p style={{ color: 'rgba(255,255,255,0.65)', marginBottom: '8px' }}>Bienvenida a Mi Ciclo.</p>
                    <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px' }}>Redirigiendo…</p>
                </div>
            </div>
        )
    }

    // ─── Main form ─────────────────────────────────────────────────────────────
    return (
        <div style={cardStyle}>
            <div style={glassCard}>
                {/* Logo / Brand */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '56px', height: '56px',
                        background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                        borderRadius: '14px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '26px',
                        margin: '0 auto 14px',
                        boxShadow: '0 8px 24px rgba(168,85,247,0.35)',
                    }}>
                        🌸
                    </div>
                    <h1 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
                        Activa tu cuenta
                    </h1>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', margin: 0 }}>
                        Elige una contraseña para acceder a Mi Ciclo
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    {/* Email (pre-filled, read-only) */}
                    <div>
                        <label style={labelStyle}>Correo electrónico</label>
                        <input
                            id="activate-email"
                            type="email"
                            value={email}
                            readOnly
                            style={{ ...inputStyle, opacity: 0.6, cursor: 'not-allowed' }}
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label style={labelStyle}>Nueva contraseña</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                id="activate-password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Mínimo 6 caracteres"
                                required
                                style={{ ...inputStyle, paddingRight: '44px' }}
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(v => !v)}
                                style={{
                                    position: 'absolute', right: '12px', top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none', border: 'none',
                                    color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '16px',
                                }}
                                tabIndex={-1}
                            >
                                {showPassword ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label style={labelStyle}>Confirmar contraseña</label>
                        <input
                            id="activate-confirm-password"
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repite tu contraseña"
                            required
                            style={inputStyle}
                            autoComplete="new-password"
                        />
                    </div>

                    {/* Error message */}
                    {formStatus === 'error' && (
                        <div style={{
                            background: 'rgba(239,68,68,0.15)',
                            border: '1px solid rgba(239,68,68,0.35)',
                            borderRadius: '8px',
                            padding: '10px 14px',
                            fontSize: '13px',
                            color: '#fca5a5',
                        }}>
                            ⚠️ {errorMessage}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        id="activate-submit-btn"
                        type="submit"
                        disabled={formStatus === 'loading'}
                        style={{ ...btnPrimary, opacity: formStatus === 'loading' ? 0.6 : 1 }}
                        onMouseOver={(e) => { if (formStatus !== 'loading') e.currentTarget.style.opacity = '0.85' }}
                        onMouseOut={(e) => { e.currentTarget.style.opacity = formStatus === 'loading' ? '0.6' : '1' }}
                    >
                        {formStatus === 'loading' ? 'Activando…' : 'Activar mi cuenta →'}
                    </button>
                </form>

                {/* Footer note */}
                <p style={{
                    textAlign: 'center',
                    marginTop: '24px',
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.35)',
                    lineHeight: '1.5',
                }}>
                    Este enlace es de uso único y caduca en 48 horas.<br />
                    Si tienes problemas, contacta a tu doctora.
                </p>
            </div>
        </div>
    )
}
