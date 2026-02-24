import type { FormEvent } from 'react'
import { LOGIN_CONTENT } from '../data/mockData'

export interface LoginFormProps {
  readonly email: string
  readonly password: string
  readonly showPassword: boolean
  readonly isLoading: boolean
  readonly error: string | null
  onEmailChange: (v: string) => void
  onPasswordChange: (v: string) => void
  onTogglePassword: () => void
  onSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void>
}

export default function LoginForm({
  email,
  password,
  showPassword,
  isLoading,
  error,
  onEmailChange,
  onPasswordChange,
  onTogglePassword,
  onSubmit,
}: LoginFormProps) {
  const { form, footer } = LOGIN_CONTENT

  return (
    <div className="w-full max-w-[420px] flex flex-col gap-8">
      {/* Heading */}
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold text-slate">{form.headline}</h2>
        <p className="text-muted text-base">{form.subheadline}</p>
      </div>

      {/* Form */}
      <form className="flex flex-col gap-5" onSubmit={onSubmit} noValidate>
        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label
            className="text-sm font-semibold text-slate"
            htmlFor="email"
          >
            {form.emailLabel}
          </label>
          <div className="relative flex items-center">
            <span
              className="absolute left-3 text-stone material-symbols-outlined"
              style={{ fontSize: 20 }}
            >
              mail
            </span>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              placeholder={form.emailPlaceholder}
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded border border-border bg-white text-slate placeholder:text-stone text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <label
              className="text-sm font-semibold text-slate"
              htmlFor="password"
            >
              {form.passwordLabel}
            </label>
            <a
              href="#"
              className="text-xs font-medium text-primary hover:text-primary-dark transition-colors"
            >
              {form.forgotPasswordText}
            </a>
          </div>
          <div className="relative flex items-center">
            <span
              className="absolute left-3 text-stone material-symbols-outlined"
              style={{ fontSize: 20 }}
            >
              lock
            </span>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              placeholder={form.passwordPlaceholder}
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              className="w-full pl-10 pr-10 py-3 rounded border border-border bg-white text-slate placeholder:text-stone text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
            <button
              type="button"
              onClick={onTogglePassword}
              className="absolute right-3 text-stone hover:text-muted focus:outline-none transition-colors"
              aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 20 }}
              >
                {showPassword ? 'visibility' : 'visibility_off'}
              </span>
            </button>
          </div>
        </div>

        {/* Error message */}
        {error !== null && (
          <p className="text-sm text-priority-critical" role="alert">
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="mt-4 w-full btn-primary py-3 gap-2 group disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span
              className="material-symbols-outlined animate-spin text-[18px]"
            >
              progress_activity
            </span>
          ) : (
            <>
              <span>{form.submitText}</span>
              <span
                className="material-symbols-outlined group-hover:translate-x-0.5 transition-transform text-[18px]"
              >
                arrow_forward
              </span>
            </>
          )}
        </button>
      </form>

      {/* Footer */}
      <div className="pt-6 border-t border-border text-center">
        <p className="text-stone text-xs">{footer.copyright}</p>
        <div className="mt-2 flex justify-center gap-4 text-xs text-stone">
          {footer.links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="hover:text-primary transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
