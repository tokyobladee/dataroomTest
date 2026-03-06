import { useState } from "react"
import { FileText, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import type { DataroomFile } from "@/types"
import { useDataroomStore } from "@/stores/dataroomStore"
import { cn } from "@/lib/utils"
import { setDragItem } from "@/lib/dragItem"
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

interface Props {
  file: DataroomFile
  depth: number
}

export function FileTreeItem({ file, depth }: Props) {
  const { renameFile, deleteFile, previewFileId, setPreviewFile } = useDataroomStore()
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const isPreviewed = previewFileId === file.id

  return (
    <>
      <div
        draggable
        onDragStart={(e) => setDragItem(e, { id: file.id, type: "file" })}
        className={cn(
          "group flex items-center gap-1 rounded-md py-1.5 cursor-pointer select-none text-sm hover:bg-accent",
          isPreviewed && "bg-accent font-medium"
        )}
        style={{ paddingLeft: `${8 + depth * 12}px`, paddingRight: "8px" }}
        onClick={() => setPreviewFile(isPreviewed ? null : file.id)}
      >
        <span className="h-4 w-4 shrink-0 invisible" />

        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />

        <span className="flex-1 truncate ml-1 text-muted-foreground">{file.name}</span>

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
