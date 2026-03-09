from repositories.base import DataroomRepository, MemberRepository, DataroomDTO


class DataroomService:
    def __init__(self, dataroom_repo: DataroomRepository, member_repo: MemberRepository):
        self._datarooms = dataroom_repo
        self._members = member_repo

    def list_for_user(self, user_uid: str) -> list[DataroomDTO]:
        return self._datarooms.list_for_user(user_uid)

    def get(self, dataroom_id: str, user_uid: str) -> DataroomDTO:
        dataroom = self._datarooms.get(dataroom_id)
        if not dataroom:
            raise ValueError("Dataroom not found")
        self._assert_access(dataroom_id, user_uid)
        return dataroom

    def create(self, name: str, owner_uid: str) -> DataroomDTO:
        if not name.strip():
            raise ValueError("Name is required")
        dataroom = self._datarooms.create(name=name.strip(), owner_uid=owner_uid)
        # Owner is also recorded as a member for uniform permission queries
        self._members.add(dataroom.id, owner_uid, role="owner")
        return dataroom

    def rename(self, dataroom_id: str, name: str, user_uid: str) -> DataroomDTO:
        if not name.strip():
            raise ValueError("Name is required")
        self._assert_role(dataroom_id, user_uid, ("owner",))
        return self._datarooms.rename(dataroom_id, name.strip())

    def delete(self, dataroom_id: str, user_uid: str) -> None:
        self._assert_role(dataroom_id, user_uid, ("owner",))
        self._datarooms.delete(dataroom_id)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _assert_access(self, dataroom_id: str, user_uid: str) -> None:
        """Raise if user has no membership at all."""
        member = self._members.get(dataroom_id, user_uid)
        if not member:
            raise PermissionError("Access denied")

    def _assert_role(self, dataroom_id: str, user_uid: str, allowed_roles: tuple) -> None:
        member = self._members.get(dataroom_id, user_uid)
        if not member or member.role not in allowed_roles:
            raise PermissionError("Insufficient permissions")
