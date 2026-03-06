import { useEffect, useState } from "react"
import { FileList } from "@/components/file/FileList"
import { SelectionBar } from "@/components/layout/SelectionBar"
import { UploadFab } from "@/components/file/UploadFab"
import { useDataroomStore } from "@/stores/dataroomStore"

export function DataroomPage() {
  const { selectedIds, clearSelection, setPreviewFile } = useDataroomStore()
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

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
