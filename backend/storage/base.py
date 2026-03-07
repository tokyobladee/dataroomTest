"""
Abstract storage backend — swap disk for S3/R2 by implementing this interface.
"""
from abc import ABC, abstractmethod


class StorageBackend(ABC):
    @abstractmethod
    def save(self, file_id: str, data: bytes) -> str:
        """Persist file bytes and return the storage path."""
        ...

    @abstractmethod
    def load(self, storage_path: str) -> bytes:
        """Return raw file bytes for the given storage path."""
        ...

    @abstractmethod
    def delete(self, storage_path: str) -> None:
        """Remove the file at storage_path."""
        ...
