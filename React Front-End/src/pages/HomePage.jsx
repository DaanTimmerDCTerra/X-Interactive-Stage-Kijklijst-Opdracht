import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getImageUrl } from '../lib/constants'
import VectorIcon from '../components/VectorIcon'
import { assetBase } from '../lib/constants'
import TitlePreviewCard from '../components/TitlePreviewCard'
import { requestAuthApi } from '../lib/api'

export default function HomePage({ token }) {
    const [titles, setTitles] = useState([])
    const navigate = useNavigate()

    useEffect(() => {
        requestAuthApi(token, '/titles')
            .then((data) => setTitles(data ?? []))
            .catch(() => setTitles([]))
    }, [token])

    const favorites = titles.filter((title) => title.favorite)
    const watchedCount = titles.filter((title) => title.watched).length

    const quickCards = [
        { label: 'Mijn lijst', value: titles.length, to: '/mijn-lijst', icon: `${assetBase}/Open Book.png` },
        { label: 'Favorieten', value: favorites.length, to: '/mijn-lijst?preset=favorieten', icon: `${assetBase}/Star.png` },
        { label: 'Gezien', value: watchedCount, to: '/mijn-lijst?preset=gezien', icon: `${assetBase}/Checkmark.png` },
    ]

    return (
        <div className="full-width">
            <section>
                <div className="section-header">
                    <h2 className="section-title">Favorieten</h2>
                    <button onClick={() => navigate('/mijn-lijst')} className="link-small">
                        Alles bekijken
                    </button>
                </div>
                {favorites.length === 0 ? (
                    <div className="panel-soft-note">
                        Je hebt nog geen favorieten gemarkeerd.
                    </div>
                ) : (
                    <div className="cards-grid">
                        {favorites.map((title) => (
                            <TitlePreviewCard
                                key={title.id}
                                title={{ ...title, imageUrl: getImageUrl(title.thumbnail) }}
                                onClick={() => navigate(`/titel/${title.id}`)}
                            />
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}
