import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getImageUrl } from '../lib/constants'
import { requestAuthApi } from '../lib/api'

const defaultType = 'film'
const minTitleYear = 1888
const labels = {
    currentThumbnail: 'Huidige afbeelding',
    emptyThumbnail: 'Geen afbeelding gekozen',
}

function createInitialForm() {
    return {
        name: '',
        type: defaultType,
        year: '',
        watched: false,
        genres: [],
        thumbnail: null,
        removeThumbnail: false,
    }
}

function createTitlePayload(form) {
    return {
        ...form,
        year: form.year ? Number.parseInt(form.year, 10) : null,
        thumbnail: undefined,
        removeThumbnail: form.removeThumbnail,
    }
}

function createTitleFormData(form) {
    const data = new FormData()

    data.append('name', form.name)
    data.append('type', form.type)
    data.append('year', form.year ? String(form.year) : '')
    data.append('watched', form.watched ? '1' : '0')
    data.append('removeThumbnail', form.removeThumbnail ? '1' : '0')

    form.genres.forEach((genreId) => data.append('genres[]', genreId))

    if (form.thumbnail) data.append('thumbnail', form.thumbnail)

    return data
}

export default function TitleEditorForm({ token, titleId = null }) {
    const isEdit = titleId !== null
    const navigate = useNavigate()
    const previewUrlRef = useRef(null)
    const [genres, setGenres] = useState([])
    const [newGenre, setNewGenre] = useState('')
    const [thumbnailPreview, setThumbnailPreview] = useState(null)
    const [existingThumbnailUrl, setExistingThumbnailUrl] = useState(null)
    const [form, setForm] = useState(createInitialForm)
    const [error, setError] = useState(null)
    const [genreError, setGenreError] = useState(null)
    const [saving, setSaving] = useState(false)
    const [savingGenre, setSavingGenre] = useState(false)

    const currentYear = new Date().getFullYear()
    const years = useMemo(
        () => Array.from({ length: currentYear - minTitleYear + 1 }, (_, index) => currentYear - index),
        [currentYear]
    )

    const selectedThumbnailName = form.thumbnail?.name
        ?? (existingThumbnailUrl ? labels.currentThumbnail : labels.emptyThumbnail)

    const hasThumbnail = Boolean(thumbnailPreview || existingThumbnailUrl || form.thumbnail)

    useEffect(() => {
        requestAuthApi(token, '/genres')
            .then((data) => setGenres(data ?? []))
            .catch(() => setGenres([]))
    }, [token])

    useEffect(() => {
        if (!isEdit) return

        requestAuthApi(token, `/titles/${titleId}`)
            .then((title) => {
                if (!title) return

                setForm({
                    name: title.name || '',
                    type: title.type || defaultType,
                    year: title.year ?? '',
                    watched: Boolean(title.watched),
                    genres: (title.genres || []).map((genre) => (typeof genre === 'object' ? genre.id : genre)),
                    thumbnail: null,
                    removeThumbnail: false,
                })
                setExistingThumbnailUrl(title.thumbnail ? getImageUrl(title.thumbnail) : null)
            })
            .catch(() => navigate('/'))
    }, [isEdit, navigate, titleId, token])

    useEffect(() => () => {
        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    }, [])

    const patchForm = (patch) => setForm((currentForm) => ({ ...currentForm, ...patch }))

    const toggleGenre = (id) => {
        setForm((currentForm) => ({
            ...currentForm,
            genres: currentForm.genres.includes(id)
                ? currentForm.genres.filter((genreId) => genreId !== id)
                : [...currentForm.genres, id],
        }))
    }

    const validateForm = () => {
        if (!form.name.trim()) {
            return 'Naam is verplicht'
        }

        if (!form.year) {
            return 'Jaartal is verplicht'
        }

        if (form.genres.length === 0) {
            return 'Kies minimaal één genre'
        }

        return null
    }

    const createGenre = async () => {
        const name = newGenre.trim()
        if (!name || savingGenre) return

        setGenreError(null)
        setSavingGenre(true)

        try {
            const genre = await requestAuthApi(token, '/genres', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            })

            if (genre?.id) {
                setGenres((currentGenres) => [...currentGenres.filter((entry) => entry.id !== genre.id), genre])
                setForm((currentForm) => ({
                    ...currentForm,
                    genres: currentForm.genres.includes(genre.id)
                        ? currentForm.genres
                        : [...currentForm.genres, genre.id],
                }))
            }

            setNewGenre('')
        } catch (err) {
            setGenreError(err instanceof Error ? err.message : 'Genre opslaan mislukt')
        } finally {
            setSavingGenre(false)
        }
    }

    const saveTitle = () => {
        const path = isEdit ? `/titles/${titleId}` : '/titles'
        const method = isEdit ? 'PATCH' : 'POST'

        if (form.thumbnail) {
            return requestAuthApi(token, path, {
                method,
                body: createTitleFormData(form),
            })
        }

        return requestAuthApi(token, path, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(createTitlePayload(form)),
        })
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        if (saving) return

        setError(null)

        const validationError = validateForm()
        if (validationError) {
            setError(validationError)
            return
        }

        setSaving(true)

        try {
            const title = await saveTitle()
            navigate(isEdit ? `/titel/${titleId}` : `/titel/${title.id}`)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Opslaan mislukt')
        } finally {
            setSaving(false)
        }
    }

    const handleThumbnailChange = (event) => {
        const thumbnail = event.target.files?.[0] ?? null

        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)

        previewUrlRef.current = thumbnail ? URL.createObjectURL(thumbnail) : null
        setThumbnailPreview(previewUrlRef.current)

        patchForm({
            thumbnail,
            removeThumbnail: false,
        })
    }

    const clearThumbnail = () => {
        if (previewUrlRef.current) {
            URL.revokeObjectURL(previewUrlRef.current)
            previewUrlRef.current = null
        }

        setThumbnailPreview(null)
        setExistingThumbnailUrl(null)

        patchForm({
            thumbnail: null,
            removeThumbnail: true,
        })

        const input = document.getElementById('thumbnail')
        if (input) input.value = ''
    }

    return (
        <div className="container-max-xl">
            <h1 className="page-title">{isEdit ? 'Film of serie bewerken' : 'Film of serie toevoegen'}</h1>
            <p className="page-copy">
                {isEdit
                    ? 'Pas de titel aan en sla je wijzigingen op.'
                    : 'Voeg een film of serie toe aan je lijst.'}
            </p>

            <form onSubmit={handleSubmit} className="form-stack form-container" encType="multipart/form-data">
                <div>
                    <label className="auth-section-label">Naam van de film of serie</label>
                    <input
                        type="text"
                        value={form.name}
                        onChange={(event) => patchForm({ name: event.target.value })}
                        placeholder="Bijvoorbeeld Home Alone"
                        className="field-input"
                        required
                    />
                </div>

                <div className="form-row">
                    <div className="flex-1">
                        <label className="auth-section-label">Type</label>
                        <select
                            value={form.type}
                            onChange={(event) => patchForm({ type: event.target.value })}
                            className="field-input"
                        >
                            <option value={defaultType}>Film</option>
                            <option value="serie">Serie</option>
                        </select>
                    </div>

                    <div className="flex-1">
                        <label className="auth-section-label">Jaar</label>
                        <select
                            value={form.year}
                            onChange={(event) => patchForm({ year: event.target.value })}
                            className="field-input"
                            required
                        >
                            <option value="">Kies een jaar</option>
                            {years.map((year) => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="auth-section-label">Afbeelding</label>

                    <span className="muted-small image-name">{selectedThumbnailName}</span>

                    {(thumbnailPreview || existingThumbnailUrl) && (
                        <div className="thumbnail-preview">
                            <img
                                src={thumbnailPreview || existingThumbnailUrl}
                                alt="Voorbeeld van de gekozen afbeelding"
                                className="thumbnail-img"
                            />
                        </div>
                    )}

                    <div className="image-actions-row">
                        {!hasThumbnail && (
                            <label htmlFor="thumbnail" className="field-button image-action-button">
                                Kies afbeelding
                            </label>
                        )}

                        {hasThumbnail && (
                            <button
                                type="button"
                                onClick={clearThumbnail}
                                className="field-button image-action-button"
                            >
                                Afbeelding verwijderen
                            </button>
                        )}
                    </div>

                    <input
                        id="thumbnail"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleThumbnailChange}
                        className="hidden"
                    />
                </div>

                <div>
                    <label className="auth-section-label">Genres</label>

                    <div className="tags-row">
                        {genres.map((genre) => (
                            <button
                                key={genre.id}
                                type="button"
                                onClick={() => toggleGenre(genre.id)}
                                className={`chip-toggle ${form.genres.includes(genre.id) ? 'active' : 'inactive'}`}
                            >
                                {genre.name}
                            </button>
                        ))}

                        {genres.length === 0 && <p className="empty-state">Nog geen genres.</p>}
                    </div>

                    {form.genres.length === 0 && (
                        <p className="field-error small-margin-top">Kies minimaal één genre</p>
                    )}

                    <div className="form-row form-row-spaced">
                        <input
                            type="text"
                            value={newGenre}
                            onChange={(event) => setNewGenre(event.target.value)}
                            placeholder="Nieuw genre"
                            className="field-input flex-1"
                        />
                        <button
                            type="button"
                            onClick={createGenre}
                            disabled={savingGenre}
                            className="secondary-button"
                        >
                            {savingGenre ? 'Bezig...' : 'Genre aanmaken'}
                        </button>
                    </div>

                    {genreError && <p className="field-error small-margin-top">{genreError}</p>}
                </div>

                <label className="checkbox-label">
                    <input
                        type="checkbox"
                        checked={form.watched}
                        onChange={(event) => patchForm({ watched: event.target.checked })}
                        className="checkbox-input"
                    />
                    Al gezien
                </label>

                {error && <p className="field-error">{error}</p>}

                <div className="form-row">
                    <button type="submit" disabled={saving} className="field-button">
                        {saving ? 'Bezig...' : 'Opslaan'}
                    </button>
                    <button type="button" onClick={() => navigate(isEdit ? -1 : '/')} className="field-link">
                        Terug
                    </button>
                </div>
            </form>
        </div>
    )
}
