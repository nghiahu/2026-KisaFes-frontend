import Footer from '../components/landing/Footer'
import Header from '../components/landing/Header'

export default function WelcomeBack() {
  return (
    <div className="min-h-screen bg-slate-100">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl">
          <div className="px-6 py-10 sm:px-10 sm:py-14">
            <div className="space-y-4">
              <p className="text-sm font-medium uppercase tracking-[0.35em] text-blue-600">Welcome back</p>
              <h1 className="text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl">
                Welcome back, <span className="text-blue-600">nghĩa.</span>
              </h1>
              <p className="max-w-2xl text-lg text-slate-600">
                Pick up where you left off in <span className="font-semibold text-slate-900">Kisa</span>
              </p>
            </div>

            <div className="mt-12 rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-lime-300 text-3xl font-bold text-slate-900">
                    Ng
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-slate-900">nghia120425</p>
                    <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                        NN
                      </span>
                      <span>nghĩa Ngô</span>
                    </div>
                  </div>
                </div>

                <a
                  href="#"
                  className="inline-flex items-center justify-center rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-amber-400"
                >
                  Go to KisaFres
                </a>
              </div>
            </div>

            <div className="mt-16 flex flex-col items-center gap-4 text-center">
              <p className="text-base text-slate-700">Want to find out more about Kisa?</p>
              <a
                href="#"
                className="inline-flex items-center justify-center rounded-full border border-slate-900 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Explore features
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer/>
    </div>
  )
}
