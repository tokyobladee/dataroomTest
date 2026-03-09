import { useEffect } from "react"
import { useSearchParams } from "react-router-dom"

const STORAGE_KEY = "drive_oauth_result"

/**
 * This page is opened as a popup by DriveImportDialog.
 * It receives the OAuth result via query params (same-origin redirect from Flask),
 * writes the result to localStorage (cross-window communication that survives
 * COOP clearing window.opener), and closes itself.
 */
export function DriveCallbackPage() {
  const [params] = useSearchParams()

  useEffect(() => {
    const connected = params.get("connected") === "1"
    const error = params.get("error")

    // Write to localStorage — the main window listens via the "storage" event
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(connected ? { connected: true } : { error: error ?? "Unknown error" })
    )

    window.close()
  }, [params])

  const error = params.get("error")

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-sm text-muted-foreground">
      {error ? (
        <p>Error: {error}. You can close this window.</p>
      ) : (
        <p>Google Drive connected. You can close this window.</p>
      )}
    </div>
  )
}
