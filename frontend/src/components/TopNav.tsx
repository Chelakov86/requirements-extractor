export interface TopNavProps {
  readonly userInitials?: string
}

export default function TopNav({ userInitials = 'AS' }: TopNavProps) {
  return (
    <nav className="nav-bar shrink-0 z-20 justify-between">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-white text-[24px]">
          analytics
        </span>
        <h1 className="text-white text-lg font-bold tracking-tight">
          Requirements Extractor
        </h1>
      </div>
      <button
        className="flex items-center gap-2 cursor-pointer group"
        aria-label="Benutzermenü"
      >
        <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold border border-white/10">
          {userInitials}
        </div>
        <span className="material-symbols-outlined text-white/70 group-hover:text-white transition-colors text-[20px]">
          expand_more
        </span>
      </button>
    </nav>
  )
}
