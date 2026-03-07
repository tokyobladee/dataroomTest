import { useRef, useState } from "react"
import {
  ChevronRight,
  Folder,
  FolderOpen,
  MoreHorizontal,
  Plus,
  Pencil,
  Trash2,
  Link2,
} from "lucide-react"
import type { Folder as FolderType } from "@/types"
import { useDataroomStore } from "@/stores/dataroomStore"
import { useNavigateFolder } from "@/lib/useNavigateFolder"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
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
import { FolderDialog } from "./FolderDialog"
import { ShareFolderDialog } from "@/components/share/ShareFolderDialog"
import { FileTreeItem } from "@/components/file/FileTreeItem"
import { handleDroppedFiles, isFileDrag } from "@/lib/dropFiles"
import { setDragItem, getDragItem, isInternalDrag } from "@/lib/dragItem"

interface Props {
  folder: FolderType
  depth: number
  allFolders: FolderType[]
}

export function FolderTreeItem({ folder, depth, allFolders }: Props) {
  const {
    activeFolderId,
    expandedFolderIds,
    files,
    toggleFolderExpanded,
    createFolder,
    moveFolder,
    moveFile,
    renameFolder,
    deleteFolder,
    uploadFile,
  } = useDataroomStore()
  const navigateFolder = useNavigateFolder()

  const [createOpen, setCreateOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const dragCounter = useRef(0)

  const children = allFolders.filter((f) => f.parentId === folder.id)
  const folderFiles = files.filter((f) => f.folderId === folder.id)
  const isActive = activeFolderId === folder.id
  const isExpanded = expandedFolderIds.includes(folder.id)
  const hasChildren = children.length > 0 || folderFiles.length > 0

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

  return (
    <div>
      <div
        draggable
        onDragStart={(e) => { e.stopPropagation(); setDragItem(e, { id: folder.id, type: "folder" }) }}
        className={cn(
          "group flex items-center gap-1 rounded-md py-1.5 cursor-pointer select-none text-sm hover:bg-accent",
          isActive && "bg-accent font-medium",
          isDragOver && "bg-primary/10 ring-1 ring-inset ring-primary/50"
        )}
        style={{ paddingLeft: `${8 + depth * 12}px`, paddingRight: "8px" }}
        onClick={() => navigateFolder(folder.id)}
        onDragEnter={handleDragEnter}
        onDragLeave={(e) => handleDragLeave(e)}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <button
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            !hasChildren && "invisible",
            isExpanded && "rotate-90"
          )}
          onClick={(e) => { e.stopPropagation(); toggleFolderExpanded(folder.id) }}
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <span className="shrink-0 text-muted-foreground">
          {isExpanded || isActive
            ? <FolderOpen className="h-4 w-4" />
            : <Folder className="h-4 w-4" />
          }
        </span>

        <span className="flex-1 truncate ml-1">{folder.name}</span>

        {hasChildren && (
          <span className="text-xs text-muted-foreground/60 shrink-0 group-hover:hidden">
            {children.length + folderFiles.length}
          </span>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity shrink-0"
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={() => setShareOpen(true)}>
              <Link2 className="h-4 w-4 mr-2" />
              Share
            </DropdownMenuItem>
            <DropdownMenuSeparator />
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

      <div
        className="overflow-hidden transition-[max-height] duration-200 ease-in-out"
        style={{ maxHeight: isExpanded ? `${(children.length + folderFiles.length) * 200}px` : 0 }}
      >
        {children.map((child) => (
          <FolderTreeItem
            key={child.id}
            folder={child}
            depth={depth + 1}
            allFolders={allFolders}
          />
        ))}
        {folderFiles.map((file) => (
          <FileTreeItem key={file.id} file={file} depth={depth + 1} />
        ))}
      </div>

      <ShareFolderDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        folderId={folder.id}
        folderName={folder.name}
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
    </div>
  )
}
