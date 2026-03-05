import { useRef, useState } from "react"
import { Upload, Loader2 } from "lucide-react"
import { useDataroomStore } from "@/stores/dataroomStore"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface Props {
  folderId: string | null
}

export function FileUploadZone({ folderId }: Props) {
  const { uploadFile } = useDataroomStore()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return

    const files = Array.from(fileList).filter((f) => f.type === "application/pdf")
    const rejected = fileList.length - files.length

    if (rejected > 0) {
      toast.error(`${rejected} file${rejected > 1 ? "s" : ""} skipped — only PDF files are supported`)
    }

    if (files.length === 0) return

    setUploading(true)
    try {
      await Promise.all(files.map((f) => uploadFile(f, folderId)))
      toast.success(`${files.length} file${files.length > 1 ? "s" : ""} uploaded`)
    } catch {
      toast.error("Failed to upload files. Please try again.")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    if (!uploading) handleFiles(e.dataTransfer.files)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    if (!uploading) setDragging(true)
  }

  function handleDragLeave() {
    setDragging(false)
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-10 text-center transition-colors",
        uploading
          ? "border-muted-foreground/25 cursor-not-allowed opacity-60"
          : "cursor-pointer hover:border-muted-foreground/50",
        dragging && !uploading && "border-foreground bg-accent"
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => { if (!uploading) inputRef.current?.click() }}
    >
      <div className="rounded-full bg-muted p-3">
        {uploading
          ? <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
          : <Upload className="h-5 w-5 text-muted-foreground" />
        }
      </div>
      <div>
        <p className="text-sm font-medium">
          {uploading ? "Uploading…" : "Drop PDF files here"}
        </p>
        {!uploading && (
          <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}
