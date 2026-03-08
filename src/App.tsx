import { useEffect } from "react"
import { Routes, Route } from "react-router-dom"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { useDataroomStore } from "@/stores/dataroomStore"
import { useAuthStore } from "@/stores/authStore"
import { GlobalLayout } from "@/components/layout/GlobalLayout"
import { DataroomPage } from "@/pages/DataroomPage"
import { DriveCallbackPage } from "@/pages/DriveCallbackPage"
import { SharePage } from "@/pages/SharePage"
import { LoginPage } from "@/components/auth/LoginPage"

export default function App() {
  const { initDataroom, resetStore, isLoading: dataroomLoading } = useDataroomStore()
  const { user, isLoading: authLoading } = useAuthStore()

  useEffect(() => {
    if (user) {
      initDataroom()
    } else {
      resetStore()
    }
  }, [user, initDataroom, resetStore])

  // Pages accessible without auth
  if (window.location.pathname === "/drive/callback") {
    return <DriveCallbackPage />
  }
  if (window.location.pathname.startsWith("/s/")) {
    return <SharePage />
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  if (dataroomLoading) {
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
