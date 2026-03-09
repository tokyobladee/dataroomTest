import type { DataroomFile } from "@/types"

export interface FileConflict {
  id: string
  fileName: string
  copyName: string
}

export type ConflictResolution =
  | { action: "rename"; newName: string }
  | { action: "copy" }
  | { action: "skip" }

export function detectFileConflicts(
  fileNames: string[],
  targetFolderId: string | null,
  existingFiles: DataroomFile[],
): FileConflict[] {
  const filesInTarget = existingFiles.filter((f) => f.folderId === targetFolderId)
  const existingNames = new Set(filesInTarget.map((f) => f.name))

  const conflicts: FileConflict[] = []
  for (let i = 0; i < fileNames.length; i++) {
    const name = fileNames[i]
    if (existingNames.has(name)) {
      conflicts.push({
        id: String(i),
        fileName: name,
        copyName: generateCopyName(name),
      })
    }
  }
  return conflicts
}

export function generateCopyName(fileName: string): string {
  const lastDot = fileName.lastIndexOf(".")
  if (lastDot === -1 || lastDot === 0) {
    return `${fileName} (1)`
  }
  const name = fileName.slice(0, lastDot)
  const ext = fileName.slice(lastDot)
  return `${name} (1)${ext}`
}
