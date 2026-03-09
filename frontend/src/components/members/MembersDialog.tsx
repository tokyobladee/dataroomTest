import { useEffect, useState } from "react"
import { UserPlus, Trash2, ChevronDown } from "lucide-react"
import { useDataroomStore } from "@/stores/dataroomStore"
import { useAuthStore } from "@/stores/authStore"
import { apiJSON, apiFetch } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { cn } from "@/lib/utils"

interface Member {
  id: string
  user_uid: string
  role: string
  email: string | null
  display_name: string | null
}

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  editor: "Editor",
  viewer: "Viewer",
}

interface Props {
  open: boolean
  onClose: () => void
}

export function MembersDialog({ open, onClose }: Props) {
  const { dataroomId } = useDataroomStore()
  const { user } = useAuthStore()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("viewer")
  const [inviting, setInviting] = useState(false)

  const myRole = members.find((m) => m.user_uid === user?.uid)?.role
  const isOwner = myRole === "owner"

  useEffect(() => {
    if (!open || !dataroomId) return
    setLoading(true)
    apiJSON<Member[]>(`/api/datarooms/${dataroomId}/members`)
      .then(setMembers)
      .catch(() => toast.error("Failed to load members"))
      .finally(() => setLoading(false))
  }, [open, dataroomId])

  async function handleInvite() {
    if (!inviteEmail.trim() || !dataroomId) return
    setInviting(true)
    try {
      const member = await apiJSON<Member>(`/api/datarooms/${dataroomId}/members`, {
        method: "POST",
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      })
      setMembers((prev) => [...prev, member])
      setInviteEmail("")
      toast.success("Member invited")
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to invite member"
      toast.error(msg)
    } finally {
      setInviting(false)
    }
  }

  async function handleChangeRole(member: Member, role: string) {
    if (!dataroomId) return
    try {
      await apiFetch(`/api/datarooms/${dataroomId}/members/${member.user_uid}`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      })
      setMembers((prev) => prev.map((m) => m.user_uid === member.user_uid ? { ...m, role } : m))
    } catch {
      toast.error("Failed to change role")
    }
  }

  async function handleRemove(member: Member) {
    if (!dataroomId) return
    try {
      await apiFetch(`/api/datarooms/${dataroomId}/members/${member.user_uid}`, {
        method: "DELETE",
      })
      setMembers((prev) => prev.filter((m) => m.user_uid !== member.user_uid))
    } catch {
      toast.error("Failed to remove member")
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Members</DialogTitle>
        </DialogHeader>

        {isOwner && (
          <div className="flex gap-2">
            <Input
              placeholder="Email address"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleInvite()}
              className="flex-1"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="shrink-0 gap-1 px-3">
                  {ROLE_LABELS[inviteRole]}
                  <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setInviteRole("editor")}>Editor</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setInviteRole("viewer")}>Viewer</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              onClick={handleInvite}
              disabled={inviting || !inviteEmail.trim()}
              size="icon"
              className="shrink-0"
              aria-label="Invite member"
            >
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="flex flex-col gap-1 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
            </div>
          ) : members.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No members yet</p>
          ) : (
            members.map((member) => {
              const isMe = member.user_uid === user?.uid
              const canEdit = isOwner && !isMe && member.role !== "owner"
              const label = member.display_name || member.email || member.user_uid
              return (
                <div
                  key={member.user_uid}
                  className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/50"
                >
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 text-xs font-medium uppercase">
                    {(label[0] ?? "?")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{label}</p>
                    {member.display_name && member.email && (
                      <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                    )}
                  </div>
                  {canEdit ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className={cn("h-7 gap-1 px-2 text-xs")}>
                          {ROLE_LABELS[member.role] ?? member.role}
                          <ChevronDown className="h-3 w-3 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleChangeRole(member, "editor")}
                          className={cn(member.role === "editor" && "font-medium")}
                        >
                          Editor
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleChangeRole(member, "viewer")}
                          className={cn(member.role === "viewer" && "font-medium")}
                        >
                          Viewer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <span className="text-xs text-muted-foreground px-2">
                      {ROLE_LABELS[member.role] ?? member.role}
                    </span>
                  )}
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      aria-label="Remove member"
                      onClick={() => handleRemove(member)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
