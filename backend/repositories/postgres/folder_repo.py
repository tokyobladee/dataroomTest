from sqlalchemy.orm import Session
from models.folder import Folder
from repositories.base import FolderRepository, FolderDTO


def _to_dto(row: Folder) -> FolderDTO:
    return FolderDTO(
        id=row.id,
        dataroom_id=row.dataroom_id,
        parent_id=row.parent_id,
        name=row.name,
        created_by_uid=row.created_by_uid,
        created_at=row.created_at,
    )


class PostgresFolderRepository(FolderRepository):
    def __init__(self, session: Session):
        self._db = session

    def list_by_dataroom(self, dataroom_id: str) -> list[FolderDTO]:
        rows = self._db.query(Folder).filter_by(dataroom_id=dataroom_id).all()
        return [_to_dto(r) for r in rows]

    def get(self, folder_id: str) -> FolderDTO | None:
        row = self._db.get(Folder, folder_id)
        return _to_dto(row) if row else None

    def create(self, dataroom_id: str, parent_id: str | None, name: str, created_by_uid: str) -> FolderDTO:
        row = Folder(dataroom_id=dataroom_id, parent_id=parent_id, name=name, created_by_uid=created_by_uid)
        self._db.add(row)
        self._db.flush()
        return _to_dto(row)

    def move(self, folder_id: str, parent_id: str | None) -> FolderDTO:
        row = self._db.get(Folder, folder_id)
        row.parent_id = parent_id
        self._db.flush()
        return _to_dto(row)

    def rename(self, folder_id: str, name: str) -> FolderDTO:
        row = self._db.get(Folder, folder_id)
        row.name = name
        self._db.flush()
        return _to_dto(row)

    def delete(self, folder_id: str) -> None:
        row = self._db.get(Folder, folder_id)
        if row:
            self._db.delete(row)
            self._db.flush()
