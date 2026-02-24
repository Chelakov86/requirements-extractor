import { Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout() {
  const { logout } = useAuth()

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="nav-bar shrink-0 z-20 justify-between">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-white text-[24px]">analytics</span>
          <h1 className="text-white text-lg font-bold tracking-tight">
            Requirements Extractor
          </h1>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm font-semibold"
          aria-label="Abmelden"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span className="hidden sm:inline">Abmelden</span>
        </button>
      </nav>
      <Outlet />
    </div>
  )
}
