import { useEffect, useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useDispatch } from "react-redux"
import HeaderNav from "./HeaderNav"
import { Icons } from "../../assets/icons"
import type { User } from "../../types/user.interface"
import defaultAvatar from "../../assets/avatar_def_man.png"
import { logout } from "../../store/slices/authSlice"
import { authService } from "../../services/auth.service"

const SearchIcon = Icons.search

export default function Header() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [user, setUser] = useState<User | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const dispatch = useDispatch()

  useEffect(() => {
    const userData = localStorage.getItem("user")

    if (userData) {
      setUser(JSON.parse(userData))
    } else {
      setUser(null)
    }
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [dropdownOpen])

  const handleLogout = async () => {
    try {
      await authService.logout()
    } catch {
    }
    dispatch(logout())
    setUser(null)
    setDropdownOpen(false)
    navigate("/")
  }

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r bg-white/90 backdrop-blur-sm py-2">
      <nav className="container-custom flex items-center justify-between px-6 py-6">
        
        {/* Logo & Brand */}
        <a href="/" className="flex items-center gap-12">
          <div className="flex items-center gap-3">
            <img
              src="/logo_kisa.png"
              alt="KisaFres Logo"
              className="w-16 h-16"
            />

            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              KisaFres
            </h1>
          </div>

          <HeaderNav />
        </a>

        {/* Search Action */}
        <div className="flex items-center gap-4">
          {searchOpen ? (
            <div className="flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-2 shadow-sm transition-all duration-300 lg:w-[32%] w-[32vw] max-w-[420px] min-w-[240px]">
              <SearchIcon className="h-5 w-5 text-gray-500" />

              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                autoFocus
                placeholder="Search..."
                className="w-full bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
              />

              <button
                type="button"
                onClick={() => {
                  setSearchOpen(false)
                  setSearchTerm("")
                }}
                className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
              >
                ×
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-200 bg-white text-blue-600 shadow-sm transition hover:border-blue-400 hover:shadow-md"
            >
              <SearchIcon className="h-5 w-5" />
            </button>
          )}

          <span className="hidden h-6 w-px bg-slate-200 sm:block" />

          {user ? (
          <div className="flex items-center gap-3">
            <a href="#" className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
              Go to KisaFres
            </a>

            {/* User Avatar + Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-3 rounded-2xl p-1 border border-slate-200 bg-white px-3 shadow-sm cursor-pointer transition hover:border-blue-300 hover:shadow-md"
              >
                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-orange-500">
                  <img src={user.avatarUrl || defaultAvatar} alt="User Avatar" className="h-full w-full object-cover"/>
                </div>
                <span className="hidden text-sm font-semibold text-slate-700 sm:inline">
                  {user.fullname}
                </span>
                <svg
                  className={`hidden sm:block h-4 w-4 text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white py-2 shadow-lg animate-fade-in z-50">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      {user.email}
                    </p>
                  </div>
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setDropdownOpen(false)
                        navigate("/login")
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                    >
                      Switch Account
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDropdownOpen(false)
                        navigate("/profile")
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                    >
                      Profile
                    </button>
                  </div>

                  {/* Logout */}
                  <div className="border-t border-slate-100 pt-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition hover:bg-red-50"
                    >
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <a
            href="/login"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition duration-200"
          >
            Sign in
          </a>
        )}
        </div>
      </nav>
    </header>
  )
}
