const storageKeys = {
    token: 'token',
}

export function setCurrentSession(token) {
    localStorage.setItem(storageKeys.token, token)
}

export function clearCurrentSession() {
    localStorage.removeItem(storageKeys.token)
}

export function loadCurrentToken() {
    return localStorage.getItem(storageKeys.token)
}
