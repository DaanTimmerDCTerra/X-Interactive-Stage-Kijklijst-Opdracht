import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { API, getImageUrl } from '../lib/constants'
import { assetBase } from '../lib/constants'
import VectorIcon from '../components/VectorIcon'

export default function DetailPage({ token }) {
    const { id } = useParams()
    const navigate = useNavigate()
    const [title, setTitle] = useState(null)
    const [comments, setComments] = useState([])
    const [newComment, setNewComment] = useState('')
    const [newRating, setNewRating] = useState(null)

    const fetchTitle = useCallback(() =>
        fetch(`${API}/titles/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(setTitle),
    [id, token])

    const fetchComments = useCallback(() =>
        fetch(`${API}/titles/${id}/comments`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(setComments),
    [id, token])

    useEffect(() => {
        fetchTitle()
        fetchComments()
    }, [fetchTitle, fetchComments])

    const canEdit = title?.ownedByCurrentUser
    const canComment = title?.public || canEdit
    const ratedComments = comments.filter(c => c.rating !== null && c.rating !== undefined)
    const averageRating = ratedComments.length > 0
        ? ratedComments.reduce((sum, comment) => sum + comment.rating, 0) / ratedComments.length
        : null

    const toggleWatched = () => {
        if (!canEdit) return

        fetch(`${API}/titles/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ watched: !title.watched })
        }).then(fetchTitle)
    }

    const toggleFavorite = () => {
        if (!canEdit) return

        fetch(`${API}/titles/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ favorite: !title.favorite })
        }).then(fetchTitle)
    }

    const deleteTitle = () => {
        if (!canEdit) return

        fetch(`${API}/titles/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        }).then(() => navigate('/'))
    }

    const addComment = (e) => {
        e.preventDefault()
        if (!newComment.trim() || !newRating) return

        fetch(`${API}/titles/${id}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ content: newComment, rating: newRating })
        }).then(() => {
            setNewComment('')
            setNewRating(null)
            fetchComments()
        })
    }

    const deleteComment = (commentId) =>
        fetch(`${API}/titles/${id}/comments/${commentId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        }).then(fetchComments)

    if (!title) return <p className="text-zinc-500 text-sm">Laden...</p>

    return (
        <div className="w-full max-w-5xl">
            <button
                onClick={() => navigate(-1)}
                className="text-zinc-500 hover:text-white text-sm mb-6 transition"
            >
                ← Terug
            </button>

            <div className="bg-zinc-900 p-6 mb-6 ui-rounded border border-zinc-800">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">{title.name}</h1>
                        <p className="text-zinc-500 text-sm capitalize mt-1">
                            {title.type} {title.year ? `· ${title.year}` : ''}
                        </p>
                        <p className="text-zinc-600 text-xs mt-1">
                            Geupload door {title.owner || 'onbekend'}
                        </p>
                    </div>
                    {canEdit && (
                        <div className="flex items-center gap-4">
                            <button
                                onClick={toggleFavorite}
                                className={`flex items-center gap-2 text-sm font-medium transition ${title.favorite ? 'text-yellow-400' : 'text-zinc-500 hover:text-white'}`}
                            >
                                <VectorIcon
                                    src={`${assetBase}/Star.png`}
                                    alt=""
                                    className={`aspect-square h-5 w-5 object-contain ${title.favorite ? '' : 'opacity-55'}`}
                                />
                                {title.favorite ? 'In favorieten' : 'Voeg toe aan favorieten'}
                            </button>
                            <button
                                onClick={deleteTitle}
                                className="text-xs text-zinc-600 hover:text-red-400 transition"
                            >
                                Verwijderen
                            </button>
                        </div>
                    )}
                </div>

                {title.genres.length > 0 && (
                    <div className="flex gap-2 mb-4">
                        {title.genres.map(g => (
                            <span key={g.id} className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5">
                                {g.name}
                            </span>
                        ))}
                    </div>
                )}

                {title.thumbnail && (
                    <div className="mb-4 overflow-hidden ui-rounded bg-zinc-800 aspect-video">
                        <img src={getImageUrl(title.thumbnail)} alt={title.name} className="h-full w-full object-cover" />
                    </div>
                )}

                {averageRating !== null && (
                    <p className="text-sm text-zinc-400 mb-4">
                        Gemiddelde beoordeling: {averageRating.toFixed(1)} op 5 uit {ratedComments.length} reacties
                    </p>
                )}

                {canEdit && (
                    <div className="flex items-center gap-6">
                        <button
                            onClick={toggleWatched}
                            className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white transition"
                        >
                            <VectorIcon
                                src={title.watched ? `${assetBase}/Checkmark.png` : `${assetBase}/Eye.png`}
                                alt=""
                                className={`aspect-square h-5 w-5 object-contain ${title.watched ? '' : 'opacity-55'}`}
                            />
                            {title.watched ? 'Gezien' : 'Niet gezien'}
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
                <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest mb-4">
                    Reacties ({comments.length})
                </h2>

                {canComment ? (
                    <form onSubmit={addComment} className="flex flex-col gap-3 mb-6">
                        <div>
                            <label className="text-zinc-500 text-xs uppercase tracking-widest mb-2 block">Beoordeling</label>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map(s => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setNewRating(s)}
                                        className={`text-2xl transition ${s <= (newRating ?? 0) ? 'text-yellow-400' : 'text-zinc-700 hover:text-zinc-400'}`}
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                                placeholder="Schrijf een reactie..."
                                className="flex-1 bg-zinc-800 text-white px-4 py-2 text-sm placeholder-zinc-600 focus:outline-none"
                            />
                            <button
                                type="submit"
                                disabled={!newRating}
                                className="bg-white text-black font-bold px-4 py-2 text-sm hover:bg-zinc-200 transition disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Plaatsen
                            </button>
                        </div>
                    </form>
                ) : (
                    <p className="text-zinc-600 text-sm mb-6">Alleen openbare titels kunnen reacties krijgen.</p>
                )}

                {comments.length === 0 ? (
                    <p className="text-zinc-600 text-sm">Nog geen reacties.</p>
                ) : (
                    <div className="flex flex-col gap-3">
                        {comments.map(c => (
                            <div key={c.id} className="flex justify-between items-start group">
                                <div>
                                    {c.rating !== null && c.rating !== undefined && (
                                        <div className="flex gap-0.5 mb-1">
                                            {[1, 2, 3, 4, 5].map(s => (
                                                <span key={s} className={`text-sm ${s <= c.rating ? 'text-yellow-400' : 'text-zinc-700'}`}>★</span>
                                            ))}
                                        </div>
                                    )}
                                    <p className="text-sm text-white">{c.content}</p>
                                    <p className="text-xs text-zinc-600 mt-1">{c.user} · {c.createdAt}</p>
                                </div>
                                <button
                                    onClick={() => deleteComment(c.id)}
                                    className="text-xs text-zinc-700 hover:text-red-400 transition opacity-0 group-hover:opacity-100"
                                >
                                    Verwijderen
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}