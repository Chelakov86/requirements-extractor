import LoginLeftPanel from '../components/LoginLeftPanel'
import LoginForm from '../components/LoginForm'
import { useLogin } from '../hooks/useLogin'

export default function LoginPage() {
  const {
    email,
    password,
    showPassword,
    isLoading,
    error,
    setEmail,
    setPassword,
    togglePasswordVisibility,
    handleSubmit,
  } = useLogin()

  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden">
      <LoginLeftPanel />

      {/* Right panel */}
      <div className="w-full md:w-[60%] flex flex-col items-center justify-center p-8 lg:p-16 bg-canvas">
        {/* Mobile logo (hidden on md+) */}
        <div className="md:hidden w-full max-w-[420px] mb-6 flex items-center gap-2 text-slate">
          <span className="material-symbols-outlined text-primary text-[28px]">
            topic
          </span>
          <span className="font-bold text-lg">Requirements Extractor</span>
        </div>

        <LoginForm
          email={email}
          password={password}
          showPassword={showPassword}
          isLoading={isLoading}
          error={error}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onTogglePassword={togglePasswordVisibility}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  )
}
