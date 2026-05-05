import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API } from '../lib/constants'
import VectorIcon from '../components/VectorIcon'
import { assetBase } from '../lib/constants'

export default function HomePage({ token }) {
    const [titles, setTitles] = useState([])
    const navigate = useNavigate()

    useEffect(() => {
        fetch(`${API}/titles`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then((response) => response.json())
            .then(setTitles)
    }, [token])

    const favorites = titles.filter((title) => title.favorite)
    const watchedCount = titles.filter((title) => title.watched).length
    const publicCount = titles.filter((title) => title.public).length

    const quickCards = [
        { label: 'Mijn lijst', value: titles.length, to: '/mijn-lijst', icon: `${assetBase}/Open Book.png` },
        { label: 'Favorieten', value: favorites.length, to: '/mijn-lijst', icon: `${assetBase}/Star.png` },
        { label: 'Openbaar', value: publicCount, to: '/discovery', icon: `${assetBase}/World.png` },
        { label: 'Gezien', value: watchedCount, to: '/mijn-lijst', icon: `${assetBase}/Checkmark.png` },
    ]

    return (
        <div className="w-full">
            <section className="mb-10 ui-rounded border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 p-8 lg:p-10">
                <p className="text-xs uppercase tracking-[0.35em] text-zinc-500 mb-4">Welkom</p>
                <h1 className="text-4xl lg:text-6xl font-black tracking-tight max-w-4xl leading-tight mb-4">
                    Je kijklijst, je favorieten en alles wat je nog wilt ontdekken, op één plek.
                </h1>
                <p className="max-w-3xl text-zinc-400 text-sm lg:text-base leading-7 mb-8">
                    Gebruik je persoonlijke lijst om titels te bewaren, markeer favorieten en open Ontdekken om openbare titels van anderen te bekijken.
                </p>
            </section>

            <section className="mb-10">
                <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest mb-4">Overzicht</h2>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {quickCards.map((card) => (
                        <button
                            key={card.label}
                            type="button"
                            onClick={() => navigate(card.to)}
                            className="card ui-rounded text-left"
                        >
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">{card.label}</p>
                                <VectorIcon src={card.icon} alt="" className="aspect-square h-6 w-6 object-contain opacity-80" />
                            </div>
                            <p className="text-4xl font-black text-white">{card.value}</p>
                        </button>
                    ))}
                </div>
            </section>

            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest">Favorieten</h2>
                    <button onClick={() => navigate('/mijn-lijst')} className="text-sm text-zinc-400 hover:text-white transition">
                        Alles bekijken
                    </button>
                </div>
                {favorites.length === 0 ? (
                    <div className="ui-rounded border border-dashed border-zinc-800 bg-zinc-900/50 p-8 text-zinc-500 text-sm">
                        Je hebt nog geen favorieten gemarkeerd.
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                        {favorites.map((title) => (
                            <button
                                key={title.id}
                                type="button"
                                onClick={() => navigate(`/titel/${title.id}`)}
                                className="card ui-rounded text-left"
                            >
                                {title.thumbnail && (
                                    <div className="mb-4 overflow-hidden ui-rounded bg-zinc-800 aspect-video">
                                        <img
                                            src={`${API.replace('/api', '')}${title.thumbnail}`}
                                            alt={title.name}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                )}
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="card-title text-base">{title.name}</p>
                                        <p className="card-meta">{title.type} {title.year ? `· ${title.year}` : ''}</p>
                                    </div>
                                    <VectorIcon src={`${assetBase}/Star.png`} alt="favoriet" className="aspect-square h-6 w-6 object-contain" />
                                </div>
                                <div className="rating mt-4">
                                    {[1, 2, 3, 4, 5].map((score) => (
                                        <span key={score} className={`rating-star ${score <= (title.averageRating ?? 0) ? 'active' : 'inactive'}`}>★</span>
                                    ))}
                                    <span className="text-xs text-zinc-500 ml-2">({title.commentCount ?? 0})</span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}