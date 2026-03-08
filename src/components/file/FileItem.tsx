import { useState } from "react"
import { FileText, MoreHorizontal, Pencil, Trash2, ExternalLink, Download, Check } from "lucide-react"
import type { DataroomFile } from "@/types"
import { useDataroomStore } from "@/stores/dataroomStore"
import { cn } from "@/lib/utils"
import { setDragItem } from "@/lib/dragItem"
import { toast } from "sonner"
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
  const { openFile, downloadFile, renameFile, deleteFile, selectedIds, toggleSelected, previewFileId, setPreviewFile } =
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
      <tr
        data-item-id={file.id}
        draggable
        onDragStart={(e) => {
          e.stopPropagation()
          const { selectedIds, folders } = useDataroomStore.getState()
          const item = { id: file.id, type: "file" as const }
          if (selectedIds.includes(file.id) && selectedIds.length > 1) {
            const bulk = selectedIds.map(sid => ({
              id: sid,
              type: (folders.some(f => f.id === sid) ? "folder" : "file") as "folder" | "file",
            }))
            setDragItem(e, { ...item, bulk })
          } else {
            setDragItem(e, item)
          }
        }}
        className={cn(
          "group border-b cursor-pointer transition-colors hover:bg-accent/50",
          isSelected && "bg-accent",
          isPreviewed && "bg-accent/70"
        )}
        onClick={() => setPreviewFile(isPreviewed ? null : file.id)}
      >
        <td className="w-10 p-0">
          <button className="flex items-center justify-center w-full py-2.5 px-3 min-h-[44px]" onClick={handleCheckbox}>
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
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="font-medium truncate">{file.name}</span>
          </div>
        </td>
        <td className="px-3 py-2.5 text-xs text-muted-foreground">{formatSize(file.size)}</td>
        <td className="px-3 py-2.5 text-xs text-muted-foreground">{formatDate(file.createdAt)}</td>
        <td className="px-3 py-2.5 text-right">
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity"
              onClick={(e) => { e.stopPropagation(); openFile(file.id) }}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity"
              onClick={(e) => { e.stopPropagation(); downloadFile(file.id) }}
            >
              <Download className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity"
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
        </td>
      </tr>

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
