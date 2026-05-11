import { useState } from "react"
import { useLocation } from "react-router-dom"
import HeaderNav from "./HeaderNav"
import { Icons } from "../../assets/icons"

const SearchIcon = Icons.search

export default function Header() {
  const location = useLocation()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const isWelcome = location.pathname === "/welcome"
  const user = isWelcome ? { name: "nghĩa Ngô", initials: "NN" } : null

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r bg-white/90 backdrop-blur-sm py-2">
      <nav className="container-custom flex items-center justify-between px-6 py-6">
        {/* Logo & Brand */}
        <div className="flex items-center gap-12">
          <div className="flex items-center gap-3">
            <img src="/public/logo_kisa.png" alt="KisaFres Logo" className="w-16 h-16" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              KisaFres
            </h1>
          </div>
            <HeaderNav />
        </div>

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
                aria-label="Close search"
              >
                ×
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-200 bg-white text-blue-600 shadow-sm transition hover:border-blue-400 hover:shadow-md"
              aria-label="Open search"
            >
              <SearchIcon className="h-5 w-5" />
            </button>
          )}

          <span className="hidden h-6 w-px bg-slate-200 sm:block" />

          {user ? (
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Go to KisaFres
              </a>
              <div className="flex items-center gap-3 rounded-2xl p-1 border border-slate-200 bg-white px-3 shadow-sm">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white">
                  {user.initials}
                </div>
                <span className="hidden text-sm font-semibold text-slate-700 sm:inline">
                  {user.name}
                </span>
              </div>
            </div>
          ) : (
            <a href="/login" className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition duration-200">
              Sign in
            </a>
          )}
        </div>
      </nav>
    </header>
  )
}
