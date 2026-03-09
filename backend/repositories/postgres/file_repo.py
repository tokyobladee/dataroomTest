from sqlalchemy.orm import Session
from sqlalchemy import and_
from models.file import File
from repositories.base import FileRepository, FileDTO


def _to_dto(row: File) -> FileDTO:
    return FileDTO(
        id=row.id,
        dataroom_id=row.dataroom_id,
        folder_id=row.folder_id,
        name=row.name,
        size=row.size,
        mime_type=row.mime_type,
        storage_path=row.storage_path,
        uploaded_by_uid=row.uploaded_by_uid,
        created_at=row.created_at,
    )


class PostgresFileRepository(FileRepository):
    def __init__(self, session: Session):
        self._db = session

    def list_by_dataroom(self, dataroom_id: str, folder_id: str | None = None) -> list[FileDTO]:
        query = self._db.query(File).filter_by(dataroom_id=dataroom_id)
        if folder_id is not None:
            query = query.filter_by(folder_id=folder_id)
        return [_to_dto(r) for r in query.all()]

    def get(self, file_id: str) -> FileDTO | None:
        row = self._db.get(File, file_id)
        return _to_dto(row) if row else None

    def create(self, dataroom_id: str, folder_id: str | None, name: str,
               size: int, mime_type: str, storage_path: str, uploaded_by_uid: str) -> FileDTO:
        row = File(
            dataroom_id=dataroom_id,
            folder_id=folder_id,
            name=name,
            size=size,
            mime_type=mime_type,
            storage_path=storage_path,
            uploaded_by_uid=uploaded_by_uid,
        )
        self._db.add(row)
        self._db.flush()
        return _to_dto(row)

    def rename(self, file_id: str, name: str) -> FileDTO:
        row = self._db.get(File, file_id)
        row.name = name
        self._db.flush()
        return _to_dto(row)

    def move(self, file_id: str, folder_id: str | None) -> FileDTO:
        row = self._db.get(File, file_id)
        row.folder_id = folder_id
        self._db.flush()
        return _to_dto(row)

    def delete(self, file_id: str) -> None:
        row = self._db.get(File, file_id)
        if row:
            self._db.delete(row)
            self._db.flush()
