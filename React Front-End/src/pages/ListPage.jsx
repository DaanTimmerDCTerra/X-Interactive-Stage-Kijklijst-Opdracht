import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getImageUrl } from '../lib/constants'
import TitlePreviewCard from '../components/TitlePreviewCard'
import { requestAuthApi } from '../lib/api'

const FILTER = {
    all: 'alle',
    watched: 'gezien',
    notWatched: 'niet-gezien',
    film: 'film',
    serie: 'serie',
    favorites: 'favorieten',
    notFavorites: 'geen-favorieten',
}

function parseUrlParams(search) {
    const params = new URLSearchParams(search)

    const searchValue = params.get('search') ?? ''
    const genre = params.get('genre') ?? FILTER.all

    const presetParam = params.get('preset')
    let preset = FILTER.all

    if (presetParam && Object.values(FILTER).includes(presetParam)) {
        preset = presetParam
    } else if (params.get('favorite') === 'true') {
        preset = FILTER.favorites
    } else if (params.get('watched') === 'watched') {
        preset = FILTER.watched
    } else if (params.get('watched') === 'unwatched') {
        preset = FILTER.notWatched
    } else if (params.get('type') === 'film') {
        preset = FILTER.film
    } else if (params.get('type') === 'serie') {
        preset = FILTER.serie
    }

    return { search: searchValue, preset, genre }
}

export default function ListPage({ token }) {
    const navigate = useNavigate()
    const location = useLocation()
    const filters = useMemo(() => parseUrlParams(location.search), [location.search])

    const [titles, setTitles] = useState([])

    useEffect(() => {
        let active = true
        const controller = new AbortController()

        const loadTitles = async () => {
            const params = new URLSearchParams()
            if (filters.search.trim()) params.set('search', filters.search.trim())

            try {
                const data = await requestAuthApi(token, `/titles${params.toString() ? `?${params.toString()}` : ''}`, {
                    signal: controller.signal,
                })
                if (active) setTitles(data ?? [])
            } catch (error) {
                if (error instanceof DOMException && error.name === 'AbortError') return
                if (active) setTitles([])
            }
        }

        loadTitles()
        return () => {
            active = false
            controller.abort()
        }
    }, [token, filters.search])

    const pushUrl = useCallback((newSearch, newPreset, newGenre) => {
        const params = new URLSearchParams()
        if (newSearch.trim()) params.set('search', newSearch.trim())
        if (newPreset !== FILTER.all) params.set('preset', newPreset)
        if (newGenre !== FILTER.all) params.set('genre', newGenre)
        navigate(`?${params.toString()}`, { replace: true })
    }, [navigate])

    const handleSearchChange = (value) => {
        pushUrl(value, filters.preset, filters.genre)
    }

    const handlePresetChange = (value) => {
        pushUrl(filters.search, value, filters.genre)
    }

    const handleGenreChange = (value) => {
        pushUrl(filters.search, filters.preset, value)
    }

    const deleteTitle = (id) =>
        requestAuthApi(token, `/titles/${id}`, {
            method: 'DELETE',
        }).then(() => {
            setTitles((currentTitles) => currentTitles.filter((title) => title.id !== id))
        })

    const toggleWatched = (title) =>
        requestAuthApi(token, `/titles/${title.id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ watched: !title.watched })
        }).then(() => {
            setTitles((currentTitles) => currentTitles.map((currentTitle) => (
                currentTitle.id === title.id
                    ? { ...currentTitle, watched: !currentTitle.watched }
                    : currentTitle
            )))
        })

    const toggleFavorite = (title) =>
        requestAuthApi(token, `/titles/${title.id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ favorite: !title.favorite })
        }).then(() => {
            setTitles((currentTitles) => currentTitles.map((currentTitle) => (
                currentTitle.id === title.id
                    ? { ...currentTitle, favorite: !currentTitle.favorite }
                    : currentTitle
            )))
        })

    const genres = titles
        .flatMap((title) => title.genres ?? [])
        .filter((genre, index, currentGenres) => currentGenres.findIndex((entry) => entry.id === genre.id) === index)
        .sort((left, right) => left.name.localeCompare(right.name))

    const sortedTitles = [...titles].sort((left, right) => {
        if (left.favorite !== right.favorite) return left.favorite ? -1 : 1
        return left.name.localeCompare(right.name)
    })

    let filteredTitles = [...sortedTitles]

    if (filters.preset === FILTER.film) filteredTitles = filteredTitles.filter((title) => title.type === 'film')
    if (filters.preset === FILTER.serie) filteredTitles = filteredTitles.filter((title) => title.type === 'serie')
    if (filters.preset === FILTER.watched) filteredTitles = filteredTitles.filter((title) => title.watched)
    if (filters.preset === FILTER.notWatched) filteredTitles = filteredTitles.filter((title) => !title.watched)
    if (filters.preset === FILTER.favorites) filteredTitles = filteredTitles.filter((title) => title.favorite)
    if (filters.preset === FILTER.notFavorites) filteredTitles = filteredTitles.filter((title) => !title.favorite)

    filteredTitles = filteredTitles.filter((title) => {
        if (filters.genre === FILTER.all) return true
        return (title.genres ?? []).some((genre) => String(genre.id) === filters.genre)
    })

    return (
        <div className="full-width">
            <div className="page-header">
                <h1 className="page-title">Mijn lijst</h1>
            </div>

            <div className="filters-row">
                <input
                    type="text"
                    placeholder="Zoek een film of serie..."
                    value={filters.search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="filter-control"
                />
                <select
                    value={filters.preset}
                    onChange={(e) => handlePresetChange(e.target.value)}
                    className="filter-control"
                >
                    <option value={FILTER.all}>Alle filters</option>
                    <option value={FILTER.film}>Films</option>
                    <option value={FILTER.serie}>Series</option>
                    <option value={FILTER.watched}>Gezien</option>
                    <option value={FILTER.notWatched}>Niet gezien</option>
                    <option value={FILTER.favorites}>Favorieten</option>
                    <option value={FILTER.notFavorites}>Geen favorieten</option>
                </select>
                <select
                    value={filters.genre}
                    onChange={(e) => handleGenreChange(e.target.value)}
                    className="filter-control"
                >
                    <option value={FILTER.all}>Alle genres</option>
                    {genres.map((genre) => (
                        <option key={genre.id} value={String(genre.id)}>
                            {genre.name}
                        </option>
                    ))}
                </select>
            </div>

            {filteredTitles.length === 0 ? (
                <div className="panel-empty">
                    Geen films of series gevonden voor dit filter.
                </div>
            ) : (
                <div className="titles-grid">
                    {filteredTitles.map((title) => (
                        <TitlePreviewCard
                            key={title.id}
                            title={{ ...title, imageUrl: getImageUrl(title.thumbnail) }}
                            onClick={() => navigate(`/titel/${title.id}`)}
                            onToggleFavorite={toggleFavorite}
                            onToggleWatched={toggleWatched}
                            onDelete={deleteTitle}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
