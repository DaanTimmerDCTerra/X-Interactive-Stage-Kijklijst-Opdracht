import TitleRow from './TitleRow'

export default function TitleList({ titles, onDelete, onToggleWatched, onUpdate }) {
    return (
        <div>
            <h2 className="section-title mb-3">
                Mijn lijst · {titles.length} {titles.length === 1 ? 'titel' : 'titels'}
            </h2>
            {titles.length === 0 ? (
                <div className="empty-panel">
                    Nog niets toegevoegd.
                </div>
            ) : (
                <div className="table-shell">
                    <table className="w-full">
                        <thead>
                            <tr className="table-head">
                                <th className="table-head-cell">Naam</th>
                                <th className="table-head-cell">Type</th>
                                <th className="table-head-cell">Jaar</th>
                                <th className="table-head-cell">Rating</th>
                                <th className="table-head-cell">Gezien</th>
                                <th className="table-head-cell"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {titles.map(t => (
                                <TitleRow
                                    key={t.id}
                                    title={t}
                                    onDelete={onDelete}
                                    onToggleWatched={onToggleWatched}
                                    onUpdate={onUpdate}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}