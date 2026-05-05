import { useEffect, useState } from 'react'
import { getProfilePicture, setProfilePicture } from '../lib/accountStorage'
import VectorIcon from '../components/VectorIcon'
import { assetBase } from '../lib/constants'

export default function ProfilePage({ email, onProfileChange }) {
    const [preview, setPreview] = useState(getProfilePicture(email))
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        setPreview(getProfilePicture(email))
    }, [email])

    const handleFileChange = async (event) => {
        const file = event.target.files?.[0]
        if (!file || !email) return

        setSaving(true)
        try {
            const reader = new FileReader()
            reader.onload = () => {
                const value = String(reader.result ?? '')
                setProfilePicture(email, value)
                setPreview(value)
                onProfileChange?.(value)
            }
            reader.readAsDataURL(file)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="profile-root">
            <div className="profile-header">
                <h1 className="profile-title">Profiel</h1>
                <p className="profile-note">Pas hier je profielfoto aan. De foto wordt lokaal per account opgeslagen.</p>
            </div>

            <div className="profile-grid">
                <div className="profile-card">
                    <div className="avatar-wrap">
                        {preview ? (
                            <img src={preview} alt="Profielfoto" className="avatar-img" />
                        ) : (
                            <VectorIcon src={`${assetBase}/Noob Head.png`} alt="Profielfoto" className="avatar-placeholder" />
                        )}
                    </div>
                    <label className="label-block">
                        <span className="label-small">
                            <VectorIcon src={`${assetBase}/Pencil.png`} alt="" className="aspect-square h-4 w-4 object-contain opacity-70" />
                            Nieuwe foto
                        </span>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="file-input"
                        />
                    </label>
                    {saving && <p className="saving-note">Bezig met opslaan...</p>}
                </div>

                <div className="profile-card">
                    <p className="label-small">Account</p>
                    <h2 className="account-title">{email || 'Onbekend'}</h2>
                    <p className="account-note">Je account wordt automatisch onthouden na registratie en inloggen. Wisselen tussen accounts brengt je terug naar de homepagina.</p>
                </div>
            </div>
        </div>
    )
}
