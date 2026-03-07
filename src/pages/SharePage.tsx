import { useEffect, useState } from "react"
import { FileText, Folder, Download, ChevronRight } from "lucide-react"
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b px-6 h-14 flex items-center gap-3">
        <p className="font-semibold">Shared dataroom</p>
        {info && (
          <span className={cn(
            "text-xs px-1.5 py-0.5 rounded font-medium",
            info.permissions === "editor"
              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
              : "bg-muted text-muted-foreground"
          )}>
            {info.permissions}
          </span>
        )}
      </div>

      <div className="px-6 py-4 max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-sm mb-4 flex-wrap">
          <button
            className="text-muted-foreground hover:text-foreground"
            onClick={() => navigateToFolder(null)}
          >
            All files
          </button>
          {breadcrumb.map((f) => (
            <span key={f.id} className="flex items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              <button
                className="hover:text-foreground text-muted-foreground"
                onClick={() => navigateToFolder(f)}
              >
                {f.name}
              </button>
            </span>
          ))}
        </div>

        {/* Folders */}
        {visibleFolders.map((folder) => (
          <button
            key={folder.id}
            className="flex items-center gap-3 w-full rounded-md px-3 py-2 hover:bg-muted/50 text-left"
            onClick={() => navigateToFolder(folder)}
          >
            <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm flex-1 truncate">{folder.name}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </button>
        ))}

        {/* Files */}
        {visibleFiles.map((file) => (
          <div
            key={file.id}
            className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted/50"
          >
            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
            </div>
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

        {visibleFolders.length === 0 && visibleFiles.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-12">This folder is empty</p>
        )}
      </div>
    </div>
  )
}
