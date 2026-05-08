import { Link, NavLink, useNavigate } from 'react-router-dom'
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

  function onLogout() {
    logout()
    nav('/login')
  }

  return (
    <header className="glass-nav sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-brand-gradient text-white shadow-soft text-lg group-hover:scale-105 transition-transform">
            ✚
          </span>
          <span className="font-display font-extrabold text-lg leading-none">
            HealthRisk<span className="text-brand-600"> AI</span>
          </span>
        </Link>

        {user ? (
          <nav className="flex items-center gap-1">
            <div className="hidden md:flex items-center gap-0.5 mr-2">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-slate-600 hover:bg-slate-100/70'
                    }`
                  }
                >
                  <span className="text-xs opacity-70">{l.icon}</span>
                  {l.label}
                </NavLink>
              ))}
            </div>
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-brand-gradient grid place-items-center text-white text-xs font-bold">
                  {(user.full_name || user.email)[0].toUpperCase()}
                </div>
                <span className="text-xs text-slate-600 max-w-[120px] truncate">
                  {user.full_name || user.email}
                </span>
              </div>
              <button onClick={onLogout} className="btn-ghost text-xs">
                Logout
              </button>
            </div>
          </nav>
        ) : (
          <nav className="flex items-center gap-2">
            <NavLink to="/login" className="btn-secondary">Login</NavLink>
            <NavLink to="/signup" className="btn-primary">Get started</NavLink>
          </nav>
        )}
      </div>
    </header>
  )
}
