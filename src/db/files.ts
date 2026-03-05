import { getDB } from "./index"
import type { DataroomFile } from "@/types"

export async function getFilesByDataroom(dataroomId: string): Promise<DataroomFile[]> {
  const db = await getDB()
  return (await db.getAll("files"))
    .filter((f) => f.dataroomId === dataroomId)
    .map(({ blob: _blob, ...file }) => file)
}

export async function getFileBlob(id: string): Promise<Blob | null> {
  const db = await getDB()
  return (await db.get("files", id))?.blob ?? null
}

export async function createFile(file: DataroomFile, blob: Blob): Promise<void> {
  const db = await getDB()
  await db.add("files", { ...file, blob })
}

export async function updateFile(file: DataroomFile): Promise<void> {
  const db = await getDB()
  const existing = await db.get("files", file.id)
  if (!existing) return
  await db.put("files", { ...file, blob: existing.blob })
}

export async function deleteFile(id: string): Promise<void> {
  const db = await getDB()
  await db.delete("files", id)
}
