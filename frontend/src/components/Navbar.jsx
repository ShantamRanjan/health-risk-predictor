import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../api/auth.jsx'

const links = [
  { to: '/', label: 'Dashboard', icon: '⊞' },
  { to: '/predict', label: 'Predict', icon: '◎' },
  { to: '/reports', label: 'Reports', icon: '⎙' },
  { to: '/chat', label: 'Chat', icon: '✦' },
  { to: '/history', label: 'History', icon: '⌚' },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const [open, setOpen] = useState(false)

  // Close menu on route change
  useEffect(() => { setOpen(false) }, [loc.pathname])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  function onLogout() {
    setOpen(false)
    logout()
    nav('/login')
  }

  return (
    <header className="glass-nav sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 sm:gap-2.5 group">
          <span className="grid place-items-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-brand-gradient text-white shadow-soft text-base sm:text-lg group-hover:scale-105 transition-transform">
            ✚
          </span>
          <span className="font-display font-extrabold text-base sm:text-lg leading-none">
            HealthRisk<span className="text-brand-600"> AI</span>
          </span>
        </Link>

        {user ? (
          <>
            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              <div className="flex items-center gap-0.5 mr-2">
                {links.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    end={l.to === '/'}
                    className={({ isActive }) =>
                      `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100/70'
                      }`
                    }
                  >
                    <span className="text-xs opacity-70">{l.icon}</span>
                    {l.label}
                  </NavLink>
                ))}
              </div>
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <Link to="/profile" className="hidden lg:flex items-center gap-2 hover:bg-slate-100/70 rounded-lg px-2 py-1 transition-colors" title="Edit profile">
                  <div className="w-8 h-8 rounded-full bg-brand-gradient grid place-items-center text-white text-xs font-bold">
                    {(user.full_name || user.email)[0].toUpperCase()}
                  </div>
                  <span className="text-xs text-slate-600 max-w-[120px] truncate">
                    {user.full_name || user.email}
                  </span>
                </Link>
                <button onClick={onLogout} className="btn-ghost text-xs">Logout</button>
              </div>
            </nav>

            {/* Mobile: avatar + hamburger */}
            <div className="flex md:hidden items-center gap-2">
              <Link to="/profile" aria-label="Profile" className="w-8 h-8 rounded-full bg-brand-gradient grid place-items-center text-white text-xs font-bold hover:scale-105 transition-transform">
                {(user.full_name || user.email)[0].toUpperCase()}
              </Link>
              <button
                onClick={() => setOpen((v) => !v)}
                aria-label="Toggle menu"
                className="w-10 h-10 grid place-items-center rounded-lg hover:bg-slate-100 active:bg-slate-200 transition-colors"
              >
                <span className="relative w-5 h-5 block">
                  <span className={`absolute left-0 top-1 w-5 h-0.5 bg-slate-700 rounded transition-transform duration-200 ${open ? 'translate-y-1.5 rotate-45' : ''}`} />
                  <span className={`absolute left-0 top-2.5 w-5 h-0.5 bg-slate-700 rounded transition-opacity duration-200 ${open ? 'opacity-0' : ''}`} />
                  <span className={`absolute left-0 top-4 w-5 h-0.5 bg-slate-700 rounded transition-transform duration-200 ${open ? '-translate-y-1.5 -rotate-45' : ''}`} />
                </span>
              </button>
            </div>
          </>
        ) : (
          <nav className="flex items-center gap-2">
            <NavLink to="/login" className="btn-secondary text-xs sm:text-sm px-3 sm:px-4">Login</NavLink>
            <NavLink to="/signup" className="btn-primary text-xs sm:text-sm px-3 sm:px-4">Get started</NavLink>
          </nav>
        )}
      </div>

      {/* Mobile slide-down menu */}
      {user && (
        <>
          <div
            className={`md:hidden fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-20 transition-opacity duration-200 ${
              open ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onClick={() => setOpen(false)}
          />
          <div
            className={`md:hidden absolute top-14 left-0 right-0 bg-white border-b border-slate-200 shadow-card z-30 transition-all duration-200 ${
              open ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
            }`}
          >
            <div className="max-w-6xl mx-auto px-4 py-3 space-y-1">
              <Link to="/profile" className="px-3 pb-2 pt-1 mb-1 border-b border-slate-100 flex items-center gap-2 hover:bg-slate-50 rounded-lg">
                <div className="w-9 h-9 rounded-full bg-brand-gradient grid place-items-center text-white text-sm font-bold">
                  {(user.full_name || user.email)[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{user.full_name || 'Welcome'}</div>
                  <div className="text-xs text-slate-500 truncate">Tap to edit profile</div>
                </div>
                <span className="text-slate-400">›</span>
              </Link>
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-50'
                    }`
                  }
                >
                  <span className="text-base w-5 text-center opacity-70">{l.icon}</span>
                  {l.label}
                </NavLink>
              ))}
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <span className="text-base w-5 text-center opacity-70">⏻</span>
                Logout
              </button>
            </div>
          </div>
        </>
      )}
    </header>
  )
}
