import { useNavigate } from "react-router-dom"
import { useDataroomStore } from "@/stores/dataroomStore"
import type { Folder } from "@/types"

function buildFolderPath(folderId: string, folders: Folder[]): string {
  const segments: string[] = []
  let current: Folder | undefined = folders.find((f) => f.id === folderId)
  while (current) {
    segments.unshift(encodeURIComponent(current.name))
    current = current.parentId ? folders.find((f) => f.id === current!.parentId) : undefined
  }
  return "/" + segments.join("/")
}

export function useNavigateFolder() {
  const navigate = useNavigate()
  const folders = useDataroomStore((s) => s.folders)
  return (folderId: string | null) => {
    if (!folderId) {
      navigate("/")
    } else {
      navigate(buildFolderPath(folderId, folders))
    }
  }
}
