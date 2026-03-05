import { useRef, useState } from "react"
import { Folder, MoreHorizontal, Plus, Pencil, Trash2, Check } from "lucide-react"
import type { Folder as FolderType } from "@/types"
import { useDataroomStore } from "@/stores/dataroomStore"
import { cn } from "@/lib/utils"
import { handleDroppedFiles, isFileDrag } from "@/lib/dropFiles"
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
  const { setActiveFolder, createFolder, renameFolder, deleteFolder, selectedIds, toggleSelected, uploadFile } =
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
    e.stopPropagation()
    dragCounter.current = 0
    setIsDragOver(false)
    await handleDroppedFiles(e.dataTransfer, (file) => uploadFile(file, folder.id))
  }

  return (
    <>
      <div
        className={cn(
          "group flex items-center gap-3 rounded-lg border bg-card px-4 py-3 cursor-pointer hover:border-foreground/20 hover:shadow-sm transition-all",
          isSelected && "border-foreground/30 bg-accent",
          isDragOver && "border-foreground/40 bg-accent shadow-sm"
        )}
        onClick={() => setActiveFolder(folder.id)}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div
          className="relative shrink-0 cursor-pointer"
          onClick={handleCheckbox}
        >
          <div className={cn(
            "rounded-md p-2 transition-colors",
            isSelected ? "bg-foreground" : "bg-muted group-hover:bg-muted"
          )}>
            {isSelected
              ? <Check className="h-5 w-5 text-background" />
              : <Folder className="h-5 w-5 text-muted-foreground" />
            }
          </div>
        </div>

        <span className="flex-1 text-sm font-medium truncate">{folder.name}</span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
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
      </div>

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
              className="bg-destructive text-white hover:bg-destructive/90"
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
