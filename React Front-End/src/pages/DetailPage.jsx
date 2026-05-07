import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getImageUrl } from '../lib/constants'
import { assetBase } from '../lib/constants'
import VectorIcon from '../components/VectorIcon'
import { requestAuthApi } from '../lib/api'

export default function DetailPage({ token }) {
    const { id } = useParams()
    const navigate = useNavigate()
    const [title, setTitle] = useState(null)
    

    const fetchTitle = useCallback(() =>
        requestAuthApi(token, `/titles/${id}`)
            .then(setTitle),
    [id, token])

    useEffect(() => {
        fetchTitle()
    }, [fetchTitle])

    const canEdit = title?.ownedByCurrentUser
    

    const toggleWatched = () => {
        if (!canEdit) return

        requestAuthApi(token, `/titles/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ watched: !title.watched })
        }).then(fetchTitle)
    }

    const toggleFavorite = () => {
        if (!canEdit) return

        requestAuthApi(token, `/titles/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ favorite: !title.favorite })
        }).then(fetchTitle)
    }

    const deleteTitle = () => {
        if (!canEdit) return

        requestAuthApi(token, `/titles/${id}`, {
            method: 'DELETE',
        }).then(() => navigate('/'))
    }

    

    if (!title) return <p className="muted-small">Laden...</p>

    return (
        <div className="full-width container-max-5xl">
            <button
                onClick={() => navigate(-1)}
                className="link-small"
                style={{ marginBottom: '1.5rem' }}
            >
                &lt; Terug
            </button>

            <div className="panel-section">
                <div className="detail-header">
                    <div>
                        <h1 className="detail-title">{title.name}</h1>
                        <p className="muted-small capitalize" style={{marginTop: '0.25rem'}}>
                            {title.type} {title.year ? `- ${title.year}` : ''}
                        </p>
                    </div>
                </div>

                {title.genres.length > 0 && (
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem'}}>
                        <span className="muted-small">Genres:</span>
                        <div className="tags-row">
                            {title.genres.map(g => (
                                <span key={g.id} className="genre-chip">
                                    {g.name}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {title.thumbnail && (
                    <div className="media-frame">
                        <img src={getImageUrl(title.thumbnail)} alt={title.name} className="media-img" />
                    </div>
                )}

                

                {canEdit && (
                    <div className="actions-row">
                        <button
                            onClick={toggleFavorite}
                            className={`action-btn ${title.favorite ? 'action-fav' : 'action-muted'}`}
                        >
                            <VectorIcon
                                src={`${assetBase}/Star.png`}
                                alt=""
                                className={`icon-small ${title.favorite ? '' : 'muted-opacity'}`}
                            />
                            {title.favorite ? 'In favorieten' : 'Voeg toe aan favorieten'}
                        </button>

                        <button
                            onClick={toggleWatched}
                            className={`action-btn ${title.watched ? 'action-watched' : 'action-muted'}`}
                        >
                            <VectorIcon
                                src={title.watched ? `${assetBase}/Checkmark.png` : `${assetBase}/Eye.png`}
                                alt=""
                                className={`icon-small ${title.watched ? '' : 'muted-opacity'}`}
                            />
                            {title.watched ? 'Gezien' : 'Niet gezien'}
                        </button>

                        <button
                            onClick={deleteTitle}
                            className="action-link action-link-danger"
                        >
                            Verwijderen
                        </button>
                        <button
                            onClick={() => navigate(`/titel/${id}/bewerk`)}
                            className="action-link"
                        >
                            Bewerken
                        </button>
                    </div>
                )}
            </div>

        </div>
    )
}
