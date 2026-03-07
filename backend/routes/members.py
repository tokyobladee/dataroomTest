from flask import Blueprint, g, jsonify, request
from middleware.auth import require_auth

bp = Blueprint("members", __name__, url_prefix="/api/datarooms/<dataroom_id>/members")


@bp.route("", methods=["GET"])
@require_auth
def list_members(dataroom_id: str):
    from container import get_member_service
    svc = get_member_service()
    try:
        members = svc.list(dataroom_id, g.user_uid)
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    return jsonify([m.__dict__ for m in members])


@bp.route("", methods=["POST"])
@require_auth
def invite_member(dataroom_id: str):
    from container import get_member_service
    data = request.get_json(force=True)
    invitee_uid = (data.get("userUid") or "").strip()
    role = (data.get("role") or "viewer").strip()
    if not invitee_uid:
        return jsonify({"error": "userUid is required"}), 400
    svc = get_member_service()
    try:
        member = svc.invite(dataroom_id, invitee_uid, role, g.user_uid)
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    return jsonify(member.__dict__), 201


@bp.route("/<member_uid>", methods=["PATCH"])
@require_auth
def update_role(dataroom_id: str, member_uid: str):
    from container import get_member_service
    data = request.get_json(force=True)
    role = (data.get("role") or "").strip()
    if not role:
        return jsonify({"error": "role is required"}), 400
    svc = get_member_service()
    try:
        member = svc.change_role(dataroom_id, member_uid, role, g.user_uid)
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    return jsonify(member.__dict__)


@bp.route("/<member_uid>", methods=["DELETE"])
@require_auth
def remove_member(dataroom_id: str, member_uid: str):
    from container import get_member_service
    svc = get_member_service()
    try:
        svc.remove(dataroom_id, member_uid, g.user_uid)
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    return "", 204
