import { useNavigate } from 'react-router-dom'

export function LandingPageV2() {
  const navigate = useNavigate()

  const proofPoints = [
    'Map work as a graph, not a checklist.',
    'Show the expected average, not one fake number.',
    'See timeline pressure before the team absorbs it.',
  ]

  const estimateMarks = [
    { label: 'Optimistic', value: '13d', tone: 'text-emerald-800' },
    { label: 'Expected avg', value: '18d', tone: 'text-stone-950' },
    { label: 'Worst case', value: '29d', tone: 'text-rose-800' },
  ]

  return (
    <div className="min-h-screen overflow-hidden bg-[#f6ead8] text-stone-900">
      <div className="relative min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.72),_transparent_30%),radial-gradient(circle_at_82%_18%,_rgba(252,211,77,0.34),_transparent_22%),linear-gradient(180deg,_#f6ead8_0%,_#f1e3cf_48%,_#eadbc4_100%)]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[-8%] top-[12%] h-72 w-72 rounded-full bg-white/40 blur-3xl" />
          <div className="absolute right-[-6%] top-[8%] h-80 w-80 rounded-full bg-amber-200/50 blur-3xl" />
          <div className="absolute bottom-[-10%] left-[18%] h-72 w-72 rounded-full bg-rose-200/30 blur-3xl" />
        </div>

        <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6 sm:px-8 lg:px-10">
          <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-500">Planning Assistant</p>
            <p className="mt-2 text-sm text-stone-600">A calmer way to see whether the plan is honest.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/projects')}
              className="rounded-full border border-stone-300/80 bg-white/70 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:bg-white"
            >
              Open projects
            </button>
          </div>
          </header>

          <main className="flex flex-1 items-center py-8 sm:py-10">
            <section className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
              <div className="flex flex-col justify-between gap-8">
                <div className="max-w-3xl">
                  <p className="inline-flex rounded-full border border-stone-300/70 bg-white/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-stone-700">
                    Warm truth, not optimistic fiction
                  </p>
                  <h1 className="mt-6 max-w-3xl text-[3.25rem] font-semibold leading-[0.96] tracking-[-0.055em] text-stone-950 sm:text-[4.6rem] lg:text-[5.6rem]">
                    Planning that tells you the hard part before delivery does.
                  </h1>
                  <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-700 sm:text-xl">
                    Build the work as a graph, estimate the uncertainty directly, and get a schedule you can discuss without pretending the risk is not there.
                  </p>
                </div>

                <div className="grid gap-4 rounded-[2rem] border border-stone-300/60 bg-white/55 p-5 shadow-[0_20px_80px_rgba(68,64,60,0.08)] backdrop-blur-sm sm:grid-cols-[1.2fr_0.8fr]">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">What you get</p>
                    <div className="mt-4 space-y-3">
                      {proofPoints.map((point) => (
                        <div key={point} className="flex items-start gap-3 text-sm leading-6 text-stone-700 sm:text-[15px]">
                          <span className="mt-2 h-2 w-2 rounded-full bg-amber-500" />
                          <span>{point}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col justify-between gap-4 rounded-[1.5rem] bg-stone-950 p-5 text-stone-50">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">Quick start</p>
                      <p className="mt-3 text-sm leading-6 text-stone-300">
                        Start blank or open a sample draft with estimates, dependencies, and a timeline shape already in place.
                      </p>
                    </div>
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={() => navigate('/projects/new')}
                        className="rounded-[1.1rem] bg-amber-300 px-5 py-3 text-base font-semibold text-amber-950 transition hover:bg-amber-200"
                      >
                        Start new project
                      </button>
                      <button
                        onClick={() => navigate('/projects/new?template=sample')}
                        className="rounded-[1.1rem] border border-white/15 bg-white/8 px-5 py-3 text-base font-semibold text-stone-50 transition hover:bg-white/12"
                      >
                        Try sample
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-stone-600">
                  <button
                    onClick={() => navigate('/landing-v1')}
                    className="font-medium underline decoration-stone-400 underline-offset-4 transition hover:text-stone-900"
                  >
                    Compare with previous version
                  </button>
                  <span className="text-stone-400">Local-first. No account wall.</span>
                </div>
              </div>

              <div className="relative min-h-[26rem] lg:min-h-[38rem]">
                <div className="absolute inset-0 rounded-[2.5rem] border border-stone-300/60 bg-[linear-gradient(160deg,_rgba(255,255,255,0.5)_0%,_rgba(255,248,235,0.2)_100%)] shadow-[0_30px_120px_rgba(68,64,60,0.14)]" />
                <div className="absolute left-[7%] top-[7%] w-[63%] rounded-[2rem] border border-stone-300/70 bg-white/85 p-5 shadow-[0_18px_60px_rgba(68,64,60,0.1)] backdrop-blur-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Project sketch</p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-stone-950">Website relaunch</h2>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    A few connected tasks, clear uncertainty, and one number the team can actually discuss.
                  </p>

                  <div className="mt-5 space-y-3">
                    <div className="rounded-[1.4rem] border border-stone-200 bg-stone-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Node</p>
                      <div className="mt-2 flex items-end justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-stone-900">Landing page build</p>
                          <p className="mt-1 text-[12px] uppercase tracking-[0.16em] text-stone-500">Expected avg</p>
                        </div>
                        <p className="text-4xl font-semibold tracking-[-0.05em] text-stone-950">18d</p>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      {estimateMarks.map((mark) => (
                        <div key={mark.label} className="rounded-[1.25rem] border border-stone-200 bg-white px-3 py-4">
                          <p className="text-[11px] uppercase tracking-[0.16em] text-stone-500">{mark.label}</p>
                          <p className={`mt-2 text-2xl font-semibold ${mark.tone}`}>{mark.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="absolute right-[6%] top-[18%] w-[34%] rounded-[1.8rem] bg-stone-950 p-5 text-stone-50 shadow-[0_24px_80px_rgba(28,25,23,0.28)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">Team load</p>
                  <p className="mt-4 text-4xl font-semibold tracking-[-0.05em]">2</p>
                  <p className="mt-1 text-sm text-stone-300">contributors assigned</p>
                </div>

                <div className="absolute bottom-[8%] left-[14%] w-[70%] rounded-[2rem] border border-stone-300/70 bg-[#f7efe2] p-5 shadow-[0_18px_60px_rgba(68,64,60,0.12)]">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Timeline pressure</p>
                      <p className="mt-2 text-sm leading-6 text-stone-700">
                        Work stays readable when estimates, dependencies, and staffing sit in the same view.
                      </p>
                    </div>
                    <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">
                      Visible early
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    <div>
                      <div className="mb-2 flex items-center justify-between text-sm text-stone-600">
                        <span className="font-medium text-stone-800">Research</span>
                        <span>Days 1-3</span>
                      </div>
                      <div className="h-3 rounded-full bg-stone-200">
                        <div className="h-3 w-[22%] rounded-full bg-stone-900" />
                      </div>
                    </div>
                    <div>
                      <div className="mb-2 flex items-center justify-between text-sm text-stone-600">
                        <span className="font-medium text-stone-800">Build</span>
                        <span>Days 4-14</span>
                      </div>
                      <div className="h-3 rounded-full bg-stone-200">
                        <div className="h-3 w-[56%] rounded-full bg-amber-400" />
                      </div>
                    </div>
                    <div>
                      <div className="mb-2 flex items-center justify-between text-sm text-stone-600">
                        <span className="font-medium text-stone-800">Review</span>
                        <span>Days 15-18</span>
                      </div>
                      <div className="h-3 rounded-full bg-stone-200">
                        <div className="h-3 w-[24%] rounded-full bg-sky-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}
