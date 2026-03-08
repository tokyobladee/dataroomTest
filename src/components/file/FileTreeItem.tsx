import { useRef, useState } from "react"
import { FileText, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import type { DataroomFile } from "@/types"
import { useDataroomStore } from "@/stores/dataroomStore"
import { cn } from "@/lib/utils"
import { setDragItem, getDragItem, isInternalDrag } from "@/lib/dragItem"
import { handleDroppedFiles, isFileDrag } from "@/lib/dropFiles"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { RenameFileDialog } from "./RenameFileDialog"
import { toast } from "sonner"

interface Props {
  file: DataroomFile
  depth: number
}

export function FileTreeItem({ file, depth }: Props) {
  const { renameFile, deleteFile, previewFileId, setPreviewFile, uploadFile, moveFile, moveFolder } = useDataroomStore()
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const dragCounter = useRef(0)

  const isPreviewed = previewFileId === file.id
  const targetFolderId = file.folderId

  function handleDragEnter(e: React.DragEvent) {
    if (!isFileDrag(e) && !isInternalDrag(e)) return
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current++
    setIsDragOver(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current === 0) setIsDragOver(false)
  }

  function handleDragOver(e: React.DragEvent) {
    if (!isFileDrag(e) && !isInternalDrag(e)) return
    e.preventDefault()
    e.stopPropagation()
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current = 0
    setIsDragOver(false)
    const item = getDragItem(e)
    if (item) {
      const items = item.bulk ?? [item]
      await Promise.all(items.map(i =>
        i.type === "file" ? moveFile(i.id, targetFolderId) : moveFolder(i.id, targetFolderId)
      ))
      return
    }
    await handleDroppedFiles(e.dataTransfer, (f) => uploadFile(f, targetFolderId))
  }

  return (
    <>
      <div
        draggable
        onDragStart={(e) => { e.stopPropagation(); setDragItem(e, { id: file.id, type: "file" }) }}
        onDragEnter={handleDragEnter}
        onDragLeave={(e) => handleDragLeave(e)}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          "group flex items-center gap-1 rounded-md py-1.5 cursor-pointer select-none text-sm hover:bg-accent",
          isPreviewed && "bg-accent font-medium",
          isDragOver && "bg-primary/10 ring-1 ring-inset ring-primary/50"
        )}
        style={{ paddingLeft: `${8 + depth * 12}px`, paddingRight: "8px" }}
        onClick={() => setPreviewFile(isPreviewed ? null : file.id)}
      >
        <span className="h-4 w-4 shrink-0 invisible" />

        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />

        <span className="flex-1 truncate ml-1 min-w-0 text-muted-foreground">{file.name}</span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={() => setRenameOpen(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <RenameFileDialog
        open={renameOpen}
        initialValue={file.name}
        onClose={() => setRenameOpen(false)}
        onConfirm={(name) => { renameFile(file.id, name); toast.success("File renamed") }}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{file.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This file will be permanently deleted and cannot be recovered.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => { deleteFile(file.id); toast.success(`"${file.name}" deleted`) }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
