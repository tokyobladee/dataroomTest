from datetime import datetime
from sqlalchemy.orm import Session
from models.share_link import ShareLink
from repositories.base import ShareLinkRepository, ShareLinkDTO


def _to_dto(row: ShareLink) -> ShareLinkDTO:
    return ShareLinkDTO(
        token=row.token,
        dataroom_id=row.dataroom_id,
        folder_id=row.folder_id,
        file_id=row.file_id,
        permissions=row.permissions,
        created_by_uid=row.created_by_uid,
        expires_at=row.expires_at,
        created_at=row.created_at,
    )


class PostgresShareLinkRepository(ShareLinkRepository):
    def __init__(self, session: Session):
        self._db = session

    def get(self, token: str) -> ShareLinkDTO | None:
        row = self._db.get(ShareLink, token)
        return _to_dto(row) if row else None

    def list_by_dataroom(self, dataroom_id: str) -> list[ShareLinkDTO]:
        rows = self._db.query(ShareLink).filter_by(dataroom_id=dataroom_id).all()
        return [_to_dto(r) for r in rows]

    def create(self, dataroom_id: str, folder_id: str | None, file_id: str | None,
               permissions: str, created_by_uid: str,
               expires_at: datetime | None) -> ShareLinkDTO:
        row = ShareLink(
            dataroom_id=dataroom_id,
            folder_id=folder_id,
            file_id=file_id,
            permissions=permissions,
            created_by_uid=created_by_uid,
            expires_at=expires_at,
        )
        self._db.add(row)
        self._db.flush()
        return _to_dto(row)

    def delete(self, token: str) -> None:
        row = self._db.get(ShareLink, token)
        if row:
            self._db.delete(row)
            self._db.flush()
