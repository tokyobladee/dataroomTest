import { useEffect, useState } from "react"
import { Link2, Copy, Trash2, Plus, ChevronDown, Check, FileText, Folder as FolderIcon } from "lucide-react"
import { useDataroomStore } from "@/stores/dataroomStore"
import { apiJSON, apiFetch } from "@/lib/api"
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
import type { Folder as FolderType } from "@/types"

interface ShareLink {
  token: string
  dataroom_id: string
  folder_id: string | null
  file_id: string | null
  permissions: string
  created_by_uid: string
  expires_at: string | null
  created_at: string
}

const FRONTEND = import.meta.env.VITE_FRONTEND_URL ?? window.location.origin

function linkUrl(token: string) {
  return `${FRONTEND}/s/${token}`
}

function formatExpiry(iso: string | null) {
  if (!iso) return "Never"
  return new Date(iso).toLocaleDateString()
}

const EXPIRY_OPTIONS = [
  { label: "Never", days: null },
  { label: "1 day", days: 1 },
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
]

function resolvePath(folderId: string, folders: FolderType[]): string {
  const parts: string[] = []
  let current = folders.find(f => f.id === folderId)
  while (current) {
    parts.unshift(current.name)
    current = current.parentId ? folders.find(f => f.id === current!.parentId) : undefined
  }
  return parts.join(" / ") || "Unknown folder"
}

interface Props {
  open: boolean
  onClose: () => void
}

export function ShareLinksDialog({ open, onClose }: Props) {
  const { dataroomId, folders, files, addShareLink, removeShareLink } = useDataroomStore()
  const [links, setLinks] = useState<ShareLink[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const newPermissions = "viewer"
  const [newExpiry, setNewExpiry] = useState<{ label: string; days: number | null }>(EXPIRY_OPTIONS[0])
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !dataroomId) return
    setLoading(true)
    apiJSON<ShareLink[]>(`/api/datarooms/${dataroomId}/share-links`)
      .then(setLinks)
      .catch(() => toast.error("Failed to load share links"))
      .finally(() => setLoading(false))
  }, [open, dataroomId])

  async function handleCreate() {
    if (!dataroomId) return
    setCreating(true)
    try {
      let expiresAt: string | undefined
      if (newExpiry.days !== null) {
        const d = new Date()
        d.setDate(d.getDate() + newExpiry.days)
        expiresAt = d.toISOString()
      }
      const link = await apiJSON<ShareLink>(`/api/datarooms/${dataroomId}/share-links`, {
        method: "POST",
        body: JSON.stringify({ permissions: newPermissions, expiresAt }),
      })
      setLinks((prev) => [link, ...prev])
      addShareLink(link)
      toast.success("Share link created")
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to create link")
    } finally {
      setCreating(false)
    }
  }

  async function handleRevoke(token: string) {
    try {
      await apiFetch(`/api/share-links/${token}`, { method: "DELETE" })
      setLinks((prev) => prev.filter((l) => l.token !== token))
      removeShareLink(token)
      toast.success("Link revoked")
    } catch {
      toast.error("Failed to revoke link")
    }
  }

  function handleCopy(token: string) {
    navigator.clipboard.writeText(linkUrl(token))
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  function resolveTarget(link: ShareLink) {
    if (link.file_id) {
      const file = files.find(f => f.id === link.file_id)
      return (
        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
          <FileText className="h-3 w-3 shrink-0" />
          {file?.name ?? "Unknown file"}
        </p>
      )
    }
    if (link.folder_id) {
      return (
        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
          <FolderIcon className="h-3 w-3 shrink-0" />
          {resolvePath(link.folder_id, folders)}
        </p>
      )
    }
    return (
      <p className="text-xs text-muted-foreground mt-0.5">
        Entire dataroom
      </p>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Share links</DialogTitle>
        </DialogHeader>

        {/* Create new link */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                {newExpiry.label}
                <ChevronDown className="h-3.5 w-3.5 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {EXPIRY_OPTIONS.map((opt) => (
                <DropdownMenuItem key={opt.label} onClick={() => setNewExpiry(opt)}>
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button size="sm" onClick={handleCreate} disabled={creating} className="ml-auto gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Create link
          </Button>
        </div>

        {/* List */}
        <div className="flex flex-col gap-1 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
            </div>
          ) : links.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No share links yet</p>
          ) : (
            links.map((link) => (
              <div
                key={link.token}
                className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-muted/50"
              >
                <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  {resolveTarget(link)}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Expires: {formatExpiry(link.expires_at)}
                  </p>
                  <p className="text-xs font-mono text-muted-foreground truncate mt-0.5">
                    {linkUrl(link.token)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => handleCopy(link.token)}
                  aria-label="Copy link"
                >
                  {copiedToken === link.token
                    ? <Check className="h-3.5 w-3.5 text-green-500" />
                    : <Copy className="h-3.5 w-3.5" />
                  }
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleRevoke(link.token)}
                  aria-label="Revoke link"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
