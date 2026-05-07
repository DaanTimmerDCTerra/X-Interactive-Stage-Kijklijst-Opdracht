export const API = 'https://127.0.0.1:8000/api'
export const assetBase = '/VectorPack'
export const getImageUrl = (path) => path ? `${API.replace('/api', '')}${path}` : null
