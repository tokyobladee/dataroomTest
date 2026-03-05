import { AppLayout } from "@/components/layout/AppLayout"
import { FolderTree } from "@/components/folder/FolderTree"

export function DataroomPage() {
  return (
    <AppLayout sidebar={<FolderTree />}>
      <div />
    </AppLayout>
  )
}
