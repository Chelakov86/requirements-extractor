import { useState, type FormEvent } from 'react'

export interface UseLoginReturn {
  readonly email: string
  readonly password: string
  readonly showPassword: boolean
  readonly isLoading: boolean
  readonly error: string | null
  setEmail: (v: string) => void
  setPassword: (v: string) => void
  togglePasswordVisibility: () => void
  handleSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void>
}

export function useLogin(): UseLoginReturn {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function togglePasswordVisibility() {
    setShowPassword((prev) => !prev)
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('username', email)
      params.append('password', password)
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params,
      })
      if (!response.ok) {
        setError('Ungültige E-Mail-Adresse oder Passwort.')
        return
      }
      const data = (await response.json()) as { access_token: string }
      localStorage.setItem('token', data.access_token)
      window.location.href = '/projects'
    } catch {
      setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    email,
    password,
    showPassword,
    isLoading,
    error,
    setEmail,
    setPassword,
    togglePasswordVisibility,
    handleSubmit,
  }
}
