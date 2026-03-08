import { create } from "zustand"
import { apiFetch, apiJSON } from "@/lib/api"
import type { DataroomFile, Folder } from "@/types"

// ---------- helpers: map snake_case API response → camelCase ----------

function mapFolder(r: Record<string, unknown>): Folder {
  return {
    id: r.id as string,
    dataroomId: (r.dataroom_id ?? r.dataroomId) as string,
    parentId: (r.parent_id ?? r.parentId ?? null) as string | null,
    name: r.name as string,
    createdAt: r.created_at ? new Date(r.created_at as string).getTime() : Date.now(),
  }
}

function mapFile(r: Record<string, unknown>): DataroomFile {
  return {
    id: r.id as string,
    dataroomId: (r.dataroom_id ?? r.dataroomId) as string,
    folderId: (r.folder_id ?? r.folderId ?? null) as string | null,
    name: r.name as string,
    size: r.size as number,
    mimeType: (r.mime_type ?? r.mimeType ?? "") as string,
    createdAt: r.created_at ? new Date(r.created_at as string).getTime() : Date.now(),
  }
}

// ---------- state ----------

interface DataroomState {
  dataroomId: string | null
  dataroomName: string | null
  myRole: "owner" | "editor" | "viewer" | null
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
  downloadFile: (id: string) => Promise<void>
  importFromDrive: (driveFileIds: string[]) => Promise<void>
  setPreviewFile: (id: string | null) => void

  toggleSelected: (id: string) => void
  selectAll: (ids: string[]) => void
  clearSelection: () => void
  deleteSelected: () => Promise<void>
}

