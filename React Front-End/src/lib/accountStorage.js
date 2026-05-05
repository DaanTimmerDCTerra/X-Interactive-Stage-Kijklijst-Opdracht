export function loadAccounts() {
    try {
        const raw = localStorage.getItem('accounts')
        return raw ? JSON.parse(raw) : []
    } catch {
        return []
    }
}

export function saveAccounts(accounts) {
    localStorage.setItem('accounts', JSON.stringify(accounts))
}

export function upsertAccount(email, token) {
    const accounts = loadAccounts()
    const index = accounts.findIndex((account) => account.email === email)

    if (index === -1) {
        accounts.push({ email, token })
    } else {
        accounts[index] = { ...accounts[index], email, token }
    }

    saveAccounts(accounts)
}

export function setCurrentSession(token, email) {
    localStorage.setItem('token', token)
    localStorage.setItem('currentEmail', email)
    upsertAccount(email, token)
}

export function clearCurrentSession() {
    localStorage.removeItem('token')
    localStorage.removeItem('currentEmail')
}

export function loadCurrentEmail(token) {
    const storedEmail = localStorage.getItem('currentEmail')
    if (storedEmail) return storedEmail

    const account = loadAccounts().find((entry) => entry.token === token)
    return account?.email ?? ''
}

export function loadProfilePictures() {
    try {
        const raw = localStorage.getItem('profilePictures')
        return raw ? JSON.parse(raw) : {}
    } catch {
        return {}
    }
}

export function getProfilePicture(email) {
    if (!email) return null
    return loadProfilePictures()[email] ?? null
}

export function setProfilePicture(email, profilePicture) {
    const pictures = loadProfilePictures()
    pictures[email] = profilePicture
    localStorage.setItem('profilePictures', JSON.stringify(pictures))
}
