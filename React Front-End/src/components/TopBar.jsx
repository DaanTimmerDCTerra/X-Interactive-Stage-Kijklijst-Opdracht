import { useNavigate } from 'react-router-dom'
import VectorIcon from './VectorIcon'
import { assetBase } from '../lib/constants'

export default function TopBar({ email, profileImage }) {
    const navigate = useNavigate()

    return (
        <header className="flex items-center justify-end px-5 py-2.5 border-b border-zinc-800/80 bg-zinc-950/95 backdrop-blur sticky top-0 z-20">
            <button
                type="button"
                onClick={() => navigate('/profiel')}
                className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/90 px-2.5 py-1.5 text-left transition hover:border-zinc-700 hover:bg-zinc-800"
            >
                {profileImage ? (
                    <img src={profileImage} alt="Profielfoto" className="aspect-square h-6 w-6 rounded-full object-cover" />
                ) : (
                        <VectorIcon src={`${assetBase}/Noob Head.png`} alt="Profiel" className="aspect-square h-6 w-6 rounded-full object-contain bg-white/5" />
                )}
                <div className="pr-1">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Profiel</p>
                    <p className="text-xs font-medium text-white">{email || 'Onbekend'}</p>
                </div>
            </button>
        </header>
    )
}