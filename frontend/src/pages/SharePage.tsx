import { useEffect, useRef, useState } from "react"
import { FileText, Folder, Download, ChevronRight, Home, Eye, Pencil, X, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000"

const PANEL_MIN = 280
const PANEL_MAX = 900
const PANEL_DEFAULT = 600

interface ShareInfo {
  token: string
  dataroom_id: string
  folder_id: string | null
  file_id: string | null
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
  const token = window.location.pathname.split("/s/")[1]?.split("/")[0]
  const [info, setInfo] = useState<ShareInfo | null>(null)
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [files, setFiles] = useState<FileItem[]>([])
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null)
  const [breadcrumb, setBreadcrumb] = useState<FolderItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [previewFile, setPreviewFile] = useState<FileItem | null>(null)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [panelWidth, setPanelWidth] = useState(() => {
    const stored = localStorage.getItem("sharePreviewWidth")
    return stored ? Math.min(PANEL_MAX, Math.max(PANEL_MIN, parseInt(stored))) : PANEL_DEFAULT
  })
  const isResizing = useRef(false)
  const [resizing, setResizing] = useState(false)
  const dragStartX = useRef(0)
  const dragStartWidth = useRef(0)
  const currentPanelWidth = useRef(panelWidth)
  const panelRef = useRef<HTMLElement>(null)

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
        if (shareInfo.folder_id) {
          setActiveFolderId(shareInfo.folder_id)
          setBreadcrumb([])
        }
        if (shareInfo.file_id) {
          setActiveFolderId(null)
          // Auto-open preview for single-file share
          const f = allFiles[0] ?? null
          if (f) setPreviewFile(f)
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [token])

  // Load blob when previewFile changes
  useEffect(() => {
    if (!previewFile) { setBlobUrl(null); return }
    let url: string | null = null
    let cancelled = false
    setPreviewLoading(true)
    setBlobUrl(null)
    publicFetch(`/api/s/${token}/files/${previewFile.id}`)
      .then((res) => res.blob())
      .then((blob) => {
        if (cancelled) return
        url = URL.createObjectURL(blob)
        setBlobUrl(url)
      })
      .catch(() => { if (!cancelled) setBlobUrl(null) })
      .finally(() => { if (!cancelled) setPreviewLoading(false) })
    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [previewFile?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Panel resize
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!isResizing.current) return
      const delta = dragStartX.current - e.clientX
      const next = Math.min(PANEL_MAX, Math.max(PANEL_MIN, dragStartWidth.current + delta))
      currentPanelWidth.current = next
      if (panelRef.current) panelRef.current.style.width = `${next}px`
    }
    function onMouseUp() {
      if (!isResizing.current) return
      isResizing.current = false
      setResizing(false)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
      if (panelRef.current) panelRef.current.style.transition = ""
      setPanelWidth(currentPanelWidth.current)
      localStorage.setItem("sharePreviewWidth", String(currentPanelWidth.current))
    }
    document.addEventListener("mousemove", onMouseMove)
    document.addEventListener("mouseup", onMouseUp)
    return () => {
      document.removeEventListener("mousemove", onMouseMove)
      document.removeEventListener("mouseup", onMouseUp)
    }
  }, [])

  function handlePanelDragStart(e: React.MouseEvent) {
    e.preventDefault()
    isResizing.current = true
    setResizing(true)
    dragStartX.current = e.clientX
    dragStartWidth.current = currentPanelWidth.current
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
    if (panelRef.current) panelRef.current.style.transition = "none"
  }

  function handleDownload(file: FileItem) {
    const a = document.createElement("a")
    a.href = `${BASE}/api/s/${token}/files/${file.id}?download=1`
    a.download = file.name
    a.click()
  }

  function navigateToFolder(folder: FolderItem | null) {
    setActiveFolderId(folder?.id ?? null)
    if (!folder) { setBreadcrumb([]); return }
    setBreadcrumb((prev) => {
      const existing = prev.findIndex((f) => f.id === folder.id)
      if (existing !== -1) return prev.slice(0, existing + 1)
      return [...prev, folder]
    })
  }

  const isEditor = info?.permissions === "editor"
  const visibleFolders = folders.filter((f) => f.parent_id === activeFolderId)
  const visibleFiles = files.filter((f) => f.folder_id === activeFolderId)
  const totalVisible = visibleFolders.length + visibleFiles.length
  const isFilShare = !loading && !error && !!info?.file_id

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

  const permBadge = info && (
    <span className={cn(
      "flex items-center gap-1 text-xs px-2 py-1 rounded-md font-medium",
      isEditor
        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
        : "bg-muted text-muted-foreground"
    )}>
      {isEditor ? <Pencil className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
      {info.permissions}
    </span>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="bg-background border-b shrink-0">
          <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold text-sm">{isFilShare ? "Shared file" : "Shared dataroom"}</span>
            </div>
            <div className="flex items-center gap-3">
              {info?.expires_at && (
                <span className="text-xs text-muted-foreground hidden sm:block">
                  Expires {formatExpiry(info.expires_at)}
                </span>
              )}
              {permBadge}
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto w-full px-4 py-6 flex flex-col gap-4">
          {/* Breadcrumb (folder share only) */}
          {!isFilShare && (
            <nav className="flex items-center gap-1 text-sm flex-wrap">
              <button
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => {
                  if (info?.folder_id) {
                    setActiveFolderId(info.folder_id)
                    setBreadcrumb([])
                  } else {
                    navigateToFolder(null)
                  }
                }}
              >
                <Home className="h-3.5 w-3.5" />
                <span>{info?.folder_id ? (folders.find(f => f.id === info.folder_id)?.name ?? "Home") : "All files"}</span>
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
          )}

          {/* File list */}
          {isFilShare ? (
            // Single file share
            <div className="bg-background rounded-lg border overflow-hidden">
              {files[0] && (
                <div
                  className={cn(
                    "flex items-center gap-3 px-4 py-4 cursor-pointer hover:bg-muted/50 transition-colors",
                    previewFile?.id === files[0].id && "bg-muted/50"
                  )}
                  onClick={() => setPreviewFile(files[0])}
                >
                  <FileText className="h-8 w-8 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{files[0].name}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{formatSize(files[0].size)}</p>
                  </div>
                  <Button
                    onClick={(e) => { e.stopPropagation(); handleDownload(files[0]) }}
                    className="gap-2 shrink-0"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>
              )}
            </div>
          ) : (
            // Folder share
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
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer",
                        previewFile?.id === file.id && "bg-muted/50"
                      )}
                      onClick={() => setPreviewFile(file)}
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
                        onClick={(e) => { e.stopPropagation(); handleDownload(file) }}
                        aria-label="Download"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!isFilShare && totalVisible > 0 && (
            <p className="text-xs text-muted-foreground text-center">
              {totalVisible} item{totalVisible !== 1 ? "s" : ""}
            </p>
          )}
        </main>
      </div>

      {/* Preview panel */}
      <aside
        ref={panelRef}
        className={cn(
          "flex flex-col shrink-0 bg-background h-screen sticky top-0 relative overflow-hidden transition-[width] duration-200",
          previewFile && "border-l"
        )}
        style={{ width: previewFile ? panelWidth : 0 }}
      >
        {previewFile && (
          <>
            {/* Resize handle */}
            <div
              className="absolute left-0 top-0 h-full w-1 cursor-col-resize z-10 hover:bg-foreground/20 transition-colors"
              onMouseDown={handlePanelDragStart}
            />

            {/* Header */}
            <div className="flex items-center gap-2 px-3 h-14 shrink-0">
              <div className="rounded-md bg-muted p-1.5 shrink-0">
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="flex-1 text-sm font-medium truncate">{previewFile.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                title="Open in new tab"
                onClick={() => window.open(`${BASE}/api/s/${token}/files/${previewFile.id}`, "_blank")}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                title="Close preview"
                onClick={() => setPreviewFile(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <Separator />

            {/* Content */}
            <div className="flex-1 overflow-hidden bg-muted/30 relative">
              {resizing && <div className="absolute inset-0 z-10" />}
              {previewLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                </div>
              ) : blobUrl ? (
                <iframe
                  src={blobUrl}
                  className="w-full h-full border-0"
                  title={previewFile.name}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-muted-foreground">Failed to load preview</p>
                </div>
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
