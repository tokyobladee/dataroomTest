import { FileText } from "lucide-react"
import { useDataroomStore } from "@/stores/dataroomStore"
import { FileItem } from "./FileItem"
import { FileUploadZone } from "./FileUploadZone"

export function FileList() {
  const { files, folders, activeFolderId } = useDataroomStore()

  const activeFolder = folders.find((f) => f.id === activeFolderId) ?? null
  const visibleFiles = files.filter((f) => f.folderId === activeFolderId)

  return (
    <div className="flex flex-col h-full p-6 gap-6">
      <div>
        <h2 className="text-lg font-semibold">
          {activeFolder ? activeFolder.name : "All files"}
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {visibleFiles.length} {visibleFiles.length === 1 ? "file" : "files"}
        </p>
      </div>

      <FileUploadZone folderId={activeFolderId} />

      {visibleFiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-4 mb-3">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No files here</p>
          <p className="text-sm text-muted-foreground mt-1">
            Upload PDF files using the area above
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {visibleFiles.map((file) => (
            <FileItem key={file.id} file={file} />
          ))}
        </div>
      )}
    </div>
  )
}
