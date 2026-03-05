import { useState } from "react"
import {
  ChevronRight,
  Folder,
  FolderOpen,
  MoreHorizontal,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react"
import type { Folder as FolderType } from "@/types"
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
import { FolderDialog } from "./FolderDialog"

interface Props {
  folder: FolderType
  depth: number
  allFolders: FolderType[]
}

export function FolderTreeItem({ folder, depth, allFolders }: Props) {
  const { activeFolderId, setActiveFolder, createFolder, renameFolder, deleteFolder } =
    useDataroomStore()

  const [expanded, setExpanded] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const children = allFolders.filter((f) => f.parentId === folder.id)
  const isActive = activeFolderId === folder.id
  const hasChildren = children.length > 0

  function handleClick() {
    setActiveFolder(isActive ? null : folder.id)
    if (hasChildren) setExpanded((prev) => !prev)
  }

  function handleToggle(e: React.MouseEvent) {
    e.stopPropagation()
    setExpanded((prev) => !prev)
  }

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1 rounded-md px-2 py-1.5 cursor-pointer select-none text-sm hover:bg-accent",
          isActive && "bg-accent font-medium"
        )}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
        onClick={handleClick}
      >
        <button
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            !hasChildren && "invisible",
            expanded && "rotate-90"
          )}
          onClick={handleToggle}
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {isActive || expanded ? (
          <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}

        <span className="flex-1 truncate">{folder.name}</span>

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

      {expanded && children.length > 0 && (
        <div>
          {children.map((child) => (
            <FolderTreeItem
              key={child.id}
              folder={child}
              depth={depth + 1}
              allFolders={allFolders}
            />
          ))}
        </div>
      )}

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
    </div>
  )
}
