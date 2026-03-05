import { getDB } from "./index"
import type { Folder } from "@/types"

export async function getFoldersByDataroom(dataroomId: string): Promise<Folder[]> {
  const db = await getDB()
  return (await db.getAll("folders")).filter((f) => f.dataroomId === dataroomId)
}

export async function createFolder(folder: Folder): Promise<void> {
  const db = await getDB()
  await db.add("folders", folder)
}

export async function updateFolder(folder: Folder): Promise<void> {
  const db = await getDB()
  await db.put("folders", folder)
}

export async function deleteFolder(id: string): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(["folders", "files"], "readwrite")
  const [allFolders, allFiles] = await Promise.all([
    tx.objectStore("folders").getAll(),
    tx.objectStore("files").getAll(),
  ])

  const idsToDelete = collectDescendantIds(id, allFolders)
  idsToDelete.add(id)

  await Promise.all([
    ...[...idsToDelete].map((fid) => tx.objectStore("folders").delete(fid)),
    ...allFiles
      .filter((f) => f.folderId !== null && idsToDelete.has(f.folderId))
      .map((f) => tx.objectStore("files").delete(f.id)),
  ])

  await tx.done
}

function collectDescendantIds(parentId: string, allFolders: Folder[]): Set<string> {
  const result = new Set<string>()
  for (const child of allFolders.filter((f) => f.parentId === parentId)) {
    result.add(child.id)
    collectDescendantIds(child.id, allFolders).forEach((id) => result.add(id))
  }
  return result
}
