import { useState } from 'react'
import { requestApi } from '../lib/api'

export default function LoginForm({ onLogin, onGoToSignup }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState(null)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)

        try {
            const data = await requestApi('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            })

            onLogin(data.token, data.user?.email ?? email, data.user?.profilePicture ?? null)
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Kan geen verbinding maken met de server')
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
                <p className="auth-note">
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
