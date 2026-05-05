import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { API } from '../lib/constants'
import VectorIcon from '../components/VectorIcon'
import { assetBase } from '../lib/constants'

export default function ListPage({ token }) {
    const [titles, setTitles] = useState([])
    const [search, setSearch] = useState('')
    const [filterType, setFilterType] = useState('alle')
    const [filterWatched, setFilterWatched] = useState('alle')
    const navigate = useNavigate()

    const fetchTitles = useCallback(() => {
        fetch(`${API}/titles`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then((r) => r.json())
            .then(setTitles)
    }, [token])

    useEffect(() => {
        fetchTitles()
    }, [fetchTitles])

    const deleteTitle = (id) =>
        fetch(`${API}/titles/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        }).then(fetchTitles)

    const toggleWatched = (title) =>
        fetch(`${API}/titles/${title.id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ watched: !title.watched })
        }).then(fetchTitles)

    const toggleFavorite = (title) =>
        fetch(`${API}/titles/${title.id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ favorite: !title.favorite })
        }).then(fetchTitles)

    const filtered = titles
        .filter((title) => filterType === 'alle' || title.type === filterType)
        .filter((title) => filterWatched === 'alle' || (filterWatched === 'gezien' ? title.watched : !title.watched))
        .filter((title) => title.name.toLowerCase().includes(search.toLowerCase()))

    const favoriteTitles = filtered.filter((title) => title.favorite)

    return (
        <div className="w-full">
            <div className="mb-10">
                <h1 className="text-4xl font-bold mb-3">Mijn lijst</h1>
                <p className="max-w-3xl text-zinc-400 text-sm leading-6">
                    Dit is jouw persoonlijke verzameling. Je kunt hier filteren, favorieten markeren en direct naar de detailpagina gaan.
                </p>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row mb-6">
                <input
                    type="text"
                    placeholder="Zoeken in mijn lijst..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 bg-zinc-900 text-white px-4 py-3 text-sm placeholder-zinc-600 focus:outline-none focus:bg-zinc-800 transition"
                />
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="bg-zinc-900 text-white px-4 py-3 text-sm focus:outline-none"
                >
                    <option value="alle">Alle types</option>
                    <option value="film">Films</option>
                    <option value="serie">Series</option>
                </select>
                <select
                    value={filterWatched}
                    onChange={(e) => setFilterWatched(e.target.value)}
                    className="bg-zinc-900 text-white px-4 py-3 text-sm focus:outline-none"
                >
                    <option value="alle">Alles</option>
                    <option value="gezien">Gezien</option>
                    <option value="niet-gezien">Niet gezien</option>
                </select>
            </div>

            <p className="text-zinc-500 text-sm mb-5">
                {filtered.length} {filtered.length === 1 ? 'titel' : 'titels'}
            </p>

            {favoriteTitles.length > 0 && (
                <section className="mb-10">
                    <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest mb-4">
                        Favorieten ({favoriteTitles.length})
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {favoriteTitles.map((title) => (
                            <button
                                key={title.id}
                                type="button"
                                onClick={() => navigate(`/titel/${title.id}`)}
                                className="card text-left"
                            >
                                {title.thumbnail && (
                                    <div className="mb-3 overflow-hidden ui-rounded bg-zinc-800 aspect-video">
                                        <img src={`${API.replace('/api', '')}${title.thumbnail}`} alt={title.name} className="h-full w-full object-cover" />
                                    </div>
                                )}
                                <p className="card-title">{title.name}</p>
                                <p className="card-meta">{title.type} {title.year ? `· ${title.year}` : ''}</p>
                                <div className="rating mt-3">
                                    {[1, 2, 3, 4, 5].map((score) => (
                                        <span key={score} className={`rating-star ${score <= (title.averageRating ?? 0) ? 'active' : 'inactive'}`}>★</span>
                                    ))}
                                    <span className="text-xs text-zinc-500 ml-2">({title.commentCount ?? 0})</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </section>
            )}

            {filtered.length === 0 ? (
                <div className="bg-zinc-900 p-10 text-center text-zinc-600 text-sm ui-rounded">
                    Geen titels gevonden.
                </div>
            ) : (
                <div className="overflow-x-auto bg-zinc-900 ui-rounded border border-zinc-800">
                    <table className="w-full min-w-[900px]">
                        <thead>
                            <tr className="border-b border-zinc-800 text-zinc-500 text-xs font-semibold">
                                <th className="text-left px-5 py-4">Favoriet</th>
                                <th className="text-left px-5 py-4">Naam</th>
                                <th className="text-left px-5 py-4">Type</th>
                                <th className="text-left px-5 py-4">Jaar</th>
                                <th className="text-left px-5 py-4">Genres</th>
                                <th className="text-left px-5 py-4">Beoordeling</th>
                                <th className="text-left px-5 py-4">Gezien</th>
                                <th className="px-5 py-4"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((title) => (
                                <tr
                                    key={title.id}
                                    className="border-b border-zinc-800 last:border-0 hover:bg-zinc-800 transition group cursor-pointer"
                                    onClick={() => navigate(`/titel/${title.id}`)}
                                >
                                    <td className="px-5 py-4">
                                        <button
                                            onClick={(event) => { event.stopPropagation(); toggleFavorite(title) }}
                                            className="transition"
                                            type="button"
                                        >
                                            <VectorIcon
                                                src={title.favorite ? `${assetBase}/Star.png` : `${assetBase}/Star v2.png`}
                                                alt={title.favorite ? 'Favoriet' : 'Niet favoriet'}
                                                className={`aspect-square h-5 w-5 object-contain ${title.favorite ? '' : 'opacity-55'}`}
                                            />
                                        </button>
                                    </td>
                                    <td className="px-5 py-4 text-sm font-semibold">{title.name}</td>
                                    <td className="px-5 py-4 text-xs text-zinc-400 capitalize">{title.type}</td>
                                    <td className="px-5 py-4 text-sm text-zinc-500">{title.year ?? '—'}</td>
                                    <td className="px-5 py-4">
                                        <div className="flex gap-1 flex-wrap">
                                            {title.genres.map((genre) => (
                                                <span key={genre.id} className="text-xs bg-zinc-700 text-zinc-300 px-2 py-0.5 rounded-full">
                                                    {genre.name}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="flex">
                                                {[1, 2, 3, 4, 5].map((score) => (
                                                    <span key={score} className={`text-sm ${score <= (title.averageRating ?? 0) ? 'text-yellow-400' : 'text-zinc-700'}`}>★</span>
                                                ))}
                                            </div>
                                            <span className="text-xs text-zinc-500">({title.commentCount ?? 0})</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <button
                                            onClick={(event) => { event.stopPropagation(); toggleWatched(title) }}
                                            className="transition"
                                            type="button"
                                        >
                                            <VectorIcon
                                                src={title.watched ? `${assetBase}/Checkmark.png` : `${assetBase}/Eye.png`}
                                                alt={title.watched ? 'Gezien' : 'Niet gezien'}
                                                className={`aspect-square h-5 w-5 object-contain ${title.watched ? '' : 'opacity-55'}`}
                                            />
                                        </button>
                                    </td>
                                    <td className="px-5 py-4 text-right opacity-0 group-hover:opacity-100 transition">
                                        <button
                                            onClick={(event) => { event.stopPropagation(); deleteTitle(title.id) }}
                                            className="inline-flex items-center gap-2 text-xs text-zinc-600 hover:text-red-400 transition"
                                            type="button"
                                        >
                                            <VectorIcon src={`${assetBase}/Trash Bin.png`} alt="" className="aspect-square h-4 w-4 object-contain" />
                                            Verwijderen
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
