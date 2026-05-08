const configuredApiUrl = import.meta.env.VITE_API_URL || 'https://127.0.0.1:8000/api'

export const API = configuredApiUrl.replace(/\/$/, '')
export const assetBase = '/VectorPack'
export const getImageUrl = (path) => path ? `${API.replace(/\/api$/, '')}${path}` : null
