export default function TitleCard({ title, onClick, children, className = '' }) {
	const handleKeyDown = (event) => {
		if (!onClick) return

		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault()
			onClick()
		}
	}

	return (
		<div
			role={onClick ? 'button' : undefined}
			tabIndex={onClick ? 0 : undefined}
			onClick={onClick}
			onKeyDown={handleKeyDown}
			className={`card ${onClick ? 'card-interactive' : ''} ${className}`.trim()}
		>
			<div className="media-frame">
				{title.thumbnail ? (
					<img
						src={title.imageUrl}
						alt={title.name}
						className="media-img"
					/>
				) : (
					<div className="media-placeholder">
						<span className="placeholder-text">Geen preview</span>
					</div>
				)}
			</div>
			<p className="card-title">{title.name}</p>
			<p className="card-meta">
				{title.type} {title.year ? `- ${title.year}` : ''}
			</p>
			{children}
		</div>
	)
}
