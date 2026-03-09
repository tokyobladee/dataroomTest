from datetime import datetime, timezone
from repositories.base import ShareLinkRepository, MemberRepository, FolderRepository, FileRepository
from repositories.base import ShareLinkDTO, FolderDTO, FileDTO


class ShareService:
    def __init__(
        self,
        share_repo: ShareLinkRepository,
        member_repo: MemberRepository,
        folder_repo: FolderRepository,
        file_repo: FileRepository,
    ):
        self._shares = share_repo
        self._members = member_repo
        self._folders = folder_repo
        self._files = file_repo

    def list_links(self, dataroom_id: str, user_uid: str) -> list[ShareLinkDTO]:
        self._assert_role(dataroom_id, user_uid, ("owner",))
        return self._shares.list_by_dataroom(dataroom_id)

    def create(self, dataroom_id: str, folder_id: str | None,
               permissions: str, user_uid: str,
               expires_at: datetime | None = None,
               file_id: str | None = None) -> ShareLinkDTO:
        self._assert_role(dataroom_id, user_uid, ("owner",))
        if permissions not in ("viewer", "editor"):
            raise ValueError("permissions must be 'viewer' or 'editor'")
        return self._shares.create(dataroom_id, folder_id, file_id, permissions, user_uid, expires_at)

    def revoke(self, token: str, user_uid: str) -> None:
        link = self._get_valid_link(token)
        self._assert_role(link.dataroom_id, user_uid, ("owner",))
        self._shares.delete(token)

    # ------------------------------------------------------------------
    # Public access via share link (no auth required)
    # ------------------------------------------------------------------

    def get_link_info(self, token: str) -> ShareLinkDTO:
        return self._get_valid_link(token)

    def list_folders(self, token: str) -> list[FolderDTO]:
        link = self._get_valid_link(token)
        all_folders = self._folders.list_by_dataroom(link.dataroom_id)
        if link.folder_id is None:
            return all_folders
        return self._subtree_folders(link.folder_id, all_folders)

    def list_files(self, token: str, folder_id: str | None = None) -> list[FileDTO]:
        link = self._get_valid_link(token)
        all_files = self._files.list_by_dataroom(link.dataroom_id)
        if link.folder_id is None and link.file_id is None:
            if folder_id is not None:
                return [f for f in all_files if f.folder_id == folder_id]
            return all_files
        if link.file_id is not None:
            file = next((f for f in all_files if f.id == link.file_id), None)
            return [file] if file else []
        # folder share — only files within subtree
        all_folders = self._folders.list_by_dataroom(link.dataroom_id)
        subtree_ids = {f.id for f in self._subtree_folders(link.folder_id, all_folders)}
        subtree_ids.add(link.folder_id)
        if folder_id is not None:
            if folder_id not in subtree_ids:
                return []
            return [f for f in all_files if f.folder_id == folder_id]
        return [f for f in all_files if f.folder_id in subtree_ids]

    def get_file(self, token: str, file_id: str) -> FileDTO:
        link = self._get_valid_link(token)
        file = self._files.get(file_id)
        if not file or file.dataroom_id != link.dataroom_id:
            raise ValueError("File not found")
        # If this is a file share link, only allow access to the linked file
        if link.file_id is not None and file.id != link.file_id:
            raise ValueError("File not found")
        return file

    # ------------------------------------------------------------------

    def _get_valid_link(self, token: str) -> ShareLinkDTO:
        link = self._shares.get(token)
        if not link:
            raise ValueError("Share link not found")
        if link.expires_at and link.expires_at <= datetime.now(timezone.utc):
            raise ValueError("Share link has expired")
        return link

    def _assert_role(self, dataroom_id: str, user_uid: str, allowed_roles: tuple) -> None:
        member = self._members.get(dataroom_id, user_uid)
        if not member or member.role not in allowed_roles:
            raise PermissionError("Insufficient permissions")

    def _subtree_folders(self, root_id: str, all_folders: list) -> list:
        result = []
        visited = set()
        queue = [root_id]
        while queue:
            current = queue.pop()
            for f in all_folders:
                if f.parent_id == current and f.id not in visited:
                    visited.add(f.id)
                    result.append(f)
                    queue.append(f.id)
        return result
