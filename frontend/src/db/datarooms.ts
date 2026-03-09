import { getDB } from "./index"
import type { Dataroom } from "@/types"

export async function getAllDatarooms(): Promise<Dataroom[]> {
  const db = await getDB()
  return db.getAll("datarooms")
}

export async function createDataroom(dataroom: Dataroom): Promise<void> {
  const db = await getDB()
  await db.add("datarooms", dataroom)
}

export async function deleteDataroom(id: string): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(["datarooms", "folders", "files"], "readwrite")
  const [folders, files] = await Promise.all([
    tx.objectStore("folders").getAll(),
    tx.objectStore("files").getAll(),
  ])

  await Promise.all([
    tx.objectStore("datarooms").delete(id),
    ...folders.filter((f) => f.dataroomId === id).map((f) => tx.objectStore("folders").delete(f.id)),
    ...files.filter((f) => f.dataroomId === id).map((f) => tx.objectStore("files").delete(f.id)),
  ])

  await tx.done
}
