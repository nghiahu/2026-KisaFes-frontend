import { Navigate } from "react-router-dom"
import type { ReactNode } from "react"

interface ProtectedRouteProps {
  children: ReactNode
}

export default function ProtectedRoute({
  children,
}: ProtectedRouteProps) {
  const user = localStorage.getItem("user")

  // Chưa đăng nhập
  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}