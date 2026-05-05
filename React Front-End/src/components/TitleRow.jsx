import { useState } from 'react'

export default function TitleRow({ title, onDelete, onToggleWatched, onUpdate }) {
    const [editing, setEditing] = useState(false)
    const [form, setForm] = useState({
        name: title.name,
        type: title.type,
        year: title.year ?? '',
        rating: title.rating ?? null
    })

    const handleSave = () => {
        if (!form.name.trim()) return
        onUpdate(title.id, {
            ...form,
            year: form.year ? parseInt(form.year) : null
        })
        setEditing(false)
    }

    if (editing) {
        return (
            <tr className="table-row-edit">
                <td className="px-5 py-3">
                    <input
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        className="field-input-compact"
                    />
                </td>
                <td className="px-5 py-3">
                    <select
                        value={form.type}
                        onChange={e => setForm({ ...form, type: e.target.value })}
                        className="field-input-compact"
                    >
                        <option value="film">Film</option>
                        <option value="serie">Serie</option>
                    </select>
                </td>
                <td className="px-5 py-3">
                    <input
                        type="number"
                        value={form.year}
                        onChange={e => setForm({ ...form, year: e.target.value })}
                        className="field-input-compact w-24"
                    />
                </td>
                <td className="px-5 py-3">
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                            <button
                                key={star}
                                onClick={() => setForm({ ...form, rating: form.rating === star ? null : star })}
                                className={`rating-toggle ${star <= (form.rating ?? 0) ? 'active' : 'inactive'}`}
                            >
                                ★
                            </button>
                        ))}
                    </div>
                </td>
                <td className="px-5 py-3 text-right">
                    <button
                        onClick={handleSave}
                        className="text-xs font-medium text-green-400 hover:text-green-300 transition mr-3"
                    >
                        Opslaan
                    </button>
                    <button
                        onClick={() => setEditing(false)}
                        className="text-xs font-medium text-zinc-500 hover:text-white transition"
                    >
                        Annuleren
                    </button>
                </td>
            </tr>
        )
    }

    return (
        <tr className="table-row group">
            <td className="px-5 py-4 text-sm font-semibold">{title.name}</td>
            <td className="px-5 py-4">
                <span className="text-xs font-medium text-zinc-400 capitalize">{title.type}</span>
            </td>
            <td className="px-5 py-4 text-sm text-zinc-500">{title.year ?? '—'}</td>
            <td className="px-5 py-4">
                <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                        <span
                            key={star}
                            className={`rating-star ${star <= (title.rating ?? 0) ? 'active' : 'inactive'}`}
                        >
                            ★
                        </span>
                    ))}
                </div>
            </td>
            <td className="px-5 py-4">
                <button onClick={() => onToggleWatched(title)} className="text-base">
                    {title.watched ? '✅' : '⬜'}
                </button>
            </td>
            <td className="table-actions">
                <button
                    onClick={() => setEditing(true)}
                    className="text-xs font-medium text-zinc-400 hover:text-white transition"
                >
                    Bewerken
                </button>
                <button
                    onClick={() => onDelete(title.id)}
                    className="text-xs font-medium text-zinc-600 hover:text-red-400 transition"
                >
                    Verwijderen
                </button>
            </td>
        </tr>
    )
}