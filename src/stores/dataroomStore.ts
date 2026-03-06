import { create } from "zustand"
import { getAllDatarooms, createDataroom } from "@/db/datarooms"
import { getFoldersByDataroom, createFolder, updateFolder, deleteFolder } from "@/db/folders"
import { getFilesByDataroom, createFile, updateFile, deleteFile, getFileBlob } from "@/db/files"
import type { DataroomFile, Folder } from "@/types"
import { nanoid } from "@/lib/nanoid"

const DATAROOM_ID = "default"

interface DataroomState {
  folders: Folder[]
  files: DataroomFile[]
  activeFolderId: string | null
  expandedFolderIds: string[]
  selectedIds: string[]
  previewFileId: string | null
  isLoading: boolean

  initDataroom: () => Promise<void>

  setActiveFolder: (id: string | null) => void
  toggleFolderExpanded: (id: string) => void
  createFolder: (name: string, parentId: string | null) => Promise<void>
  moveFolder: (id: string, parentId: string | null) => Promise<void>
  renameFolder: (id: string, name: string) => Promise<void>
  deleteFolder: (id: string) => Promise<void>

  uploadFile: (file: File, folderId: string | null) => Promise<void>
  moveFile: (id: string, folderId: string | null) => Promise<void>
  renameFile: (id: string, name: string) => Promise<void>
  deleteFile: (id: string) => Promise<void>
  openFile: (id: string) => Promise<void>
  setPreviewFile: (id: string | null) => void

  toggleSelected: (id: string) => void
  selectAll: (ids: string[]) => void
  clearSelection: () => void
  deleteSelected: () => Promise<void>
}

export const useDataroomStore = create<DataroomState>((set, get) => ({
  folders: [],
  files: [],
  activeFolderId: null,
  expandedFolderIds: [],
  selectedIds: [],
  previewFileId: null,
  isLoading: false,

  initDataroom: async () => {
    set({ isLoading: true })
    const existing = await getAllDatarooms()
    if (existing.length === 0) {
      await createDataroom({ id: DATAROOM_ID, name: "My Dataroom", createdAt: Date.now() })
    }
    const [folders, files] = await Promise.all([
      getFoldersByDataroom(DATAROOM_ID),
      getFilesByDataroom(DATAROOM_ID),
    ])
    set({ folders, files, isLoading: false })
  },

  setActiveFolder: (id: string | null) => {
    if (id === null) {
      set({ activeFolderId: null, previewFileId: null })
      return
    }
    const ancestors = getAncestorIds(id, get().folders)
    set((s) => ({
      activeFolderId: id,
      expandedFolderIds: Array.from(new Set([...s.expandedFolderIds, ...ancestors, id])),
      previewFileId: null,
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
    const { folders } = get()

    const siblings = folders.filter((f) => f.parentId === parentId && f.dataroomId === DATAROOM_ID)
    const uniqueName = resolveUniqueName(name, siblings.map((f) => f.name))

    const folder: Folder = {
      id: nanoid(),
      dataroomId: DATAROOM_ID,
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

  moveFolder: async (id: string, parentId: string | null) => {
    const { folders } = get()
    const folder = folders.find((f) => f.id === id)
    if (!folder || folder.parentId === parentId) return
    const descendants = collectDescendantIds(id, folders)
    if (parentId !== null && (parentId === id || descendants.has(parentId))) return
    const updated = { ...folder, parentId }
    await updateFolder(updated)
    set((s) => ({ folders: s.folders.map((f) => (f.id === id ? updated : f)) }))
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
      selectedIds: s.selectedIds.filter((sid) => !idsToDelete.has(sid)),
    }))
  },

  uploadFile: async (file: File, folderId: string | null) => {
    const { files } = get()

    const baseName = file.name.replace(/\.pdf$/i, "")
    const siblings = files.filter((f) => f.folderId === folderId && f.dataroomId === DATAROOM_ID)
    const uniqueName = resolveUniqueName(baseName, siblings.map((f) => f.name))

    const record: DataroomFile = {
      id: nanoid(),
      dataroomId: DATAROOM_ID,
      folderId,
      name: uniqueName,
      size: file.size,
      mimeType: file.type,
      createdAt: Date.now(),
    }
    await createFile(record, file)
    set((s) => ({ files: [...s.files, record] }))
  },

  moveFile: async (id: string, folderId: string | null) => {
    const file = get().files.find((f) => f.id === id)
    if (!file || file.folderId === folderId) return
    const updated = { ...file, folderId }
    await updateFile(updated)
    set((s) => ({ files: s.files.map((f) => (f.id === id ? updated : f)) }))
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
    set((s) => ({
      files: s.files.filter((f) => f.id !== id),
      selectedIds: s.selectedIds.filter((sid) => sid !== id),
      previewFileId: s.previewFileId === id ? null : s.previewFileId,
    }))
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

  setPreviewFile: (id: string | null) => {
    set({ previewFileId: id })
  },

  toggleSelected: (id: string) => {
    set((s) => ({
      selectedIds: s.selectedIds.includes(id)
        ? s.selectedIds.filter((sid) => sid !== id)
        : [...s.selectedIds, id],
    }))
  },

  selectAll: (ids: string[]) => {
    set({ selectedIds: ids })
  },

  clearSelection: () => {
    set({ selectedIds: [] })
  },

  deleteSelected: async () => {
    const { selectedIds, folders, files } = get()
    const selectedSet = new Set(selectedIds)

    const folderIdsToDelete = folders.filter((f) => selectedSet.has(f.id)).map((f) => f.id)

    const allFolderIdsToDelete = new Set<string>()
    for (const fid of folderIdsToDelete) {
      allFolderIdsToDelete.add(fid)
      collectDescendantIds(fid, folders).forEach((id) => allFolderIdsToDelete.add(id))
    }

    const fileIdsToDelete = files
      .filter((f) => selectedSet.has(f.id) || (f.folderId !== null && allFolderIdsToDelete.has(f.folderId)))
      .map((f) => f.id)

    await Promise.all([
      ...folderIdsToDelete.map((id) => deleteFolder(id)),
      ...fileIdsToDelete.map((id) => deleteFile(id)),
    ])

    set((s) => ({
      folders: s.folders.filter((f) => !allFolderIdsToDelete.has(f.id)),
      files: s.files.filter((f) => !fileIdsToDelete.includes(f.id)),
      activeFolderId: allFolderIdsToDelete.has(s.activeFolderId ?? "") ? null : s.activeFolderId,
      expandedFolderIds: s.expandedFolderIds.filter((fid) => !allFolderIdsToDelete.has(fid)),
      selectedIds: [],
      previewFileId: fileIdsToDelete.includes(s.previewFileId ?? "") ? null : s.previewFileId,
    }))
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
