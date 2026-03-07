import { useState } from "react"
import { Copy, Check, ChevronDown } from "lucide-react"
import { useDataroomStore } from "@/stores/dataroomStore"
import { apiJSON } from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

interface ShareLink {
  token: string
}

const FRONTEND = import.meta.env.VITE_FRONTEND_URL ?? window.location.origin

const EXPIRY_OPTIONS = [
  { label: "Never", days: null },
  { label: "1 day", days: 1 },
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
]

interface Props {
  open: boolean
  onClose: () => void
  folderId: string
  folderName: string
}

export function ShareFolderDialog({ open, onClose, folderId, folderName }: Props) {
  const { dataroomId } = useDataroomStore()
  const [permissions, setPermissions] = useState<"viewer" | "editor">("viewer")
  const [expiry, setExpiry] = useState(EXPIRY_OPTIONS[0])
  const [creating, setCreating] = useState(false)
  const [createdUrl, setCreatedUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  function handleClose() {
    setCreatedUrl(null)
    setCopied(false)
    setPermissions("viewer")
    setExpiry(EXPIRY_OPTIONS[0])
    onClose()
  }

  async function handleCreate() {
    if (!dataroomId) return
    setCreating(true)
    try {
      let expiresAt: string | undefined
      if (expiry.days !== null) {
        const d = new Date()
        d.setDate(d.getDate() + expiry.days)
        expiresAt = d.toISOString()
      }
      const link = await apiJSON<ShareLink>(`/api/datarooms/${dataroomId}/share-links`, {
        method: "POST",
        body: JSON.stringify({ folderId, permissions, expiresAt }),
      })
      const url = `${FRONTEND}/s/${link.token}`
      setCreatedUrl(url)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to create link")
    } finally {
      setCreating(false)
    }
  }

  function handleCopy() {
    if (!createdUrl) return
    navigator.clipboard.writeText(createdUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Share &ldquo;{folderName}&rdquo;</DialogTitle>
        </DialogHeader>

        {!createdUrl ? (
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1 flex-1">
                    {permissions === "viewer" ? "Viewer" : "Editor"}
                    <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setPermissions("viewer")}>Viewer</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPermissions("editor")}>Editor</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1 flex-1">
                    {expiry.label}
                    <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {EXPIRY_OPTIONS.map((opt) => (
                    <DropdownMenuItem key={opt.label} onClick={() => setExpiry(opt)}>
                      {opt.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Button onClick={handleCreate} disabled={creating}>
              {creating ? "Creating…" : "Create link"}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">Link created. Share it with anyone.</p>
            <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
              <p className="text-xs font-mono flex-1 min-w-0 truncate">{createdUrl}</p>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={handleCopy}
              >
                {copied
                  ? <Check className="h-3.5 w-3.5 text-green-500" />
                  : <Copy className="h-3.5 w-3.5" />
                }
              </Button>
            </div>
            <Button variant="outline" onClick={handleClose}>Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
