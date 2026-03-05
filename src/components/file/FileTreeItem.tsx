import { useState } from "react"
import { FileText, MoreHorizontal, Pencil, Trash2, Check } from "lucide-react"
import type { DataroomFile } from "@/types"
import { useDataroomStore } from "@/stores/dataroomStore"
import { cn } from "@/lib/utils"
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
  const { openFile, renameFile, deleteFile, selectedIds, toggleSelected } = useDataroomStore()
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const isSelected = selectedIds.includes(file.id)

  return (
    <>
      <div
        className={cn(
          "group flex items-center gap-1 rounded-md py-1.5 cursor-pointer select-none text-sm hover:bg-accent",
          isSelected && "bg-accent"
        )}
        style={{ paddingLeft: `${8 + depth * 12}px`, paddingRight: "8px" }}
        onClick={() => openFile(file.id)}
      >
        <span className="h-4 w-4 shrink-0 invisible" />

        <button
          className="relative h-4 w-4 shrink-0"
          onClick={(e) => { e.stopPropagation(); toggleSelected(file.id) }}
        >
          <span className={cn(
            "absolute inset-0 flex items-center justify-center transition-opacity text-muted-foreground",
            "group-hover:opacity-0",
            isSelected && "opacity-0"
          )}>
            <FileText className="h-4 w-4" />
          </span>
          <span className={cn(
            "absolute inset-0 flex items-center justify-center transition-opacity",
            isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}>
            <span className={cn(
              "h-3.5 w-3.5 rounded border border-muted-foreground flex items-center justify-center",
              isSelected && "bg-foreground border-foreground"
            )}>
              {isSelected && <Check className="h-2.5 w-2.5 text-background" />}
            </span>
          </span>
        </button>

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
