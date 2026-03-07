import { useRef, useState } from "react"
import { Upload, Loader2, HardDrive } from "lucide-react"
import { useDataroomStore } from "@/stores/dataroomStore"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { DriveImportDialog } from "@/components/drive/DriveImportDialog"

export function UploadFab() {
  const { uploadFile, activeFolderId } = useDataroomStore()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [driveOpen, setDriveOpen] = useState(false)

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
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              aria-label="Import from Google Drive"
              className="h-10 w-10 rounded-full bg-background border border-border text-foreground shadow flex items-center justify-center transition-all hover:scale-105 active:scale-95"
              onClick={() => setDriveOpen(true)}
            >
              <HardDrive className="h-5 w-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">Import from Google Drive</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              aria-label="Upload files"
              className={cn(
                "h-14 w-14 rounded-full bg-foreground text-background shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95",
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
          </TooltipTrigger>
          <TooltipContent side="left">Upload PDF files</TooltipContent>
        </Tooltip>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <DriveImportDialog open={driveOpen} onClose={() => setDriveOpen(false)} />
    </>
  )
}
