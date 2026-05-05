import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API } from '../lib/constants'

export default function AddPage({ token }) {
    const [genres, setGenres] = useState([])
    const [newGenre, setNewGenre] = useState('')
    const [form, setForm] = useState({
        name: '',
        type: 'film',
        year: '',
        watched: false,
        public: false,
        genres: [],
        thumbnail: null,
    })
    const [error, setError] = useState(null)
    const [genreError, setGenreError] = useState(null)
    const [saving, setSaving] = useState(false)
    const [savingGenre, setSavingGenre] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        fetch(`${API}/genres`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(setGenres)
    }, [token])

    const currentYear = new Date().getFullYear()
    const years = Array.from({ length: currentYear - 1887 }, (_, i) => currentYear - i)

    const toggleGenre = (id) => {
        setForm(f => ({
            ...f,
            genres: f.genres.includes(id)
                ? f.genres.filter(g => g !== id)
                : [...f.genres, id]
        }))
    }

    const createGenre = async () => {
        const name = newGenre.trim()
        if (!name || savingGenre) return

        setGenreError(null)
        setSavingGenre(true)

        try {
            const res = await fetch(`${API}/genres`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ name })
            })

            const data = await res.json().catch(() => null)

            if (!res.ok && res.status !== 409) {
                setGenreError(data?.error || 'Genre toevoegen mislukt')
                return
            }

            const genre = data?.id ? data : null
            if (genre) {
                setGenres((currentGenres) => [...currentGenres, genre])
                setForm((currentForm) => ({
                    ...currentForm,
                    genres: currentForm.genres.includes(genre.id)
                        ? currentForm.genres
                        : [...currentForm.genres, genre.id]
                }))
            } else if (data?.id === undefined && res.status === 409 && data?.id) {
                setGenres((currentGenres) => [...currentGenres.filter((entry) => entry.id !== data.id), { id: data.id, name: data.name }])
            }

            setNewGenre('')
        } finally {
            setSavingGenre(false)
        }
    }

    const formatServerError = (raw, status) => {
        if (!raw) return `Serverfout (${status}).`

        const trimmed = raw.trim()

        if (trimmed.startsWith('<')) {
            const titleMatch = trimmed.match(/<title>(.*?)<\/title>/is)
            if (titleMatch?.[1]) {
                const title = titleMatch[1].replace(/\s+/g, ' ').trim()
                return title.length > 220 ? `${title.slice(0, 220)}...` : title
            }

            const textOnly = trimmed
                .replace(/<script[\s\S]*?<\/script>/gi, '')
                .replace(/<style[\s\S]*?<\/style>/gi, '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()

            if (textOnly) {
                return textOnly.length > 220 ? `${textOnly.slice(0, 220)}...` : textOnly
            }

            return `Serverfout (${status}) met HTML-response.`
        }

        return trimmed.length > 220 ? `${trimmed.slice(0, 220)}...` : trimmed
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (saving) return

        setError(null)

        if (!form.name.trim()) {
            setError('Naam is verplicht')
            return
        }

        setSaving(true)

        try {
            let res
            if (form.thumbnail) {
                const fd = new FormData()
                fd.append('name', form.name)
                fd.append('type', form.type)
                fd.append('year', form.year ? String(form.year) : '')
                fd.append('watched', form.watched ? '1' : '0')
                fd.append('public', form.public ? '1' : '0')
                for (const g of form.genres) fd.append('genres[]', g)
                if (form.thumbnail) fd.append('thumbnail', form.thumbnail)

                res = await fetch(`${API}/titles`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    body: fd
                })
            } else {
                res = await fetch(`${API}/titles`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        ...form,
                        year: form.year ? parseInt(form.year) : null
                    })
                })
            }

            if (!res.ok) {
                let message = 'Er ging iets mis bij toevoegen'
                try {
                    const raw = await res.text()
                    if (raw) {
                        try {
                            const data = JSON.parse(raw)
                            const serverMessage = data.error || data.message
                            message = serverMessage
                                ? (serverMessage.length > 220 ? `${serverMessage.slice(0, 220)}...` : serverMessage)
                                : formatServerError(raw, res.status)
                        } catch {
                            message = formatServerError(raw, res.status)
                        }
                    }
                } catch {
                }
                setError(message)
                return
            }

            navigate('/')
        } catch (err) {
            const reason = err instanceof Error ? err.message : 'Onbekende netwerkfout'
            setError(`Kon geen verbinding maken met ${API}. Controleer of de backend draait en bereikbaar is. Technische fout: ${reason}`)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="max-w-xl">
            <h1 className="page-title">Titel toevoegen</h1>
            <p className="page-copy">
                Voeg een titel toe aan je eigen lijst. Alleen de thumbnail is nodig; die wordt als brede afbeelding getoond.
            </p>
            <form onSubmit={handleSubmit} className="form-stack w-full max-w-4xl" encType="multipart/form-data">
                <div>
                    <label className="auth-section-label">Naam</label>
                    <input
                        type="text"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        placeholder="bijv. Inception"
                        className="field-input"
                    />
                </div>
                <div className="form-row">
                    <div className="flex-1">
                        <label className="auth-section-label">Type</label>
                        <select
                            value={form.type}
                            onChange={e => setForm({ ...form, type: e.target.value })}
                            className="field-input"
                        >
                            <option value="film">Film</option>
                            <option value="serie">Serie</option>
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="auth-section-label">Jaartal</label>
                        <select
                            value={form.year}
                            onChange={e => setForm({ ...form, year: e.target.value })}
                            className="field-input"
                        >
                            <option value="">Onbekend</option>
                            {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div>
                    <label className="auth-section-label">Thumbnail (1920x1080)</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={e => setForm({ ...form, thumbnail: e.target.files?.[0] ?? null })}
                        className="file-input"
                    />
                </div>
                <div>
                    <label className="auth-section-label">Genres</label>
                    <div className="flex flex-wrap gap-2">
                        {genres.map(g => (
                            <button
                                key={g.id}
                                type="button"
                                onClick={() => toggleGenre(g.id)}
                                className={`chip-toggle ${form.genres.includes(g.id) ? 'active' : 'inactive'}`}
                            >
                                {g.name}
                            </button>
                        ))}
                        {genres.length === 0 && (
                            <p className="empty-state">Nog geen genres.</p>
                        )}
                    </div>
                    <div className="mt-4 form-row">
                        <input
                            type="text"
                            value={newGenre}
                            onChange={(e) => setNewGenre(e.target.value)}
                            placeholder="Nieuw genre"
                            className="field-input flex-1"
                        />
                        <button
                            type="button"
                            onClick={createGenre}
                            disabled={savingGenre}
                            className="secondary-button"
                        >
                            {savingGenre ? 'Opslaan...' : 'Genre toevoegen'}
                        </button>
                    </div>
                    {genreError && <p className="field-error mt-2">{genreError}</p>}
                </div>
                <div>
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={form.watched}
                            onChange={e => setForm({ ...form, watched: e.target.checked })}
                            className="checkbox-input"
                        />
                        Al gezien
                    </label>
                </div>
                <div>
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={form.public}
                            onChange={e => setForm({ ...form, public: e.target.checked })}
                            className="checkbox-input"
                        />
                        Op Discovery plaatsen
                    </label>
                </div>
                {error && <p className="field-error">{error}</p>}
                <div className="form-row">
                    <button
                        type="submit"
                        disabled={saving}
                        className="field-button disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {saving ? 'Bezig...' : 'Toevoegen'}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="field-link"
                    >
                        Annuleren
                    </button>
                </div>
            </form>
        </div>
    )
}