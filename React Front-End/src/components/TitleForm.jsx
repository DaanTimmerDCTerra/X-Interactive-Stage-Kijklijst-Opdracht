import { useState } from 'react'

export default function TitleForm({ onAdd }) {
    const [form, setForm] = useState({
        name: '',
        type: 'film',
        year: '',
        watched: false,
        rating: null
    })
    const [error, setError] = useState(null)

    const handleSubmit = (e) => {
        e.preventDefault()
        setError(null)

        if (!form.name.trim()) {
            setError('Naam is verplicht')
            return
        }

        if (form.year && isNaN(form.year)) {
            setError('Jaartal moet een getal zijn')
            return
        }

        if (form.year && (form.year < 1888 || form.year > new Date().getFullYear())) {
            setError('Voer een geldig jaartal in')
            return
        }

        onAdd({
            ...form,
            year: form.year ? parseInt(form.year) : null
        })

        setForm({ name: '', type: 'film', year: '', watched: false, rating: null })
    }

    return (
        <div className="mb-6">
            <form onSubmit={handleSubmit} className="form-stack">
                <div className="form-row">
                    <input
                        type="text"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        placeholder="Naam van film of serie"
                        className="field-input flex-1"
                    />
                    <select
                        value={form.type}
                        onChange={e => setForm({ ...form, type: e.target.value })}
                        className="field-input"
                    >
                        <option value="film">Film</option>
                        <option value="serie">Serie</option>
                    </select>
                    <input
                        type="number"
                        value={form.year}
                        onChange={e => setForm({ ...form, year: e.target.value })}
                        placeholder="Jaar"
                        className="field-input w-28"
                    />
                    <button
                        type="submit"
                        className="field-button"
                    >
                        Toevoegen
                    </button>
                </div>
                <div className="form-row form-row-end">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={form.watched}
                            onChange={e => setForm({ ...form, watched: e.target.checked })}
                            className="checkbox-input"
                        />
                        Al gezien
                    </label>
                    <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setForm({ ...form, rating: form.rating === star ? null : star })}
                                className={`rating-toggle ${star <= (form.rating ?? 0) ? 'active' : 'inactive'}`}
                            >
                                ★
                            </button>
                        ))}
                        {form.rating && (
                            <span className="text-zinc-500 text-xs ml-1">{form.rating}/5</span>
                        )}
                    </div>
                    {error && <p className="text-red-400 text-sm ml-auto">{error}</p>}
                </div>
            </form>
        </div>
    )
}