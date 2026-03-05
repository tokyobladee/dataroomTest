import { useRef, useState } from "react"
import { ChevronLeft } from "lucide-react"
import { useDataroomStore } from "@/stores/dataroomStore"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { handleDroppedFiles, isFileDrag } from "@/lib/dropFiles"
import { cn } from "@/lib/utils"

interface Props {
  children: React.ReactNode
}

export function Sidebar({ children }: Props) {
  const { datarooms, activeDataroomId, exitDataroom, uploadFile } = useDataroomStore()
  const dataroom = datarooms.find((d) => d.id === activeDataroomId)
  const [isDragOver, setIsDragOver] = useState(false)
  const dragCounter = useRef(0)

  function handleDragEnter(e: React.DragEvent) {
    if (!isFileDrag(e)) return
    e.preventDefault()
    dragCounter.current++
    setIsDragOver(true)
  }

  function handleDragLeave() {
    dragCounter.current--
    if (dragCounter.current === 0) setIsDragOver(false)
  }

  function handleDragOver(e: React.DragEvent) {
    if (!isFileDrag(e)) return
    e.preventDefault()
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    dragCounter.current = 0
    setIsDragOver(false)
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
      <div className="flex items-center gap-2 px-3 h-14 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={exitDataroom}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium truncate">{dataroom?.name}</span>
      </div>
      <Separator />
      <ScrollArea className="flex-1">
        <div className="p-2">{children}</div>
      </ScrollArea>
    </aside>
  )
}
