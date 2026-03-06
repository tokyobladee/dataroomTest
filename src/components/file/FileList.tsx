import { useRef, useState } from "react"
import { Check, FileText, ChevronRight, Search, X } from "lucide-react"
import { useDataroomStore } from "@/stores/dataroomStore"
import { FolderCard } from "@/components/folder/FolderCard"
import { FileItem } from "./FileItem"
import { handleDroppedFiles, isFileDrag } from "@/lib/dropFiles"
import { getDragItem, isInternalDrag } from "@/lib/dragItem"
import { cn } from "@/lib/utils"
import type { Folder } from "@/types"

export function FileList() {
  const { files, folders, activeFolderId, setActiveFolder, uploadFile, moveFile, moveFolder, selectedIds, selectAll, clearSelection } = useDataroomStore()
  const [isDragOver, setIsDragOver] = useState(false)
  const [query, setQuery] = useState("")
  const dragCounter = useRef(0)

  const trimmedQuery = query.trim().toLowerCase()
  const isSearching = trimmedQuery.length > 0

  const activeFolder = folders.find((f) => f.id === activeFolderId) ?? null
  const subfolders = folders.filter((f) => f.parentId === activeFolderId)
  const visibleFiles = files.filter((f) => f.folderId === activeFolderId)

  const breadcrumb = buildBreadcrumb(activeFolderId, folders)

  const allVisibleIds = [
    ...subfolders.map((f) => f.id),
    ...visibleFiles.map((f) => f.id),
  ]
  const allSelected = allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedIds.includes(id))
  const someSelected = allVisibleIds.some((id) => selectedIds.includes(id))

  const searchFolders = isSearching
    ? folders.filter((f) => f.name.toLowerCase().includes(trimmedQuery))
    : []
  const searchFiles = isSearching
    ? files.filter((f) => f.name.toLowerCase().includes(trimmedQuery))
    : []

  function toggleSelectAll() {
    if (allSelected) {
      clearSelection()
    } else {
      selectAll(allVisibleIds)
    }
  }

  function handleDragEnter(e: React.DragEvent) {
    if (!isFileDrag(e) && !isInternalDrag(e)) return
    e.preventDefault()
    dragCounter.current++
    setIsDragOver(true)
  }

  function handleDragLeave() {
    dragCounter.current--
    if (dragCounter.current === 0) setIsDragOver(false)
  }

  function handleDragOver(e: React.DragEvent) {
    if (!isFileDrag(e) && !isInternalDrag(e)) return
    e.preventDefault()
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    dragCounter.current = 0
    setIsDragOver(false)
    const item = getDragItem(e)
    if (item) {
      if (item.type === "file") await moveFile(item.id, activeFolderId)
      else await moveFolder(item.id, activeFolderId)
      return
    }
    await handleDroppedFiles(e.dataTransfer, (file) => uploadFile(file, activeFolderId))
  }

  return (
    <div
      className={cn("flex flex-col h-full p-6 gap-4 transition-colors", isDragOver && "bg-accent/40")}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Search files and folders…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-md border bg-background pl-9 pr-9 py-2 text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
        />
        {query && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setQuery("")}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isSearching ? (
        <SearchResults
          query={trimmedQuery}
          folders={searchFolders}
          files={searchFiles}
          allFolders={folders}
          onFolderClick={(id) => { setQuery(""); setActiveFolder(id) }}
        />
      ) : (
        <>
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
            <div className="flex items-center gap-3">
              {allVisibleIds.length > 0 && (
                <button
                  className="shrink-0 flex items-center justify-center"
                  onClick={toggleSelectAll}
                >
                  {allSelected ? (
                    <span className="h-4 w-4 rounded bg-foreground border border-foreground flex items-center justify-center">
                      <Check className="h-2.5 w-2.5 text-background" />
                    </span>
                  ) : someSelected ? (
                    <span className="h-4 w-4 rounded border border-foreground bg-foreground/20 flex items-center justify-center">
                      <span className="h-1.5 w-2.5 rounded-sm bg-foreground" />
                    </span>
                  ) : (
                    <span className="h-4 w-4 rounded border border-muted-foreground/40 flex items-center justify-center hover:border-muted-foreground" />
                  )}
                </button>
              )}
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
        </>
      )}
    </div>
  )
}

interface SearchResultsProps {
  query: string
  folders: Folder[]
  files: ReturnType<typeof useDataroomStore.getState>["files"]
  allFolders: Folder[]
  onFolderClick: (id: string) => void
}

function SearchResults({ query, folders, files, allFolders, onFolderClick }: SearchResultsProps) {
  const total = folders.length + files.length

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-4 mb-3">
          <Search className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">No results for &ldquo;{query}&rdquo;</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs text-muted-foreground mb-2">
        {total} result{total !== 1 ? "s" : ""}
      </p>
      {folders.map((folder) => {
        const path = buildPathString(folder.parentId, allFolders)
        return (
          <button
            key={folder.id}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent text-left"
            onClick={() => onFolderClick(folder.id)}
          >
            <span className="text-muted-foreground">📁</span>
            <span className="flex-1 min-w-0">
              <span className="font-medium truncate block">{folder.name}</span>
              {path && <span className="text-xs text-muted-foreground truncate block">{path}</span>}
            </span>
          </button>
        )
      })}
      {files.map((file) => {
        const path = buildPathString(file.folderId, allFolders)
        return (
          <div
            key={file.id}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm"
          >
            <span className="text-muted-foreground">📄</span>
            <span className="flex-1 min-w-0">
              <span className="font-medium truncate block">{file.name}</span>
              {path && <span className="text-xs text-muted-foreground truncate block">{path}</span>}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function buildPathString(folderId: string | null, allFolders: Folder[]): string {
  if (!folderId) return ""
  const parts: string[] = []
  let current = allFolders.find((f) => f.id === folderId)
  while (current) {
    parts.unshift(current.name)
    current = current.parentId ? allFolders.find((f) => f.id === current!.parentId) : undefined
  }
  return parts.join(" / ")
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
