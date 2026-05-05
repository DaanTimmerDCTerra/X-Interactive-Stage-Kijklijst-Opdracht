import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { API, getImageUrl } from '../lib/constants'

export default function DiscoveryPage({ token }) {
    const [titles, setTitles] = useState([])
    const [addingId, setAddingId] = useState(null)
    const [error, setError] = useState(null)
    const navigate = useNavigate()

    const fetchTitles = useCallback(() => {
        fetch(`${API}/titles/discovery`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(setTitles)
    }, [token])

    useEffect(() => {
        fetchTitles()
    }, [fetchTitles])

    const addToCollection = async (title) => {
        setError(null)
        setAddingId(title.id)

        try {
            const res = await fetch(`${API}/titles`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: title.name,
                    type: title.type,
                    year: title.year,
                    watched: false,
                    genres: title.genres.map(g => g.id),
                })
            })

            if (!res.ok) {
                const data = await res.json().catch(() => null)
                setError(data?.error || 'Toevoegen mislukt')
                return
            }

            setTitles(titles => titles.filter(t => t.id !== title.id))
        } catch {
            setError('Kon de titel niet toevoegen')
        } finally {
            setAddingId(null)
        }
    }

    const unwatched = titles.filter(t => !t.watched && t.ownedByCurrentUser)
    const topRated = [...titles]
        .filter(t => t.averageRating !== null && t.averageRating !== undefined)
        .sort((a, b) => (b.averageRating - a.averageRating) || ((b.commentCount ?? 0) - (a.commentCount ?? 0)))
        .slice(0, 5)

    
    const Card = ({ title }) => (
        <div
            onClick={() => navigate(`/titel/${title.id}`)}
            className="card"
        >
                {title.thumbnail && (
                    <div className="mb-3 overflow-hidden ui-rounded bg-zinc-800 aspect-video">
                    <img
                        src={getImageUrl(title.thumbnail)}
                        alt={title.name}
                        className="h-full w-full object-cover"
                    />
                </div>
            )}
            <p className="card-title">{title.name}</p>
            <p className="card-meta">{title.type} {title.year ? `· ${title.year}` : ''}</p>
            <p className="card-owner">Geupload door {title.owner || 'onbekend'}</p>
            {title.averageRating !== null && title.averageRating !== undefined && (
                <div className="rating">
                    {[1, 2, 3, 4, 5].map(s => (
                        <span key={s} className={`rating-star ${s <= title.averageRating ? 'active' : 'inactive'}`}>★</span>
                    ))}
                    <span className="text-xs text-zinc-500 ml-2">({title.commentCount ?? title.ratingCount})</span>
                </div>
            )}
            {title.ownedByCurrentUser || title.alreadyAdded ? (
                <div className="collection-note">
                    Staat al in jouw collectie
                </div>
            ) : (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation()
                        addToCollection(title)
                    }}
                    disabled={addingId === title.id}
                    className={`btn btn-primary ${addingId === title.id ? 'btn-disabled' : ''}`}
                >
                    {addingId === title.id ? 'Bezig...' : 'Toevoegen aan mijn collectie'}
                </button>
            )}
        </div>
    )

    return (
        <div className="w-full">
            <h1 className="text-3xl font-black tracking-tight mb-4">Ontdekken</h1>
            <p className="text-zinc-400 text-sm mb-8 max-w-3xl">
                Dit zijn openbare titels van andere gebruikers. Voeg iets toe aan je eigen lijst en laat daar je reactie en beoordeling achter.
            </p>
            {error && <p className="text-red-400 text-sm mb-6">{error}</p>}

            {unwatched.length > 0 && (
                <section className="mb-10">
                    <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest mb-4">
                        Jouw nog te kijken ({unwatched.length})
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                        {unwatched.map(t => <Card key={t.id} title={t} />)}
                    </div>
                </section>
            )}

            <section className="mb-10">
                <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest mb-4">
                    Best beoordeeld
                </h2>
                {topRated.length === 0 ? (
                    <p className="text-zinc-600 text-sm">Nog geen beoordelingen.</p>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                        {topRated.map(t => <Card key={t.id} title={t} />)}
                    </div>
                )}
            </section>
        </div>
    )
}