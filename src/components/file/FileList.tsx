import { useRef, useState } from "react"
import { FileText, ChevronRight } from "lucide-react"
import { useDataroomStore } from "@/stores/dataroomStore"
import { FolderCard } from "@/components/folder/FolderCard"
import { FileItem } from "./FileItem"
import { handleDroppedFiles, isFileDrag } from "@/lib/dropFiles"
import { cn } from "@/lib/utils"

export function FileList() {
  const { files, folders, activeFolderId, setActiveFolder, uploadFile } = useDataroomStore()
  const [isDragOver, setIsDragOver] = useState(false)
  const dragCounter = useRef(0)

  const activeFolder = folders.find((f) => f.id === activeFolderId) ?? null
  const subfolders = folders.filter((f) => f.parentId === activeFolderId)
  const visibleFiles = files.filter((f) => f.folderId === activeFolderId)

  const breadcrumb = buildBreadcrumb(activeFolderId, folders)

  function handleDragEnter(e: React.DragEvent) {
    if (!isFileDrag(e)) return
    e.preventDefault()
    dragCounter.current++
    setIsDragOver(true)
  }

  function handleDragLeave() {
    dragCounter.current--
    if (dragCounter.current === 0) setIsDragOver(false)
  }

  function handleDragOver(e: React.DragEvent) {
    if (!isFileDrag(e)) return
    e.preventDefault()
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    dragCounter.current = 0
    setIsDragOver(false)
    await handleDroppedFiles(e.dataTransfer, (file) => uploadFile(file, activeFolderId))
  }

  return (
    <div
      className={cn("flex flex-col h-full p-6 gap-6 transition-colors", isDragOver && "bg-accent/40")}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex flex-col gap-1">
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <button
            className="hover:text-foreground transition-colors"
            onClick={() => setActiveFolder(null)}
          >
            All files
          </button>
          {breadcrumb.map((crumb) => (
            <span key={crumb.id} className="flex items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5" />
              <button
                className="hover:text-foreground transition-colors"
                onClick={() => setActiveFolder(crumb.id)}
              >
                {crumb.name}
              </button>
            </span>
          ))}
        </nav>
        <div className="flex items-baseline gap-2">
          <h2 className="text-lg font-semibold">
            {activeFolder ? activeFolder.name : "All files"}
          </h2>
          <span className="text-sm text-muted-foreground">
            {subfolders.length > 0 && `${subfolders.length} folder${subfolders.length > 1 ? "s" : ""}`}
            {subfolders.length > 0 && visibleFiles.length > 0 && " · "}
            {visibleFiles.length > 0 && `${visibleFiles.length} file${visibleFiles.length > 1 ? "s" : ""}`}
          </span>
        </div>
      </div>

      {subfolders.length > 0 && (
        <div className="flex flex-col gap-2">
          {subfolders.map((folder) => (
            <FolderCard key={folder.id} folder={folder} />
          ))}
        </div>
      )}

      {visibleFiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4 mb-3">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No files here</p>
          <p className="text-sm text-muted-foreground mt-1">
            Click the button below to upload PDF files
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {visibleFiles.map((file) => (
            <FileItem key={file.id} file={file} />
          ))}
        </div>
      )}
    </div>
  )
}

function buildBreadcrumb(
  folderId: string | null,
  allFolders: { id: string; name: string; parentId: string | null }[]
): { id: string; name: string }[] {
  if (!folderId) return []
  const crumbs: { id: string; name: string }[] = []
  let current = allFolders.find((f) => f.id === folderId)
  while (current) {
    crumbs.unshift({ id: current.id, name: current.name })
    current = current.parentId ? allFolders.find((f) => f.id === current!.parentId) : undefined
  }
  return crumbs
}
