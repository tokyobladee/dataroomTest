import { create } from "zustand"
import { getAllDatarooms, createDataroom, deleteDataroom } from "@/db/datarooms"
import { getFoldersByDataroom, createFolder, updateFolder, deleteFolder } from "@/db/folders"
import { getFilesByDataroom, createFile, updateFile, deleteFile, getFileBlob } from "@/db/files"
import type { Dataroom, DataroomFile, Folder } from "@/types"
import { nanoid } from "@/lib/nanoid"

interface DataroomState {
  datarooms: Dataroom[]
  activeDataroomId: string | null
  folders: Folder[]
  files: DataroomFile[]
  activeFolderId: string | null
  expandedFolderIds: string[]
  isLoading: boolean

  loadDatarooms: () => Promise<void>
  createDataroom: (name: string) => Promise<void>
  deleteDataroom: (id: string) => Promise<void>
  setActiveDataroom: (id: string) => Promise<void>
  exitDataroom: () => void

  setActiveFolder: (id: string | null) => void
  toggleFolderExpanded: (id: string) => void
  createFolder: (name: string, parentId: string | null) => Promise<void>
  renameFolder: (id: string, name: string) => Promise<void>
  deleteFolder: (id: string) => Promise<void>

  uploadFile: (file: File, folderId: string | null) => Promise<void>
  renameFile: (id: string, name: string) => Promise<void>
  deleteFile: (id: string) => Promise<void>
  openFile: (id: string) => Promise<void>
}

export const useDataroomStore = create<DataroomState>((set, get) => ({
  datarooms: [],
  activeDataroomId: null,
  folders: [],
  files: [],
  activeFolderId: null,
  expandedFolderIds: [],
  isLoading: false,

  loadDatarooms: async () => {
    set({ isLoading: true })
    const datarooms = await getAllDatarooms()
    set({ datarooms, isLoading: false })
  },

  createDataroom: async (name: string) => {
    const dataroom: Dataroom = { id: nanoid(), name, createdAt: Date.now() }
    await createDataroom(dataroom)
    set((s) => ({ datarooms: [...s.datarooms, dataroom] }))
  },

  deleteDataroom: async (id: string) => {
    await deleteDataroom(id)
    set((s) => ({
      datarooms: s.datarooms.filter((d) => d.id !== id),
      ...(s.activeDataroomId === id
        ? { activeDataroomId: null, folders: [], files: [], activeFolderId: null, expandedFolderIds: [] }
        : {}),
    }))
  },

  setActiveDataroom: async (id: string) => {
    set({ isLoading: true, activeDataroomId: id, activeFolderId: null, expandedFolderIds: [] })
    const [folders, files] = await Promise.all([
      getFoldersByDataroom(id),
      getFilesByDataroom(id),
    ])
    set({ folders, files, isLoading: false })
  },

  exitDataroom: () => {
    set({ activeDataroomId: null, folders: [], files: [], activeFolderId: null, expandedFolderIds: [] })
  },

  setActiveFolder: (id: string | null) => {
    if (id === null) {
      set({ activeFolderId: null })
      return
    }
    const ancestors = getAncestorIds(id, get().folders)
    set((s) => ({
      activeFolderId: id,
      expandedFolderIds: Array.from(new Set([...s.expandedFolderIds, ...ancestors, id])),
    }))
  },

  toggleFolderExpanded: (id: string) => {
    set((s) => ({
      expandedFolderIds: s.expandedFolderIds.includes(id)
        ? s.expandedFolderIds.filter((fid) => fid !== id)
        : [...s.expandedFolderIds, id],
    }))
  },

  createFolder: async (name: string, parentId: string | null) => {
    const { activeDataroomId, folders } = get()
    if (!activeDataroomId) return

    const siblings = folders.filter((f) => f.parentId === parentId && f.dataroomId === activeDataroomId)
    const uniqueName = resolveUniqueName(name, siblings.map((f) => f.name))

    const folder: Folder = {
      id: nanoid(),
      dataroomId: activeDataroomId,
      parentId,
      name: uniqueName,
      createdAt: Date.now(),
    }
    await createFolder(folder)
    set((s) => ({
      folders: [...s.folders, folder],
      expandedFolderIds: parentId
        ? Array.from(new Set([...s.expandedFolderIds, parentId]))
        : s.expandedFolderIds,
    }))
  },

  renameFolder: async (id: string, name: string) => {
    const folder = get().folders.find((f) => f.id === id)
    if (!folder) return
    const updated = { ...folder, name }
    await updateFolder(updated)
    set((s) => ({ folders: s.folders.map((f) => (f.id === id ? updated : f)) }))
  },

  deleteFolder: async (id: string) => {
    const idsToDelete = collectDescendantIds(id, get().folders)
    idsToDelete.add(id)
    await deleteFolder(id)
    set((s) => ({
      folders: s.folders.filter((f) => !idsToDelete.has(f.id)),
      files: s.files.filter((f) => f.folderId === null || !idsToDelete.has(f.folderId)),
      activeFolderId: idsToDelete.has(s.activeFolderId ?? "") ? null : s.activeFolderId,
      expandedFolderIds: s.expandedFolderIds.filter((fid) => !idsToDelete.has(fid)),
    }))
  },

  uploadFile: async (file: File, folderId: string | null) => {
    const { activeDataroomId, files } = get()
    if (!activeDataroomId) return

    const baseName = file.name.replace(/\.pdf$/i, "")
    const siblings = files.filter((f) => f.folderId === folderId && f.dataroomId === activeDataroomId)
    const uniqueName = resolveUniqueName(baseName, siblings.map((f) => f.name))

    const record: DataroomFile = {
      id: nanoid(),
      dataroomId: activeDataroomId,
      folderId,
      name: uniqueName,
      size: file.size,
      mimeType: file.type,
      createdAt: Date.now(),
    }
    await createFile(record, file)
    set((s) => ({ files: [...s.files, record] }))
  },

  renameFile: async (id: string, name: string) => {
    const file = get().files.find((f) => f.id === id)
    if (!file) return
    const updated = { ...file, name }
    await updateFile(updated)
    set((s) => ({ files: s.files.map((f) => (f.id === id ? updated : f)) }))
  },

  deleteFile: async (id: string) => {
    await deleteFile(id)
    set((s) => ({ files: s.files.filter((f) => f.id !== id) }))
  },

  openFile: async (id: string) => {
    const blob = await getFileBlob(id)
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const tab = window.open(url, "_blank")
    if (tab) {
      tab.addEventListener("load", () => URL.revokeObjectURL(url))
    } else {
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
    }
  },
}))

function getAncestorIds(folderId: string, allFolders: Folder[]): string[] {
  const ancestors: string[] = []
  let current = allFolders.find((f) => f.id === folderId)
  while (current?.parentId) {
    ancestors.push(current.parentId)
    current = allFolders.find((f) => f.id === current!.parentId)
  }
  return ancestors
}

function collectDescendantIds(parentId: string, allFolders: Folder[]): Set<string> {
  const result = new Set<string>()
  for (const child of allFolders.filter((f) => f.parentId === parentId)) {
    result.add(child.id)
    collectDescendantIds(child.id, allFolders).forEach((id) => result.add(id))
  }
  return result
}

function resolveUniqueName(base: string, existingNames: string[]): string {
  if (!existingNames.includes(base)) return base
  let counter = 1
  while (existingNames.includes(`${base} (${counter})`)) counter++
  return `${base} (${counter})`
}
