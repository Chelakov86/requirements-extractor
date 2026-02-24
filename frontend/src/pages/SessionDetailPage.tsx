import { useState } from 'react'
import SessionHeader, { type SessionTab } from '../components/SessionHeader'
import UserStoryCard from '../components/UserStoryCard'
import NFRCard from '../components/NFRCard'
import OpenQuestionCard from '../components/OpenQuestionCard'
import { MOCK_SESSION } from '../data/mockData'

const PAGE_SIZE = 10

export default function SessionDetailPage() {
  const [activeTab, setActiveTab] = useState<SessionTab>('user-stories')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const session = MOCK_SESSION

  const activeStories = session.user_stories.filter((s) => !s.is_deleted)
  const activeNFRs = session.nfrs.filter((n) => !n.is_deleted)
  const activeQuestions = session.open_questions.filter((q) => !q.is_deleted)

  const counts = {
    userStories: activeStories.length,
    nfrs: activeNFRs.length,
    openQuestions: activeQuestions.length,
  }

  function handleTabChange(tab: SessionTab) {
    setActiveTab(tab)
    setVisibleCount(PAGE_SIZE)
  }

  const totalForTab =
    activeTab === 'user-stories'
      ? activeStories.length
      : activeTab === 'nfrs'
        ? activeNFRs.length
        : activeQuestions.length

  const hasMore = visibleCount < totalForTab

  return (
    <div className="flex flex-col flex-1">
      <SessionHeader
        projectName={session.project_name}
        sessionName={session.session_name}
        sessionId={session.id}
        counts={counts}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onSave={() => console.log('save')}
        onExport={(format) => console.log('export', format)}
      />

      <main className="flex-1 p-6 md:p-10 lg:px-20">
        <div className="max-w-[1100px] mx-auto flex flex-col gap-3">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">
              Ergebnisse
            </span>
            <div className="flex gap-1">
              <button
                className="p-1 text-stone hover:text-primary transition-colors rounded"
                aria-label="Filtern"
              >
                <span className="material-symbols-outlined text-[20px]">filter_list</span>
              </button>
              <button
                className="p-1 text-stone hover:text-primary transition-colors rounded"
                aria-label="Ansicht wechseln"
              >
                <span className="material-symbols-outlined text-[20px]">view_agenda</span>
              </button>
            </div>
          </div>

          {/* User Story cards */}
          {activeTab === 'user-stories' &&
            activeStories.slice(0, visibleCount).map((story) => (
              <UserStoryCard
                key={story.id}
                story={story}
                onEdit={(id) => console.log('edit story', id)}
                onDelete={(id) => console.log('delete story', id)}
              />
            ))}

          {/* NFR cards */}
          {activeTab === 'nfrs' &&
            activeNFRs.slice(0, visibleCount).map((nfr) => (
              <NFRCard
                key={nfr.id}
                nfr={nfr}
                onEdit={(id) => console.log('edit nfr', id)}
                onDelete={(id) => console.log('delete nfr', id)}
              />
            ))}

          {/* Open question cards */}
          {activeTab === 'open-questions' &&
            activeQuestions.slice(0, visibleCount).map((q) => (
              <OpenQuestionCard
                key={q.id}
                question={q}
                onEdit={(id) => console.log('edit question', id)}
                onDelete={(id) => console.log('delete question', id)}
              />
            ))}

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center mt-6 mb-10">
              <button
                className="text-sm font-bold text-primary hover:text-primary-dark flex items-center gap-2 px-4 py-2 rounded hover:bg-green-50 transition-colors"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              >
                <span>Weitere Laden</span>
                <span className="material-symbols-outlined text-[20px]">expand_more</span>
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
