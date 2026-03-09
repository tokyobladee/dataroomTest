from pathlib import Path
from .base import StorageBackend


class DiskStorage(StorageBackend):
    """
    Stores files on the local filesystem under base_path.
    Files are sharded into subdirectories by the first two chars of file_id
    to avoid very large flat directories.

    Layout: {base_path}/{file_id[:2]}/{file_id}
    """

    def __init__(self, base_path: str):
        self._base = Path(base_path)
        self._base.mkdir(parents=True, exist_ok=True)

    def save(self, file_id: str, data: bytes) -> str:
        path = self._base / file_id[:2] / file_id
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
        return str(path)

    def load(self, storage_path: str) -> bytes:
        return Path(storage_path).read_bytes()

    def delete(self, storage_path: str) -> None:
        Path(storage_path).unlink(missing_ok=True)
