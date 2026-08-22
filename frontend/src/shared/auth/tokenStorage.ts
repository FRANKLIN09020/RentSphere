const TOKEN_KEY = 'rentsphere.token'

export interface TokenStorage {
  getToken(): string | null
  setToken(token: string): void
  removeToken(): void
}

const localStorageStorage: TokenStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  removeToken: () => localStorage.removeItem(TOKEN_KEY),
}

let currentStorage: TokenStorage = localStorageStorage

export function configureTokenStorage(storage: TokenStorage) {
  currentStorage = storage
}

export { currentStorage as tokenStorage }

export const TOKEN_KEY_NAME = TOKEN_KEY
