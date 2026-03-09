from flask import Blueprint, g, jsonify, request
from firebase_admin import auth as firebase_auth
from middleware.auth import require_auth

bp = Blueprint("members", __name__, url_prefix="/api/datarooms/<dataroom_id>/members")


def _enrich_members(members):
    """Add email and display_name from Firebase to each member dict."""
    if not members:
        return []
    uids = [m.user_uid for m in members]
    fb_map: dict[str, firebase_auth.UserRecord] = {}
    try:
        for result in firebase_auth.get_users([firebase_auth.UidIdentifier(uid) for uid in uids]).users:
            fb_map[result.uid] = result
    except Exception:
        pass
    out = []
    for m in members:
        d = m.__dict__.copy()
        fb_user = fb_map.get(m.user_uid)
        d["email"] = fb_user.email if fb_user else None
        d["display_name"] = fb_user.display_name if fb_user else None
        out.append(d)
    return out


@bp.route("", methods=["GET"])
@require_auth
def list_members(dataroom_id: str):
    from container import get_member_service
    svc = get_member_service()
    try:
        members = svc.list(dataroom_id, g.user_uid)
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    return jsonify(_enrich_members(members))


@bp.route("", methods=["POST"])
@require_auth
def invite_member(dataroom_id: str):
    from container import get_member_service
    data = request.get_json(force=True)
    email = (data.get("email") or "").strip()
    role = (data.get("role") or "viewer").strip()
    if not email:
        return jsonify({"error": "email is required"}), 400
    try:
        fb_user = firebase_auth.get_user_by_email(email)
        invitee_uid = fb_user.uid
    except firebase_auth.UserNotFoundError:
        return jsonify({"error": f"No user found with email {email}"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    svc = get_member_service()
    try:
        member = svc.invite(dataroom_id, invitee_uid, role, g.user_uid)
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    d = member.__dict__.copy()
    d["email"] = fb_user.email
    d["display_name"] = fb_user.display_name
    return jsonify(d), 201


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
        member = svc.update_role(dataroom_id, member_uid, role, g.user_uid)
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
