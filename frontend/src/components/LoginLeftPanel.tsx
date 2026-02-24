import { LOGIN_CONTENT } from '../data/mockData'

export default function LoginLeftPanel() {
  const { brand } = LOGIN_CONTENT

  return (
    <div className="relative w-full md:w-[40%] flex flex-col justify-center p-12 overflow-hidden bg-slate">
      {/* Geometric grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: [
            'linear-gradient(rgba(15,117,109,0.05) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(15,117,109,0.05) 1px, transparent 1px)',
          ].join(', '),
          backgroundSize: '40px 40px',
        }}
      />
      {/* Gradient vignette */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20 pointer-events-none" />
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 w-full h-px bg-primary/30" />

      {/* Content */}
      <div className="relative z-10 flex flex-col gap-6">
        {/* Logo mark */}
        <div className="mb-4">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow">
            <span className="material-symbols-outlined text-primary text-[28px]">
              topic
            </span>
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-4xl lg:text-5xl font-bold text-white leading-[1.1] tracking-tight">
          Requirements
          <br />
          Extractor
        </h1>

        {/* Teal rule */}
        <div className="h-1 w-16 bg-primary rounded-full" />

        {/* Tagline */}
        <p className="text-xl font-medium text-primary tracking-wide">
          {brand.tagline}
        </p>

        {/* Description */}
        <p className="mt-8 text-stone text-sm max-w-sm leading-relaxed">
          {brand.description}
        </p>
      </div>

      {/* Version stamp */}
      <div className="absolute bottom-6 left-12 right-12 text-stone text-xs">
        {brand.version}
      </div>
    </div>
  )
}
