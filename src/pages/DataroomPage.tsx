import { FileList } from "@/components/file/FileList"
import { SelectionBar } from "@/components/layout/SelectionBar"
import { UploadFab } from "@/components/file/UploadFab"

export function DataroomPage() {
  return (
    <>
      <FileList />
      <SelectionBar />
      <UploadFab />
    </>
  )
}
