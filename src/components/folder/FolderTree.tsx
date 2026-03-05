import { useState } from "react"
import { Plus, Home } from "lucide-react"
import { useDataroomStore } from "@/stores/dataroomStore"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { FolderTreeItem } from "./FolderTreeItem"
import { FolderDialog } from "./FolderDialog"
import { FileTreeItem } from "@/components/file/FileTreeItem"

export function FolderTree() {
  const { folders, files, activeFolderId, setActiveFolder, createFolder } = useDataroomStore()
  const [createOpen, setCreateOpen] = useState(false)

  const rootFolders = folders.filter((f) => f.parentId === null)
  const rootFiles = files.filter((f) => f.folderId === null)

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Explorer
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div
        className={cn(
          "flex items-center gap-2 rounded-md px-2 py-1.5 cursor-pointer text-sm hover:bg-accent select-none",
          activeFolderId === null && "bg-accent font-medium"
        )}
        onClick={() => setActiveFolder(null)}
      >
        <Home className="h-4 w-4 shrink-0 text-muted-foreground ml-5" />
        <span>All files</span>
      </div>

      <Separator className="my-1" />

      {rootFolders.map((folder) => (
        <FolderTreeItem
          key={folder.id}
          folder={folder}
          depth={0}
          allFolders={folders}
        />
      ))}

      {rootFiles.map((file) => (
        <FileTreeItem key={file.id} file={file} depth={0} />
      ))}

      {rootFolders.length === 0 && rootFiles.length === 0 && (
        <p className="px-2 py-2 text-xs text-muted-foreground">No files yet</p>
      )}

      <FolderDialog
        open={createOpen}
        mode="create"
        onClose={() => setCreateOpen(false)}
        onConfirm={(name) => createFolder(name, null)}
      />
    </div>
  )
}
