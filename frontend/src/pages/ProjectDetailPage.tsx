import TopNav from '../components/TopNav'

export default function ProjectDetailPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      <main className="flex-1 bg-canvas flex items-center justify-center">
        <p className="text-muted text-sm">Projekt wird geladen…</p>
      </main>
    </div>
  )
}
