import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../lib/axios'

/**
 * ActivateAccountPage
 * Ruta: /activar-cuenta?token=TOKEN
 *
 * Permite a la paciente elegir su contraseña y activar su cuenta Mi Ciclo.
 * - Detecta y aplica el tema (oscuro/claro) de la doctora dueña del token.
 * - Al activar, guarda el token JWT y redirige a /cycle/dashboard.
 */
export default function ActivateAccountPage() {
    const [searchParams] = useSearchParams()
    const token = searchParams.get('token')
    const navigate = useNavigate()
    const { loadUser } = useAuthStore()

    // Token info from backend
    const [tokenData, setTokenData] = useState(null)
    const [tokenStatus, setTokenStatus] = useState('loading') // loading | valid | invalid | expired | used

    // Form
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [formStatus, setFormStatus] = useState('idle') // idle | loading | success | error
    const [errorMessage, setErrorMessage] = useState('')

    // ─── Fetch token info & doctor theme ──────────────────────────────────────
    useEffect(() => {
        if (!token) { setTokenStatus('invalid'); return }

        const fetchInfo = async () => {
            try {
                const res = await api.get(`/auth/patient/activation-info?token=${token}`)
                setTokenData(res.data)
                setTokenStatus('valid')

                // Apply doctor theme immediately
                const isDark = res.data.design_template === 'dark'
                if (isDark) {
                    document.documentElement.classList.add('dark')
                    localStorage.setItem('theme_preference', 'dark')
                } else {
                    document.documentElement.classList.remove('dark')
                    localStorage.setItem('theme_preference', 'light')
                }
            } catch (err) {
                const detail = err.response?.data?.detail || ''
                if (detail.includes('expirad') || detail.includes('expired')) setTokenStatus('expired')
                else if (detail.includes('utilizado') || detail.includes('usado')) setTokenStatus('used')
                else setTokenStatus('invalid')
            }
        }
        fetchInfo()
    }, [token])

    // ─── Derived theme values ─────────────────────────────────────────────────
    const primaryColor = tokenData?.primary_color || '#7c3aed'
    const isDark = tokenData?.design_template === 'dark'

    // Background gradient based on doctor theme
    const bgStyle = isDark
        ? { background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }
        : { background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 60%, #e0e7ff 100%)' }

    const cardBg = isDark
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(255,255,255,0.82)'

    const cardBorder = isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(124,58,237,0.15)'
    const textMain = isDark ? '#fff' : '#1e1b4b'
    const textSub = isDark ? 'rgba(255,255,255,0.55)' : '#6d28d9'
    const textMuted = isDark ? 'rgba(255,255,255,0.38)' : '#a78bfa'

    const inputStyle = {
        width: '100%',
        padding: '12px 16px',
        background: isDark ? 'rgba(255,255,255,0.08)' : '#f5f3ff',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.16)' : '#c4b5fd'}`,
        borderRadius: '10px',
        color: isDark ? '#fff' : '#1e1b4b',
        fontSize: '15px',
        outline: 'none',
        boxSizing: 'border-box',
    }

    const labelStyle = {
        fontSize: '13px',
        fontWeight: '600',
        color: textSub,
        marginBottom: '6px',
        display: 'block',
        letterSpacing: '0.02em',
    }

    // ─── Icons ────────────────────────────────────────────────────────────────
    const CheckCircleIcon = ({ size = 56, color = '#7c3aed' }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    )

    const AlertCircleIcon = ({ size = 56, color = '#f59e0b' }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    )

    const ClockIcon = ({ size = 56, color = '#6b7280' }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    )

    // ─── Submit ───────────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault()
        setErrorMessage('')
        if (password !== confirmPassword) { setErrorMessage('Las contraseñas no coinciden'); return }
        if (password.length < 6) { setErrorMessage('Mínimo 6 caracteres'); return }

        setFormStatus('loading')
        try {
            const res = await api.post('/auth/patient/activate', { token, password })
            localStorage.setItem('cycle_access_token', res.data.access_token)

            // Apply doctor dark theme before redirect so CycleDashboard opens correctly
            if (isDark) {
                document.documentElement.classList.add('dark')
                localStorage.setItem('theme_preference', 'dark')
            }

            // Persist tenant theme context for CycleLayout
            if (tokenData?.primary_color) {
                localStorage.setItem('tenant_theme_primary', tokenData.primary_color)
            }
            if (tokenData?.doctor_slug) {
                localStorage.setItem('last_doctor_slug', tokenData.doctor_slug)
            }

            await loadUser()
            setFormStatus('success')
        } catch (err) {
            setFormStatus('error')
            setErrorMessage(err.response?.data?.detail || 'Error al activar la cuenta. Intente de nuevo.')
        }
    }

    // ─── Layout wrapper ───────────────────────────────────────────────────────
    const Page = ({ children }) => (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            fontFamily: "'Inter', system-ui, sans-serif",
            ...bgStyle,
        }}>
            <div style={{
                width: '100%',
                maxWidth: '440px',
                background: cardBg,
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: cardBorder,
                borderRadius: '24px',
                padding: '44px 40px',
                boxShadow: isDark
                    ? '0 30px 70px rgba(0,0,0,0.45)'
                    : '0 20px 60px rgba(124,58,237,0.12)',
            }}>
                {children}
            </div>
        </div>
    )

    // ─── Loading ──────────────────────────────────────────────────────────────
    if (tokenStatus === 'loading') {
        return (
            <Page>
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <div style={{
                        width: '44px', height: '44px',
                        border: `3px solid ${isDark ? 'rgba(255,255,255,0.15)' : '#e9d5ff'}`,
                        borderTop: `3px solid ${primaryColor}`,
                        borderRadius: '50%',
                        margin: '0 auto 20px',
                        animation: 'spin 0.8s linear infinite',
                    }} />
                    <p style={{ color: textSub, fontSize: '15px' }}>Verificando enlace…</p>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            </Page>
        )
    }

    // ─── Token errors ─────────────────────────────────────────────────────────
    if (tokenStatus !== 'valid') {
        const msgs = {
            expired: {
                icon: <ClockIcon color={primaryColor} />,
                title: 'Enlace expirado',
                body: 'Este enlace de activación ya no es válido (48 horas). Contacta a tu doctora para recibir uno nuevo.',
            },
            used: {
                icon: <CheckCircleIcon color={primaryColor} />,
                title: 'Cuenta ya activada',
                body: 'Este enlace ya fue utilizado. Si olvidaste tu contraseña, usa la opción de recuperación.',
                cta: { label: 'Ir a Mi Ciclo →', href: '/cycle/dashboard' },
            },
            invalid: {
                icon: <AlertCircleIcon color={primaryColor} />,
                title: 'Enlace inválido',
                body: 'El enlace no existe o está incompleto. Verifica que copiaste el enlace completo del correo.',
            },
        }
        const m = msgs[tokenStatus] || msgs.invalid
        return (
            <Page>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>{m.icon}</div>
                    <h2 style={{ fontSize: '20px', fontWeight: '700', color: textMain, marginBottom: '10px' }}>{m.title}</h2>
                    <p style={{ color: textSub, lineHeight: '1.6', marginBottom: '28px', fontSize: '14px' }}>{m.body}</p>
                    {m.cta && (
                        <a href={m.cta.href} style={{ color: primaryColor, fontWeight: '700', textDecoration: 'none', fontSize: '15px' }}>{m.cta.label}</a>
                    )}
                </div>
            </Page>
        )
    }

    // ─── Success: invitation page with Mi Ciclo features ─────────────────────
    if (formStatus === 'success') {
        return (
            <Page>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                        <CheckCircleIcon color={primaryColor} size={60} />
                    </div>
                    <h2 style={{ fontSize: '22px', fontWeight: '800', color: textMain, marginBottom: '6px' }}>
                        ¡Cuenta creada!
                    </h2>
                    <p style={{ color: textSub, fontSize: '14px', marginBottom: '28px' }}>
                        Ahora tienes acceso a tu historial médico y a todas las funciones de la plataforma.
                    </p>

                    {/* Features */}
                    {[
                        { emoji: '🏥', title: 'Historial médico', desc: 'Accede a tus consultas y resultados de forma segura.' },
                        { emoji: '📅', title: 'Gestión de citas', desc: 'Revisa tus citas confirmadas y próximas consultas.' },
                        { emoji: '🌸', title: 'Mi Ciclo (mismo acceso)', desc: 'Usa tus mismas credenciales para el seguimiento menstrual.' },
                        { emoji: '📲', title: 'Instala la app', desc: 'Disponible en tu móvil sin Play Store ni App Store.' },
                    ].map((f, i) => (
                        <div key={i} style={{
                            display: 'flex', alignItems: 'flex-start', gap: '12px',
                            textAlign: 'left', marginBottom: '14px',
                            padding: '14px', borderRadius: '12px',
                            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(124,58,237,0.06)',
                        }}>
                            <span style={{ fontSize: '22px', lineHeight: 1 }}>{f.emoji}</span>
                            <div>
                                <p style={{ fontWeight: '700', color: textMain, fontSize: '14px', margin: '0 0 2px' }}>{f.title}</p>
                                <p style={{ color: textSub, fontSize: '13px', margin: 0 }}>{f.desc}</p>
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={() => navigate('/cycle/dashboard')}
                        style={{
                            width: '100%', marginTop: '8px', padding: '13px',
                            background: `linear-gradient(135deg, ${primaryColor}, #4f46e5)`,
                            border: 'none', borderRadius: '12px', color: '#fff',
                            fontSize: '15px', fontWeight: '700', cursor: 'pointer',
                        }}
                    >
                        Explorar Mi Ciclo →
                    </button>
                </div>
            </Page>
        )
    }

    // ─── Main activation form ─────────────────────────────────────────────────
    return (
        <Page>
            {/* Brand */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{
                    width: '52px', height: '52px',
                    background: `linear-gradient(135deg, ${primaryColor}, #4f46e5)`,
                    borderRadius: '14px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '24px', margin: '0 auto 14px',
                    boxShadow: `0 8px 24px ${primaryColor}55`,
                }}>
                    🌸
                </div>
                <h1 style={{ fontSize: '20px', fontWeight: '800', color: textMain, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
                    Crea tu cuenta en la plataforma
                </h1>
                {tokenData?.doctor_name && (
                    <p style={{ fontSize: '13px', color: textSub, margin: 0 }}>
                        Consultorio · {tokenData.doctor_name}
                    </p>
                )}
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {/* Email read-only */}
                <div>
                    <label style={labelStyle}>Correo electrónico</label>
                    <input
                        id="activate-email"
                        type="email"
                        value={tokenData?.email || ''}
                        readOnly
                        style={{ ...inputStyle, opacity: 0.55, cursor: 'not-allowed' }}
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
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                            required
                            autoComplete="new-password"
                            style={{ ...inputStyle, paddingRight: '44px' }}
                        />
                        <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => setShowPassword(v => !v)}
                            style={{
                                position: 'absolute', right: '12px', top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none', border: 'none',
                                color: textMuted, cursor: 'pointer', fontSize: '17px', padding: 0,
                            }}
                        >
                            {showPassword ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                    <line x1="1" y1="1" x2="23" y2="23" />
                                </svg>
                            ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                            )}
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
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Repite tu contraseña"
                        required
                        autoComplete="new-password"
                        style={inputStyle}
                    />
                </div>

                {/* Strength indicator */}
                {password && (
                    <div style={{ display: 'flex', gap: '4px', height: '3px' }}>
                        {[1, 2, 3, 4].map(n => (
                            <div key={n} style={{
                                flex: 1, borderRadius: '2px',
                                background: password.length >= n * 3
                                    ? (password.length >= 10 ? '#10b981' : primaryColor)
                                    : (isDark ? 'rgba(255,255,255,0.12)' : '#e9d5ff'),
                                transition: 'background 0.3s',
                            }} />
                        ))}
                    </div>
                )}

                {/* Error */}
                {formStatus === 'error' && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: '8px', padding: '10px 14px', fontSize: '13px',
                        color: isDark ? '#fca5a5' : '#dc2626',
                    }}>
                        <AlertCircleIcon size={16} color={isDark ? '#fca5a5' : '#dc2626'} />
                        {errorMessage}
                    </div>
                )}

                {/* Submit */}
                <button
                    id="activate-submit-btn"
                    type="submit"
                    disabled={formStatus === 'loading'}
                    style={{
                        padding: '13px',
                        background: formStatus === 'loading'
                            ? (isDark ? 'rgba(255,255,255,0.15)' : '#c4b5fd')
                            : `linear-gradient(135deg, ${primaryColor}, #4f46e5)`,
                        border: 'none', borderRadius: '12px', color: '#fff',
                        fontSize: '15px', fontWeight: '700', cursor: formStatus === 'loading' ? 'not-allowed' : 'pointer',
                        transition: 'opacity 0.2s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        width: '100%',
                    }}
                >
                    {formStatus === 'loading' ? (
                        <>
                            <div style={{
                                width: '16px', height: '16px',
                                border: '2px solid rgba(255,255,255,0.35)',
                                borderTop: '2px solid #fff', borderRadius: '50%',
                                animation: 'spin 0.7s linear infinite',
                            }} />
                            Activando…
                        </>
                    ) : 'Activar mi cuenta →'}
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </button>
            </form>

            {/* Footer */}
            <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: textMuted, lineHeight: '1.5' }}>
                Enlace de uso único · válido 48 horas<br />
                Problemas: contacta a tu doctora
            </p>
        </Page>
    )
}
