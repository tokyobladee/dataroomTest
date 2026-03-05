import { useState } from "react"
import {
  ChevronRight,
  Folder,
  FolderOpen,
  MoreHorizontal,
  Plus,
  Pencil,
  Trash2,
  Check,
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
import { FileTreeItem } from "@/components/file/FileTreeItem"

interface Props {
  folder: FolderType
  depth: number
  allFolders: FolderType[]
}

export function FolderTreeItem({ folder, depth, allFolders }: Props) {
  const {
    activeFolderId,
    expandedFolderIds,
    selectedIds,
    files,
    setActiveFolder,
    toggleFolderExpanded,
    toggleSelected,
    createFolder,
    renameFolder,
    deleteFolder,
  } = useDataroomStore()

  const [createOpen, setCreateOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const children = allFolders.filter((f) => f.parentId === folder.id)
  const folderFiles = files.filter((f) => f.folderId === folder.id)
  const isActive = activeFolderId === folder.id
  const isExpanded = expandedFolderIds.includes(folder.id)
  const isSelected = selectedIds.includes(folder.id)
  const hasChildren = children.length > 0 || folderFiles.length > 0

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1 rounded-md py-1.5 cursor-pointer select-none text-sm hover:bg-accent",
          (isActive || isSelected) && "bg-accent font-medium"
        )}
        style={{ paddingLeft: `${8 + depth * 12}px`, paddingRight: "8px" }}
        onClick={() => setActiveFolder(folder.id)}
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

        <button
          className="relative h-4 w-4 shrink-0"
          onClick={(e) => { e.stopPropagation(); toggleSelected(folder.id) }}
        >
          <span className={cn(
            "absolute inset-0 flex items-center justify-center transition-opacity text-muted-foreground",
            "group-hover:opacity-0",
            isSelected && "opacity-0"
          )}>
            {isActive || isExpanded
              ? <FolderOpen className="h-4 w-4" />
              : <Folder className="h-4 w-4" />
            }
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

        <span className="flex-1 truncate ml-1">{folder.name}</span>

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

      {isExpanded && (
        <div>
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
