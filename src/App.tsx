import { RouterProvider } from 'react-router-dom'
import { router } from './routes'
import { useAuthInitialize } from './hooks/useAuthInitialize'
import { useSelector } from 'react-redux'
import type { RootState } from './store'

export default function App() {
  useAuthInitialize()
  const isInitialized = useSelector((state: RootState) => state.auth.isInitialized)

  if (!isInitialized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold animate-pulse">Initializing session...</p>
      </div>
    )
  }

  return <RouterProvider router={router} />
}
