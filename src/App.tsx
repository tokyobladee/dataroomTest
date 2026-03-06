import { useEffect } from "react"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { useDataroomStore } from "@/stores/dataroomStore"
import { GlobalLayout } from "@/components/layout/GlobalLayout"
import { DataroomPage } from "@/pages/DataroomPage"

export default function App() {
  const { initDataroom, isLoading } = useDataroomStore()

  useEffect(() => {
    initDataroom()
  }, [initDataroom])

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
        <DataroomPage />
      </GlobalLayout>
      <Toaster />
    </TooltipProvider>
  )
}
