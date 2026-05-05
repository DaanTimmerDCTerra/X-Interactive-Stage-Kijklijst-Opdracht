import { useState } from 'react'

export default function LoginForm({ apiUrl, onLogin, onGoToSignup }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState(null)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)

        try {
            const res = await fetch(`${apiUrl}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            })

            const data = await res.json().catch(() => null)

            if (!res.ok) {
                setError(data?.error || 'Inloggen mislukt')
                return
            }

            onLogin(data.token, email)
        } catch {
            setError('Kan geen verbinding maken met de server')
        }
    }

    return (
        <div className="auth-screen">
            <div className="auth-card">
                <h1 className="auth-title">Welkom terug</h1>
                <p className="auth-subtitle">Log in om je kijklijst te bekijken.</p>
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
                        Inloggen
                    </button>
                </form>
                <p className="text-zinc-600 text-sm mt-4 text-center">
                    Nog geen account?{' '}
                    <button
                        onClick={onGoToSignup}
                        className="field-link"
                    >
                        Registreren
                    </button>
                </p>
            </div>
        </div>
    )
}