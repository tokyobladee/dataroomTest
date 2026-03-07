import { useRef, useState } from "react"
import { Plus, Home } from "lucide-react"
import { useDataroomStore } from "@/stores/dataroomStore"
import { useNavigateFolder } from "@/lib/useNavigateFolder"
import { Button } from "@/components/ui/button"
import { FolderTreeItem } from "./FolderTreeItem"
import { FolderDialog } from "./FolderDialog"
import { FileTreeItem } from "@/components/file/FileTreeItem"
import { handleDroppedFiles, isFileDrag } from "@/lib/dropFiles"
import { getDragItem, isInternalDrag } from "@/lib/dragItem"
import { cn } from "@/lib/utils"

export function FolderTree() {
  const { folders, files, activeFolderId, createFolder, uploadFile, moveFile, moveFolder } = useDataroomStore()
  const navigateFolder = useNavigateFolder()
  const [createOpen, setCreateOpen] = useState(false)
  const [isDragOverAllFiles, setIsDragOverAllFiles] = useState(false)
  const allFilesCounter = useRef(0)

  const rootFolders = folders.filter((f) => f.parentId === null)
  const rootFiles = files.filter((f) => f.folderId === null)
  const isRootActive = activeFolderId === null

  function handleDragOver(e: React.DragEvent) {
    if (!isFileDrag(e) && !isInternalDrag(e)) return
    e.preventDefault()
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const item = getDragItem(e)
    if (item) {
      if (item.type === "file") await moveFile(item.id, null)
      else await moveFolder(item.id, null)
      return
    }
    await handleDroppedFiles(e.dataTransfer, (file) => uploadFile(file, null))
  }

  function handleAllFilesDragEnter(e: React.DragEvent) {
    if (!isFileDrag(e) && !isInternalDrag(e)) return
    e.preventDefault()
    e.stopPropagation()
    allFilesCounter.current++
    setIsDragOverAllFiles(true)
  }

  function handleAllFilesDragLeave(e: React.DragEvent) {
    e.stopPropagation()
    allFilesCounter.current--
    if (allFilesCounter.current === 0) setIsDragOverAllFiles(false)
  }

  function handleAllFilesDragOver(e: React.DragEvent) {
    if (!isFileDrag(e) && !isInternalDrag(e)) return
    e.preventDefault()
    e.stopPropagation()
  }

  async function handleAllFilesDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    allFilesCounter.current = 0
    setIsDragOverAllFiles(false)
    const item = getDragItem(e)
    if (item) {
      if (item.type === "file") await moveFile(item.id, null)
      else await moveFolder(item.id, null)
      return
    }
    await handleDroppedFiles(e.dataTransfer, (file) => uploadFile(file, null))
  }

  return (
    <div
      className="relative flex flex-col gap-1"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Root "All files" row — stops propagation so GlobalSidebar overlay hides when hovering here */}
      <div
        className={cn(
          "flex items-center gap-1 rounded-md py-1.5 px-2 cursor-pointer select-none text-sm hover:bg-accent",
          isRootActive && "bg-accent font-medium",
          isDragOverAllFiles && "bg-primary/10 ring-1 ring-inset ring-primary/50"
        )}
        onClick={() => navigateFolder(null)}
        onDragEnter={handleAllFilesDragEnter}
        onDragLeave={(e) => handleAllFilesDragLeave(e)}
        onDragOver={handleAllFilesDragOver}
        onDrop={handleAllFilesDrop}
      >
        <span className="h-4 w-4 shrink-0 invisible" />
        <Home className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 truncate ml-1">All files</span>
      </div>

      <div className="flex items-center justify-between px-2 py-1 mt-1">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Folders
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

      <FolderDialog
        open={createOpen}
        mode="create"
        onClose={() => setCreateOpen(false)}
        onConfirm={(name) => createFolder(name, null)}
      />
    </div>
  )
}
