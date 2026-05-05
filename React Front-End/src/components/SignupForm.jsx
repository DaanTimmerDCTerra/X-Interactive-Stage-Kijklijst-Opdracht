import { useState } from 'react'

export default function SignupForm({ apiUrl, onGoToLogin, onSignup }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)

        if (password.length < 6) {
            setError('Wachtwoord moet minimaal 6 tekens zijn')
            return
        }

        try {
            const res = await fetch(`${apiUrl}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            })

            const data = await res.json().catch(() => null)

            if (!res.ok) {
                setError(data?.error || 'Registreren mislukt')
                return
            }

            if (data?.token) {
                onSignup?.(data.token, email)
                return
            }

            setSuccess(true)
        } catch {
            setError('Kan geen verbinding maken met de server')
        }
    }

    if (success) {
        return (
            <div className="auth-screen">
                <div className="auth-card auth-card-center">
                    <p className="auth-success-icon">✅</p>
                    <h2 className="auth-title text-xl mb-2">Account aangemaakt</h2>
                    <p className="auth-subtitle mb-6">Je bent direct ingelogd en kunt meteen verder.</p>
                    <button
                        onClick={onGoToLogin}
                        className="field-button"
                    >
                        Naar inloggen
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="auth-screen">
            <div className="auth-card">
                <h1 className="auth-title">Account aanmaken</h1>
                <p className="auth-subtitle">Maak een account aan om te beginnen.</p>
                <form onSubmit={handleSubmit} className="form-stack">
                    <div>
                        <label className="auth-section-label">E-mailadres</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            className="field-input"
                        />
                    </div>
                    <div>
                        <label className="auth-section-label">Wachtwoord</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            className="field-input"
                        />
                    </div>
                    {error && <p className="field-error">{error}</p>}
                    <button
                        type="submit"
                        className="field-button"
                    >
                        Registreren
                    </button>
                </form>
                <p className="text-zinc-600 text-sm mt-4 text-center">
                    Al een account?{' '}
                    <button
                        onClick={onGoToLogin}
                        className="field-link"
                    >
                        Inloggen
                    </button>
                </p>
            </div>
        </div>
    )
}