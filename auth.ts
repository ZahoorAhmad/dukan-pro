export type AuthUser = {
  id: string
  email: string
  name: string
  account_type: string
  saml_connection_id: string
}

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
export const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || window.location.origin

const TOKEN_KEY = 'auth_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function captureTokenFromURL(): string | null {
  const params = new URLSearchParams(window.location.search)
  const token = params.get('token')
  if (!token) {
    return null
  }

  setToken(token)
  params.delete('token')
  const nextQuery = params.toString()
  const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}${window.location.hash}`
  window.history.replaceState({}, document.title, nextUrl)
  return token
}

export function decodeUser(token: string): AuthUser | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      account_type: payload.account_type,
      saml_connection_id: payload.saml_connection_id,
    }
  } catch {
    return null
  }
}

export async function discoverAndLogin(email: string, domain: string): Promise<string | null> {
  const lookupDomain = email.includes('@') ? email.split('@')[1] : domain
  if (!lookupDomain) {
    return 'Please enter a valid email or domain'
  }

  const response = await fetch(
    `${API_BASE_URL}/api/v1/saml/connections/lookup?domain=${encodeURIComponent(lookupDomain)}`
  )
  const data = await response.json()

  if (data.found && data.sso_endpoint) {
    const returnUrl = encodeURIComponent(FRONTEND_URL)
    window.location.href = `${data.sso_endpoint}?return_url=${returnUrl}`
    return null
  }

  return data.error || 'No SSO configuration found for this domain'
}
