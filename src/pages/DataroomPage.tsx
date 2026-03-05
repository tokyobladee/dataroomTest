import { AppLayout } from "@/components/layout/AppLayout"
import { FolderTree } from "@/components/folder/FolderTree"
import { FileList } from "@/components/file/FileList"

export function DataroomPage() {
  return (
    <AppLayout sidebar={<FolderTree />}>
      <FileList />
    </AppLayout>
  )
}
