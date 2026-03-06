import { GlobalSidebar } from "./GlobalSidebar"
import { FilePreviewPanel } from "@/components/file/FilePreviewPanel"

interface Props {
  children: React.ReactNode
}

export function GlobalLayout({ children }: Props) {
  function preventBrowserFileDrop(e: React.DragEvent) {
    e.preventDefault()
  }

  return (
    <div
      className="flex h-screen overflow-hidden bg-background"
      onDragOver={preventBrowserFileDrop}
      onDrop={preventBrowserFileDrop}
    >
      <GlobalSidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      <FilePreviewPanel />
    </div>
  )
}
