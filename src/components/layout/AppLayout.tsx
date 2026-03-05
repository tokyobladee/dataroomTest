import { Sidebar } from "./Sidebar"
import { FilePreviewPanel } from "@/components/file/FilePreviewPanel"

interface Props {
  sidebar: React.ReactNode
  children: React.ReactNode
}

export function AppLayout({ sidebar, children }: Props) {
  function preventBrowserFileDrop(e: React.DragEvent) {
    e.preventDefault()
  }

  return (
    <div
      className="flex h-screen overflow-hidden bg-background"
      onDragOver={preventBrowserFileDrop}
      onDrop={preventBrowserFileDrop}
    >
      <Sidebar>{sidebar}</Sidebar>
      <main className="flex-1 overflow-y-auto">{children}</main>
      <FilePreviewPanel />
    </div>
  )
}
