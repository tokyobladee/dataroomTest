import { useRef, useState } from "react"
import { Folder, MoreHorizontal, Plus, Pencil, Trash2, Check, ChevronRight } from "lucide-react"
import type { Folder as FolderType } from "@/types"
import { useDataroomStore } from "@/stores/dataroomStore"
import { cn } from "@/lib/utils"
import { handleDroppedFiles, isFileDrag } from "@/lib/dropFiles"
import { setDragItem, getDragItem, isInternalDrag } from "@/lib/dragItem"
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
import { Button } from "@/components/ui/button"
import { FolderDialog } from "./FolderDialog"

interface Props {
  folder: FolderType
}

export function FolderCard({ folder }: Props) {
  const { setActiveFolder, createFolder, renameFolder, deleteFolder, moveFolder, moveFile, selectedIds, toggleSelected, uploadFile } =
    useDataroomStore()
  const [createOpen, setCreateOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const dragCounter = useRef(0)

  const isSelected = selectedIds.includes(folder.id)

  function handleCheckbox(e: React.MouseEvent) {
    e.stopPropagation()
    toggleSelected(folder.id)
  }

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
      if (item.type === "file") await moveFile(item.id, folder.id)
      else if (item.id !== folder.id) await moveFolder(item.id, folder.id)
      return
    }
    await handleDroppedFiles(e.dataTransfer, (file) => uploadFile(file, folder.id))
  }

  function formatDate(ts: number) {
    return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
  }

  return (
    <>
      <tr
        draggable
        onDragStart={(e) => { e.stopPropagation(); setDragItem(e, { id: folder.id, type: "folder" }) }}
        className={cn(
          "group border-b cursor-pointer transition-colors hover:bg-accent/50",
          isSelected && "bg-accent",
          isDragOver && "bg-primary/15"
        )}
        onClick={() => setActiveFolder(folder.id)}
        onDragEnter={handleDragEnter}
        onDragLeave={(e) => handleDragLeave(e)}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <td className="px-3 py-2.5 w-10">
          <button className="flex items-center justify-center" onClick={handleCheckbox}>
            {isSelected ? (
              <span className="h-4 w-4 rounded bg-foreground border border-foreground flex items-center justify-center">
                <Check className="h-2.5 w-2.5 text-background" />
              </span>
            ) : (
              <span className="h-4 w-4 rounded border border-muted-foreground/40 flex items-center justify-center group-hover:border-muted-foreground" />
            )}
          </button>
        </td>
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="font-medium truncate">{folder.name}</span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </td>
        <td className="px-3 py-2.5 text-xs text-muted-foreground">—</td>
        <td className="px-3 py-2.5 text-xs text-muted-foreground">{formatDate(folder.createdAt)}</td>
        <td className="px-3 py-2.5 text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New subfolder
              </DropdownMenuItem>
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
        </td>
      </tr>

      <FolderDialog
        open={createOpen}
        mode="create"
        onClose={() => setCreateOpen(false)}
        onConfirm={(name) => createFolder(name, folder.id)}
      />

      <FolderDialog
        open={renameOpen}
        mode="rename"
        initialValue={folder.name}
        onClose={() => setRenameOpen(false)}
        onConfirm={(name) => renameFolder(folder.id, name)}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{folder.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the folder and all its subfolders and files.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => deleteFolder(folder.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
