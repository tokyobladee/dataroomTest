import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { FileList } from "@/components/file/FileList"
import { SelectionBar } from "@/components/layout/SelectionBar"
import { UploadFab } from "@/components/file/UploadFab"
import { useDataroomStore } from "@/stores/dataroomStore"
import type { Folder } from "@/types"

function resolveFolderPath(segments: string[], folders: Folder[]): string | null | undefined {
  // Returns null (root), folderId string, or undefined (not found)
  if (segments.length === 0) return null

  let parentId: string | null = null
  let current: Folder | undefined

  for (const segment of segments) {
    current = folders.find((f) => f.parentId === parentId && f.name === segment)
    if (!current) return undefined
    parentId = current.id
  }

  return current?.id ?? null
}

export function DataroomPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { selectedIds, clearSelection, setPreviewFile, activeFolderId, folders, setActiveFolder, isLoading } =
    useDataroomStore()
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  // Sync URL path → store after folders are loaded
  useEffect(() => {
    if (isLoading) return
    const segments = location.pathname
      .split("/")
      .filter(Boolean)
      .map(decodeURIComponent)
    const result = resolveFolderPath(segments, folders)
    if (result === undefined) {
      navigate("/", { replace: true })
    } else {
      setActiveFolder(result)
    }
  }, [location.pathname, folders, isLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const folder = folders.find((f) => f.id === activeFolderId)
    document.title = folder ? `${folder.name} — Dataroom` : "Dataroom"
  }, [activeFolderId, folders])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      if (tag === "INPUT" || tag === "TEXTAREA") return

      if (e.key === "Escape") {
        if (selectedIds.length > 0) {
          clearSelection()
        } else {
          setPreviewFile(null)
        }
      }

      if ((e.key === "Delete" || e.key === "Backspace") && selectedIds.length > 0) {
        e.preventDefault()
        setDeleteConfirmOpen(true)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [selectedIds, clearSelection, setPreviewFile])

  return (
    <>
      <FileList />
      <SelectionBar
        confirmOpen={deleteConfirmOpen}
        onConfirmOpenChange={setDeleteConfirmOpen}
      />
      <UploadFab />
    </>
  )
}
