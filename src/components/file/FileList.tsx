import { useRef, useState } from "react"
import { Check, FileText, Folder as FolderIcon, ChevronRight, Search, X, Upload, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { useDataroomStore } from "@/stores/dataroomStore"
import { FolderCard } from "@/components/folder/FolderCard"
import { FileItem } from "./FileItem"
import { handleDroppedFiles, isFileDrag } from "@/lib/dropFiles"
import { getDragItem, isInternalDrag } from "@/lib/dragItem"
import { cn } from "@/lib/utils"
import type { Folder } from "@/types"

type TypeFilter = "all" | "folders" | "files"
type SortKey = "name" | "size" | "date"
type SortDir = "asc" | "desc"

export function FileList() {
  const { files, folders, activeFolderId, setActiveFolder, uploadFile, moveFile, moveFolder, selectedIds, selectAll, clearSelection, setPreviewFile, isLoading } = useDataroomStore()
  const [isDragOver, setIsDragOver] = useState(false)
  const [isOsDrag, setIsOsDrag] = useState(false)
  const [query, setQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all")
  const [sortKey, setSortKey] = useState<SortKey>("name")
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const dragCounter = useRef(0)

  const trimmedQuery = query.trim().toLowerCase()
  const isSearching = trimmedQuery.length > 0

  const activeFolder = folders.find((f) => f.id === activeFolderId) ?? null

  const rawSubfolders = folders.filter((f) => f.parentId === activeFolderId)
  const rawFiles = files.filter((f) => f.folderId === activeFolderId)

  const subfolders = typeFilter === "files" ? [] : sortItems(rawSubfolders, sortKey, sortDir, "folder")
  const visibleFiles = typeFilter === "folders" ? [] : sortItems(rawFiles, sortKey, sortDir, "file")

  const breadcrumb = buildBreadcrumb(activeFolderId, folders)

  const allVisibleIds = [
    ...subfolders.map((f) => f.id),
    ...visibleFiles.map((f) => f.id),
  ]
  const allSelected = allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedIds.includes(id))
  const someSelected = allVisibleIds.some((id) => selectedIds.includes(id))

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => d === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

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
    if (dragCounter.current === 0) setIsOsDrag(isFileDrag(e))
    dragCounter.current++
    setIsDragOver(true)
  }

  function handleDragLeave() {
    dragCounter.current--
    if (dragCounter.current === 0) { setIsDragOver(false); setIsOsDrag(false) }
  }

  function handleDragOver(e: React.DragEvent) {
    if (!isFileDrag(e) && !isInternalDrag(e)) return
    e.preventDefault()
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    dragCounter.current = 0
    setIsDragOver(false)
    setIsOsDrag(false)
    const item = getDragItem(e)
    if (item) {
      if (item.type === "file") await moveFile(item.id, activeFolderId)
      else await moveFolder(item.id, activeFolderId)
      return
    }
    await handleDroppedFiles(e.dataTransfer, (file) => uploadFile(file, activeFolderId))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
      </div>
    )
  }

  return (
    <div
      className="flex flex-col h-full p-6 gap-4"
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
          aria-label="Search files and folders"
          placeholder="Search files and folders…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-md border bg-background pl-9 pr-9 py-2 text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
        />
        {query && (
          <button
            aria-label="Clear search"
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
          onFileClick={(id) => { setQuery(""); setPreviewFile(id) }}
        />
      ) : (
        <>
          <div className="flex flex-col gap-2 shrink-0">
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
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-baseline gap-2">
                <h2 className="text-lg font-semibold">
                  {activeFolder ? activeFolder.name : "All files"}
                </h2>
                <span className="text-sm text-muted-foreground">
                  {rawSubfolders.length > 0 && `${rawSubfolders.length} folder${rawSubfolders.length > 1 ? "s" : ""}`}
                  {rawSubfolders.length > 0 && rawFiles.length > 0 && " · "}
                  {rawFiles.length > 0 && `${rawFiles.length} file${rawFiles.length > 1 ? "s" : ""}`}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {(["all", "folders", "files"] as TypeFilter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setTypeFilter(f)}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-xs font-medium transition-colors capitalize",
                      typeFilter === f
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                  >
                    {f === "all" ? "All" : f === "folders" ? "Folders" : "Files"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="relative flex flex-col flex-1 min-h-0 overflow-auto">
            {isDragOver && isOsDrag && (
              <div className="absolute inset-0 z-20 pointer-events-none rounded-xl border-2 border-dashed border-primary bg-primary/5 flex flex-col items-center justify-center gap-3">
                <div className="rounded-full bg-primary/10 p-4">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <p className="text-sm font-semibold text-primary">Drop PDF files here</p>
                <p className="text-xs text-primary/70">
                  Into &ldquo;{activeFolder ? activeFolder.name : "All files"}&rdquo;
                </p>
              </div>
            )}

            {rawSubfolders.length === 0 && rawFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="rounded-full bg-muted p-4 mb-3">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">No files here</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Drag PDF files here or click the + button to upload
                </p>
              </div>
            ) : (
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b sticky top-0 bg-background z-10">
                    <th scope="col" className="w-10 px-3 py-2">
                      <button className="flex items-center justify-center" onClick={toggleSelectAll}>
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
                    </th>
                    <th scope="col" className="px-3 py-2 text-left" aria-sort={sortKey === "name" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
                      <SortHeader label="Name" colKey="name" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                    </th>
                    <th scope="col" className="w-24 px-3 py-2 text-left" aria-sort={sortKey === "size" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
                      <SortHeader label="Size" colKey="size" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                    </th>
                    <th scope="col" className="w-32 px-3 py-2 text-left" aria-sort={sortKey === "date" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
                      <SortHeader label="Added" colKey="date" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                    </th>
                    <th scope="col" className="w-16 px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {subfolders.map((folder) => (
                    <FolderCard key={folder.id} folder={folder} />
                  ))}
                  {visibleFiles.map((file) => (
                    <FileItem key={file.id} file={file} />
                  ))}
                </tbody>
              </table>
            )}
          </div>
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
  onFileClick: (id: string) => void
}

function SearchResults({ query, folders, files, allFolders, onFolderClick, onFileClick }: SearchResultsProps) {
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
            <FolderIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
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
          <button
            key={file.id}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent text-left w-full"
            onClick={() => onFileClick(file.id)}
          >
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 min-w-0">
              <span className="font-medium truncate block">{file.name}</span>
              {path && <span className="text-xs text-muted-foreground truncate block">{path}</span>}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function sortItems<T extends { name: string; createdAt: number; size?: number }>(
  items: T[],
  key: SortKey,
  dir: SortDir,
  _itemType: "folder" | "file"
): T[] {
  return [...items].sort((a, b) => {
    let cmp = 0
    if (key === "name") {
      cmp = a.name.localeCompare(b.name)
    } else if (key === "size") {
      cmp = (a.size ?? 0) - (b.size ?? 0)
    } else if (key === "date") {
      cmp = a.createdAt - b.createdAt
    }
    return dir === "asc" ? cmp : -cmp
  })
}

interface SortHeaderProps {
  label: string
  colKey: SortKey
  sortKey: SortKey
  sortDir: SortDir
  onSort: (key: SortKey) => void
}

function SortHeader({ label, colKey, sortKey, sortDir, onSort }: SortHeaderProps) {
  const active = sortKey === colKey
  return (
    <button
      className={cn(
        "flex items-center gap-1 text-xs font-medium uppercase tracking-wide transition-colors",
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      )}
      onClick={() => onSort(colKey)}
    >
      {label}
      {active ? (
        sortDir === "asc"
          ? <ArrowUp className="h-3 w-3" />
          : <ArrowDown className="h-3 w-3" />
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-40" />
      )}
    </button>
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
