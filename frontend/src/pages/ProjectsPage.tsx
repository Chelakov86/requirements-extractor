import TopNav from '../components/TopNav'
import ProjectCard from '../components/ProjectCard'
import ProjectsEmptyState from '../components/ProjectsEmptyState'
import { useProjects } from '../hooks/useProjects'
import { PROJECTS_PAGE_CONTENT } from '../data/mockData'

export default function ProjectsPage() {
  const { projects, createProject, deleteProject } = useProjects()
  const content = PROJECTS_PAGE_CONTENT

  function handleNewProject() {
    // TODO: open create-project modal/dialog
    createProject('Neues Projekt', '')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />

      {/* Page header */}
      <header className="bg-white border-b border-border px-6 lg:px-40 py-6 shrink-0">
        <div className="max-w-[1200px] mx-auto w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-[28px] font-bold text-slate leading-tight">
            {content.pageTitle}
          </h2>
          <button
            onClick={handleNewProject}
            className="btn-primary h-10 px-6 gap-2 text-sm"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span>{content.newProjectLabel}</span>
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 bg-canvas px-6 lg:px-40 py-10 overflow-y-auto">
        <div className="max-w-[1200px] mx-auto w-full flex flex-col gap-12">

          {/* Active projects section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate">
                {content.activeSectionTitle}
              </h3>
              <button className="text-muted hover:text-primary font-medium flex items-center gap-1 text-sm transition-colors">
                <span className="material-symbols-outlined text-[18px]">sort</span>
                {content.sortLabel}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  {...project}
                  onClick={(id) => console.log('open project', id)}
                  onMenuClick={(id) => deleteProject(id)}
                />
              ))}
            </div>
          </section>

          {/* Archive empty state */}
          <section>
            <div className="mb-4 text-xs font-bold text-stone uppercase tracking-wider">
              Archiv
            </div>
            <ProjectsEmptyState
              heading={content.emptyArchive.heading}
              body={content.emptyArchive.body}
              ctaLabel={content.emptyArchive.ctaLabel}
              onCtaClick={handleNewProject}
            />
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-border py-6 text-center">
        <p className="text-xs text-stone">{content.footer}</p>
      </footer>
    </div>
  )
}
