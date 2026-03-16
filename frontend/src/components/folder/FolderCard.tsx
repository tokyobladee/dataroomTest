import { useRef, useState } from "react"
import { Folder, MoreHorizontal, Plus, Pencil, Trash2, Check, ChevronRight, Link2, Download, Share2 } from "lucide-react"
import type { Folder as FolderType } from "@/types"
import { useDataroomStore } from "@/stores/dataroomStore"
import { useNavigateFolder } from "@/lib/useNavigateFolder"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { collectDroppedFiles, isFileDrag } from "@/lib/dropFiles"
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
import { ShareFolderDialog } from "@/components/share/ShareFolderDialog"

interface Props {
  folder: FolderType
}

export function FolderCard({ folder }: Props) {
  const { createFolder, renameFolder, deleteFolder, moveFolder, moveFiles, selectedIds, toggleSelected, clearSelection, uploadFiles, myRole, downloadFolderAsZip, shareLinks } =
    useDataroomStore()
  const isOwner = myRole === "owner"
  const canEdit = myRole === "owner" || myRole === "editor"
  const isShared = shareLinks.some(l => l.folder_id === folder.id)
  const navigateFolder = useNavigateFolder()
  const [createOpen, setCreateOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
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
      const items = item.bulk ?? [item]
      const fileIds = items.filter((i) => i.type === "file").map((i) => i.id)
      const folderItems = items.filter((i) => i.type === "folder" && i.id !== folder.id)
      if (fileIds.length > 0) await moveFiles(fileIds, folder.id)
      await Promise.all(folderItems.map((i) => moveFolder(i.id, folder.id)))
      clearSelection()
      return
    }
    const droppedFiles = collectDroppedFiles(e.dataTransfer)
    await uploadFiles(droppedFiles, folder.id)
  }

  function formatDate(ts: number) {
    return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
  }

  return (
    <>
      <tr
        data-item-id={folder.id}
        draggable
        onDragStart={(e) => {
          e.stopPropagation()
          const { selectedIds, folders } = useDataroomStore.getState()
          const item = { id: folder.id, type: "folder" as const }
          if (selectedIds.includes(folder.id) && selectedIds.length > 1) {
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
          "group border-b transition-colors hover:bg-accent/50",
          isSelected && "bg-accent",
          isDragOver && "bg-primary/15"
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={(e) => handleDragLeave(e)}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
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
        <td className="px-3 py-2.5 cursor-pointer max-w-0 w-full" onClick={() => navigateFolder(folder.id)}>
          <div className="flex items-center gap-2 min-w-0">
            <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="font-medium truncate">{folder.name}</span>
            {isShared && <Share2 className="h-3 w-3 text-muted-foreground shrink-0" />}
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </td>
        <td className="px-3 py-2.5 text-xs text-muted-foreground">—</td>
        <td className="py-1.5 text-xs text-muted-foreground">{formatDate(folder.createdAt)}</td>
        <td className="px-3 py-2.5 text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-0"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              {isOwner && (
                <>
                  <DropdownMenuItem onClick={() => setShareOpen(true)}>
                    <Link2 className="h-4 w-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {canEdit && (
                <>
                  <DropdownMenuItem onClick={() => setCreateOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New subfolder
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setRenameOpen(true)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Rename
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem onClick={() => { toast.promise(downloadFolderAsZip(folder.id, folder.name), { loading: "Preparing ZIP…", success: "Downloaded", error: "Failed to download" }) }}>
                <Download className="h-4 w-4 mr-2" />
                Download as ZIP
              </DropdownMenuItem>
              {canEdit && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </td>
      </tr>

      <ShareFolderDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        folderId={folder.id}
        itemName={folder.name}
      />

      <FolderDialog
        open={createOpen}
        mode="create"
        onClose={() => setCreateOpen(false)}
        onConfirm={(name) => { createFolder(name, folder.id); toast.success(`Folder "${name}" created`) }}
      />

      <FolderDialog
        open={renameOpen}
        mode="rename"
        initialValue={folder.name}
        onClose={() => setRenameOpen(false)}
        onConfirm={(name) => { renameFolder(folder.id, name); toast.success("Folder renamed") }}
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
              onClick={() => { deleteFolder(folder.id); toast.success(`"${folder.name}" deleted`) }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
