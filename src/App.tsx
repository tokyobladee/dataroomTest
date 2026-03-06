import { useEffect } from "react"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { useDataroomStore } from "@/stores/dataroomStore"
import { GlobalLayout } from "@/components/layout/GlobalLayout"
import { DataroomSelectionPage } from "@/pages/DataroomSelectionPage"
import { DataroomPage } from "@/pages/DataroomPage"

export default function App() {
  const { loadDatarooms, activeDataroomId, isLoading } = useDataroomStore()

  useEffect(() => {
    loadDatarooms()
  }, [loadDatarooms])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
      </div>
    )
  }

  return (
    <TooltipProvider>
      <GlobalLayout>
        {activeDataroomId ? <DataroomPage /> : <DataroomSelectionPage />}
      </GlobalLayout>
      <Toaster />
    </TooltipProvider>
  )
}
