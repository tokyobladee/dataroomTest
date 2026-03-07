import { useEffect, useRef, useState } from "react"
import { User, Upload, Sun, Moon, LogOut, PanelLeftClose, PanelLeftOpen, Users, Link2 } from "lucide-react"
import { useDataroomStore } from "@/stores/dataroomStore"
import { useAuthStore } from "@/stores/authStore"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { handleDroppedFiles, isFileDrag } from "@/lib/dropFiles"
import { getDragItem, isInternalDrag } from "@/lib/dragItem"
import { FolderTree } from "@/components/folder/FolderTree"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MembersDialog } from "@/components/members/MembersDialog"
import { ShareLinksDialog } from "@/components/share/ShareLinksDialog"

export function GlobalSidebar() {
  const { uploadFile, moveFile, moveFolder } = useDataroomStore()
  const { user, logout } = useAuthStore()
  const dragCounter = useRef(0)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isOsDrag, setIsOsDrag] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [membersOpen, setMembersOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem("theme")
    if (stored) return stored === "dark"
    return window.matchMedia("(prefers-color-scheme: dark)").matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark)
    localStorage.setItem("theme", isDark ? "dark" : "light")
  }, [isDark])

  function handleDragEnter(e: React.DragEvent) {
    if (!isFileDrag(e) && !isInternalDrag(e)) return
    e.preventDefault()
    if (dragCounter.current === 0) setIsOsDrag(isFileDrag(e))
    dragCounter.current++
    setIsDragOver(true)
  }

  function handleDragLeave() {
    dragCounter.current--
    if (dragCounter.current === 0) { setIsDragOver(false); setIsOsDrag(false) }
  }

  function handleDragOver(e: React.DragEvent) {
    if (!isFileDrag(e) && !isInternalDrag(e)) return
    e.preventDefault()
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    dragCounter.current = 0
    setIsDragOver(false)
    setIsOsDrag(false)
    const item = getDragItem(e)
    if (item) {
      if (item.type === "file") await moveFile(item.id, null)
      else await moveFolder(item.id, null)
      return
    }
    await handleDroppedFiles(e.dataTransfer, (file) => uploadFile(file, null))
  }

  return (
    <aside
      className={cn(
        "flex flex-col shrink-0 border-r bg-background h-screen sticky top-0 overflow-hidden transition-[width] duration-200",
        collapsed ? "w-12" : "w-64"
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex items-center gap-2 px-2 h-14 shrink-0">
        {!collapsed && (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 flex-1 min-w-0 rounded-md px-1 py-1 hover:bg-accent transition-colors text-left">
                  <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                    {user?.picture ? (
                      <img src={user.picture} alt={user.name ?? ""} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <User className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user?.name ?? user?.email ?? "User"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52">
                <DropdownMenuItem onClick={() => setMembersOpen(true)}>
                  <Users className="h-4 w-4 mr-2" />
                  Members
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShareOpen(true)}>
                  <Link2 className="h-4 w-4 mr-2" />
                  Share links
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()} className="text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                  className="h-7 w-7 shrink-0"
                  onClick={() => setIsDark((d) => !d)}
                >
                  {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">{isDark ? "Light mode" : "Dark mode"}</TooltipContent>
            </Tooltip>
          </>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className={cn("h-7 w-7 shrink-0", !collapsed && "ml-auto")}
              onClick={() => setCollapsed((c) => !c)}
            >
              {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">{collapsed ? "Expand sidebar" : "Collapse sidebar"}</TooltipContent>
        </Tooltip>
      </div>

      {!collapsed && <Separator />}

      <div className={cn("relative flex-1 min-h-0", collapsed && "invisible")}>
        {isDragOver && isOsDrag && (
          <div className="absolute inset-0 z-20 pointer-events-none rounded-lg border-2 border-dashed border-primary bg-primary/5 flex flex-col items-center justify-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            <p className="text-xs font-semibold text-primary text-center px-3">Drop to add to All files</p>
          </div>
        )}
        <ScrollArea className="h-full">
          <div className="p-2">
            <FolderTree />
          </div>
        </ScrollArea>
      </div>

      <MembersDialog open={membersOpen} onClose={() => setMembersOpen(false)} />
      <ShareLinksDialog open={shareOpen} onClose={() => setShareOpen(false)} />
    </aside>
  )
}
