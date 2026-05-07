import { useEffect, useRef, useState } from 'react'
import VectorIcon from '../components/VectorIcon'
import { requestAuthApi } from '../lib/api'
import { assetBase, getImageUrl } from '../lib/constants'

export default function ProfilePage({ email, token, profileImage, onProfileChange }) {
    const [localPreview, setLocalPreview] = useState(null)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)
    const localPreviewRef = useRef(null)
    const preview = localPreview ?? getImageUrl(profileImage)

    useEffect(() => () => {
        if (localPreviewRef.current) URL.revokeObjectURL(localPreviewRef.current)
    }, [])

    const clearLocalPreview = () => {
        if (!localPreviewRef.current) return

        URL.revokeObjectURL(localPreviewRef.current)
        localPreviewRef.current = null
        setLocalPreview(null)
    }

    const handleFileChange = async (event) => {
        const file = event.target.files?.[0]
        if (!file) return

        clearLocalPreview()
        localPreviewRef.current = URL.createObjectURL(file)
        setLocalPreview(localPreviewRef.current)
        setSaving(true)
        setError(null)

        const body = new FormData()
        body.append('profilePicture', file)

        try {
            const data = await requestAuthApi(token, '/profile', {
                method: 'PATCH',
                body,
            })
            const nextProfileImage = data?.user?.profilePicture ?? null

            clearLocalPreview()
            onProfileChange?.(nextProfileImage)
        } catch (uploadError) {
            setError(uploadError instanceof Error ? uploadError.message : 'Profielfoto kon niet worden opgeslagen.')
        } finally {
            setSaving(false)
            event.target.value = ''
        }
    }

    return (
        <div className="profile-root">
            <div className="profile-header">
                <h1 className="profile-title">Profiel</h1>
                <p className="profile-note">Je accountgegevens komen rechtstreeks uit je ingelogde sessie.</p>
            </div>

            <div className="profile-grid">
                <section className="profile-card profile-picture-card">
                    <div className="avatar-wrap">
                        {preview ? (
                            <img src={preview} alt="Profielfoto" className="avatar-img" />
                        ) : (
                            <div className="avatar-placeholder">
                                <VectorIcon src={`${assetBase}/Noob Head.png`} alt="Profielfoto" className="avatar-placeholder-icon" />
                            </div>
                        )}
                    </div>

                    <div className="profile-picture-copy">
                        <p className="label-small">Profielfoto</p>
                        <h2 className="account-title">Afbeelding wijzigen</h2>
                        <label className="secondary-button file-pick-button">
                            {saving ? 'Uploaden...' : 'Foto kiezen'}
                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleFileChange}
                                disabled={saving}
                                className="hidden"
                            />
                        </label>
                        {saving && <p className="saving-note">Bezig met opslaan...</p>}
                        {error && <p className="field-error">{error}</p>}
                    </div>
                </section>

                <section className="profile-card">
                    <p className="label-small">Account</p>
                    <h2 className="account-title">{email || 'Onbekend'}</h2>
                </section>
            </div>
        </div>
    )
}
