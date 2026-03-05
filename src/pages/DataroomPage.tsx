import { AppLayout } from "@/components/layout/AppLayout"
import { FolderTree } from "@/components/folder/FolderTree"
import { FileList } from "@/components/file/FileList"
import { SelectionBar } from "@/components/layout/SelectionBar"
import { UploadFab } from "@/components/file/UploadFab"

export function DataroomPage() {
  return (
    <AppLayout sidebar={<FolderTree />}>
      <FileList />
      <SelectionBar />
      <UploadFab />
    </AppLayout>
  )
}
