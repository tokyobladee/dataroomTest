import { useRef, useState } from "react"
import { User } from "lucide-react"
import { useDataroomStore } from "@/stores/dataroomStore"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { handleDroppedFiles, isFileDrag } from "@/lib/dropFiles"
import { getDragItem, isInternalDrag } from "@/lib/dragItem"
import { FolderTree } from "@/components/folder/FolderTree"

export function GlobalSidebar() {
  const { uploadFile, moveFile, moveFolder } = useDataroomStore()
  const [isDragOver, setIsDragOver] = useState(false)
  const dragCounter = useRef(0)

  function handleDragEnter(e: React.DragEvent) {
    if (!isFileDrag(e) && !isInternalDrag(e)) return
    e.preventDefault()
    dragCounter.current++
    setIsDragOver(true)
  }

  function handleDragLeave() {
    dragCounter.current--
    if (dragCounter.current === 0) setIsDragOver(false)
  }

  function handleDragOver(e: React.DragEvent) {
    if (!isFileDrag(e) && !isInternalDrag(e)) return
    e.preventDefault()
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    dragCounter.current = 0
    setIsDragOver(false)
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
      className={cn(
        "flex flex-col w-64 shrink-0 border-r bg-background h-screen sticky top-0 transition-colors",
        isDragOver && "bg-accent/30"
      )}
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
      </div>

      <Separator />

      <ScrollArea className="flex-1">
        <div className="p-2">
          <FolderTree />
        </div>
      </ScrollArea>
    </aside>
  )
}
