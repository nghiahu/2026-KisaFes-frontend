import { RouterProvider } from 'react-router-dom'
import { router } from './routes'
import { useAuthInitialize } from './hooks/useAuthInitialize'
import { useSelector } from 'react-redux'
import type { RootState } from './store'
import { Skeleton } from './components/ui/Skeleton'

export default function App() {
  useAuthInitialize()
  const isInitialized = useSelector((state: RootState) => state.auth.isInitialized)

  if (!isInitialized) {
    return (
      <div className="flex h-screen overflow-hidden bg-slate-50">
        {/* Sidebar skeleton */}
        <div className="w-[220px] shrink-0 bg-white border-r border-slate-200 flex flex-col gap-4 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="w-8 h-8 rounded-lg bg-slate-200" />
            <Skeleton className="h-4 w-24 bg-slate-200" />
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="w-4 h-4 rounded bg-slate-200" />
              <Skeleton className={`h-3 bg-slate-200`} style={{ width: `${50 + i * 10}%` }} />
            </div>
          ))}
        </div>

        {/* Main area skeleton */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Header skeleton */}
          <div className="h-14 border-b border-slate-200 bg-white flex items-center px-6 gap-4 shrink-0">
            <Skeleton className="h-4 w-40 bg-slate-200" />
            <div className="flex-1" />
            <Skeleton className="w-8 h-8 rounded-full bg-slate-200" />
            <Skeleton className="w-8 h-8 rounded-full bg-slate-200" />
          </div>

          {/* Content skeleton */}
          <div className="flex-1 p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-7 w-32 bg-slate-200" />
              <Skeleton className="h-9 w-28 rounded-xl bg-slate-200" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200 flex flex-col gap-4 min-h-[220px]">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-16 rounded-full bg-slate-100" />
                    <Skeleton className="w-6 h-6 rounded bg-slate-100" />
                  </div>
                  <Skeleton className="h-5 w-3/4 bg-slate-200" />
                  <Skeleton className="h-3 w-full bg-slate-100" />
                  <Skeleton className="h-3 w-5/6 bg-slate-100" />
                  <div className="flex-1" />
                  <Skeleton className="h-[5px] w-full rounded-full bg-slate-100" />
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-1.5">
                      {[0,1,2].map(j => <Skeleton key={j} className="w-6 h-6 rounded-full bg-slate-200 border border-white" />)}
                    </div>
                    <Skeleton className="h-3 w-14 bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <RouterProvider router={router} />
}
