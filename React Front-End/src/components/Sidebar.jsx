import { NavLink, useNavigate } from 'react-router-dom'
import VectorIcon from './VectorIcon'
import { assetBase, getImageUrl } from '../lib/constants'

const links = [
    { to: '/', label: 'Welkom', icon: `${assetBase}/Home.png` },
    { to: '/mijn-lijst', label: 'Mijn lijst', icon: `${assetBase}/Open Book.png` },
    { to: '/toevoegen', label: 'Film toevoegen', icon: `${assetBase}/Plus.png` },
    { to: '/snake', label: 'Snake', icon: `${assetBase}/Play.png` },
]

const unknownUserLabel = 'Onbekend'

export default function Sidebar({ email, profileImage, onLogout }) {
    const navigate = useNavigate()
    const profileImageUrl = getImageUrl(profileImage)

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <VectorIcon src={`${assetBase}/X Logo.png`} alt="logo" className="logo-icon" />
                <div>
                    <span className="sidebar-brand">Kijklijst</span>
                </div>
            </div>
            <nav className="sidebar-nav">
                {links.map(link => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        end={link.to === '/'}
                        className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`}
                    >
                        <VectorIcon src={link.icon} alt={link.label} className="nav-icon" />
                        <span>{link.label}</span>
                    </NavLink>
                ))}
            </nav>
            <div className="sidebar-footer">
                <button
                    type="button"
                    onClick={() => navigate('/profiel')}
                    className="sidebar-control sidebar-profile-btn"
                >
                    {profileImageUrl ? (
                        <img src={profileImageUrl} alt="Profiel" className="avatar-small" />
                    ) : (
                        <VectorIcon src={`${assetBase}/Noob Head.png`} alt="Profiel" className="avatar-small" />
                    )}
                    <div className="profile-email-wrap">
                        <p className="profile-meta">Profiel</p>
                        <p className="profile-email">{email || unknownUserLabel}</p>
                    </div>
                </button>
                <button
                    onClick={onLogout}
                    className="sidebar-control sidebar-danger-btn"
                >
                    Uitloggen
                </button>
            </div>
        </aside>
    )
}
