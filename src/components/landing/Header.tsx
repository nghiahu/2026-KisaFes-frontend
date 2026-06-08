import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import HeaderNav from "./HeaderNav"
import { Icons } from "../../assets/icons"
import type { User } from "../../types/user.interface"
import UserDropdown from "../common/UserDropdown"
import { useLanguage } from "../../contexts/LanguageContext"
const SearchIcon = Icons.search

export default function Header() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [user, setUser] = useState<User | null>(null)
  const { t } = useLanguage()

  useEffect(() => {
    const userData = localStorage.getItem("user")

    if (userData) {
      const raw = JSON.parse(userData)
      setUser({
        ...raw,
        fullName: raw.fullName || raw.fullname || raw.full_name || "",
        userName: raw.userName || raw.username || raw.user_name || "",
        avatar: raw.avatar || raw.avatarUrl || raw.avatar_url || "",
      })
    } else {
      setUser(null)
    }
  }, [])


  return (
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-sm py-2 border-b border-border">
      <nav className="container-custom flex items-center justify-between px-6 py-6">

        {/* Logo & Brand */}
        <div className="flex items-center gap-12">
          <a href="/" className="flex items-center gap-3">
            <img
              src="/logo_kisa.png"
              alt="KisaFres Logo"
              className="w-16 h-16"
            />

            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              KisaFres
            </h1>
          </a>

          <HeaderNav />
        </div>

        {/* Search Action */}
        <div className="flex items-center gap-4">
          {searchOpen ? (
            <div className="flex items-center gap-2 rounded-full border border-blue-200 dark:border-blue-800 bg-background px-3 py-2 shadow-sm transition-all duration-300 lg:w-[32%] w-[32vw] max-w-[420px] min-w-[240px]">
              <SearchIcon className="h-5 w-5 text-gray-500" />

              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                autoFocus
                placeholder={t('landing.header.search')}
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />

              <button
                type="button"
                onClick={() => {
                  setSearchOpen(false)
                  setSearchTerm("")
                }}
                className="rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                ×
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-200 dark:border-blue-800 bg-background text-blue-600 dark:text-blue-400 shadow-sm transition hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md"
            >
              <SearchIcon className="h-5 w-5" />
            </button>
          )}

          <span className="hidden h-6 w-px bg-border sm:block" />

          {user ? (
            <div className="flex items-center gap-3">
              <Link to="/workspace" className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
                {t('landing.header.go_to_app')}
              </Link>

              {/* User Avatar + Dropdown */}
              <UserDropdown user={user} variant="landing" />
            </div>
          ) : (
            <Link
              to="/login"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition duration-200"
            >
              {t('landing.header.sign_in')}
            </Link>
          )}
        </div>
      </nav>
    </header>
  )
}
