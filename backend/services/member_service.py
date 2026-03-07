from repositories.base import MemberRepository, MemberDTO


class MemberService:
    def __init__(self, member_repo: MemberRepository):
        self._members = member_repo

    def list(self, dataroom_id: str, user_uid: str) -> list[MemberDTO]:
        self._assert_access(dataroom_id, user_uid)
        return self._members.list_by_dataroom(dataroom_id)

    def invite(self, dataroom_id: str, invitee_uid: str, role: str, user_uid: str) -> MemberDTO:
        self._assert_role(dataroom_id, user_uid, ("owner",))
        if role not in ("editor", "viewer"):
            raise ValueError("Role must be 'editor' or 'viewer'")
        existing = self._members.get(dataroom_id, invitee_uid)
        if existing:
            raise ValueError("User is already a member")
        return self._members.add(dataroom_id, invitee_uid, role)

    def update_role(self, dataroom_id: str, target_uid: str, role: str, user_uid: str) -> MemberDTO:
        self._assert_role(dataroom_id, user_uid, ("owner",))
        if target_uid == user_uid:
            raise ValueError("Cannot change your own role")
        if role not in ("editor", "viewer"):
            raise ValueError("Role must be 'editor' or 'viewer'")
        return self._members.update_role(dataroom_id, target_uid, role)

    def remove(self, dataroom_id: str, target_uid: str, user_uid: str) -> None:
        self._assert_role(dataroom_id, user_uid, ("owner",))
        if target_uid == user_uid:
            raise ValueError("Cannot remove yourself")
        self._members.remove(dataroom_id, target_uid)

    def _assert_access(self, dataroom_id: str, user_uid: str) -> None:
        if not self._members.get(dataroom_id, user_uid):
            raise PermissionError("Access denied")

    def _assert_role(self, dataroom_id: str, user_uid: str, allowed_roles: tuple) -> None:
        member = self._members.get(dataroom_id, user_uid)
        if not member or member.role not in allowed_roles:
            raise PermissionError("Insufficient permissions")
