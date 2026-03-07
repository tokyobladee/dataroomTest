"""
Abstract repository interfaces — the contracts that all DB implementations must satisfy.
Services depend only on these interfaces, never on concrete implementations.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime


# ---------------------------------------------------------------------------
# Data Transfer Objects (returned by all repositories)
# The service layer works with these plain dataclasses, not SQLAlchemy models.
# ---------------------------------------------------------------------------

@dataclass
class DataroomDTO:
    id: str
    name: str
    owner_uid: str
    created_at: datetime


@dataclass
class FolderDTO:
    id: str
    dataroom_id: str
    parent_id: str | None
    name: str
    created_by_uid: str
    created_at: datetime


@dataclass
class FileDTO:
    id: str
    dataroom_id: str
    folder_id: str | None
    name: str
    size: int
    mime_type: str
    storage_path: str
    uploaded_by_uid: str
    created_at: datetime


@dataclass
class MemberDTO:
    id: str
    dataroom_id: str
    user_uid: str
    role: str
    invited_at: datetime


@dataclass
class ShareLinkDTO:
    token: str
    dataroom_id: str
    folder_id: str | None
    permissions: str
    created_by_uid: str
    expires_at: datetime | None
    created_at: datetime


@dataclass
class DriveTokenDTO:
    user_uid: str
    refresh_token_encrypted: str
    access_token: str | None
    expires_at: datetime | None
    updated_at: datetime


# ---------------------------------------------------------------------------
# Repository interfaces
# ---------------------------------------------------------------------------

class DataroomRepository(ABC):
    @abstractmethod
    def list_for_user(self, user_uid: str) -> list[DataroomDTO]: ...

    @abstractmethod
    def get(self, dataroom_id: str) -> DataroomDTO | None: ...

    @abstractmethod
    def create(self, name: str, owner_uid: str) -> DataroomDTO: ...

    @abstractmethod
    def rename(self, dataroom_id: str, name: str) -> DataroomDTO: ...

    @abstractmethod
    def delete(self, dataroom_id: str) -> None: ...


class FolderRepository(ABC):
    @abstractmethod
    def list_by_dataroom(self, dataroom_id: str) -> list[FolderDTO]: ...

    @abstractmethod
    def get(self, folder_id: str) -> FolderDTO | None: ...

    @abstractmethod
    def create(self, dataroom_id: str, parent_id: str | None, name: str, created_by_uid: str) -> FolderDTO: ...

    @abstractmethod
    def rename(self, folder_id: str, name: str) -> FolderDTO: ...

    @abstractmethod
    def delete(self, folder_id: str) -> None: ...


class FileRepository(ABC):
    @abstractmethod
    def list_by_dataroom(self, dataroom_id: str, folder_id: str | None = None) -> list[FileDTO]: ...

    @abstractmethod
    def get(self, file_id: str) -> FileDTO | None: ...

    @abstractmethod
    def create(self, dataroom_id: str, folder_id: str | None, name: str,
               size: int, mime_type: str, storage_path: str, uploaded_by_uid: str) -> FileDTO: ...

    @abstractmethod
    def rename(self, file_id: str, name: str) -> FileDTO: ...

    @abstractmethod
    def move(self, file_id: str, folder_id: str | None) -> FileDTO: ...

    @abstractmethod
    def delete(self, file_id: str) -> None: ...


class MemberRepository(ABC):
    @abstractmethod
    def list_by_dataroom(self, dataroom_id: str) -> list[MemberDTO]: ...

    @abstractmethod
    def get(self, dataroom_id: str, user_uid: str) -> MemberDTO | None: ...

    @abstractmethod
    def add(self, dataroom_id: str, user_uid: str, role: str) -> MemberDTO: ...

    @abstractmethod
    def update_role(self, dataroom_id: str, user_uid: str, role: str) -> MemberDTO: ...

    @abstractmethod
    def remove(self, dataroom_id: str, user_uid: str) -> None: ...


class ShareLinkRepository(ABC):
    @abstractmethod
    def get(self, token: str) -> ShareLinkDTO | None: ...

    @abstractmethod
    def list_by_dataroom(self, dataroom_id: str) -> list[ShareLinkDTO]: ...

    @abstractmethod
    def create(self, dataroom_id: str, folder_id: str | None,
               permissions: str, created_by_uid: str,
               expires_at: datetime | None) -> ShareLinkDTO: ...

    @abstractmethod
    def delete(self, token: str) -> None: ...


class DriveTokenRepository(ABC):
    @abstractmethod
    def get(self, user_uid: str) -> DriveTokenDTO | None: ...

    @abstractmethod
    def upsert(self, user_uid: str, refresh_token_encrypted: str,
               access_token: str | None, expires_at: datetime | None) -> DriveTokenDTO: ...

    @abstractmethod
    def delete(self, user_uid: str) -> None: ...
