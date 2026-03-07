from flask import Blueprint, g, jsonify, request
from middleware.auth import require_auth

bp = Blueprint("drive", __name__, url_prefix="/api/drive")


@bp.route("/auth-url", methods=["GET"])
@require_auth
def auth_url():
    """Return the Google OAuth URL the frontend should redirect to."""
    from container import get_drive_service
    svc = get_drive_service()
    url = svc.get_authorization_url(state=g.user_uid)
    return jsonify({"url": url})


@bp.route("/callback", methods=["GET"])
@require_auth
def oauth_callback():
    """Exchange the authorization code for tokens and store them."""
    from container import get_drive_service
    code = request.args.get("code")
    if not code:
        return jsonify({"error": "code is required"}), 400
    svc = get_drive_service()
    try:
        svc.handle_callback(g.user_uid, code)
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    return jsonify({"ok": True})


@bp.route("/files", methods=["GET"])
@require_auth
def list_drive_files():
    """List files in the user's Google Drive (supports pagination)."""
    from container import get_drive_service
    page_token = request.args.get("pageToken") or None
    svc = get_drive_service()
    try:
        result = svc.list_drive_files(g.user_uid, page_token)
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    return jsonify(result)


@bp.route("/import", methods=["POST"])
@require_auth
def import_file():
    """Copy a Drive file into a dataroom folder."""
    from container import get_drive_service
    data = request.get_json(force=True)
    drive_file_id = (data.get("driveFileId") or "").strip()
    dataroom_id = (data.get("dataroomId") or "").strip()
    folder_id = data.get("folderId") or None
    if not drive_file_id or not dataroom_id:
        return jsonify({"error": "driveFileId and dataroomId are required"}), 400
    svc = get_drive_service()
    try:
        file_dto = svc.import_file(dataroom_id, folder_id, drive_file_id, g.user_uid)
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    return jsonify(file_dto.__dict__), 201


@bp.route("/disconnect", methods=["DELETE"])
@require_auth
def disconnect():
    """Remove stored Drive tokens for this user."""
    from container import get_drive_service
    svc = get_drive_service()
    svc.disconnect(g.user_uid)
    return "", 204
