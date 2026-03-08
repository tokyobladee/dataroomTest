import { useEffect, useState } from "react"
import { FileText, Folder, Download, ChevronRight, Home, Eye, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000"

interface ShareInfo {
  token: string
  dataroom_id: string
  folder_id: string | null
  permissions: string
  expires_at: string | null
}

interface FolderItem {
  id: string
  parent_id: string | null
  name: string
}

interface FileItem {
  id: string
  folder_id: string | null
  name: string
  size: number
  mime_type: string
}

async function publicFetch(path: string) {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `HTTP ${res.status}`)
  }
  return res
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatExpiry(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

export function SharePage() {
  // Rendered outside <Routes>, so extract token from pathname directly: /s/:token
  const token = window.location.pathname.split("/s/")[1]?.split("/")[0]
  const [info, setInfo] = useState<ShareInfo | null>(null)
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [files, setFiles] = useState<FileItem[]>([])
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null)
  const [breadcrumb, setBreadcrumb] = useState<FolderItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    Promise.all([
      publicFetch(`/api/s/${token}`).then((r) => r.json()),
      publicFetch(`/api/s/${token}/folders`).then((r) => r.json()),
      publicFetch(`/api/s/${token}/files`).then((r) => r.json()),
    ])
      .then(([shareInfo, allFolders, allFiles]) => {
        setInfo(shareInfo)
        setFolders(allFolders)
        setFiles(allFiles)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [token])

  function navigateToFolder(folder: FolderItem | null) {
    setActiveFolderId(folder?.id ?? null)
    if (!folder) {
      setBreadcrumb([])
      return
    }
    setBreadcrumb((prev) => {
      const existing = prev.findIndex((f) => f.id === folder.id)
      if (existing !== -1) return prev.slice(0, existing + 1)
      return [...prev, folder]
    })
  }

  function handleDownload(file: FileItem) {
    window.open(`${BASE}/api/s/${token}/files/${file.id}`, "_blank")
  }

  const visibleFolders = folders.filter((f) => f.parent_id === activeFolderId)
  const visibleFiles = files.filter((f) => f.folder_id === activeFolderId)
  const totalVisible = visibleFolders.length + visibleFiles.length
  const isEditor = info?.permissions === "editor"

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background">
        <p className="text-lg font-semibold">Link unavailable</p>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-sm">Shared dataroom</span>
          </div>
          <div className="flex items-center gap-3">
            {info?.expires_at && (
              <span className="text-xs text-muted-foreground hidden sm:block">
                Expires {formatExpiry(info.expires_at)}
              </span>
            )}
            {info && (
              <span className={cn(
                "flex items-center gap-1 text-xs px-2 py-1 rounded-md font-medium",
                isEditor
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                  : "bg-muted text-muted-foreground"
              )}>
                {isEditor ? <Pencil className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                {info.permissions}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm flex-wrap">
          <button
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => navigateToFolder(null)}
          >
            <Home className="h-3.5 w-3.5" />
            <span>All files</span>
          </button>
          {breadcrumb.map((f) => (
            <span key={f.id} className="flex items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
              <button
                className="text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => navigateToFolder(f)}
              >
                {f.name}
              </button>
            </span>
          ))}
        </nav>

        {/* File list */}
        <div className="bg-background rounded-lg border overflow-hidden">
          {totalVisible === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">This folder is empty</p>
          ) : (
            <div className="divide-y">
              {visibleFolders.map((folder) => (
                <button
                  key={folder.id}
                  className="flex items-center gap-3 w-full px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                  onClick={() => navigateToFolder(folder)}
                >
                  <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm flex-1 truncate">{folder.name}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                </button>
              ))}

              {visibleFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm flex-1 truncate">{file.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                    {formatSize(file.size)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => handleDownload(file)}
                    aria-label="Download"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {totalVisible > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            {totalVisible} item{totalVisible !== 1 ? "s" : ""}
          </p>
        )}
      </main>
    </div>
  )
}