export const useDataroomStore = create<DataroomState>((set, get) => ({
  dataroomId: null,
  dataroomName: null,
  myRole: null,
  folders: [],
  files: [],
  activeFolderId: null,
  expandedFolderIds: [],
  selectedIds: [],
  previewFileId: null,
  isLoading: false,

  // ----------------------------------------------------------------
  // Init: get or create the user's first dataroom, then load content
  // ----------------------------------------------------------------
  initDataroom: async () => {
    set({ isLoading: true })
    try {
      let rooms = await apiJSON<Record<string, unknown>[]>("/api/datarooms")
      if (rooms.length === 0) {
        const created = await apiJSON<Record<string, unknown>>("/api/datarooms", {
          method: "POST",
          body: JSON.stringify({ name: "My Dataroom" }),
        })
        rooms = [created]
      }
      const dataroomId = rooms[0].id as string
      const [rawFolders, rawFiles, rawMembers] = await Promise.all([
        apiJSON<Record<string, unknown>[]>(`/api/datarooms/${dataroomId}/folders`),
        apiJSON<Record<string, unknown>[]>(`/api/datarooms/${dataroomId}/files`),
        apiJSON<Record<string, unknown>[]>(`/api/datarooms/${dataroomId}/members`),
      ])
      const { auth } = await import("@/lib/firebase")
      const myUid = auth.currentUser?.uid ?? null
      const me = rawMembers.find((m) => m.user_uid === myUid)
      set({
        dataroomId,
        dataroomName: (rooms[0].name as string) ?? null,
        myRole: (me?.role as "owner" | "editor" | "viewer" | null) ?? null,
        folders: rawFolders.map(mapFolder),
        files: rawFiles.map(mapFile),
        isLoading: false,
      })
    } catch (e) {
      set({ isLoading: false })
      throw e
    }
  },

  // ----------------------------------------------------------------
  // Navigation
  // ----------------------------------------------------------------
  setActiveFolder: (id) => {
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

  toggleFolderExpanded: (id) => {
    set((s) => ({
      expandedFolderIds: s.expandedFolderIds.includes(id)
        ? s.expandedFolderIds.filter((fid) => fid !== id)
        : [...s.expandedFolderIds, id],
    }))
  },

  // ----------------------------------------------------------------
  // Folders
  // ----------------------------------------------------------------
  createFolder: async (name, parentId) => {
    const { dataroomId } = get()
    if (!dataroomId) return
    const raw = await apiJSON<Record<string, unknown>>(
      `/api/datarooms/${dataroomId}/folders`,
      { method: "POST", body: JSON.stringify({ name, parentId }) },
    )
    const folder = mapFolder(raw)
    set((s) => ({
      folders: [...s.folders, folder],
      expandedFolderIds: parentId
        ? Array.from(new Set([...s.expandedFolderIds, parentId]))
        : s.expandedFolderIds,
    }))
  },

  moveFolder: async (id, parentId) => {
    const { folders, dataroomId } = get()
    const folder = folders.find((f) => f.id === id)
    if (!folder || folder.parentId === parentId || !dataroomId) return
    const descendants = collectDescendantIds(id, folders)
    if (parentId !== null && (parentId === id || descendants.has(parentId))) return
    const raw = await apiJSON<Record<string, unknown>>(
      `/api/datarooms/${dataroomId}/folders/${id}`,
      { method: "PATCH", body: JSON.stringify({ parentId }) },
    )
    const updated = mapFolder(raw)
    set((s) => ({ folders: s.folders.map((f) => (f.id === id ? updated : f)) }))
  },

  renameFolder: async (id, name) => {
    const { dataroomId } = get()
    if (!dataroomId) return
    const raw = await apiJSON<Record<string, unknown>>(
      `/api/datarooms/${dataroomId}/folders/${id}`,
      { method: "PATCH", body: JSON.stringify({ name }) },
    )
    const updated = mapFolder(raw)
    set((s) => ({ folders: s.folders.map((f) => (f.id === id ? updated : f)) }))
  },

  deleteFolder: async (id) => {
    const { dataroomId } = get()
    if (!dataroomId) return
    const idsToDelete = collectDescendantIds(id, get().folders)
    idsToDelete.add(id)
    await apiFetch(`/api/datarooms/${dataroomId}/folders/${id}`, { method: "DELETE" })
    set((s) => ({
      folders: s.folders.filter((f) => !idsToDelete.has(f.id)),
      files: s.files.filter((f) => f.folderId === null || !idsToDelete.has(f.folderId)),
      activeFolderId: idsToDelete.has(s.activeFolderId ?? "") ? null : s.activeFolderId,
      expandedFolderIds: s.expandedFolderIds.filter((fid) => !idsToDelete.has(fid)),
      selectedIds: s.selectedIds.filter((sid) => !idsToDelete.has(sid)),
    }))
  },

  // ----------------------------------------------------------------
  // Files
  // ----------------------------------------------------------------
  uploadFile: async (file, folderId) => {
    const { dataroomId } = get()
    if (!dataroomId) return
    const form = new FormData()
    form.append("file", file)
    if (folderId) form.append("folderId", folderId)
    // apiFetch handles auth; don't set Content-Type — browser sets it with boundary
    const res = await apiFetch(`/api/datarooms/${dataroomId}/files`, {
      method: "POST",
      body: form,
    })
    const raw: Record<string, unknown> = await res.json()
    set((s) => ({ files: [...s.files, mapFile(raw)] }))
  },

  moveFile: async (id, folderId) => {
    const { dataroomId, files } = get()
    const file = files.find((f) => f.id === id)
    if (!file || file.folderId === folderId || !dataroomId) return
    const raw = await apiJSON<Record<string, unknown>>(
      `/api/datarooms/${dataroomId}/files/${id}`,
      { method: "PATCH", body: JSON.stringify({ folderId }) },
    )
    const updated = mapFile(raw)
    set((s) => ({ files: s.files.map((f) => (f.id === id ? updated : f)) }))
  },

  renameFile: async (id, name) => {
    const { dataroomId } = get()
    if (!dataroomId) return
    const raw = await apiJSON<Record<string, unknown>>(
      `/api/datarooms/${dataroomId}/files/${id}`,
      { method: "PATCH", body: JSON.stringify({ name }) },
    )
    const updated = mapFile(raw)
    set((s) => ({ files: s.files.map((f) => (f.id === id ? updated : f)) }))
  },

  deleteFile: async (id) => {
    const { dataroomId } = get()
    if (!dataroomId) return
    await apiFetch(`/api/datarooms/${dataroomId}/files/${id}`, { method: "DELETE" })
    set((s) => ({
      files: s.files.filter((f) => f.id !== id),
      selectedIds: s.selectedIds.filter((sid) => sid !== id),
      previewFileId: s.previewFileId === id ? null : s.previewFileId,
    }))
  },

  openFile: async (id) => {
    const { dataroomId } = get()
    if (!dataroomId) return
    const res = await apiFetch(`/api/datarooms/${dataroomId}/files/${id}`)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    window.open(url, "_blank")
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
  },

  downloadFile: async (id) => {
    const { dataroomId, files } = get()
    if (!dataroomId) return
    const file = files.find((f) => f.id === id)
    const res = await apiFetch(`/api/datarooms/${dataroomId}/files/${id}?download=1`)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = file?.name ?? "file"
    a.click()
    URL.revokeObjectURL(url)
  },

  importFromDrive: async (driveFileIds) => {
    const { dataroomId, activeFolderId } = get()
    if (!dataroomId) return
    for (const driveFileId of driveFileIds) {
      const raw = await apiJSON<Record<string, unknown>>("/api/drive/import", {
        method: "POST",
        body: JSON.stringify({ driveFileId, dataroomId, folderId: activeFolderId }),
      })
      set((s) => ({ files: [...s.files, mapFile(raw)] }))
    }
  },

  setPreviewFile: (id) => set({ previewFileId: id }),

  // ----------------------------------------------------------------
  // Selection
  // ----------------------------------------------------------------
  toggleSelected: (id) => {
    set((s) => ({
      selectedIds: s.selectedIds.includes(id)
        ? s.selectedIds.filter((sid) => sid !== id)
        : [...s.selectedIds, id],
    }))
  },

  selectAll: (ids) => set({ selectedIds: ids }),

  clearSelection: () => set({ selectedIds: [] }),

  deleteSelected: async () => {
    const { selectedIds, folders, files, dataroomId } = get()
    if (!dataroomId) return
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
      ...folderIdsToDelete.map((id) =>
        apiFetch(`/api/datarooms/${dataroomId}/folders/${id}`, { method: "DELETE" }),
      ),
      ...fileIdsToDelete.map((id) =>
        apiFetch(`/api/datarooms/${dataroomId}/files/${id}`, { method: "DELETE" }),
      ),
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

// ---------- pure helpers ----------

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
