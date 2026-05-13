export interface User {
  id: string
  username: string
  fullname: string
  email: string
  avatarUrl: string | null
  bio?: string
  isPublic?: boolean
  roles: string[]
}