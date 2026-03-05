import { useDataroomStore } from "@/stores/dataroomStore"
import { FileItem } from "./FileItem"
import { FileUploadZone } from "./FileUploadZone"

export function FileList() {
  const { files, folders, activeFolderId } = useDataroomStore()

  const activeFolder = folders.find((f) => f.id === activeFolderId) ?? null
  const visibleFiles = files.filter((f) => f.folderId === activeFolderId)

  return (
    <div className="flex flex-col h-full p-6 gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            {activeFolder ? activeFolder.name : "All files"}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {visibleFiles.length} {visibleFiles.length === 1 ? "file" : "files"}
          </p>
        </div>
      </div>

      <FileUploadZone folderId={activeFolderId} />

      {visibleFiles.length > 0 && (
        <div className="flex flex-col gap-2">
          {visibleFiles.map((file) => (
            <FileItem key={file.id} file={file} />
          ))}
        </div>
      )}
    </div>
  )
}
