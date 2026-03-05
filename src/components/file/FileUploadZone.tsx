import { useRef, useState } from "react"
import { Upload } from "lucide-react"
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

  async function handleFiles(fileList: FileList | null) {
    if (!fileList) return
    const files = Array.from(fileList).filter((f) => f.type === "application/pdf")
    const rejected = fileList.length - files.length

    if (rejected > 0) {
      toast.error(`${rejected} file${rejected > 1 ? "s" : ""} skipped — only PDF files are supported`)
    }

    await Promise.all(files.map((f) => uploadFile(f, folderId)))
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragging(true)
  }

  function handleDragLeave() {
    setDragging(false)
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-10 text-center transition-colors cursor-pointer",
        dragging ? "border-foreground bg-accent" : "border-muted-foreground/25 hover:border-muted-foreground/50"
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => inputRef.current?.click()}
    >
      <div className="rounded-full bg-muted p-3">
        <Upload className="h-5 w-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium">Drop PDF files here</p>
        <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
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
