import { createContext, useContext, useEffect, useState } from 'react'
import api from './client'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }
    api
      .get('/auth/me')
      .then((r) => setUser(r.data))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false))
  }, [])

  async function login(email, password) {
    const form = new URLSearchParams()
    form.set('username', email)
    form.set('password', password)
    const r = await api.post('/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    localStorage.setItem('token', r.data.access_token)
    setUser(r.data.user)
  }

  async function signup(payload) {
    const r = await api.post('/auth/signup', payload)
    localStorage.setItem('token', r.data.access_token)
    setUser(r.data.user)
  }

  async function updateProfile(patch) {
    const r = await api.put('/auth/me', patch)
    setUser(r.data)
    return r.data
  }

  async function refreshUser() {
    const r = await api.get('/auth/me')
    setUser(r.data)
    return r.data
  }

  function logout() {
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <AuthCtx.Provider value={{ user, loading, login, signup, logout, updateProfile, refreshUser }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
