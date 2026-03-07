from datetime import datetime, timezone
from flask import Blueprint, g, jsonify, request
from middleware.auth import require_auth

bp = Blueprint("share", __name__)


# ------------------------------------------------------------------
# Authenticated: manage share links for a dataroom
# ------------------------------------------------------------------

@bp.route("/api/datarooms/<dataroom_id>/share-links", methods=["GET"])
@require_auth
def list_links(dataroom_id: str):
    from container import get_share_service
    svc = get_share_service()
    try:
        links = svc.list_links(dataroom_id, g.user_uid)
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    return jsonify([_link_dict(l) for l in links])


@bp.route("/api/datarooms/<dataroom_id>/share-links", methods=["POST"])
@require_auth
def create_link(dataroom_id: str):
    from container import get_share_service
    data = request.get_json(force=True)
    folder_id = data.get("folderId") or None
    permissions = data.get("permissions", "viewer")
    expires_at = None
    if data.get("expiresAt"):
        expires_at = datetime.fromisoformat(data["expiresAt"]).replace(tzinfo=timezone.utc)
    svc = get_share_service()
    try:
        link = svc.create(dataroom_id, folder_id, permissions, g.user_uid, expires_at)
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    return jsonify(_link_dict(link)), 201


@bp.route("/api/share-links/<token>", methods=["DELETE"])
@require_auth
def revoke_link(token: str):
    from container import get_share_service
    svc = get_share_service()
    try:
        svc.revoke(token, g.user_uid)
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    return "", 204


# ------------------------------------------------------------------
# Public: access dataroom contents via share link (no auth)
# ------------------------------------------------------------------

@bp.route("/api/s/<token>", methods=["GET"])
def share_info(token: str):
    from container import get_share_service
    svc = get_share_service()
    try:
        link = svc.get_link_info(token)
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    return jsonify(_link_dict(link))


@bp.route("/api/s/<token>/folders", methods=["GET"])
def share_folders(token: str):
    from container import get_share_service
    svc = get_share_service()
    try:
        folders = svc.list_folders(token)
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    return jsonify([f.__dict__ for f in folders])


@bp.route("/api/s/<token>/files", methods=["GET"])
def share_files(token: str):
    from container import get_share_service
    folder_id = request.args.get("folderId") or None
    svc = get_share_service()
    try:
        files = svc.list_files(token, folder_id)
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    return jsonify([f.__dict__ for f in files])


@bp.route("/api/s/<token>/files/<file_id>", methods=["GET"])
def share_download(token: str, file_id: str):
    import io
    from flask import send_file
    from container import get_share_service, _storage
    share_svc = get_share_service()
    try:
        file_dto = share_svc.get_file(token, file_id)
        data = _storage().load(file_dto.storage_path)
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    return send_file(
        io.BytesIO(data),
        mimetype=file_dto.mime_type or "application/octet-stream",
        as_attachment=False,
        download_name=file_dto.name,
    )


def _link_dict(link) -> dict:
    d = link.__dict__.copy()
    if d.get("expires_at"):
        d["expires_at"] = d["expires_at"].isoformat()
    if d.get("created_at"):
        d["created_at"] = d["created_at"].isoformat()
    return d
