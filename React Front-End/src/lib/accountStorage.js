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
    const token = localStorage.getItem(storageKeys.token)

    return token && token !== 'null' && token !== 'undefined' ? token : null
}
