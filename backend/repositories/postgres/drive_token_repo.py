from datetime import datetime
from sqlalchemy.orm import Session
from models.drive_token import DriveToken
from repositories.base import DriveTokenRepository, DriveTokenDTO


def _to_dto(row: DriveToken) -> DriveTokenDTO:
    return DriveTokenDTO(
        user_uid=row.user_uid,
        refresh_token_encrypted=row.refresh_token_encrypted,
        access_token=row.access_token,
        expires_at=row.expires_at,
        updated_at=row.updated_at,
    )


class PostgresDriveTokenRepository(DriveTokenRepository):
    def __init__(self, session: Session):
        self._db = session

    def get(self, user_uid: str) -> DriveTokenDTO | None:
        row = self._db.get(DriveToken, user_uid)
        return _to_dto(row) if row else None

    def upsert(self, user_uid: str, refresh_token_encrypted: str,
               access_token: str | None, expires_at: datetime | None) -> DriveTokenDTO:
        row = self._db.get(DriveToken, user_uid)
        if row:
            row.refresh_token_encrypted = refresh_token_encrypted
            row.access_token = access_token
            row.expires_at = expires_at
        else:
            row = DriveToken(
                user_uid=user_uid,
                refresh_token_encrypted=refresh_token_encrypted,
                access_token=access_token,
                expires_at=expires_at,
            )
            self._db.add(row)
        self._db.flush()
        return _to_dto(row)

    def delete(self, user_uid: str) -> None:
        row = self._db.get(DriveToken, user_uid)
        if row:
            self._db.delete(row)
            self._db.flush()
