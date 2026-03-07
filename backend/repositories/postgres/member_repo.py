from sqlalchemy.orm import Session
from models.member import DataroomMember
from repositories.base import MemberRepository, MemberDTO


def _to_dto(row: DataroomMember) -> MemberDTO:
    return MemberDTO(
        id=row.id,
        dataroom_id=row.dataroom_id,
        user_uid=row.user_uid,
        role=row.role,
        invited_at=row.invited_at,
    )


class PostgresMemberRepository(MemberRepository):
    def __init__(self, session: Session):
        self._db = session

    def list_by_dataroom(self, dataroom_id: str) -> list[MemberDTO]:
        rows = self._db.query(DataroomMember).filter_by(dataroom_id=dataroom_id).all()
        return [_to_dto(r) for r in rows]

    def get(self, dataroom_id: str, user_uid: str) -> MemberDTO | None:
        row = (
            self._db.query(DataroomMember)
            .filter_by(dataroom_id=dataroom_id, user_uid=user_uid)
            .first()
        )
        return _to_dto(row) if row else None

    def add(self, dataroom_id: str, user_uid: str, role: str) -> MemberDTO:
        row = DataroomMember(dataroom_id=dataroom_id, user_uid=user_uid, role=role)
        self._db.add(row)
        self._db.flush()
        return _to_dto(row)

    def update_role(self, dataroom_id: str, user_uid: str, role: str) -> MemberDTO:
        row = (
            self._db.query(DataroomMember)
            .filter_by(dataroom_id=dataroom_id, user_uid=user_uid)
            .first()
        )
        row.role = role
        self._db.flush()
        return _to_dto(row)

    def remove(self, dataroom_id: str, user_uid: str) -> None:
        row = (
            self._db.query(DataroomMember)
            .filter_by(dataroom_id=dataroom_id, user_uid=user_uid)
            .first()
        )
        if row:
            self._db.delete(row)
            self._db.flush()
