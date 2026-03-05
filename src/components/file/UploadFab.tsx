import { useRef, useState } from "react"
import { Upload, Loader2 } from "lucide-react"
import { useDataroomStore } from "@/stores/dataroomStore"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export function UploadFab() {
  const { uploadFile, activeFolderId } = useDataroomStore()
  const inputRef = useRef<HTMLInputElement>(null)
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
      await Promise.all(files.map((f) => uploadFile(f, activeFolderId)))
      toast.success(`${files.length} file${files.length > 1 ? "s" : ""} uploaded`)
    } catch {
      toast.error("Failed to upload files. Please try again.")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <>
      <button
        className={cn(
          "fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-foreground text-background shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95",
          uploading && "cursor-not-allowed opacity-70"
        )}
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading
          ? <Loader2 className="h-6 w-6 animate-spin" />
          : <Upload className="h-6 w-6" />
        }
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </>
  )
}
