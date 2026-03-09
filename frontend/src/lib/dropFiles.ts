import { toast } from "sonner"

export async function handleDroppedFiles(
  dataTransfer: DataTransfer,
  upload: (file: File) => Promise<void>
): Promise<void> {
  const files = Array.from(dataTransfer.files)
  if (files.length === 0) return

  try {
    await Promise.all(files.map(upload))
    toast.success(`${files.length} file${files.length > 1 ? "s" : ""} uploaded`)
  } catch {
    toast.error("Failed to upload files. Please try again.")
  }
}

export function collectDroppedFiles(dataTransfer: DataTransfer): File[] {
  return Array.from(dataTransfer.files)
}

export function isFileDrag(e: React.DragEvent): boolean {
  return e.dataTransfer.types.includes("Files")
}
