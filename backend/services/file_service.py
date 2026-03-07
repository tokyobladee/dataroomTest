from repositories.base import FileRepository, MemberRepository, FileDTO
from storage.base import StorageBackend


class FileService:
    def __init__(self, file_repo: FileRepository, member_repo: MemberRepository, storage: StorageBackend):
        self._files = file_repo
        self._members = member_repo
        self._storage = storage

    def list(self, dataroom_id: str, user_uid: str, folder_id: str | None = None) -> list[FileDTO]:
        self._assert_access(dataroom_id, user_uid)
        return self._files.list_by_dataroom(dataroom_id, folder_id)

    def upload(self, dataroom_id: str, folder_id: str | None, name: str,
               data: bytes, mime_type: str, user_uid: str) -> FileDTO:
        self._assert_role(dataroom_id, user_uid, ("owner", "editor"))

        # Generate a temporary id to derive the storage path before DB insert
        import uuid
        file_id = str(uuid.uuid4())
        storage_path = self._storage.save(file_id, data)

        return self._files.create(
            dataroom_id=dataroom_id,
            folder_id=folder_id,
            name=name,
            size=len(data),
            mime_type=mime_type,
            storage_path=storage_path,
            uploaded_by_uid=user_uid,
        )

    def get_content(self, dataroom_id: str, file_id: str, user_uid: str) -> tuple[bytes, str]:
        """Returns (file_bytes, mime_type)."""
        self._assert_access(dataroom_id, user_uid)
        file = self._files.get(file_id)
        if not file or file.dataroom_id != dataroom_id:
            raise ValueError("File not found")
        data = self._storage.load(file.storage_path)
        return data, file.mime_type

    def rename(self, dataroom_id: str, file_id: str, name: str, user_uid: str) -> FileDTO:
        if not name.strip():
            raise ValueError("Name is required")
        self._assert_role(dataroom_id, user_uid, ("owner", "editor"))
        file = self._files.get(file_id)
        if not file or file.dataroom_id != dataroom_id:
            raise ValueError("File not found")
        return self._files.rename(file_id, name.strip())

    def move(self, dataroom_id: str, file_id: str, folder_id: str | None, user_uid: str) -> FileDTO:
        self._assert_role(dataroom_id, user_uid, ("owner", "editor"))
        file = self._files.get(file_id)
        if not file or file.dataroom_id != dataroom_id:
            raise ValueError("File not found")
        return self._files.move(file_id, folder_id)

    def delete(self, dataroom_id: str, file_id: str, user_uid: str) -> None:
        self._assert_role(dataroom_id, user_uid, ("owner", "editor"))
        file = self._files.get(file_id)
        if not file or file.dataroom_id != dataroom_id:
            raise ValueError("File not found")
        self._storage.delete(file.storage_path)
        self._files.delete(file_id)

    def _assert_access(self, dataroom_id: str, user_uid: str) -> None:
        if not self._members.get(dataroom_id, user_uid):
            raise PermissionError("Access denied")

    def _assert_role(self, dataroom_id: str, user_uid: str, allowed_roles: tuple) -> None:
        member = self._members.get(dataroom_id, user_uid)
        if not member or member.role not in allowed_roles:
            raise PermissionError("Insufficient permissions")
