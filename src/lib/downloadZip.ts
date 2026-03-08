import JSZip from "jszip"
import { apiFetch } from "@/lib/api"
import type { DataroomFile, Folder } from "@/types"

interface ZipEntry {
  path: string
  fileId: string
}

function collectEntries(
  folderId: string | null,
  prefix: string,
  allFolders: Folder[],
  allFiles: DataroomFile[],
): ZipEntry[] {
  const entries: ZipEntry[] = []
  for (const f of allFiles.filter((f) => f.folderId === folderId)) {
    entries.push({ path: prefix + f.name, fileId: f.id })
  }
  for (const cf of allFolders.filter((f) => f.parentId === folderId)) {
    entries.push(...collectEntries(cf.id, prefix + cf.name + "/", allFolders, allFiles))
  }
  return entries
}

export function collectFolderEntries(
  folderId: string,
  allFolders: Folder[],
  allFiles: DataroomFile[],
): ZipEntry[] {
  return collectEntries(folderId, "", allFolders, allFiles)
}

export function collectSelectionEntries(
  selectedIds: string[],
  allFolders: Folder[],
  allFiles: DataroomFile[],
): ZipEntry[] {
  const selectedSet = new Set(selectedIds)
  const entries: ZipEntry[] = []

  for (const f of allFiles.filter((f) => selectedSet.has(f.id))) {
    entries.push({ path: f.name, fileId: f.id })
  }

  for (const folder of allFolders.filter((f) => selectedSet.has(f.id))) {
    entries.push(...collectEntries(folder.id, folder.name + "/", allFolders, allFiles))
  }

  return entries
}

export async function buildAndDownloadZip(
  dataroomId: string,
  entries: ZipEntry[],
  zipName: string,
): Promise<void> {
  if (entries.length === 0) return
  const zip = new JSZip()

  await Promise.all(
    entries.map(async ({ path, fileId }) => {
      const res = await apiFetch(`/api/datarooms/${dataroomId}/files/${fileId}`)
      const blob = await res.blob()
      zip.file(path, blob)
    }),
  )

  const content = await zip.generateAsync({ type: "blob" })
  const url = URL.createObjectURL(content)
  const a = document.createElement("a")
  a.href = url
  a.download = `${zipName}.zip`
  a.click()
  URL.revokeObjectURL(url)
}
