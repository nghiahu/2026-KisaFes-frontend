import { RouterProvider } from 'react-router-dom'
import { router } from './routes'
import { useAuthInitialize } from './hooks/useAuthInitialize'

export default function App() {
  useAuthInitialize()

  return <RouterProvider router={router} />
}
