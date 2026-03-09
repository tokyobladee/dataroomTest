export interface Dataroom {
  id: string
  name: string
  createdAt: number
}

export interface Folder {
  id: string
  dataroomId: string
  parentId: string | null
  name: string
  createdAt: number
}

export interface DataroomFile {
  id: string
  dataroomId: string
  folderId: string | null
  name: string
  size: number
  mimeType: string
  createdAt: number
}
