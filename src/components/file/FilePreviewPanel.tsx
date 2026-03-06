import { useEffect, useRef, useState } from "react"
import { X, ExternalLink, FileText } from "lucide-react"
import { useDataroomStore } from "@/stores/dataroomStore"
import { getFileBlob } from "@/db/files"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const MIN_WIDTH = 280
const MAX_WIDTH = 900
const DEFAULT_WIDTH = 900

export function FilePreviewPanel() {
  const { previewFileId, files, setPreviewFile, openFile } = useDataroomStore()
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [width, setWidth] = useState(() => {
    const stored = localStorage.getItem("previewWidth")
    return stored ? Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, parseInt(stored))) : DEFAULT_WIDTH
  })
  const [dragging, setDragging] = useState(false)
  const dragStartX = useRef(0)
  const dragStartWidth = useRef(0)
  const currentWidth = useRef(width)

  const file = files.find((f) => f.id === previewFileId) ?? null

  useEffect(() => {
    if (!previewFileId) {
      setBlobUrl(null)
      return
    }

    let url: string | null = null
    setLoading(true)

    getFileBlob(previewFileId).then((blob) => {
      if (blob) {
        url = URL.createObjectURL(blob)
        setBlobUrl(url)
      }
      setLoading(false)
    })

    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [previewFileId])

  useEffect(() => {
    if (!dragging) return

    function onMouseMove(e: MouseEvent) {
      const delta = dragStartX.current - e.clientX
      const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, dragStartWidth.current + delta))
      currentWidth.current = next
      setWidth(next)
    }

    function onMouseUp() {
      setDragging(false)
      localStorage.setItem("previewWidth", String(currentWidth.current))
    }

    document.addEventListener("mousemove", onMouseMove)
    document.addEventListener("mouseup", onMouseUp)
    return () => {
      document.removeEventListener("mousemove", onMouseMove)
      document.removeEventListener("mouseup", onMouseUp)
    }
  }, [dragging])

  function handleDragStart(e: React.MouseEvent) {
    e.preventDefault()
    dragStartX.current = e.clientX
    dragStartWidth.current = width
    setDragging(true)
  }

  if (!previewFileId || !file) return null

  return (
    <aside
      className="flex flex-col shrink-0 border-l bg-background h-screen sticky top-0 relative"
      style={{ width }}
    >
      <div
        className={cn(
          "absolute left-0 top-0 h-full w-1 cursor-col-resize z-10 transition-colors hover:bg-foreground/20",
          dragging && "bg-foreground/20"
        )}
        onMouseDown={handleDragStart}
      />

      <div className="flex items-center gap-2 px-3 h-14 shrink-0">
        <div className="rounded-md bg-muted p-1.5 shrink-0">
          <FileText className="h-4 w-4 text-muted-foreground" />
        </div>
        <span className="flex-1 text-sm font-medium truncate">{file.name}</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open in new tab"
              className="h-7 w-7 shrink-0"
              onClick={() => openFile(file.id)}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Open in new tab</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close preview"
              className="h-7 w-7 shrink-0"
              onClick={() => setPreviewFile(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Close preview</TooltipContent>
        </Tooltip>
      </div>

      <Separator />

      <div className={cn("flex-1 overflow-hidden bg-muted/30", dragging && "pointer-events-none")}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
          </div>
        ) : blobUrl ? (
          <iframe
            src={blobUrl}
            className="w-full h-full border-0"
            title={file.name}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">Failed to load preview</p>
          </div>
        )}
      </div>
    </aside>
  )
}
