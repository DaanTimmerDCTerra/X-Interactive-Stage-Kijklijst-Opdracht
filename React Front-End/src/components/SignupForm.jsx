import { useState } from 'react'
import { requestApi } from '../lib/api'

export default function SignupForm({ onGoToLogin, onSignup }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState(null)

    const handleSubmit = async (event) => {
        event.preventDefault()
        setError(null)

        if (password.length < 8) {
            setError('Wachtwoord moet minimaal 8 tekens zijn')
            return
        }

        try {
            const data = await requestApi('/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            })

            onSignup?.(data.token, data.user?.email ?? email, data.user?.profilePicture ?? null)
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Kan geen verbinding maken met de server')
        }
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
                            onChange={(event) => setEmail(event.target.value)}
                            required
                            className="field-input"
                        />
                    </div>
                    <div>
                        <label className="auth-section-label">Wachtwoord</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            required
                            className="field-input"
                        />
                    </div>
                    {error && <p className="field-error">{error}</p>}
                    <button type="submit" className="field-button">
                        Registreren
                    </button>
                </form>
                <p className="auth-note">
                    Al een account?{' '}
                    <button onClick={onGoToLogin} className="field-link">
                        Inloggen
                    </button>
                </p>
            </div>
        </div>
    )
}
