import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

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
  const { login } = useAuth()
  const navigate = useNavigate()

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
        setError('Email oder Passwort falsch.')
        return
      }
      const data = (await response.json()) as { access_token: string }
      login(data.access_token)
      navigate('/projects', { replace: true })
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
