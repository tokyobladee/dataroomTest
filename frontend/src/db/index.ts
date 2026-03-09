import { openDB, type DBSchema, type IDBPDatabase } from "idb"
import type { Dataroom, DataroomFile, Folder } from "@/types"

interface DataroomDB extends DBSchema {
  datarooms: {
    key: string
    value: Dataroom
  }
  folders: {
    key: string
    value: Folder
    indexes: { by_dataroom: string }
  }
  files: {
    key: string
    value: DataroomFile & { blob: Blob }
    indexes: { by_dataroom: string }
  }
}

let dbInstance: IDBPDatabase<DataroomDB> | null = null

export async function getDB(): Promise<IDBPDatabase<DataroomDB>> {
  if (dbInstance) return dbInstance

  dbInstance = await openDB<DataroomDB>("dataroom-db", 1, {
    upgrade(db) {
      db.createObjectStore("datarooms", { keyPath: "id" })

      const folderStore = db.createObjectStore("folders", { keyPath: "id" })
      folderStore.createIndex("by_dataroom", "dataroomId")

      const fileStore = db.createObjectStore("files", { keyPath: "id" })
      fileStore.createIndex("by_dataroom", "dataroomId")
    },
  })

  return dbInstance
}
