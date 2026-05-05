import { NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import VectorIcon from './VectorIcon'
import { assetBase } from '../lib/constants'

const links = [
    { to: '/', label: 'Welkom', icon: `${assetBase}/Home.png` },
    { to: '/mijn-lijst', label: 'Mijn lijst', icon: `${assetBase}/Open Book.png` },
    { to: '/toevoegen', label: 'Toevoegen', icon: `${assetBase}/Plus.png` },
    { to: '/discovery', label: 'Ontdekken', icon: `${assetBase}/Compass.png` },
    { to: '/snake', label: 'Snake', icon: `${assetBase}/Play.png` },
]

export default function Sidebar({ onLogout, onSwitchAccount }) {
    const [accounts, setAccounts] = useState([])

    useEffect(() => {
        try {
            const raw = localStorage.getItem('accounts')
            setAccounts(raw ? JSON.parse(raw) : [])
        } catch {
            setAccounts([])
        }
    }, [])

    const handleSwitch = (e) => {
        const idx = parseInt(e.target.value)
        if (!accounts[idx]) return
        onSwitchAccount(accounts[idx].token)
    }

    return (
        <aside className="fixed top-0 left-0 h-full w-56 border-r border-zinc-800/80 bg-zinc-950/95 backdrop-blur flex flex-col">
            <div className="px-5 py-5 border-b border-zinc-800/80 flex items-center gap-3">
                <VectorIcon src={`${assetBase}/X Logo.png`} alt="logo" className="aspect-square h-9 w-9 ui-rounded object-contain" />
                <div>
                    <span className="block text-sm font-semibold tracking-[0.2em] uppercase text-zinc-400">Kijklijst</span>
                    <span className="block text-xs text-zinc-600">Films en Series</span>
                </div>
            </div>
            <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
                {links.map(link => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        end={link.to === '/'}
                        className={({ isActive }) =>
                            `group flex items-center gap-3 ui-rounded px-4 py-3 text-sm font-medium transition ${isActive
                                ? 'bg-white text-black shadow-lg shadow-black/20'
                                : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                            }`
                        }
                    >
                        <VectorIcon src={link.icon} alt={link.label} className="aspect-square h-5 w-5 shrink-0 object-contain" />
                        <span>{link.label}</span>
                    </NavLink>
                ))}
            </nav>
            <div className="px-3 py-4 border-t border-zinc-800/80 space-y-3">
                {accounts.length > 0 && (
                    <select onChange={handleSwitch} className="w-full ui-rounded border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 outline-none transition focus:border-zinc-600">
                        <option value="">Wissel account</option>
                        {accounts.map((a, i) => (
                            <option key={i} value={i}>{a.email}</option>
                        ))}
                    </select>
                )}
                <button
                    onClick={onLogout}
                    className="w-full ui-rounded border border-zinc-800 bg-zinc-900 px-4 py-2 text-left text-sm font-medium text-zinc-400 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
                >
                    Uitloggen
                </button>
            </div>
        </aside>
    )
}