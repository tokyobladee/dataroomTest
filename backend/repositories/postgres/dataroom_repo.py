from sqlalchemy.orm import Session
from models.dataroom import Dataroom
from repositories.base import DataroomRepository, DataroomDTO


def _to_dto(row: Dataroom) -> DataroomDTO:
    return DataroomDTO(
        id=row.id,
        name=row.name,
        owner_uid=row.owner_uid,
        created_at=row.created_at,
    )


class PostgresDataroomRepository(DataroomRepository):
    def __init__(self, session: Session):
        self._db = session

    def list_for_user(self, user_uid: str) -> list[DataroomDTO]:
        from models.member import DataroomMember
        # User sees datarooms they own OR are a member of
        owned = self._db.query(Dataroom).filter_by(owner_uid=user_uid).all()
        member_ids = (
            self._db.query(DataroomMember.dataroom_id)
            .filter_by(user_uid=user_uid)
            .subquery()
        )
        member_rooms = (
            self._db.query(Dataroom)
            .filter(Dataroom.id.in_(member_ids))
            .filter(Dataroom.owner_uid != user_uid)
            .all()
        )
        return [_to_dto(r) for r in owned + member_rooms]

    def get(self, dataroom_id: str) -> DataroomDTO | None:
        row = self._db.get(Dataroom, dataroom_id)
        return _to_dto(row) if row else None

    def create(self, name: str, owner_uid: str) -> DataroomDTO:
        row = Dataroom(name=name, owner_uid=owner_uid)
        self._db.add(row)
        self._db.flush()
        return _to_dto(row)

    def rename(self, dataroom_id: str, name: str) -> DataroomDTO:
        row = self._db.get(Dataroom, dataroom_id)
        row.name = name
        self._db.flush()
        return _to_dto(row)

    def delete(self, dataroom_id: str) -> None:
        row = self._db.get(Dataroom, dataroom_id)
        if row:
            self._db.delete(row)
            self._db.flush()
