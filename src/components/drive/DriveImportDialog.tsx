import { useEffect, useState } from "react"
import { HardDrive, Search, Loader2, Check, AlertCircle } from "lucide-react"
import { apiJSON } from "@/lib/api"
import { useDataroomStore } from "@/stores/dataroomStore"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface DriveFile {
  id: string
  name: string
  size?: number
  mimeType: string
  modifiedTime: string
}

interface DriveFilesResponse {
  files: DriveFile[]
  nextPageToken?: string
}

interface Props {
  open: boolean
  onClose: () => void
}

export function DriveImportDialog({ open, onClose }: Props) {
  const { importFromDrive } = useDataroomStore()

  const [status, setStatus] = useState<"idle" | "connecting" | "loading" | "ready" | "importing">("idle")
  const [error, setError] = useState<string | null>(null)
  const [files, setFiles] = useState<DriveFile[]>([])
  const [nextPageToken, setNextPageToken] = useState<string | undefined>()
  const [loadingMore, setLoadingMore] = useState(false)
  const [query, setQuery] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [importProgress, setImportProgress] = useState<{ current: number; total: number; name: string } | null>(null)
  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setStatus("idle")
      setError(null)
      setFiles([])
      setNextPageToken(undefined)
      setQuery("")
      setSelectedIds(new Set())
      loadDriveFiles()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  async function loadDriveFiles(pageToken?: string) {
    setStatus("loading")
    setError(null)
    try {
      const url = pageToken
        ? `/api/drive/files?pageToken=${encodeURIComponent(pageToken)}`
        : "/api/drive/files"
      const res = await apiJSON<DriveFilesResponse>(url)
      setFiles((prev) => (pageToken ? [...prev, ...res.files] : res.files))
      setNextPageToken(res.nextPageToken)
      setStatus("ready")
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      // "Drive not connected" comes as a 403 PermissionError from the backend
      if (msg.includes("Drive not connected")) {
        setStatus("idle")
      } else {
        setError(msg)
        setStatus("idle")
      }
    }
  }

  async function connectDrive() {
    setStatus("connecting")
    setError(null)

    // Clear any stale result from a previous attempt
    localStorage.removeItem("drive_oauth_result")

    try {
      const { url } = await apiJSON<{ url: string }>("/api/drive/auth-url")
      window.open(url, "drive_oauth", "width=600,height=700")

      // The popup writes to localStorage on completion; we listen here.
      // (postMessage via window.opener is blocked by COOP after Google's pages.)
      function onStorage(event: StorageEvent) {
        if (event.key !== "drive_oauth_result" || !event.newValue) return
        window.removeEventListener("storage", onStorage)
        try {
          const result = JSON.parse(event.newValue) as { connected?: boolean; error?: string }
          if (result.connected) {
            loadDriveFiles()
          } else {
            setError(result.error ?? "Authorization failed")
            setStatus("idle")
          }
        } catch {
          setError("Authorization failed")
          setStatus("idle")
        }
      }
      window.addEventListener("storage", onStorage)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to get authorization URL")
      setStatus("idle")
    }
  }

  async function handleLoadMore() {
    if (!nextPageToken) return
    setLoadingMore(true)
    try {
      const res = await apiJSON<DriveFilesResponse>(
        `/api/drive/files?pageToken=${encodeURIComponent(nextPageToken)}`
      )
      setFiles((prev) => [...prev, ...res.files])
      setNextPageToken(res.nextPageToken)
    } catch {
      toast.error("Failed to load more files")
    } finally {
      setLoadingMore(false)
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleImport() {
    if (selectedIds.size === 0) return
    setStatus("importing")
    const ids = Array.from(selectedIds)
    const total = ids.length
    let failed = 0
    for (let i = 0; i < ids.length; i++) {
      const file = files.find((f) => f.id === ids[i])
      setImportProgress({ current: i + 1, total, name: file?.name ?? ids[i] })
      try {
        await importFromDrive([ids[i]])
      } catch {
        failed++
      }
    }
    setImportProgress(null)
    if (failed === 0) {
      toast.success(`${total} file${total > 1 ? "s" : ""} imported from Google Drive`)
    } else {
      toast.error(`${failed} of ${total} files failed to import`)
    }
    onClose()
  }

  const filtered = query.trim()
    ? files.filter((f) => f.name.toLowerCase().includes(query.trim().toLowerCase()))
    : files

  function formatSize(bytes?: number) {
    if (!bytes) return "—"
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const isImporting = status === "importing"
  const isLoading = status === "loading" || status === "connecting"

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Import from Google Drive
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-[260px] flex flex-col gap-3 overflow-x-hidden">
          {/* Not connected */}
          {(status === "idle" || status === "connecting") && !error && (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 py-8">
              <HardDrive className="h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center">
                Connect your Google Drive to import files directly into this dataroom.
              </p>
              <Button onClick={connectDrive} disabled={status === "connecting"}>
                {status === "connecting" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Connect Google Drive
              </Button>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-destructive text-center break-words line-clamp-4">{error}</p>
              <Button variant="outline" onClick={() => { setError(null); connectDrive() }}>
                Try again
              </Button>
            </div>
          )}

          {/* Loading */}
          {status === "loading" && (
            <div className="flex flex-1 items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* File list */}
          {status === "ready" && (
            <>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search files…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-8"
                />
              </div>

              <div className="w-full flex-1 overflow-y-auto overflow-x-hidden max-h-64 rounded-md border divide-y scrollbar-thin">
                {filtered.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No files found.</p>
                )}
                {filtered.map((file) => {
                  const selected = selectedIds.has(file.id)
                  return (
                    <button
                      key={file.id}
                      className="w-full min-w-0 overflow-hidden flex items-center gap-3 px-3 py-2.5 text-left hover:bg-accent/50 transition-colors"
                      onClick={() => toggleSelect(file.id)}
                    >
                      <span
                        className={`h-4 w-4 shrink-0 rounded border flex items-center justify-center transition-colors ${
                          selected
                            ? "bg-foreground border-foreground"
                            : "border-muted-foreground/40"
                        }`}
                      >
                        {selected && <Check className="h-2.5 w-2.5 text-background" />}
                      </span>
                      <span className="flex-1 min-w-0 truncate text-sm font-medium">{file.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatSize(file.size)}
                      </span>
                    </button>
                  )
                })}
              </div>

              {nextPageToken && !query && (
                <Button variant="outline" size="sm" onClick={handleLoadMore} disabled={loadingMore}>
                  {loadingMore && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
                  Load more
                </Button>
              )}
            </>
          )}

          {/* Importing */}
          {isImporting && importProgress && (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {importProgress.current} of {importProgress.total}
              </p>
              <p className="text-xs text-muted-foreground max-w-xs truncate text-center">
                {importProgress.name}
              </p>
              <div className="w-48 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-foreground rounded-full transition-all duration-300"
                  style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isImporting || isLoading}>
            Cancel
          </Button>
          {status === "ready" && (
            <Button onClick={handleImport} disabled={selectedIds.size === 0}>
              Import {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
