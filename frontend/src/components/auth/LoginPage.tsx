import { useState } from "react"
import { Sun, Moon, Lock } from "lucide-react"
import { useAuthStore } from "@/stores/authStore"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function getAuthErrorMessage(code: string): string {
  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) {
    return "Invalid email or password"
  }
  if (code.includes("invalid-email")) return "Invalid email address"
  if (code.includes("too-many-requests")) return "Too many attempts. Try again later."
  if (code.includes("popup-closed-by-user") || code.includes("cancelled-popup-request")) return ""
  return "Sign in failed. Try again."
}

export function LoginPage() {
  const { signInWithEmail, signInWithGoogle, resetPassword } = useAuthStore()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [emailError, setEmailError] = useState(false)
  const [passwordError, setPasswordError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [forgotMode, setForgotMode] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
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

    if (!email.trim()) { setEmailError(true); return }
    if (!password.trim()) { setPasswordError(true); return }

    setIsLoading(true)
    try {
      await signInWithEmail(email.trim(), password)
    } catch (err) {
      const code = (err as { code?: string }).code ?? ""
      const msg = getAuthErrorMessage(code)
      if (msg) setError(msg)
      setEmailError(true)
      setPasswordError(true)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setEmailError(false)
    if (!email.trim()) { setEmailError(true); return }
    setResetLoading(true)
    try {
      await resetPassword(email.trim())
      setResetSent(true)
    } catch (err) {
      const code = (err as { code?: string }).code ?? ""
      if (code.includes("user-not-found") || code.includes("invalid-email")) {
        setError("No account found with this email")
        setEmailError(true)
      } else {
        setError("Failed to send reset email. Try again.")
      }
    } finally {
      setResetLoading(false)
    }
  }

  async function handleGoogle() {
    setError("")
    setIsGoogleLoading(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      const code = (err as { code?: string }).code ?? ""
      const msg = getAuthErrorMessage(code)
      if (msg) setError(msg)
    } finally {
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex justify-end p-4">
        <Button
          variant="ghost"
          size="icon"
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className="h-8 w-8"
          onClick={toggleTheme}
        >
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

          {forgotMode ? (
            <div className="flex flex-col gap-3">
              {resetSent ? (
                <div className="flex flex-col items-center gap-3 py-2 text-center">
                  <p className="text-sm font-medium">Check your email</p>
                  <p className="text-sm text-muted-foreground">
                    A password reset link was sent to <span className="font-medium text-foreground">{email}</span>
                  </p>
                  <Button variant="outline" className="mt-2 w-full" onClick={() => { setForgotMode(false); setResetSent(false) }}>
                    Back to sign in
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="flex flex-col gap-3">
                  <p className="text-sm text-muted-foreground">Enter your email and we'll send you a reset link.</p>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium" htmlFor="reset-email">Email</label>
                    <input
                      id="reset-email"
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
                  {error && <p className="text-xs text-destructive">{error}</p>}
                  <Button type="submit" className="mt-1 w-full" disabled={resetLoading}>
                    {resetLoading ? "Sending…" : "Send reset link"}
                  </Button>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => { setForgotMode(false); setError(""); setEmailError(false) }}
                  >
                    Back to sign in
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={handleGoogle}
                disabled={isGoogleLoading || isLoading}
              >
                {isGoogleLoading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                )}
                Continue with Google
              </Button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium" htmlFor="email">Email</label>
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
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium" htmlFor="password">Password</label>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => { setForgotMode(true); setError(""); setEmailError(false); setPasswordError(false) }}
                    >
                      Forgot password?
                    </button>
                  </div>
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

                {error && <p className="text-xs text-destructive">{error}</p>}

                <Button type="submit" className="mt-1 w-full" disabled={isLoading || isGoogleLoading}>
                  {isLoading ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
