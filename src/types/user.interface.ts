export interface User {
  id: string
  userName: string
  fullName: string
  email: string
  avatar: string | null
  bio?: string
  isPublic?: boolean
  roles: string[]
}