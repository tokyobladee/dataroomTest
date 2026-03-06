import { create } from "zustand"

interface User {
  email: string
  name: string
}

interface AuthStore {
  user: User | null
  login: (email: string, password: string) => { error?: string }
  logout: () => void
}

const STORAGE_KEY = "auth-user"

function loadUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

function deriveNameFromEmail(email: string): string {
  return email
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: loadUser(),

  login: (email, password) => {
    if (!email.trim() || !password.trim()) {
      return { error: "Email and password are required" }
    }
    const user: User = {
      email: email.trim().toLowerCase(),
      name: deriveNameFromEmail(email.trim()),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    set({ user })
    return {}
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY)
    set({ user: null })
  },
}))
