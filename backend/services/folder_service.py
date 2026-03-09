from repositories.base import FolderRepository, MemberRepository, FolderDTO


class FolderService:
    def __init__(self, folder_repo: FolderRepository, member_repo: MemberRepository):
        self._folders = folder_repo
        self._members = member_repo

    def list(self, dataroom_id: str, user_uid: str) -> list[FolderDTO]:
        self._assert_access(dataroom_id, user_uid)
        return self._folders.list_by_dataroom(dataroom_id)

    def create(self, dataroom_id: str, parent_id: str | None, name: str, user_uid: str) -> FolderDTO:
        if not name.strip():
            raise ValueError("Name is required")
        self._assert_role(dataroom_id, user_uid, ("owner", "editor"))

        siblings = self._folders.list_by_dataroom(dataroom_id)
        if any(f.name == name.strip() and f.parent_id == parent_id for f in siblings):
            raise ValueError("A folder with that name already exists here")

        return self._folders.create(dataroom_id, parent_id, name.strip(), user_uid)

    def move(self, dataroom_id: str, folder_id: str, parent_id: str | None, user_uid: str) -> FolderDTO:
        self._assert_role(dataroom_id, user_uid, ("owner", "editor"))
        folder = self._folders.get(folder_id)
        if not folder or folder.dataroom_id != dataroom_id:
            raise ValueError("Folder not found")
        return self._folders.move(folder_id, parent_id)

    def rename(self, dataroom_id: str, folder_id: str, name: str, user_uid: str) -> FolderDTO:
        if not name.strip():
            raise ValueError("Name is required")
        self._assert_role(dataroom_id, user_uid, ("owner", "editor"))

        folder = self._folders.get(folder_id)
        if not folder or folder.dataroom_id != dataroom_id:
            raise ValueError("Folder not found")

        siblings = self._folders.list_by_dataroom(dataroom_id)
        if any(f.name == name.strip() and f.parent_id == folder.parent_id and f.id != folder_id for f in siblings):
            raise ValueError("A folder with that name already exists here")

        return self._folders.rename(folder_id, name.strip())

    def delete(self, dataroom_id: str, folder_id: str, user_uid: str) -> None:
        self._assert_role(dataroom_id, user_uid, ("owner", "editor"))
        folder = self._folders.get(folder_id)
        if not folder or folder.dataroom_id != dataroom_id:
            raise ValueError("Folder not found")
        self._folders.delete(folder_id)

    def _assert_access(self, dataroom_id: str, user_uid: str) -> None:
        if not self._members.get(dataroom_id, user_uid):
            raise PermissionError("Access denied")

    def _assert_role(self, dataroom_id: str, user_uid: str, allowed_roles: tuple) -> None:
        member = self._members.get(dataroom_id, user_uid)
        if not member or member.role not in allowed_roles:
            raise PermissionError("Insufficient permissions")
