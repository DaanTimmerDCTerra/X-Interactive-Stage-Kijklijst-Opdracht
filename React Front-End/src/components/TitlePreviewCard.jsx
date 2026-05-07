import TitleCard from './TitleCard'
import VectorIcon from './VectorIcon'
import { assetBase } from '../lib/constants'

function renderGenres(genres = []) {
    if (!genres.length) return null

    return (
        <div className="tags-row">
            {genres.map((genre) => (
                <span key={genre.id} className="genre-chip">
                    {genre.name}
                </span>
            ))}
        </div>
    )
}

export default function TitlePreviewCard({
    title,
    onClick,
    onToggleFavorite,
    onToggleWatched,
    onDelete,
    className = '',
}) {
    return (
        <TitleCard
            title={title}
            onClick={onClick}
            className={className}
        >
            <div className="stack-md">
                <div className="tags-row" style={{alignItems: 'center'}}>
                    <button
                        onClick={onToggleFavorite ? (event) => { event.stopPropagation(); onToggleFavorite(title) } : undefined}
                        className={`chip ${title.favorite ? 'chip--favorite' : 'chip--muted'} ${!onToggleFavorite ? 'chip--disabled' : ''}`}
                        type="button"
                        disabled={!onToggleFavorite}
                    >
                        <VectorIcon
                            src={title.favorite ? `${assetBase}/Star.png` : `${assetBase}/Star v2.png`}
                            alt=""
                            className={`${title.favorite ? 'icon-tiny' : 'icon-tiny muted-opacity'}`}
                        />
                        {title.favorite ? 'Favoriet' : 'Geen favoriet'}
                    </button>
                    <button
                        onClick={onToggleWatched ? (event) => { event.stopPropagation(); onToggleWatched(title) } : undefined}
                        className={`chip ${title.watched ? 'chip--watched' : 'chip--muted'} ${!onToggleWatched ? 'chip--disabled' : ''}`}
                        type="button"
                        disabled={!onToggleWatched}
                    >
                        <VectorIcon
                            src={title.watched ? `${assetBase}/Checkmark.png` : `${assetBase}/Eye.png`}
                            alt=""
                            className={`${title.watched ? 'icon-tiny' : 'icon-tiny muted-opacity'}`}
                        />
                        {title.watched ? 'Gezien' : 'Niet gezien'}
                    </button>
                    {onDelete && (
                        <button
                            onClick={(event) => { event.stopPropagation(); onDelete(title.id) }}
                            className="text-small-muted text-danger-hover"
                            type="button"
                        >
                            Verwijderen
                        </button>
                    )}
                </div>

                {renderGenres(title.genres)}

                <div className="meta-row">
                    <span className="capitalize">{title.type}</span>
                    <span>{title.year ?? '-'}</span>
                </div>

            </div>
        </TitleCard>
    )
}
