from urllib.parse import urlencode
from flask import Blueprint, g, jsonify, redirect, request, current_app
from middleware.auth import require_auth
from extensions import limiter

bp = Blueprint("drive", __name__, url_prefix="/api/drive")


@bp.route("/auth-url", methods=["GET"])
@require_auth
def auth_url():
    """Return the Google OAuth URL the frontend should redirect to."""
    from container import get_drive_service
    svc = get_drive_service()
    url = svc.get_authorization_url(g.user_uid)
    return jsonify({"url": url})


@bp.route("/callback", methods=["GET"])
def oauth_callback():
    """Exchange the authorization code for tokens, then redirect to the
    frontend /drive/callback page (same origin) so it can use postMessage.

    No Firebase auth here — we trust `state` (= user_uid) because it was
    set by us and is bound to the one-time authorization code.
    """
    from extensions import db
    from container import get_drive_service
    frontend = current_app.config.get("FRONTEND_URL", "http://localhost:5173")
    code = request.args.get("code")
    state = request.args.get("state")  # base64-JSON {uid, cv} set by get_authorization_url
    if not code or not state:
        return redirect(f"{frontend}/drive/callback?error=missing+params")
    svc = get_drive_service()
    try:
        svc.handle_callback(state, code)
        # Commit immediately — teardown runs AFTER the response bytes are sent,
        # so without this the token would not be in the DB when the frontend
        # fires its next request right after receiving the redirect.
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        params = urlencode({"error": str(e)})
        return redirect(f"{frontend}/drive/callback?{params}")
    return redirect(f"{frontend}/drive/callback?connected=1")


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
@limiter.limit("30 per minute")
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
