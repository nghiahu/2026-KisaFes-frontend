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

  // Nếu không được xác thực, chuyển hướng về trang login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}