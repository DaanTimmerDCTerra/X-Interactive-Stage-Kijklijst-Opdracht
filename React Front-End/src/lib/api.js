import { API } from './constants'

const maxServerErrorLength = 220
const htmlTitleRegex = /<title>(.*?)<\/title>/is
const htmlScriptRegex = /<script[\s\S]*?<\/script>/gi
const htmlStyleRegex = /<style[\s\S]*?<\/style>/gi
const htmlTagRegex = /<[^>]+>/g
const whitespaceRegex = /\s+/g

function truncateMessage(message) {
    return message.length > maxServerErrorLength
        ? `${message.slice(0, maxServerErrorLength)}...`
        : message
}

function formatServerError(raw, status) {
    if (!raw) return `Serverfout (${status}).`

    const trimmed = raw.trim()

    if (trimmed.startsWith('<')) {
        const titleMatch = trimmed.match(htmlTitleRegex)
        if (titleMatch?.[1]) {
            const title = titleMatch[1].replace(whitespaceRegex, ' ').trim()
            return truncateMessage(title)
        }

        const textOnly = trimmed
            .replace(htmlScriptRegex, '')
            .replace(htmlStyleRegex, '')
            .replace(htmlTagRegex, ' ')
            .replace(whitespaceRegex, ' ')
            .trim()

        if (textOnly) {
            return truncateMessage(textOnly)
        }

        return `Serverfout (${status}) met HTML-response.`
    }

    return truncateMessage(trimmed)
}

export async function requestJson(url, options = {}) {
    const response = await fetch(url, options)
    const raw = await response.text()

    let data = null
    if (raw) {
        try {
            data = JSON.parse(raw)
        } catch {
            data = null
        }
    }

    if (!response.ok) {
        throw new Error(data?.error || data?.message || formatServerError(raw, response.status))
    }

    return data
}

export function requestApi(path, options = {}) {
    return requestJson(`${API}${path}`, options)
}

export function requestAuthApi(token, path, options = {}) {
    return requestApi(path, {
        ...options,
        headers: {
            ...(options.headers ?? {}),
            Authorization: `Bearer ${token}`,
        },
    })
}

export { formatServerError }
