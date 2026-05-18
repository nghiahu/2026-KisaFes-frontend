import { Navigate } from "react-router-dom"
import type { ReactNode } from "react"
import { useSelector } from "react-redux"
import type { RootState } from "../store"

interface ProtectedRouteProps {
  children: ReactNode
}

export default function ProtectedRoute({
  children,
}: ProtectedRouteProps) {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated)
  const storedUser = localStorage.getItem("user")

  // Nếu không được xác thực trong memory VÀ không có user trong localStorage
  if (!isAuthenticated && !storedUser) {
    return <Navigate to="/login" replace />
  }

  return children
}