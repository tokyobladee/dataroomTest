import { useEffect } from "react"
import { Routes, Route } from "react-router-dom"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { useDataroomStore } from "@/stores/dataroomStore"
import { useAuthStore } from "@/stores/authStore"
import { GlobalLayout } from "@/components/layout/GlobalLayout"
import { DataroomPage } from "@/pages/DataroomPage"
import { LoginPage } from "@/components/auth/LoginPage"

export default function App() {
  const { initDataroom, isLoading } = useDataroomStore()
  const { user } = useAuthStore()

  useEffect(() => {
    if (user) initDataroom()
  }, [user, initDataroom])

  if (!user) {
    return <LoginPage />
  }

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
        <Routes>
          <Route path="*" element={<DataroomPage />} />
        </Routes>
      </GlobalLayout>
      <Toaster />
    </TooltipProvider>
  )
}
