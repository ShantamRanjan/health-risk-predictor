import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../api/auth.jsx'

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/predict', label: 'Predict' },
  { to: '/reports', label: 'Reports' },
  { to: '/chat', label: 'Chat' },
  { to: '/history', label: 'History' },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const nav = useNavigate()

  function onLogout() {
    logout()
    nav('/login')
  }

  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="font-bold text-lg flex items-center gap-2">
          <span className="text-brand-600">⚕</span> HealthRisk AI
        </Link>
        {user ? (
          <nav className="flex items-center gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md text-sm ${
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <button onClick={onLogout} className="ml-2 btn-secondary">
              Logout
            </button>
          </nav>
        ) : (
          <nav className="flex items-center gap-2">
            <NavLink to="/login" className="btn-secondary">Login</NavLink>
            <NavLink to="/signup" className="btn-primary">Sign up</NavLink>
          </nav>
        )}
      </div>
    </header>
  )
}
