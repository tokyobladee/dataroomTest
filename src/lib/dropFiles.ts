import { toast } from "sonner"

export async function handleDroppedFiles(
  dataTransfer: DataTransfer,
  upload: (file: File) => Promise<void>
): Promise<void> {
  const files = Array.from(dataTransfer.files).filter((f) => f.type === "application/pdf")
  const rejected = dataTransfer.files.length - files.length

  if (rejected > 0) {
    toast.error(`${rejected} file${rejected > 1 ? "s" : ""} skipped — only PDF files are supported`)
  }

  if (files.length === 0) return

  try {
    await Promise.all(files.map(upload))
    toast.success(`${files.length} file${files.length > 1 ? "s" : ""} uploaded`)
  } catch {
    toast.error("Failed to upload files. Please try again.")
  }
}

export function isFileDrag(e: React.DragEvent): boolean {
  return e.dataTransfer.types.includes("Files")
}
