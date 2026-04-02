import { useNavigate } from 'react-router-dom'

export function LandingPage() {
  const navigate = useNavigate()

  const quickStartCards = [
    {
      title: 'Map the work',
      description: 'Break a project into nodes, dependencies, and delivery risks without losing the big picture.',
    },
    {
      title: 'Estimate with ranges',
      description: 'Use expected averages and percentiles to see realistic outcomes instead of one fake certainty.',
    },
    {
      title: 'Stress-test the plan',
      description: 'Assign people, inspect timelines, and find schedule pressure before execution starts.',
    },
  ]

  const sampleNodes = [
    { label: 'Launch Plan', accent: 'bg-amber-200 text-amber-950', detail: 'Expected avg 18d' },
    { label: 'Landing Page', accent: 'bg-emerald-200 text-emerald-950', detail: 'P30 4d  P95 9d' },
    { label: 'Onboarding Flow', accent: 'bg-sky-200 text-sky-950', detail: '3 contributors' },
    { label: 'QA Checks', accent: 'bg-rose-200 text-rose-950', detail: 'Timeline ready' },
  ]

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.24),_transparent_28%),linear-gradient(180deg,_#fffdf8_0%,_#f3f6fb_48%,_#eef2f7_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Planning Assistant</p>
            <h1 className="mt-2 font-serif text-3xl leading-tight text-slate-950 sm:text-4xl">
              Plan work with probabilities, not wishful thinking.
            </h1>
          </div>
          <button
            onClick={() => navigate('/projects')}
            className="rounded-full border border-slate-300 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-white"
          >
            Open projects
          </button>
        </header>

        <main className="grid flex-1 gap-10 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <section className="flex flex-col gap-8">
            <div className="max-w-2xl">
              <p className="inline-flex rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-900">
                Quick start
              </p>
              <p className="mt-5 max-w-xl text-lg leading-8 text-slate-700">
                Build a task graph, attach realistic estimates, and understand the timeline before the project starts slipping.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => navigate('/projects/new')}
                className="rounded-2xl bg-slate-950 px-6 py-3 text-base font-semibold text-white transition hover:bg-slate-800"
              >
                Start new project
              </button>
              <button
                onClick={() => navigate('/projects/new?template=sample')}
                className="rounded-2xl border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
              >
                Try sample
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {quickStartCards.map((card, index) => (
                <div key={card.title} className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_16px_50px_rgba(15,23,42,0.08)] backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">0{index + 1}</p>
                  <h2 className="mt-3 text-lg font-semibold text-slate-950">{card.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="relative">
            <div className="absolute -left-4 top-6 hidden h-28 w-28 rounded-full bg-amber-200/60 blur-3xl sm:block" />
            <div className="absolute -right-6 bottom-2 hidden h-32 w-32 rounded-full bg-sky-200/60 blur-3xl sm:block" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-slate-950 p-6 text-white shadow-[0_26px_90px_rgba(15,23,42,0.26)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Preview</p>
                  <h2 className="mt-2 text-2xl font-semibold">From rough idea to executable plan</h2>
                </div>
                <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">
                  Local-first
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                {sampleNodes.map((node) => (
                  <div key={node.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{node.label}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{node.detail}</p>
                      </div>
                      <div className={`rounded-full px-3 py-1 text-xs font-semibold ${node.accent}`}>Node</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Expected avg</p>
                  <p className="mt-2 text-3xl font-semibold text-white">18d</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Optimistic</p>
                  <p className="mt-2 text-xl font-semibold text-emerald-300">13d</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Worst</p>
                  <p className="mt-2 text-xl font-semibold text-rose-300">29d</p>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
