import { useState } from "react"
import { Sun, Moon, Lock } from "lucide-react"
import { useAuthStore } from "@/stores/authStore"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function LoginPage() {
  const { login } = useAuthStore()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [emailError, setEmailError] = useState(false)
  const [passwordError, setPasswordError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  )

  function toggleTheme() {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle("dark", next)
    localStorage.setItem("theme", next ? "dark" : "light")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setEmailError(false)
    setPasswordError(false)
    setIsLoading(true)
    const result = login(email, password)
    if (result.error) {
      setError(result.error)
      setEmailError(!email.trim())
      setPasswordError(!password.trim())
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex justify-end p-4">
        <Button variant="ghost" size="icon" aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"} className="h-8 w-8" onClick={toggleTheme}>
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center mb-8">
            <div className="h-11 w-11 rounded-xl bg-foreground flex items-center justify-center mb-4">
              <Lock className="h-5 w-5 text-background" />
            </div>
            <h1 className="text-2xl font-semibold">Dataroom</h1>
            <p className="text-sm text-muted-foreground mt-1">Sign in to access your documents</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={cn(
                  "rounded-md border bg-background px-3 py-2 text-sm outline-none transition-shadow",
                  "focus:ring-2 focus:ring-ring placeholder:text-muted-foreground",
                  emailError && "border-destructive focus:ring-destructive/40"
                )}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={cn(
                  "rounded-md border bg-background px-3 py-2 text-sm outline-none transition-shadow",
                  "focus:ring-2 focus:ring-ring placeholder:text-muted-foreground",
                  passwordError && "border-destructive focus:ring-destructive/40"
                )}
              />
            </div>

            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}

            <Button type="submit" className="mt-1 w-full" disabled={isLoading}>
              {isLoading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-6">
            Demo: enter any email and password to sign in
          </p>
        </div>
      </div>
    </div>
  )
}
