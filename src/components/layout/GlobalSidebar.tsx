import { useEffect, useRef, useState } from "react"
import { User, Upload, Sun, Moon } from "lucide-react"
import { useDataroomStore } from "@/stores/dataroomStore"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { handleDroppedFiles, isFileDrag } from "@/lib/dropFiles"
import { getDragItem, isInternalDrag } from "@/lib/dragItem"
import { FolderTree } from "@/components/folder/FolderTree"
import { Button } from "@/components/ui/button"

export function GlobalSidebar() {
  const { uploadFile, moveFile, moveFolder } = useDataroomStore()
  const dragCounter = useRef(0)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isOsDrag, setIsOsDrag] = useState(false)
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem("theme")
    if (stored) return stored === "dark"
    return window.matchMedia("(prefers-color-scheme: dark)").matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark)
    localStorage.setItem("theme", isDark ? "dark" : "light")
  }, [isDark])

  function handleDragEnter(e: React.DragEvent) {
    if (!isFileDrag(e) && !isInternalDrag(e)) return
    e.preventDefault()
    if (dragCounter.current === 0) setIsOsDrag(isFileDrag(e))
    dragCounter.current++
    setIsDragOver(true)
  }

  function handleDragLeave() {
    dragCounter.current--
    if (dragCounter.current === 0) { setIsDragOver(false); setIsOsDrag(false) }
  }

  function handleDragOver(e: React.DragEvent) {
    if (!isFileDrag(e) && !isInternalDrag(e)) return
    e.preventDefault()
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    dragCounter.current = 0
    setIsDragOver(false)
    setIsOsDrag(false)
    const item = getDragItem(e)
    if (item) {
      if (item.type === "file") await moveFile(item.id, null)
      else await moveFolder(item.id, null)
      return
    }
    await handleDroppedFiles(e.dataTransfer, (file) => uploadFile(file, null))
  }

  return (
    <aside
      className="flex flex-col w-64 shrink-0 border-r bg-background h-screen sticky top-0"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex items-center gap-3 px-3 h-14 shrink-0">
        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">Guest User</p>
          <p className="text-xs text-muted-foreground truncate">Local workspace</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={() => setIsDark((d) => !d)}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>

      <Separator />

      <div className="relative flex-1 min-h-0">
        {isDragOver && isOsDrag && (
          <div className="absolute inset-0 z-20 pointer-events-none rounded-lg border-2 border-dashed border-primary bg-primary/5 flex flex-col items-center justify-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            <p className="text-xs font-semibold text-primary text-center px-3">Drop to add to All files</p>
          </div>
        )}
        <ScrollArea className="h-full">
          <div className="p-2">
            <FolderTree />
          </div>
        </ScrollArea>
      </div>
    </aside>
  )
}
