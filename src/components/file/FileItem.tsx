import { useState } from "react"
import { FileText, MoreHorizontal, Pencil, Trash2, ExternalLink, Check } from "lucide-react"
import type { DataroomFile } from "@/types"
import { useDataroomStore } from "@/stores/dataroomStore"
import { cn } from "@/lib/utils"
import { setDragItem } from "@/lib/dragItem"
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
import { RenameFileDialog } from "./RenameFileDialog"

interface Props {
  file: DataroomFile
}

export function FileItem({ file }: Props) {
  const { openFile, renameFile, deleteFile, selectedIds, toggleSelected, previewFileId, setPreviewFile } =
    useDataroomStore()
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const isSelected = selectedIds.includes(file.id)
  const isPreviewed = previewFileId === file.id

  function handleCheckbox(e: React.MouseEvent) {
    e.stopPropagation()
    toggleSelected(file.id)
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  function formatDate(ts: number) {
    return new Date(ts).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <>
      <div
        draggable
        onDragStart={(e) => setDragItem(e, { id: file.id, type: "file" })}
        className={cn(
          "group flex items-center gap-3 rounded-lg border bg-card px-4 py-3 cursor-pointer hover:border-foreground/20 hover:shadow-sm transition-all",
          isSelected && "border-foreground/30 bg-accent",
          isPreviewed && "border-foreground/40 ring-1 ring-foreground/20"
        )}
        onClick={() => setPreviewFile(isPreviewed ? null : file.id)}
      >
        <button className="shrink-0 flex items-center justify-center" onClick={handleCheckbox}>
          {isSelected ? (
            <span className="h-4 w-4 rounded bg-foreground border border-foreground flex items-center justify-center">
              <Check className="h-2.5 w-2.5 text-background" />
            </span>
          ) : (
            <span className="h-4 w-4 rounded border border-muted-foreground/40 flex items-center justify-center group-hover:border-muted-foreground" />
          )}
        </button>

        <div className="rounded-md bg-muted p-2 shrink-0">
          <FileText className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{file.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatSize(file.size)} · {formatDate(file.createdAt)}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => { e.stopPropagation(); openFile(file.id) }}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>

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
      </div>

      <RenameFileDialog
        open={renameOpen}
        initialValue={file.name}
        onClose={() => setRenameOpen(false)}
        onConfirm={(name) => renameFile(file.id, name)}
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
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => deleteFile(file.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
