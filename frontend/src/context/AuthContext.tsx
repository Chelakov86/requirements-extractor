import { createContext, useContext, useState, type ReactNode } from 'react'

interface AuthContextType {
  isAuthenticated: boolean
  token: string | null
  login: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('access_token'),
  )

  function login(newToken: string) {
    localStorage.setItem('access_token', newToken)
    setToken(newToken)
  }

  function logout() {
    localStorage.removeItem('access_token')
    setToken(null)
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!token, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
